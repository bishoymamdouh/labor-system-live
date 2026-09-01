const fs = require("fs");
let content = fs.readFileSync("server.ts", "utf8");

const reminderFunc = `
async function checkPendingReminders(now) {
    const recordsIter = kv.list({ prefix: ["records"] });
    const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
    
    for await (const entry of recordsIter) {
        const record = entry.value;
        if (record.status === 'pending' && record.createdAt && record.engineerId) {
            const createdTime = new Date(record.createdAt).getTime();
            const nowTime = now.getTime();
            const elapsed = nowTime - createdTime;
            
            // Check if at least 3 hours have elapsed since creation
            if (elapsed >= THREE_HOURS_MS) {
                // If it doesn't have lastReminderSentAt, it means we haven't sent ANY reminder yet.
                // We use createdTime as the baseline.
                const lastReminder = record.lastReminderSentAt ? new Date(record.lastReminderSentAt).getTime() : createdTime;
                
                // If 3 hours have passed since the LAST time we sent a reminder (or since creation)
                if (nowTime - lastReminder >= THREE_HOURS_MS) {
                    // Update record in DB so we don't spam
                    record.lastReminderSentAt = now.toISOString();
                    await kv.set(entry.key, record);
                    
                    // Send notification to engineer
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
                            console.error("Push Error (Reminder):", err);
                        }
                    }
                }
            }
        }
    }
}
`;

// Insert the function before setInterval
content = content.replace("setInterval(async () => {", reminderFunc + "\nsetInterval(async () => {");

// Call the function inside setInterval
const callCode = `
    const today = now.toISOString().split('T')[0];
    
    // Check pending 3-hour reminders
    checkPendingReminders(now);
`;
content = content.replace("const today = now.toISOString().split('T')[0];", callCode);

fs.writeFileSync("server.ts", content);
console.log("Added checkPendingReminders logic");
