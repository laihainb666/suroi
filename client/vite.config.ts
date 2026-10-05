import { existsSync, rmSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import pkg from "../package.json";

const DIRNAME = dirname(fileURLToPath(import.meta.url));
export default defineConfig(async({ command, mode }) => {
    const isDev = command === "serve" && mode === "development";

    // temporary hack until svelte rewrite
    process.env = {
        ...process.env,
        VITE_APP_VERSION: pkg.version,
        // Allow overriding DEBUG_CLIENT via env in production builds too.
        //
        // 增强：默认值从「仅 dev 模式」改为「一律开启」，
        // 让调试菜单（debugMenu）与控制台（GameConsole）在生产构建中
        // 也可用。是否真正放行仍由服务端的 allowPublicDebugMenu 控制，
        // 因此这里默认开启不会造成作弊风险。
        // 需要关闭时：构建前设 DEBUG_CLIENT=false
        DEBUG_CLIENT: process.env.DEBUG_CLIENT ?? "true"
    };

    // So output directory isn't included (thanks Vite).
    if (isDev) {
        if (existsSync(resolve(DIRNAME, "./dist"))) { rmSync(resolve(DIRNAME, "./dist"), { recursive: true, force: true }); }
    }
    return (isDev ? await import("./vite/vite.dev") : await import("./vite/vite.prod")).default;
});
