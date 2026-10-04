import { Player } from "../objects/player";
import { GamePlugin } from "../pluginManager";

/**
 * 击杀补给插件：击杀敌人后，击杀者当前武器的弹药立即补满。
 * 增强多人联机战斗节奏，避免"杀完没子弹"的挫败感。
 */
export default class KillRewardPlugin extends GamePlugin {
    protected override initListeners(): void {
        this.on("player_will_die", ({ source }) => {
            if (!(source instanceof Player) || source.dead) return;

            const activeItem = source.activeItem;
            if (activeItem?.isGun) {
                activeItem.ammo = activeItem.definition.capacity;
            }
        });
    }
}
