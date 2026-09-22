import ExcelJS from "npm:exceljs";

const BACKUP_DIR = "D:\\B I S H O Y\\PROTECT\\11- سراكى العمال\\labor-management-app\\backups";
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

const dateStr = getCairoDateStr();

console.log(`Starting backup for date: ${dateStr}...`);

await Deno.mkdir(BACKUP_DIR, { recursive: true });

// Open database
const kv = await Deno.openKv("D:\\B I S H O Y\\PROTECT\\11- سراكى العمال\\labor-management-app\\database.sqlite");

// 1. Export JSON Data
const exportData: Record<string, any[]> = {};
for await (const entry of kv.list({ prefix: [] })) {
    const collection = String(entry.key[0]);
    if (!exportData[collection]) exportData[collection] = [];
    exportData[collection].push({ key: entry.key, value: entry.value });
}

const jsonPath = `${BACKUP_DIR}\\system_backup_${dateStr}.json`;
await Deno.writeTextFile(jsonPath, JSON.stringify(exportData, null, 2));
console.log(`JSON Backup saved successfully to: ${jsonPath}`);

// 2. Prepare Data for Excel Workbook
const rawUsers: any[] = [];
for await (const entry of kv.list({ prefix: ["users"] })) {
    if (entry.value) rawUsers.push(entry.value);
}

const rawRecords: any[] = [];
for await (const entry of kv.list({ prefix: ["records"] })) {
    if (entry.value) rawRecords.push({ ...entry.value, id: entry.key[1] });
}

const rawWorkers: any[] = [];
for await (const entry of kv.list({ prefix: ["workers"] })) {
    if (entry.value) rawWorkers.push({ ...entry.value, id: entry.key[1] });
}

const rawDirectory: any[] = [];
for await (const entry of kv.list({ prefix: ["worker_directory"] })) {
    if (entry.value) rawDirectory.push({ ...entry.value, id: entry.key[1] });
}

const usersMap: Record<string, string> = {};
rawUsers.forEach(u => {
    usersMap[u.id] = (u.username === 'admin' ? 'Bishoy Mamdouh' : u.username) || '';
});

const recordsMap: Record<string, any> = {};
rawRecords.forEach(r => {
    recordsMap[r.id] = r;
});

const statusMap: Record<string, string> = {
    'approved': 'معتمد',
    'pending': 'معلق قيد المراجعة',
    'rejected': 'مرفوض'
};

const roleMap: Record<string, string> = {
    'admin': 'مدير النظام',
    'engineer': 'مهندس موقع',
    'supervisor': 'مشرف موقع',
    'surveyor': 'مساح',
    'warehouse_manager': 'مدير مخزن',
    'operator_supervisor': 'مشرف مشغل'
};

function getArabicDayName(dateStr?: string): string {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr + 'T00:00:00');
        if (isNaN(d.getTime())) return '';
        const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        return days[d.getDay()] || '';
    } catch {
        return '';
    }
}

function formatCairoTime(dateInput: any): string {
    if (!dateInput) return '-';
    try {
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleTimeString('ar-EG-u-nu-latn', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Africa/Cairo' });
    } catch {
        return '-';
    }
}

// 3. Build Excel Workbook
const wb = new ExcelJS.Workbook();
wb.creator = 'نظام إدارة العمالة';
wb.lastModifiedBy = 'Bishoy Mamdouh';
wb.created = new Date();
wb.modified = new Date();

const thinBorder = {
    top: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } }
};
const cellAlign = { vertical: 'middle' as const, horizontal: 'center' as const, wrapText: true };

// Sheet 1: Workers
const wsWorkers = wb.addWorksheet('تفاصيل العمالة اليومية', { views: [{ rightToLeft: true }] });
const activeWorkers = rawWorkers.filter(w => !w.isDeleted && recordsMap[w.recordId]);
activeWorkers.sort((a, b) => {
    const rA = recordsMap[a.recordId] || {};
    const rB = recordsMap[b.recordId] || {};
    const supA = (usersMap[rA.supervisorId] || rA.supervisorName || '').toLowerCase();
    const supB = (usersMap[rB.supervisorId] || rB.supervisorName || '').toLowerCase();
    if (supA < supB) return -1;
    if (supA > supB) return 1;
    const dateA = rA.date || '';
    const dateB = rB.date || '';
    if (dateA > dateB) return -1;
    if (dateA < dateB) return 1;
    return (a.name || '').localeCompare(b.name || '', 'ar');
});

wsWorkers.mergeCells('A1:O1');
const wTitle = wsWorkers.getCell('A1');
wTitle.value = 'نظام إدارة ومتابعة العمالة - تقرير تفاصيل العمالة الشامل';
wTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF15803D' } };
wTitle.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
wTitle.alignment = cellAlign;
wsWorkers.getRow(1).height = 34;

wsWorkers.mergeCells('A2:O2');
const wSub = wsWorkers.getCell('A2');
wSub.value = `تاريخ استخراج النسخة: ${dateStr} | إجمالي عمالة السراكي: ${activeWorkers.length} عامل`;
wSub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
wSub.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF166534' } };
wSub.alignment = cellAlign;
wsWorkers.getRow(2).height = 20;
wsWorkers.getRow(3).height = 8;

const workerHeaders = [
    'م', 'التاريخ', 'اليوم', 'اسم العامل', 'نوع الحرفة / المهنة',
    'المشرف', 'المهندس', 'اليومية (ج.م)', 'خصم (ج.م)', 'الصافي (ج.م)',
    'مكان العمل', 'بند العمل (بالتفصيل)', 'المقاول', 'حالة السركي', 'الملاحظات'
];
const wHeaderRow = wsWorkers.addRow(workerHeaders);
wHeaderRow.height = 28;
wHeaderRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.font = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = cellAlign;
    cell.border = thinBorder;
});

wsWorkers.columns = [
    { key: 'index', width: 6 },
    { key: 'date', width: 14 },
    { key: 'day', width: 12 },
    { key: 'name', width: 26 },
    { key: 'type', width: 18 },
    { key: 'supervisor', width: 22 },
    { key: 'engineer', width: 22 },
    { key: 'amount', width: 15 },
    { key: 'deduction', width: 14 },
    { key: 'net', width: 15 },
    { key: 'location', width: 26 },
    { key: 'task', width: 36 },
    { key: 'contractor', width: 18 },
    { key: 'status', width: 16 },
    { key: 'notes', width: 28 }
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
        rec.date || '',
        getArabicDayName(rec.date),
        w.name || '',
        w.type || '',
        usersMap[rec.supervisorId] || rec.supervisorName || 'غير معروف',
        usersMap[rec.engineerId] || rec.engineerName || 'غير معروف',
        amount,
        deduction,
        net,
        w.location || '',
        w.task || '',
        w.contractor || '',
        statusMap[rec.status] || rec.status || '',
        w.notes || ''
    ];
    const row = wsWorkers.addRow(rowData);
    row.height = 22;
    const isEven = idx % 2 === 1;
    row.eachCell((cell, colNum) => {
        cell.alignment = cellAlign;
        cell.border = thinBorder;
        cell.font = { name: 'Segoe UI', size: 10 };
        if (isEven) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        if ([8, 9, 10].includes(colNum)) {
            cell.numFmt = '#,##0';
            if (colNum === 10) cell.font = { name: 'Segoe UI', size: 10, bold: true };
        }
        if (colNum === 14) {
            if (rec.status === 'approved') {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
                cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF15803D' } };
            } else if (rec.status === 'pending') {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
                cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FFB45309' } };
            } else if (rec.status === 'rejected') {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
                cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FFB91C1C' } };
            }
        }
    });
});

const wSummaryRow = wsWorkers.addRow(['الإجمالي العام', '', '', '', '', '', '', sumWAmount, sumWDeduction, sumWNet, '', '', '', '', '']);
wSummaryRow.height = 26;
wsWorkers.mergeCells(`A${wSummaryRow.number}:G${wSummaryRow.number}`);
wSummaryRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
    cell.font = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: 'FF065F46' } };
    cell.alignment = cellAlign;
    cell.border = {
        top: { style: 'thin', color: { argb: 'FF059669' } },
        bottom: { style: 'double', color: { argb: 'FF059669' } },
        left: thinBorder.left,
        right: thinBorder.right
    };
    if (typeof cell.value === 'number') cell.numFmt = '#,##0';
});

// Sheet 2: Records
const wsRecords = wb.addWorksheet('سجلات السراكي المجمعة', { views: [{ rightToLeft: true }] });
const sortedRecords = [...rawRecords].sort((a, b) => {
    const dateA = a.date || '';
    const dateB = b.date || '';
    if (dateA > dateB) return -1;
    if (dateA < dateB) return 1;
    return 0;
});

wsRecords.mergeCells('A1:M1');
const rTitle = wsRecords.getCell('A1');
rTitle.value = 'سجلات السراكي المجمعة المعتمدة والتاريخية';
rTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
rTitle.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
rTitle.alignment = cellAlign;
wsRecords.getRow(1).height = 34;

wsRecords.mergeCells('A2:M2');
const rSub = wsRecords.getCell('A2');
rSub.value = `تاريخ استخراج النسخة: ${dateStr} | إجمالي عدد السراكي: ${sortedRecords.length} سركي`;
rSub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
rSub.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF1E40AF' } };
rSub.alignment = cellAlign;
wsRecords.getRow(2).height = 20;
wsRecords.getRow(3).height = 8;

const recordHeaders = [
    'م', 'تاريخ السركي', 'اليوم', 'المشرف مقدم السركي', 'المهندس المعتمد',
    'عدد العمال', 'إجمالي اليوميات (ج.م)', 'إجمالي الخصومات (ج.م)', 'صافي السركي (ج.م)',
    'حالة الاعتماد', 'وقت الإرسال (توقيت القاهرة)', 'ملاحظات السركي', 'رقم السركي (ID)'
];
const rHeaderRow = wsRecords.addRow(recordHeaders);
rHeaderRow.height = 28;
rHeaderRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.font = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = cellAlign;
    cell.border = thinBorder;
});

wsRecords.columns = [
    { key: 'index', width: 6 },
    { key: 'date', width: 14 },
    { key: 'day', width: 12 },
    { key: 'supervisor', width: 24 },
    { key: 'engineer', width: 24 },
    { key: 'workerCount', width: 13 },
    { key: 'gross', width: 18 },
    { key: 'deduction', width: 16 },
    { key: 'net', width: 18 },
    { key: 'status', width: 16 },
    { key: 'createdAt', width: 22 },
    { key: 'notes', width: 26 },
    { key: 'id', width: 38 }
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
        r.date || '',
        getArabicDayName(r.date),
        usersMap[r.supervisorId] || r.supervisorName || 'غير معروف',
        usersMap[r.engineerId] || r.engineerName || 'غير معروف',
        workerCount,
        gross,
        ded,
        net,
        statusMap[r.status] || r.status || '',
        formatCairoTime(r.createdAt),
        r.rejectReason ? `سبب الرفض: ${r.rejectReason}` : '',
        r.id
    ];
    const row = wsRecords.addRow(rowData);
    row.height = 22;
    const isEven = idx % 2 === 1;
    row.eachCell((cell, colNum) => {
        cell.alignment = cellAlign;
        cell.border = thinBorder;
        cell.font = { name: 'Segoe UI', size: 10 };
        if (isEven) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        if ([7, 8, 9].includes(colNum)) {
            cell.numFmt = '#,##0';
            if (colNum === 9) cell.font = { name: 'Segoe UI', size: 10, bold: true };
        }
        if (colNum === 6) cell.font = { name: 'Segoe UI', size: 10, bold: true };
        if (colNum === 10) {
            if (r.status === 'approved') {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
                cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF15803D' } };
            } else if (r.status === 'pending') {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
                cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FFB45309' } };
            } else if (r.status === 'rejected') {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
                cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FFB91C1C' } };
            }
        }
    });
});

const rSummaryRow = wsRecords.addRow(['الإجمالي العام', '', '', '', '', sumRWorkers, sumRGross, sumRDed, sumRNet, '', '', '', '']);
rSummaryRow.height = 26;
wsRecords.mergeCells(`A${rSummaryRow.number}:E${rSummaryRow.number}`);
rSummaryRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
    cell.font = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: 'FF1E40AF' } };
    cell.alignment = cellAlign;
    cell.border = {
        top: { style: 'thin', color: { argb: 'FF2563EB' } },
        bottom: { style: 'double', color: { argb: 'FF2563EB' } },
        left: thinBorder.left,
        right: thinBorder.right
    };
    if (typeof cell.value === 'number') cell.numFmt = '#,##0';
});

// Sheet 3: Worker Directory
const wsDir = wb.addWorksheet('دليل العمال الأساسي', { views: [{ rightToLeft: true }] });
const sortedDirectory = [...rawDirectory].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));

wsDir.mergeCells('A1:G1');
const dTitle = wsDir.getCell('A1');
dTitle.value = 'دليل العمال المعتمد وقاعدة بيانات الحرفيين المسجلين';
dTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB45309' } };
dTitle.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
dTitle.alignment = cellAlign;
wsDir.getRow(1).height = 34;

wsDir.mergeCells('A2:G2');
const dSub = wsDir.getCell('A2');
dSub.value = `تاريخ استخراج النسخة: ${dateStr} | إجمالي عمال الدليل: ${sortedDirectory.length} عامل`;
dSub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } };
dSub.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF92400E' } };
dSub.alignment = cellAlign;
wsDir.getRow(2).height = 20;
wsDir.getRow(3).height = 8;

const dirHeaders = ['م', 'اسم العامل', 'نوع الحرفة / المهنة', 'رقم الهاتف', 'ملاحظات وتفاصيل', 'تاريخ الإضافة', 'معرف العامل (ID)'];
const dHeaderRow = wsDir.addRow(dirHeaders);
dHeaderRow.height = 28;
dHeaderRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.font = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = cellAlign;
    cell.border = thinBorder;
});

wsDir.columns = [
    { key: 'index', width: 6 },
    { key: 'name', width: 28 },
    { key: 'type', width: 22 },
    { key: 'phone', width: 18 },
    { key: 'notes', width: 30 },
    { key: 'createdAt', width: 18 },
    { key: 'id', width: 38 }
];

sortedDirectory.forEach((d, idx) => {
    const row = wsDir.addRow([idx + 1, d.name || '', d.type || '', d.phone || '-', d.notes || '', d.createdAt ? String(d.createdAt).split('T')[0] : '', d.id || '']);
    row.height = 22;
    const isEven = idx % 2 === 1;
    row.eachCell(cell => {
        cell.alignment = cellAlign;
        cell.border = thinBorder;
        cell.font = { name: 'Segoe UI', size: 10 };
        if (isEven) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    });
});

// Sheet 4: Users
const wsUsers = wb.addWorksheet('حسابات المستخدمين والصلاحيات', { views: [{ rightToLeft: true }] });
const sortedUsers = [...rawUsers].sort((a, b) => (a.username || '').localeCompare(b.username || '', 'ar'));

wsUsers.mergeCells('A1:D1');
const uTitle = wsUsers.getCell('A1');
uTitle.value = 'قائمة حسابات المستخدمين وصلاحياتهم في النظام';
uTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } };
uTitle.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
uTitle.alignment = cellAlign;
wsUsers.getRow(1).height = 34;

wsUsers.mergeCells('A2:D2');
const uSub = wsUsers.getCell('A2');
uSub.value = `تاريخ استخراج النسخة: ${dateStr} | إجمالي المستخدمين: ${sortedUsers.length} مستخدم`;
uSub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };
uSub.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF3730A3' } };
uSub.alignment = cellAlign;
wsUsers.getRow(2).height = 20;
wsUsers.getRow(3).height = 8;

const userHeaders = ['م', 'اسم المستخدم / الاسم الكامل', 'الدور الوظيفي في النظام', 'معرف المستخدم (ID)'];
const uHeaderRow = wsUsers.addRow(userHeaders);
uHeaderRow.height = 28;
uHeaderRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.font = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = cellAlign;
    cell.border = thinBorder;
});

wsUsers.columns = [
    { key: 'index', width: 6 },
    { key: 'username', width: 28 },
    { key: 'role', width: 26 },
    { key: 'id', width: 38 }
];

sortedUsers.forEach((u, idx) => {
    const dispName = (u.username === 'admin' ? 'Bishoy Mamdouh' : u.username) || '';
    const row = wsUsers.addRow([idx + 1, dispName, roleMap[u.role] || u.role || '', u.id || '']);
    row.height = 22;
    const isEven = idx % 2 === 1;
    row.eachCell(cell => {
        cell.alignment = cellAlign;
        cell.border = thinBorder;
        cell.font = { name: 'Segoe UI', size: 10 };
        if (isEven) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    });
});

const excelPath = `${BACKUP_DIR}\\labor_report_${dateStr}.xlsx`;
await wb.xlsx.writeFile(excelPath);
console.log(`Excel Backup saved successfully to: ${excelPath}`);

// Update lastBackup timestamp in KV
const nowIso = new Date().toISOString();
await kv.set(["system", "lastBackup"], nowIso);
console.log(`Updated lastBackup in system to: ${nowIso}`);

kv.close();
console.log("\nALL BACKUPS COMPLETED SUCCESSFULLY! ✅");
