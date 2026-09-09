import downloadAction from '@/store/download/action'
import downloadState from '@/store/download/state'
import { getMusicUrl } from './music'
import { downloadFile, stopDownload, unlink, existsFile } from '@/utils/fs'
import { getDownloadFilePath, qualityToExt } from '@/utils/download'
import { getData, saveData } from '@/plugins/storage'
import { storageDataPrefix } from '@/config/constant'
import { getPlayQuality } from './music/utils'
import settingState from '@/store/setting/state'
import { checkStoragePermissions, requestStoragePermission, toast } from '@/utils/tools'

const DOWNLOAD_LIST_KEY = storageDataPrefix.list + 'download'
const MAX_CONCURRENT = 2

interface RunningTask {
  jobId: number
  promise: Promise<any>
}

const runningTasks = new Map<string, RunningTask>()
let isRestoring = false

/**
 * 持久化下载列表
 */
const saveDownloadList = () => {
  void saveData(DOWNLOAD_LIST_KEY, downloadState.list)
}

/**
 * 从存储加载下载列表
 */
export const loadDownloadList = async() => {
  if (isRestoring) return
  isRestoring = true
  try {
    const list = await getData<LX.Download.ListItem[]>(DOWNLOAD_LIST_KEY) ?? []
    // 将未完成的任务状态重置为 waiting（应用重启后无法恢复 RNFS 下载任务）
    for (const item of list) {
      if (item.status == 'run') item.status = 'waiting'
    }
    downloadAction.setList(list)
  } finally {
    // eslint-disable-next-line require-atomic-updates
    isRestoring = false
  }
}

/**
 * 启动下一个等待中的下载任务
 */
const startNext = () => {
  if (runningTasks.size >= MAX_CONCURRENT) return
  const waiting = downloadState.list.find(item => item.status == 'waiting')
  if (!waiting) return
  void runTask(waiting.id)
}

/**
 * 执行单个下载任务
 */
const runTask = async(id: string) => {
  const task = downloadState.list.find(item => item.id == id)
  if (!task || task.status != 'waiting') return

  if (runningTasks.size >= MAX_CONCURRENT) return

  downloadAction.updateTask(id, { status: 'run', statusText: global.i18n.t('download_getting_url') })

  let url: string
  try {
    url = await getMusicUrl({
      musicInfo: task.metadata.musicInfo,
      quality: task.metadata.quality,
      isRefresh: false,
    })
  } catch (err: any) {
    downloadAction.updateTask(id, {
      status: 'error',
      statusText: err?.message ?? global.i18n.t('download_get_url_failed'),
    })
    saveDownloadList()
    startNext()
    return
  }

  downloadAction.updateMetadata(id, { url })
  downloadAction.updateTask(id, { statusText: global.i18n.t('download_downloading') })

  let filePath = task.metadata.filePath
  if (!filePath || !await existsFile(filePath)) {
    filePath = await getDownloadFilePath(task.metadata.musicInfo, task.metadata.quality)
    downloadAction.updateMetadata(id, { filePath })
  }

  const job = downloadFile(url, filePath, {
    progress: (res) => {
      const cur = downloadState.list.find(item => item.id == id)
      if (!cur) return
      const total = res.contentLength || cur.total || 0
      const downloaded = res.bytesWritten
      const progress = total ? downloaded / total : 0
      downloadAction.updateTask(id, {
        downloaded,
        total,
        progress,
        speed: formatSpeed(res.bytesWritten - (cur.downloaded || 0)),
      })
    },
    progressInterval: 500,
  })

  runningTasks.set(id, { jobId: job.jobId, promise: job.promise })

  try {
    const result = await job.promise
    if (result.statusCode == 200) {
      downloadAction.updateTask(id, {
        isComplate: true,
        status: 'completed',
        statusText: global.i18n.t('download_completed'),
        progress: 1,
      })
      toast(`${task.metadata.musicInfo.name} ${global.i18n.t('download_completed')}`)
    } else {
      downloadAction.updateTask(id, {
        status: 'error',
        statusText: `${global.i18n.t('download_failed')} (${result.statusCode})`,
      })
    }
  } catch (err: any) {
    const cur = downloadState.list.find(item => item.id == id)
    if (cur?.status == 'pause') return // 主动暂停，不算错误
    downloadAction.updateTask(id, {
      status: 'error',
      statusText: err?.message ?? global.i18n.t('download_failed'),
    })
  } finally {
    runningTasks.delete(id)
    saveDownloadList()
    startNext()
  }
}

/**
 * 格式化下载速度
 */
const formatSpeed = (bytes: number): string => {
  if (bytes <= 0) return '0 B/s'
  if (bytes < 1024) return `${bytes.toFixed(0)} B/s`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB/s`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB/s`
}

/**
 * 添加下载任务
 */
export const addDownload = async(musicInfo: LX.Music.MusicInfoOnline, quality?: LX.Quality): Promise<void> => {
  // 权限前置检查：没权限就弹系统弹窗/跳转设置页
  if (!(await checkStoragePermissions())) {
    const granted = await requestStoragePermission()
    if (granted !== true) {
      toast(global.i18n.t('download_no_permission'))
      return
    }
  }

  // 检查是否已存在相同任务
  const exist = downloadState.list.find(
    item => item.metadata.musicInfo.id == musicInfo.id && !item.isComplate,
  )
  if (exist) {
    toast(global.i18n.t('download_task_exists'))
    return
  }

  const targetQuality = quality ?? getPlayQuality(settingState.setting['player.playQuality'], musicInfo)
  const ext = qualityToExt(targetQuality)
  const id = `download_${musicInfo.id}_${Date.now()}`

  const task: LX.Download.ListItem = {
    id,
    isComplate: false,
    status: 'waiting',
    statusText: '',
    downloaded: 0,
    total: 0,
    progress: 0,
    speed: '',
    metadata: {
      musicInfo,
      url: null,
      quality: targetQuality,
      ext,
      fileName: '',
      filePath: '',
    },
  }

  downloadAction.addTask(task)
  saveDownloadList()
  startNext()
}

/**
 * 批量添加下载任务
 */
export const addDownloads = (musicInfos: LX.Music.MusicInfoOnline[], quality?: LX.Quality) => {
  for (const info of musicInfos) {
    void addDownload(info, quality)
  }
}

/**
 * 暂停下载任务
 */
export const pauseDownload = (id: string) => {
  const running = runningTasks.get(id)
  if (running) {
    stopDownload(running.jobId)
  }
  downloadAction.updateTask(id, { status: 'pause', statusText: global.i18n.t('download_paused') })
  saveDownloadList()
}

/**
 * 恢复下载任务
 */
export const resumeDownload = (id: string) => {
  const task = downloadState.list.find(item => item.id == id)
  if (!task || task.isComplate) return
  downloadAction.updateTask(id, { status: 'waiting', statusText: '' })
  startNext()
}

/**
 * 取消并删除下载任务
 */
export const removeDownload = async(id: string, deleteFile = true) => {
  const running = runningTasks.get(id)
  if (running) {
    stopDownload(running.jobId)
    runningTasks.delete(id)
  }
  const task = downloadState.list.find(item => item.id == id)
  if (task && deleteFile && task.metadata.filePath) {
    if (await existsFile(task.metadata.filePath)) {
      void unlink(task.metadata.filePath).catch(() => {})
    }
  }
  downloadAction.removeTask(id)
  saveDownloadList()
  startNext()
}

/**
 * 重试失败的下载任务
 */
export const retryDownload = (id: string) => {
  const task = downloadState.list.find(item => item.id == id)
  if (!task) return
  downloadAction.updateTask(id, {
    status: 'waiting',
    statusText: '',
    downloaded: 0,
    progress: 0,
  })
  startNext()
}

/**
 * 清除已完成的下载任务
 */
export const clearCompletedDownloads = () => {
  downloadAction.clearCompleted()
  saveDownloadList()
}
