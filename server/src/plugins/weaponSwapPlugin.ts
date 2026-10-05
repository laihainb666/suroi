import { GunDefinition, Guns } from "@common/definitions/items/guns";
import { MeleeDefinition, Melees } from "@common/definitions/items/melees";
import { ThrowableDefinition, Throwables } from "@common/definitions/items/throwables";
import { Numeric } from "@common/utils/math";
import { DefinitionType } from "@common/utils/objectDefinitions";
import { pickRandomInArray } from "@common/utils/random";

import { Player } from "../objects/player";
import { GamePlugin } from "../pluginManager";

const selectableGuns = Guns.definitions.filter(g => !g.killstreak && !g.wearerAttributes);
const selectableMelees = Melees.definitions.filter(g => !g.killstreak && !g.wearerAttributes);
const selectableThrowables = Throwables.definitions.filter(g => !g.killstreak && !g.wearerAttributes);

/**
 * 击杀换枪插件
 * =============
 *
 * 击杀敌人后，把手中武器替换成一把随机武器，并补满弹药。
 * 让连杀节奏更快，减少「杀完没枪打」的挫败感。
 *
 * 相比原 fork 的修正：
 *  - `Numeric` 改用 `@common/` 路径别名导入。原 fork 用的是
 *    `../../../common/src/utils/math` 相对路径，在 workspace 布局下
 *    依赖目录层级，容易在目录调整时断裂。
 *  - `switch` 的 `case DefinitionType.Throwable` 原本缺少 `break`，
 *    会贯穿到 `replaceWeapon` 之后重复执行。
 *  - 补上 `default` 分支，避免 activeItemDefinition 异常时 item 未赋值
 *    就被使用（严格模式会直接抛 ReferenceError）。
 */
export default class WeaponSwapPlugin extends GamePlugin {
    protected override initListeners(): void {
        this.on("player_will_die", ({ source }) => {
            if (!(source instanceof Player)) return;

            const inventory = source.inventory;
            const index = source.activeItemIndex;

            let item: GunDefinition | MeleeDefinition | ThrowableDefinition | undefined;
            const defType = source.activeItemDefinition.defType;
            switch (defType) {
                case DefinitionType.Gun: {
                    const gun = pickRandomInArray(selectableGuns);
                    item = gun;
                    const { ammoType } = gun;
                    if (gun.ammoSpawnAmount) {
                        const amount = Numeric.min(
                            inventory.backpack.maxCapacity[ammoType],
                            inventory.items.getItem(ammoType) + gun.ammoSpawnAmount
                        );
                        inventory.items.setItem(ammoType, amount);
                        source.dirty.items = true;
                    }
                    break;
                }
                case DefinitionType.Melee: {
                    item = pickRandomInArray(selectableMelees);
                    break;
                }
                case DefinitionType.Throwable: {
                    const throwable = pickRandomInArray(selectableThrowables);
                    item = throwable;
                    inventory.items.setItem(
                        throwable.idString,
                        inventory.backpack.maxCapacity[throwable.idString]
                    );
                    source.dirty.items = true;
                    break;
                }
                default: {
                    return;
                }
            }

            inventory.replaceWeapon(index, item);

            if (source.activeItem?.isGun) {
                source.activeItem.ammo = source.activeItem.definition.capacity;
            }
        });
    }
}
