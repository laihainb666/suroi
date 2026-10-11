import { ColorStyles, Logger, styleText } from "@common/utils/logging";
import { Cron } from "croner";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { Numeric } from "@common/utils/math";
import { PunishmentMessage } from "@common/typings";
import { Config } from "./config";

export function serverLog(...message: unknown[]): void {
    Logger.log(styleText("[Server]", ColorStyles.foreground.magenta.normal), ...message);
}

export function serverWarn(...message: unknown[]): void {
    Logger.warn(styleText("[Server] [WARNING]", ColorStyles.foreground.yellow.normal), ...message);
}

export function serverError(...message: unknown[]): void {
    Logger.warn(styleText("[Server] [ERROR]", ColorStyles.foreground.red.normal), ...message);
}

export function getSearchParams(req: Bun.BunRequest): URLSearchParams {
    return new URLSearchParams(req.url.slice(req.url.indexOf("?")));
}

export const corsHeaders = {
    headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "origin, content-type, accept, x-requested-with",
        "Access-Control-Max-Age": "3600"
    }
};

export function getIP(req: Bun.BunRequest, res: Bun.Server<unknown>): string {
    return (
        Config.ipHeader
            ? req.headers.get(Config.ipHeader)
            : res.requestIP(req)?.address
    ) ?? "";
}

interface IPCheckResponse {
    readonly flagged: boolean
    readonly message: string
}

interface Punishment {
    readonly id: string
    readonly ip: string
    readonly reportId: string
    readonly reason: string
    readonly reporter: string
    readonly expires?: number
    readonly punishmentType: "warn" | "temp" | "perma" | "noname"
}

export async function getPunishment(ip: string): Promise<PunishmentMessage | undefined> {
    if (!Config.apiServer) return;

    const url = Config.apiServer.url;
    const opts: RequestInit = { headers: { "api-key": Config.apiServer.apiKey } };

    try {
        // Check for VPN/proxy
        const ipCheck = await (
            await fetch(`${url}/ipcheck/${ip}`, opts)
        ).json() as IPCheckResponse;
        if (ipCheck.flagged) {
            return { message: "vpn" };
        }

        // Check punishments
        const punishments = await (
            await fetch(`${url}/punishments/${ip}`, opts)
        ).json() as Punishment[];
        if (Array.isArray(punishments) && punishments.length) {
            const punishment = punishments[0];
            return {
                message: punishment.punishmentType,
                reason: punishment.reason,
                reportID: punishment.reportId
            };
        }
    } catch(e) {
        console.error(e);
    }
}

export function parseRole(searchParams: URLSearchParams): { readonly role?: string, readonly isDev: boolean, readonly nameColor?: number } {
    const password = searchParams.get("password");
    const givenRole = searchParams.get("role");
    let role: string | undefined;
    let isDev = false;
    let nameColor: number | undefined;
    if (
        password !== null
        && givenRole !== null
        && Config.roles
        && givenRole in Config.roles
        && Config.roles[givenRole].password === password
    ) {
        role = givenRole;
        isDev = Config.roles[givenRole].isDev ?? false;

        if (isDev) {
            try {
                const colorString = searchParams.get("nameColor");
                if (colorString) nameColor = Numeric.clamp(parseInt(colorString), 0, 0xffffff);
            } catch { /* guess your color sucks lol */ }
        }
    }
    return { role, isDev, nameColor };
}

export class RateLimiter {
    private _ipMap: Record<string, number> = {};

    constructor(readonly max: number, readonly resetInterval?: number) {
        if (resetInterval) {
            setInterval(() => this._ipMap = {}, resetInterval);
        }
    }

    increment(ip?: string): void {
        if (!ip) return;
        this._ipMap[ip] = (this._ipMap[ip] ?? 0) + 1;
    }

    decrement(ip?: string): void {
        if (!ip) return;
        const val = this._ipMap[ip] = (this._ipMap[ip] ?? 1) - 1;
        if (val < 0) {
            console.warn("Warning: Value in rate limiter dropped below 0, desync likely");
        }
    }

    isLimited(ip?: string): boolean {
        return !!ip && this._ipMap[ip] > this.max;
    }

    reset(): void {
        this._ipMap = {};
    }
}

export type Switchable = string | number;
export interface Switched<T extends Switchable> {
    /**
     * List of items to rotate between.
     * When the end is reached, it will loop back to the beginning.
     */
    readonly rotation: T[]
    /**
     * Cron pattern to use for switching
     */
    readonly cron: string
}
export type StaticOrSwitched<T extends Switchable> = T | Switched<T>;

export class Switcher<T extends Switchable> {
    private readonly _cron: Cron | undefined;

    /** 二创：构造时传入的回调，forceSet 手动切换时复用同一套通知逻辑 */
    private readonly _callback: (current: T, next: T) => void;

    /** 二创：轮换列表（静态配置时为 undefined），forceSet 用于同步索引与下一项 */
    private readonly _rotation: T[] | undefined = undefined;

    private _index = 0;
    get index(): number { return this._index; }

    private _current: T;
    get current(): T { return this._current; }

    private _next: T | undefined;
    get next(): T | undefined { return this._next; }

    get nextSwitch(): number | undefined { return this._cron?.nextRun()?.getTime(); }

    constructor(name: string, schedule: StaticOrSwitched<T>, callback: (current: T, next: T) => void) {
        this._callback = callback;

        if (typeof schedule === "object") {
            this._rotation = schedule.rotation;
            const rotation = schedule.rotation;
            const length = rotation.length;
            const filename = `${name}.txt`;

            this._index = existsSync(filename)
                ? parseInt(readFileSync(filename, "utf8"))
                : 0;

            this._current = rotation[this._index % length];
            this._next = rotation[(this._index + 1) % length];

            this._cron = new Cron(schedule.cron, () => {
                this._current = rotation[++this._index % length];
                this._next = rotation[(this._index + 1) % length];
                writeFileSync(filename, this._index.toString());
                callback(this._current, this._next);
            });
        } else {
            this._current = schedule;
            this._next = undefined;
        }
    }

    /**
     * 二创：立即强制切换到指定值（不等待 cron 排程），并触发与自动轮换相同的回调。
     * 用于管理接口手动切图（/api/admin/switchmap）。
     * @returns 是否发生了变化（值相同则返回 false，不触发回调）
     */
    forceSet(value: T): boolean {
        if (this._current === value) return false;

        this._current = value;

        if (this._rotation) {
            const index = this._rotation.indexOf(value);
            if (index !== -1) {
                this._index = index;
                this._next = this._rotation[(index + 1) % this._rotation.length];
            }
        }

        this._callback(this._current, this._next ?? this._current);
        return true;
    }
}
