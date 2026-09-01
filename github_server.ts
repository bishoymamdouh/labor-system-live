// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.177.0/http/file_server.ts";

const kv = await Deno.openKv("./database.sqlite");

async function handler(req: Request): Promise<Response> {
    const url = new URL(req.url);

    // API Routes
    if (url.pathname.startsWith("/api/")) {
        const collection = url.pathname.split("/")[2];
        const method = req.method;

        if (url.pathname === "/api/logs" && method === "POST") {
            const body = await req.json();
            console.log("FRONTEND ERROR:", body);
            return new Response("Logged", { status: 200 });
        }

        // Ensure collection exists
        if (!["users", "records", "workers", "worker_directory"].includes(collection) && collection !== "recordDetails" && collection !== "allRecordsDetails") {
            return new Response("Not found", { status: 404 });
        }

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
            // Handle specific ID (like admin)
            const id = body.id || crypto.randomUUID();
            delete body.id;
            
            await kv.set([collection, id], body);
            return new Response(JSON.stringify({ id, ...body }), { status: 201, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
        }

        if (method === "PUT") {
            const body = await req.json();
            const id = url.searchParams.get("id");
            if (!id) return new Response("Missing id", { status: 400 });

            const current = await kv.get([collection, id]);
            if (!current.value) return new Response("Not found", { status: 404 });

            await kv.set([collection, id], { ...current.value, ...body });
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

console.log("Server running on http://localhost:8000");
serve(handler, { port: 8000 });
 
