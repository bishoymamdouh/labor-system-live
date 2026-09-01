const fs = require("fs");
let content = fs.readFileSync("server.ts", "utf8");

const oldSubscribe = `        if (url.pathname === "/api/subscribe" && method === "POST") {
            const body = await req.json();
            if (body.userId && body.subscription) {
                await kv.set(["push_subscriptions", body.userId, body.subscription.endpoint], body.subscription);
                return new Response("Subscribed", { status: 200 });
            }
            return new Response("Bad Request", { status: 400 });
        }`;

const newSubscribe = `        if (url.pathname === "/api/subscribe" && method === "POST") {
            const body = await req.json();
            if (body.userId && body.subscription) {
                const endpoint = body.subscription.endpoint;
                // Delete this endpoint from ANY other user first to prevent phantom notifications
                const allSubs = kv.list({ prefix: ["push_subscriptions"] });
                for await (const sub of allSubs) {
                    if (sub.key[2] === endpoint) {
                        await kv.delete(sub.key);
                    }
                }
                
                await kv.set(["push_subscriptions", body.userId, endpoint], body.subscription);
                return new Response("Subscribed", { status: 200 });
            }
            return new Response("Bad Request", { status: 400 });
        }
        
        if (url.pathname === "/api/unsubscribe" && method === "POST") {
            const body = await req.json();
            if (body.userId && body.endpoint) {
                await kv.delete(["push_subscriptions", body.userId, body.endpoint]);
                return new Response("Unsubscribed", { status: 200 });
            }
            return new Response("Bad Request", { status: 400 });
        }`;

content = content.replace(oldSubscribe, newSubscribe);
fs.writeFileSync("server.ts", content);
console.log("Updated subscribe and added unsubscribe to server.ts");
