// cloud_backup.ts
// Comprehensive Cloudflare Backup & Dedicated Equipment Report Generator with Photo Archiving
// @ts-nocheck

import ExcelJS from "npm:exceljs";
import { ensureDir } from "https://deno.land/std@0.177.0/fs/ensure_dir.ts";

const CLOUD_BASE_URL = "https://labor-system-live.the-curve.workers.dev";
const BACKUP_DIR = "./backups";
const PHOTOS_BASE_DIR = "./backups/equipment_photos";

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

const todayStr = getCairoDateStr();
console.log(`=======================================================`);
console.log(`   بدء عملية النسخ الاحتياطي الشامل للمعدات والصور: ${todayStr}`);
console.log(`=======================================================`);

await ensureDir(BACKUP_DIR);
await ensureDir(PHOTOS_BASE_DIR);

// 1. Fetch Full Export Data from Live Cloudflare Server
console.log("\n1. جاري تحميل أحدث البيانات من السيرفر السحابي (Cloudflare)...");
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

// Save Full Cloud Backup JSON
const jsonBackupPath = `${BACKUP_DIR}/cloud_backup_${todayStr}.json`;
await Deno.writeTextFile(jsonBackupPath, JSON.stringify(exportData, null, 2));
console.log(`✓ تم حفظ النسخة الاحتياطية السحابية الكاملة (JSON): ${jsonBackupPath}`);

// Normalize items (unwrapping { key, value, id } if present)
const rawEquipmentLogs = Array.isArray(exportData.equipment_logs) ? exportData.equipment_logs : [];
const equipmentLogs: any[] = rawEquipmentLogs.map(item => (item && item.value) ? { ...item.value, id: item.id || item.value.id } : item);

const rawEquipmentCatalog = Array.isArray(exportData.equipment) ? exportData.equipment : [];
const equipmentCatalog: any[] = rawEquipmentCatalog.map(item => (item && item.value) ? { ...item.value, id: item.id || item.value.id } : item);

console.log(`✓ عدد سجلات تشغيل المعدات: ${equipmentLogs.length}`);
console.log(`✓ عدد المعدات المسجلة في الدليل: ${equipmentCatalog.length}`);

// 2. Helper: Base64 to Uint8Array
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

// 3. Process & Save Photos to Local Disk
console.log("\n2. جاري فحص وتنزيل وحفظ صور تشغيل المعدات محلياً بشكل منظم...");
let savedPhotosCount = 0;
let alreadyExistingPhotosCount = 0;

// Structure to track local photo paths per log for Excel hyperlinks and safety verification
const logPhotoMap: Record<string, { before: string[]; after: string[]; folder: string }> = {};

for (const log of equipmentLogs) {
    const logDate = log.date || todayStr;
    const cleanEqName = sanitizeFolderName(`${log.equipmentCode ? log.equipmentCode + '_' : ''}${log.equipmentName}`);
    const shortId = (String(log.id || "")).slice(-6);
    const logFolderRelative = `equipment_photos/${logDate}/${cleanEqName}_${shortId}`;
    const logFolderAbsolute = `${BACKUP_DIR}/${logFolderRelative}`;

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
            const fileAbsolutePath = `${BACKUP_DIR}/${fileRelativePath}`;

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
            const fileAbsolutePath = `${BACKUP_DIR}/${fileRelativePath}`;

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

console.log(`✓ تم حفظ (${savedPhotosCount}) صورة جديدة محلياً في المجلد: ${PHOTOS_BASE_DIR}/`);
if (alreadyExistingPhotosCount > 0) {
    console.log(`✓ تم التحقق من وجود (${alreadyExistingPhotosCount}) صورة محفوظة مسبقاً.`);
}

// 4. Generate Dedicated Equipment Excel Workbook
console.log("\n3. جاري إنشاء وتنسيق شيت الإكسيل المتخصص للمعدات مع روابط الصور...");

const wb = new ExcelJS.Workbook();
wb.creator = "نظام إدارة العمالة والمعدات";
wb.created = new Date();

// --- SHEET 1: سجلات تشغيل المعدات ---
const wsLogs = wb.addWorksheet("سجلات تشغيل المعدات", {
    views: [{ rtl: true, showGridLines: true }],
    properties: { defaultRowHeight: 25 }
});

// Title Banner
wsLogs.mergeCells("A1:W1");
const titleCell = wsLogs.getCell("A1");
titleCell.value = `تقرير وسجلات تشغيل وساعات المعدات الشاملة (تاريخ النسخ: ${todayStr})`;
titleCell.alignment = { horizontal: "center", vertical: "middle" };
titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } }; // Deep Navy
wsLogs.getRow(1).height = 42;

// Sub-banner info
wsLogs.mergeCells("A2:W2");
const subCell = wsLogs.getCell("A2");
subCell.value = `إجمالي عدد سجلات التشغيل: ${equipmentLogs.length} | مجلد الصور المرفقة: backups/equipment_photos/ | الروابط في عمودي الصور قابلة للفتح المباشر بالنقر عليها`;
subCell.alignment = { horizontal: "center", vertical: "middle" };
subCell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF334155" } };
subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
wsLogs.getRow(2).height = 24;

// Table Column Headers
const headers = [
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

wsLogs.getRow(4).values = headers.map(h => h.header);
wsLogs.getRow(4).height = 30;

headers.forEach((h, i) => {
    wsLogs.getColumn(i + 1).width = h.width;
    const cell = wsLogs.getRow(4).getCell(i + 1);
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.font = { name: "Arial", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3B82F6" } }; // Royal Blue
    cell.border = {
        top: { style: "thin", color: { argb: "FF94A3B8" } },
        bottom: { style: "medium", color: { argb: "FF1E293B" } },
        left: { style: "thin", color: { argb: "FF94A3B8" } },
        right: { style: "thin", color: { argb: "FF94A3B8" } }
    };
});

// Sort equipment logs by date ascending
const sortedLogs = [...equipmentLogs].sort((a, b) => (a.date || "").localeCompare(b.date || ""));

let totalGrossSum = 0;
let totalBreakSum = 0;
let totalNetSum = 0;
let totalDedSum = 0;
let totalCostSum = 0;

sortedLogs.forEach((log, idx) => {
    const rowNum = idx + 5;
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
            hyperlink: photosMeta.before[0] // Relative link to photo file
        };
    } else if (log.photosArchived) {
        beforeVal = "📦 مؤرشف محلياً";
    }

    // After Photos Hyperlink
    let afterVal: any = "-";
    if (photosMeta.after.length > 0) {
        afterVal = {
            text: `📸 ${photosMeta.after.length} صورة (اضغط للفتح)`,
            hyperlink: photosMeta.after[0] // Relative link to photo file
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

        // Align text columns to right
        if ([3, 5, 6, 7, 8, 13, 20].includes(colNumber)) {
            cell.alignment = { vertical: "middle", horizontal: "right", wrapText: true };
        }

        // Format numbers
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

        // Highlight Hyperlinks
        if ((colNumber === 21 && photosMeta.before.length > 0) || (colNumber === 22 && photosMeta.after.length > 0)) {
            cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF2563EB" }, underline: true };
        }

        // Status highlight
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
    "الإجمالي",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    totalGrossSum,
    totalBreakSum,
    "",
    totalNetSum,
    "",
    totalDedSum,
    totalCostSum,
    "",
    "",
    "",
    "",
    "",
    ""
];

const totalRow = wsLogs.addRow(totalsData);
totalRow.height = 28;
wsLogs.mergeCells(`A${totalRowNum}:J${totalRowNum}`);
const totLabel = wsLogs.getCell(`A${totalRowNum}`);
totLabel.value = "الإجمالي العام لكافة سجلات تشغيل المعدات:";
totLabel.alignment = { horizontal: "center", vertical: "middle" };

totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.font = { name: "Arial", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } }; // Slate 800
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
const wsCat = wb.addWorksheet("دليل المعدات", {
    views: [{ rtl: true, showGridLines: true }],
    properties: { defaultRowHeight: 24 }
});

wsCat.mergeCells("A1:G1");
const catTitle = wsCat.getCell("A1");
catTitle.value = "دليل وبيانات أسعار وتكلفة تشغيل المعدات";
catTitle.alignment = { horizontal: "center", vertical: "middle" };
catTitle.font = { name: "Arial", size: 15, bold: true, color: { argb: "FFFFFFFF" } };
catTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D9488" } }; // Teal
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

// Save Excel file
const excelReportPath = `${BACKUP_DIR}/equipment_report_${todayStr}.xlsx`;
await wb.xlsx.writeFile(excelReportPath);
console.log(`✓ تم إنشاء وتنسيق شيت الإكسيل المتخصص للمعدات بنجاح: ${excelReportPath}`);

// 5. Check 14-Day Pruning Policy on Cloudflare Server
console.log("\n4. فحص شرط مرور أسبوعين (14 يوماً) لإزالة الصور من السيرفر السحابي بعد التحقق من حفظها محلياً...");

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
                const stat = await Deno.stat(`${BACKUP_DIR}/${relPath}`);
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

console.log(`\n=======================================================`);
console.log(`   اكتمل النسخ الاحتياطي والأرشفة بنجاح! 🎉`);
console.log(`   - ملف الإكسيل الشامل: ${excelReportPath}`);
console.log(`   - مجلد صور المعدات: ${PHOTOS_BASE_DIR}/`);
console.log(`=======================================================`);
