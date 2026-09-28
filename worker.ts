// @ts-nocheck
import { onRequest, D1Store, runNotificationTasks } from "./functions/api/[[path]].ts";

export default {
    async fetch(request: Request, env: any, ctx: any): Promise<Response> {
        const url = new URL(request.url);
        if (url.pathname.startsWith("/api/")) {
            return await onRequest({ request, env, ctx });
        }
        if (env.ASSETS) {
            const response = await env.ASSETS.fetch(request);
            if (url.pathname === "/" || url.pathname.endsWith(".html") || url.pathname.endsWith("sw.js")) {
                const headers = new Headers(response.headers);
                headers.set("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
                headers.set("Pragma", "no-cache");
                headers.set("Expires", "0");
                return new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers
                });
            }
            return response;
        }
        return new Response("Not found", { status: 404 });
    },

    async scheduled(controller: any, env: any, ctx: any): Promise<void> {
        if (!env?.DB) return;
        const store = new D1Store(env.DB);
        const taskPromise = runNotificationTasks(store, false);
        if (ctx && typeof ctx.waitUntil === "function") {
            ctx.waitUntil(taskPromise);
        } else {
            await taskPromise;
        }
    }
};
