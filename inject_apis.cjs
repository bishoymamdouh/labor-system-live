const fs = require("fs");
let content = fs.readFileSync("server.ts", "utf8");

const configApis = `
        if (url.pathname === "/api/notificationsConfig" && method === "GET") {
            const entry = await kv.get(["system", "notificationsConfig"]);
            const defaultConfig = {
                scheduled: [{
                    id: "default-daily",
                    title: "تذكير يومي",
                    message: "برجاء تسجيل السراكي واليوميات الخاصة باليوم.",
                    time: "10:00 AM",
                    targets: { roles: ["supervisor", "warehouse_manager", "surveyor", "operator_supervisor"], users: [] },
                    isActive: true
                }],
                system: {
                    pendingReminderActive: true,
                    pendingReminderText: "يوجد طلب/سركي معلق لم تقم بالرد عليه منذ أكثر من 3 ساعات، يرجى مراجعته."
                }
            };
            return new Response(JSON.stringify(entry.value || defaultConfig), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        
        if (url.pathname === "/api/notificationsConfig" && method === "POST") {
            const body = await req.json();
            await kv.set(["system", "notificationsConfig"], body);
            return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
`;

content = content.replace('if (url.pathname === "/api/vapidPublicKey" && method === "GET") {', configApis + '\n        if (url.pathname === "/api/vapidPublicKey" && method === "GET") {');

fs.writeFileSync("server.ts", content);
console.log("Injected Config APIs");
