const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(
    `                            <button type="button" id="print-report-btn" class="btn btn-secondary"><i class="fas fa-print"></i> طباعة الجدول</button>
                            <button type="button" onclick="window.printWorkerReceipts()" class="btn btn-primary" style="background-color: var(--accent-color); color: #000;"><i class="fas fa-file-invoice-dollar"></i> طباعة إيصالات العمال</button>
                        </div>`,
    `                        </div>
                        <div class="form-group btn-group-align" style="width: 100%; justify-content: flex-end; margin-top: 10px;">
                            <button type="button" id="print-report-btn" class="btn btn-secondary"><i class="fas fa-print"></i> طباعة الجدول</button>
                            <button type="button" onclick="window.printWorkerReceipts()" class="btn btn-primary" style="background-color: var(--accent-color); color: #000;"><i class="fas fa-file-invoice-dollar"></i> طباعة إيصالات العمال</button>
                        </div>`
);

fs.writeFileSync("index.html", content);
console.log("Moved print buttons to a new row");
