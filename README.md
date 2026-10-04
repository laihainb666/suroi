<div align="center">
  <img src="client/public/img/backgrounds/github_background.png" alt="Suroi">
  <hr>
</div>

<div align="center">
  <img src="https://img.shields.io/badge/bun-%23f472b6.svg?style=for-the-badge&logo=bun&logoColor=white">
  <img src="https://img.shields.io/badge/typescript-%233178C6?style=for-the-badge&logo=typescript&logoColor=white">
  <img src="https://img.shields.io/badge/pixijs-%23e22162.svg?style=for-the-badge">
  <img src="https://img.shields.io/badge/vite-%235468FF.svg?style=for-the-badge&logo=vite&logoColor=white">
  <img src="https://img.shields.io/badge/html-%23E34F26?style=for-the-badge&logo=html5&logoColor=white">
  <img src="https://img.shields.io/badge/scss-%23CC6699?style=for-the-badge&logo=sass&logoColor=white">
  <br>
  <img src="https://img.shields.io/github/stars/HasangerGames/suroi?style=for-the-badge&logo=github">
  <img src="https://img.shields.io/github/package-json/v/HasangerGames/suroi?style=for-the-badge">
  <img src="https://img.shields.io/github/actions/workflow/status/HasangerGames/suroi/ci.yml?style=for-the-badge">
</div>

## About
Suroi is an open-source 2D battle royale game inspired by [surviv.io](https://survivio.fandom.com/wiki/Surviv.io_Wiki). It is currently a work in progress.

## Play the game!
[suroi.io](https://suroi.io)

## Donate!
Any amount helps! All donation money goes towards the game directly.

[ko-fi.com/suroi](https://ko-fi.com/suroi)

## Join the Discord!
[discord.suroi.io](https://discord.suroi.io)

## Installation and setup
Start by installing [Git](https://git-scm.com/) and [Bun](https://bun.sh).

Use the following command to clone the repo:
```sh
git clone https://github.com/HasangerGames/suroi.git
```

Enter the newly created `suroi` directory with this command:
```sh
cd suroi
```

Finally, run this command in the `suroi` directory to install dependencies:
```sh
bun install
```

## Development
To start the game locally, run the following command in the project root:

```sh
bun dev
```
Or, to see output from the server and client separately, you can use the `bun dev:server` and `bun dev:client` commands. (Both must be running simultaneously for the game to work.)

To open the game, go to http://127.0.0.1:3000 in your browser.

## Production
To build the client for production, run this command in the project root:
```sh
bun build:client
```

To start the game server, run this command:
```sh
bun start
```

Production builds are served using [NGINX](https://nginx.org). Visit [the wiki](https://github.com/HasangerGames/suroi/wiki/Self%E2%80%90hosting) for details on how to self-host.


---

## Private Server Additions (laihainb666/suroi)

This fork adds GM tools & multiplayer enhancements on top of upstream Suroi.

### GM Tools (server plugins)
Enable plugins in `server/config.json` (`plugins` array). The GM identity comes from `roles` entries marked `isDev: true` (e.g. `developr`, `hasanger`, `pap`).

| Plugin | Description |
|---|---|
| `gmToolsPlugin` | All-in-one GM tool, triggered via emote wheel (GM only): Troll Face = toggle invincibility; Fire = full heal; Heart = random gun; Thumbs Up = airdrop at self; Question Mark = 12x speed; Pog = drop all weapons; Wave = teleport to map center; Skull = full tactical gear. Map ping = teleport to ping (GM only). |
| `killRewardPlugin` | Multiplayer quality-of-life: killer's active weapon ammo refills instantly after a kill. |
| `placeObjectPlugin` | (dev) Spawn column obstacles. |
| `teleportPlugin` | (dev) Teleport any player on map ping. |
| `speedTogglePlugin` | (dev) Toggle 12x speed on emote. |
| `juggernautPlugin` | First player becomes a juggernaut; title transfers on death. |
| `weaponSwapPlugin` | Kills replace the killer's weapon with a random one + refill ammo. |

### Security fix
`processDebugPacket` is now gated behind `isDev` — regular clients can no longer send the debug packet to enable god mode / no-clip / speed hacks. Only GM roles can use the in-game debug menu.

### Multiplayer notes
- Rooms: Bun cluster workers, one game per worker (`GameContainer` in `gameManager.ts`), `/play` route upgrades WebSocket with role / isDev metadata.
- Suggested GM workflow: connect with an `isDev` role (`/play?role=developr&password=developr&...` per role parsing), open the debug menu (backtick key by default) for sliders, and use emotes / map pings for plugin commands.
