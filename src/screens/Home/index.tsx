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

  // 根 stack 上拦截所有返回键，不让 app 退出：
  // - 非歌单/设置 tab → 切到歌单页
  // - 歌单页/设置页 → 拦截住，不做动作（或由 Setting 组件自己处理）
  // - 非根 stack → 返回 false 让 RNN 正常 pop
  useBackHandler(useCallback(() => {
    const ids = Object.keys(commonState.componentIds)
    if (ids.length <= 1) {
      // 在根 stack，拦截住，不让 RNN finish
      if (commonState.navActiveId != 'nav_songlist' && commonState.navActiveId != 'nav_setting') {
        setNavActiveId('nav_songlist')
      }
      return true
    }
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
