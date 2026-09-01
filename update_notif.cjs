const fs = require("fs");
let content = fs.readFileSync("server.ts", "utf8");

const oldCode = `            // Send Push Notification if pending record
            if (collection === "records" && body.status === "pending") {
                const targetIds = new Set();`;

const newCode = `            // Send Push Notification if pending record
            if (collection === "records" && body.status === "pending") {
                let supervisorName = "مشرف";
                if (body.supervisorId) {
                    const sup = await kv.get(["users", String(body.supervisorId)]);
                    if (sup.value) supervisorName = sup.value.username;
                }
                const targetIds = new Set();`;

content = content.replace(oldCode, newCode);

const oldNotif = `JSON.stringify({ title: "طلب اعتماد جديد", body: "يوجد سركي جديد بانتظار الاعتماد", url: "/?view_record=" + id, badgeCount: pendingCount })`;
const newNotif = `JSON.stringify({ title: "طلب اعتماد جديد", body: \`يوجد سركي جديد من \${supervisorName} بانتظار الاعتماد\`, url: "/?view_record=" + id, badgeCount: pendingCount })`;

content = content.replace(oldNotif, newNotif);

fs.writeFileSync("server.ts", content);
console.log("Updated push notification to include supervisor name");
