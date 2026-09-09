import { getDeviceId } from '@/utils/nativeModules/utils'
import { getData, saveData } from '@/plugins/storage'
import { storageDataPrefix } from '@/config/constant'
import { stringMd5 } from 'react-native-quick-md5'

// 注册盐值（与注册机保持一致）
const REG_SALT = 'atang_music_2024'

interface RegistrationInfo {
  deviceId: string
  regCode: string
  timestamp: number
}

/**
 * 根据设备 ID 生成对应的注册码
 * 算法: MD5(salt + deviceId) 取前 16 位大写，格式化为 XXXX-XXXX-XXXX-XXXX
 */
export const generateRegCode = (deviceId: string): string => {
  const raw = stringMd5(`${REG_SALT}${deviceId}`).toUpperCase().substring(0, 16)
  return `${raw.substring(0, 4)}-${raw.substring(4, 8)}-${raw.substring(8, 12)}-${raw.substring(12, 16)}`
}

/**
 * 校验注册码是否与设备 ID 匹配
 */
export const verifyRegCode = (deviceId: string, inputCode: string): boolean => {
  if (!deviceId || !inputCode) return false
  const expected = generateRegCode(deviceId)
  // 忽略大小写和分隔符差异
  const normalize = (s: string) => s.replace(/[^A-Z0-9]/gi, '').toUpperCase()
  return normalize(expected) === normalize(inputCode)
}

/**
 * 获取当前设备 ID
 */
export const getCurrentDeviceId = async(): Promise<string> => getDeviceId()

/**
 * 检查是否已注册（设备 ID 匹配存储的注册信息）
 */
export const isRegistered = async(): Promise<boolean> => {
  try {
    const info = await getData<RegistrationInfo>(storageDataPrefix.registration)
    if (!info?.deviceId || !info.regCode) return false
    const currentDeviceId = await getDeviceId()
    if (currentDeviceId !== info.deviceId) return false
    return verifyRegCode(info.deviceId, info.regCode)
  } catch {
    return false
  }
}

/**
 * 保存注册信息
 */
export const saveRegistration = async(deviceId: string, regCode: string): Promise<void> => {
  const info: RegistrationInfo = {
    deviceId,
    regCode,
    timestamp: Date.now(),
  }
  await saveData(storageDataPrefix.registration, info)
}

/**
 * 清除注册信息（换手机或重置时使用）
 */
export const clearRegistration = async(): Promise<void> => {
  const { removeData } = await import('@/plugins/storage')
  await removeData(storageDataPrefix.registration)
}
