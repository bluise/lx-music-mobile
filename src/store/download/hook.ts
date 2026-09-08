import { useEffect, useState } from 'react'
import state from './state'

export const useDownloadList = () => {
  const [value, update] = useState(state.list)

  useEffect(() => {
    const handleUpdate = (list: LX.Download.ListItem[]) => {
      update([...list])
    }
    global.state_event.on('downloadListChanged', handleUpdate)
    return () => {
      global.state_event.off('downloadListChanged', handleUpdate)
    }
  }, [])

  return value
}
