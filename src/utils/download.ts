import RNFS from 'react-native-fs'
import { extname, mkdir, existsFile } from './fs'
import settingState from '@/store/setting/state'

/**
 * 音质对应的文件扩展名
 */
export const qualityToExt = (quality: LX.Quality): LX.Download.FileExt => {
  switch (quality) {
    case 'flac':
    case 'flac24bit':
      return 'flac'
    case 'ape':
      return 'ape'
    case 'wav':
      return 'wav'
    default:
      return 'mp3'
  }
}

/**
 * 获取下载保存目录
 * 默认使用设备公共存储目录下的 Music/lx-music 文件夹，用户可在文件管理器中找到
 */
export const getDownloadDir = async(): Promise<string> => {
  const dir = `${RNFS.ExternalStorageDirectoryPath}/Music/lx-music`
  if (!await existsFile(dir)) {
    await mkdir(dir)
  }
  return dir
}

/**
 * 清理文件名中的非法字符
 */
const sanitizeFileName = (name: string): string => {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim()
}

/**
 * 根据命名规则生成文件名（不含扩展名）
 */
export const buildFileName = (musicInfo: LX.Music.MusicInfoOnline, quality: LX.Quality): string => {
  const nameType = settingState.setting['download.fileName']
  let name: string
  switch (nameType) {
    case '歌手 - 歌名':
      name = `${musicInfo.singer} - ${musicInfo.name}`
      break
    case '歌名':
      name = musicInfo.name
      break
    case '歌名 - 歌手':
    default:
      name = `${musicInfo.name} - ${musicInfo.singer}`
      break
  }
  return sanitizeFileName(name)
}

/**
 * 生成完整下载文件路径
 */
export const getDownloadFilePath = async(musicInfo: LX.Music.MusicInfoOnline, quality: LX.Quality): Promise<string> => {
  const dir = await getDownloadDir()
  const ext = qualityToExt(quality)
  const fileName = buildFileName(musicInfo, quality)
  let filePath = `${dir}/${fileName}.${ext}`

  // 若文件已存在，追加序号避免覆盖
  if (await existsFile(filePath)) {
    let index = 1
    while (await existsFile(`${dir}/${fileName}(${index}).${ext}`)) {
      index++
    }
    filePath = `${dir}/${fileName}(${index}).${ext}`
  }
  return filePath
}

/**
 * 从文件路径获取扩展名
 */
export const getExtFromPath = (path: string): string => extname(path)
