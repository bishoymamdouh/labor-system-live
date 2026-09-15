// @ts-nocheck

import { serveDir } from "https://deno.land/std@0.177.0/http/file_server.ts";
import ExcelJS from "npm:exceljs";
import webPush from "npm:web-push";

const VAPID_PUBLIC = "BMnqakLZm3Nd93xNUMPOEcOKzmONIusdFaOhuk59jc46aR4b_D2frW_0nryIGSUZbwhMG_2WwLppzRqE0pVDKAc";
const VAPID_PRIVATE = "4vLaY01kxCnkgqgsvRkBKarGcH1yyU5o47ezN5kPYDE";
webPush.setVapidDetails("mailto:admin@example.com", VAPID_PUBLIC, VAPID_PRIVATE);

const isDeploy = !!Deno.env.get("DENO_REGION") || !!Deno.env.get("DENO_DEPLOYMENT_ID");
let kv;

interface PendingIndexEntry {
    engineerId: string;
    createdAt: string;
    date?: string;
    lastReminderSentAt?: string | null;
}

function parsePendingEntry(val: any): PendingIndexEntry {
    if (typeof val === 'string') {
        return {
            engineerId: val,
            createdAt: new Date().toISOString(),
            date: '',
            lastReminderSentAt: null
        };
    }
    if (val && typeof val === 'object') {
        return {
            engineerId: String(val.engineerId || ''),
            createdAt: val.createdAt || new Date().toISOString(),
            date: val.date || '',
            lastReminderSentAt: val.lastReminderSentAt || null
        };
    }
    return {
        engineerId: '',
        createdAt: new Date().toISOString(),
        date: '',
        lastReminderSentAt: null
    };
}

let memoryPendingIndex: { [recordId: string]: any } | null = null;
let lastPendingIndexFetch = 0;

async function getPendingIndex(kvInstance: any) {
    const now = Date.now();
    if (memoryPendingIndex && (now - lastPendingIndexFetch < 45000)) {
        return memoryPendingIndex;
    }
    
    try {
        const entry = await kvInstance.get(["system", "pending_index"]);
        if (entry && entry.value) {
            memoryPendingIndex = entry.value;
            lastPendingIndexFetch = now;
            return memoryPendingIndex;
        }
    } catch(e) {
        console.error("Error reading pending_index:", e);
    }
    
    // Initial build of index if not exists (runs only once)
    const index: { [recordId: string]: any } = {};
    const recordsIter = kvInstance.list({ prefix: ["records"] });
    for await (const r of recordsIter) {
        if (r.value && r.value.status === 'pending') {
            index[String(r.key[1])] = {
                engineerId: String(r.value.engineerId || ''),
                createdAt: r.value.createdAt || new Date().toISOString(),
                date: r.value.date || '',
                lastReminderSentAt: r.value.lastReminderSentAt || null
            };
        }
    }
    await kvInstance.set(["system", "pending_index"], index);
    memoryPendingIndex = index;
    lastPendingIndexFetch = now;
    return memoryPendingIndex;
}

async function updatePendingIndexOnSave(kvInstance: any, recordId: string, status: string, engineerId?: string, createdAt?: string, date?: string) {
    const index = await getPendingIndex(kvInstance);
    if (status === 'pending') {
        const existing = index[String(recordId)] ? parsePendingEntry(index[String(recordId)]) : null;
        index[String(recordId)] = {
            engineerId: String(engineerId || (existing ? existing.engineerId : '')),
            createdAt: createdAt || (existing ? existing.createdAt : new Date().toISOString()),
            date: date || (existing ? existing.date : ''),
            lastReminderSentAt: existing ? existing.lastReminderSentAt : null
        };
    } else {
        delete index[String(recordId)];
    }
    memoryPendingIndex = index;
    lastPendingIndexFetch = Date.now();
    await kvInstance.set(["system", "pending_index"], index);
}

let memoryNotificationsConfig: any = null;
let lastNotificationsConfigFetch = 0;

async function getNotificationsConfig(kvInstance: any) {
    const now = Date.now();
    if (memoryNotificationsConfig && (now - lastNotificationsConfigFetch < 60000)) {
        return memoryNotificationsConfig;
    }
    try {
        const entry = await kvInstance.get(["system", "notificationsConfig"]);
        if (entry && entry.value) {
            memoryNotificationsConfig = entry.value;
            lastNotificationsConfigFetch = now;
            return memoryNotificationsConfig;
        }
    } catch (e) {
        console.error("Error reading notificationsConfig:", e);
    }
    const defaultConfig = {
        systemReminders: {
            pendingReminder: {
                isActive: true,
                hours: 3,
                text: "يوجد سركي معلق بانتظار اعتمادك منذ أكثر من {hours} ساعات، يرجى مراجعته."
            }
        },
        scheduled: [{
            id: "default-daily",
            title: "تذكير يومي بالسراكي",
            message: "برجاء تسجيل السراكي واليوميات الخاصة باليوم ومراجعة المهام.",
            time: "10:00 AM",
            targets: { roles: ["supervisor", "warehouse_manager", "surveyor", "operator_supervisor"], users: [] },
            isActive: true,
            lastSentDate: null
        }]
    };
    memoryNotificationsConfig = defaultConfig;
    lastNotificationsConfigFetch = now;
    return defaultConfig;
}

async function dispatchInstantAlerts(kvInstance: any, triggerEvent: string, context: {
    recordId?: string;
    supervisorId?: string;
    supervisorName?: string;
    engineerId?: string;
    date?: string;
    status?: string;
    workerName?: string;
}) {
    try {
        const notifCfg = await getNotificationsConfig(kvInstance);
        let alerts: any[] = [];
        if (Array.isArray(notifCfg.instantAlerts) && notifCfg.instantAlerts.length > 0) {
            alerts = notifCfg.instantAlerts;
        } else {
            const b = notifCfg.builtInAlerts || {};
            alerts = [
                { id: "newRecord", name: "طلب اعتماد سركي جديد", trigger: "new_record", targetRole: "engineer", isActive: b.newRecord?.isActive !== false, title: b.newRecord?.title || "طلب اعتماد سركي جديد", text: b.newRecord?.text || "قام المشرف {supervisor} بتقديم سركي جديد بانتظار اعتمادك (إجمالي المعلق: {count})" },
                { id: "recordReview", name: "نتيجة مراجعة السركي", trigger: "record_review", targetRole: "supervisor", isActive: b.recordReview?.isActive !== false, title: b.recordReview?.title || "نتيجة مراجعة السركي", text: b.recordReview?.text || "تم {status} السركي الخاص بيوم {date}" },
                { id: "recordResubmit", name: "إعادة إرسال أو تعديل", trigger: "record_resubmit", targetRole: "engineer", isActive: b.recordResubmit?.isActive !== false, title: b.recordResubmit?.title || "إعادة تقديم سركي", text: b.recordResubmit?.text || "قام المشرف {supervisor} بتعديل وإعادة تقديم السركي الخاص بيوم {date}" }
            ];
        }

        const matching = alerts.filter(a => {
            if (a.isActive === false) return false;
            if (a.trigger === triggerEvent) return true;
            if (triggerEvent === "record_approved" && (a.trigger === "record_approved" || a.trigger === "record_review")) return true;
            if (triggerEvent === "record_rejected" && (a.trigger === "record_rejected" || a.trigger === "record_review")) return true;
            return false;
        });

        if (matching.length === 0) return;

        let cachedUsers: any[] | null = null;
        const fetchUsers = async () => {
            if (cachedUsers) return cachedUsers;
            cachedUsers = [];
            const iter = kvInstance.list({ prefix: ["users"] });
            for await (const u of iter) {
                cachedUsers.push({ id: String(u.key[1]), ...u.value });
            }
            return cachedUsers;
        };

        let supervisorName = context.supervisorName;
        if (!supervisorName && context.supervisorId) {
            const users = await fetchUsers();
            const found = users.find(u => u.id === String(context.supervisorId));
            supervisorName = found?.name || found?.username || "مشرف";
        }

        const statusLabel = context.status === "approved" ? "اعتماد" : (context.status === "rejected" ? "رفض" : (context.status || ""));

        for (const alert of matching) {
            const targetIds = new Set<string>();
            const role = alert.targetRole || (alert.trigger === "new_record" || alert.trigger === "record_resubmit" ? "engineer" : "supervisor");

            if (role === "record_engineer" || (role === "engineer" && context.engineerId)) {
                if (context.engineerId) {
                    targetIds.add(String(context.engineerId));
                } else {
                    const users = await fetchUsers();
                    users.filter(u => u.role === "engineer").forEach(u => targetIds.add(u.id));
                }
            } else if (role === "record_supervisor" || (role === "supervisor" && context.supervisorId)) {
                if (context.supervisorId) {
                    targetIds.add(String(context.supervisorId));
                } else {
                    const users = await fetchUsers();
                    users.filter(u => u.role === "supervisor").forEach(u => targetIds.add(u.id));
                }
            } else {
                const users = await fetchUsers();
                users.forEach(u => {
                    if (role === "all") {
                        targetIds.add(u.id);
                    } else if (u.role === role) {
                        targetIds.add(u.id);
                    }
                });
            }

            const titleText = (alert.title || alert.name || "تنبيه النظام")
                .replace(/\{status\}/g, statusLabel)
                .replace(/\{supervisor\}/g, supervisorName || "")
                .replace(/\{date\}/g, context.date || "");

            for (const targetId of targetIds) {
                let pendingCount = 0;
                if (alert.trigger === "new_record" || (alert.text && alert.text.includes("{count}"))) {
                    const index = await getPendingIndex(kvInstance);
                    for (const rId in index) {
                        const item = parsePendingEntry(index[rId]);
                        if (item.engineerId === targetId) pendingCount++;
                    }
                }

                const bodyText = (alert.text || "")
                    .replace(/\{supervisor\}/g, supervisorName || "")
                    .replace(/\{count\}/g, String(pendingCount))
                    .replace(/\{status\}/g, statusLabel)
                    .replace(/\{date\}/g, context.date || "")
                    .replace(/\{worker\}/g, context.workerName || "");

                const subEntries = kvInstance.list({ prefix: ["push_subscriptions", targetId] });
                for await (const subEntry of subEntries) {
                    try {
                        await webPush.sendNotification(
                            subEntry.value,
                            JSON.stringify({
                                title: titleText,
                                body: bodyText,
                                url: context.recordId ? "/?view_record=" + context.recordId : "/",
                                badgeCount: pendingCount
                            })
                        );
                    } catch (err: any) {
                        if (err.statusCode === 410) await kvInstance.delete(subEntry.key);
                        console.error("Push Error:", err);
                    }
                }
            }
        }
    } catch (e) {
        console.error("dispatchInstantAlerts error:", e);
    }
}

let memoryAllRecordsDetails: any = null;
let lastAllRecordsDetailsFetch = 0;

let memoryUsers: any = null;
let lastUsersFetch = 0;

let memoryWorkerDirectory: any = null;
let lastWorkerDirectoryFetch = 0;

function invalidateCache(collection?: string) {
    if (!collection || collection === "records" || collection === "workers") {
        memoryAllRecordsDetails = null;
        lastAllRecordsDetailsFetch = 0;
    }
    if (!collection || collection === "users") {
        memoryUsers = null;
        lastUsersFetch = 0;
    }
    if (!collection || collection === "worker_directory") {
        memoryWorkerDirectory = null;
        lastWorkerDirectoryFetch = 0;
    }
}

async function handler(req: Request): Promise<Response> {
    if (!kv) {
        kv = isDeploy ? await Deno.openKv() : await Deno.openKv(Deno.env.get("DENO_REGION") ? undefined : "./database.sqlite");
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
            const config = await getNotificationsConfig(kv);
            return new Response(JSON.stringify(config), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        
        if (url.pathname === "/api/notificationsConfig" && method === "POST") {
            const body = await req.json();
            await kv.set(["system", "notificationsConfig"], body);
            memoryNotificationsConfig = body;
            lastNotificationsConfigFetch = Date.now();
            return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
        }

        if (url.pathname === "/api/triggerNotificationTasks" && method === "POST") {
            const force = url.searchParams.get("force") === "true";
            const result = await runNotificationTasks(force);
            return new Response(JSON.stringify({ success: true, result }), { status: 200, headers: { "Content-Type": "application/json" } });
        }

        if (url.pathname === "/api/vapidPublicKey" && method === "GET") {
            return new Response(VAPID_PUBLIC, { status: 200 });
        }
        
        if (url.pathname === "/api/pendingCount" && method === "GET") {
            const engineerId = url.searchParams.get("engineerId");
            const index = await getPendingIndex(kv);
            let count = 0;
            for (const rId in index) {
                const item = parsePendingEntry(index[rId]);
                if (!engineerId || item.engineerId === String(engineerId)) {
                    count++;
                }
            }
            return new Response(JSON.stringify({ count }), { 
                status: 200, 
                headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } 
            });
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
                if (count > 0) {
                    invalidateCache('workers');
                    invalidateCache('records');
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

        if (url.pathname === "/api/unsubscribe" && method === "POST") {
            const body = await req.json();
            if (body.userId && body.endpoint) {
                await kv.delete(["push_subscriptions", body.userId, body.endpoint]);
                return new Response("Unsubscribed", { status: 200 });
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

        if (url.pathname === "/api/backup") {
            const nowIso = new Date().toISOString();
            await kv.set(["system", "lastBackup"], nowIso);

            if (method === "GET" || url.searchParams.get("download") === "true") {
                const data: any = {};
                for (const collection of ["users", "records", "workers", "worker_directory", "push_subscriptions", "system"]) {
                    data[collection] = [];
                    const entries = kv.list({ prefix: [collection] });
                    for await (const entry of entries) {
                        data[collection].push({ key: entry.key, value: entry.value });
                    }
                }
                const dateStr = nowIso.split("T")[0];
                return new Response(JSON.stringify(data, null, 2), {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json",
                        "Content-Disposition": `attachment; filename="labor_backup_${dateStr}.json"`,
                        "Cache-Control": "no-store"
                    }
                });
            }

            return new Response(JSON.stringify({ success: true, lastBackup: nowIso }), {
                status: 200,
                headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
            });
        }

        if (url.pathname === "/api/backupConfig" && method === "GET") {
            const entry = await kv.get(["system", "backupConfig"]);
            const config = entry?.value || {
                autoBackupActive: true,
                onExcelExport: true,
                onRecordApprove: true,
                dailyAuto: true,
                dailyTime: "11:00 PM"
            };
            return new Response(JSON.stringify(config), {
                status: 200,
                headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
            });
        }

        if (url.pathname === "/api/backupConfig" && method === "POST") {
            const body = await req.json();
            await kv.set(["system", "backupConfig"], body);
            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
            });
        }

        if (url.pathname === "/api/backupStats" && method === "GET") {
            let userCount = 0;
            for await (const _ of kv.list({ prefix: ["users"] })) userCount++;
            let recordCount = 0;
            for await (const _ of kv.list({ prefix: ["records"] })) recordCount++;
            let workerCount = 0;
            for await (const _ of kv.list({ prefix: ["workers"] })) workerCount++;
            let dirCount = 0;
            for await (const _ of kv.list({ prefix: ["worker_directory"] })) dirCount++;
            const lastBackupEntry = await kv.get(["system", "lastBackup"]);
            const lastBackup = lastBackupEntry?.value || null;

            return new Response(JSON.stringify({
                users: userCount,
                records: recordCount,
                workers: workerCount,
                workerDirectory: dirCount,
                lastBackup: lastBackup
            }), {
                status: 200,
                headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
            });
        }

        if (url.pathname === "/api/export" && method === "GET") {
            const data: any = {};
            for (const collection of ["users", "records", "workers", "worker_directory", "push_subscriptions", "system"]) {
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
            for (const collection of ["users", "records", "workers", "worker_directory", "push_subscriptions", "system"]) {
                if (data[collection]) {
                    for (const item of data[collection]) {
                        await kv.set(item.key, item.value);
                    }
                }
            }
            invalidateCache("users");
            invalidateCache("records");
            invalidateCache("workers");
            invalidateCache("worker_directory");
            await initPendingIndex(kv);
            return new Response("Imported successfully", { status: 200 });
        }

        // Ensure collection exists
        if (!["users", "records", "workers", "worker_directory", "push_subscriptions"].includes(collection) && collection !== "recordDetails" && collection !== "allRecordsDetails") {
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
            const now = Date.now();
            if (memoryAllRecordsDetails && (now - lastAllRecordsDetailsFetch < 45000)) {
                return new Response(JSON.stringify(memoryAllRecordsDetails), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
            }

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

            memoryAllRecordsDetails = detailedRecords;
            lastAllRecordsDetailsFetch = now;

            return new Response(JSON.stringify(detailedRecords), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
        }

        if (method === "GET") {
            const id = url.searchParams.get("id");
            if (id) {
                // Get single by id
                const result = await kv.get([collection, id]);
                return new Response(JSON.stringify(result.value ? { id, ...result.value } : null), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
            } else {
                const isPlainGetAll = Array.from(url.searchParams.keys()).length === 0;
                const now = Date.now();

                if (isPlainGetAll && collection === "users" && memoryUsers && (now - lastUsersFetch < 120000)) {
                    return new Response(JSON.stringify(memoryUsers), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
                }

                if (isPlainGetAll && collection === "worker_directory" && memoryWorkerDirectory && (now - lastWorkerDirectoryFetch < 120000)) {
                    return new Response(JSON.stringify(memoryWorkerDirectory), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
                }

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

                if (isPlainGetAll) {
                    if (collection === "users") {
                        memoryUsers = list;
                        lastUsersFetch = now;
                    } else if (collection === "worker_directory") {
                        memoryWorkerDirectory = list;
                        lastWorkerDirectoryFetch = now;
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
            invalidateCache(collection);
            if (collection === "records") {
                await updatePendingIndexOnSave(kv, id, body.status, body.engineerId, body.createdAt, body.date);
            }
            
            // Send Push Notification if pending record
            if (collection === "records" && body.status === "pending") {
                await dispatchInstantAlerts(kv, "new_record", {
                    recordId: id,
                    supervisorId: body.supervisorId,
                    engineerId: body.engineerId,
                    date: body.date,
                    status: "pending"
                });
            }

            // Send Push Notification if new worker added
            if (collection === "worker_directory" && body.name) {
                await dispatchInstantAlerts(kv, "new_worker", {
                    workerName: body.name
                });
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
            invalidateCache(collection);
            if (collection === "records") {
                const newStatus = body.status !== undefined ? body.status : current.value.status;
                const engId = body.engineerId !== undefined ? body.engineerId : current.value.engineerId;
                const createdAt = body.createdAt !== undefined ? body.createdAt : current.value.createdAt;
                const date = body.date !== undefined ? body.date : current.value.date;
                await updatePendingIndexOnSave(kv, id, newStatus, engId, createdAt, date);
            }
            
            // Send Instant Alerts for record updates
            if (collection === "records" && body.status && body.status !== current.value.status) {
                if (current.value.status === "rejected" && body.status === "pending") {
                    await dispatchInstantAlerts(kv, "record_resubmit", {
                        recordId: id,
                        supervisorId: current.value.supervisorId,
                        engineerId: body.engineerId || current.value.engineerId,
                        date: body.date || current.value.date,
                        status: "pending"
                    });
                } else if (body.status === "approved" || body.status === "rejected") {
                    await dispatchInstantAlerts(kv, body.status === "approved" ? "record_approved" : "record_rejected", {
                        recordId: id,
                        supervisorId: current.value.supervisorId,
                        engineerId: body.engineerId || current.value.engineerId,
                        date: body.date || current.value.date,
                        status: body.status
                    });
                }
            }
            
            return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
        }

        if (method === "DELETE") {
            const id = url.searchParams.get("id");
            if (!id) return new Response("Missing id", { status: 400 });

            await kv.delete([collection, id]);
            invalidateCache(collection);
            if (collection === "records") {
                await updatePendingIndexOnSave(kv, id, 'deleted');
            }
            return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
        }

        return new Response("Method not allowed", { status: 405 });
    }

    // Serve static files
    const res = await serveDir(req, {
        fsRoot: ".",
        urlRoot: "",
        showDirListing: false,
        enableCors: true,
    });

    // Static assets (images, icons, audio, fonts, manifest) cache for 1 day
    if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|mp3|wav|ogg|woff|woff2|ttf|eot|webmanifest)$/i)) {
        res.headers.set("Cache-Control", "public, max-age=86400");
    } else {
        // For HTML, JS, CSS: use "no-cache"
        // "no-cache" allows browsers to revalidate using ETags (returning 304 Not Modified with 0 bytes transferred if unchanged)
        // while still ensuring any new code changes are immediately downloaded.
        res.headers.set("Cache-Control", "no-cache");
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


function parseTimeToMinutes(timeStr: string): number {
    if (!timeStr) return 0;
    const str = String(timeStr).trim().toUpperCase();
    let hour = 0;
    let min = 0;
    if (str.includes("AM") || str.includes("PM")) {
        const parts = str.split(" ");
        const hm = (parts[0] || "").split(":");
        hour = parseInt(hm[0] || "0", 10);
        min = parseInt(hm[1] || "0", 10);
        if (parts[1] === "PM" && hour < 12) hour += 12;
        if (parts[1] === "AM" && hour === 12) hour = 0;
    } else {
        const hm = str.split(":");
        hour = parseInt(hm[0] || "0", 10);
        min = parseInt(hm[1] || "0", 10);
    }
    return hour * 60 + min;
}

function getCairoTimeParts() {
    const now = new Date();
    try {
        const dtf = new Intl.DateTimeFormat("en-GB", {
            timeZone: "Africa/Cairo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        });
        const parts = dtf.formatToParts(now);
        const map: any = {};
        parts.forEach(p => map[p.type] = p.value);
        const dateStr = `${map.year}-${map.month}-${map.day}`;
        const hour = parseInt(map.hour, 10);
        const minute = parseInt(map.minute, 10);
        return { dateStr, hour, minute };
    } catch (_e) {
        const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
        const cairoDate = new Date(utcMs + (2 * 60 * 60 * 1000));
        const dateStr = cairoDate.toISOString().split("T")[0];
        return { dateStr, hour: cairoDate.getHours(), minute: cairoDate.getMinutes() };
    }
}

async function runNotificationTasks(forceRun = false) {
    if (!kv) {
        kv = isDeploy ? await Deno.openKv() : await Deno.openKv(Deno.env.get("DENO_REGION") ? undefined : "./database.sqlite");
    }
    const config = await getNotificationsConfig(kv);
    const results: any = { pendingSent: 0, scheduledSent: 0, errors: [] };

    // 1. Check Pending Reminders (Zero KV overhead: uses memoryPendingIndex, only writes if changed)
    try {
        const pendingConfig = config.systemReminders?.pendingReminder || {
            isActive: config.system?.pendingReminderActive ?? true,
            hours: config.system?.pendingReminderHours ?? 3,
            text: config.system?.pendingReminderText || "يوجد سركي معلق بانتظار اعتمادك منذ أكثر من {hours} ساعات، يرجى مراجعته."
        };

        if (pendingConfig.isActive) {
            const cairo = getCairoTimeParts();
            const currentMins = cairo.hour * 60 + cairo.minute;

            // Operational Hours / Time Window check
            let isWithinWindow = true;
            if (pendingConfig.windowActive && !forceRun) {
                const startMins = parseTimeToMinutes(pendingConfig.startTime || "08:00 AM");
                const endMins = parseTimeToMinutes(pendingConfig.endTime || "10:00 PM");
                if (startMins <= endMins) {
                    isWithinWindow = currentMins >= startMins && currentMins <= endMins;
                } else {
                    // overnight window e.g. 10:00 PM to 06:00 AM
                    isWithinWindow = currentMins >= startMins || currentMins <= endMins;
                }
            }

            if (isWithinWindow) {
                const hours = Number(pendingConfig.hours) || 3;
                const reminderIntervalMs = hours * 60 * 60 * 1000;
                const index = await getPendingIndex(kv);
                let indexUpdated = false;
                const nowTime = Date.now();

                for (const recordId in index) {
                    const entry = parsePendingEntry(index[recordId]);
                    if (!entry.engineerId) continue;

                    const createdTime = new Date(entry.createdAt).getTime();
                    if (isNaN(createdTime) || (nowTime - createdTime < reminderIntervalMs)) {
                        continue;
                    }

                    const lastSent = entry.lastReminderSentAt ? new Date(entry.lastReminderSentAt).getTime() : createdTime;
                    if (nowTime - lastSent < reminderIntervalMs) {
                        continue;
                    }

                    // Time to send reminder to engineer
                    entry.lastReminderSentAt = new Date().toISOString();
                    index[recordId] = entry;
                    indexUpdated = true;

                    const targetId = entry.engineerId;
                    const subEntries = kv.list({ prefix: ["push_subscriptions", targetId] });
                    const bodyText = (pendingConfig.text || "يوجد سركي معلق بانتظار اعتمادك منذ أكثر من {hours} ساعات، يرجى مراجعته.")
                        .replace(/\{hours\}/g, String(hours));

                    for await (const subEntry of subEntries) {
                        try {
                            await webPush.sendNotification(
                                subEntry.value,
                                JSON.stringify({
                                    title: "⏰ تذكير: سركي معلق بانتظار الاعتماد",
                                    body: bodyText,
                                    url: "/?view_record=" + recordId
                                })
                            );
                            results.pendingSent++;
                        } catch (err: any) {
                            if (err.statusCode === 410) await kv.delete(subEntry.key);
                            results.errors.push(`WebPush error (${targetId}): ${err.message}`);
                        }
                    }
                }

                if (indexUpdated) {
                    memoryPendingIndex = index;
                    lastPendingIndexFetch = nowTime;
                    await kv.set(["system", "pending_index"], index);
                }
            } else {
                results.pendingSkippedOutsideWindow = true;
            }
        }
    } catch (e: any) {
        console.error("Pending reminders check failed:", e);
        results.errors.push(`Pending check failed: ${e.message}`);
    }

    // 2. Check Cairo Daily Scheduled Notifications
    try {
        const cairo = getCairoTimeParts();
        const currentMins = cairo.hour * 60 + cairo.minute;
        let configUpdated = false;

        const scheduledList = config.scheduled || [];
        for (const item of scheduledList) {
            if (item.isActive === false) continue;
            const timesList: string[] = (Array.isArray(item.times) && item.times.length > 0)
                ? item.times
                : (item.time ? [String(item.time)] : []);
            if (timesList.length === 0) continue;

            if (!Array.isArray(item.sentTimesToday)) {
                item.sentTimesToday = [];
            }
            if (item.lastSentDate !== cairo.dateStr) {
                item.sentTimesToday = [];
                item.lastSentDate = cairo.dateStr;
                configUpdated = true;
            }

            for (const timeStr of timesList) {
                if (!forceRun && item.sentTimesToday.includes(timeStr)) continue;

                const targetMins = parseTimeToMinutes(timeStr);

                // Trigger if current Cairo time has reached the scheduled time
                // (Window: currentMins >= targetMins and within 120 minutes, or forceRun is true)
                if (forceRun || (currentMins >= targetMins && currentMins <= targetMins + 120)) {
                    const targetIds = new Set<string>();

                    const explicitUsers = item.targets?.users || item.targets?.userIds || [];
                    explicitUsers.forEach((uId: any) => targetIds.add(String(uId)));

                    const targetRoles = item.targets?.roles || [];
                    if (targetRoles.length > 0) {
                        const usersIter = kv.list({ prefix: ["users"] });
                        for await (const u of usersIter) {
                            if (u.value && targetRoles.includes(u.value.role)) {
                                targetIds.add(String(u.key[1]));
                            }
                        }
                    }

                    for (const uId of targetIds) {
                        const subEntries = kv.list({ prefix: ["push_subscriptions", uId] });
                        for await (const subEntry of subEntries) {
                            try {
                                await webPush.sendNotification(
                                    subEntry.value,
                                    JSON.stringify({
                                        title: item.title || "تذكير يومي",
                                        body: item.message || "",
                                        url: "/"
                                    })
                                );
                                results.scheduledSent++;
                            } catch (err: any) {
                                if (err.statusCode === 410) await kv.delete(subEntry.key);
                                results.errors.push(`Scheduled WebPush error (${uId}): ${err.message}`);
                            }
                        }
                    }

                    if (!item.sentTimesToday.includes(timeStr)) {
                        item.sentTimesToday.push(timeStr);
                    }
                    configUpdated = true;
                }
            }
        }

        if (configUpdated) {
            memoryNotificationsConfig = config;
            lastNotificationsConfigFetch = Date.now();
            await kv.set(["system", "notificationsConfig"], config);
        }
    } catch (e: any) {
        console.error("Scheduled notifications check failed:", e);
        results.errors.push(`Scheduled check failed: ${e.message}`);
    }

    return results;
}

// Check every 60 seconds
setInterval(() => {
    runNotificationTasks().catch(e => console.error("Periodic notification runner error:", e));
}, 60000);

// Also register Deno.cron if available in Deno Deploy environment
if (typeof (Deno as any).cron === "function") {
    try {
        (Deno as any).cron("Check Notifications", "*/15 * * * *", () => {
            return runNotificationTasks();
        });
    } catch (e) {
        console.log("Deno.cron notice:", e.message);
    }
}

performDailyBackup();
console.log("Server running on http://localhost:8000");
Deno.serve({ port: 8000 }, handler);














