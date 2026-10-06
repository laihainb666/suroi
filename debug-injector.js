/* =====================================================================
 * Suroi Universal Debug Injector v2  (万能调试菜单 / 中文优先)
 * 属于「suroi 二创 调试器扩展」项目。
 * 用法 A: <script src="./debug-injector.js" defer></script>（index.html 已内置）
 * 用法 B: 整段贴进浏览器 DevTools 控制台
 * 用法 C: 不装面板，直接用同目录的 debug-tool.js 的 SD.* 脚本接口
 * 语言: 默认中文；?lang=en 或 window.SUROI_DEBUG_LANG="en" 切英文
 * ===================================================================== */
(function () {
    "use strict";
    if (window.__SUROI_INJECTOR__) { console.log("[injector] already installed"); return; }
    window.__SUROI_INJECTOR__ = true;

    const LANGQ = (new URLSearchParams(location.search).get("lang") || "").toLowerCase();
    const ZH = LANGQ ? LANGQ.indexOf("zh") === 0 : window.SUROI_DEBUG_LANG !== "en";

    const S = ZH ? {
        title: "万能调试菜单", fab: "调试器", close: "关闭", min: "最小化",
        tPlayer: "玩家", tVisual: "显示", tSpawn: "生成", tMatch: "对局", tAssets: "资源", tConsole: "控制台", tHelp: "说明",
        speed: "移动速度", zoomOn: "覆盖视野缩放", zoom: "缩放倍率", noClip: "穿墙", invuln: "无敌",
        hideCeil: "隐藏天花板", layer: "渲染层级偏移", up: "上移", down: "下移", layerReset: "归零",
        resetAll: "★ 一键恢复全部默认", reset: "恢复默认", resetDone: "已恢复默认值",
        hitAll: "碰撞盒总开关", hitPlayers: "玩家", hitObs: "障碍物", hitStairs: "楼梯", hitLoot: "掉落物",
        hitBld: "建筑", hitCeil: "建筑天花板", hitSynced: "同步粒子", hitTerrain: "地形",
        allOn: "全开", allOff: "全关",
        perf: "性能 / 网络面板", fps: "FPS", ping: "延迟", pos: "坐标", inout: "输入输出", net: "网络图表",
        spItem: "生成物品", spSearch: "搜索物品（中/英文名或 ID）", spCount: "数量", spawn: "生成",
        spDummy: "生成假人", vest: "护甲", helmet: "头盔", none: "无",
        kit: "快捷套装", kitGod: "一键神装", kitAmmo: "补满弹药", kitHeal: "治疗品全套",
        matchInfo: "对局信息", miGame: "对局", miPlayers: "玩家数", miAlive: "存活", miMode: "模式", miServers: "服务器",
        players: "玩家列表", refresh: "刷新", noPlayers: "暂无玩家信息（需进入对局）",
        devRole: "开发者身份（调试包生效前提）", devBtn: "设为开发者并提示重进", devSet: "已设置身份，请退出并重新进入对局",
        audio: "音效", images: "贴图/图片", copy: "复制路径", copied: "已复制",
        run: "执行", cmd: "控制台命令（等价游戏内 ~ 控制台）", cmdPh: "例如 cv_player_name = abc",
        help1: "本面板是外挂式注入器，不改游戏本体：整段贴进 DevTools 控制台即可用。",
        help2: "调试包只有在「开发者身份」下才会被服务端接受：设置界面连点标题 → 输入口令，或点上方按钮。",
        help3: "纯脚本模式：引入 debug-tool.js 后用 SD.help() 查看全部命令，例如 SD.speed(0.1)、SD.god(1)、SD.spawn(\"mosin\",2)、SD.reset()。",
        lang: "中文 / EN", ready: "就绪", notReady: "未就绪", needGame: "对局未开始：进入一局后调试项才会生效",
        assetsLoading: "资源清单加载中…", assetsFail: "资源清单加载失败", count: "数量",
        speedNow: "当前", defHint: "默认 0.03（原版移速）", noResult: "无结果", done: "成功", failed: "失败"
    } : {
        title: "Universal Debug Menu", fab: "DEV+", close: "Close", min: "Minimize",
        tPlayer: "Player", tVisual: "Visual", tSpawn: "Spawn", tMatch: "Match", tAssets: "Assets", tConsole: "Console", tHelp: "Help",
        speed: "Move Speed", zoomOn: "Override Zoom", zoom: "Zoom", noClip: "No Clip", invuln: "God Mode",
        hideCeil: "Hide Ceilings", layer: "Layer Offset", up: "Up", down: "Down", layerReset: "Reset",
        resetAll: "★ Reset All To Default", reset: "Reset", resetDone: "Defaults restored",
        hitAll: "Hitboxes (master)", hitPlayers: "Players", hitObs: "Obstacles", hitStairs: "Stairs", hitLoot: "Loot",
        hitBld: "Buildings", hitCeil: "Building Ceilings", hitSynced: "Synced Particles", hitTerrain: "Terrain",
        allOn: "All On", allOff: "All Off",
        perf: "Performance / Network", fps: "FPS", ping: "Ping", pos: "Position", inout: "Input/Output", net: "Net Graph",
        spItem: "Spawn Item", spSearch: "Search item (name or ID)", spCount: "Count", spawn: "Spawn",
        spDummy: "Spawn Dummy", vest: "Vest", helmet: "Helmet", none: "None",
        kit: "Quick Kits", kitGod: "Full Loadout", kitAmmo: "Fill Ammo", kitHeal: "Healing Kit",
        matchInfo: "Match Info", miGame: "Game", miPlayers: "Players", miAlive: "Alive", miMode: "Mode", miServers: "Servers",
        players: "Player List", refresh: "Refresh", noPlayers: "No player info yet (join a match)",
        devRole: "Dev identity (required for debug packets)", devBtn: "Set Dev & Rejoin", devSet: "Identity set — leave & rejoin the match",
        audio: "Audio", images: "Images", copy: "Copy path", copied: "Copied",
        run: "Run", cmd: "Console command (same as in-game console)", cmdPh: "e.g. cv_player_name = abc",
        help1: "This is an external injector: it does not modify the game. Paste into DevTools console to use.",
        help2: "Debug packets are only accepted for a dev identity: tap the settings title N times and enter the passcode, or use the button above.",
        help3: "Script-only mode: load debug-tool.js and use SD.help(); e.g. SD.speed(0.1), SD.god(1), SD.spawn(\"mosin\",2), SD.reset().",
        lang: "中文 / EN", ready: "ready", notReady: "not ready", needGame: "Not in a match yet: debug options apply once you join",
        assetsLoading: "Loading asset manifest…", assetsFail: "Failed to load asset manifest", count: "Count",
        speedNow: "now", defHint: "default 0.03 (vanilla speed)", noResult: "no result", done: "ok", failed: "failed"
    };

    function D() { return window.SuroiDebug; }
    function mk(tag, cls, text) {
        const n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text !== undefined) n.textContent = text;
        return n;
    }
    function css(node, obj) { for (const k in obj) node.style[k] = obj[k]; return node; }
    function toast(msg) {
        const t = mk("div", null, msg);
        css(t, { position: "fixed", left: "50%", bottom: "80px", transform: "translateX(-50%)",
            background: "rgba(12,14,18,.94)", color: "#e8f0ff", padding: "8px 14px", borderRadius: "6px",
            font: "13px/1.4 system-ui,sans-serif", zIndex: 999999, border: "1px solid #3a4a63", maxWidth: "80vw" });
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 2000);
    }
    function getV(k) { const d = D(); return d ? d.GameConsole.getBuiltInCVar(k) : undefined; }
    function setV(k, v) { const d = D(); if (d) d.GameConsole.setBuiltInCVar(k, v); }

    // 原版移速常量（common/src/constants.ts: GameConstants.player.baseSpeed）
    function defaultSpeed() {
        const d = D();
        const v = d && d.GameConstants && d.GameConstants.player && d.GameConstants.player.baseSpeed;
        return typeof v === "number" ? v : 0.03;
    }

    // 只发送可能被服务端接受的字段，杜绝 undefined 覆盖服务端值
    function send(extra) {
        const d = D();
        if (!d) { toast(S.needGame); return false; }
        const speed = getV("db_speed_override");
        const zoom = getV("db_zoom_override");
        const p = {
            type: d.PacketType.Debug,
            layerOffset: 0,
            spawnDummy: false
        };
        if (typeof speed === "number") p.speed = speed;
        else p.speed = defaultSpeed();
        if (typeof zoom === "number") p.zoom = zoom;
        p.overrideZoom = !!getV("db_override_zoom");
        p.noClip = !!getV("db_no_clip");
        p.invulnerable = !!getV("db_invulnerable");
        if (extra) for (const k in extra) p[k] = extra[k];
        try { d.Game.sendPacket(d.DebugPacket.create(p)); return true; }
        catch (e) { console.warn("[injector] send failed", e); toast(S.failed); return false; }
    }

    /* ---------------- 默认值 ---------------- */
    // 原版视野缩放档位（common/src/definitions/items/scopes.ts: 1x=70 2x=100 4x=130 8x=160 16x=220）
    function defaultZoom() {
        const d = D();
        const v = d && d.DEFAULT_SCOPE && d.DEFAULT_SCOPE.zoomLevel;
        return typeof v === "number" ? v : 70;
    }
    // 中文名：翻译表 key 即 idString（client/src/translations/zh.hjson）
    function tname(def) {
        const d = D();
        if (!def) return "";
        if (d && typeof d.translate === "function") {
            try {
                const t = d.translate(def.idString);
                if (t && t !== def.idString) return t;
            } catch (e) { /* ignore */ }
        }
        return def.name || def.idString;
    }

    /* ---------------- UI 基础件 ---------------- */
    var panel, body, tabBar, tabs = {}, current = "player";
    var fab;

    function slider(parent, labelTxt, cvar, min, max, step, def, onChange) {
        var row = mk("div", "di-row");
        var lab = mk("label", null, labelTxt + ": ");
        var init = getV(cvar);
        if (typeof init !== "number" || isNaN(init)) init = def;
        var val = mk("span", "di-val", String(init));
        var inp = mk("input");
        inp.type = "range"; inp.min = min; inp.max = max; inp.step = step; inp.value = init;
        inp.oninput = function () {
            val.textContent = inp.value;
            setV(cvar, parseFloat(inp.value));
            if (onChange) onChange();
        };
        var rs = mk("button", "di-mini", "⟲");
        rs.title = S.reset + " (" + def + ")";
        rs.onclick = function () {
            inp.value = def; val.textContent = String(def);
            setV(cvar, def);
            if (onChange) onChange();
            toast(S.reset + ": " + labelTxt + " = " + def);
        };
        lab.appendChild(val);
        lab.appendChild(rs);
        row.appendChild(lab); row.appendChild(inp);
        parent.appendChild(row);
        return inp;
    }
    function check(parent, labelTxt, cvar, onChange, noSend) {
        var row = mk("div", "di-row");
        var lab = mk("label", "di-check");
        var inp = mk("input"); inp.type = "checkbox"; inp.checked = !!getV(cvar);
        inp.onchange = function () {
            setV(cvar, inp.checked);
            if (onChange) onChange();
            else if (!noSend) send();
        };
        lab.appendChild(inp);
        lab.appendChild(mk("span", null, " " + labelTxt));
        row.appendChild(lab);
        parent.appendChild(row);
        return inp;
    }
    function button(parent, text, fn, cls) {
        var b = mk("button", cls || "di-btn", text);
        b.onclick = fn;
        parent.appendChild(b);
        return b;
    }
    function info(parent, text) { return parent.appendChild(mk("div", "di-info", text)); }
    function section(parent, title) {
        parent.appendChild(mk("div", "di-sec", title));
        var b = mk("div", "di-secbody");
        parent.appendChild(b);
        return b;
    }
    function rowOf(parent) {
        var r = mk("div", "di-row");
        parent.appendChild(r);
        return r;
    }

    /* 一键恢复全部默认 */
    function resetAll() {
        var d = D();
        if (!d) { toast(S.needGame); return; }
        var all = d.GameConsole.variables.getAll();
        var keep = { db_speed_override: defaultSpeed(), db_zoom_override: defaultZoom() };
        for (var k in all) {
            if (k.indexOf("db_") !== 0) continue;
            if (k in keep) setV(k, keep[k]);
            else setV(k, false);
        }
        send({ layerOffset: 0 });
        showTab(current);
        toast(S.resetDone);
    }

    function applyMain() { send(); }
    function applyLocal() { /* 纯本地 cvar，无需发包 */ }

    /* ---------------- 各标签页 ---------------- */
    function tabPlayer(root) {
        var s = section(root, S.tabPlayer);
        slider(s, S.speed, "db_speed_override", 0.003, 0.6, 0.003, defaultSpeed(), applyMain);
        info(s, S.defHint);
        check(s, S.zoomOn, "db_override_zoom", applyMain);
        slider(s, S.zoom, "db_zoom_override", 20, 400, 5, defaultZoom(), applyMain);
        check(s, S.noClip, "db_no_clip", applyMain);
        check(s, S.invuln, "db_invulnerable", applyMain);
        check(s, S.hideCeil, "db_hide_ceilings", applyLocal);

        var l = section(root, S.layer);
        var r = rowOf(l);
        rowOf(l);
        var upBtn = mk("button", "di-btn", S.up);
        upBtn.onclick = function () { send({ layerOffset: 1 }); };
        var dnBtn = mk("button", "di-btn", S.down);
        dnBtn.onclick = function () { send({ layerOffset: -1 }); };
        var zBtn = mk("button", "di-btn", S.layerReset);
        zBtn.onclick = function () { send({ layerOffset: 0 }); };
        r.appendChild(upBtn); r.appendChild(dnBtn); r.appendChild(zBtn);

        var rst = section(root, S.resetAll);
        button(rst, S.resetAll, resetAll, "di-btn di-warn");
    }

    function tabVisual(root) {
        var s = section(root, S.perf);
        check(s, S.fps, "pf_show_fps", applyLocal, true);
        check(s, S.ping, "pf_show_ping", applyLocal, true);
        check(s, S.pos, "pf_show_pos", applyLocal, true);
        check(s, S.inout, "pf_show_inout", applyLocal, true);
        check(s, S.net, "pf_net_graph", applyLocal, true);

        var h = section(root, S.hitAll);
        check(h, S.hitAll, "db_show_hitboxes", applyLocal, true);
        var sub = ["players", "obstacles", "stairs", "loot", "buildings", "buildings_ceilings", "synced_particles", "terrain"];
        var names = { players: S.hitPlayers, obstacles: S.hitObs, stairs: S.hitStairs, loot: S.hitLoot,
            buildings: S.hitBld, buildings_ceilings: S.hitCeil, synced_particles: S.hitSynced, terrain: S.hitTerrain };
        for (var i = 0; i < sub.length; i++) {
            check(h, names[sub[i]] || sub[i], "db_show_hitboxes_" + sub[i], applyLocal, true);
        }
        var r = rowOf(h);
        var on = mk("button", "di-btn", S.allOn);
        on.onclick = function () {
            setV("db_show_hitboxes", true);
            for (var j = 0; j < sub.length; j++) setV("db_show_hitboxes_" + sub[j], true);
            showTab("visual");
        };
        var off = mk("button", "di-btn", S.allOff);
        off.onclick = function () {
            setV("db_show_hitboxes", false);
            for (var j2 = 0; j2 < sub.length; j2++) setV("db_show_hitboxes_" + sub[j2], false);
            showTab("visual");
        };
        r.appendChild(on); r.appendChild(off);
    }

    var lootIndex = null;
    function buildLootIndex() {
        if (lootIndex) return lootIndex;
        var d = D();
        if (!d || !d.Loots) return [];
        var src = d.Loots.definitions || d.Loots;
        var arr = [];
        for (var i = 0; i < src.length; i++) {
            var o = src[i];
            if (!o || !o.idString) continue;
            arr.push({ id: o.idString, cn: tname(o), en: o.name || "" });
        }
        lootIndex = arr;
        return arr;
    }
    function kit(ids) {
        var d = D();
        if (!d) { toast(S.needGame); return; }
        var n = 0;
        for (var i = 0; i < ids.length; i++) {
            if (!d.Loots.hasString(ids[i])) continue;
            send({ spawnLootType: d.Loots.fromString(ids[i]) });
            n++;
        }
        toast(n ? (S.done + " ×" + n) : S.failed);
    }

    function tabSpawn(root) {
        var s = section(root, S.spItem);
        var inp = mk("input"); inp.type = "text"; inp.className = "di-input"; inp.placeholder = S.spSearch;
        var cnt = mk("input"); cnt.type = "number"; cnt.min = 1; cnt.max = 30; cnt.value = 1;
        cnt.className = "di-cnt";
        var r0 = rowOf(s);
        var sp = mk("button", "di-btn", S.spawn);
        sp.onclick = function () {
            var d = D();
            if (!d) { toast(S.needGame); return; }
            var id = inp.value.trim();
            if (!id || !d.Loots.hasString(id)) { toast(S.failed + ": " + id); return; }
            var n = Math.max(1, Math.min(30, parseInt(cnt.value, 10) || 1));
            for (var i = 0; i < n; i++) send({ spawnLootType: d.Loots.fromString(id) });
            toast(S.done + ": " + id + " ×" + n);
        };
        r0.appendChild(mk("label", null, S.spCount + ": "));
        r0.appendChild(cnt);
        r0.appendChild(sp);
        s.appendChild(inp);
        var box = mk("div", "di-list");
        s.appendChild(box);
        function render(kw) {
            box.innerHTML = "";
            var arr = buildLootIndex(), n = 0;
            for (var i = 0; i < arr.length && n < 300; i++) {
                var it = arr[i];
                if (kw && it.id.toLowerCase().indexOf(kw) < 0 && it.cn.indexOf(kw) < 0 && it.en.toLowerCase().indexOf(kw) < 0) continue;
                n++;
                var row = mk("div", "di-item");
                (function (idv) {
                    var b = mk("button", "di-mini", S.spawn);
                    b.onclick = function () { kit([idv]); };
                    row.appendChild(b);
                })(it.id);
                var txt = mk("a", null, it.cn + "  (" + it.id + ")");
                txt.href = "javascript:void 0";
                txt.onclick = function (e) { e.preventDefault(); inp.value = this._id; };
                txt._id = it.id;
                row.appendChild(txt);
                box.appendChild(row);
            }
            if (!n) info(box, S.noResult);
        }
        render("");
        inp.oninput = function () { render(inp.value.trim()); };

        var k = section(root, S.kit);
        var rk = rowOf(k);
        var g1 = mk("button", "di-btn", S.kitGod);
        g1.onclick = function () {
            kit(["tactical_vest", "tactical_helmet", "tactical_pack", "mosin_nagant", "deagle", "762mm", "556mm", "gauze", "medikit", "cola"]);
        };
        var g2 = mk("button", "di-btn", S.kitAmmo);
        g2.onclick = function () { kit(["762mm", "556mm", "9mm", "12g", "545mm"]); };
        var g3 = mk("button", "di-btn", S.kitHeal);
        g3.onclick = function () { kit(["gauze", "medikit", "cola", "tablets"]); };
        rk.appendChild(g1); rk.appendChild(g2); rk.appendChild(g3);

        var d2 = section(root, S.spDummy);
        var d = D();
        var armors = (d && d.Armors && d.Armors.definitions) || [];
        var AT = (d && d.ArmorType) || { Helmet: 0, Vest: 1 };
        var vests = [], helmets = [];
        for (var j = 0; j < armors.length; j++) {
            if (armors[j].armorType === AT.Vest) vests.push(armors[j]);
            else if (armors[j].armorType === AT.Helmet) helmets.push(armors[j]);
        }
        function gear(name, list) {
            var rr = rowOf(d2);
            rr.appendChild(mk("label", null, name + ": "));
            var se = mk("select"); se.className = "di-input di-sel";
            var o0 = mk("option"); o0.value = ""; o0.textContent = S.none;
            se.appendChild(o0);
            for (var i = 0; i < list.length; i++) {
                var o = mk("option"); o.value = list[i].idString; o.textContent = tname(list[i]);
                se.appendChild(o);
            }
            rr.appendChild(se);
            return se;
        }
        var vsel = gear(S.vest, vests);
        var hsel = gear(S.helmet, helmets);
        var r3 = rowOf(d2);
        var sd = mk("button", "di-btn", S.spDummy);
        sd.onclick = function () {
            var dd = D();
            if (!dd) { toast(S.needGame); return; }
            var extra = { spawnDummy: true };
            if (vsel.value) extra.dummyVest = dd.Armors.fromStringSafe(vsel.value);
            if (hsel.value) extra.dummyHelmet = dd.Armors.fromStringSafe(hsel.value);
            send(extra);
            toast(S.done + ": " + S.spDummy);
        };
        r3.appendChild(sd);
    }

    function setDev() {
        var d = D();
        if (!d) { toast(S.needGame); return; }
        setV("dv_role", "香蕉LAN");
        setV("dv_password", "LAN666");
        try {
            localStorage.setItem("suroi_dv_role", "香蕉LAN");
            localStorage.setItem("suroi_dv_password", "LAN666");
        } catch (e) { /* ignore */ }
        toast(S.devSet);
    }

    function tabMatch(root) {
        var s = section(root, S.matchInfo);
        var box = mk("div", "di-list di-short");
        s.appendChild(box);
        function refresh() {
            var d = D(), out = [], g = d && d.Game;
            box.innerHTML = "";
            if (!g) { info(box, S.needGame); return; }
            function put(k, v) { info(box, k + ": " + v); }
            try { put(S.miMode, g._modeName || (g.game && g.game.gameMode) || "-"); } catch (e) { put(S.miMode, "-"); }
            try { put("PlayerID", g.activePlayerID); } catch (e) { /* skip */ }
            try { put("Team", (g.isTeamMode ? "ON" : "OFF") + " / " + g.teamID); } catch (e) { /* skip */ }
            try { put("Started / Over", String(!!g.gameStarted) + " / " + String(!!g.gameOver)); } catch (e) { /* skip */ }
            try {
                var pl = g.players || (g.game && g.game.players);
                if (pl && typeof pl.length === "number") put(S.miPlayers, pl.length);
                else put(S.miPlayers, "-");
            } catch (e) { put(S.miPlayers, "-"); }
            try {
                var al = g.aliveCount || (g.game && g.game.aliveCount);
                if (typeof al === "number") put(S.miAlive, al);
            } catch (e) { /* skip */ }
        }
        refresh();
        var r = rowOf(s);
        var b = mk("button", "di-btn", S.refresh); b.onclick = refresh;
        r.appendChild(b);

        var ps = section(root, S.players);
        var plist = mk("div", "di-list di-short");
        ps.appendChild(plist);
        var r2 = rowOf(ps);
        var pb = mk("button", "di-btn", S.refresh);
        pb.onclick = function () {
            var d = D(), g = d && d.Game;
            plist.innerHTML = "";
            if (!g) { info(plist, S.needGame); return; }
            var arr = null;
            try {
                if (g.players && typeof g.players.length === "number") arr = g.players;
                else if (g.game && g.game.players) arr = g.game.players;
            } catch (e) { /* skip */ }
            if (!arr || !arr.length) { info(plist, S.noPlayers); return; }
            for (var i = 0; i < arr.length; i++) {
                var p = arr[i];
                var nm = p.name || p.playerName || ("#" + (p.id !== undefined ? p.id : i));
                var hp = (p.health !== undefined ? "  HP " + Math.round(p.health) : "");
                var tm = (p.teamID !== undefined ? "  T" + p.teamID : "");
                info(plist, nm + hp + tm);
            }
        };
        r2.appendChild(pb);

        var ds = section(root, S.devRole);
        info(ds, "dv_role / dv_password → 香蕉LAN / LAN666");
        var r4 = rowOf(ds);
        var db = mk("button", "di-btn", S.devBtn); db.onclick = setDev;
        r4.appendChild(db);
    }

    var assetCache = null;
    function loadAssets(cb) {
        if (assetCache) { cb(assetCache); return; }
        fetch("./debug-assets.json").then(function (r) { return r.json(); }).then(function (j) {
            assetCache = j; cb(j);
        }).catch(function () { cb(null); });
    }
    function assetList(parent, kind) {
        var search = mk("input"); search.className = "di-input"; search.placeholder = S.spSearch;
        var box = mk("div", "di-list");
        parent.appendChild(search); parent.appendChild(box);
        loadAssets(function (j) {
            if (!j) { info(box, S.assetsFail); return; }
            var arr = (kind === "audio" ? j.audio : j.img) || [];
            info(box, (kind === "audio" ? S.audio : S.images) + " — " + S.count + ": " + arr.length);
            function render(kw) {
                while (box.children.length > 1) box.removeChild(box.lastChild);
                var n = 0;
                for (var i = 0; i < arr.length && n < 300; i++) {
                    var p = arr[i];
                    if (kw && p.toLowerCase().indexOf(kw) < 0) continue;
                    n++;
                    var item = mk("div", "di-item");
                    if (kind === "audio") {
                        (function (u) {
                            var pl = mk("button", "di-mini", "▶");
                            pl.onclick = function () { new Audio(u).play(); };
                            item.appendChild(pl);
                        })(p);
                    } else {
                        var im = mk("img"); im.src = p; im.loading = "lazy";
                        css(im, { height: "28px", width: "28px", objectFit: "contain", background: "#1b2130" });
                        item.appendChild(im);
                    }
                    var a = mk("a", null, p); a.href = p; a.target = "_blank";
                    item.appendChild(a);
                    (function (u) {
                        var cp = mk("button", "di-mini", "⧉");
                        cp.onclick = function () {
                            try { navigator.clipboard.writeText(u); toast(S.copied); } catch (e) { /* ignore */ }
                        };
                        item.appendChild(cp);
                    })(p);
                    box.appendChild(item);
                }
                if (!n) info(box, S.noResult);
            }
            render("");
            search.oninput = function () { render(search.value.trim().toLowerCase()); };
        });
    }
    function tabAssets(root) {
        assetList(section(root, S.audio), "audio");
        assetList(section(root, S.images), "img");
    }

    function tabConsole(root) {
        var s = section(root, S.cmd);
        var inp = mk("input"); inp.className = "di-input"; inp.placeholder = S.cmdPh;
        var out = mk("div", "di-list di-short");
        s.appendChild(inp); s.appendChild(out);
        function run() {
            var d = D();
            if (!d) { toast(S.needGame); return; }
            var q = inp.value;
            if (!q) return;
            try {
                d.GameConsole.handleQuery(q, "never");
                info(out, "> " + q + "  [" + S.done + "]");
            } catch (e) {
                info(out, "> " + q + "  [" + S.failed + "] " + e.message);
            }
            out.scrollTop = out.scrollHeight;
        }
        var rb = mk("button", "di-btn", S.run);
        rb.onclick = run;
        s.appendChild(rb);
        inp.onkeydown = function (e) { if (e.key === "Enter") run(); };

        var wrap = section(root, "cvars");
        var box = mk("div", "di-list");
        var d = D();
        var all = d ? d.GameConsole.variables.getAll() : null;
        if (all) {
            for (var k in all) {
                var row = mk("div", "di-item");
                row.appendChild(mk("span", null, k + " = " + String(all[k])));
                (function (kk) {
                    var sv = mk("button", "di-mini", "set");
                    sv.onclick = function () {
                        var v = prompt(kk, String(getV(kk)));
                        if (v === null) return;
                        var cur = getV(kk);
                        setV(kk, typeof cur === "boolean" ? v === "true" : (typeof cur === "number" ? parseFloat(v) : v));
                        toast(kk + " = " + v);
                    };
                    row.appendChild(sv);
                })(k);
                box.appendChild(row);
            }
        } else info(box, S.notReady);
        wrap.appendChild(box);
    }

    function tabAbout(root) {
        var s = section(root, S.title);
        info(s, S.help1);
        info(s, S.help2);
        info(s, S.help3);
        var code = mk("textarea", "di-code");
        code.value = "<script src=\"./debug-injector.js\" defer></scr" + "ipt>";
        s.appendChild(code);
        var cb = mk("button", "di-btn", S.copy);
        cb.onclick = function () {
            code.select();
            try { document.execCommand("copy"); } catch (e) { /* ignore */ }
            toast(S.copied);
        };
        s.appendChild(cb);
        var d = D();
        info(s, "window.SuroiDebug: " + (d ? S.ready : S.notReady) + " | baseSpeed " + defaultSpeed() + " | zoom " + defaultZoom());
    }

    var TABS = [
        ["player", S.tPlayer, tabPlayer],
        ["visual", S.tVisual, tabVisual],
        ["spawn", S.tSpawn, tabSpawn],
        ["match", S.tMatch, tabMatch],
        ["assets", S.tAssets, tabAssets],
        ["console", S.tConsole, tabConsole],
        ["help", S.tHelp, tabAbout]
    ];
    function showTab(id) {
        current = id;
        if (!body) return;
        for (var i = 0; i < TABS.length; i++) {
            if (tabs[TABS[i][0]]) tabs[TABS[i][0]].className = "di-tab" + (TABS[i][0] === id ? " di-tab-on" : "");
        }
        body.innerHTML = "";
        for (var j = 0; j < TABS.length; j++) {
            if (TABS[j][0] === id) {
                try { TABS[j][2](body); } catch (e) { info(body, "tab error: " + e.message); console.warn("[injector]", e); }
            }
        }
    }

    var CSS =
        ".di-panel{position:fixed;right:12px;bottom:12px;width:344px;max-height:76vh;overflow:auto;z-index:999998;" +
        "background:rgba(14,17,23,.96);color:#dce6f5;border:1px solid #37455c;border-radius:10px;font:12.5px/1.5 system-ui,sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.55)}" +
        ".di-head{display:flex;align-items:center;gap:6px;padding:8px 10px;border-bottom:1px solid #2b3648;position:sticky;top:0;background:rgba(14,17,23,.98);z-index:2}" +
        ".di-title{font-weight:600;flex:1}.di-btn,.di-mini,.di-tab{background:#20293a;color:#dce6f5;border:1px solid #3a4a63;border-radius:5px;padding:3px 8px;cursor:pointer;font-family:inherit}" +
        ".di-btn:hover,.di-mini:hover,.di-tab:hover{background:#2b3648}.di-mini{padding:1px 6px;font-size:11px}" +
        ".di-warn{background:#8a2b2b;border-color:#c04a4a;font-weight:600}" +
        ".di-tabs{display:flex;flex-wrap:wrap;gap:4px;padding:6px 8px;border-bottom:1px solid #2b3648}" +
        ".di-tab-on{background:#2f6fd0;border-color:#2f6fd0}" +
        ".di-sec{padding:7px 10px 0;color:#7fb2ff;font-weight:600}.di-secbody{padding:2px 10px 7px;border-bottom:1px solid #222b3b}" +
        ".di-row{display:flex;align-items:center;gap:6px;margin:4px 0;flex-wrap:wrap}.di-row input[type=range]{flex:1;min-width:80px}" +
        ".di-val{color:#8fd48f}.di-check{display:flex;align-items:center;gap:4px;cursor:pointer}" +
        ".di-input{background:#161c27;color:#dce6f5;border:1px solid #3a4a63;border-radius:5px;padding:4px 6px;flex:1;min-width:60px}" +
        ".di-cnt{flex:0 0 56px;min-width:0}.di-sel{flex:1}" +
        ".di-list{max-height:190px;overflow:auto;border:1px solid #222b3b;border-radius:5px;margin-top:5px}" +
        ".di-short{max-height:140px}" +
        ".di-item{display:flex;align-items:center;gap:6px;padding:2px 6px;border-bottom:1px solid #1b2130;word-break:break-all}" +
        ".di-item a{color:#9dc4ff;text-decoration:none;flex:1}.di-info{color:#93a3ba;padding:2px 0;font-size:12px}" +
        ".di-code{width:100%;height:46px;background:#161c27;color:#cfe;border:1px solid #3a4a63;border-radius:5px;box-sizing:border-box}" +
        ".di-fab{position:fixed;right:12px;bottom:12px;z-index:999999;padding:8px 14px;border-radius:20px;border:1px solid #3a4a63;" +
        "background:#2f6fd0;color:#fff;font:600 13px system-ui,sans-serif;cursor:pointer}";

    function build() {
        var style = mk("style");
        style.textContent = CSS;
        document.head.appendChild(style);
        panel = mk("div", "di-panel");
        var head = mk("div", "di-head");
        head.appendChild(mk("span", "di-title", S.title));
        var langBtn = mk("button", "di-mini", S.lang);
        langBtn.onclick = function () {
            var u = new URL(location.href);
            u.searchParams.set("lang", ZH ? "en" : "zh");
            location.href = u.toString();
        };
        head.appendChild(langBtn);
        var resetBtn = mk("button", "di-mini", "⟲ALL");
        resetBtn.title = S.resetAll;
        resetBtn.onclick = resetAll;
        head.appendChild(resetBtn);
        var minBtn = mk("button", "di-mini", S.min);
        minBtn.onclick = function () { panel.style.display = "none"; fab.style.display = "block"; };
        head.appendChild(minBtn);
        var cl = mk("button", "di-mini", "×");
        cl.onclick = function () { panel.style.display = "none"; fab.style.display = "block"; };
        head.appendChild(cl);
        var tt = mk("div", "di-tabs");
        tabs = {};
        for (var i = 0; i < TABS.length; i++) {
            (function (t) {
                var b = mk("button", "di-tab", t[1]);
                b.onclick = function () { showTab(t[0]); };
                tabs[t[0]] = b; tt.appendChild(b);
            })(TABS[i]);
        }
        body = mk("div");
        panel.appendChild(head); panel.appendChild(tt); panel.appendChild(body);
        document.body.appendChild(panel);
        showTab("player");
    }

    function boot() {
        if (!document.body) { setTimeout(boot, 200); return; }
        build();
        fab = mk("button", "di-fab", S.fab);
        fab.onclick = function () { panel.style.display = "block"; fab.style.display = "none"; showTab(current); };
        document.body.appendChild(fab);
        console.log("[injector] " + S.title + " ready  (window.__SUROI_INJECTOR__)");
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
})();
