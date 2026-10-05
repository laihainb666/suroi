import { mergeConfig, type UserConfig } from "vite";

import { ViteMinifyPlugin } from "vite-plugin-minify";
import common from "./vite.common";

const config: UserConfig = {
    define: {
        API_URL: JSON.stringify("/api"),
        // 增强：默认开启调试客户端（调试菜单 + 控制台）。
        // vite.config.ts 已把 DEBUG_CLIENT 默认设为 "true"，
        // 这里保持一致，只在显式传入 "false" 时关闭。
        DEBUG_CLIENT: process.env.DEBUG_CLIENT !== "false",
        __PUBLIC_ADDR__: JSON.stringify(process.env.PUBLIC_ADDR ?? "127.0.0.1"),
        __PUBLIC_MAIN_PORT__: JSON.stringify(process.env.PUBLIC_MAIN_PORT ?? "8000"),
        __PUBLIC_GAME_OFFSET__: JSON.stringify(process.env.PUBLIC_GAME_OFFSET ?? "8001")
    },
    plugins: [ViteMinifyPlugin()]
};

export default mergeConfig(common, config);
