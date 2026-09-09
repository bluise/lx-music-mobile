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
import { toast } from '@/utils/tools'


interface Props {
  componentId: string
}


export default ({ componentId }: Props) => {
  const isHorizontalMode = useHorizontalMode()

  // [测试] 无条件拦截所有返回键，确认 BackHandler 有没有被调到
  // 能看到 toast → handler 被调了，问题在条件判断
  // 看不到 toast → handler 根本没被调，问题在 native/RNN 层
  useBackHandler(useCallback(() => {
    const ids = Object.keys(commonState.componentIds)
    toast(`BACK: ids=${ids.length} (${ids.join(',')}) nav=${commonState.navActiveId}`)

    if (ids.length == 1 && ids[0] == COMPONENT_IDS.home) {
      if (commonState.navActiveId != 'nav_songlist' && commonState.navActiveId != 'nav_setting') {
        setNavActiveId('nav_songlist')
        return true
      }
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
