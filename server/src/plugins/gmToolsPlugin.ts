import { GameConstants } from "@common/constants";
import { Armors } from "@common/definitions/items/armors";
import { Backpacks } from "@common/definitions/items/backpacks";
import { Guns } from "@common/definitions/items/guns";
import { HealingItems } from "@common/definitions/items/healingItems";
import { Melees } from "@common/definitions/items/melees";
import { Throwables } from "@common/definitions/items/throwables";
import { pickRandomInArray } from "@common/utils/random";
import { Vec } from "@common/utils/vector";
import { GamePlugin } from "../pluginManager";
import { Config } from "../utils/config";
import type { Player } from "../objects/player";

/**
 * GM 工具插件（公开版）
 * ====================
 *
 * 通过表情轮盘触发 GM 功能。
 *
 * 相比原 fork 的四处修正：
 *
 * 1. **权限开放** —— 原版用 `player.isDev` 门禁，只有 config.json 中
 *    `isDev: true` 的角色才能使用。本版本读取 `plugins.gmToolsPublic`
 *    配置项（默认 **true**），为 true 时**所有玩家**都能使用。
 *    改回 false 即恢复为仅 GM 可用，无需动代码。
 *
 * 2. **修正失效的 emote id** —— 上游把 badge 的 idString 从裸名
 *    （`"fire"`）改为 `bdg_` 前缀形式（`"bdg_fire"`）。原 fork 使用的
 *    `troll_face` / `heart` / `pog` / `wave` / `skull` 在当前版本
 *    **均不存在**，这些功能实际上从未生效。本版本改用真实存在的 badge。
 *
 * 3. **修掉编译错误** —— `GameConstants.player.health` 已更名为
 *    `defaultHealth`，原 fork 这一行无法编译。
 *
 * 4. **补齐功能** —— 新增随机近战 / 投掷物 / 治疗包、清空武器、
 *    8 倍速、状态清理等。
 *
 * 触发方式（普通表情即可，无需 GM 身份）：
 * | 表情 badge          | 功能                        |
 * |---------------------|-----------------------------|
 * | `bdg_fire`           | 满血 + 满肾上腺素          |
 * | `bdg_developr`       | 随机枪械                    |
 * | `bdg_donatr`         | 随机近战                    |
 * | `bdg_moderatr`       | 随机投掷物 ×3               |
 * | `bdg_bleh`           | 随机治疗品 ×2               |
 * | `bdg_ownr`           | 一键满配（护甲 + MG5 + Negev）|
 * | `bdg_suroi_logo`     | 空投到脚下                  |
 * | `bdg_colon_three`    | 切换无敌                    |
 * | `bdg_duel`           | 清空武器                    |
 * | `bdg_suroi_general_chat` | 传送到地图中心          |
 * | `bdg_aegis_logo`     | 切换 8 倍速                 |
 * | 地图标记 map ping    | 传送到标记处                |
 */

/**
 * 读取配置：GM 工具是否对所有玩家开放。
 *
 * 读 `config.json` 顶层的 `gmToolsPublic`（boolean）。
 * 缺省为 true —— 即默认对所有玩家开放。
 */
function isPublic(): boolean {
    return Config.gmToolsPublic !== false;
}

export default class GmToolsPlugin extends GamePlugin {
    /** 8 倍速开关状态，按玩家 id 记录 */
    private readonly speedHacks = new Set<number>();

    protected override initListeners(): void {
        // 公开模式下所有人放行；关闭公开时回退到 isDev 判定
        const canUse = (player: Player): boolean => player.isDev || isPublic();

        this.on("player_did_emote", ({ player, emote }) => {
            if (!canUse(player)) return;

            switch (emote.idString) {
                case "bdg_fire": {
                    // 修复点：health -> defaultHealth
                    player.health = player.maxHealth;
                    player.adrenaline = GameConstants.player.maxAdrenaline;
                    break;
                }

                case "bdg_developr": {
                    player.giveGun(pickRandomInArray(Guns.definitions).idString);
                    break;
                }

                case "bdg_donatr": {
                    player.inventory.giveItem(pickRandomInArray(Melees.definitions).idString);
                    break;
                }

                case "bdg_moderatr": {
                    player.giveThrowable(pickRandomInArray(Throwables.definitions).idString, 3);
                    break;
                }

                case "bdg_bleh": {
                    player.inventory.giveItem(
                        pickRandomInArray(HealingItems.definitions).idString,
                        2
                    );
                    break;
                }

                case "bdg_ownr": {
                    player.inventory.helmet = Armors.fromString("tactical_helmet");
                    player.inventory.vest = Armors.fromString("tactical_vest");
                    player.inventory.backpack = Backpacks.fromString("tactical_pack");
                    player.inventory.dropWeapons();
                    player.giveGun("mg5");
                    player.giveGun("negev");
                    player.health = player.maxHealth;
                    player.adrenaline = GameConstants.player.maxAdrenaline;
                    break;
                }

                case "bdg_suroi_logo": {
                    this.game.summonAirdrop(Vec.clone(player.position), false);
                    break;
                }

                case "bdg_colon_three": {
                    player.forceInvulnerable = !player.forceInvulnerable;
                    break;
                }

                case "bdg_duel": {
                    player.inventory.dropWeapons();
                    break;
                }

                case "bdg_suroi_general_chat": {
                    player.position = Vec(this.game.map.width / 2, this.game.map.height / 2);
                    player.updateObjects = true;
                    player.setPartialDirty();
                    break;
                }

                case "bdg_aegis_logo": {
                    const base = GameConstants.player.baseSpeed;
                    if (this.speedHacks.has(player.id)) {
                        this.speedHacks.delete(player.id);
                        player.baseSpeed = base;
                    } else {
                        this.speedHacks.add(player.id);
                        player.baseSpeed = base * 8;
                    }
                    break;
                }
            }

            player.dirty.items = true;
            player.dirty.weapons = true;
        });

        this.on("player_did_map_ping", ({ player, position }) => {
            if (!canUse(player)) return;
            player.position = Vec.clone(position);
            player.updateObjects = true;
            player.setPartialDirty();
        });

        // 离场清理，避免 Set 泄漏
        this.on("player_disconnect", player => {
            this.speedHacks.delete(player.id);
        });
    }
}
