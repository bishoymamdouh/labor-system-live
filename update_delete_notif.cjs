const fs = require("fs");
let content = fs.readFileSync("server.ts", "utf8");

const oldDelete = `        if (method === "DELETE") {
            const id = url.searchParams.get("id");
            if (!id) return new Response("Missing id", { status: 400 });

            await kv.delete([collection, id]);
            return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
        }`;

const newDelete = `        if (method === "DELETE") {
            const id = url.searchParams.get("id");
            if (!id) return new Response("Missing id", { status: 400 });

            if (collection === "records") {
                const current = await kv.get(["records", id]);
                if (current.value && current.value.supervisorId) {
                    const supervisorId = current.value.supervisorId;
                    const titleText = "تم حذف طلبك";
                    const bodyText = \`تم حذف السركي الخاص بيوم \${current.value.date} من النظام\`;
                    
                    const subEntries = kv.list({ prefix: ["push_subscriptions", supervisorId] });
                    for await (const subEntry of subEntries) {
                        try {
                            await webPush.sendNotification(
                                subEntry.value,
                                JSON.stringify({ title: titleText, body: bodyText, url: "/" })
                            );
                        } catch (err) {
                            if (err.statusCode === 410) await kv.delete(subEntry.key);
                            console.error("Push Error:", err);
                        }
                    }
                }
            }

            await kv.delete([collection, id]);
            return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
        }`;

content = content.replace(oldDelete, newDelete);
fs.writeFileSync("server.ts", content);
console.log("Added push notification for DELETE");
