import { Armors, type ArmorDefinition } from "../definitions/items/armors";
import { Loots, type LootDefinition } from "../definitions/loots";
import { Obstacles, type ObstacleDefinition } from "../definitions/obstacles";
import { Packet, PacketType } from "./packet";
import { type Vector } from "../utils/vector";

export interface DebugPacket {
    readonly type: PacketType.Debug

    readonly speed: number
    readonly overrideZoom: boolean
    readonly zoom: number

    readonly noClip: boolean
    readonly invulnerable: boolean

    // 二创：作弊增强
    readonly oneShotKill: boolean
    readonly infiniteAmmo: boolean
    readonly teleport?: Vector

    readonly spawnLootType?: LootDefinition
    readonly spawnDummy: boolean
    readonly dummyVest?: ArmorDefinition
    readonly dummyHelmet?: ArmorDefinition

    // 二创：触发器调试——在玩家附近生成指定障碍（门/机关/箱子等）
    readonly spawnObstacle?: ObstacleDefinition
    readonly spawnObstacleCount?: number

    readonly layerOffset: number
}

export const DebugPacket = new Packet<DebugPacket>(PacketType.Debug, {
    serialize(strm, data) {
        strm.writeBooleanGroup(
            data.overrideZoom,
            data.noClip,
            data.invulnerable,
            data.spawnLootType !== undefined,
            data.spawnDummy,
            data.dummyVest !== undefined,
            data.dummyHelmet !== undefined,
            data.oneShotKill
        );
        // 二创：第二组布尔（writeBooleanGroup 上限 8 位）
        strm.writeBooleanGroup(
            data.infiniteAmmo,
            data.teleport !== undefined,
            data.spawnObstacle !== undefined,
            data.spawnObstacle !== undefined
        );

        strm.writeFloat32(data.speed);

        strm.writeInt8(data.layerOffset);

        if (data.overrideZoom) {
            strm.writeUint8(data.zoom);
        }

        if (data.spawnLootType) {
            Loots.writeToStream(strm, data.spawnLootType);
        }
        if (data.spawnDummy) {
            if (data.dummyVest !== undefined) {
                Armors.writeToStream(strm, data.dummyVest);
            }
            if (data.dummyHelmet !== undefined) {
                Armors.writeToStream(strm, data.dummyHelmet);
            }
        }
        if (data.teleport) {
            strm.writeFloat32(data.teleport.x);
            strm.writeFloat32(data.teleport.y);
        }
        if (data.spawnObstacle) {
            Obstacles.writeToStream(strm, data.spawnObstacle);
            strm.writeUint8(Math.max(1, Math.min(255, data.spawnObstacleCount ?? 1)));
        }
    },

    deserialize(strm, data) {
        const [
            overrideZoom,
            noClip,
            invulnerable,
            spawnLoot,
            spawnDummy,
            dummyHasVest,
            dummyHasHelmet,
            oneShotKill
        ] = strm.readBooleanGroup();
        const [
            infiniteAmmo,
            hasTeleport,
            hasSpawnObstacle,
            hasSpawnObstacleCount
        ] = strm.readBooleanGroup();

        data.speed = strm.readFloat32();

        data.overrideZoom = overrideZoom;
        data.noClip = noClip;
        data.invulnerable = invulnerable;

        data.layerOffset = strm.readInt8();

        if (overrideZoom) {
            data.zoom = strm.readUint8();
        } else {
            data.zoom = 0;
        }

        if (spawnLoot) {
            data.spawnLootType = Loots.readFromStream(strm);
        }
        data.spawnDummy = spawnDummy;
        if (data.spawnDummy) {
            if (dummyHasVest) {
                data.dummyVest = Armors.readFromStream(strm);
            }
            if (dummyHasHelmet) {
                data.dummyHelmet = Armors.readFromStream(strm);
            }
        }

        data.oneShotKill = oneShotKill;
        data.infiniteAmmo = infiniteAmmo;
        if (hasTeleport) {
            data.teleport = {
                x: strm.readFloat32(),
                y: strm.readFloat32()
            };
        }
        if (hasSpawnObstacle) {
            data.spawnObstacle = Obstacles.readFromStream(strm);
            data.spawnObstacleCount = strm.readUint8();
        }
    }
});
