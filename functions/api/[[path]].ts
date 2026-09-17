// @ts-nocheck
// Cloudflare Pages Function: /api/[[path]]
// Direct integration with Cloudflare D1 (Serverless SQLite)

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
        return errorResponse("Cloudflare D1 binding (DB) is missing. Please bind D1 database with variable name 'DB' in Cloudflare Pages settings.", 500);
    }

    const store = new D1Store(env.DB);

    try {
        // Ensure table exists on first run
        await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS kv (
                collection TEXT NOT NULL,
                key TEXT NOT NULL,
                value TEXT NOT NULL,
                PRIMARY KEY (collection, key)
            )
        `).run();

        const pathParts = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
        const resource = pathParts[0];
        const resourceId = pathParts[1];

        // 1. Logs
        if (resource === "logs" && method === "POST") {
            return new Response("Logged", { status: 200, headers: corsHeaders });
        }

        // 2. Vapid Public Key
        if (resource === "vapidPublicKey" && method === "GET") {
            return new Response(VAPID_PUBLIC, { status: 200, headers: { ...corsHeaders, "Content-Type": "text/plain" } });
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

        // 4. Pending Count & Status
        if (resource === "pendingCount" && method === "GET") {
            const engineerId = url.searchParams.get("engineerId");
            const records = await store.list("records");
            let count = 0;
            for (const r of records) {
                if (r.value && r.value.status === "pending") {
                    if (!engineerId || String(r.value.engineerId) === String(engineerId)) {
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
            for (const w of workers) {
                if (w.value && w.value.name === oldName) {
                    const updated = { ...w.value, name: newName };
                    await store.set("workers", w.id, updated);
                    updatedCount++;
                }
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

        // 7. All Records Details (records + workers + user mapping)
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
                    supervisorName: usersMap[rec.supervisorId] || rec.supervisorName || "",
                    engineerName: usersMap[rec.engineerId] || rec.engineerName || "",
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

        if (resource === "import" && method === "POST") {
            const data = await request.json();
            let count = 0;
            for (const col of ["users", "records", "workers", "worker_directory", "push_subscriptions", "system"]) {
                if (Array.isArray(data[col])) {
                    for (const item of data[col]) {
                        const keyStr = Array.isArray(item.key) ? (item.key[1] || item.key[0]) : (item.id || item.key);
                        if (keyStr) {
                            await store.set(col, String(keyStr), item.value !== undefined ? item.value : item);
                            count++;
                        }
                    }
                }
            }
            return jsonResponse({ success: true, count, message: "Imported successfully into Cloudflare D1" });
        }

        // 9. CRUD Collections: users, records, workers, worker_directory, push_subscriptions
        const validCollections = ["users", "records", "workers", "worker_directory", "push_subscriptions"];
        if (validCollections.includes(resource)) {
            // GET /api/:col
            if (method === "GET" && !resourceId) {
                const items = await store.list(resource);
                let list = items.map((item: any) => ({ ...item.value, id: item.id }));

                // Handle worker filter by recordId
                if (resource === "workers") {
                    const recId = url.searchParams.get("recordId");
                    if (recId) list = list.filter((w: any) => w.recordId === recId);
                }
                return jsonResponse(list);
            }

            // GET /api/:col/:id
            if (method === "GET" && resourceId) {
                const item = await store.get(resource, resourceId);
                if (!item) return errorResponse("Item not found", 404);
                return jsonResponse({ ...item, id: resourceId });
            }

            // POST /api/:col
            if (method === "POST") {
                const body = await request.json();
                const id = body.id || crypto.randomUUID();
                const recordData = { ...body, id };
                await store.set(resource, id, recordData);
                return jsonResponse(recordData, 201);
            }

            // PUT /api/:col/:id
            if (method === "PUT" && resourceId) {
                const body = await request.json();
                const updated = { ...body, id: resourceId };
                await store.set(resource, resourceId, updated);
                return jsonResponse(updated);
            }

            // DELETE /api/:col/:id
            if (method === "DELETE" && resourceId) {
                await store.delete(resource, resourceId);
                // If deleting a record, cascade delete workers of that record
                if (resource === "records") {
                    const workers = await store.list("workers");
                    for (const w of workers) {
                        if (w.value && w.value.recordId === resourceId) {
                            await store.delete("workers", w.id);
                        }
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
