const fs = require("fs");
let content = fs.readFileSync("server.ts", "utf8");

const oldCode = `                    // Send notification to engineer
                    const targetId = record.engineerId;
                    const subEntries = kv.list({ prefix: ["push_subscriptions", targetId] });
                    for await (const subEntry of subEntries) {
                        try {
                            await webPush.sendNotification(
                                subEntry.value,
                                JSON.stringify({ 
                                    title: "تذكير: طلب اعتماد معلق", 
                                    body: "يوجد سركي قيد الانتظار لم يتم الرد عليه، يرجى مراجعته.", 
                                    url: "/?view_record=" + entry.key[1] 
                                })
                            );
                        } catch (err) {
                            if (err.statusCode === 410) await kv.delete(subEntry.key);
                        }
                    }`;

const newCode = `                    // Send notification to engineer
                    const targetId = record.engineerId;
                    const engineerUser = await kv.get(["users", targetId]);
                    const engineerName = engineerUser.value ? engineerUser.value.name : "يا هندسة";
                    
                    const subEntries = kv.list({ prefix: ["push_subscriptions", targetId] });
                    for await (const subEntry of subEntries) {
                        try {
                            await webPush.sendNotification(
                                subEntry.value,
                                JSON.stringify({ 
                                    title: "تذكير: طلب قيد الانتظار", 
                                    body: \`مرحباً \${engineerName}، يوجد طلب/سركي معلق لم تقم بالرد عليه منذ أكثر من 3 ساعات، يرجى مراجعته.\`, 
                                    url: "/?view_record=" + entry.key[1] 
                                })
                            );
                        } catch (err) {
                            if (err.statusCode === 410) await kv.delete(subEntry.key);
                        }
                    }`;

if(content.includes('تذكير: طلب اعتماد معلق')) {
    content = content.replace(oldCode, newCode);
    fs.writeFileSync("server.ts", content);
    console.log("Updated checkPendingReminders successfully!");
} else {
    console.log("Could not find target code.");
}
