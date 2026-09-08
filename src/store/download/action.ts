import state from './state'

export default {
  setList(list: LX.Download.ListItem[]) {
    state.list = list
    global.state_event.downloadListChanged([...state.list])
  },

  addTask(task: LX.Download.ListItem) {
    state.list.unshift(task)
    global.state_event.downloadListChanged([...state.list])
  },

  updateTask(id: string, data: Partial<LX.Download.ListItem>) {
    const index = state.list.findIndex(item => item.id == id)
    if (index < 0) return
    state.list[index] = { ...state.list[index], ...data }
    global.state_event.downloadListChanged([...state.list])
  },

  updateMetadata(id: string, data: Partial<LX.Download.ListItem['metadata']>) {
    const index = state.list.findIndex(item => item.id == id)
    if (index < 0) return
    state.list[index] = {
      ...state.list[index],
      metadata: { ...state.list[index].metadata, ...data },
    }
    global.state_event.downloadListChanged([...state.list])
  },

  removeTask(id: string) {
    const index = state.list.findIndex(item => item.id == id)
    if (index < 0) return
    state.list.splice(index, 1)
    global.state_event.downloadListChanged([...state.list])
  },

  clearCompleted() {
    state.list = state.list.filter(item => !item.isComplate)
    global.state_event.downloadListChanged([...state.list])
  },
}
