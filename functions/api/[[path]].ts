// @ts-nocheck
// Cloudflare Pages / Workers API Router: /api/[[path]]
// Real-time synchronization with Cloudflare D1 (Serverless SQLite)

const VAPID_PUBLIC = "BMnqakLZm3Nd93xNUMPOEcOKzmONIusdFaOhuk59jc46aR4b_D2frW_0nryIGSUZbwhMG_2WwLppzRqE0pVDKAc";
const VAPID_PRIVATE = "4vLaY01kxCnkgqgsvRkBKarGcH1yyU5o47ezN5kPYDE";
const VAPID_SUBJECT = "mailto:admin@example.com";

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

export class D1Store {
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

    async getSubscriptionsForUser(userId: string) {
        try {
            const { results } = await this.db.prepare(
                "SELECT key, value FROM kv WHERE collection = 'push_subscriptions' AND (key = ? OR key LIKE ?)"
            ).bind(userId, `${userId}:::%`).all();
            return (results || []).map((r: any) => {
                let v = r.value;
                try { v = JSON.parse(r.value); } catch {}
                return { key: r.key, value: v };
            });
        } catch (e: any) {
            console.error("getSubscriptionsForUser error:", e);
            return [];
        }
    }

    async deleteSubscription(key: any) {
        try {
            const keyStr = Array.isArray(key) ? (key[1] || key[0]) : (key?.id || key);
            await this.db.prepare("DELETE FROM kv WHERE collection = 'push_subscriptions' AND key = ?").bind(String(keyStr)).run();
        } catch (e: any) {
            console.error("deleteSubscription error:", e);
        }
    }
}

// ========================================================
// --- Pure WebCrypto WebPush Engine (RFC 8291 / 8292) ---
// ========================================================
function b64ToUrlB64(str: string): string {
    return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function urlB64ToB64(str: string): string {
    return str.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (str.length % 4)) % 4);
}

function uint8ToUrlB64(bytes: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return b64ToUrlB64(btoa(binary));
}

function urlB64ToUint8(str: string): Uint8Array {
    const b64 = urlB64ToB64(str);
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
        arr[i] = bin.charCodeAt(i);
    }
    return arr;
}

function concatUint8(...arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((acc, a) => acc + a.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const a of arrays) {
        result.set(a, offset);
        offset += a.length;
    }
    return result;
}

async function createVapidJwt(audience: string): Promise<string> {
    const pubBytes = urlB64ToUint8(VAPID_PUBLIC);
    const x = uint8ToUrlB64(pubBytes.slice(1, 33));
    const y = uint8ToUrlB64(pubBytes.slice(33, 65));

    const jwk = {
        kty: "EC",
        crv: "P-256",
        x,
        y,
        d: VAPID_PRIVATE,
        ext: true
    };

    const key = await crypto.subtle.importKey(
        "jwk",
        jwk,
        { name: "ECDSA", namedCurve: "P-256" },
        false,
        ["sign"]
    );

    const header = { alg: "ES256", typ: "JWT" };
    const exp = Math.floor(Date.now() / 1000) + 12 * 3600;
    const payload = {
        aud: audience,
        exp,
        sub: VAPID_SUBJECT
    };

    const enc = new TextEncoder();
    const tokenPart = `${uint8ToUrlB64(enc.encode(JSON.stringify(header)))}.${uint8ToUrlB64(enc.encode(JSON.stringify(payload)))}`;
    const sig = await crypto.subtle.sign(
        { name: "ECDSA", hash: "SHA-256" },
        key,
        enc.encode(tokenPart)
    );

    const sigBytes = new Uint8Array(sig);
    return `${tokenPart}.${uint8ToUrlB64(sigBytes)}`;
}

function createHMAC(data: Uint8Array) {
    const keyPromise = crypto.subtle.importKey(
        "raw",
        data,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    return {
        hash: async (input: Uint8Array) => {
            const k = await keyPromise;
            return new Uint8Array(await crypto.subtle.sign("HMAC", k, input));
        }
    };
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array) {
    const prkh = await createHMAC(salt).hash(ikm).then(prk => createHMAC(prk));
    return {
        extract: async (info: Uint8Array, len: number) => {
            const blocks: Uint8Array[] = [];
            let prev: Uint8Array = new Uint8Array(0);
            const numBlocks = Math.ceil(len / 32);
            for (let i = 0; i < numBlocks; i++) {
                const stepInput = new Uint8Array(prev.length + info.length + 1);
                stepInput.set(prev, 0);
                stepInput.set(info, prev.length);
                stepInput[stepInput.length - 1] = i + 1;
                prev = await prkh.hash(stepInput);
                blocks.push(prev);
            }
            return concatUint8(...blocks).slice(0, len);
        }
    };
}

async function encryptPayload(subscriberPublicKeyB64: string, subscriberAuthB64: string, payloadText: string): Promise<Uint8Array> {
    const clientPublicKeyBytes = urlB64ToUint8(subscriberPublicKeyB64);
    const authSecretBytes = urlB64ToUint8(subscriberAuthB64);

    const clientPublicKey = await crypto.subtle.importKey(
        "raw",
        clientPublicKeyBytes,
        { name: "ECDH", namedCurve: "P-256" },
        false,
        []
    );

    const salt = crypto.getRandomValues(new Uint8Array(16));

    const localKeyPair = await crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveBits"]
    );
    const localPublicKeyBytes = new Uint8Array(await crypto.subtle.exportKey("raw", localKeyPair.publicKey));

    const sharedSecret = new Uint8Array(
        await crypto.subtle.deriveBits(
            { name: "ECDH", public: clientPublicKey },
            localKeyPair.privateKey,
            256
        )
    );

    const enc = new TextEncoder();
    const keyInfo = concatUint8(
        enc.encode("WebPush: info\0"),
        clientPublicKeyBytes,
        localPublicKeyBytes
    );
    const cekInfo = enc.encode("Content-Encoding: aes128gcm\0");
    const nonceInfo = enc.encode("Content-Encoding: nonce\0");

    // RFC 8291 §3.2 Key Agreement & Derivation
    const ikmHkdf = await hkdf(authSecretBytes, sharedSecret);
    const ikm = await ikmHkdf.extract(keyInfo, 32);

    const messageHkdf = await hkdf(salt, ikm);
    const cekBytes = await messageHkdf.extract(cekInfo, 16);
    const nonceBytes = await messageHkdf.extract(nonceInfo, 12);

    const cekCryptoKey = await crypto.subtle.importKey(
        "raw",
        cekBytes,
        { name: "AES-GCM", length: 128 },
        false,
        ["encrypt"]
    );

    const plaintext = enc.encode(payloadText);
    const padded = new Uint8Array(plaintext.byteLength + 1);
    padded.set(plaintext, 0);
    padded[plaintext.byteLength] = 0x02;

    const encrypted = new Uint8Array(
        await crypto.subtle.encrypt(
            { name: "AES-GCM", iv: nonceBytes },
            cekCryptoKey,
            padded
        )
    );

    const rsBytes = new Uint8Array(4);
    new DataView(rsBytes.buffer).setUint32(0, 4096, false);

    return concatUint8(
        salt,
        rsBytes,
        new Uint8Array([localPublicKeyBytes.byteLength]),
        localPublicKeyBytes,
        encrypted
    );
}

async function sendWebPush(subscription: any, payload: string) {
    if (!subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
        throw new Error("Invalid push subscription structure");
    }
    const endpointUrl = new URL(subscription.endpoint);
    const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;
    const jwt = await createVapidJwt(audience);

    const bodyBytes = await encryptPayload(
        subscription.keys.p256dh,
        subscription.keys.auth,
        payload
    );

    const headers: Record<string, string> = {
        "TTL": "86400",
        "Urgency": "high",
        "Content-Encoding": "aes128gcm",
        "Content-Type": "application/octet-stream",
        "Authorization": `vapid t=${jwt}, k=${VAPID_PUBLIC}`
    };

    const res = await fetch(subscription.endpoint, {
        method: "POST",
        headers,
        body: bodyBytes
    });

    const bodyText = await res.text();
    return {
        status: res.status,
        statusText: res.statusText,
        body: bodyText,
        ok: res.ok
    };
}

async function dispatchInstantAlerts(store: D1Store, triggerEvent: string, context: {
    recordId?: string;
    supervisorId?: string;
    engineerId?: string;
    supervisorName?: string;
    date?: string;
    status?: string;
    workerName?: string;
}) {
    try {
        const notifCfg = (await store.get("system", "notificationsConfig")) || {};
        let alerts: any[] = [];
        if (Array.isArray(notifCfg.instantAlerts) && notifCfg.instantAlerts.length > 0) {
            alerts = notifCfg.instantAlerts;
        } else {
            const b = notifCfg.builtInAlerts || {};
            alerts = [
                { id: "newRecord", name: "طلب اعتماد سركي جديد", trigger: "new_record", targetRole: "record_engineer", isActive: b.newRecord?.isActive !== false, title: b.newRecord?.title || "طلب اعتماد سركي جديد", text: b.newRecord?.text || "قام المشرف {supervisor} بتقديم سركي جديد بانتظار اعتمادك (إجمالي المعلق: {count})" },
                { id: "recordApproved", name: "اعتماد السركي", trigger: "record_approved", targetRole: "record_supervisor", isActive: b.recordReview?.isActive !== false, title: "تم اعتماد طلبك ✅", text: "تم اعتماد السركي الخاص بيوم {date}" },
                { id: "recordRejected", name: "رفض السركي", trigger: "record_rejected", targetRole: "record_supervisor", isActive: b.recordReview?.isActive !== false, title: "تم رفض السركي ⚠️", text: "تم رفض السركي الخاص بيوم {date}، يرجى مراجعته وتعديله." },
                { id: "recordResubmit", name: "إعادة إرسال أو تعديل", trigger: "record_resubmit", targetRole: "record_engineer", isActive: b.recordResubmit?.isActive !== false, title: "إعادة تقديم سركي", text: "قام المشرف {supervisor} بتعديل وإعادة تقديم السركي الخاص بيوم {date}" }
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

        const usersList = await store.list("users");
        const users = usersList.map(u => ({ id: u.id, ...u.value }));

        let supervisorName = context.supervisorName;
        if (!supervisorName && context.supervisorId) {
            const found = users.find(u => u.id === String(context.supervisorId));
            supervisorName = found?.name || found?.username || "مشرف";
        }

        const statusLabel = context.status === "approved" ? "اعتماد" : (context.status === "rejected" ? "رفض" : (context.status || ""));

        const recordsList = await store.list("records");

        for (const alert of matching) {
            const targetIds = new Set<string>();
            const role = alert.targetRole || (alert.trigger === "new_record" || alert.trigger === "record_resubmit" ? "record_engineer" : "record_supervisor");

            if (role === "record_engineer") {
                // Strictly target ONLY the responsible engineer assigned to this record.
                // Do NOT include admin unless admin was specifically chosen as the responsible engineer!
                if (context.engineerId) {
                    targetIds.add(String(context.engineerId));
                } else {
                    users.filter(u => u.role === "engineer").forEach(u => targetIds.add(u.id));
                }
            } else if (role === "record_supervisor") {
                if (context.supervisorId) targetIds.add(String(context.supervisorId));
            } else if (role === "engineer") {
                if (context.engineerId) {
                    targetIds.add(String(context.engineerId));
                } else {
                    users.filter(u => u.role === "engineer").forEach(u => targetIds.add(u.id));
                }
            } else if (role === "supervisor") {
                if (context.supervisorId) targetIds.add(String(context.supervisorId));
                users.filter(u => u.role === "supervisor").forEach(u => targetIds.add(u.id));
            } else {
                users.forEach(u => {
                    if (role === "all" || u.role === role) targetIds.add(u.id);
                });
            }

            const titleText = (alert.title || alert.name || "تنبيه نظام السراكي")
                .replace(/\{status\}/g, statusLabel)
                .replace(/\{supervisor\}/g, supervisorName || "")
                .replace(/\{date\}/g, context.date || "");

            for (const targetId of targetIds) {
                // Count pending records specifically assigned to this target engineer
                let userPendingCount = 0;
                for (const r of recordsList) {
                    const isPending = r.value?.status === "pending" || !r.value?.status;
                    if (isPending && String(r.value?.engineerId) === String(targetId)) {
                        userPendingCount++;
                    }
                }

                const bodyText = (alert.text || "")
                    .replace(/\{supervisor\}/g, supervisorName || "")
                    .replace(/\{count\}/g, String(userPendingCount))
                    .replace(/\{status\}/g, statusLabel)
                    .replace(/\{date\}/g, context.date || "")
                    .replace(/\{worker\}/g, context.workerName || "");

                const payloadStr = JSON.stringify({
                    title: titleText,
                    body: bodyText,
                    url: context.recordId ? "/?view_record=" + context.recordId : "/",
                    badgeCount: userPendingCount
                });

                const subEntries = await store.getSubscriptionsForUser(targetId);
                for (const subItem of subEntries) {
                    const sub = subItem.value?.endpoint ? subItem.value : subItem.value?.subscription;
                    if (!sub || !sub.endpoint) continue;
                    try {
                        const res = await sendWebPush(sub, payloadStr);
                        if (res.status === 410 || res.status === 404) {
                            console.log(`Deleting expired subscription [${subItem.key}]`);
                            await store.deleteSubscription(subItem.key);
                        }
                    } catch (pushErr: any) {
                        console.error(`Push Error for [${targetId}]:`, pushErr);
                    }
                }
            }
        }
    } catch (e: any) {
        console.error("dispatchInstantAlerts error:", e);
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
        const cairoDate = new Date(utcMs + (3 * 60 * 60 * 1000));
        const dateStr = cairoDate.toISOString().split("T")[0];
        return { dateStr, hour: cairoDate.getHours(), minute: cairoDate.getMinutes() };
    }
}

export async function runNotificationTasks(store: D1Store, forceRun: boolean = false) {
    const config = (await store.get("system", "notificationsConfig")) || {};
    const results: any = {
        pendingSent: 0,
        scheduledSent: 0,
        pendingDetails: [],
        scheduledDetails: [],
        errors: []
    };

    const cairo = getCairoTimeParts();
    const currentMins = cairo.hour * 60 + cairo.minute;
    const nowTime = Date.now();
    const nowIso = new Date().toISOString();

    // ----------------------------------------------------
    // 1. Pending Reminders for Engineers
    // ----------------------------------------------------
    try {
        const pendingConfig = config.systemReminders?.pendingReminder || {
            isActive: config.system?.pendingReminderActive ?? true,
            hours: config.system?.pendingReminderHours ?? 1,
            text: config.system?.pendingReminderText || "يوجد سركي معلق بانتظار اعتمادك منذ أكثر من {hours} ساعات، يرجى مراجعته.",
            windowActive: true,
            startTime: "08:30 AM",
            endTime: "04:30 PM"
        };

        if (pendingConfig.isActive || forceRun) {
            let isWithinWindow = true;
            if (pendingConfig.windowActive && !forceRun) {
                const startMins = parseTimeToMinutes(pendingConfig.startTime || "08:30 AM");
                const endMins = parseTimeToMinutes(pendingConfig.endTime || "04:30 PM");
                if (startMins <= endMins) {
                    isWithinWindow = currentMins >= startMins && currentMins <= endMins;
                } else {
                    isWithinWindow = currentMins >= startMins || currentMins <= endMins;
                }
            }

            if (isWithinWindow || forceRun) {
                const hours = Number(pendingConfig.hours) || 1;
                const reminderIntervalMs = hours * 60 * 60 * 1000;

                const [recordsList, usersList] = await Promise.all([
                    store.list("records"),
                    store.list("users")
                ]);

                const usersMap: Record<string, any> = {};
                for (const u of usersList) {
                    if (u.value) usersMap[u.id] = u.value;
                }

                // Group all qualifying pending records by engineer
                const pendingByEngineer: Record<string, any[]> = {};
                for (const r of recordsList) {
                    const rec = r.value;
                    if (!rec) continue;
                    const isPending = rec.status === "pending" || !rec.status;
                    if (!isPending) continue;

                    const engId = String(rec.engineerId || "");
                    if (!engId) continue;

                    const createdTime = rec.createdAt ? new Date(rec.createdAt).getTime() : 0;
                    // Check creation age if not forced
                    if (!forceRun && createdTime > 0 && (nowTime - createdTime < reminderIntervalMs)) {
                        continue;
                    }

                    // Check lastReminderSentAt if not forced
                    if (!forceRun && rec.lastReminderSentAt) {
                        const lastSent = new Date(rec.lastReminderSentAt).getTime();
                        if (nowTime - lastSent < reminderIntervalMs) {
                            continue;
                        }
                    }

                    if (!pendingByEngineer[engId]) {
                        pendingByEngineer[engId] = [];
                    }
                    pendingByEngineer[engId].push({ id: r.id, ...rec });
                }

                // Send consolidated reminder per engineer
                for (const engId in pendingByEngineer) {
                    const engRecords = pendingByEngineer[engId];
                    const count = engRecords.length;
                    const engineerUser = usersMap[engId];
                    const engineerName = engineerUser?.username || engineerUser?.name || "مهندس";

                    const title = count === 1
                        ? "⏰ تذكير: سركي معلق بانتظار الاعتماد"
                        : `⏰ تذكير: لديك (${count}) سراكي معلقة بانتظار الاعتماد`;

                    let bodyText = (pendingConfig.text || "يوجد سركي معلق بانتظار اعتمادك منذ أكثر من {hours} ساعات، يرجى مراجعته.")
                        .replace(/\{hours\}/g, String(hours))
                        .replace(/\{name\}/g, engineerName)
                        .replace(/\{count\}/g, String(count));

                    if (count > 1 && !pendingConfig.text?.includes("{count}")) {
                        bodyText = `يوجد (${count}) سراكي معلقة بانتظار اعتمادك منذ أكثر من ${hours} ساعات، يرجى مراجعتها والرد عليها.`;
                    }

                    const payloadStr = JSON.stringify({
                        title,
                        body: bodyText,
                        url: count === 1 ? "/?view_record=" + engRecords[0].id : "/?filter_status=pending",
                        badgeCount: count
                    });

                    // Target subscriptions for this engineer
                    const subEntries = await store.getSubscriptionsForUser(engId);
                    let sentForEngineer = 0;

                    for (const subItem of subEntries) {
                        const sub = subItem.value?.endpoint ? subItem.value : subItem.value?.subscription;
                        if (!sub || !sub.endpoint) continue;
                        try {
                            const res = await sendWebPush(sub, payloadStr);
                            if (res.ok) {
                                results.pendingSent++;
                                sentForEngineer++;
                            } else if (res.status === 410 || res.status === 404) {
                                await store.deleteSubscription(subItem.key);
                            }
                        } catch (err: any) {
                            results.errors.push(`Pending push error (${engId}): ${err.message}`);
                        }
                    }

                    // Update lastReminderSentAt on records in D1
                    for (const rec of engRecords) {
                        const updated = { ...rec, lastReminderSentAt: nowIso };
                        await store.set("records", rec.id, updated);
                    }

                    results.pendingDetails.push({
                        engineerId: engId,
                        engineerName,
                        pendingCount: count,
                        sentDevices: sentForEngineer
                    });
                }
            } else {
                results.pendingSkippedOutsideWindow = true;
            }
        }
    } catch (e: any) {
        console.error("Pending reminders check error:", e);
        results.errors.push("Pending check error: " + e.message);
    }

    // ----------------------------------------------------
    // 2. Cairo Daily Scheduled Notifications
    // ----------------------------------------------------
    try {
        let configUpdated = false;
        const scheduledList = config.scheduled || [];

        for (const item of scheduledList) {
            if (item.isActive === false && !forceRun) continue;

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
                // Trigger if current Cairo time reached target time within 2h window, or forceRun
                if (forceRun || (currentMins >= targetMins && currentMins <= targetMins + 120)) {
                    const targetIds = new Set<string>();

                    const explicitUsers = item.targets?.userIds || item.targets?.users || [];
                    explicitUsers.forEach((uId: any) => targetIds.add(String(uId)));

                    const targetRoles = item.targets?.roles || [];
                    if (targetRoles.length > 0) {
                        const usersList = await store.list("users");
                        for (const u of usersList) {
                            if (u.value && targetRoles.includes(u.value.role)) {
                                targetIds.add(String(u.id));
                            }
                        }
                    }

                    const payloadStr = JSON.stringify({
                        title: item.title || "تذكير يومي",
                        body: item.message || "",
                        url: "/"
                    });

                    let sentForItem = 0;
                    for (const uId of targetIds) {
                        const subEntries = await store.getSubscriptionsForUser(uId);
                        for (const subItem of subEntries) {
                            const sub = subItem.value?.endpoint ? subItem.value : subItem.value?.subscription;
                            if (!sub || !sub.endpoint) continue;
                            try {
                                const res = await sendWebPush(sub, payloadStr);
                                if (res.ok) {
                                    results.scheduledSent++;
                                    sentForItem++;
                                } else if (res.status === 410 || res.status === 404) {
                                    await store.deleteSubscription(subItem.key);
                                }
                            } catch (err: any) {
                                results.errors.push(`Scheduled push error (${uId}): ${err.message}`);
                            }
                        }
                    }

                    if (!item.sentTimesToday.includes(timeStr)) {
                        item.sentTimesToday.push(timeStr);
                    }
                    configUpdated = true;

                    results.scheduledDetails.push({
                        title: item.title,
                        time: timeStr,
                        sentDevices: sentForItem
                    });
                }
            }
        }

        if (configUpdated) {
            await store.set("system", "notificationsConfig", config);
        }
    } catch (e: any) {
        console.error("Scheduled check error:", e);
        results.errors.push("Scheduled check error: " + e.message);
    }

    return results;
}

export async function onRequest(context: any): Promise<Response> {
    const { request, env, ctx } = context;
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
                    approvedByName: rec.approvedByName || (rec.approvedById ? (usersMap[rec.approvedById] === "admin" ? "Bishoy Mamdouh" : usersMap[rec.approvedById]) : ""),
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
                for (const col of ["users", "records", "workers", "worker_directory", "push_subscriptions", "system", "location_options", "equipment", "equipment_logs"]) {
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
            for (const col of ["users", "records", "workers", "worker_directory", "push_subscriptions", "system", "location_options", "equipment", "equipment_logs"]) {
                data[col] = await store.list(col);
            }
            return jsonResponse(data);
        }

        // Batched Import
        if (resource === "import" && method === "POST") {
            const data = await request.json();
            const statements: any[] = [];
            for (const col of ["users", "records", "workers", "worker_directory", "push_subscriptions", "system", "location_options", "equipment", "equipment_logs"]) {
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

        // 9. Notifications Hub & Push Services
        if (resource === "subscribe" && method === "POST") {
            try {
                const body = await request.json();
                const userId = body.userId;
                const subscription = body.subscription;
                if (!userId || !subscription || !subscription.endpoint) {
                    return errorResponse("Missing userId or subscription", 400);
                }

                // Create a unique key per device: userId:::endpointHash
                const endpoint = subscription.endpoint;
                let hash = 0;
                for (let i = 0; i < endpoint.length; i++) {
                    hash = ((hash << 5) - hash) + endpoint.charCodeAt(i);
                    hash |= 0;
                }
                const deviceKey = `${userId}:::${Math.abs(hash).toString(36)}`;

                const subRecord = {
                    userId,
                    role: body.role || "user",
                    endpoint: subscription.endpoint,
                    keys: subscription.keys,
                    userAgent: request.headers.get("user-agent") || "",
                    updatedAt: new Date().toISOString()
                };

                await store.set("push_subscriptions", deviceKey, subRecord);

                // Clean legacy single-key subscription if present
                await store.delete("push_subscriptions", userId);

                return jsonResponse({ success: true, message: "تم تسجيل اشتراك الإشعارات للجهاز بنجاح", key: deviceKey });
            } catch (err: any) {
                console.error("Subscribe API error:", err);
                return errorResponse(err.message, 500);
            }
        }

        if (resource === "unsubscribe" && method === "POST") {
            try {
                const body = await request.json();
                const { userId, endpoint } = body;
                if (userId) {
                    const subs = await store.getSubscriptionsForUser(userId);
                    for (const s of subs) {
                        if (!endpoint || s.value?.endpoint === endpoint) {
                            await store.deleteSubscription(s.key);
                        }
                    }
                }
                return jsonResponse({ success: true });
            } catch (err: any) {
                return errorResponse(err.message, 500);
            }
        }

        if (resource === "notificationsConfig") {
            if (method === "GET") {
                const cfg = await store.get("system", "notificationsConfig");
                return jsonResponse(cfg || {});
            }
            if (method === "POST") {
                const body = await request.json();
                await store.set("system", "notificationsConfig", body);
                return jsonResponse({ success: true });
            }
        }

        if (resource === "broadcast" && method === "POST") {
            try {
                const body = await request.json();
                const { title, message, target, url: notifUrl } = body;

                let targetUserIds: string[] = [];
                const allUsers = (await store.list("users")).map(u => ({ id: u.id, ...u.value }));

                if (target === "all" || !target) {
                    targetUserIds = allUsers.map(u => u.id);
                } else if (Array.isArray(target)) {
                    targetUserIds = target;
                } else if (typeof target === "string") {
                    if (["admin", "engineer", "supervisor", "warehouse_manager", "surveyor", "operator_supervisor"].includes(target)) {
                        targetUserIds = allUsers.filter(u => u.role === target).map(u => u.id);
                    } else {
                        targetUserIds = target.split(",").map(s => s.trim());
                    }
                }

                const payload = JSON.stringify({
                    title: title || "تنبيه من الإدارة",
                    body: message || "",
                    url: notifUrl || "/"
                });

                let sentCount = 0;
                let failCount = 0;

                for (const uId of targetUserIds) {
                    const subs = await store.getSubscriptionsForUser(uId);
                    for (const subItem of subs) {
                        const sub = subItem.value?.endpoint ? subItem.value : subItem.value?.subscription;
                        if (!sub || !sub.endpoint) continue;
                        try {
                            const res = await sendWebPush(sub, payload);
                            if (res.ok) {
                                sentCount++;
                            } else if (res.status === 410 || res.status === 404) {
                                await store.deleteSubscription(subItem.key);
                                failCount++;
                            } else {
                                failCount++;
                            }
                        } catch (e) {
                            failCount++;
                        }
                    }
                }

                return jsonResponse({ success: true, sent: sentCount, failed: failCount });
            } catch (err: any) {
                console.error("Broadcast error:", err);
                return errorResponse(err.message, 500);
            }
        }

        if (resource === "test-push" && method === "POST") {
            try {
                const body = await request.json().catch(() => ({}));
                const targetUserId = body.userId;
                const title = body.title || "🔔 اختبار وصول الإشعار";
                const testBody = body.body || "تهانينا! يعمل استقبال الإشعارات على هذا الجهاز بنجاح وبأعلى كفاءة.";

                let subs: any[] = [];
                if (targetUserId) {
                    subs = await store.getSubscriptionsForUser(targetUserId);
                } else {
                    const allSubs = await store.list("push_subscriptions");
                    subs = allSubs;
                }

                const payload = JSON.stringify({
                    title,
                    body: testBody,
                    url: "/"
                });

                const results: any[] = [];
                for (const subItem of subs) {
                    const sub = subItem.value?.endpoint ? subItem.value : subItem.value?.subscription;
                    if (!sub || !sub.endpoint) continue;
                    try {
                        const res = await sendWebPush(sub, payload);
                        results.push({
                            key: subItem.key,
                            endpoint: sub.endpoint.slice(0, 45) + "...",
                            status: res.status,
                            statusText: res.statusText,
                            ok: res.ok
                        });
                        if (res.status === 410 || res.status === 404) {
                            await store.deleteSubscription(subItem.key);
                        }
                    } catch (e: any) {
                        results.push({
                            key: subItem.key,
                            endpoint: sub.endpoint.slice(0, 45) + "...",
                            error: e.message
                        });
                    }
                }

                return jsonResponse({ success: true, count: results.length, details: results });
            } catch (err: any) {
                return errorResponse(err.message, 500);
            }
        }

        if (resource === "triggerNotificationTasks") {
            const force = url.searchParams.get("force") === "true";
            let bodyForce = false;
            if (method === "POST") {
                try {
                    const b = await request.json().catch(() => ({}));
                    if (b && b.force) bodyForce = true;
                } catch {}
            }
            const forceRun = force || bodyForce;
            const res = await runNotificationTasks(store, forceRun);
            return jsonResponse({
                success: true,
                result: res
            });
        }

        // 10. CRUD Collections: users, records, workers, worker_directory, push_subscriptions, location_options, equipment, equipment_logs
        const validCollections = ["users", "records", "workers", "worker_directory", "push_subscriptions", "location_options", "equipment", "equipment_logs"];
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
                if (resource === "records") {
                    recordData.createdAt = new Date().toISOString();
                    if (recordData.status === "approved") {
                        recordData.approvedAt = new Date().toISOString();
                        if (recordData.approvedById) recordData.approvedById = recordData.approvedById;
                        if (recordData.approvedByName) recordData.approvedByName = recordData.approvedByName;
                    } else {
                        recordData.approvedAt = null;
                        recordData.approvedById = null;
                        recordData.approvedByName = null;
                    }
                }
                await store.set(resource, id, recordData);

                // Dispatch notification for new record
                if (resource === "records") {
                    const alertPromise = dispatchInstantAlerts(store, "new_record", {
                        recordId: id,
                        supervisorId: recordData.supervisorId,
                        engineerId: recordData.engineerId,
                        supervisorName: recordData.supervisorName,
                        date: recordData.date
                    });
                    if (ctx && typeof ctx.waitUntil === "function") {
                        ctx.waitUntil(alertPromise);
                    }
                    await alertPromise;
                }

                return jsonResponse(recordData, 201);
            }

            // PUT update item (by /api/:col/:id OR /api/:col?id=...)
            if (method === "PUT" && resourceId) {
                const body = await request.json();
                const current = await store.get(resource, resourceId) || {};

                // Defensive: preserve authoritative original creation timestamp
                if (resource === "records" && current.createdAt) {
                    body.createdAt = current.createdAt;
                }

                // Server-authoritative approval timestamp:
                // Updates to current server clock upon any approval action
                if (resource === "records") {
                    if (body.status === "approved") {
                        body.approvedAt = new Date().toISOString();
                        if (body.approvedById) body.approvedById = body.approvedById;
                        if (body.approvedByName) body.approvedByName = body.approvedByName;
                    } else if (body.status === "pending" || body.status === "rejected") {
                        body.approvedAt = null;
                        body.approvedById = null;
                        body.approvedByName = null;
                    }
                }

                const updated = { ...current, ...body, id: resourceId };
                await store.set(resource, resourceId, updated);

                // Dispatch notification for record status update
                if (resource === "records" && body.status && body.status !== current.status) {
                    let triggerEvent = "";
                    if (body.status === "approved") triggerEvent = "record_approved";
                    else if (body.status === "rejected") triggerEvent = "record_rejected";
                    else if (body.status === "pending" && current.status === "rejected") triggerEvent = "record_resubmit";

                    if (triggerEvent) {
                        const alertPromise = dispatchInstantAlerts(store, triggerEvent, {
                            recordId: resourceId,
                            supervisorId: current.supervisorId || body.supervisorId,
                            engineerId: current.engineerId || body.engineerId,
                            supervisorName: current.supervisorName || body.supervisorName,
                            date: current.date || body.date,
                            status: body.status
                        });
                        if (ctx && typeof ctx.waitUntil === "function") {
                            ctx.waitUntil(alertPromise);
                        }
                        await alertPromise;
                    }
                }

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
