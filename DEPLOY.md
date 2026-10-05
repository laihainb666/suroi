# SUROI · 联机增强服务器版

> 基于 [HasangerGames/suroi](https://github.com/HasangerGames/suroi) v0.30.5 的私有服务器分支。
> 保留上游全部玩法，新增 **8 个服务端插件**、**两个调试系统对公众开放**、以及面向公开部署的配置。

这是**多人联机**版本 —— 数十名玩家同场竞技，不是单机。

---

## 相比上游的改动

### 1. 修掉 fork 里已经失效的代码

上游在小版本之间做了不兼容的 API 迁移，原 fork 的插件代码停留在旧 API 上，
**编译不过、且部分功能从未真正生效**。本版本逐一修正：

| 问题 | 上游变更 | 修正 |
|---|---|---|
| Perk 调用方式 | 改为 `PerkIds.X` 枚举 | 全部 7 处改为枚举 |
| 血量常量 | `GameConstants.player.health` → `defaultHealth` | 已改 |
| Badge ID | `"fire"` → `"bdg_fire"`（加 `bdg_` 前缀） | 11 处全部重映射 |
| 相对 import | `../../../common/src/utils/math` 依赖目录层级 | 改用 `@common/` 别名 |
| switch 贯穿 | `Throwable` 分支缺 `break` | 已补 |
| 未初始化变量 | 缺 `default` 分支导致 `item` 可能未赋值 | 已补 |
| 上游自身 bug | `hasPerk("extended_mags")` 用了裸字符串 | 改为 `PerkIds.ExtendedMags` |

> 原 fork 的 GM 工具里 `troll_face` / `heart` / `pog` / `wave` / `skull` 这几个
> emote id 在 v0.30.5 中**根本不存在**，对应功能实际上从未触发过。

### 2. 两个调试系统全部开放

上游的调试功能有两道锁：`DEBUG_CLIENT` 编译期常量 + `isDev` 运行时判定，
导致**只有 config.json 里 `isDev: true` 的角色**才能用。本版本改为配置驱动：

```jsonc
{
  "allowPublicDebugMenu": true,   // 调试菜单 + 控制台，默认对所有玩家开放
  "gmToolsPublic": true            // GM 工具（无敌/刷枪/空投/传送），默认对所有玩家开放
}
```

改成 `false` 即恢复为「仅 GM 可用」，无需改代码。

**玩家侧使用方式**
- **调试菜单**（浮动窗口）：反引号键 `` ` `` 打开。含速度、缩放、无敌、层切换、
  刷枪、刷假人等。
- **控制台**（命令台）：反引号键打开。支持 `cv_*` 变量与大量命令，
  例如 `db_invulnerable true`、`noclip`、`map normal`、`spawn mg5`。

### 3. 插件清单

| 插件 | 功能 |
|---|---|
| `juggernautPlugin` | **巨人模式**：首个进场玩家成为巨人，2 倍血 + 满配 MG5/Negev，免疫他人伤害；死亡后由击杀者继任，可无限传递 |
| `killRewardPlugin` | 击杀后立即补满当前武器弹匣 |
| `weaponSwapPlugin` | 击杀后随机替换手中武器并补弹 |
| `gmToolsPlugin` | GM 工具集（见下表，公开可用） |
| `multiplayerEnhancementsPlugin` | 首杀奖励、压制播报、输入活跃度统计 |
| `placeObjectPlugin` | （开发用）放置柱子障碍物，攻击时输出坐标便于调地图 |
| `speedTogglePlugin` | （开发用）切换 12 倍速 |
| `teleportPlugin` | （开发用）传送到任意地图标记处 |

**GM 工具触发方式**（普通表情即可）：

| 表情 badge | 功能 |
|---|---|
| `bdg_fire` 🔥 | 满血 + 满肾上腺素 |
| `bdg_developr` 🛠 | 随机枪械 |
| `bdg_donatr` 💛 | 随机近战 |
| `bdg_moderatr` 🛡 | 随机投掷物 ×3 |
| `bdg_bleh` 🩹 | 随机治疗品 ×2 |
| `bdg_ownr` 👑 | 一键满配（战术护甲 + 战术背包 + MG5 + Negev） |
| `bdg_suroi_logo` 🏆 | 空投到脚下 |
| `bdg_colon_three` 3️⃣ | 切换无敌 |
| `bdg_duel` ⚔ | 清空武器 |
| `bdg_suroi_general_chat` 💬 | 传送到地图中心 |
| `bdg_aegis_logo` 🛡 | 切换 8 倍速 |
| 地图标记 | 传送到标记处 |

### 4. 联机配置面向公开部署重写

`server/config.json` 已按公网部署调好：

- `hostname: "0.0.0.0"` —— 监听所有网卡，不再只绑 127.0.0.1
- **动态地图缩放**：< 20 人地图 ×0.75，20–49 人 ×1.0，50+ 人 ×1.25
- `minTeamsToStart: 1` —— 1 人即可开局，避免空房等待
- **反滥用**：`maxSimultaneousConnections: 16`、10 秒内最多 12 次加入尝试、
  最多 4 个自建房间
- **用户名过滤**：基础脏词过滤（注意用 JS 正则语法，不要写 PCRE 的 `(?i)`）
- 保留上游全部角色权限系统

---

## 快速开始

### 环境要求

- [Bun](https://bun.sh) ≥ 1.2（**必须用 Bun**，项目用了 bun workspace + Bun 特有 API）
- 端口 8000（主服务）与 8001+（每个游戏进程）

### 开发模式

```bash
bun install

# 终端 1：服务端
bun dev:server

# 终端 2：客户端
bun dev:client
```

打开 http://127.0.0.1:3000

### 生产模式

```bash
# 构建客户端
bun run build:client

# 启动服务端
bun start
```

生产环境建议用 NGINX 反代（上游仓库 `server/nginx.conf` 有模板），
并把 `ipHeader` 设为 `X-Real-IP`，否则反代后所有玩家会被判定为同一 IP
而触发连接数限制。

### Windows 注意

`bun x --bun vite build` 在部分 Windows 版本上会 segfault，
改用 Node 跑 vite：

```bash
cd client
node ../node_modules/vite/bin/vite.js build
```

---

## 配置参考

`server/config.schema.json` 是带校验的完整 schema。新增字段：

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `allowPublicDebugMenu` | boolean | `true` | 调试菜单 + 控制台是否对所有玩家开放 |
| `gmToolsPublic` | boolean | `true` | GM 工具是否对所有玩家开放 |
| `multiplayerEnhancements` | object | 全开 | 联机增强插件的开关 |
| `multiplayerEnhancements.firstBloodBonus` | boolean | `true` | 首杀奖励 50% 肾上腺素 |
| `multiplayerEnhancements.revengeTracking` | boolean | `true` | 同一目标 2 杀时记日志 |

关掉调试能力：把前两项设为 `false`，或构建时 `DEBUG_CLIENT=false`。

---

## 关于「所有人可用」的取舍

调试菜单默认全开意味着**任何玩家都能开无敌和 12 倍速**。这是按需求开放的，
适合内测服 / 社区服。如果要开公网运营，建议：

1. `allowPublicDebugMenu` 保持 `false`，只开 `gmToolsPublic` 的部分能力；
2. 或保留全开，但在 NGINX 层加连接频率限制；
3. `gmToolsPublic` 建议保留 —— 它提供的刷枪/空投/传送反而是社区服的乐趣来源，
   而真正的作弊向量（无敌、变速）都在 `allowPublicDebugMenu` 那侧。

---

## 许可与致谢

- 上游：[HasangerGames/suroi](https://github.com/HasangerGames/suroi)，GPL-3.0
- 本分支沿用 GPL-3.0，保留了原项目的完整许可声明。
- 官方在线版：https://suroi.io ｜ Discord：https://discord.suroi.io
