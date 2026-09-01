const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

const scriptToAdd = `
<script>
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
            const netAmount = parseFloat(row.cells[6].innerText.replace(/,/g, '').trim()) || 0;
            
            if (!workerStats[name]) {
                workerStats[name] = { days: 0, amount: 0 };
            }
            workerStats[name].days += 1;
            workerStats[name].amount += netAmount;
        });
        
        let printHtml = \`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>إيصالات العمال</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
                body { font-family: 'Cairo', sans-serif, Arial; margin: 0; padding: 0; background: #fff; }
                .receipt-page { 
                    page-break-after: always; 
                    width: 100%; 
                    height: 95vh;
                    padding: 40px; 
                    box-sizing: border-box; 
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }
                .receipt-page:last-child { page-break-after: auto; }
                .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                .header h1 { margin: 0; font-size: 28px; }
                .header p { margin: 5px 0 0; color: #555; }
                .content { font-size: 22px; line-height: 2; margin-bottom: 50px; }
                .content .row { display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding: 15px 0; }
                .content .label { font-weight: bold; }
                .signatures { display: flex; justify-content: space-between; margin-top: auto; padding-top: 50px; }
                .sig-box { text-align: center; width: 30%; }
                .sig-line { border-bottom: 1px solid #000; margin-top: 50px; }
            </style>
        </head>
        <body>
        \`;
        
        const dateRange = document.getElementById('print-date-range').innerText;
        
        for (const [name, stats] of Object.entries(workerStats)) {
            printHtml += \`
            <div class="receipt-page">
                <div class="header">
                    <h1>إيصال استلام نقدية</h1>
                    <p>\${dateRange}</p>
                </div>
                
                <div class="content">
                    <div class="row">
                        <span class="label">اسم العامل:</span>
                        <span>\${name}</span>
                    </div>
                    <div class="row">
                        <span class="label">إجمالي عدد اليوميات:</span>
                        <span>\${stats.days} يوم</span>
                    </div>
                    <div class="row">
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
        
        printHtml += \`
            <script>
                window.onload = function() { window.print(); };
            </script>
        </body>
        </html>
        \`;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printHtml);
        printWindow.document.close();
    };
</script>
</body>`;

content = content.replace("</body>", scriptToAdd);
fs.writeFileSync("index.html", content);
console.log("Injected script successfully");
