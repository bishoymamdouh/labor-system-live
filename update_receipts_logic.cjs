const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(
    '<button type="button" onclick="window.printWorkerReceipts()" class="btn" style="flex: 1.5; padding: 10px 5px; background-color: #ffd700 !important; color: #000 !important; font-weight: bold; border: none; white-space: nowrap;"><i class="fas fa-file-invoice-dollar"></i> الإيصالات</button>',
    '<button type="button" onclick="window.printWorkerReceipts()" class="btn" style="flex: 1.5; padding: 10px 5px; background-color: #ffd700 !important; color: #000 !important; font-weight: bold; border: none; white-space: nowrap;"><i class="fas fa-file-invoice-dollar"></i> سركي العامل</button>'
);

content = content.replace(
    /<script>\s*window\.printWorkerReceipts = function\(\) \{[\s\S]*?<\/script>/,
    `<script>
    window.printWorkerReceipts = function() {
        const rows = Array.from(document.querySelectorAll('#report-results-list tr'));
        const visibleRows = rows.filter(r => r.style.display !== 'none');
        
        if (visibleRows.length === 0 || visibleRows[0].cells.length === 1) {
            alert('لا توجد بيانات للطباعة');
            return;
        }
        
        const workerStats = {};
        
        visibleRows.forEach(row => {
            const name = row.cells[0].innerText.trim();
            const date = row.cells[3].innerText.trim();
            const netAmount = parseFloat(row.cells[6].innerText.replace(/,/g, '').trim()) || 0;
            
            if (!workerStats[name]) {
                workerStats[name] = { days: 0, amount: 0, records: [] };
            }
            workerStats[name].days += 1;
            workerStats[name].amount += netAmount;
            workerStats[name].records.push({ date: date, amount: netAmount });
        });
        
        let printHtml = \`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>سركي العامل</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
                body { font-family: 'Cairo', sans-serif, Arial; margin: 0; padding: 0; background: #fff; }
                .receipt-page { 
                    page-break-after: always; 
                    width: 100%; 
                    min-height: 95vh;
                    padding: 40px; 
                    box-sizing: border-box; 
                    display: flex;
                    flex-direction: column;
                }
                .receipt-page:last-child { page-break-after: auto; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                .header h1 { margin: 0; font-size: 28px; }
                .header p { margin: 5px 0 0; color: #555; }
                .content { font-size: 20px; line-height: 1.8; margin-bottom: 30px; flex-grow: 1; }
                .content .row { display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding: 10px 0; }
                .content .label { font-weight: bold; }
                
                table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px; }
                th, td { border: 1px solid #333; padding: 8px; text-align: center; }
                th { background-color: #f2f2f2; font-weight: bold; }
                
                .signatures { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 30px; }
                .sig-box { text-align: center; width: 30%; }
                .sig-line { border-bottom: 1px solid #000; margin-top: 50px; }
            </style>
        </head>
        <body>
        \`;
        
        const dateRange = document.getElementById('print-date-range').innerText;
        
        for (const [name, stats] of Object.entries(workerStats)) {
            // Sort records by date for better presentation
            stats.records.sort((a, b) => a.date.localeCompare(b.date));
            
            let recordsHtml = '<table><thead><tr><th>التاريخ</th><th>المبلغ المستحق (جنيه)</th></tr></thead><tbody>';
            stats.records.forEach(r => {
                recordsHtml += \`<tr><td>\${r.date}</td><td>\${r.amount.toLocaleString()}</td></tr>\`;
            });
            recordsHtml += '</tbody></table>';
            
            printHtml += \`
            <div class="receipt-page">
                <div class="header">
                    <h1>سركي العامل</h1>
                    <p>\${dateRange}</p>
                </div>
                
                <div class="content">
                    <div class="row">
                        <span class="label">اسم العامل:</span>
                        <span>\${name}</span>
                    </div>
                    
                    \${recordsHtml}
                    
                    <div class="row" style="background-color: #f9f9f9; padding: 15px;">
                        <span class="label">إجمالي عدد اليوميات:</span>
                        <span><strong>\${stats.days} يوم</strong></span>
                    </div>
                    <div class="row" style="background-color: #f0f0f0; padding: 15px; border-bottom: 2px solid #333;">
                        <span class="label">إجمالي المبلغ المستحق:</span>
                        <span><strong>\${stats.amount.toLocaleString()} جنيه</strong></span>
                    </div>
                </div>
                
                <div class="signatures">
                    <div class="sig-box">
                        <div>توقيع العامل</div>
                        <div class="sig-line"></div>
                    </div>
                    <div class="sig-box">
                        <div>توقيع المحاسب</div>
                        <div class="sig-line"></div>
                    </div>
                    <div class="sig-box">
                        <div>توقيع مدير المشروع</div>
                        <div class="sig-line"></div>
                    </div>
                </div>
            </div>
            \`;
        }
        
        printHtml += '<scr' + 'ipt>window.onload = function() { window.print(); };</scr' + 'ipt></body></html>';
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printHtml);
        printWindow.document.close();
    };
</script>`
);

fs.writeFileSync("index.html", content);
console.log("Updated printWorkerReceipts logic");
