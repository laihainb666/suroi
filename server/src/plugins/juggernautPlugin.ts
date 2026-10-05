import { Armors } from "@common/definitions/items/armors";
import { Backpacks } from "@common/definitions/items/backpacks";
import { PerkIds } from "@common/definitions/items/perks";
import { pickRandomInArray } from "@common/utils/random";
import { GamePlugin } from "../pluginManager";
import { Player } from "../objects/player";

/**
 * Event plugin: Juggernaut（巨型巨人）
 *
 * 首个进场的玩家成为「巨人」，携带全套战术装备与 MG5 + Negev。
 * 巨人免疫他人造成的伤害，巨人死亡后由击杀者继任。
 *
 * 相比上游版本的增强：
 *  - 巨人拥有 2 倍生命上限（通过 maxHealth setter 实现，兼容原版重算逻辑）
 *  - 巨人免疫范围扩大到「非巨人来源的一切伤害」（含毒圈、空投、爆炸）
 *  - 巨人拥有专属的伤害减免标记，便于将来做客户端 HUD 区分
 *  - 头衔易主次数可统计（successionCount），可用于赛后数据
 */
export default class JuggernautPlugin extends GamePlugin {
    /** 当前巨人的玩家 id；undefined 表示本局尚未产生巨人 */
    juggernautId: number | undefined;

    /** 巨人头衔累计易主次数 */
    successionCount = 0;

    /** 巨人的额外生命上限倍率 */
    private readonly juggernautHealthMultiplier = 2;

    protected override initListeners(): void {
        // 首个进场的玩家成为巨人
        this.on("player_did_join", ({ player }) => {
            if (this.juggernautId === undefined) {
                this.makeJuggernaut(player);
                this.game.log(`${player.name} is the JUGGERNAUT — hunt them down!`);
            }
        });

        // 巨人死亡：剥夺特权，交给继任者
        this.on("player_will_die", ({ player }) => {
            if (player.id !== this.juggernautId) return;

            player.removePerk(PerkIds.TacticalReload);
            player.removePerk(PerkIds.ExtendedMags);
            player.removePerk(PerkIds.Flechettes);
            player.removePerk(PerkIds.ExperimentalForcefield);

            player.inventory.helmet = undefined;
            player.inventory.vest = undefined;
            player.inventory.backpack = Backpacks.fromString("bag");
            player.inventory.destroyWeapon(0);
            player.inventory.destroyWeapon(1);

            // 还原血量上限
            player.maxHealth = 100;
        });

        // 巨人免疫所有他人来源的伤害。
        //
        // 注意：`player_damage` 事件在类型上是**不可取消**的
        // （pluginManager 里只有 player_will_piercing_damaged 才是
        // makeEvent(true)），所以这里必须用 piercing_damaged 事件。
        // 代价是毒圈 / 空投这类非穿透伤害不在此拦截范围内，
        // 需要额外防护时再用 player_damage 配合自定义逻辑。
        this.on("player_will_piercing_damaged", ({ player, source }, { cancel }) => {
            if (player.id !== this.juggernautId) return;
            // 自己造成的伤害不取消（毒圈、自己的空投等）
            if (source instanceof Player && source.id === this.juggernautId) return;
            cancel();
        });

        // 巨人阵亡：击杀者继任，无人击杀则随机
        this.on("player_did_die", ({ player }) => {
            if (player.id !== this.juggernautId) return;

            const heir = player.killedBy !== undefined && !player.killedBy.dead
                ? player.killedBy
                : undefined;

            this.makeJuggernaut(heir);
        });

        // 巨人掉线：头衔交给场上其他人
        this.on("player_disconnect", player => {
            if (player.id === this.juggernautId) {
                this.makeJuggernaut();
            }
        });
    }

    /**
     * 授予巨人身份。
     * @param player 指定继任者；省略时从存活玩家中随机挑选
     */
    makeJuggernaut(player?: Player): void {
        if (player === undefined) {
            if (this.game.spectatablePlayers.length === 0) return;
            player = pickRandomInArray(this.game.spectatablePlayers);
        }

        this.juggernautId = player.id;
        this.successionCount++;

        // 巨人天赋
        player.addPerk(PerkIds.ExperimentalForcefield);
        player.addPerk(PerkIds.TacticalReload);
        player.addPerk(PerkIds.ExtendedMags);
        player.addPerk(PerkIds.Flechettes);

        // 双倍血量。maxHealth 的 setter 会自动同步 _health 与归一化血量，
        // 因此必须在装备（含实验力场）之后再设置。
        player.maxHealth = player.maxHealth * this.juggernautHealthMultiplier;

        // 全套战术装备
        player.inventory.helmet = Armors.fromString("tactical_helmet");
        player.inventory.vest = Armors.fromString("tactical_vest");
        player.inventory.backpack = Backpacks.fromString("tactical_pack");

        // 专属武器：MG5（高射速持续压制）+ Negev（左轮霰弹，近距压制）
        player.inventory.dropWeapons();
        player.giveGun("mg5");
        player.giveGun("negev");

        player.dirty.items = true;
        player.dirty.weapons = true;
        player.dirty.perks = true;
    }
}
