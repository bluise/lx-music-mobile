import { useEffect, useCallback } from 'react'
import { useHorizontalMode } from '@/utils/hooks'
import PageContent from '@/components/PageContent'
import { setComponentId, setNavActiveId } from '@/core/common'
import { COMPONENT_IDS } from '@/config/constant'
import Vertical from './Vertical'
import Horizontal from './Horizontal'
import { navigations } from '@/navigation'
import settingState from '@/store/setting/state'
import { useBackHandler } from '@/utils/hooks/useBackHandler'
import commonState from '@/store/common/state'


interface Props {
  componentId: string
}


export default ({ componentId }: Props) => {
  const isHorizontalMode = useHorizontalMode()

  // 当导航栈已到根（只有 Home）且不在歌单页/设置页时，按返回跳转到歌单页
  // 注意：JS BackHandler 会在 RNN navigator.handleBack() 之前被调！
  // 所以必须用 componentIds 判断是否真的在根 stack
  useBackHandler(useCallback(() => {
    const ids = Object.keys(commonState.componentIds)
    console.log('[Home BackHandler] triggered, componentIds keys:', ids, 'count:', ids.length)
    console.log('[Home BackHandler] navActiveId:', commonState.navActiveId)
    if (ids.length == 1 && ids[0] == COMPONENT_IDS.home) {
      console.log('[Home BackHandler] at root stack')
      if (commonState.navActiveId != 'nav_songlist' && commonState.navActiveId != 'nav_setting') {
        console.log('[Home BackHandler] switching to songlist, returning true')
        setNavActiveId('nav_songlist')
        return true
      }
    }
    console.log('[Home BackHandler] returning false (navigator will handle)')
    return false
  }, []))

  useEffect(() => {
    setComponentId(COMPONENT_IDS.home, componentId)
    // eslint-disable-next-line react-hooks/exhaustive-deps

    if (settingState.setting['player.startupPushPlayDetailScreen']) {
      navigations.pushPlayDetailScreen(componentId, true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <PageContent>
      {
        isHorizontalMode
          ? <Horizontal />
          : <Vertical />
      }
    </PageContent>
  )
}
