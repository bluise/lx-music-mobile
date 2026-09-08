import playerState from '@/store/player/state'
import { addDownload } from '@/core/download'
import { toast } from '@/utils/tools'
import Btn from './Btn'


export default () => {
  const handleDownload = () => {
    const musicInfo = playerState.playMusicInfo.musicInfo
    if (!musicInfo) return
    // 仅在线音乐可下载
    if ('progress' in musicInfo) {
      toast(global.i18n.t('download_task_exists'))
      return
    }
    if (musicInfo.source == 'local') {
      toast(global.i18n.t('download_task_exists'))
      return
    }
    void addDownload(musicInfo)
  }

  return <Btn icon="download-2" onPress={handleDownload} />
}
