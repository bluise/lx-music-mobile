import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { ScrollView, TouchableHighlight, View } from 'react-native'

import Dialog, { type DialogType } from '@/components/common/Dialog'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useI18n } from '@/lang'
import type { Message } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { scaleSizeH } from '@/utils/pixelRatio'

/**
 * 音质选择顺序（从高到低）
 */
const QUALITY_ORDER: LX.Quality[] = ['flac24bit', 'flac', 'ape', 'wav', '320k', '192k', '128k']

/**
 * 获取音质显示名称
 */
export const getQualityLabel = (quality: LX.Quality, t: (key: keyof Message) => string): string => {
  switch (quality) {
    case 'flac24bit':
      return t('quality_flac_24bit')
    case 'flac':
      return t('quality_flac')
    case 'ape':
      return t('quality_ape')
    case 'wav':
      return t('quality_wav')
    case '320k':
      return t('quality_mp3_320k')
    case '192k':
      return t('quality_mp3_192k')
    case '128k':
      return t('quality_mp3_128k')
    default:
      return quality
  }
}

export interface QualitySelectInfo {
  musicInfo: LX.Music.MusicInfoOnline
  onSelect: (quality: LX.Quality) => void
}

export interface QualitySelectModalType {
  show: (info: QualitySelectInfo) => void
}

export default forwardRef<QualitySelectModalType>((_, ref) => {
  const t = useI18n()
  const theme = useTheme()
  const dialogRef = useRef<DialogType>(null)
  const [selectInfo, setSelectInfo] = useState<QualitySelectInfo | null>(null)

  useImperativeHandle(ref, () => ({
    show(info) {
      setSelectInfo(info)
      requestAnimationFrame(() => {
        dialogRef.current?.setVisible(true)
      })
    },
  }))

  const availableQualities = useMemo(() => {
    if (!selectInfo) return [] as LX.Quality[]
    const musicInfo = selectInfo.musicInfo
    const sourceQualities = global.lx.qualityList[musicInfo.source] ?? []
    return QUALITY_ORDER.filter(q => {
      return musicInfo.meta._qualitys[q] && sourceQualities.includes(q)
    })
  }, [selectInfo])

  const handleSelect = (quality: LX.Quality) => {
    dialogRef.current?.setVisible(false)
    selectInfo?.onSelect(quality)
  }

  const handleHide = () => {
    requestAnimationFrame(() => { setSelectInfo(null) })
  }

  return (
    <Dialog ref={dialogRef} onHide={handleHide} title={t('download_select_quality')}>
      <ScrollView style={{ flexGrow: 0 }}>
        {
          availableQualities.map(q => {
            const size = selectInfo?.musicInfo.meta._qualitys[q]?.size
            return (
              <TouchableHighlight
                key={q}
                style={styles.item}
                underlayColor={theme['c-primary-background-active']}
                onPress={() => { handleSelect(q) }}
              >
                <View style={styles.itemRow}>
                  <View style={styles.itemLeft}>
                    <Text size={15} color={theme['c-font']}>{getQualityLabel(q, t)}</Text>
                    {
                      size
                        ? <Text style={styles.size} size={12} color={theme['c-font-label']}>{size}</Text>
                        : null
                    }
                  </View>
                  <Icon name="chevron-right" color={theme['c-font-label']} size={14} />
                </View>
              </TouchableHighlight>
            )
          })
        }
      </ScrollView>
    </Dialog>
  )
})

const styles = createStyle({
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    height: scaleSizeH(46),
  },
  item: {
    flexGrow: 1,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  size: {
    marginLeft: 8,
  },
})
