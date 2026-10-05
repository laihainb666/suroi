import { GameConstants } from "@common/constants";
import { PerkIds } from "@common/definitions/items/perks";
import { GamePlugin } from "../pluginManager";
import { Config } from "../utils/config";
import { Player } from "../objects/player";

/**
 * 联机体验增强插件
 * ================
 *
 * 官方原版没有面向「让一局更热闹」的插件。本插件补了几项低成本、
 * 高收益的多人体验改进：
 *
 * 1. **首杀奖励** —— 本局第一个击杀的玩家额外获得 50% 肾上腺素，
 *    提高前期交战的胜率与节目效果。
 *
 * 2. **压制播报** —— 同一玩家对同一目标连续击杀 2 次时记入服务端日志，
 *    方便管理员观察局势，也便于后续接客户端播报。
 *
 * 3. **输入活跃度统计** —— 记录每名玩家最后一次有效输入的时间，
 *    用于排查挂机 / 掉线但未断开的僵死连接（只记录，不自动踢人）。
 *
 * 4. **状态清理** —— 玩家离开时清理其反杀记录与活跃度记录，
 *    避免长跑局里 Map 无限增长。
 *
 * 开关（config.json 顶层，缺省全开）：
 * ```json
 * "multiplayerEnhancements": { "firstBloodBonus": true, "revengeTracking": true }
 * ```
 */
interface EnhancementConfig {
    firstBloodBonus?: boolean;
    revengeTracking?: boolean;
}

/** 读取 config.json 里的 multiplayerEnhancements 段 */
function enhConfig(): EnhancementConfig {
    return Config.multiplayerEnhancements ?? {};
}

export default class MultiplayerEnhancementsPlugin extends GamePlugin {
    /** 本局是否已产生首杀 */
    private firstBloodDone = false;

    /** 反杀计数，key 为 `${killerId}:${victimId}` */
    private readonly revengeCounts = new Map<string, number>();

    /** 每名玩家最后一次有效输入的时间戳 */
    private readonly lastInputAt = new Map<number, number>();

    protected override initListeners(): void {
        const cfg = enhConfig();

        this.on("player_did_join", ({ player }) => {
            this.lastInputAt.set(player.id, Date.now());
        });

        // player_input 的载荷是 { player, packet }
        this.on("player_input", ({ player }) => {
            this.lastInputAt.set(player.id, Date.now());
        });

        this.on("player_disconnect", player => {
            this.lastInputAt.delete(player.id);
            for (const key of [...this.revengeCounts.keys()]) {
                if (key.startsWith(`${player.id}:`) || key.endsWith(`:${player.id}`)) {
                    this.revengeCounts.delete(key);
                }
            }
        });

        this.on("player_did_die", ({ player, source }) => {
            if (!(source instanceof Player) || source === player || source.dead) return;

            // ---- 首杀奖励 ----
            if (cfg.firstBloodBonus !== false && !this.firstBloodDone) {
                this.firstBloodDone = true;
                source.adrenaline = Math.min(
                    source.maxAdrenaline,
                    source.adrenaline + GameConstants.player.maxAdrenaline * 0.5
                );
                this.game.log(`${source.name} drew first blood (+50% adrenaline)`);
            }

            // ---- 压制播报 ----
            if (cfg.revengeTracking !== false) {
                const key = `${source.id}:${player.id}`;
                const n = (this.revengeCounts.get(key) ?? 0) + 1;
                this.revengeCounts.set(key, n);
                if (n === 2) {
                    this.game.log(`${source.name} is dominating ${player.name} (${n} kills)`);
                }
            }
        });
    }

    /**
     * 广播巨人易主。
     * 供 juggernautPlugin 调用，让所有「面向玩家的播报」集中在此。
     */
    announceJuggernaut(player: Player): void {
        this.game.log(`${player.name} is now the JUGGERNAUT — everyone wants a piece`);
    }

    /**
     * 查询某名玩家是否为巨人。
     * 巨人持有 experimental_forcefield（实验力场）天赋，可据此在客户端做特殊标记。
     */
    isJuggernaut(player: Player): boolean {
        return player.hasPerk(PerkIds.ExperimentalForcefield);
    }

    /** 取某玩家最后一次输入时间；undefined 表示未知 */
    lastActive(playerId: number): number | undefined {
        return this.lastInputAt.get(playerId);
    }
}
