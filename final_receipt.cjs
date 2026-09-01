const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

const oldFuncRegex = /window\.printWorkerReceipts = function\(\) \{[\s\S]*?<\/script>/;

const newFunc = `window.printWorkerReceipts = function() {
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
            const grossAmount = parseFloat(row.cells[4].innerText.replace(/,/g, '').trim()) || 0;
            const deduction = parseFloat(row.cells[5].innerText.replace(/,/g, '').trim()) || 0;
            const netAmount = parseFloat(row.cells[6].innerText.replace(/,/g, '').trim()) || 0;
            const location = row.getAttribute('data-location') || '';
            
            if (!workerStats[name]) {
                workerStats[name] = { days: 0, totalNet: 0, records: [] };
            }
            workerStats[name].days += 1;
            workerStats[name].totalNet += netAmount;
            workerStats[name].records.push({
                date: date,
                gross: grossAmount,
                deduction: deduction,
                net: netAmount,
                location: location
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
                    .receipt-page { page-break-after: always; }
                    .receipt-page:last-child { page-break-after: auto; }
                }
                body { font-family: 'Cairo', sans-serif, Arial; margin: 0; padding: 0; background: #fff; color: #000; }
                .receipt-page { 
                    width: 100%; 
                    padding: 15px; 
                    box-sizing: border-box; 
                    display: flex;
                    flex-direction: column;
                    min-height: 95vh;
                }
                .header { text-align: center; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 5px; }
                .header h1 { margin: 0; font-size: 20px; }
                .header p { margin: 3px 0 0; font-size: 14px; }
                
                table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; font-size: 11px; }
                th, td { border: 1px solid #000; padding: 4px; text-align: center; }
                th { background-color: #eee; font-weight: bold; }
                
                .summary { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 10px; font-weight: bold; border: 1px solid #000; padding: 6px; background: #fafafa;}
                
                .signatures { 
                    display: flex; 
                    justify-content: space-between; 
                    margin-top: auto; 
                    padding-top: 10px; 
                }
                .sig-box { 
                    text-align: center; 
                    width: 15%; 
                    font-size: 12px; 
                    font-weight: bold; 
                }
                .sig-line { 
                    border-bottom: 1px solid #000; 
                    margin-top: 30px; 
                }
            </style>
        </head>
        <body>
        \`;
        
        const dateRange = document.getElementById('print-date-range').innerText;
        
        for (const [name, stats] of Object.entries(workerStats)) {
            stats.records.sort((a, b) => a.date.localeCompare(b.date));
            
            let recordsHtml = '<table><thead><tr><th>م</th><th>الاسم</th><th>التاريخ</th><th>المشروع</th><th>مكان العمل</th><th>سعر الساعة</th><th>ساعات العمل</th><th>خصم</th><th>صافية اليومية</th></tr></thead><tbody>';
            stats.records.forEach((r, index) => {
                recordsHtml += '<tr>';
                // Serial
                recordsHtml += \`<td>\${index + 1}</td>\`;
                
                // Name (rowspan)
                if (index === 0) {
                    recordsHtml += \`<td rowspan="\${stats.records.length}" style="vertical-align: middle; font-weight: bold; font-size: 13px;">\${name}</td>\`;
                }
                
                // Date
                recordsHtml += \`<td>\${r.date}</td>\`;
                
                // Project (rowspan)
                if (index === 0) {
                    recordsHtml += \`<td rowspan="\${stats.records.length}" style="vertical-align: middle; font-weight: bold; font-size: 13px;">The Curve</td>\`;
                }
                
                // Location
                recordsHtml += \`<td>\${r.location}</td>\`;
                
                // Hourly Rate (Gross / 8)
                const hourlyRate = (r.gross / 8).toFixed(2);
                recordsHtml += \`<td>\${hourlyRate}</td>\`;
                
                // Working Hours
                recordsHtml += \`<td>8</td>\`;
                
                // Deduction
                recordsHtml += \`<td>\${r.deduction}</td>\`;
                
                // Net Amount
                recordsHtml += \`<td>\${r.net}</td>\`;
                
                recordsHtml += '</tr>';
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
                    <div>إجمالي المبلغ المستحق: \${stats.totalNet.toLocaleString()} جنيه</div>
                </div>
                
                <div class="signatures">
                    <div class="sig-box">
                        <div>العامل</div>
                        <div class="sig-line"></div>
                    </div>
                    <div class="sig-box">
                        <div>مشرف البند</div>
                        <div class="sig-line"></div>
                    </div>
                    <div class="sig-box">
                        <div>مهندس البند</div>
                        <div class="sig-line"></div>
                    </div>
                    <div class="sig-box">
                        <div>محاسب المشروع</div>
                        <div class="sig-line"></div>
                    </div>
                    <div class="sig-box">
                        <div>مدير المشروع</div>
                        <div class="sig-line"></div>
                    </div>
                    <div class="sig-box">
                        <div>المدير المالي</div>
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
</script>`;

content = content.replace(oldFuncRegex, newFunc);
fs.writeFileSync("index.html", content);
console.log("Updated fully as requested");
