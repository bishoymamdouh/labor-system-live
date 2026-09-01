const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

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
            const type = row.cells[1].innerText.trim();
            const date = row.cells[3].innerText.trim();
            const netAmountStr = row.cells[6].innerText.replace(/,/g, '').trim();
            const netAmount = parseFloat(netAmountStr) || 0;
            const engineer = row.cells[7].innerText.trim();
            const notes = row.cells[8].innerText.trim();
            
            if (!workerStats[name]) {
                workerStats[name] = { days: 0, amount: 0, records: [] };
            }
            workerStats[name].days += 1;
            workerStats[name].amount += netAmount;
            workerStats[name].records.push({ 
                name: name,
                type: type,
                date: date, 
                amount: netAmountStr,
                engineer: engineer,
                notes: notes
            });
        });
        
        let printHtml = \`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>سركي العامل</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
                @media print {
                    @page { margin: 0.5cm; }
                }
                body { font-family: 'Cairo', sans-serif, Arial; margin: 0; padding: 0; background: #fff; }
                .receipt-page { 
                    page-break-after: always; 
                    width: 100%; 
                    padding: 15px; 
                    box-sizing: border-box; 
                    display: flex;
                    flex-direction: column;
                }
                .receipt-page:last-child { page-break-after: auto; }
                .header { text-align: center; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 5px; }
                .header h1 { margin: 0; font-size: 20px; }
                .header p { margin: 3px 0 0; color: #333; font-size: 14px; }
                
                table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; font-size: 12px; }
                th, td { border: 1px solid #000; padding: 4px; text-align: center; }
                th { background-color: #eee; font-weight: bold; }
                
                .summary { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 10px; font-weight: bold; border: 1px solid #000; padding: 8px; background: #fafafa;}
                
                .signatures { display: flex; justify-content: space-between; margin-top: auto; padding-top: 20px; }
                .sig-box { text-align: center; width: 30%; font-size: 14px; font-weight: bold; }
                .sig-line { border-bottom: 1px solid #000; margin-top: 30px; }
            </style>
        </head>
        <body>
        \`;
        
        const dateRange = document.getElementById('print-date-range').innerText;
        
        for (const [name, stats] of Object.entries(workerStats)) {
            stats.records.sort((a, b) => a.date.localeCompare(b.date));
            
            let recordsHtml = '<table><thead><tr><th>اسم العامل</th><th>النوع</th><th>التاريخ</th><th>الصافي (جنيه)</th><th>المهندس المعتمد</th><th>الملاحظات</th></tr></thead><tbody>';
            stats.records.forEach(r => {
                recordsHtml += \`<tr>
                    <td>\${r.name}</td>
                    <td>\${r.type}</td>
                    <td>\${r.date}</td>
                    <td>\${r.amount}</td>
                    <td>\${r.engineer}</td>
                    <td>\${r.notes}</td>
                </tr>\`;
            });
            recordsHtml += '</tbody></table>';
            
            printHtml += \`
            <div class="receipt-page">
                <div class="header">
                    <h1>سركي العامل</h1>
                    <p>\${dateRange}</p>
                </div>
                
                \${recordsHtml}
                
                <div class="summary">
                    <div>إجمالي عدد اليوميات: \${stats.days} يوم</div>
                    <div>إجمالي المبلغ المستحق: \${stats.amount.toLocaleString()} جنيه</div>
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
console.log("Updated print format to fit one page and added requested columns");
