// cloud_backup.ts
// Comprehensive Cloudflare Unified Backup & Report Generator (Labor, Equipment + Photos, Full Cloud Database)
// @ts-nocheck

import ExcelJS from "npm:exceljs";
import { ensureDir } from "https://deno.land/std@0.177.0/fs/ensure_dir.ts";

const CLOUD_BASE_URL = "https://labor-system-live.the-curve.workers.dev";
const BASE_BACKUP_DIR = "./backups";

// 3 Main Dedicated Directories requested by User
const LABOR_DIR = `${BASE_BACKUP_DIR}/1- سراكي العمالة`;
const EQUIPMENT_DIR = `${BASE_BACKUP_DIR}/2- المعدات وصور التشغيل`;
const PHOTOS_BASE_DIR = `${EQUIPMENT_DIR}/equipment_photos`;
const DATABASE_DIR = `${BASE_BACKUP_DIR}/3- قاعدة البيانات الكاملة`;

function getCairoDateStr(): string {
    try {
        const dtf = new Intl.DateTimeFormat("en-GB", {
            timeZone: "Africa/Cairo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        });
        const parts = dtf.formatToParts(new Date());
        const map: any = {};
        parts.forEach(p => map[p.type] = p.value);
        return `${map.year}-${map.month}-${map.day}`;
    } catch (_e) {
        return new Date().toISOString().split("T")[0];
    }
}

function getArabicDayName(dateStr?: string): string {
    if (!dateStr) return "";
    try {
        const d = new Date(dateStr + "T00:00:00");
        if (isNaN(d.getTime())) return "";
        const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
        return days[d.getDay()] || "";
    } catch {
        return "";
    }
}

function formatCairoTime(dateInput: any): string {
    if (!dateInput) return "-";
    try {
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return "-";
        return d.toLocaleTimeString("ar-EG-u-nu-latn", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Africa/Cairo" });
    } catch {
        return "-";
    }
}

function dataUrlToBytes(dataUrl: string): Uint8Array | null {
    try {
        const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    } catch (e) {
        console.error("Error decoding base64 image:", e.message);
        return null;
    }
}

function sanitizeFolderName(str: string): string {
    return (str || "معدة").replace(/[\\/:*?"<>|]/g, "_").trim();
}

const targetDateArg = Deno.args[0];
const todayStr = targetDateArg && /^\d{4}-\d{2}-\d{2}$/.test(targetDateArg) ? targetDateArg : getCairoDateStr();
console.log(`======================================================================`);
console.log(`   بدء منظومة النسخ الاحتياطي السحابي الشامل والتنظيم الثلاثي: ${todayStr}`);
console.log(`   1. سراكي العمالة الشاملة (Excel 4 صفحات) -> [1- سراكي العمالة/]`);
console.log(`   2. المعدات وصور التشغيل (Excel + Photos)  -> [2- المعدات وصور التشغيل/]`);
console.log(`   3. قاعدة البيانات السحابية الكاملة (JSON) -> [3- قاعدة البيانات الكاملة/]`);
console.log(`======================================================================`);

// Ensure all 3 dedicated directories exist
await ensureDir(BASE_BACKUP_DIR);
await ensureDir(LABOR_DIR);
await ensureDir(EQUIPMENT_DIR);
await ensureDir(PHOTOS_BASE_DIR);
await ensureDir(DATABASE_DIR);

// Reorganize existing scattered files in root backups/ into the 3 folders
async function organizeExistingBackups() {
    try {
        for await (const entry of Deno.readDir(BASE_BACKUP_DIR)) {
            const fullPath = `${BASE_BACKUP_DIR}/${entry.name}`;
            if (entry.isFile) {
                if (entry.name.startsWith("labor_report_") && entry.name.endsWith(".xlsx")) {
                    await Deno.rename(fullPath, `${LABOR_DIR}/${entry.name}`);
                    console.log(`-> تم نقل (${entry.name}) إلى مجلد [1- سراكي العمالة]`);
                } else if (entry.name.startsWith("equipment_report_") && entry.name.endsWith(".xlsx")) {
                    await Deno.rename(fullPath, `${EQUIPMENT_DIR}/${entry.name}`);
                    console.log(`-> تم نقل (${entry.name}) إلى مجلد [2- المعدات وصور التشغيل]`);
                } else if ((entry.name.startsWith("cloud_backup_") || entry.name.startsWith("system_backup_")) && entry.name.endsWith(".json")) {
                    await Deno.rename(fullPath, `${DATABASE_DIR}/${entry.name}`);
                    console.log(`-> تم نقل (${entry.name}) إلى مجلد [3- قاعدة البيانات الكاملة]`);
                }
            } else if (entry.isDirectory && entry.name === "equipment_photos") {
                // Move photos inside root backups/equipment_photos into EQUIPMENT_DIR/equipment_photos
                for await (const sub of Deno.readDir(fullPath)) {
                    const srcSub = `${fullPath}/${sub.name}`;
                    const dstSub = `${PHOTOS_BASE_DIR}/${sub.name}`;
                    try {
                        await Deno.rename(srcSub, dstSub);
                    } catch {
                        // ignore if destination already exists
                    }
                }
                try {
                    await Deno.remove(fullPath);
                } catch {}
            }
        }
    } catch (e) {
        console.warn("تنبيه أثناء تنظيم الملفات القديمة:", e.message);
    }
}

await organizeExistingBackups();

// 1. Fetch Full Live Export Data from Cloudflare
console.log("\n[المرحلة 1] جاري تحميل أحدث البيانات من السيرفر السحابي (Cloudflare)...");
let exportData: any = null;
try {
    const res = await fetch(`${CLOUD_BASE_URL}/api/export`, {
        headers: { "Bypass-Tunnel-Reminder": "true" }
    });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
    exportData = await res.json();
} catch (err) {
    console.error("فشل الاتصال بالسيرفر السحابي:", err.message);
    Deno.exit(1);
}

// 2. Save Full Cloud Backup JSON into [3- قاعدة البيانات الكاملة]
console.log("\n[المرحلة 2] حفظ قاعدة البيانات السحابية الكاملة في المجلد (3- قاعدة البيانات الكاملة)...");
const jsonBackupPath = `${DATABASE_DIR}/cloud_backup_${todayStr}.json`;
await Deno.writeTextFile(jsonBackupPath, JSON.stringify(exportData, null, 2));
console.log(`✓ تم حفظ النسخة الاحتياطية السحابية الكاملة (JSON): ${jsonBackupPath}`);

// Unpack collections safely
const unwrap = (arr: any[]) => Array.isArray(arr) ? arr.map(item => (item && item.value) ? { ...item.value, id: item.id || item.value.id || item.key?.[1] } : item) : [];

const rawUsers = unwrap(exportData.users);
const rawRecords = unwrap(exportData.records);
const rawWorkers = unwrap(exportData.workers);
const rawDirectory = unwrap(exportData.worker_directory);
const equipmentLogs = unwrap(exportData.equipment_logs);
const equipmentCatalog = unwrap(exportData.equipment);

console.log(`✓ عدد السراكي المسجلة: ${rawRecords.length}`);
console.log(`✓ إجمالي العمالة: ${rawWorkers.length}`);
console.log(`✓ دليل الحرفيين: ${rawDirectory.length}`);
console.log(`✓ حسابات المستخدمين: ${rawUsers.length}`);
console.log(`✓ سجلات تشغيل المعدات: ${equipmentLogs.length}`);
console.log(`✓ دليل المعدات: ${equipmentCatalog.length}`);

// Maps for quick resolution
const usersMap: Record<string, string> = {};
rawUsers.forEach(u => {
    usersMap[u.id] = (u.username === "admin" ? "Bishoy Mamdouh" : u.username) || "";
});

const recordsMap: Record<string, any> = {};
rawRecords.forEach(r => {
    recordsMap[r.id] = r;
});

const statusMap: Record<string, string> = {
    "approved": "معتمد",
    "pending": "معلق قيد المراجعة",
    "rejected": "مرفوض"
};

const roleMap: Record<string, string> = {
    "admin": "مدير النظام",
    "engineer": "مهندس موقع",
    "supervisor": "مشرف موقع",
    "surveyor": "مساح",
    "warehouse_manager": "مدير مخزن",
    "operator_supervisor": "مشرف مشغل"
};

const thinBorder = {
    top: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
    left: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
    bottom: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
    right: { style: "thin" as const, color: { argb: "FFE2E8F0" } }
};
const cellAlign = { vertical: "middle" as const, horizontal: "center" as const, wrapText: true };

// ======================================================================
// 3. GENERATE LABOR REPORT EXCEL (4 Comprehensive Sheets)
// ======================================================================
console.log("\n[المرحلة 3] جاري إنشاء وتنسيق شيت إكسيل السراكي الشامل (4 صفحات) في المجلد (1- سراكي العمالة)...");

const wbLabor = new ExcelJS.Workbook();
wbLabor.creator = "نظام إدارة العمالة والمعدات";
wbLabor.lastModifiedBy = "Bishoy Mamdouh";
wbLabor.created = new Date();
wbLabor.modified = new Date();

// --- SHEET 1: تفاصيل العمالة اليومية ---
const wsWorkers = wbLabor.addWorksheet("تفاصيل العمالة اليومية", { views: [{ rightToLeft: true }] });
const activeWorkers = rawWorkers.filter(w => !w.isDeleted && recordsMap[w.recordId]);
activeWorkers.sort((a, b) => {
    const rA = recordsMap[a.recordId] || {};
    const rB = recordsMap[b.recordId] || {};
    const supA = (usersMap[rA.supervisorId] || rA.supervisorName || "").toLowerCase();
    const supB = (usersMap[rB.supervisorId] || rB.supervisorName || "").toLowerCase();
    if (supA < supB) return -1;
    if (supA > supB) return 1;
    const dateA = rA.date || "";
    const dateB = rB.date || "";
    if (dateA > dateB) return -1;
    if (dateA < dateB) return 1;
    return (a.name || "").localeCompare(b.name || "", "ar");
});

wsWorkers.mergeCells("A1:O1");
const wTitle = wsWorkers.getCell("A1");
wTitle.value = "نظام إدارة ومتابعة العمالة - تقرير تفاصيل العمالة الشامل";
wTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF15803D" } };
wTitle.font = { name: "Segoe UI", size: 13, bold: true, color: { argb: "FFFFFFFF" } };
wTitle.alignment = cellAlign;
wsWorkers.getRow(1).height = 34;

wsWorkers.mergeCells("A2:O2");
const wSub = wsWorkers.getCell("A2");
wSub.value = `تاريخ استخراج النسخة: ${todayStr} | إجمالي عمالة السراكي: ${activeWorkers.length} عامل`;
wSub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0FDF4" } };
wSub.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "FF166534" } };
wSub.alignment = cellAlign;
wsWorkers.getRow(2).height = 20;
wsWorkers.getRow(3).height = 8;

const workerHeaders = [
    "م", "التاريخ", "اليوم", "اسم العامل", "نوع الحرفة / المهنة",
    "المشرف", "المهندس", "اليومية (ج.م)", "خصم (ج.م)", "الصافي (ج.م)",
    "مكان العمل", "بند العمل (بالتفصيل)", "المقاول", "حالة السركي", "الملاحظات"
];
const wHeaderRow = wsWorkers.addRow(workerHeaders);
wHeaderRow.height = 28;
wHeaderRow.eachCell(cell => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
    cell.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = cellAlign;
    cell.border = thinBorder;
});

wsWorkers.columns = [
    { key: "index", width: 6 },
    { key: "date", width: 14 },
    { key: "day", width: 12 },
    { key: "name", width: 26 },
    { key: "type", width: 18 },
    { key: "supervisor", width: 22 },
    { key: "engineer", width: 22 },
    { key: "amount", width: 15 },
    { key: "deduction", width: 14 },
    { key: "net", width: 15 },
    { key: "location", width: 26 },
    { key: "task", width: 36 },
    { key: "contractor", width: 18 },
    { key: "status", width: 16 },
    { key: "notes", width: 28 }
];

let sumWAmount = 0, sumWDeduction = 0, sumWNet = 0;
activeWorkers.forEach((w, idx) => {
    const rec = recordsMap[w.recordId] || {};
    const amount = Number(w.amount) || 0;
    const deduction = Number(w.deduction) || 0;
    const net = amount - deduction;
    sumWAmount += amount;
    sumWDeduction += deduction;
    sumWNet += net;

    const rowData = [
        idx + 1,
        rec.date || "",
        getArabicDayName(rec.date),
        w.name || "",
        w.type || "",
        usersMap[rec.supervisorId] || rec.supervisorName || "غير معروف",
        usersMap[rec.engineerId] || rec.engineerName || "غير معروف",
        amount,
        deduction,
        net,
        w.location || "",
        w.task || "",
        w.contractor || "",
        statusMap[rec.status] || rec.status || "",
        w.notes || ""
    ];
    const row = wsWorkers.addRow(rowData);
    row.height = 22;
    const isEven = idx % 2 === 1;
    row.eachCell((cell, colNum) => {
        cell.alignment = cellAlign;
        cell.border = thinBorder;
        cell.font = { name: "Segoe UI", size: 10 };
        if (isEven) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
        if ([8, 9, 10].includes(colNum)) {
            cell.numFmt = "#,##0";
            if (colNum === 10) cell.font = { name: "Segoe UI", size: 10, bold: true };
        }
        if (colNum === 14) {
            if (rec.status === "approved") {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
                cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "FF15803D" } };
            } else if (rec.status === "pending") {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };
                cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "FFB45309" } };
            } else if (rec.status === "rejected") {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
                cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "FFB91C1C" } };
            }
        }
    });
});

const wSummaryRow = wsWorkers.addRow(["الإجمالي العام", "", "", "", "", "", "", sumWAmount, sumWDeduction, sumWNet, "", "", "", "", ""]);
wSummaryRow.height = 26;
wsWorkers.mergeCells(`A${wSummaryRow.number}:G${wSummaryRow.number}`);
wSummaryRow.eachCell(cell => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFECFDF5" } };
    cell.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FF065F46" } };
    cell.alignment = cellAlign;
    cell.border = {
        top: { style: "thin", color: { argb: "FF059669" } },
        bottom: { style: "double", color: { argb: "FF059669" } },
        left: thinBorder.left,
        right: thinBorder.right
    };
    if (typeof cell.value === "number") cell.numFmt = "#,##0";
});

// --- SHEET 2: سجلات السراكي المجمعة ---
const wsRecords = wbLabor.addWorksheet("سجلات السراكي المجمعة", { views: [{ rightToLeft: true }] });
const sortedRecords = [...rawRecords].sort((a, b) => {
    const dateA = a.date || "";
    const dateB = b.date || "";
    if (dateA > dateB) return -1;
    if (dateA < dateB) return 1;
    return 0;
});

wsRecords.mergeCells("A1:M1");
const rTitle = wsRecords.getCell("A1");
rTitle.value = "سجلات السراكي المجمعة المعتمدة والتاريخية";
rTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
rTitle.font = { name: "Segoe UI", size: 13, bold: true, color: { argb: "FFFFFFFF" } };
rTitle.alignment = cellAlign;
wsRecords.getRow(1).height = 34;

wsRecords.mergeCells("A2:M2");
const rSub = wsRecords.getCell("A2");
rSub.value = `تاريخ استخراج النسخة: ${todayStr} | إجمالي عدد السراكي: ${sortedRecords.length} سركي`;
rSub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF6FF" } };
rSub.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "FF1E40AF" } };
rSub.alignment = cellAlign;
wsRecords.getRow(2).height = 20;
wsRecords.getRow(3).height = 8;

const recordHeaders = [
    "م", "تاريخ السركي", "اليوم", "المشرف مقدم السركي", "المهندس المعتمد",
    "عدد العمال", "إجمالي اليوميات (ج.م)", "إجمالي الخصومات (ج.م)", "صافي السركي (ج.م)",
    "حالة الاعتماد", "وقت الإرسال (توقيت القاهرة)", "ملاحظات السركي", "رقم السركي (ID)"
];
const rHeaderRow = wsRecords.addRow(recordHeaders);
rHeaderRow.height = 28;
rHeaderRow.eachCell(cell => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
    cell.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = cellAlign;
    cell.border = thinBorder;
});

wsRecords.columns = [
    { key: "index", width: 6 },
    { key: "date", width: 14 },
    { key: "day", width: 12 },
    { key: "supervisor", width: 24 },
    { key: "engineer", width: 24 },
    { key: "workerCount", width: 13 },
    { key: "gross", width: 18 },
    { key: "deduction", width: 16 },
    { key: "net", width: 18 },
    { key: "status", width: 16 },
    { key: "createdAt", width: 22 },
    { key: "notes", width: 26 },
    { key: "id", width: 38 }
];

let sumRGross = 0, sumRDed = 0, sumRNet = 0, sumRWorkers = 0;
sortedRecords.forEach((r, idx) => {
    const recWorkers = rawWorkers.filter(w => w.recordId === r.id && !w.isDeleted);
    const workerCount = recWorkers.length || Number(r.totalWorkers) || 0;
    const gross = recWorkers.reduce((s, w) => s + (Number(w.amount) || 0), 0) || Number(r.totalAmount) || 0;
    const ded = recWorkers.reduce((s, w) => s + (Number(w.deduction) || 0), 0);
    const net = gross - ded;

    sumRWorkers += workerCount;
    sumRGross += gross;
    sumRDed += ded;
    sumRNet += net;

    const rowData = [
        idx + 1,
        r.date || "",
        getArabicDayName(r.date),
        usersMap[r.supervisorId] || r.supervisorName || "غير معروف",
        usersMap[r.engineerId] || r.engineerName || "غير معروف",
        workerCount,
        gross,
        ded,
        net,
        statusMap[r.status] || r.status || "",
        formatCairoTime(r.createdAt),
        r.rejectReason ? `سبب الرفض: ${r.rejectReason}` : "",
        r.id
    ];
    const row = wsRecords.addRow(rowData);
    row.height = 22;
    const isEven = idx % 2 === 1;
    row.eachCell((cell, colNum) => {
        cell.alignment = cellAlign;
        cell.border = thinBorder;
        cell.font = { name: "Segoe UI", size: 10 };
        if (isEven) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
        if ([7, 8, 9].includes(colNum)) {
            cell.numFmt = "#,##0";
            if (colNum === 9) cell.font = { name: "Segoe UI", size: 10, bold: true };
        }
        if (colNum === 6) cell.font = { name: "Segoe UI", size: 10, bold: true };
        if (colNum === 10) {
            if (r.status === "approved") {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
                cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "FF15803D" } };
            } else if (r.status === "pending") {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };
                cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "FFB45309" } };
            } else if (r.status === "rejected") {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
                cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "FFB91C1C" } };
            }
        }
    });
});

const rSummaryRow = wsRecords.addRow(["الإجمالي العام", "", "", "", "", sumRWorkers, sumRGross, sumRDed, sumRNet, "", "", "", ""]);
rSummaryRow.height = 26;
wsRecords.mergeCells(`A${rSummaryRow.number}:E${rSummaryRow.number}`);
rSummaryRow.eachCell(cell => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF6FF" } };
    cell.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FF1E40AF" } };
    cell.alignment = cellAlign;
    cell.border = {
        top: { style: "thin", color: { argb: "FF2563EB" } },
        bottom: { style: "double", color: { argb: "FF2563EB" } },
        left: thinBorder.left,
        right: thinBorder.right
    };
    if (typeof cell.value === "number") cell.numFmt = "#,##0";
});

// --- SHEET 3: دليل العمال الأساسي ---
const wsDir = wbLabor.addWorksheet("دليل العمال الأساسي", { views: [{ rightToLeft: true }] });
const sortedDirectory = [...rawDirectory].sort((a, b) => (a.name || "").localeCompare(b.name || "", "ar"));

wsDir.mergeCells("A1:G1");
const dTitle = wsDir.getCell("A1");
dTitle.value = "دليل العمال المعتمد وقاعدة بيانات الحرفيين المسجلين";
dTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB45309" } };
dTitle.font = { name: "Segoe UI", size: 13, bold: true, color: { argb: "FFFFFFFF" } };
dTitle.alignment = cellAlign;
wsDir.getRow(1).height = 34;

wsDir.mergeCells("A2:G2");
const dSub = wsDir.getCell("A2");
dSub.value = `تاريخ استخراج النسخة: ${todayStr} | إجمالي عمال الدليل: ${sortedDirectory.length} عامل`;
dSub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFBEB" } };
dSub.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "FF92400E" } };
dSub.alignment = cellAlign;
wsDir.getRow(2).height = 20;
wsDir.getRow(3).height = 8;

const dirHeaders = ["م", "اسم العامل", "نوع الحرفة / المهنة", "رقم الهاتف", "ملاحظات وتفاصيل", "تاريخ الإضافة", "معرف العامل (ID)"];
const dHeaderRow = wsDir.addRow(dirHeaders);
dHeaderRow.height = 28;
dHeaderRow.eachCell(cell => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
    cell.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = cellAlign;
    cell.border = thinBorder;
});

wsDir.columns = [
    { key: "index", width: 6 },
    { key: "name", width: 28 },
    { key: "type", width: 22 },
    { key: "phone", width: 18 },
    { key: "notes", width: 30 },
    { key: "createdAt", width: 18 },
    { key: "id", width: 38 }
];

sortedDirectory.forEach((d, idx) => {
    const row = wsDir.addRow([idx + 1, d.name || "", d.type || "", d.phone || "-", d.notes || "", d.createdAt ? String(d.createdAt).split("T")[0] : "", d.id || ""]);
    row.height = 22;
    const isEven = idx % 2 === 1;
    row.eachCell(cell => {
        cell.alignment = cellAlign;
        cell.border = thinBorder;
        cell.font = { name: "Segoe UI", size: 10 };
        if (isEven) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
    });
});

// --- SHEET 4: حسابات المستخدمين والصلاحيات ---
const wsUsers = wbLabor.addWorksheet("حسابات المستخدمين والصلاحيات", { views: [{ rightToLeft: true }] });
const sortedUsers = [...rawUsers].sort((a, b) => (a.username || "").localeCompare(b.username || "", "ar"));

wsUsers.mergeCells("A1:D1");
const uTitle = wsUsers.getCell("A1");
uTitle.value = "قائمة حسابات المستخدمين وصلاحياتهم في النظام";
uTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4338CA" } };
uTitle.font = { name: "Segoe UI", size: 13, bold: true, color: { argb: "FFFFFFFF" } };
uTitle.alignment = cellAlign;
wsUsers.getRow(1).height = 34;

wsUsers.mergeCells("A2:D2");
const uSub = wsUsers.getCell("A2");
uSub.value = `تاريخ استخراج النسخة: ${todayStr} | إجمالي المستخدمين: ${sortedUsers.length} مستخدم`;
uSub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEF2FF" } };
uSub.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "FF3730A3" } };
uSub.alignment = cellAlign;
wsUsers.getRow(2).height = 20;
wsUsers.getRow(3).height = 8;

const userHeaders = ["م", "اسم المستخدم / الاسم الكامل", "الدور الوظيفي في النظام", "معرف المستخدم (ID)"];
const uHeaderRow = wsUsers.addRow(userHeaders);
uHeaderRow.height = 28;
uHeaderRow.eachCell(cell => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
    cell.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = cellAlign;
    cell.border = thinBorder;
});

wsUsers.columns = [
    { key: "index", width: 6 },
    { key: "username", width: 28 },
    { key: "role", width: 26 },
    { key: "id", width: 38 }
];

sortedUsers.forEach((u, idx) => {
    const dispName = (u.username === "admin" ? "Bishoy Mamdouh" : u.username) || "";
    const row = wsUsers.addRow([idx + 1, dispName, roleMap[u.role] || u.role || "", u.id || ""]);
    row.height = 22;
    const isEven = idx % 2 === 1;
    row.eachCell(cell => {
        cell.alignment = cellAlign;
        cell.border = thinBorder;
        cell.font = { name: "Segoe UI", size: 10 };
        if (isEven) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
    });
});

const laborExcelPath = `${LABOR_DIR}/labor_report_${todayStr}.xlsx`;
await wbLabor.xlsx.writeFile(laborExcelPath);
console.log(`✓ تم إنشاء شيت إكسيل العمالة الشامل بنجاح: ${laborExcelPath}`);

// ======================================================================
// 4. PROCESS & SAVE EQUIPMENT PHOTOS & DEDICATED EQUIPMENT EXCEL
// ======================================================================
console.log("\n[المرحلة 4] جاري فحص وتنزيل وحفظ صور تشغيل المعدات في مجلد (2- المعدات وصور التشغيل/equipment_photos)...");
let savedPhotosCount = 0;
let alreadyExistingPhotosCount = 0;

// logPhotoMap will store relative hyperlinks for Excel (from EQUIPMENT_DIR)
const logPhotoMap: Record<string, { before: string[]; after: string[]; folder: string }> = {};

for (const log of equipmentLogs) {
    const logDate = log.date || todayStr;
    const cleanEqName = sanitizeFolderName(`${log.equipmentCode ? log.equipmentCode + "_" : ""}${log.equipmentName}`);
    const shortId = (String(log.id || "")).slice(-6);
    // Relative to EQUIPMENT_DIR (for Excel links to work directly):
    const logFolderRelative = `equipment_photos/${logDate}/${cleanEqName}_${shortId}`;
    const logFolderAbsolute = `${EQUIPMENT_DIR}/${logFolderRelative}`;

    logPhotoMap[log.id] = { before: [], after: [], folder: logFolderRelative };

    const hasPhotos = (Array.isArray(log.beforePhotos) && log.beforePhotos.length > 0) ||
                      (Array.isArray(log.afterPhotos) && log.afterPhotos.length > 0);
    if (!hasPhotos) continue;

    await ensureDir(logFolderAbsolute);

    // Save Before Photos
    if (Array.isArray(log.beforePhotos)) {
        for (let idx = 0; idx < log.beforePhotos.length; idx++) {
            const p = log.beforePhotos[idx];
            const pId = p.id || `b_${idx + 1}`;
            const fileName = `قبل_العمل_${idx + 1}_${pId}.jpg`;
            const fileRelativePath = `${logFolderRelative}/${fileName}`;
            const fileAbsolutePath = `${EQUIPMENT_DIR}/${fileRelativePath}`;

            logPhotoMap[log.id].before.push(fileRelativePath);

            let exists = false;
            try {
                const stat = await Deno.stat(fileAbsolutePath);
                if (stat.isFile && stat.size > 0) exists = true;
            } catch {}

            if (!exists && p.url && p.url.startsWith("data:image")) {
                const bytes = dataUrlToBytes(p.url);
                if (bytes) {
                    await Deno.writeFile(fileAbsolutePath, bytes);
                    savedPhotosCount++;
                }
            } else if (exists) {
                alreadyExistingPhotosCount++;
            }
        }
    }

    // Save After Photos
    if (Array.isArray(log.afterPhotos)) {
        for (let idx = 0; idx < log.afterPhotos.length; idx++) {
            const p = log.afterPhotos[idx];
            const pId = p.id || `a_${idx + 1}`;
            const fileName = `بعد_العمل_${idx + 1}_${pId}.jpg`;
            const fileRelativePath = `${logFolderRelative}/${fileName}`;
            const fileAbsolutePath = `${EQUIPMENT_DIR}/${fileRelativePath}`;

            logPhotoMap[log.id].after.push(fileRelativePath);

            let exists = false;
            try {
                const stat = await Deno.stat(fileAbsolutePath);
                if (stat.isFile && stat.size > 0) exists = true;
            } catch {}

            if (!exists && p.url && p.url.startsWith("data:image")) {
                const bytes = dataUrlToBytes(p.url);
                if (bytes) {
                    await Deno.writeFile(fileAbsolutePath, bytes);
                    savedPhotosCount++;
                }
            } else if (exists) {
                alreadyExistingPhotosCount++;
            }
        }
    }
}

console.log(`✓ تم حفظ (${savedPhotosCount}) صورة جديدة محلياً.`);
if (alreadyExistingPhotosCount > 0) {
    console.log(`✓ تم التحقق من وجود (${alreadyExistingPhotosCount}) صورة محفوظة مسبقاً.`);
}

// Generate Dedicated Equipment Excel Workbook
console.log("\n[المرحلة 5] جاري إنشاء وتنسيق شيت إكسيل المعدات في مجلد (2- المعدات وصور التشغيل)...");

const wbEquip = new ExcelJS.Workbook();
wbEquip.creator = "نظام إدارة العمالة والمعدات";
wbEquip.created = new Date();

// --- SHEET 1: سجلات تشغيل المعدات ---
const wsLogs = wbEquip.addWorksheet("سجلات تشغيل المعدات", {
    views: [{ rtl: true, showGridLines: true }],
    properties: { defaultRowHeight: 25 }
});

// Title Banner
wsLogs.mergeCells("A1:W1");
const titleCell = wsLogs.getCell("A1");
titleCell.value = `تقرير وسجلات تشغيل وساعات المعدات الشاملة (تاريخ النسخ: ${todayStr})`;
titleCell.alignment = { horizontal: "center", vertical: "middle" };
titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
wsLogs.getRow(1).height = 42;

// Sub-banner info
wsLogs.mergeCells("A2:W2");
const subCell = wsLogs.getCell("A2");
subCell.value = `إجمالي عدد سجلات التشغيل: ${equipmentLogs.length} | مجلد الصور: equipment_photos/ داخل نفس الفولدر | انقر على أي رابط صورة لفتحها فوراً من جهازك`;
subCell.alignment = { horizontal: "center", vertical: "middle" };
subCell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF334155" } };
subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
wsLogs.getRow(2).height = 24;

// Headers
const equipHeaders = [
    { key: "index", header: "م", width: 6 },
    { key: "date", header: "تاريخ التشغيل", width: 14 },
    { key: "name", header: "اسم المعدة", width: 22 },
    { key: "code", header: "كود المعدة", width: 12 },
    { key: "contractor", header: "المقاول / المالك", width: 20 },
    { key: "location", header: "مكان العمل بالتفصيل", width: 25 },
    { key: "driver", header: "اسم السائق / المشغل", width: 20 },
    { key: "engineer", header: "المهندس المسؤول", width: 20 },
    { key: "startTime", header: "من", width: 10 },
    { key: "endTime", header: "إلى", width: 10 },
    { key: "grossHours", header: "إجمالي التواجد (س)", width: 15 },
    { key: "breakHours", header: "المستقطع (س)", width: 13 },
    { key: "breakReason", header: "سبب الاستقطاع / العطل", width: 22 },
    { key: "netHours", header: "صافي ساعات العمل", width: 16 },
    { key: "rate", header: "سعر الساعة (ج.م)", width: 15 },
    { key: "deduction", header: "الخصم المالي (ج.م)", width: 15 },
    { key: "totalCost", header: "صافي المستحق (ج.م)", width: 17 },
    { key: "status", header: "حالة الاعتماد", width: 14 },
    { key: "approvedBy", header: "المعتمد بواسطة", width: 18 },
    { key: "notes", header: "بيان الأعمال والملاحظات", width: 35 },
    { key: "beforePhotos", header: "صور قبل العمل (اضغط للفتح)", width: 25 },
    { key: "afterPhotos", header: "صور بعد انتهاء العمل (اضغط للفتح)", width: 25 },
    { key: "archiveStatus", header: "حالة الصور بالسيرفر السحابي", width: 22 }
];

wsLogs.getRow(4).values = equipHeaders.map(h => h.header);
wsLogs.getRow(4).height = 30;

equipHeaders.forEach((h, i) => {
    wsLogs.getColumn(i + 1).width = h.width;
    const cell = wsLogs.getRow(4).getCell(i + 1);
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.font = { name: "Arial", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3B82F6" } };
    cell.border = {
        top: { style: "thin", color: { argb: "FF94A3B8" } },
        bottom: { style: "medium", color: { argb: "FF1E293B" } },
        left: { style: "thin", color: { argb: "FF94A3B8" } },
        right: { style: "thin", color: { argb: "FF94A3B8" } }
    };
});

const sortedLogs = [...equipmentLogs].sort((a, b) => (a.date || "").localeCompare(b.date || ""));

let totalGrossSum = 0;
let totalBreakSum = 0;
let totalNetSum = 0;
let totalDedSum = 0;
let totalCostSum = 0;

sortedLogs.forEach((log, idx) => {
    const gross = Number(log.grossHours || 0);
    const brk = Number(log.breakHours || 0);
    const net = Number(log.netHours || 0);
    const rate = Number(log.hourlyRate || 0);
    const ded = Number(log.deductionAmount !== undefined ? log.deductionAmount : (log.deduction || 0));
    const cost = Number(log.totalCost !== undefined ? log.totalCost : Math.max(0, net * rate - ded));

    totalGrossSum += gross;
    totalBreakSum += brk;
    totalNetSum += net;
    totalDedSum += ded;
    totalCostSum += cost;

    let statusAr = "قيد الانتظار";
    if (log.status === "approved") statusAr = "معتمد";
    else if (log.status === "rejected") statusAr = "مرفوض";

    const photosMeta = logPhotoMap[log.id] || { before: [], after: [], folder: "" };

    // Before Photos Hyperlink
    let beforeVal: any = "-";
    if (photosMeta.before.length > 0) {
        beforeVal = {
            text: `📷 ${photosMeta.before.length} صورة (اضغط للفتح)`,
            hyperlink: photosMeta.before[0]
        };
    } else if (log.photosArchived) {
        beforeVal = "📦 مؤرشف محلياً";
    }

    // After Photos Hyperlink
    let afterVal: any = "-";
    if (photosMeta.after.length > 0) {
        afterVal = {
            text: `📸 ${photosMeta.after.length} صورة (اضغط للفتح)`,
            hyperlink: photosMeta.after[0]
        };
    } else if (log.photosArchived) {
        afterVal = "📦 مؤرشف محلياً";
    }

    let archiveText = "سحابي ومحلي (حديث)";
    if (log.photosArchived) {
        archiveText = "محلي فقط (أزيل من السحابي بعد 14 يوم)";
    }

    const rowData = [
        idx + 1,
        log.date || "-",
        log.equipmentName || "-",
        log.equipmentCode || "-",
        log.contractor || "-",
        log.location || "-",
        log.driverName || "-",
        log.engineerName || "-",
        log.startTime || "-",
        log.endTime || "-",
        gross,
        brk,
        log.breakReason || "-",
        net,
        rate,
        ded,
        cost,
        statusAr,
        log.approvedByName || "-",
        log.notes || "-",
        beforeVal,
        afterVal,
        archiveText
    ];

    const row = wsLogs.addRow(rowData);
    row.height = 24;

    const isEven = idx % 2 === 0;
    const bgArgb = isEven ? "FFFFFFFF" : "FFF8FAFC";

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.font = { name: "Arial", size: 10 };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
        cell.border = {
            top: { style: "thin", color: { argb: "FFE2E8F0" } },
            bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
            left: { style: "thin", color: { argb: "FFE2E8F0" } },
            right: { style: "thin", color: { argb: "FFE2E8F0" } }
        };

        if ([3, 5, 6, 7, 8, 13, 20].includes(colNumber)) {
            cell.alignment = { vertical: "middle", horizontal: "right", wrapText: true };
        }

        if ([11, 12, 14].includes(colNumber)) {
            cell.numFmt = "0.00";
            cell.font = { name: "Arial", size: 10, bold: colNumber === 14, color: colNumber === 14 ? { argb: "FF047857" } : undefined };
        }
        if ([15, 16, 17].includes(colNumber)) {
            cell.numFmt = "#,##0.00";
            if (colNumber === 17) {
                cell.font = { name: "Arial", size: 10.5, bold: true, color: { argb: "FFB45309" } };
            }
        }

        if ((colNumber === 21 && photosMeta.before.length > 0) || (colNumber === 22 && photosMeta.after.length > 0)) {
            cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF2563EB" }, underline: true };
        }

        if (colNumber === 18) {
            if (statusAr === "معتمد") {
                cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF059669" } };
            } else if (statusAr === "مرفوض") {
                cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFDC2626" } };
            } else {
                cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFD97706" } };
            }
        }
    });
});

// Totals Row
const totalRowNum = sortedLogs.length + 5;
const totalsData = [
    "الإجمالي", "", "", "", "", "", "", "", "", "",
    totalGrossSum, totalBreakSum, "", totalNetSum, "", totalDedSum, totalCostSum,
    "", "", "", "", "", ""
];

const totalRow = wsLogs.addRow(totalsData);
totalRow.height = 28;
wsLogs.mergeCells(`A${totalRowNum}:J${totalRowNum}`);
const totLabel = wsLogs.getCell(`A${totalRowNum}`);
totLabel.value = "الإجمالي العام لكافة سجلات تشغيل المعدات:";
totLabel.alignment = { horizontal: "center", vertical: "middle" };

totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.font = { name: "Arial", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
    cell.border = {
        top: { style: "medium", color: { argb: "FF0F172A" } },
        bottom: { style: "double", color: { argb: "FF0F172A" } },
        left: { style: "thin", color: { argb: "FF475569" } },
        right: { style: "thin", color: { argb: "FF475569" } }
    };
    if ([11, 12, 14].includes(colNumber)) cell.numFmt = "0.00";
    if ([16, 17].includes(colNumber)) cell.numFmt = "#,##0.00";
});

// --- SHEET 2: دليل وبيانات المعدات المسجلة ---
const wsCat = wbEquip.addWorksheet("دليل المعدات", {
    views: [{ rtl: true, showGridLines: true }],
    properties: { defaultRowHeight: 24 }
});

wsCat.mergeCells("A1:G1");
const catTitle = wsCat.getCell("A1");
catTitle.value = "دليل وبيانات أسعار وتكلفة تشغيل المعدات";
catTitle.alignment = { horizontal: "center", vertical: "middle" };
catTitle.font = { name: "Arial", size: 15, bold: true, color: { argb: "FFFFFFFF" } };
catTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D9488" } };
wsCat.getRow(1).height = 38;

const catHeaders = [
    { header: "م", width: 6 },
    { header: "اسم المعدة", width: 24 },
    { header: "كود المعدة", width: 14 },
    { header: "المقاول / الجهة المالكة", width: 24 },
    { header: "سعر الساعة (ج.م)", width: 16 },
    { header: "ساعات اليومية القياسية", width: 18 },
    { header: "يومية المعدة التقديرية", width: 18 }
];

wsCat.getRow(3).values = catHeaders.map(h => h.header);
wsCat.getRow(3).height = 28;

catHeaders.forEach((h, i) => {
    wsCat.getColumn(i + 1).width = h.width;
    const c = wsCat.getRow(3).getCell(i + 1);
    c.alignment = { horizontal: "center", vertical: "middle" };
    c.font = { name: "Arial", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
});

equipmentCatalog.forEach((eq, idx) => {
    const hRate = Number(eq.hourlyRate || 0);
    const dHours = Number(eq.dailyHours || 8);
    const dRate = Number(eq.dailyRate || hRate * dHours);

    const r = wsCat.addRow([
        idx + 1,
        eq.name || "-",
        eq.code || "-",
        eq.contractor || "-",
        hRate,
        dHours,
        dRate
    ]);
    r.height = 22;
    r.eachCell({ includeEmpty: true }, (c, col) => {
        c.alignment = { horizontal: "center", vertical: "middle" };
        c.font = { name: "Arial", size: 10 };
        c.border = {
            top: { style: "thin", color: { argb: "FFE2E8F0" } },
            bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
            left: { style: "thin", color: { argb: "FFE2E8F0" } },
            right: { style: "thin", color: { argb: "FFE2E8F0" } }
        };
        if ([2, 4].includes(col)) c.alignment = { horizontal: "right", vertical: "middle" };
        if ([5, 7].includes(col)) c.numFmt = "#,##0.00";
    });
});

const equipExcelPath = `${EQUIPMENT_DIR}/equipment_report_${todayStr}.xlsx`;
await wbEquip.xlsx.writeFile(equipExcelPath);
console.log(`✓ تم إنشاء وتنسيق شيت إكسيل المعدات بنجاح: ${equipExcelPath}`);

// ======================================================================
// 5. CHECK 14-DAY PRUNING POLICY ON CLOUDFLARE
// ======================================================================
console.log("\n[المرحلة 6] فحص شرط مرور أسبوعين (14 يوماً) لإزالة الصور من السيرفر السحابي بعد التحقق من حفظها محلياً...");

function calculateDateDiffDays(recordDate: string, currentTargetDate: string): number {
    try {
        const d1 = new Date(recordDate);
        const d2 = new Date(currentTargetDate);
        const diffMs = d2.getTime() - d1.getTime();
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    } catch {
        return 0;
    }
}

let prunedCount = 0;
let eligibleCount = 0;

for (const log of equipmentLogs) {
    if (!log.date) continue;
    const diffDays = calculateDateDiffDays(log.date, todayStr);

    const hasCloudPhotos = (Array.isArray(log.beforePhotos) && log.beforePhotos.length > 0) ||
                           (Array.isArray(log.afterPhotos) && log.afterPhotos.length > 0);

    // Rule: Must be 14 days or older from the equipment operation date
    if (diffDays >= 14 && hasCloudPhotos) {
        eligibleCount++;
        const photosMeta = logPhotoMap[log.id] || { before: [], after: [] };
        const allLocalPaths = [...photosMeta.before, ...photosMeta.after];

        // Safety verification: Check that all local files exist and are not empty
        let allVerified = allLocalPaths.length > 0;
        for (const relPath of allLocalPaths) {
            try {
                const stat = await Deno.stat(`${EQUIPMENT_DIR}/${relPath}`);
                if (!stat.isFile || stat.size === 0) {
                    allVerified = false;
                    break;
                }
            } catch {
                allVerified = false;
                break;
            }
        }

        if (allVerified) {
            console.log(`-> المعدة: (${log.equipmentName}) بتاريخ (${log.date}) مر عليها ${diffDays} يوماً وتم التحقق من وجود صورها على الهارد ديسك.`);
            console.log(`   جاري إزالة الصور من السيرفر السحابي لتوفير المساحة...`);

            try {
                const updateRes = await fetch(`${CLOUD_BASE_URL}/api/equipment_logs?id=${log.id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Bypass-Tunnel-Reminder": "true"
                    },
                    body: JSON.stringify({
                        beforePhotos: [],
                        afterPhotos: [],
                        photosArchived: true,
                        photosArchivedAt: new Date().toISOString(),
                        photosLocalBackupPath: photosMeta.folder
                    })
                });

                if (updateRes.ok) {
                    prunedCount++;
                    console.log(`   ✓ تم إخلاء الصور من السيرفر السحابي بنجاح للسجل (${log.id}).`);
                } else {
                    console.error(`   ✗ فشل تحديث السجل على السيرفر السحابي: ${updateRes.status}`);
                }
            } catch (pruneErr) {
                console.error(`   ✗ خطأ أثناء تفريغ الصور للسجل (${log.id}):`, pruneErr.message);
            }
        } else {
            console.warn(`[تحذير أمان]: السجل (${log.id}) بتاريخ (${log.date}) لم يتم التحقق بنسبة 100% من اكتمال صوره على الهارد، تم تخطيه حفاظاً على البيانات!`);
        }
    }
}

if (eligibleCount === 0) {
    console.log(`✓ لا توجد سجلات معدات بها صور مر عليها أكثر من 14 يوماً حتى تاريخ اليوم (${todayStr}).`);
    console.log(`  (الصور السحابية الحالية حديثة وسارية للرجوع إليها من الهواتف).`);
} else {
    console.log(`✓ إجمالي السجلات التي تم إخلاء صورها من السيرفر السحابي بعد حفظها محلياً: ${prunedCount}`);
}

console.log(`\n======================================================================`);
console.log(`   اكتمل النسخ الاحتياطي والتنظيم بنجاح تام! 🎉`);
console.log(`   📁 المجلد 1: ${LABOR_DIR}/ (إكسيل السراكي الشامل 4 صفحات)`);
console.log(`   📁 المجلد 2: ${EQUIPMENT_DIR}/ (إكسيل المعدات + فولدر الصور)`);
console.log(`   📁 المجلد 3: ${DATABASE_DIR}/ (ملف قاعدة البيانات JSON الكامل)`);
console.log(`======================================================================`);
