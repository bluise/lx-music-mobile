# LX Music 移动版 — Code Wiki

> 本文档基于仓库源码梳理，旨在帮助开发者快速理解项目整体架构、核心模块职责、关键类与函数、依赖关系以及运行方式。

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈与依赖](#2-技术栈与依赖)
3. [项目目录结构](#3-项目目录结构)
4. [整体架构](#4-整体架构)
5. [核心模块详解](#5-核心模块详解)
   - 5.1 [启动流程](#51-启动流程-appts--coreinit)
   - 5.2 [状态管理（Store）](#52-状态管理store-事件驱动模式)
   - 5.3 [事件系统（Event）](#53-事件系统event)
   - 5.4 [播放器核心](#54-播放器核心)
   - 5.5 [音乐数据层](#55-音乐数据层)
   - 5.6 [导航系统](#56-导航系统navigation)
   - 5.7 [主题系统](#57-主题系统theme)
   - 5.8 [数据同步插件](#58-数据同步插件pluginssync)
   - 5.9 [持久化存储](#59-持久化存储pluginsstorage)
   - 5.10 [设置与配置](#510-设置与配置config)
   - 5.11 [国际化](#511-国际化lang)
   - 5.12 [原生模块桥接](#512-原生模块桥接utilsnativemodules)
6. [关键类型定义](#6-关键类型定义)
7. [依赖关系图](#7-依赖关系图)
8. [项目运行方式](#8-项目运行方式)
9. [构建与发布](#9-构建与发布)

---

## 1. 项目概述

**LX Music 移动版**（`lx-music-mobile`）是一款基于 **React Native** 开发的开源音乐播放器应用，支持 Android 5 及以上系统。项目当前版本 `1.8.4`（versionCode 76）。

### 核心功能

- 聚合多个音乐平台（酷我 kw、酷狗 kg、QQ 音乐 tx、网易云音乐 wy、咪咕 mg、虾米 xm）的在线搜索、排行榜、歌单与歌词数据。
- 支持自定义音乐源（User API），通过 JS 脚本扩展音频来源。
- 本地音乐播放、下载管理、我的列表（含默认/收藏/下载/临时列表）。
- 多种播放模式：列表循环、随机、顺序、单曲循环、禁用。
- 桌面歌词、蓝牙歌词、通知栏控制、音频焦点处理。
- 多端数据同步（基于独立的同步服务端 `lx-music-sync-server`）。
- 多主题、多语言（简中/繁中/英文）、横竖屏自适应。

### 协议

Apache License 2.0，附带数据来源、版权、免责等补充协议条款（详见 [LICENSE](file:///workspace/LICENSE) 与 [README.md](file:///workspace/README.md)）。

---

## 2. 技术栈与依赖

### 核心框架

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.2.0 | UI 渲染 |
| React Native | 0.73.11 | 跨平台移动应用框架 |
| react-native-navigation | 7.39.2 | 原生导航（Wix） |
| TypeScript | 5.9.3 | 类型系统 |

### 关键依赖

- **音频播放**：`react-native-track-player`（fork 自 lyswhut，支持后台播放、通知栏、音频焦点）
- **后台定时**：`react-native-background-timer`
- **本地存储**：`@react-native-async-storage/async-storage`
- **文件系统**：`react-native-fs`、`react-native-file-system`（自定义 fork）
- **本地媒体元数据**：`react-native-local-media-metadata`
- **加密/编码**：`react-native-quick-md5`、`react-native-quick-base64`、`@craftzdog/react-native-buffer`、`pako`、`iconv-lite`
- **歌词解析**：`lrc-file-parser`
- **字符处理**：`he`（HTML 实体解码）、`simplify-chinese-main`（繁简转换）
- **工具库**：`message2call`（异步消息转 Promise）

### 开发依赖

- Babel 7 + `@react-native/babel-preset`
- ESLint（standard + standard-with-typescript 规范）
- `babel-plugin-module-resolver`（路径别名 `@/` → `src/`）

> 注：虽然 README 提到 Redux，但实际项目**未使用 Redux**，而是采用基于自定义 Event 发射器 + 全局单例 state 的轻量状态管理方案。

---

## 3. 项目目录结构

```
/workspace
├── android/                  # Android 原生工程（Gradle、MainActivity、资源）
├── ios/                      # iOS 原生工程（已存在但官方暂不支持 iOS）
├── publish/                  # 发布脚本与版本信息
├── src/                      # 应用源码主体
│   ├── app.ts                # 应用入口（初始化编排）
│   ├── components/           # 通用 UI 组件（按钮、弹窗、列表项等）
│   ├── config/               # 常量、默认设置、设置迁移、全局数据
│   ├── core/                 # 核心业务逻辑（播放器、音乐、列表、搜索、同步等）
│   │   └── init/             # 初始化流程（设置、主题、i18n、播放器、deeplink 等）
│   ├── event/                # 全局事件发射器（AppEvent、ListEvent 等）
│   ├── lang/                 # 国际化资源与 i18n 实现
│   ├── navigation/           # 导航注册、屏幕名、导航工具
│   ├── plugins/              # 可插拔能力（player、sync、lyric、storage）
│   ├── resources/            # 字体、图片、音频等静态资源
│   ├── screens/              # 屏幕页面（Home、PlayDetail、SonglistDetail、Comment）
│   ├── store/                # 状态管理（state + action + hook，按领域拆分）
│   ├── theme/                # 主题系统（主题生成、颜色、排版）
│   ├── types/                # 全局 TypeScript 类型声明（LX 命名空间）
│   └── utils/                # 工具函数、音乐 SDK、原生模块桥接、hooks
├── index.js                  # RN 入口（加载 shim 与 src/app）
├── app.json                  # 应用名配置
├── package.json              # 依赖与脚本
├── tsconfig.json             # TS 配置
├── babel.config.js           # Babel 配置
├── metro.config.js           # Metro 打包配置
└── CHANGELOG.md              # 变更日志
```

---

## 4. 整体架构

项目采用**分层 + 事件驱动**的架构：

```
┌─────────────────────────────────────────────────────────────┐
│                         UI 层 (screens)                       │
│   Home / PlayDetail / SonglistDetail / Comment               │
│   ↕ 通过 store hook 订阅状态，通过 core 函数发起操作          │
├─────────────────────────────────────────────────────────────┤
│                      状态层 (store)                          │
│   各领域 state (player/list/setting/theme/...)               │
│   + action (写状态 + emit state_event)                       │
│   + hook (useXxx 订阅 state_event)                           │
├─────────────────────────────────────────────────────────────┤
│                     核心业务层 (core)                        │
│   player / music / list / search / songlist / leaderboard    │
│   dislikeList / sync / theme / userApi / version / lyric     │
├─────────────────────────────────────────────────────────────┤
│                    插件与适配层 (plugins)                     │
│   player (TrackPlayer 封装) / sync (Socket 同步)             │
│   storage (AsyncStorage 分片) / lyric                        │
├─────────────────────────────────────────────────────────────┤
│                  数据来源层 (utils/musicSdk)                  │
│   kw / kg / tx / wy / mg / xm 各平台 SDK                     │
│   + api-source (音质支持) + 自定义 User API                  │
├─────────────────────────────────────────────────────────────┤
│                  原生能力层 (nativeModules)                   │
│   cache / crypto / lyricDesktop / userApi / utils            │
└─────────────────────────────────────────────────────────────┘
```

**核心设计理念**：

1. **状态集中、事件解耦**：每个领域有一个单例 `state` 对象（普通 JS 对象），`action` 修改 state 后通过 `global.state_event` 广播变更，UI 层通过 `hook` 监听事件触发重渲染。这避免了 Redux 的样板代码，又保留了单向数据流。
2. **核心逻辑与 UI 分离**：`core/` 只依赖 `store` 与 `utils`，不依赖 React 组件；`screens` 只负责展示与交互。
3. **音乐源可插拔**：`utils/musicSdk` 聚合各平台 SDK，`core/apiSource.ts` 统一管理当前激活的源（内置源或自定义 User API）。
4. **播放能力抽象**：`plugins/player` 封装 `react-native-track-player`，`core/player` 编排播放逻辑（取 URL、切歌、播放列表管理）。

---

## 5. 核心模块详解

### 5.1 启动流程 (`app.ts` + `core/init`)

**入口链**：`index.js` → `src/app.ts` → `@/core/init`

#### [app.ts](file:///workspace/src/app.ts)

应用启动编排器，职责：

1. 加载错误处理 `@/utils/errorHandle`、日志、全局数据 `@/config/globalData`。
2. 并行获取字体大小 `getFontSize()` 与窗口尺寸 `windowSizeTools.init()`。
3. 通过 `listenLaunchEvent()` 监听 RNN 启动事件。
4. 动态导入 `@/core/init` 执行初始化，返回 `handlePushedHomeScreen` 回调。
5. 初始化导航 `initNavigation`，在回调中 `pushHomeScreen()` 并执行首屏后逻辑（检查更新、deeplink、协议弹窗）。
6. 初始化失败时弹出对话框并退出应用。

#### [core/init/index.ts](file:///workspace/src/core/init/index.ts)

默认导出异步初始化函数，按顺序执行：

| 步骤 | 函数 | 说明 |
|------|------|------|
| 1 | `initSetting()` | 加载并合并本地设置到 store |
| 2 | `initTheme(setting)` | 初始化主题 |
| 3 | `initI18n(setting)` | 初始化国际化 |
| 4 | `initUserApi(setting)` | 初始化自定义音乐源 |
| 5 | `setApiSource(setting['common.apiSource'])` | 设置当前音乐源 |
| 6 | `registerPlaybackService()` | 注册后台播放服务 |
| 7 | `initPlayer(setting)` | 初始化播放器 |
| 8 | `dataInit(setting)` | 初始化用户列表、不喜欢列表、导航状态 |
| 9 | `initCommonState(setting)` | 初始化通用状态 |
| 10 | `initSync(setting)` | 初始化数据同步 |

`handlePushedHomeScreen`：首页 push 后执行，若已同意协议则 `checkUpdate()` + `initDeeplink()`，否则弹出协议弹窗 `showPactModal()`。

---

### 5.2 状态管理（Store，事件驱动模式）

项目**未使用 Redux**，而是实现了一套轻量状态管理。

#### 结构模式

每个领域目录（如 `store/player/`）包含：

- `state.ts` — 单例状态对象（默认导出）
- `action.ts` — 写状态方法（直接修改 state + emit 事件）
- `hook.ts` — React Hook，订阅事件返回最新 state 片段

#### 示例：player store

[store/player/state.ts](file:///workspace/src/store/player/state.ts) 定义播放器状态：

```ts
interface InitState {
  playMusicInfo: { musicInfo, listId, isTempPlay }
  playInfo: { playIndex, playerListId, playerPlayIndex }
  musicInfo: { id, pic, lrc, tlrc, rlrc, lxlrc, rawlrc, name, singer, album }
  isPlay: boolean
  volume, playRate, statusText
  playedList: PlayMusicInfo[]      // 已播放列表（随机模式回溯用）
  tempPlayList: PlayMusicInfo[]    // 稍后播放列表
  progress: { nowPlayTime, maxPlayTime, progress, nowPlayTimeStr, maxPlayTimeStr }
  lastLyric
}
```

[store/player/action.ts](file:///workspace/src/store/player/action.ts) 中的每个方法：
1. 修改 `state` 对象字段
2. 调用 `global.state_event.xxxChanged(...)` 广播

[store/player/hook.ts](file:///workspace/src/store/player/hook.ts) 中的 hook：
```ts
export const useIsPlay = () => {
  const [value, update] = useState(state.isPlay)
  useEffect(() => {
    global.state_event.on('playStateChanged', update)
    return () => global.state_event.off('playStateChanged', update)
  }, [])
  return value
}
```

#### 领域列表

| 领域 | 路径 | 职责 |
|------|------|------|
| common | `store/common/` | 字体、状态栏高度、组件 ID、导航激活项、背景图 |
| player | `store/player/` | 播放状态、进度、歌词、播放/已播/待播列表 |
| list | `store/list/` | 我的列表数据 |
| setting | `store/setting/` | 应用设置（扁平化 key） |
| theme | `store/theme/` | 当前主题色板 |
| search | `store/search/` | 搜索状态（音乐/歌单子模块） |
| songlist | `store/songlist/` | 在线歌单 |
| leaderboard | `store/leaderboard/` | 排行榜 |
| hotSearch | `store/hotSearch/` | 热搜 |
| dislikeList | `store/dislikeList/` | 不喜欢列表 |
| sync | `store/sync/` | 同步状态 |
| userApi | `store/userApi/` | 自定义 API 源 |
| version | `store/version/` | 版本信息 |

#### Provider

[store/Provider/ThemeProvider.tsx](file:///workspace/src/store/Provider/ThemeProvider.tsx) 是唯一的 React Context Provider，通过监听 `themeUpdated` 事件将主题色板注入 `ThemeContext`，供所有屏幕组件通过 `useContext(ThemeContext)` 消费。

---

### 5.3 事件系统（Event）

[event/Event.ts](file:///workspace/src/event/Event.ts) 实现了一个轻量事件发射器：

```ts
class Event {
  listeners: Map<string, Array<(...args) => any>>
  on(eventName, listener)      // 订阅
  off(eventName, listener)     // 取消订阅
  emit(eventName, ...args)     // 异步广播（setImmediate）
  offAll(eventName)            // 清除某事件全部监听
}
```

> 注意 `emit` 使用 `setImmediate` 异步派发，避免同步调用栈过深。

#### 四类全局事件总线

在 `src/types/app.d.ts` 中声明，挂载到 `global`：

| 全局变量 | 类型 | 职责 |
|----------|------|------|
| `global.app_event` | `AppEvent` | 应用级事件：播放/暂停/停止、图片/歌词更新、列表更新、搜索类型切换等 |
| `global.list_event` | `ListEvent` | 列表相关事件 |
| `global.dislike_event` | `DislikeEvent` | 不喜欢列表事件 |
| `global.state_event` | `StateEvent` | 状态变更事件（store action 广播、hook 订阅） |

#### AppEvent 关键事件

[event/appEvent.ts](file:///workspace/src/event/appEvent.ts) 中定义：

- **播放控制**：`play()` / `pause()` / `stop()` / `error()`
- **播放器原始事件**：`playerPlaying` / `playerPause` / `playerEnded` / `playerError` / `playerLoadstart` / `playerEmptied` / `playerWaiting`
- **资源更新**：`picUpdated()` / `lyricUpdated()` / `lyricOffsetUpdate()`
- **列表**：`mylistUpdated` / `mylistToggled` / `myListMusicUpdate` / `downloadListUpdate` / `musicInfoUpdate`
- **进度/音量**：`setProgress(progress, maxPlayTime?)` / `setVolume(volume)` / `setVolumeIsMute`
- **导航/UI**：`jumpListPosition` / `changeLoveListVisible` / `showSonglistTagList` / `selectSyncMode`

---

### 5.4 播放器核心

播放器分为两层：**编排层** `core/player/` 与 **播放能力层** `plugins/player/`。

#### 编排层 `core/player/`

| 文件 | 职责 |
|------|------|
| [player.ts](file:///workspace/src/core/player/player.ts) | 播放控制核心：`playList`/`playListById`/`playNext`/`playPrev`/`play`/`pause`/`stop`/`togglePlay`、播放模式计算、取 URL 重试逻辑、收藏/不喜欢 |
| `playInfo.ts` | 管理当前播放列表 ID、播放索引、当前歌曲信息 |
| `playStatus.ts` | 设置状态文本（"获取链接中…"等） |
| `playedList.ts` | 已播放列表（随机/回溯用） |
| `tempPlayList.ts` | 稍后播放列表 |
| `progress.ts` | 播放进度同步 |
| `timeoutExit.ts` | 定时退出播放 |
| `utils.ts` | `filterList` 过滤不可播放歌曲 |

**关键函数**：

- `playList(listId, index)`：播放指定列表的第 index 首，清空已播/待播列表后调用 `handlePlay()`。
- `playNext(isAutoToggle)`：根据 `player.togglePlayMethod`（listLoop/random/list/singleLoop/none）计算下一曲；优先消费 `tempPlayList`，再回溯 `playedList`。
- `getMusicPlayUrl(musicInfo, isRefresh, isRetryed)`：获取音频 URL，失败时尝试切换源、延迟重试（应对 tooManyRequests）。
- `handlePlay()`：首次播放时初始化 TrackPlayer（音量、倍速、缓存、音频焦点、audio offload），然后并行获取 URL、封面、歌词。

#### 播放能力层 `plugins/player/`

[plugins/player/index.ts](file:///workspace/src/plugins/player/index.ts) 封装 `react-native-track-player`：

- `initial({ volume, playRate, cacheSize, isHandleAudioFocus, isEnableAudioOffload })`：调用 `TrackPlayer.setupPlayer`，设置缓存、音频焦点、音频卸载。
- `setResource(musicInfo, url, playTime)`：加载并播放音频资源。
- `setPlay / setPause / setStop / setCurrentTime / getDuration / getPosition`：播放控制。
- `updateMetaData`：更新通知栏媒体信息。
- `onStateChange`：监听播放状态变化并同步到 store。
- `isEmpty / isInitialized`：状态查询。

`plugins/player/service.ts` 注册后台播放服务，使应用在后台/锁屏时仍可继续播放并响应媒体按钮。

#### 播放模式常量

[config/constant.ts](file:///workspace/src/config/constant.ts)：`listLoop`（列表循环）、`random`（随机）、`list`（顺序）、`singleLoop`（单曲循环）、`none`（禁用）。

---

### 5.5 音乐数据层

#### `core/music/` — 统一音乐资源获取

[core/music/index.ts](file:///workspace/src/core/music/index.ts) 根据音乐类型分发到三个子模块：

| 子模块 | 触发条件 | 职责 |
|--------|----------|------|
| `online.ts` | `source` 非 local 且非下载项 | 在线音乐 URL、封面、歌词（含源切换） |
| `download.ts` | musicInfo 含 `progress` 字段 | 已下载音乐的本地文件、内嵌封面/歌词 |
| `local.ts` | `source == 'local'` | 本地扫描音乐的文件路径、元数据 |

统一导出三个函数：`getMusicUrl`、`getPicPath`、`getLyricInfo`，签名一致，内部按类型路由。

#### `utils/musicSdk/` — 多平台 SDK

[utils/musicSdk/index.js](file:///workspace/src/utils/musicSdk/index.js) 聚合各平台：

| 平台 | ID | 目录 | 能力 |
|------|-----|------|------|
| 酷我 | `kw` | `kw/` | 搜索、排行榜、歌单、歌词、图片 |
| 酷狗 | `kg` | `kg/` | 搜索、排行榜、歌单、歌词、图片、评论、歌手、专辑 |
| QQ 音乐 | `tx` | `tx/` | 搜索、排行榜、歌单、歌词、评论 |
| 网易云 | `wy` | `wy/` | 搜索、排行榜、歌单、歌词、评论、音乐详情 |
| 咪咕 | `mg` | `mg/` | 搜索、排行榜、歌单、歌词、图片、评论、专辑 |
| 虾米 | `xm` | `xm.js` | （已停服，仅占位） |

每个平台 SDK 暴露统一接口：`musicSearch`、`songList`、`leaderboard`、`lyric`、`pic`、`comment`、`hotSearch`、`tipSearch`、`musicInfo`。

**`findMusic(musicInfo)`**：跨平台精确匹配歌曲，按名称/歌手/专辑/时长多维度打分排序，用于源切换时在其他平台找到同一首歌。

#### `api-source.js` — 音质支持表

`supportQuality` 定义各源支持的音质等级（128k/320k/flac/flac24bit 等），`core/apiSource.ts` 根据 `common.apiSource` 设置 `global.lx.qualityList`。

#### `core/apiSource.ts` — 源切换

`setApiSource(apiId)`：若 `apiId` 以 `user_api` 开头则加载自定义 API，否则从 `musicSdk.supportQuality` 取音质表并销毁用户 API。切换后广播 `apiSourceUpdated`。

#### `core/userApi.ts` — 自定义源

加载用户导入的 JS 脚本作为音乐源，脚本需实现获取 URL/歌词/图片等接口。

---

### 5.6 导航系统（navigation）

基于 `react-native-navigation`（Wix）。

#### 屏幕注册

[navigation/registerScreens.tsx](file:///workspace/src/navigation/registerScreens.tsx) 注册 7 个屏幕，每个用 `WrappedComponent` 包裹 `ThemeProvider`：

| 常量 | 屏幕 |
|------|------|
| `HOME_SCREEN` | Home（首页，含搜索/歌单/排行/我的/设置子视图） |
| `PLAY_DETAIL_SCREEN` | PlayDetail（播放详情） |
| `SONGLIST_DETAIL_SCREEN` | SonglistDetail（歌单详情） |
| `COMMENT_SCREEN` | Comment（评论） |
| `VERSION_MODAL` | VersionModal |
| `PACT_MODAL` | PactModal（协议弹窗） |
| `SYNC_MODE_MODAL` | SyncModeModal |

#### 导航初始化

[navigation/index.ts](file:///workspace/src/navigation/index.ts)：

- `registerScreens()` 注册全部屏幕
- 监听 `registerScreenPoppedListener` 清理组件 ID
- `onAppLaunched(callback)` 在应用启动时执行回调

#### 屏幕与导航结构

[screens/index.ts](file:///workspace/src/screens/index.ts) 导出 4 个主屏幕。Home 内部通过 `Horizontal`/`Vertical` 两套布局适配横竖屏，子视图（Search/SongList/Leaderboard/Mylist/Setting）以 Pager 或 Drawer 形式切换。

---

### 5.7 主题系统（theme）

#### 主题生成

`src/theme/themes/` 包含主题定义脚本：

- `themes.ts` — 主题色板定义（多套主题）
- `createThemes.js` — 根据基础色生成全套 alpha 色阶（`c-primary` + dark-100~1000 + light-100~1000 + alpha-100~900）
- `colorUtils.js` / `utils.js` — 颜色工具（rgba 混合、明暗计算）

执行 `npm run build:theme` 生成运行时主题数据。

#### 主题状态

[store/theme/state.ts](file:///workspace/src/store/theme/state.ts)：

- `state.theme`：当前激活主题的完整色板对象（含 `c-primary` 系列、`c-000`~`c-1000` 灰阶、`c-app-background`、`c-font` 等语义色）。
- `ThemeContext`：React Context，由 `ThemeProvider` 注入。

#### 主题初始化

`core/init/theme.ts` 读取设置中的 `theme.id`，加载对应主题并广播 `themeUpdated`。支持自动主题（跟随系统明暗）、动态背景、字体阴影等。

---

### 5.8 数据同步插件（plugins/sync）

支持与独立部署的 `lx-music-sync-server` 进行多端数据同步。

#### 结构

```
plugins/sync/
├── index.ts              # 导出 connectServer / disconnectServer / getStatus
├── constants.ts          # 同步状态码 SYNC_CODE
├── data.ts               # 同步数据模型
├── log.ts                # 同步日志
├── utils.ts              # URL 解析等工具
└── client/
    ├── index.ts          # connectServer / disconnectServer 编排
    ├── client.ts         # WebSocket 连接与消息收发
    ├── auth.ts           # 鉴权（authCode → keyInfo）
    └── modules/
        ├── dislike/      # 不喜欢列表同步
        ├── list/         # 我的列表同步
        └── sync/         # 通用同步处理器
```

#### 关键流程

[plugins/sync/client/index.ts](file:///workspace/src/plugins/sync/client/index.ts)：

1. `connectServer(host, authCode?)`：解析 URL → 断开旧连接 → `handleAuth` 鉴权 → `socketConnect` 建立 WebSocket。
2. 连接状态通过 `sendSyncStatus` 广播到 `store/sync`。
3. `disconnectServer()`：关闭 Socket 并重置状态。

同步模块通过监听 `list_event` / `dislike_event` 捕获本地变更，推送到服务端；同时接收服务端消息更新本地数据。

---

### 5.9 持久化存储（plugins/storage）

[plugins/storage.ts](file:///workspace/src/plugins/storage.ts) 基于 `AsyncStorage` 封装，核心特性是**大数据分片存储**（单条上限 500KB）：

- `saveData(key, value)`：JSON 序列化后若超过 `limit`，拆分为多个 `@___PART_A___` 分片 key，主 key 存储分片 key 数组。
- `getData(key)`：检测分片前缀，`multiGet` 拼接后解析。
- `removeData(key)`：清理主 key 与所有分片。
- `getDataMultiple` / `saveDataMultiple` / `removeDataMultiple`：批量操作。
- `getAllKeys` / `clearAll`。

兼容 1.4.0 之前的旧分片格式（`@___PART___` + 逗号分隔）。

存储 key 前缀统一在 [config/constant.ts](file:///workspace/src/config/constant.ts) 的 `storageDataPrefix` 中定义（`@setting_v1`、`@list__`、`@lyric__`、`@play_info` 等）。

---

### 5.10 设置与配置（config）

#### 默认设置

[config/defaultSetting.ts](file:///workspace/src/config/defaultSetting.ts) 定义扁平化的默认设置对象 `LX.AppSetting`，覆盖：

- `common.*`：语言、音乐源、自动主题、抽屉位置等
- `player.*`：播放模式、音质、音量、倍速、缓存、歌词翻译、蓝牙歌词等
- `playDetail.*`：播放详情页歌词字号/对齐
- `desktopLyric.*`：桌面歌词开关、锁定、尺寸、颜色
- `search.*`：热搜/历史搜索显示
- `list.*`：列表显示项、添加位置
- `download.fileName`：下载文件名模板
- `sync.enable`：同步开关
- `theme.*`：主题 ID、动态背景、字体阴影

#### 设置加载与迁移

- [config/setting.ts](file:///workspace/src/config/setting.ts)：`initAppSetting()` 从存储读取设置，与默认值合并。
- `config/migrate.ts` / `migrateSetting.ts`：处理版本间设置结构迁移。

#### 全局数据

[config/globalData.ts](file:///workspace/src/config/globalData.ts) 初始化 `global.lx`、`global.app_event` 等全局对象。

---

### 5.11 国际化（lang）

- [lang/i18n.ts](file:///workspace/src/lang/i18n.ts)：实现 `I18n` 类，挂载到 `global.i18n`，提供 `t(key, params)` 插值翻译。
- `lang/zh-cn.json` / `zh-tw.json` / `en-us.json`：三种语言资源。
- `core/init/i18n.ts`：根据 `common.langId` 加载对应语言包。
- `core/common.ts` 的 `setLanguage(locale)`：更新设置 + 广播 `languageChanged` + 应用语言。

---

### 5.12 原生模块桥接（utils/nativeModules）

封装 React Native 原生模块的 JS 接口：

| 文件 | 职责 |
|------|------|
| `cache.ts` | 缓存清理 |
| `crypto.ts` | 加解密（配合 `cryptoTest.ts` 验证） |
| `lyricDesktop.ts` | 桌面歌词显示/隐藏/位置控制 |
| `userApi.ts` | 用户自定义 API 脚本执行环境 |
| `utils.ts` | 通用原生能力（退出应用 `exitApp` 等） |

---

## 6. 关键类型定义

所有全局类型声明位于 `src/types/`，统一使用 `LX` 命名空间。

| 文件 | 内容 |
|------|------|
| `app.d.ts` | `GlobalData`（global.lx 结构）、全局变量声明、`AppSetting` 引用 |
| `music.d.ts` | `MusicInfo`、`MusicInfoOnline`、`MusicInfoLocal`、`Quality`、`QualityList` |
| `player.d.ts` | `PlayMusicInfo`、`PlayInfo`、`MusicInfo`（播放器内）、`LyricInfo`、`SavedPlayInfo` |
| `list.d.ts` | 列表类型：`MyDefaultListInfo`、`MyLoveListInfo`、`UserListInfo`、`ListMusics` |
| `download_list.d.ts` | 下载列表项 `ListItem` |
| `dislike_list.d.ts` | 不喜欢列表 |
| `sync.d.ts` / `sync_common.d.ts` | 同步相关类型 |
| `theme.d.ts` | `ActiveTheme`、主题色键 |
| `user_api.d.ts` | 用户 API 源类型 |
| `common.d.ts` | 通用类型 |
| `config_files.d.ts` | 配置文件类型 |

核心类型示例（`LX.Music.MusicInfo`）：

```ts
interface MusicInfo {
  id: string
  name: string
  singer: string
  source: OnlineSource | 'local'
  interval: string
  meta: {
    songId: string
    albumName?: string
    picUrl?: string
    // 在线源特有
    qualitys?: Quality[]
    albumId?: string
    hash?: string        // kg
    strMediaMid?: string  // tx
    copyrightId?: string  // mg
    // 本地源特有
    filePath?: string
    ext?: string
  }
}
```

---

## 7. 依赖关系图

### 启动依赖链

```
index.js
  └─ src/app.ts
       ├─ utils/errorHandle, utils/log, config/globalData
       ├─ navigation (init → registerScreens → pushHomeScreen)
       └─ core/init
            ├─ core/common (initSetting)
            ├─ core/init/theme → store/theme
            ├─ core/init/i18n → lang
            ├─ core/init/userApi → core/userApi
            ├─ core/apiSource → utils/musicSdk
            ├─ plugins/player (registerPlaybackService)
            ├─ core/init/player → core/player → plugins/player
            ├─ core/init/dataInit → core/list, core/dislikeList, utils/musicSdk
            ├─ core/init/common → store/common
            └─ core/init/sync → plugins/sync
```

### 播放数据流

```
UI (PlayDetail/PlayerBar)
  │  调用 core/player/player.ts: playList()
  ▼
core/player/player.ts
  ├─ core/player/playInfo.ts → store/player/action (setPlayMusicInfo)
  ├─ core/music/index.ts → online/download/local
  │     └─ utils/musicSdk/<source> 或 core/userApi
  └─ plugins/player (setResource → TrackPlayer)
        ├─ TrackPlayer 播放音频
        └─ onStateChange → core/player/playStatus/progress → store/player/action
              └─ global.state_event → UI hook 重渲染
```

### 状态流转

```
core 业务函数
  └─ store/<domain>/action 修改 state
       └─ global.state_event.xxxChanged()
            └─ store/<domain>/hook (useEffect on)
                 └─ React setState → UI 重渲染
```

---

## 8. 项目运行方式

### 环境要求

- Node.js >= 18
- npm >= 8.5.2
- Android Studio + Android SDK（构建 Android）
- JDK 17（RN 0.73 要求）

### 安装依赖

```bash
npm install
```

### 开发调试

```bash
# 1. 启动 Metro 打包服务
npm start
# 或清除缓存启动
npm run sc

# 2. 编译并安装到 Android 设备/模拟器
npm run dev
# 等价于 react-native run-android --active-arch-only

# iOS（官方暂不支持，但工程存在）
npm run ios
```

### 调试辅助

```bash
npm run lint          # ESLint 检查
npm run lint:fix      # 自动修复
npm run rd            # 启动 React DevTools
npm run menu          # 触发 Android 菜单键（摇一摇替代）
```

### 生成主题

```bash
npm run build:theme   # 运行 src/theme/themes/createThemes.js
```

---

## 9. 构建与发布

### Android 打包

```bash
# Debug 包
cd android && ./gradlew assembleDebug

# Release 包（需要签名配置）
npm run pack:android
# 或
cd android && gradlew.bat assembleRelease
```

清理构建缓存：

```bash
npm run clear         # gradlew clean
npm run clear:full    # git clean -fdx（保留签名文件）
```

### 发布流程

`publish/` 目录包含发布脚本：

- `publish/index.js` — 主发布脚本
- `publish/utils/parseChangelog.js` — 解析 `CHANGELOG.md`
- `publish/utils/updateChangeLog.js` — 更新日志
- `publish/version.json` — 版本信息
- `publish/changeLog.md` — 发布日志

执行 `npm run publish` 触发发布流程。

### CI/CD

`.github/workflows/`：

- `build-test.yml` — 构建测试
- `beta-pack.yml` — Beta 包打包
- `release.yml` — 正式发布
- `publish-version-info.yml` — 发布版本信息

---

## 附录：关键文件速查表

| 模块 | 关键文件 |
|------|----------|
| 应用入口 | [app.ts](file:///workspace/src/app.ts) |
| 初始化编排 | [core/init/index.ts](file:///workspace/src/core/init/index.ts) |
| 播放器编排 | [core/player/player.ts](file:///workspace/src/core/player/player.ts) |
| 播放能力封装 | [plugins/player/index.ts](file:///workspace/src/plugins/player/index.ts) |
| 音乐资源路由 | [core/music/index.ts](file:///workspace/src/core/music/index.ts) |
| 多平台 SDK | [utils/musicSdk/index.js](file:///workspace/src/utils/musicSdk/index.js) |
| 事件基类 | [event/Event.ts](file:///workspace/src/event/Event.ts) |
| 应用事件 | [event/appEvent.ts](file:///workspace/src/event/appEvent.ts) |
| 播放器状态 | [store/player/state.ts](file:///workspace/src/store/player/state.ts) |
| 播放器 action | [store/player/action.ts](file:///workspace/src/store/player/action.ts) |
| 主题状态 | [store/theme/state.ts](file:///workspace/src/store/theme/state.ts) |
| 存储封装 | [plugins/storage.ts](file:///workspace/src/plugins/storage.ts) |
| 同步客户端 | [plugins/sync/client/index.ts](file:///workspace/src/plugins/sync/client/index.ts) |
| 导航注册 | [navigation/registerScreens.tsx](file:///workspace/src/navigation/registerScreens.tsx) |
| 常量定义 | [config/constant.ts](file:///workspace/src/config/constant.ts) |
| 默认设置 | [config/defaultSetting.ts](file:///workspace/src/config/defaultSetting.ts) |
| 全局类型 | [types/app.d.ts](file:///workspace/src/types/app.d.ts) |

---

*文档基于 `lx-music-mobile` v1.8.4 源码生成，最后更新：2026-09-08。*
