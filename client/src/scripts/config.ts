import { type TeamMode } from "@common/constants";
import type { ModeName } from "@common/definitions/modes";

// 页面为 HTTPS 时必须用 wss://，否则浏览器按混合内容拦截 WebSocket（导致 Connection lost）
const wsProto = location.protocol === "https:" ? "wss:" : "ws:";
const httpProto = location.protocol === "https:" ? "https:" : "http:";

// 二创：允许把前端静态文件托管到 GitHub Pages 等外部域名上，
// 由 public/srv.js 里的 window.SUROI_SRV 指定后端主机（隧道域名）。
// 未设置时保持与页面同源，行为与原来完全一致。
declare global { interface Window { SUROI_SRV?: string } }
const backendHost = window.SUROI_SRV ? window.SUROI_SRV : location.host;

export const Config = {
    regions: {
        dev: {
            name: "Public Server",
            mainAddress: window.SUROI_SRV ? `${httpProto}//${backendHost}` : "",
            gameAddress: `${wsProto}//${backendHost}/game/<gameID>`,
            offset: 0
        }/* ,
        na: {
            name: "North America",
            flag: "🇺🇸 ",
            mainAddress: "https://na.suroi.io",
            gameAddress: "wss://na.suroi.io/game/<gameID>",
            offset: 1
        },
        eu: {
            name: "Europe",
            flag: "🇩🇪 ",
            mainAddress: "https://eu.suroi.io",
            gameAddress: "wss://eu.suroi.io/game/<gameID>",
            offset: 1
        },
        sa: {
            name: "South America",
            flag: "🇧🇷 ",
            mainAddress: "https://sa.suroi.io",
            gameAddress: "wss://sa.suroi.io/game/<gameID>",
            offset: 1
        },
        as: {
            name: "Asia",
            flag: "🇭🇰 ",
            mainAddress: "https://as.suroi.io",
            gameAddress: "wss://as.suroi.io/game/<gameID>",
            offset: 1
        },
        oc: {
            name: "Oceania",
            flag: "🇦🇺 ",
            mainAddress: "https://oc.suroi.io",
            gameAddress: "wss://oc.suroi.io/game/<gameID>",
            offset: 1
        } */
    },
    defaultRegion: "dev"
} satisfies ConfigType as ConfigType;

export interface ConfigType {
    readonly regions: Record<string, Region>
    readonly defaultRegion: string
}

export interface Region {
    /**
     * The human-readable name of the region, displayed in the server selector.
     */
    readonly name: string

    /**
     * An emoji flag to display alongside the region name.
     */
    readonly flag?: string

    /**
     * The address of the region's main server.
     */
    readonly mainAddress: string

    /**
     * Pattern used to determine the address of the region's game servers.
     * The string `<gameID>` is replaced by the `gameID` given by the /getGame API, plus {@linkcode offset}.
     * For example, if `gameID` is 0, `gameAddress` is `"wss://na.suroi.io/game/<gameID>"`, and `offset` is 1, the resulting address will be wss://na.suroi.io/game/1.
     */
    readonly gameAddress: string

    /**
     * Number to increment `gameID` by when determining the game address. See {@linkcode gameAddress} for more info.
     */
    readonly offset: number
}

export interface ServerInfo {
    readonly protocolVersion: number
    readonly playerCount: number
    readonly teamMode: TeamMode
    readonly teamModeSwitchTime: number
    readonly mode: ModeName
    readonly modeSwitchTime: number
}
