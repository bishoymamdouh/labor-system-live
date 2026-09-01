const fs = require("fs");
let content = fs.readFileSync("server.ts", "utf8");

const oldEndpoint = `        if (url.pathname === "/api/subscribe" && method === "POST") {`;

const newEndpoint = `        if (url.pathname === "/api/updateWorkerName" && method === "POST") {
            try {
                const body = await req.json();
                const { oldName, newName } = body;
                if (!oldName || !newName) return new Response("Bad Request", { status: 400 });
                
                let count = 0;
                const workersIter = kv.list({ prefix: ["workers"] });
                for await (const entry of workersIter) {
                    if (entry.value.name === oldName) {
                        const updated = { ...entry.value, name: newName };
                        await kv.set(entry.key, updated);
                        count++;
                    }
                }
                return new Response(JSON.stringify({ success: true, updatedCount: count }), { status: 200, headers: { "Content-Type": "application/json" } });
            } catch (err) {
                return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
            }
        }

        if (url.pathname === "/api/subscribe" && method === "POST") {`;

content = content.replace(oldEndpoint, newEndpoint);
fs.writeFileSync("server.ts", content);
console.log("Added /api/updateWorkerName to backend");
