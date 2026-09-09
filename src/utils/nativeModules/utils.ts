import { AppState, NativeEventEmitter, NativeModules } from 'react-native'

const { UtilsModule } = NativeModules

export const exitApp = UtilsModule.exitApp

export const getSupportedAbis = UtilsModule.getSupportedAbis

export const installApk = (filePath: string, fileProviderAuthority: string) => UtilsModule.installApk(filePath, fileProviderAuthority)


export const screenkeepAwake = () => {
  if (global.lx.isScreenKeepAwake) return
  global.lx.isScreenKeepAwake = true
  UtilsModule.screenkeepAwake()
}
export const screenUnkeepAwake = () => {
  // console.log('screenUnkeepAwake')
  if (!global.lx.isScreenKeepAwake) return
  global.lx.isScreenKeepAwake = false
  UtilsModule.screenUnkeepAwake()
}

export const getWIFIIPV4Address = UtilsModule.getWIFIIPV4Address as () => Promise<string>

export const getDeviceName = async(): Promise<string> => {
  return UtilsModule.getDeviceName().then((deviceName: string) => deviceName || 'Unknown')
}

export const getDeviceId = UtilsModule.getDeviceId as () => Promise<string>

export const isNotificationsEnabled = UtilsModule.isNotificationsEnabled as () => Promise<boolean>

export const requestNotificationPermission = async() => new Promise<boolean>((resolve) => {
  let subscription = AppState.addEventListener('change', (state) => {
    if (state != 'active') return
    subscription.remove()
    setTimeout(() => {
      void isNotificationsEnabled().then(resolve)
    }, 1000)
  })
  UtilsModule.openNotificationPermissionActivity().then((result: boolean) => {
    if (result) return
    subscription.remove()
    resolve(false)
  })
})

export const shareText = async(shareTitle: string, title: string, text: string): Promise<void> => {
  UtilsModule.shareText(shareTitle, title, text)
}

export const getSystemLocales = async(): Promise<string> => {
  return UtilsModule.getSystemLocales()
}

export const onScreenStateChange = (handler: (state: 'ON' | 'OFF') => void): () => void => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const eventEmitter = new NativeEventEmitter(UtilsModule)
  const eventListener = eventEmitter.addListener('screen-state', event => {
    handler(event.state as 'ON' | 'OFF')
  })

  return () => {
    eventListener.remove()
  }
}

export const getWindowSize = async(): Promise<{ width: number, height: number }> => {
  return UtilsModule.getWindowSize()
}

export const onWindowSizeChange = (handler: (size: { width: number, height: number }) => void): () => void => {
  UtilsModule.listenWindowSizeChanged()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const eventEmitter = new NativeEventEmitter(UtilsModule)
  const eventListener = eventEmitter.addListener('screen-size-changed', event => {
    handler(event as { width: number, height: number })
  })

  return () => {
    eventListener.remove()
  }
}

export const isIgnoringBatteryOptimization = async(): Promise<boolean> => {
  return UtilsModule.isIgnoringBatteryOptimization()
}

export const requestIgnoreBatteryOptimization = async() => new Promise<boolean>((resolve) => {
  let subscription = AppState.addEventListener('change', (state) => {
    if (state != 'active') return
    subscription.remove()
    setTimeout(() => {
      void isIgnoringBatteryOptimization().then(resolve)
    }, 1000)
  })
  UtilsModule.requestIgnoreBatteryOptimization().then((result: boolean) => {
    if (result) return
    subscription.remove()
    resolve(false)
  })
})

/**
 * 检查 Android 11+ 是否拥有"所有文件访问"权限
 * Android 11 以下直接返回 true
 */
export const isExternalStorageManager = async(): Promise<boolean> => {
  return UtilsModule.isExternalStorageManager()
}

/**
 * 跳转到系统"所有文件访问权限"设置页，并等待用户返回后再检查结果
 */
export const requestManageAllFilesAccess = async(): Promise<boolean> => new Promise((resolve) => {
  let subscription: { remove: () => void } | null = AppState.addEventListener('change', (state) => {
    if (state != 'active') return
    subscription?.remove()
    setTimeout(() => {
      void UtilsModule.isExternalStorageManager().then((granted: boolean) => resolve(granted))
    }, 800)
  })
  UtilsModule.openManageAllFilesAccessActivity()
  // 保险：如果 15 秒后还没 resolve，就回查一次
  setTimeout(() => {
    if (!subscription) return
    subscription.remove()
    subscription = null
    void UtilsModule.isExternalStorageManager().then((granted: boolean) => resolve(granted))
  }, 15000)
})
