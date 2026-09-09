import { useState, useEffect, useCallback } from 'react'
import { View, TouchableOpacity, PermissionsAndroid } from 'react-native'
import Text from '@/components/common/Text'
import ButtonPrimary from '@/components/common/ButtonPrimary'
import Input from '@/components/common/Input'
import { useTheme } from '@/store/theme/hook'
import { createStyle, toast, clipboardWriteText } from '@/utils/tools'
import { getCurrentDeviceId, verifyRegCode, saveRegistration } from '@/utils/registration'
import { navigations } from '@/navigation'
import { exitApp } from '@/utils/nativeModules/utils'

interface Props {
  componentId: string
}

export default ({ componentId }: Props) => {
  const theme = useTheme()
  const [deviceId, setDeviceId] = useState('')
  const [regCode, setRegCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [loadingDeviceId, setLoadingDeviceId] = useState(false)

  // 获取设备码（先确保已授权）
  const loadDeviceId = useCallback(async() => {
    setLoadingDeviceId(true)
    setErrorMsg('')
    try {
      const id = await getCurrentDeviceId()
      setDeviceId(id || '')
    } finally {
      setLoadingDeviceId(false)
    }
  }, [])

  // 请求读取手机状态权限（用于获取 IMEI 串号）
  const requestPhonePermission = useCallback(async(): Promise<boolean> => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        {
          title: '需要读取设备信息',
          message: '阿汤音乐需要读取您的设备串号（IMEI），用于软件注册绑定本机。\n换手机后需要重新注册。',
          buttonPositive: '允许',
          buttonNegative: '拒绝',
        },
      )
      return granted === PermissionsAndroid.RESULTS.GRANTED
    } catch {
      return false
    }
  }, [])

  // 进入页面时自动请求权限，授权后加载设备码
  useEffect(() => {
    let mounted = true
    void (async() => {
      const ok = await requestPhonePermission()
      if (!mounted) return
      if (ok) {
        setPermissionDenied(false)
        await loadDeviceId()
      } else {
        setPermissionDenied(true)
      }
    })()
    return () => { mounted = false }
  }, [requestPhonePermission, loadDeviceId])

  const handleRetryPermission = useCallback(async() => {
    const ok = await requestPhonePermission()
    if (ok) {
      setPermissionDenied(false)
      await loadDeviceId()
    } else {
      setPermissionDenied(true)
    }
  }, [requestPhonePermission, loadDeviceId])

  const handleCopy = useCallback(() => {
    if (!deviceId) return
    clipboardWriteText(deviceId)
    toast('设备码已复制到剪贴板')
  }, [deviceId])

  const handleRegister = useCallback(async() => {
    if (!deviceId) {
      setErrorMsg('设备码获取失败，请重启应用')
      return
    }
    if (!regCode.trim()) {
      setErrorMsg('请输入注册码')
      return
    }
    setVerifying(true)
    setErrorMsg('')
    try {
      if (verifyRegCode(deviceId, regCode.trim())) {
        await saveRegistration(deviceId, regCode.trim().toUpperCase())
        toast('注册成功，正在进入应用...')
        // 注册成功后跳转到主页
        setTimeout(() => {
          void navigations.pushHomeScreen()
        }, 500)
      } else {
        setErrorMsg('注册码不正确，请检查后重试')
      }
    } catch (e) {
      setErrorMsg('注册失败，请重试')
    } finally {
      setVerifying(false)
    }
  }, [deviceId, regCode])

  const handleExit = useCallback(() => {
    exitApp()
  }, [])

  return (
    <View style={{
      ...styles.container,
      backgroundColor: theme['c-content-background'],
    }}>
      <View style={styles.card}>
        <Text size={22} color={theme['c-font']} style={styles.title}>阿汤音乐</Text>
        <Text size={14} color={theme['c-font-label']} style={styles.subtitle}>软件注册</Text>

        <View style={styles.section}>
          <Text size={13} color={theme['c-font-label']} style={styles.label}>设备码</Text>
          <View style={{
            ...styles.deviceIdBox,
            backgroundColor: theme['c-primary-input-background'],
            borderColor: theme['c-border-background'],
          }}>
            <Text size={14} color={theme['c-primary-font']} style={styles.deviceIdText} selectable>
              {deviceId || (loadingDeviceId ? '获取中...' : '未获取')}
            </Text>
            {deviceId ? (
              <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
                <Text size={12} color={theme['c-primary-font']}>复制</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {permissionDenied ? (
            <View>
              <Text size={11} color="#e74c3c" style={styles.tip}>
                需要「读取设备信息」权限才能获取设备码，请授权后重试。
              </Text>
              <TouchableOpacity onPress={handleRetryPermission} style={styles.retryBtn}>
                <Text size={12} color={theme['c-primary-font']}>点击重新授权</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text size={11} color={theme['c-font-label']} style={styles.tip}>
              将设备码发送给管理员获取注册码，每台手机仅需注册一次
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text size={13} color={theme['c-font-label']} style={styles.label}>注册码</Text>
          <View style={{
            ...styles.inputBox,
            backgroundColor: theme['c-primary-input-background'],
            borderColor: theme['c-border-background'],
          }}>
            <Input
              value={regCode}
              onChangeText={setRegCode}
              placeholder="请输入注册码"
              placeholderTextColor={theme['c-font-label']}
              autoCapitalize="characters"
              maxLength={19}
              style={{ color: theme['c-font'], fontSize: 16 }}
            />
          </View>
          {errorMsg ? (
            <Text size={12} color="#e74c3c" style={styles.error}>{errorMsg}</Text>
          ) : null}
        </View>

        <View style={styles.buttonRow}>
          <ButtonPrimary onPress={handleRegister} disabled={verifying} size={16}>
            {verifying ? '验证中...' : '注 册'}
          </ButtonPrimary>
          <ButtonPrimary onPress={handleExit} size={16}>
            退 出
          </ButtonPrimary>
        </View>
      </View>
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 12,
    padding: 24,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 28,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
  },
  deviceIdBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  deviceIdText: {
    flex: 1,
    letterSpacing: 1,
  },
  copyBtn: {
    paddingLeft: 12,
    paddingVertical: 4,
  },
  retryBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  inputBox: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  tip: {
    marginTop: 8,
    lineHeight: 16,
  },
  error: {
    marginTop: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
})
