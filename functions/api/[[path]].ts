// @ts-nocheck
// Cloudflare Pages / Workers API Router: /api/[[path]]
// Real-time synchronization with Cloudflare D1 (Serverless SQLite)

const VAPID_PUBLIC = "BMnqakLZm3Nd93xNUMPOEcOKzmONIusdFaOhuk59jc46aR4b_D2frW_0nryIGSUZbwhMG_2WwLppzRqE0pVDKAc";

const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Bypass-Tunnel-Reminder",
    "Content-Type": "application/json; charset=UTF-8",
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
    "Pragma": "no-cache",
    "Expires": "0"
};

function jsonResponse(data: any, status = 200, extraHeaders: Record<string, string> = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, ...extraHeaders }
    });
}

function errorResponse(message: string, status = 500) {
    return jsonResponse({ error: message }, status);
}

class D1Store {
    constructor(private db: any) {}

    async get(col: string, key: string) {
        try {
            const row = await this.db.prepare("SELECT value FROM kv WHERE collection = ? AND key = ?").bind(col, key).first();
            if (!row || !row.value) return null;
            try { return JSON.parse(row.value); } catch { return row.value; }
        } catch (e: any) {
            console.error("D1Store.get error:", e);
            return null;
        }
    }

    async set(col: string, key: string, val: any) {
        const valStr = typeof val === "string" ? val : JSON.stringify(val);
        await this.db.prepare(
            "INSERT INTO kv (collection, key, value) VALUES (?, ?, ?) ON CONFLICT(collection, key) DO UPDATE SET value = ?"
        ).bind(col, key, valStr, valStr).run();
    }

    async delete(col: string, key: string) {
        await this.db.prepare("DELETE FROM kv WHERE collection = ? AND key = ?").bind(col, key).run();
    }

    async list(col: string) {
        try {
            const { results } = await this.db.prepare("SELECT key, value FROM kv WHERE collection = ?").bind(col).all();
            return (results || []).map((r: any) => {
                let v = r.value;
                try { v = JSON.parse(r.value); } catch {}
                return { key: [col, r.key], value: v, id: r.key };
            });
        } catch (e: any) {
            console.error("D1Store.list error:", e);
            return [];
        }
    }
}

export async function onRequest(context: any): Promise<Response> {
    const { request, env } = context;
    const url = new URL(request.url);
    const method = request.method;

    if (method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (!env || !env.DB) {
        return errorResponse("Cloudflare D1 binding (DB) is missing. Please bind D1 database with variable name 'DB' in Cloudflare settings.", 500);
    }

    const store = new D1Store(env.DB);

    try {
        const pathParts = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
        const resource = pathParts[0];
        const resourceId = pathParts[1] || url.searchParams.get("id");

        // 1. Logs
        if (resource === "logs") {
            if (method === "POST") {
                try {
                    const text = await request.text();
                    const key = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
                    await store.set("client_logs", key, text);
                } catch(e) {}
                return new Response("Logged", { status: 200, headers: corsHeaders });
            }
            if (method === "GET") {
                const items = await store.list("client_logs");
                return jsonResponse(items);
            }
        }

        // 2. Vapid Public Key
        if (resource === "vapidPublicKey" && method === "GET") {
            return new Response(VAPID_PUBLIC, { 
                status: 200, 
                headers: { 
                    ...corsHeaders, 
                    "Content-Type": "text/plain",
                    "Cache-Control": "public, max-age=86400" 
                } 
            });
        }

        // 2.5 Live Server Metrics from Cloudflare GraphQL Analytics & D1
        if (resource === "server-metrics" && method === "GET") {
            try {
                const cfConfig = (await store.get("system", "cf_config")) || {};
                const CF_ACCOUNT_ID = cfConfig.accountId || env.CF_ACCOUNT_ID || "8fcd811bce36d07fe78cfc7a7137f62e";
                const CF_API_TOKEN = cfConfig.apiToken || env.CF_API_TOKEN || atob("Y2Z1dF80YWtVN0l4MmJCQUIwTGtMV05RZHB4YzZpTzB4dWNlaXR3d1FqaEtVZDYxMmU2ZDA=");
                const SCRIPT_NAME = "labor-system-live";

                // Calculate today UTC midnight & next reset
                const now = new Date();
                const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
                const nextResetUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
                const msUntilReset = nextResetUtc.getTime() - now.getTime();
                const hoursUntilReset = Math.floor(msUntilReset / (1000 * 60 * 60));
                const minutesUntilReset = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));

                let requestsToday = 0;
                let errorsToday = 0;
                let subrequestsToday = 0;
                let cpuTimeP50 = 0;
                let cpuTimeP99 = 0;

                try {
                    const graphqlQuery = {
                        query: `query GetWorkerStats($accountTag: String!, $start: String!, $scriptName: String!) {
                            viewer {
                                accounts(filter: { accountTag: $accountTag }) {
                                    workersInvocationsAdaptive(
                                        limit: 1000,
                                        filter: {
                                            scriptName: $scriptName,
                                            datetime_geq: $start
                                        }
                                    ) {
                                        sum {
                                            subrequests
                                            requests
                                            errors
                                        }
                                        quantiles {
                                            cpuTimeP50
                                            cpuTimeP99
                                        }
                                    }
                                }
                            }
                        }`,
                        variables: {
                            accountTag: CF_ACCOUNT_ID,
                            start: todayUtc.toISOString(),
                            scriptName: SCRIPT_NAME
                        }
                    };

                    const cfRes = await fetch("https://api.cloudflare.com/client/v4/graphql", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${CF_API_TOKEN}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(graphqlQuery)
                    });

                    if (cfRes.ok) {
                        const gqlData = await cfRes.json();
                        const invocations = gqlData?.data?.viewer?.accounts?.[0]?.workersInvocationsAdaptive?.[0];
                        if (invocations) {
                            requestsToday = invocations.sum?.requests || 0;
                            errorsToday = invocations.sum?.errors || 0;
                            subrequestsToday = invocations.sum?.subrequests || 0;
                            cpuTimeP50 = invocations.quantiles?.cpuTimeP50 || 0;
                            cpuTimeP99 = invocations.quantiles?.cpuTimeP99 || 0;
                        }
                    }
                } catch (cfErr) {
                    console.error("Cloudflare Analytics fetch error:", cfErr);
                }

                // D1 internal statistics
                let totalRows = 0;
                let recordsCount = 0;
                let workersCount = 0;
                let usersCount = 0;
                let totalDataSizeBytes = 0;

                try {
                    const totalRowRes = await env.DB.prepare("SELECT count(*) as cnt FROM kv").first();
                    totalRows = totalRowRes?.cnt || 0;

                    const recRes = await env.DB.prepare("SELECT count(*) as cnt FROM kv WHERE collection = 'records'").first();
                    recordsCount = recRes?.cnt || 0;

                    const wrkRes = await env.DB.prepare("SELECT count(*) as cnt FROM kv WHERE collection = 'workers'").first();
                    workersCount = wrkRes?.cnt || 0;

                    const usrRes = await env.DB.prepare("SELECT count(*) as cnt FROM kv WHERE collection = 'users'").first();
                    usersCount = usrRes?.cnt || 0;

                    const sizeRes = await env.DB.prepare("SELECT sum(length(value) + length(key) + length(collection)) as total_bytes FROM kv").first();
                    totalDataSizeBytes = sizeRes?.total_bytes || 0;
                } catch (d1Err) {
                    console.error("D1 stats query error:", d1Err);
                }

                const quotaRequests = 100000;
                const requestsRemaining = Math.max(0, quotaRequests - requestsToday);
                const requestsPct = ((requestsToday / quotaRequests) * 100).toFixed(2);
                const storageUsedKB = (totalDataSizeBytes / 1024).toFixed(2);
                const storageUsedMB = (totalDataSizeBytes / (1024 * 1024)).toFixed(3);
                const quotaStorageMB = 5120; // 5 GB
                const storagePct = ((totalDataSizeBytes / (quotaStorageMB * 1024 * 1024)) * 100).toFixed(4);
                const cpuTimeAvgMs = (cpuTimeP50 / 1000).toFixed(2);
                const cpuTimeMaxMs = (cpuTimeP99 / 1000).toFixed(2);

                return jsonResponse({
                    success: true,
                    timestamp: now.toISOString(),
                    server: {
                        status: "online",
                        platform: "Cloudflare Workers & D1",
                        scriptName: SCRIPT_NAME,
                        location: "Global Anycast Edge Network"
                    },
                    requests: {
                        today: requestsToday,
                        quota: quotaRequests,
                        remaining: requestsRemaining,
                        percentage: requestsPct,
                        subrequests: subrequestsToday
                    },
                    performance: {
                        cpuAvgMs: cpuTimeAvgMs,
                        cpuMaxMs: cpuTimeMaxMs,
                        cpuLimitMs: 10.0,
                        errorsToday: errorsToday,
                        errorRate: requestsToday > 0 ? ((errorsToday / requestsToday) * 100).toFixed(2) + "%" : "0%"
                    },
                    database: {
                        engine: "Cloudflare D1 (Serverless Distributed SQLite)",
                        totalRows: totalRows,
                        recordsCount: recordsCount,
                        workersCount: workersCount,
                        usersCount: usersCount,
                        storageUsedKB: storageUsedKB,
                        storageUsedMB: storageUsedMB,
                        storageQuotaMB: quotaStorageMB,
                        storagePercentage: storagePct + "%"
                    },
                    resetSchedule: {
                        nextResetUtc: nextResetUtc.toISOString(),
                        hoursRemaining: hoursUntilReset,
                        minutesRemaining: minutesUntilReset
                    },
                    quotaAlert: {
                        alert70: (requestsToday >= 70000) || (parseFloat(storageUsedMB) >= 3584),
                        isRequestsAlert70: requestsToday >= 70000,
                        isStorageAlert70: parseFloat(storageUsedMB) >= 3584,
                        thresholdPercentage: 70
                    }
                });
            } catch (err: any) {
                return errorResponse("Failed to calculate server metrics: " + err.message, 500);
            }
        }

        // 2.8 Secure Date-Range Records Purge (Admin Only with Password Verification)
        if (resource === "purge-records-range" && method === "POST") {
            try {
                const body = await request.json();
                const { startDate, endDate, password, username, previewOnly } = body || {};

                if (!startDate || !endDate) {
                    return errorResponse("يرجى تحديد تاريخ البداية وتاريخ النهاية", 400);
                }

                // 1. If not preview, verify admin password against D1 users collection
                if (!previewOnly) {
                    if (!password) {
                        return errorResponse("يرجى إدخال كلمة المرور لتأكيد عملية الحذف", 400);
                    }

                    const users = await store.list("users");
                    const adminUser = users.find((u: any) => {
                        const val = u.value;
                        if (!val) return false;
                        return val.role === "admin" || val.username === "Bishoy Mamdouh" || (username && val.username === username);
                    });

                    if (!adminUser || !adminUser.value) {
                        return errorResponse("لم يتم العثور على حساب المسؤول للتحقق من الصلاحيات", 403);
                    }

                    if (String(adminUser.value.password).trim() !== String(password).trim()) {
                        return errorResponse("كلمة المرور غير صحيحة! عملية مسح البيانات تتطلب كلمة المرور الحالية لحسابك الشخصي.", 403);
                    }
                }

                // 2. Find matching records in range [startDate, endDate]
                const records = await store.list("records");
                const matchedRecords = records.filter((r: any) => {
                    const rDate = r.value?.date;
                    if (!rDate) return false;
                    return rDate >= startDate && rDate <= endDate;
                });

                const recordIds = new Set(matchedRecords.map((r: any) => r.id));

                // 3. Find associated workers
                const workers = await store.list("workers");
                const matchedWorkers = workers.filter((w: any) => {
                    return w.value && recordIds.has(w.value.recordId);
                });

                if (previewOnly) {
                    return jsonResponse({
                        success: true,
                        preview: true,
                        recordsCount: matchedRecords.length,
                        workersCount: matchedWorkers.length,
                        startDate,
                        endDate
                    });
                }

                if (matchedRecords.length === 0) {
                    return jsonResponse({
                        success: true,
                        deletedRecords: 0,
                        deletedWorkers: 0,
                        message: "لا توجد أي سراكي مسجلة في هذه الفترة المحددة."
                    });
                }

                // 4. Batch delete matched records and workers from D1
                const deleteStmts: any[] = [];
                for (const recId of recordIds) {
                    deleteStmts.push(env.DB.prepare("DELETE FROM kv WHERE collection = 'records' AND key = ?").bind(recId));
                }
                for (const wrk of matchedWorkers) {
                    deleteStmts.push(env.DB.prepare("DELETE FROM kv WHERE collection = 'workers' AND key = ?").bind(wrk.id));
                }

                const batchSize = 50;
                for (let i = 0; i < deleteStmts.length; i += batchSize) {
                    await env.DB.batch(deleteStmts.slice(i, i + batchSize));
                }

                return jsonResponse({
                    success: true,
                    deletedRecords: matchedRecords.length,
                    deletedWorkers: matchedWorkers.length,
                    message: `تم بنجاح حذف ${matchedRecords.length} سركية و ${matchedWorkers.length} يومية عامل في الفترة من ${startDate} إلى ${endDate}`
                });
            } catch (err: any) {
                return errorResponse("فشل تنفيذ عملية الحذف: " + err.message, 500);
            }
        }

        // 3. Notifications Config
        if (resource === "notificationsConfig") {
            if (method === "GET") {
                const conf = await store.get("system", "notificationsConfig") || {
                    systemReminders: {
                        pendingReminder: {
                            isActive: true,
                            hours: 3,
                            text: "يوجد سركي معلق بانتظار اعتمادك منذ أكثر من {hours} ساعات، يرجى مراجعته."
                        }
                    },
                    scheduled: []
                };
                return jsonResponse(conf);
            }
            if (method === "POST") {
                const body = await request.json();
                await store.set("system", "notificationsConfig", body);
                return jsonResponse({ success: true });
            }
        }

        // 4. Pending Count & Status (Instant Real-time from D1)
        if (resource === "pendingCount" && method === "GET") {
            const engineerId = url.searchParams.get("engineerId");
            const records = await store.list("records");
            let count = 0;
            for (const r of records) {
                if (r.value && r.value.status === "pending") {
                    if (!engineerId || engineerId === "all" || String(r.value.engineerId) === String(engineerId)) {
                        count++;
                    }
                }
            }
            return jsonResponse({ count });
        }

        if (resource === "pendingStatus" && method === "GET") {
            const engineerId = url.searchParams.get("engineerId");
            const records = await store.list("records");
            const pendingList: any[] = [];
            for (const r of records) {
                if (r.value && r.value.status === "pending") {
                    if (!engineerId || String(r.value.engineerId) === String(engineerId)) {
                        pendingList.push({
                            id: r.id,
                            engineerId: r.value.engineerId,
                            date: r.value.date,
                            createdAt: r.value.createdAt
                        });
                    }
                }
            }
            return jsonResponse({ pendingRecords: pendingList });
        }

        // 5. Update Worker Name across workers
        if (resource === "updateWorkerName" && method === "POST") {
            const body = await request.json();
            const { oldName, newName } = body;
            if (!oldName || !newName) return errorResponse("Missing oldName or newName", 400);

            const workers = await store.list("workers");
            let updatedCount = 0;
            const statements: any[] = [];
            for (const w of workers) {
                if (w.value && w.value.name === oldName) {
                    const updated = { ...w.value, name: newName };
                    statements.push(
                        env.DB.prepare(
                            "INSERT INTO kv (collection, key, value) VALUES (?, ?, ?) ON CONFLICT(collection, key) DO UPDATE SET value = ?"
                        ).bind("workers", w.id, JSON.stringify(updated), JSON.stringify(updated))
                    );
                    updatedCount++;
                }
            }
            if (statements.length > 0) {
                await env.DB.batch(statements);
            }
            return jsonResponse({ success: true, count: updatedCount });
        }

        // 6. Record Details (single record with exact contract: { record, users, workers })
        if (resource === "recordDetails" && method === "GET") {
            const recId = url.searchParams.get("id") || pathParts[1];
            if (!recId) return errorResponse("Missing record ID", 400);

            const record = await store.get("records", recId);
            if (!record) return errorResponse("Record not found", 404);

            const [allWorkers, allUsers] = await Promise.all([
                store.list("workers"),
                store.list("users")
            ]);

            const users = allUsers.map((u: any) => ({ ...u.value, id: u.id }));
            const workers = allWorkers
                .filter((w: any) => w.value && w.value.recordId === recId && !w.value.isDeleted)
                .map((w: any) => ({ ...w.value, id: w.id }));

            return jsonResponse({ record: { ...record, id: recId }, users, workers });
        }

        // 7. All Records Details (Instant Real-time direct query from D1)
        if (resource === "allRecordsDetails" && method === "GET") {
            const [recordsList, workersList, usersList] = await Promise.all([
                store.list("records"),
                store.list("workers"),
                store.list("users")
            ]);

            const usersMap: Record<string, string> = {};
            for (const u of usersList) {
                if (u.value) usersMap[u.id] = u.value.username || "";
            }

            const workersByRecord: Record<string, any[]> = {};
            for (const w of workersList) {
                if (w.value && !w.value.isDeleted && w.value.recordId) {
                    if (!workersByRecord[w.value.recordId]) workersByRecord[w.value.recordId] = [];
                    workersByRecord[w.value.recordId].push({ ...w.value, id: w.id });
                }
            }

            const details = recordsList.map((r: any) => {
                const rec = r.value || {};
                const recWorkers = workersByRecord[r.id] || [];
                return {
                    ...rec,
                    id: r.id,
                    supervisorName: usersMap[rec.supervisorId] || rec.supervisorName || "غير معروف",
                    engineerName: usersMap[rec.engineerId] || rec.engineerName || "غير معروف",
                    workers: recWorkers
                };
            });

            return jsonResponse(details);
        }

        // 8. Backup & Restore Endpoints
        if (resource === "backup") {
            const nowIso = new Date().toISOString();
            await store.set("system", "lastBackup", nowIso);

            if (method === "GET" || url.searchParams.get("download") === "true") {
                const data: Record<string, any[]> = {};
                for (const col of ["users", "records", "workers", "worker_directory", "push_subscriptions", "system"]) {
                    data[col] = await store.list(col);
                }
                const dateStr = nowIso.split("T")[0];
                return new Response(JSON.stringify(data, null, 2), {
                    status: 200,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json; charset=UTF-8",
                        "Content-Disposition": `attachment; filename="labor_backup_${dateStr}.json"`,
                        "Cache-Control": "no-store"
                    }
                });
            }

            return jsonResponse({ success: true, lastBackup: nowIso });
        }

        if (resource === "backupStats" && method === "GET") {
            const [records, workers, users, lastBackupEntry, configEntry] = await Promise.all([
                store.list("records"),
                store.list("workers"),
                store.list("users"),
                store.get("system", "lastBackup"),
                store.get("system", "backupConfig")
            ]);

            return jsonResponse({
                totalRecords: records.length,
                totalWorkers: workers.length,
                totalUsers: users.length,
                lastBackup: lastBackupEntry || null,
                autoBackupActive: !!configEntry?.autoBackup?.isActive,
                databasePlatform: "Cloudflare D1 (Serverless SQLite)",
                freeTierStatus: "Active (100,000 req/day - 3,000,000 req/month)"
            });
        }

        if (resource === "backupConfig") {
            if (method === "GET") {
                const conf = await store.get("system", "backupConfig") || {
                    autoBackup: { isActive: true, time: "01:00 PM" },
                    destinations: { localDownload: true, excelExport: true }
                };
                return jsonResponse(conf);
            }
            if (method === "POST") {
                const body = await request.json();
                await store.set("system", "backupConfig", body);
                return jsonResponse({ success: true });
            }
        }

        if (resource === "export" && method === "GET") {
            const data: Record<string, any[]> = {};
            for (const col of ["users", "records", "workers", "worker_directory", "push_subscriptions", "system"]) {
                data[col] = await store.list(col);
            }
            return jsonResponse(data);
        }

        // Batched Import
        if (resource === "import" && method === "POST") {
            const data = await request.json();
            const statements: any[] = [];
            for (const col of ["users", "records", "workers", "worker_directory", "push_subscriptions", "system"]) {
                if (Array.isArray(data[col])) {
                    for (const item of data[col]) {
                        const keyStr = Array.isArray(item.key) ? (item.key[1] || item.key[0]) : (item.id || item.key);
                        if (keyStr) {
                            const val = item.value !== undefined ? item.value : item;
                            const valStr = typeof val === "string" ? val : JSON.stringify(val);
                            statements.push(
                                env.DB.prepare(
                                    "INSERT INTO kv (collection, key, value) VALUES (?, ?, ?) ON CONFLICT(collection, key) DO UPDATE SET value = ?"
                                ).bind(col, String(keyStr), valStr, valStr)
                            );
                        }
                    }
                }
            }
            const batchSize = 50;
            for (let i = 0; i < statements.length; i += batchSize) {
                const chunk = statements.slice(i, i + batchSize);
                await env.DB.batch(chunk);
            }
            return jsonResponse({ success: true, count: statements.length, message: "Imported successfully into Cloudflare D1" });
        }

        // 9. Broadcast & Push Stubs
        if (resource === "broadcast" && method === "POST") {
            return jsonResponse({ success: true, sent: 0, message: "Broadcast handled" });
        }
        if ((resource === "subscribe" || resource === "unsubscribe" || resource === "triggerNotificationTasks") && method === "POST") {
            return jsonResponse({ success: true });
        }

        // 10. CRUD Collections: users, records, workers, worker_directory, push_subscriptions
        const validCollections = ["users", "records", "workers", "worker_directory", "push_subscriptions"];
        if (validCollections.includes(resource)) {
            // GET single item (by /api/:col/:id OR /api/:col?id=...)
            if (method === "GET" && resourceId) {
                const item = await store.get(resource, resourceId);
                return jsonResponse(item ? { ...item, id: resourceId } : null);
            }

            // GET list (with generic searchParams filtering matching server.ts)
            if (method === "GET" && !resourceId) {
                const items = await store.list(resource);
                let list = items.map((item: any) => ({ ...item.value, id: item.id }));

                const filters: Record<string, string> = {};
                for (const [key, value] of url.searchParams.entries()) {
                    if (key !== "id") filters[key] = value;
                }

                if (Object.keys(filters).length > 0) {
                    list = list.filter((item: any) => {
                        for (const key in filters) {
                            if (String(item[key]) !== String(filters[key])) return false;
                        }
                        return true;
                    });
                }

                return jsonResponse(list);
            }

            // POST create item
            if (method === "POST") {
                const body = await request.json();
                const id = body.id || crypto.randomUUID();
                const recordData = { ...body, id };
                await store.set(resource, id, recordData);
                return jsonResponse(recordData, 201);
            }

            // PUT update item (by /api/:col/:id OR /api/:col?id=...)
            if (method === "PUT" && resourceId) {
                const body = await request.json();
                const current = await store.get(resource, resourceId) || {};
                const updated = { ...current, ...body, id: resourceId };
                await store.set(resource, resourceId, updated);
                return jsonResponse({ success: true, ...updated });
            }

            // DELETE item (by /api/:col/:id OR /api/:col?id=...)
            if (method === "DELETE" && resourceId) {
                await store.delete(resource, resourceId);
                if (resource === "records") {
                    const workers = await store.list("workers");
                    const toDelete = workers.filter((w: any) => w.value && w.value.recordId === resourceId);
                    if (toDelete.length > 0) {
                        const delStmts = toDelete.map((w: any) =>
                            env.DB.prepare("DELETE FROM kv WHERE collection = 'workers' AND key = ?").bind(w.id)
                        );
                        await env.DB.batch(delStmts);
                    }
                }
                return jsonResponse({ success: true, id: resourceId });
            }
        }

        return errorResponse("API route not found", 404);
    } catch (err: any) {
        console.error("Cloudflare Worker unhandled error:", err);
        return errorResponse(err.message || "Internal Server Error", 500);
    }
}
