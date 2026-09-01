const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(
    /<form id="filter-form" class="inline-form">[\s\S]*?<\/form>/,
    `<form id="filter-form" class="inline-form" style="width: 100%; display: flex; align-items: flex-end; gap: 15px; justify-content: space-between;">
                        <div class="form-group" style="flex: 1; min-width: 130px; margin-bottom: 0;">
                            <label for="filter-start-date">من تاريخ</label>
                            <input type="date" id="filter-start-date" style="width: 100%;">
                        </div>
                        <div class="form-group" style="flex: 1; min-width: 130px; margin-bottom: 0;">
                            <label for="filter-end-date">إلى تاريخ</label>
                            <input type="date" id="filter-end-date" style="width: 100%;">
                        </div>
                        <div class="form-group" style="flex: 2; min-width: 180px; margin-bottom: 0;">
                            <label for="filter-worker-name">اسم العامل (اختياري)</label>
                            <input type="text" id="filter-worker-name" placeholder="بحث باسم العامل..." style="width: 100%;">
                        </div>
                        <div class="form-group btn-group-align" style="flex: 3; display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 0; min-width: 320px;">
                            <button type="submit" class="btn btn-primary" style="flex: 1; padding: 10px 5px;"><i class="fas fa-filter"></i> تصفية</button>
                            <button type="button" id="clear-filter-btn" class="btn btn-danger" style="flex: 1; padding: 10px 5px;"><i class="fas fa-times"></i> إلغاء</button>
                            <button type="button" id="print-report-btn" class="btn btn-secondary" style="flex: 1; padding: 10px 5px;"><i class="fas fa-print"></i> الجدول</button>
                            <button type="button" onclick="window.printWorkerReceipts()" class="btn" style="flex: 1.5; padding: 10px 5px; background-color: #ffd700 !important; color: #000 !important; font-weight: bold; border: none; white-space: nowrap;"><i class="fas fa-file-invoice-dollar"></i> الإيصالات</button>
                        </div>
                    </form>`
);

fs.writeFileSync("index.html", content);
console.log("Updated layout perfectly");
