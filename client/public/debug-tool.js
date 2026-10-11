/* =====================================================================
 * Suroi Debug Tool (脚本接口 / script-only API)
 * 属于「suroi 二创 调试器扩展」项目。
 * 不依赖游戏内置调试菜单：任意页面引入本文件后，在 DevTools 控制台里
 * 直接用 SD.xxx() 调试。先 SD.help() 看全部命令。
 * 依赖：client 已暴露 window.SuroiDebug（game.ts 中无条件暴露）。
 * ===================================================================== */
(function () {
    "use strict";
    const ZH = (window.SUROI_DEBUG_LANG !== "en");

    function D() { return window.SuroiDebug; }
    function gc() { const d = D(); return d && d.GameConsole; }
    function warn(msg) { console.warn("[SD] " + msg); }

    function getV(k) { const c = gc(); return c ? c.getBuiltInCVar(k) : undefined; }
    function setV(k, v) { const c = gc(); if (c) c.setBuiltInCVar(k, v); }

    function baseSpeed() {
        const d = D();
        const v = d && d.GameConstants && d.GameConstants.player && d.GameConstants.player.baseSpeed;
        return typeof v === "number" ? v : 0.03;
    }
    function baseZoom() {
        const d = D();
        const v = d && d.DEFAULT_SCOPE && d.DEFAULT_SCOPE.zoomLevel;
        return typeof v === "number" ? v : 70;
    }

    /** 只发送服务端认识的字段，避免 undefined 覆盖 */
    function send(extra) {
        const d = D();
        if (!d || !d.Game) { warn("对局未就绪：进入一局后再调用"); return false; }
        const speed = getV("db_speed_override");
        const p = {
            type: d.PacketType.Debug,
            speed: typeof speed === "number" ? speed : baseSpeed(),
            overrideZoom: !!getV("db_override_zoom"),
            zoom: typeof getV("db_zoom_override") === "number" ? getV("db_zoom_override") : baseZoom(),
            noClip: !!getV("db_no_clip"),
            invulnerable: !!getV("db_invulnerable"),
            layerOffset: 0,
            spawnDummy: false
        };
        if (extra) for (const k in extra) p[k] = extra[k];
        try { d.Game.sendPacket(d.DebugPacket.create(p)); return true; }
        catch (e) { warn("发包失败: " + e.message); return false; }
    }

    window.SD = {
        /** 显示全部命令 */
        help() {
            const lines = [
                "SD.speed(v)         移速覆盖（原版 " + baseSpeed() + "，建议 0.03~0.3）",
                "SD.zoom(v)          视野缩放（原版 " + baseZoom() + "，越大越远）",
                "SD.god(on=true)     无敌",
                "SD.noclip(on=true)  穿墙",
                "SD.ceil(on=true)    隐藏天花板",
                "SD.hit(on=true)     碰撞盒总开关（可按类型细分，见下）",
                "SD.hitType(name,on) db_show_hitboxes_ 子项：players/obstacles/stairs/loot/buildings/buildings_ceilings/synced_particles/terrain",
                "SD.perf(name,on)    性能面板：pf_show_fps/pf_show_ping/pf_show_pos/pf_show_inout/pf_net_graph(0~2)",
                "SD.spawn(id,n=1)    生成物品，如 SD.spawn('mosin_nagant',2)",
                "SD.kit('god'|'ammo'|'heal')  快捷套装",
                "SD.dummy(vest,helmet)  生成假人，可带护甲 id",
                "SD.layer(n)         渲染层级偏移（相对累加，int8）",
                "SD.cv(name,value)   读写任意 cvar",
                "SD.cmd('...')       等价游戏内 ~ 控制台命令",
                "SD.dev()            设为开发者身份（调试包生效前提）",
                "SD.info()           打印对局信息",
                "SD.loots(kw)        搜索物品 id（含中文名）",
                "SD.reset()          全部恢复默认",
                "SD.state()          打印当前调试状态"
            ];
            console.log("%c[SuroiDebug 脚本接口]" + (ZH ? "" : " (script API)"), "font-weight:bold;color:#2f6fd0");
            for (const l of lines) console.log("  " + l);
            return lines;
        },

        speed(v) {
            if (typeof v !== "number") return getV("db_speed_override");
            setV("db_speed_override", v); send(); return v;
        },
        zoom(v) {
            if (typeof v !== "number") return getV("db_zoom_override");
            setV("db_override_zoom", true); setV("db_zoom_override", v); send(); return v;
        },
        god(on = true) { setV("db_invulnerable", !!on); send(); return !!on; },
        noclip(on = true) { setV("db_no_clip", !!on); send(); return !!on; },
        ceil(on = true) { setV("db_hide_ceilings", !!on); return !!on; },
        hit(on = true) { setV("db_show_hitboxes", !!on); return !!on; },
        hitType(name, on = true) { setV("db_show_hitboxes_" + name, !!on); return name + "=" + !!on; },
        perf(name, v = true) { setV(name.indexOf("pf_") === 0 ? name : "pf_" + name, v); return name + "=" + v; },

        spawn(id, n = 1) {
            const d = D();
            if (!d) { warn("SuroiDebug 未就绪"); return 0; }
            if (!d.Loots.hasString(id)) { warn("未知物品 id: " + id + "（用 SD.loots() 搜索）"); return 0; }
            let ok = 0;
            for (let i = 0; i < n; i++) if (send({ spawnLootType: d.Loots.fromString(id) })) ok++;
            console.log("[SD] spawned " + id + " ×" + ok);
            return ok;
        },
        kit(name) {
            const kits = {
                god: ["tactical_vest", "tactical_helmet", "tactical_pack", "mosin_nagant", "deagle", "762mm", "556mm", "gauze", "medikit", "cola"],
                ammo: ["762mm", "556mm", "9mm", "12g", "545mm"],
                heal: ["gauze", "medikit", "cola", "tablets"]
            };
            const k = kits[name];
            if (!k) { warn("套装只有: " + Object.keys(kits).join(" / ")); return 0; }
            let n2 = 0;
            for (const id of k) n2 += this.spawn(id, 1);
            return n2;
        },
        dummy(vest, helmet) {
            const d = D();
            if (!d) { warn("SuroiDebug 未就绪"); return false; }
            const extra = { spawnDummy: true };
            if (vest) extra.dummyVest = d.Armors.fromStringSafe(vest);
            if (helmet) extra.dummyHelmet = d.Armors.fromStringSafe(helmet);
            return send(extra);
        },
        layer(n) { return send({ layerOffset: n | 0 }); },

        cv(name, value) {
            if (value === undefined) return getV(name);
            setV(name, value); return value;
        },
        cmd(q) {
            const c = gc();
            if (!c) { warn("GameConsole 未就绪"); return false; }
            try { c.handleQuery(q, "never"); console.log("[SD] > " + q); return true; }
            catch (e) { warn("命令失败: " + e.message); return false; }
        },
        dev() {
            setV("dv_role", "香蕉LAN");
            setV("dv_password", "LAN666");
            try {
                localStorage.setItem("suroi_dv_role", "香蕉LAN");
                localStorage.setItem("suroi_dv_password", "LAN666");
            } catch (e) { /* ignore */ }
            console.log("[SD] 已设为开发者身份（香蕉LAN / LAN666），请退出并重新进入对局");
            return true;
        },
        info() {
            const d = D(), g = d && d.Game;
            if (!g) { warn("对局未开始"); return null; }
            const o = {};
            try { o.mode = g._modeName || (g.game && g.game.gameMode); } catch (e) { /* ignore */ }
            try { o.playerID = g.activePlayerID; } catch (e) { /* ignore */ }
            try { o.teamMode = !!g.isTeamMode; o.teamID = g.teamID; } catch (e) { /* ignore */ }
            try { o.started = !!g.gameStarted; o.over = !!g.gameOver; } catch (e) { /* ignore */ }
            try {
                const p = g.players || (g.game && g.game.players);
                if (p && typeof p.length === "number") o.players = p.length;
            } catch (e) { /* ignore */ }
            console.table ? console.table([o]) : console.log(o);
            return o;
        },
        loots(kw) {
            const d = D();
            if (!d) { warn("SuroiDebug 未就绪"); return []; }
            const src = d.Loots.definitions || d.Loots;
            const k = (kw || "").toLowerCase();
            const out = [];
            for (let i = 0; i < src.length; i++) {
                const o = src[i];
                if (!o || !o.idString) continue;
                let cn = o.name;
                try {
                    const t = d.translate(o.idString);
                    if (t && t !== o.idString) cn = t;
                } catch (e) { /* ignore */ }
                if (k && o.idString.toLowerCase().indexOf(k) < 0 && String(cn).indexOf(kw) < 0) continue;
                out.push(o.idString + "  " + cn);
                if (out.length > 400) break;
            }
            console.log(out.join("\n") || "(无结果)");
            return out;
        },
        reset() {
            const d = D();
            if (!d) { warn("SuroiDebug 未就绪"); return false; }
            const all = d.GameConsole.variables.getAll();
            const keep = { db_speed_override: baseSpeed(), db_zoom_override: baseZoom() };
            for (const k in all) {
                if (k.indexOf("db_") !== 0) continue;
                setV(k, k in keep ? keep[k] : false);
            }
            send({ layerOffset: 0 });
            console.log("[SD] 已恢复默认（移速 " + baseSpeed() + "，缩放 " + baseZoom() + "）");
            return true;
        },
        state() {
            const keys = ["db_speed_override", "db_override_zoom", "db_zoom_override", "db_no_clip",
                "db_invulnerable", "db_hide_ceilings", "db_show_hitboxes"];
            const o = {};
            for (const k of keys) o[k] = getV(k);
            console.table ? console.table([o]) : console.log(o);
            return o;
        }
    };

    console.log("[SD] SuroiDebug 脚本接口已就绪，输入 SD.help() 查看命令");
})();
