const fs = require("fs");
let content = fs.readFileSync("server.ts", "utf8");

const lines = content.split('\n');
const startIndex = lines.findIndex(l => l.includes('async function sendDailyReminder'));

if (startIndex !== -1) {
    const keepLines = lines.slice(0, startIndex);
    
    const newLines = `
async function checkPendingReminders(now, config) {
    if (!config.system.pendingReminderActive) return;
    
    const recordsIter = kv.list({ prefix: ["records"] });
    const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
    
    for await (const entry of recordsIter) {
        const record = entry.value;
        if (record.status === 'pending' && record.createdAt && record.engineerId) {
            const createdTime = new Date(record.createdAt).getTime();
            const nowTime = now.getTime();
            const elapsed = nowTime - createdTime;
            
            if (elapsed >= THREE_HOURS_MS) {
                const lastReminder = record.lastReminderSentAt ? new Date(record.lastReminderSentAt).getTime() : createdTime;
                
                if (nowTime - lastReminder >= THREE_HOURS_MS) {
                    record.lastReminderSentAt = now.toISOString();
                    await kv.set(entry.key, record);
                    
                    const targetId = record.engineerId;
                    const engineerUser = await kv.get(["users", targetId]);
                    const engineerName = engineerUser.value ? engineerUser.value.name : "يا هندسة";
                    
                    const subEntries = kv.list({ prefix: ["push_subscriptions", targetId] });
                    for await (const subEntry of subEntries) {
                        try {
                            const bodyText = config.system.pendingReminderText.replace('{name}', engineerName);
                            await webPush.sendNotification(
                                subEntry.value,
                                JSON.stringify({ 
                                    title: "تذكير: طلب قيد الانتظار", 
                                    body: bodyText, 
                                    url: "/?view_record=" + entry.key[1] 
                                })
                            );
                        } catch (err) {
                            if (err.statusCode === 410) await kv.delete(subEntry.key);
                        }
                    }
                }
            }
        }
    }
}

setInterval(async () => {
    const now = new Date();
    const hour = now.getHours();
    
    const today = now.toISOString().split('T')[0];
    
    // Get config
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
            pendingReminderText: "مرحباً {name}، يوجد طلب/سركي معلق لم تقم بالرد عليه منذ أكثر من 3 ساعات، يرجى مراجعته."
        }
    };
    const config = entry.value || defaultConfig;

    // Check pending 3-hour reminders
    checkPendingReminders(now, config);

    // Process scheduled notifications
    let currentHour = now.getHours();
    const ampm = currentHour >= 12 ? 'PM' : 'AM';
    currentHour = currentHour % 12;
    currentHour = currentHour ? currentHour : 12; // the hour '0' should be '12'
    const currentMin = now.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = \`\${currentHour.toString().padStart(2, '0')}:\${currentMin} \${ampm}\`;

    for (const notif of config.scheduled) {
        if (!notif.isActive) continue;
        
        let notifTime = notif.time;
        if (notifTime.length === 7) notifTime = "0" + notifTime; // Pad "1:00 PM" to "01:00 PM"

        if (notifTime === currentTimeStr) {
            const lastSentKey = ["system", "notif_sent", notif.id];
            const lastSent = await kv.get(lastSentKey);
            
            if (lastSent.value !== today) {
                await kv.set(lastSentKey, today);
                
                const targetIds = new Set(notif.targets.users || []);
                if (notif.targets.roles && notif.targets.roles.length > 0) {
                    const allUsers = kv.list({ prefix: ["users"] });
                    for await (const u of allUsers) {
                        if (notif.targets.roles.includes(u.value.role)) {
                            targetIds.add(u.key[1]);
                        }
                    }
                }
                
                for (const tId of targetIds) {
                    const subEntries = kv.list({ prefix: ["push_subscriptions", tId] });
                    for await (const subEntry of subEntries) {
                        try {
                            await webPush.sendNotification(
                                subEntry.value,
                                JSON.stringify({ title: notif.title, body: notif.message, url: "/" })
                            );
                        } catch (err) {
                            if (err.statusCode === 410) await kv.delete(subEntry.key);
                        }
                    }
                }
            }
        }
    }

    // Daily Backup
    const backupEntry = await kv.get(["system", "lastBackupDate"]);
    const lastBackupDate = backupEntry.value;
    if (hour === 13 && lastBackupDate !== today) {
        await kv.set(["system", "lastBackupDate"], today);
        performDailyBackup();
    }

}, 60000); // Check every minute

performDailyBackup();
console.log("Server running on http://localhost:8000");
serve(handler, { port: 8000 });
`;

    const finalContent = keepLines.join('\n') + '\n' + newLines;
    fs.writeFileSync("server.ts", finalContent);
    console.log("Updated background tasks successfully!");
} else {
    console.log("Could not find start index.");
}
