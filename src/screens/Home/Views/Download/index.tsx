import { useCallback } from 'react'
import { View, FlatList, TouchableOpacity } from 'react-native'
import { useDownloadList } from '@/store/download/hook'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import Button from '@/components/common/Button'
import {
  pauseDownload,
  resumeDownload,
  removeDownload,
  retryDownload,
  clearCompletedDownloads,
} from '@/core/download'

const formatSize = (bytes: number): string => {
  if (bytes <= 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

const DownloadItem = ({ item }: { item: LX.Download.ListItem }) => {
  const theme = useTheme()
  const t = useI18n()
  const { musicInfo, quality } = item.metadata

  const handleAction = useCallback(() => {
    switch (item.status) {
      case 'run':
        pauseDownload(item.id)
        break
      case 'pause':
      case 'waiting':
        resumeDownload(item.id)
        break
      case 'error':
        retryDownload(item.id)
        break
      default:
        break
    }
  }, [item.id, item.status])

  const handleRemove = useCallback(() => {
    void removeDownload(item.id, !item.isComplate)
  }, [item.id, item.isComplate])

  const isRunning = item.status == 'run'
  const isError = item.status == 'error'
  const isCompleted = item.isComplate

  const statusColor = isError
    ? theme['c-badge-tertiary']
    : isCompleted
      ? theme['c-badge-primary']
      : theme['c-400']

  return (
    <View style={[styles.item, { borderBottomColor: theme['c-border-background'] }]}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text color={theme['c-font']} numberOfLines={1} style={styles.name}>{musicInfo.name}</Text>
          <Text size={11} color={theme['c-500']} numberOfLines={1}>
            {musicInfo.singer} · {quality}
          </Text>
        </View>
        <View style={styles.itemActions}>
          {!isCompleted ? (
            <TouchableOpacity onPress={handleAction} style={styles.actionBtn}>
              <Icon
                name={isRunning ? 'pause' : 'play'}
                color={theme['c-primary-font']}
                size={16}
              />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity onPress={handleRemove} style={styles.actionBtn}>
            <Icon name="close" color={theme['c-400']} size={16} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.progressWrap}>
        <View style={[styles.progressBg, { backgroundColor: theme['c-primary-light-300-alpha-800'] }]}>
          <View
            style={[
              styles.progressFg,
              {
                width: `${Math.min(item.progress * 100, 100)}%`,
                backgroundColor: isError ? theme['c-badge-tertiary'] : theme['c-primary'],
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.itemFooter}>
        <Text size={11} color={statusColor} numberOfLines={1} style={styles.statusText}>
          {item.statusText || t(`download_status_${item.status}`)}
        </Text>
        <Text size={11} color={theme['c-400']}>
          {isCompleted
            ? formatSize(item.total)
            : `${formatSize(item.downloaded)} / ${item.total ? formatSize(item.total) : '?'}${item.speed ? ` · ${item.speed}` : ''}`}
        </Text>
      </View>
    </View>
  )
}

const Download = () => {
  const theme = useTheme()
  const t = useI18n()
  const list = useDownloadList()

  const completedCount = list.filter(i => i.isComplate).length

  return (
    <View style={styles.container}>
      <View style={[styles.header, { borderBottomColor: theme['c-border-background'] }]}>
        <Text size={14} color={theme['c-font']}>
          {t('download_title')} ({list.length})
        </Text>
        {completedCount > 0 ? (
          <Button onPress={clearCompletedDownloads} style={styles.clearBtn}>
            <Text size={12} color={theme['c-primary-font']}>{t('download_clear_completed')}</Text>
          </Button>
        ) : null}
      </View>

      {list.length == 0 ? (
        <View style={styles.empty}>
          <Icon name="download-2" size={48} color={theme['c-300']} />
          <Text size={13} color={theme['c-400']} style={styles.emptyText}>
            {t('download_empty')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <DownloadItem item={item} />}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  listContent: {
    paddingBottom: 20,
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemInfo: {
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
  },
  name: {
    marginBottom: 2,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 8,
    marginLeft: 4,
  },
  progressWrap: {
    marginTop: 8,
  },
  progressBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFg: {
    height: '100%',
    borderRadius: 2,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  statusText: {
    flex: 1,
    marginRight: 8,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    marginTop: 12,
  },
})

export default Download
