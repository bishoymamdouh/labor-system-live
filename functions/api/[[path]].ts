// @ts-nocheck
// Cloudflare Pages Function: /api/[[path]]
// Optimized Cloudflare D1 integration with in-memory caching and battery/energy efficiency

const VAPID_PUBLIC = "BMnqakLZm3Nd93xNUMPOEcOKzmONIusdFaOhuk59jc46aR4b_D2frW_0nryIGSUZbwhMG_2WwLppzRqE0pVDKAc";

const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Content-Type": "application/json; charset=UTF-8"
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

// In-Memory Edge Cache for ultra-fast reads and minimal D1 query consumption
let cacheAllRecordsDetails: any = null;
let cacheAllRecordsDetailsTime = 0;

let cacheUsers: any = null;
let cacheUsersTime = 0;

let cacheWorkerDirectory: any = null;
let cacheWorkerDirectoryTime = 0;

let cachePendingCount: Record<string, { count: number; time: number }> = {};

function invalidateMemoryCache(col?: string) {
    if (!col || col === "records" || col === "workers") {
        cacheAllRecordsDetails = null;
        cacheAllRecordsDetailsTime = 0;
        cachePendingCount = {};
    }
    if (!col || col === "users") {
        cacheUsers = null;
        cacheUsersTime = 0;
        cacheAllRecordsDetails = null;
        cacheAllRecordsDetailsTime = 0;
    }
    if (!col || col === "worker_directory") {
        cacheWorkerDirectory = null;
        cacheWorkerDirectoryTime = 0;
    }
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
        invalidateMemoryCache(col);
    }

    async delete(col: string, key: string) {
        await this.db.prepare("DELETE FROM kv WHERE collection = ? AND key = ?").bind(col, key).run();
        invalidateMemoryCache(col);
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
        const resourceId = pathParts[1];

        // 1. Logs
        if (resource === "logs" && method === "POST") {
            return new Response("Logged", { status: 200, headers: corsHeaders });
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

        // 4. Pending Count & Status (Cached for 15s per engineer)
        if (resource === "pendingCount" && method === "GET") {
            const engineerId = url.searchParams.get("engineerId") || "all";
            const now = Date.now();
            if (cachePendingCount[engineerId] && (now - cachePendingCount[engineerId].time < 15000)) {
                return jsonResponse({ count: cachePendingCount[engineerId].count });
            }

            const records = await store.list("records");
            let count = 0;
            for (const r of records) {
                if (r.value && r.value.status === "pending") {
                    if (engineerId === "all" || String(r.value.engineerId) === String(engineerId)) {
                        count++;
                    }
                }
            }
            cachePendingCount[engineerId] = { count, time: now };
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
                invalidateMemoryCache("workers");
            }
            return jsonResponse({ success: true, count: updatedCount });
        }

        // 6. Record Details (single record with its workers)
        if (resource === "recordDetails" && method === "GET") {
            const recId = url.searchParams.get("id") || resourceId;
            if (!recId) return errorResponse("Missing record ID", 400);

            const record = await store.get("records", recId);
            if (!record) return errorResponse("Record not found", 404);

            const allWorkers = await store.list("workers");
            const recWorkers = allWorkers
                .map((w: any) => ({ ...w.value, id: w.id }))
                .filter((w: any) => w.recordId === recId && !w.isDeleted);

            return jsonResponse({ ...record, id: recId, workers: recWorkers });
        }

        // 7. All Records Details (Edge In-Memory Cached for 30s)
        if (resource === "allRecordsDetails" && method === "GET") {
            const now = Date.now();
            if (cacheAllRecordsDetails && (now - cacheAllRecordsDetailsTime < 30000)) {
                return jsonResponse(cacheAllRecordsDetails, 200, { "X-Cache": "HIT" });
            }

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
                    supervisorName: usersMap[rec.supervisorId] || rec.supervisorName || "",
                    engineerName: usersMap[rec.engineerId] || rec.engineerName || "",
                    workers: recWorkers
                };
            });

            cacheAllRecordsDetails = details;
            cacheAllRecordsDetailsTime = now;
            return jsonResponse(details, 200, { "X-Cache": "MISS" });
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

        // Fast Batched Import
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
            // Execute in batches of 50
            const batchSize = 50;
            for (let i = 0; i < statements.length; i += batchSize) {
                const chunk = statements.slice(i, i + batchSize);
                await env.DB.batch(chunk);
            }
            invalidateMemoryCache();
            return jsonResponse({ success: true, count: statements.length, message: "Imported successfully into Cloudflare D1" });
        }

        // 9. Users Cached Read
        if (resource === "users" && method === "GET" && !resourceId) {
            const now = Date.now();
            if (cacheUsers && (now - cacheUsersTime < 60000)) {
                return jsonResponse(cacheUsers);
            }
            const items = await store.list("users");
            const list = items.map((item: any) => ({ ...item.value, id: item.id }));
            cacheUsers = list;
            cacheUsersTime = now;
            return jsonResponse(list);
        }

        // 10. Worker Directory Cached Read
        if (resource === "worker_directory" && method === "GET" && !resourceId) {
            const now = Date.now();
            if (cacheWorkerDirectory && (now - cacheWorkerDirectoryTime < 60000)) {
                return jsonResponse(cacheWorkerDirectory);
            }
            const items = await store.list("worker_directory");
            const list = items.map((item: any) => ({ ...item.value, id: item.id }));
            cacheWorkerDirectory = list;
            cacheWorkerDirectoryTime = now;
            return jsonResponse(list);
        }

        // 11. CRUD Collections: users, records, workers, worker_directory, push_subscriptions
        const validCollections = ["users", "records", "workers", "worker_directory", "push_subscriptions"];
        if (validCollections.includes(resource)) {
            if (method === "GET" && !resourceId) {
                const items = await store.list(resource);
                let list = items.map((item: any) => ({ ...item.value, id: item.id }));
                if (resource === "workers") {
                    const recId = url.searchParams.get("recordId");
                    if (recId) list = list.filter((w: any) => w.recordId === recId);
                }
                return jsonResponse(list);
            }

            if (method === "GET" && resourceId) {
                const item = await store.get(resource, resourceId);
                if (!item) return errorResponse("Item not found", 404);
                return jsonResponse({ ...item, id: resourceId });
            }

            if (method === "POST") {
                const body = await request.json();
                const id = body.id || crypto.randomUUID();
                const recordData = { ...body, id };
                await store.set(resource, id, recordData);
                return jsonResponse(recordData, 201);
            }

            if (method === "PUT" && resourceId) {
                const body = await request.json();
                const updated = { ...body, id: resourceId };
                await store.set(resource, resourceId, updated);
                return jsonResponse(updated);
            }

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
                invalidateMemoryCache(resource);
                return jsonResponse({ success: true, id: resourceId });
            }
        }

        return errorResponse("API route not found", 404);
    } catch (err: any) {
        console.error("Cloudflare Worker unhandled error:", err);
        return errorResponse(err.message || "Internal Server Error", 500);
    }
}
