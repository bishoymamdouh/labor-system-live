// @ts-nocheck
import { onRequest } from "./functions/api/[[path]].ts";

export default {
    async fetch(request: Request, env: any, ctx: any): Promise<Response> {
        const url = new URL(request.url);
        if (url.pathname.startsWith("/api/")) {
            return await onRequest({ request, env });
        }
        if (env.ASSETS) {
            return await env.ASSETS.fetch(request);
        }
        return new Response("Not found", { status: 404 });
    }
};
