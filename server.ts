// @ts-nocheck

import { serveDir } from "https://deno.land/std@0.177.0/http/file_server.ts";
import ExcelJS from "npm:exceljs";
import webPush from "npm:web-push";

const VAPID_PUBLIC = "BMnqakLZm3Nd93xNUMPOEcOKzmONIusdFaOhuk59jc46aR4b_D2frW_0nryIGSUZbwhMG_2WwLppzRqE0pVDKAc";
const VAPID_PRIVATE = "4vLaY01kxCnkgqgsvRkBKarGcH1yyU5o47ezN5kPYDE";
webPush.setVapidDetails("mailto:admin@example.com", VAPID_PUBLIC, VAPID_PRIVATE);

const isDeploy = !!Deno.env.get("DENO_REGION") || !!Deno.env.get("DENO_DEPLOYMENT_ID");
let kv;
async function handler(req: Request): Promise<Response> {
    if (!kv) {
        kv = isDeploy ? await Deno.openKv() : await Deno.openKv("./database.sqlite");
    }
    const url = new URL(req.url);
    const method = req.method;

    // API Routes
    if (url.pathname.startsWith("/api/")) {
        const collection = url.pathname.split("/")[2];
        const method = req.method;

        if (url.pathname === "/api/logs" && method === "POST") {
            const body = await req.json();
            console.log("FRONTEND ERROR:", body);
            return new Response("Logged", { status: 200 });
        }
        
        if (url.pathname === "/api/backup" && method === "POST") {
            await performDailyBackup();
            return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        
        
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

        if (url.pathname === "/api/vapidPublicKey" && method === "GET") {
            return new Response(VAPID_PUBLIC, { status: 200 });
        }
        
        if (url.pathname === "/api/updateWorkerName" && method === "POST") {
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

        if (url.pathname === "/api/subscribe" && method === "POST") {
            const body = await req.json();
            if (body.userId && body.subscription) {
                await kv.set(["push_subscriptions", body.userId, body.subscription.endpoint], body.subscription);
                return new Response("Subscribed", { status: 200 });
            }
            return new Response("Bad Request", { status: 400 });
        }

        // ---- KV MIGRATION ENDPOINT ----
        if (url.pathname === "/api/migrate-kv" && method === "POST") {
            try {
                const body = await req.json();
                let count = 0;
                for (const item of body.items) {
                    await kv.set(item.key, item.value);
                    count++;
                }
                return new Response("Migrated " + count + " items successfully", { status: 200 });
            } catch(e) {
                return new Response("Migration error: " + e.message, { status: 500 });
            }
        }
        // -------------------------------

        if (url.pathname === "/api/export" && method === "GET") {
            const data: any = {};
            for (const collection of ["users", "records", "workers", "worker_directory"]) {
                data[collection] = [];
                const entries = kv.list({ prefix: [collection] });
                for await (const entry of entries) {
                    data[collection].push({ key: entry.key, value: entry.value });
                }
            }
            return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
        }

        if (url.pathname === "/api/broadcast" && method === "POST") {
            try {
                const body = await req.json();
                const { title, message, target } = body;
                
                let targetIds = [];
                if (target === "all") {
                    const users = kv.list({ prefix: ["users"] });
                    for await (const u of users) {
                        targetIds.push(u.key[1]);
                    }
                } else if (Array.isArray(target)) {
                    targetIds = target;
                } else {
                    targetIds = (target || "").toString().split(',');
                }

                let sentCount = 0;
                for (const tId of targetIds) {
                    const subEntries = kv.list({ prefix: ["push_subscriptions", tId] });
                    for await (const subEntry of subEntries) {
                        try {
                            await webPush.sendNotification(
                                subEntry.value,
                                JSON.stringify({ title: title || "إشعار من الإدارة", body: message, url: body.url || "/" })
                            );
                            sentCount++;
                        } catch (err) {
                            console.error("WebPush error:", err);
                            if (err.statusCode === 410) await kv.delete(subEntry.key);
                        }
                    }
                }
                return new Response(JSON.stringify({ success: true, sent: sentCount }), { status: 200 });
            } catch (globalErr) {
                console.error("Broadcast API Error:", globalErr);
                return new Response(JSON.stringify({ error: globalErr.message || globalErr.toString() }), { status: 500 });
            }
        }

        if (url.pathname === "/api/import" && method === "POST") {
            const data = await req.json();
            for (const collection of ["users", "records", "workers", "worker_directory"]) {
                if (data[collection]) {
                    for (const item of data[collection]) {
                        await kv.set(item.key, item.value);
                    }
                }
            }
            return new Response("Imported successfully", { status: 200 });
        }

        // Ensure collection exists
        if (!["users", "records", "workers", "worker_directory"].includes(collection) && collection !== "recordDetails" && collection !== "allRecordsDetails") {
            return new Response("Not found", { status: 404 });
        }

        if (collection === "recordDetails" && method === "GET") {
            const id = url.searchParams.get("id");
            if (!id) return new Response("Missing id", { status: 400 });
            
            const recordRes = await kv.get(["records", id]);
            if (!recordRes.value) return new Response("Record not found", { status: 404 });
            const record = { id, ...recordRes.value };
            
            const usersEntries = kv.list({ prefix: ["users"] });
            const users = [];
            for await (const u of usersEntries) {
                users.push({ id: u.key[1], ...u.value });
            }
            
            const workersEntries = kv.list({ prefix: ["workers"] });
            const workers = [];
            for await (const w of workersEntries) {
                if (w.value.recordId === id) {
                    workers.push({ id: w.key[1], ...w.value });
                }
            }
            
            return new Response(JSON.stringify({ record, users, workers }), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
        }

        if (collection === "allRecordsDetails" && method === "GET") {
            const recordsEntries = kv.list({ prefix: ["records"] });
            const records = [];
            for await (const r of recordsEntries) {
                records.push({ id: r.key[1], ...r.value });
            }

            const usersEntries = kv.list({ prefix: ["users"] });
            const users = [];
            for await (const u of usersEntries) {
                users.push({ id: u.key[1], ...u.value });
            }

            const workersEntries = kv.list({ prefix: ["workers"] });
            const workers = [];
            for await (const w of workersEntries) {
                workers.push({ id: w.key[1], ...w.value });
            }
            
            // Map users
            const usersMap = {};
            users.forEach(u => usersMap[u.id] = u.username);
            
            // Group workers
            const workersByRecord = {};
            workers.forEach(w => {
                if (!workersByRecord[w.recordId]) workersByRecord[w.recordId] = [];
                workersByRecord[w.recordId].push(w);
            });
            
            // Attach details to records
            const detailedRecords = records.map(r => ({
                ...r,
                supervisorName: usersMap[r.supervisorId] || 'غير معروف',
                engineerName: usersMap[r.engineerId] || 'غير معروف',
                workers: workersByRecord[r.id] || []
            }));

            return new Response(JSON.stringify(detailedRecords), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
        }

        if (method === "GET") {
            const id = url.searchParams.get("id");
            if (id) {
                // Get single by id
                const result = await kv.get([collection, id]);
                return new Response(JSON.stringify(result.value ? { id, ...result.value } : null), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
            } else {
                // Get all
                const entries = kv.list({ prefix: [collection] });
                const list = [];
                
                const filters = {};
                for (const [key, value] of url.searchParams.entries()) {
                    if (key !== 'id') filters[key] = value;
                }

                for await (const entry of entries) {
                    let match = true;
                    for (const key in filters) {
                        if (String(entry.value[key]) !== String(filters[key])) {
                            match = false;
                            break;
                        }
                    }
                    if (match) {
                        list.push({ id: entry.key[1], ...entry.value });
                    }
                }
                return new Response(JSON.stringify(list), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
            }
        }

        if (method === "POST") {
            const body = await req.json();
            // Server-side validation removed to allow admin custom dates

            // Handle specific ID (like admin)
            const id = body.id || crypto.randomUUID();
            delete body.id;
            
            await kv.set([collection, id], body);
            
            // Send Push Notification if pending record
            if (collection === "records" && body.status === "pending") {
                let supervisorName = "مشرف";
                if (body.supervisorId) {
                    const usersIter = kv.list({ prefix: ["users"] });
                    for await (const u of usersIter) {
                        if (u.key[1] === String(body.supervisorId)) {
                            supervisorName = u.value.username;
                            break;
                        }
                    }
                }
                const targetIds = new Set();
                if (body.engineerId) targetIds.add(body.engineerId);
                
                for (const targetId of targetIds) {
                    let pendingCount = 0;
                    const recordsIter = kv.list({ prefix: ["records"] });
                    for await (const entry of recordsIter) {
                        if (entry.value.status === 'pending' && entry.value.engineerId === targetId) {
                            pendingCount++;
                        }
                    }

                    const subEntries = kv.list({ prefix: ["push_subscriptions", targetId] });
                    for await (const subEntry of subEntries) {
                        try {
                            await webPush.sendNotification(
                                subEntry.value,
                                JSON.stringify({ title: "طلب اعتماد جديد", body: `يوجد سركي جديد من ${supervisorName} بانتظار الاعتماد`, url: "/?view_record=" + id, badgeCount: pendingCount })
                            );
                        } catch (err) {
                            if (err.statusCode === 410) await kv.delete(subEntry.key);
                            console.error("Push Error:", err);
                        }
                    }
                }
            }
            
            return new Response(JSON.stringify({ id, ...body }), { status: 201, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
        }

        if (method === "PUT") {
            const body = await req.json();
            const id = url.searchParams.get("id");
            if (!id) return new Response("Missing id", { status: 400 });

            const current = await kv.get([collection, id]);
            if (!current.value) return new Response("Not found", { status: 404 });

            await kv.set([collection, id], { ...current.value, ...body });
            
            // Send Push Notification to supervisor if record status changed
            if (collection === "records" && body.status && body.status !== current.value.status) {
                const supervisorId = current.value.supervisorId;
                if (supervisorId) {
                    const statusText = body.status === 'approved' ? 'اعتماد' : 'رفض';
                    const titleText = `تم ${statusText} طلبك`;
                    const bodyText = `تم ${statusText} السركي الخاص بيوم ${current.value.date}`;
                    
                    const subEntries = kv.list({ prefix: ["push_subscriptions", supervisorId] });
                    for await (const subEntry of subEntries) {
                        try {
                            await webPush.sendNotification(
                                subEntry.value,
                                JSON.stringify({ title: titleText, body: bodyText, url: "/?view_record=" + id })
                            );
                        } catch (err) {
                            if (err.statusCode === 410) await kv.delete(subEntry.key);
                            console.error("Push Error:", err);
                        }
                    }
                }
            }
            
            return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
        }

        if (method === "DELETE") {
            const id = url.searchParams.get("id");
            if (!id) return new Response("Missing id", { status: 400 });

            await kv.delete([collection, id]);
            return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
        }

        return new Response("Method not allowed", { status: 405 });
    }

    // Serve static files
    const res = await serveDir(req, {
        headers: ["Cache-Control: no-cache, no-store, must-revalidate", "Pragma: no-cache", "Expires: 0"],
        fsRoot: ".",
        urlRoot: "",
        showDirListing: true,
        enableCors: true,
    });

    // Disable caching for root and JS/HTML so updates are visible
    if (url.pathname === "/" || url.pathname.endsWith(".html") || url.pathname.endsWith(".js") || url.pathname.endsWith(".css")) {
        res.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
        res.headers.set("Pragma", "no-cache");
        res.headers.set("Expires", "0");
    }

    return res;
}

// --- Auto Backup System ---
async function performDailyBackup() {
    if (isDeploy) {
        console.log("Backups disabled on Deno Deploy (read-only filesystem).");
        return;
    }
    if (!kv) return;
    try {
        const dateStr = new Date().toISOString().split("T")[0];
        const exportData = {};
        for await (const entry of kv.list({ prefix: [] })) {
            const collection = entry.key[0];
            if (!exportData[collection]) exportData[collection] = [];
            exportData[collection].push({ key: entry.key, value: entry.value });
        }
        await Deno.mkdir("./backups", { recursive: true });
        await Deno.writeTextFile(`./backups/system_backup_${dateStr}.json`, JSON.stringify(exportData, null, 2));
        console.log(`Daily backup saved: system_backup_${dateStr}.json`);
    } catch (e) {
        console.error("Backup failed:", e);
    }
}


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



performDailyBackup();
console.log("Server running on http://localhost:8000");
Deno.serve({ port: 8000 }, handler);














