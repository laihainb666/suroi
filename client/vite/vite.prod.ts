import { mergeConfig, type UserConfig } from "vite";

import { ViteMinifyPlugin } from "vite-plugin-minify";
import common from "./vite.common";

const config: UserConfig = {
    define: {
        API_URL: JSON.stringify("/api"),
        DEBUG_CLIENT: process.env.DEBUG_CLIENT === "true",
        __PUBLIC_ADDR__: JSON.stringify(process.env.PUBLIC_ADDR ?? "127.0.0.1"),
        __PUBLIC_MAIN_PORT__: JSON.stringify(process.env.PUBLIC_MAIN_PORT ?? "8000"),
        __PUBLIC_GAME_OFFSET__: JSON.stringify(process.env.PUBLIC_GAME_OFFSET ?? "8001")
    },
    plugins: [ViteMinifyPlugin()]
};

export default mergeConfig(common, config);
