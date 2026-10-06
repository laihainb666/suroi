# 调试器使用说明（二创扩展）

本项目是 [suroi](https://github.com/HasangerGames/suroi) 的中文二创：公网联机 + 万能调试注入器。
构建产物不随仓库发布，需自行构建：

```bash
DEBUG_CLIENT=true bun run build:client     # 需要 LD_LIBRARY_PATH 指向 libstdc++（容器环境）
```

## 一、菜单式（推荐）

`client/public/debug-injector.js` 是外挂式注入器，不改游戏本体。`client/index.html` 已内置：

```html
<script src="./debug-injector.js" defer></script>
<script>window.SUROI_DEBUG_LANG = "zh";</script>
```

也可以整段贴进浏览器 DevTools 控制台。面板功能：

| 标签 | 内容 |
| --- | --- |
| 玩家 | 移速覆盖（默认=原版 0.03，可一键回默认）、视野缩放、穿墙、无敌、隐藏天花板、渲染层级偏移、**一键恢复全部默认** |
| 显示 | FPS/延迟/坐标/输入输出/网络图表；碰撞盒总开关 + 8 类子项（玩家/障碍/楼梯/掉落/建筑/天花板/同步粒子/地形） |
| 生成 | 中文搜索物品并生成（可指定数量）、快捷套装（神装/弹药/治疗品）、生成假人并选护甲头盔 |
| 对局 | 模式/玩家数/存活/队伍信息、玩家列表、一键设为开发者身份 |
| 资源 | 音效/贴图清单（133 音频 / 2030 贴图），可试听、预览、复制路径 |
| 控制台 | 等价游戏内 `~` 控制台命令输入框 + 全部 cvar 列表（可改） |

## 二、脚本式（不依赖面板）

`client/public/debug-tool.js` 不注册任何 UI，加载后暴露 `SD`：

```js
SD.help()                 // 全部命令
SD.speed(0.1)             // 移速（原版 0.03）
SD.zoom(160)              // 视野缩放（原版 70）
SD.god(1) / SD.noclip(1)  // 无敌 / 穿墙
SD.hit(1) / SD.hitType("players", 1)
SD.spawn("mosin_nagant", 2)
SD.kit("god")             // 神装 / ammo / heal
SD.dummy("tactical_vest", "tactical_helmet")
SD.cmd("cv_player_name = abc")
SD.dev()                  // 设为开发者身份（调试包生效前提）
SD.info() / SD.state() / SD.reset()
```

两种方式都依赖客户端无条件暴露的 `window.SuroiDebug`
（`Game / GameConsole / DebugPacket / PacketType / Loots / Armors / ArmorType / Scopes / DEFAULT_SCOPE / translate / GameConstants`）。

## 三、调试包生效前提

服务端只接受 `isDev` 角色的 Debug 包。默认开发者身份：`香蕉LAN / LAN666`
（设置界面连点标题输入口令，或调用 `SD.dev()`）。服务端角色表见 `server/config.json` 的 `roles`。

## 四、联机

`server/src/gameManager.ts` 的 `findGame()` 已改为**优先塞入存活人数最多且可加入的对局**，
好友一起玩会进同一局（原版为随机分配）。
