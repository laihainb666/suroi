import Cluster from "node:cluster";
import { URLSearchParams } from "node:url";
import { GameConstants, TeamMode } from "@common/constants";
import { Badges } from "@common/definitions/badges";
import { Skins } from "@common/definitions/items/skins";
import { CustomTeamMessage, PunishmentMessage } from "@common/typings";
import os from "os";
import { version } from "../../package.json";
import { GameManager } from "./gameManager";
import { CustomTeam, CustomTeamPlayer, CustomTeamPlayerContainer } from "./team";
import { Config } from "./utils/config";
import { Maps } from "./data/maps";
import { cleanUsername } from "./utils/misc";
import { corsHeaders, getIP, getPunishment, getSearchParams, parseRole, RateLimiter, serverError, serverLog } from "./utils/serverHelpers";

let customTeams: Map<string, CustomTeam> | undefined;
let teamsCreated: RateLimiter | undefined;

export function resetTeams(): void {
    if (!customTeams) return;

    for (const team of customTeams.values()) {
        for (const player of team.players) player.socket?.close();
    }
    customTeams.clear();
    teamsCreated?.reset();
}

declare global {
    var initialSetupComplete: boolean | undefined
}

//
// Code for
//
// const name = "infection";
// const mapDef = Maps[name];
// console.log(
//     getReachableBuildings(mapDef)
//         .map(o => `public/img/game/buildings/${o.idString}`)
//         .sort()
//         .join("\n")
// );
// console.log(
//     Array.from(new Set([
//         ...[
//             ...Object.keys(mapDef.obstacles ?? {}),
//             ...Object.keys(mapDef.rivers?.obstacles ?? {}),
//             ...(mapDef.obstacleClumps ?? []).flatMap(c => c.clump.obstacles),
//         ].map(o => Obstacles.fromString(o)),
//         ...getReachableObstacles(mapDef, getReachableBuildings(mapDef))
//     ]))
//         .filter(o => !o.wall && !o.invisible)
//         .map(o => `public/img/game/obstacles/${o.idString}`)
//         .sort()
//         .join("\n")
// );

if (Cluster.isPrimary && require.main === module) {
    //                   ^^^^^^^^^^^^^^^^^^^^^^^ only starts server if called directly from command line (not imported)

    // Cleans up workers from previous runs if the process is hot reloaded
    for (const worker of Object.values(Cluster.workers ?? {})) {
        worker?.kill();
    }

    const gameManager = new GameManager();

    // Prevents multiple loops from piling up if the process is hot reloaded
    if (!globalThis.initialSetupComplete) {
        let exiting = false;
        const exit = (): void => {
            if (exiting) return;
            exiting = true;
            serverLog("Shutting down...");
            for (const game of gameManager.games) {
                game?.worker.kill();
            }
            process.exit();
        };
        process.on("exit", exit);
        process.on("SIGINT", exit);
        process.on("SIGTERM", exit);
        process.on("SIGUSR2", exit);

        process.on("uncaughtException", e => {
            serverError("An unhandled error occurred. Details:", e);
            for (const game of gameManager.games) {
                game?.worker.kill();
            }
            process.exit(1);
        });

        setInterval(() => {
            const memoryUsage = process.memoryUsage().rss;

            let perfString = `RAM usage: ${Math.round(memoryUsage / 1024 / 1024 * 100) / 100} MB`;

            // windows L
            if (os.platform() !== "win32") {
                const load = os.loadavg().join("%, ");
                perfString += ` | CPU usage (1m, 5m, 15m): ${load}%`;
            }

            serverLog(perfString);

            gameManager.updateMapScaleRange();
        }, 60000);
    }
    globalThis.initialSetupComplete = true;

    customTeams = new Map<string, CustomTeam>();

    teamsCreated = Config.maxCustomTeams
        ? new RateLimiter(Config.maxCustomTeams)
        : undefined;

    Bun.serve<CustomTeamPlayerContainer>({
        hostname: Config.hostname,
        port: Config.port,
        routes: {
            "/api/serverInfo": async(req: Bun.BunRequest, res: Bun.Server<CustomTeamPlayerContainer>) => {
                let punishment: PunishmentMessage | undefined;
                if (new URLSearchParams(req.url.slice(req.url.indexOf("?"))).get("checkPunishments") === "true") {
                    punishment = await getPunishment(getIP(req, res));
                }

                const { playerCount, teamMode, map, mode, nextMode } = gameManager;

                return Response.json({
                    protocolVersion: GameConstants.protocolVersion,
                    playerCount,
                    teamMode: teamMode.current,
                    nextTeamMode: teamMode.next,
                    teamModeSwitchTime: teamMode.nextSwitch ? teamMode.nextSwitch - Date.now() : undefined,
                    mode,
                    nextMode,
                    modeSwitchTime: map.nextSwitch ? map.nextSwitch - Date.now() : undefined,
                    punishment
                }, corsHeaders);
            },
            "/api/getGame": async(req: Bun.BunRequest) => {
                let gameID: number | undefined;
                const searchParams = getSearchParams(req);
                const roomParam = searchParams.get("room");
                const teamID = gameManager.teamMode.current !== TeamMode.Solo && searchParams.get("teamID");
                if (roomParam !== null) {
                    // 二创：房间号快捷加入 —— 直接进指定房间，不存在/已结束则临时开一间
                    const roomID = Number.parseInt(roomParam, 10);
                    const maxGames = Config.maxGames ?? 1;
                    if (!Number.isInteger(roomID) || roomID < 0 || roomID >= maxGames) {
                        return Response.json(
                            { success: false, error: `房间号无效，当前可输入 0 ~ ${maxGames - 1}` },
                            corsHeaders
                        );
                    }
                    gameID = (await gameManager.requestRoom(roomID)) ? roomID : undefined;
                } else if (teamID) {
                    gameID = customTeams?.get(teamID)?.gameID;
                } else {
                    gameID = await gameManager.findGame();
                }

                return Response.json(
                    gameID !== undefined
                        ? { success: true, gameID, mode: gameManager.mode }
                        : { success: false, error: "该房间暂时无法加入，换个房间号试试" },
                    corsHeaders
                );
            },
            // 二创：房间列表，供客户端「房间号快捷加入」面板显示
            "/api/rooms": async() => {
                return Response.json(
                    {
                        success: true,
                        maxGames: Config.maxGames ?? 1,
                        rooms: gameManager.getRoomsSnapshot()
                    },
                    corsHeaders
                );
            },
            // 二创：地图管理接口，供客户端「本地开局」菜单与调试入口切图
            "/api/admin/map": async() => {
                return Response.json(
                    { ok: true, map: gameManager.map.current, nextMap: gameManager.map.next ?? null },
                    corsHeaders
                );
            },
            "/api/admin/switchmap": async(req: Bun.BunRequest) => {
                if (req.method !== "POST") {
                    return Response.json({ ok: false, error: "仅支持 POST" }, corsHeaders);
                }

                let body: { map?: string, token?: string };
                try {
                    body = await req.json() as { map?: string, token?: string };
                } catch {
                    return Response.json({ ok: false, error: "请求体不是合法 JSON" }, corsHeaders);
                }

                if (body.token !== (Config.adminToken ?? "su031dev")) {
                    return Response.json({ ok: false, error: "管理令牌无效" }, corsHeaders);
                }

                const map = body.map?.split(":")[0];
                if (typeof map !== "string" || !(map in Maps)) {
                    return Response.json({ ok: false, error: `未知地图：${body.map ?? ""}` }, corsHeaders);
                }

                const switched = gameManager.switchMap(map);
                return Response.json(
                    {
                        ok: true,
                        switched,
                        map,
                        mode: gameManager.mode,
                        message: switched
                            ? `已切换到地图 ${map}，当前对局已结束，重新进入即可`
                            : `当前已是地图 ${map}`
                    },
                    corsHeaders
                );
            },
            "/team": async(req: Bun.BunRequest, res: Bun.Server<CustomTeamPlayerContainer>) => {
                const ip = getIP(req, res);
                const searchParams = getSearchParams(req);
                let punishmentMessage: string | undefined;

                // Prevent connection if it's solos + check rate limits & punishments
                if (
                    gameManager.teamMode.current === TeamMode.Solo
                    || teamsCreated?.isLimited(ip)
                    || (punishmentMessage = (await getPunishment(ip))?.message) && punishmentMessage !== "noname"
                ) {
                    return new Response("403 Forbidden");
                }

                // Get team
                const teamID = searchParams.get("teamID");
                let team: CustomTeam;
                if (teamID !== null) {
                    const givenTeam = customTeams?.get(teamID);
                    if (!givenTeam || givenTeam.locked || givenTeam.players.length >= (gameManager.teamMode.current as number)) {
                        return new Response("403 Forbidden"); // TODO "Team is locked" and "Team is full" messages
                    }
                    team = givenTeam;
                } else {
                    team = new CustomTeam(gameManager);
                    customTeams?.set(team.id, team);
                }

                // Get name, skin, badge, & role
                const name = punishmentMessage === "noname" ? GameConstants.player.defaultName : cleanUsername(searchParams.get("name"));
                let skin = searchParams.get("skin") ?? GameConstants.player.defaultSkin;
                let badge = searchParams.get("badge") ?? undefined;
                const { role = "", nameColor } = parseRole(searchParams);

                // Validate skin
                const skinDefinition = Skins.fromStringSafe(skin);
                const rolesRequired = skinDefinition?.rolesRequired;
                if (!skinDefinition || (rolesRequired && !rolesRequired.includes(role))) {
                    skin = GameConstants.player.defaultSkin;
                }

                // Validate badge
                const badgeDefinition = badge ? Badges.fromStringSafe(badge) : undefined;
                if (!badgeDefinition || (badgeDefinition.roles && !badgeDefinition.roles.includes(role))) {
                    badge = undefined;
                }

                // Upgrade the connection
                res.upgrade(req, {
                    data: { player: new CustomTeamPlayer(ip, team, name, skin, badge, nameColor) }
                });
            }
        },
        websocket: {
            idleTimeout: 960,
            open(socket: Bun.ServerWebSocket<CustomTeamPlayerContainer>) {
                const { player } = socket.data;
                player.socket = socket;
                player.team.addPlayer(player);
            },

            message(socket: Bun.ServerWebSocket<CustomTeamPlayerContainer>, message: Buffer<ArrayBuffer>) {
                try {
                    const { player } = socket.data;
                    void player.team.onMessage(player, JSON.parse(String(message)) as CustomTeamMessage);
                } catch (e) {
                    serverError("Error parsing team socket message. Details:", e);
                }
            },

            close(socket: Bun.ServerWebSocket<CustomTeamPlayerContainer>) {
                const { player } = socket.data;
                const team = player.team;
                team.removePlayer(player);
                if (!team.players.length) {
                    customTeams?.delete(team.id);
                }
                teamsCreated?.decrement(player.ip);
            }
        }
    });

    process.stdout.write("\x1Bc"); // clears screen
    serverLog(`Suroi Server v${version}`);
    serverLog(`Listening on ${Config.hostname}:${Config.port}`);
    serverLog("Press Ctrl+C to exit.");

    void gameManager.newGame(0);
}
