import molan from './molan.json'

/**
 * 内置用户音源（阿汤聚合音源）
 *
 * 脚本内容随构建打包作为离线兜底（molan.json），
 * 运行时会优先从下方 update URL 拉取最新版本并缓存，
 * 以便每次更新都能自动获取上游脚本。
 */
export const BUILTIN_USER_API_ID = 'user_api_builtin_atang'
export const BUILTIN_USER_API_UPDATE_URL = 'https://file.tangzhiguo.cn/mr.js'
export const BUILTIN_USER_API_FALLBACK_SCRIPT: string = (molan as { script: string }).script

export const BUILTIN_USER_API_INFO: LX.UserApi.UserApiInfo = {
  id: BUILTIN_USER_API_ID,
  name: '阿汤聚合音源',
  description: '全平台支持flac，wy，qq，kw，kg支持母带',
  version: '2.3.3',
  author: '阿汤(23692662)',
  homepage: 'https://github.com/baiji6/molanyinyueyuan',
  allowShowUpdateAlert: false,
}
