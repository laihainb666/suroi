import { GameConstants } from "@common/constants";
import { Armors } from "@common/definitions/items/armors";
import { Backpacks } from "@common/definitions/items/backpacks";
import { Guns } from "@common/definitions/items/guns";
import { pickRandomInArray } from "@common/utils/random";
import { Vec } from "@common/utils/vector";

import { GamePlugin } from "../pluginManager";

/**
 * 全能 GM 工具插件（仅对 config.json roles 中 isDev=true 的角色生效）
 *
 * 通过表情轮盘触发 GM 功能：
 *  - troll_face (Troll Face)   -> 切换无敌
 *  - fire (Fire)               -> 满血
 *  - heart (Heart)             -> 随机刷一把枪
 *  - thumbs_up (Thumbs Up)     -> 在自己位置召唤空投
 *  - question_mark (Question)  -> 切换 12 倍移速
 *  - pog (Pog)                 -> 清空武器
 *  - wave (Wave)               -> 传送到地图中心
 *  - skull (Skull)             -> 一键满配护甲
 *
 * 地图标记（map ping）-> 传送至标记处（仅 GM 有效）
 */
export default class GmToolsPlugin extends GamePlugin {
    protected override initListeners(): void {
        this.on("player_did_emote", ({ player, emote }) => {
            if (!player.isDev) return;

            switch (emote.idString) {
                case "troll_face": {
                    // 无敌开关
                    player.forceInvulnerable = !player.forceInvulnerable;
                    player.setDirty();
                    break;
                }
                case "fire": {
                    // 满血
                    player.health = GameConstants.player.health;
                    player.setDirty();
                    break;
                }
                case "heart": {
                    // 随机刷枪
                    player.giveGun(pickRandomInArray(Guns.definitions).idString);
                    break;
                }
                case "thumbs_up": {
                    // 空投
                    this.game.summonAirdrop(Vec.clone(player.position), false);
                    break;
                }
                case "question_mark": {
                    // 变速开关
                    const baseSpeed = GameConstants.player.baseSpeed;
                    player.baseSpeed = player.baseSpeed === baseSpeed ? 12 * baseSpeed : baseSpeed;
                    break;
                }
                case "pog": {
                    // 清空武器
                    player.inventory.dropWeapons();
                    player.dirty.weapons = true;
                    break;
                }
                case "wave": {
                    // 传送地图中心
                    player.position = Vec(this.game.map.width / 2, this.game.map.height / 2);
                    player.updateObjects = true;
                    player.setPartialDirty();
                    break;
                }
                case "skull": {
                    // 满配护甲
                    player.inventory.helmet = Armors.fromString("tactical_helmet");
                    player.inventory.vest = Armors.fromString("tactical_vest");
                    player.inventory.backpack = Backpacks.fromString("tactical_pack");
                    player.dirty.items = true;
                    break;
                }
            }
        });

        this.on("player_did_map_ping", ({ player, position }) => {
            if (!player.isDev) return;
            player.position = Vec.clone(position);
            player.updateObjects = true;
            player.setPartialDirty();
        });
    }
}
