
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
            const grossAmount = parseFloat(row.cells[4].innerText.replace(/,/g, '').trim()) || 0;
            const deduction = parseFloat(row.cells[5].innerText.replace(/,/g, '').trim()) || 0;
            const netAmount = parseFloat(row.cells[6].innerText.replace(/,/g, '').trim()) || 0;
            const location = row.cells[8] ? row.cells[8].innerText.trim() : '';
            const notes = row.cells[9] ? row.cells[9].innerText.trim() : '';
            
            if (!workerStats[name]) {
                workerStats[name] = { days: 0, totalNet: 0, records: [] };
            }
            workerStats[name].days += 1;
            workerStats[name].totalNet += netAmount;
            workerStats[name].records.push({
                type: type,
                date: date,
                gross: grossAmount,
                deduction: deduction,
                net: netAmount,
                location: location,
                notes: notes
            });
        });
        
        let printHtml = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>سركي العامل</title>
            <base href="\${window.location.origin}">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
                @media print {
                    @page { margin: 0.5cm; size: landscape; }
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
                .header { position: relative; text-align: center; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 15px; }
                .header h1 { margin: 8px 0; font-size: 24px; font-weight: bold; }
                .header h2 { margin: 0; font-size: 16px; font-weight: bold; }
                .project-title-box {
                    background-color: #eef5fb;
                    color: #003366;
                    padding: 8px 20px;
                    border-radius: 6px;
                    display: inline-block;
                    font-size: 16px;
                    font-weight: bold;
                    margin: 0;
                    border: 1px solid #b8d4f0;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .header p { margin: 0; font-size: 14px; }
                .logo-img { position: absolute; right: 0; top: 0; max-height: 60px; }
                
                table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; font-size: 11px; }
                th, td { border: 1px solid #000; padding: 6px; text-align: center; vertical-align: middle; word-wrap: break-word; }
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
        `;
        
        const dateRange = document.getElementById('print-date-range').innerText;
        
        for (const [name, stats] of Object.entries(workerStats)) {
            stats.records.sort((a, b) => a.date.localeCompare(b.date));
            
            let recordsHtml = '<table><thead><tr><th>م</th><th>الاسم</th><th>النوع</th><th>التاريخ</th><th>المشروع</th><th>مكان العمل</th><th>الملاحظات</th><th>سعر الساعة</th><th>ساعات العمل</th><th>خصم</th><th>صافية اليومية</th></tr></thead><tbody>';
            stats.records.forEach((r, index) => {
                recordsHtml += '<tr>';
                // Serial
                recordsHtml += `<td>${index + 1}</td>`;
                
                // Name (rowspan)
                if (index === 0) {
                    recordsHtml += `<td rowspan="${stats.records.length}" style="vertical-align: middle; font-weight: bold; font-size: 13px;">${name}</td>`;
                }
                
                // Type (rowspan)
                if (index === 0) {
                    recordsHtml += `<td rowspan="${stats.records.length}" style="vertical-align: middle; font-size: 12px;">${r.type}</td>`;
                }
                
                // Date
                recordsHtml += `<td>${r.date}</td>`;
                
                // Project (rowspan)
                if (index === 0) {
                    recordsHtml += `<td rowspan="${stats.records.length}" style="vertical-align: middle; font-weight: bold; font-size: 13px;">The Curve</td>`;
                }
                
                // Location
                recordsHtml += `<td>${r.location}</td>`;
                
                // Notes
                recordsHtml += `<td>${r.notes}</td>`;
                
                // Hourly Rate (Gross / 8)
                const hourlyRate = (r.gross / 8).toFixed(2);
                recordsHtml += `<td>${hourlyRate}</td>`;
                
                // Working Hours
                recordsHtml += `<td>8</td>`;
                
                // Deduction
                recordsHtml += `<td>${r.deduction}</td>`;
                
                // Net Amount
                recordsHtml += `<td>${r.net}</td>`;
                
                recordsHtml += '</tr>';
            });
            recordsHtml += '</tbody></table>';
            
            printHtml += `
            <div class="receipt-page">
                <div class="header">
                    <img src="/logo.png?v=2" class="logo-img" alt="Logo">
                    <div class="project-title-box">Cornerstone Development - Project: The Curve</div>
                    <h1>سركي العامل</h1>
                    <p>${dateRange}</p>
                </div>
                
                ${recordsHtml}
                
                <div class="summary">
                    <div>إجمالي عدد اليوميات: ${stats.days} يوم</div>
                    <div>إجمالي المبلغ المستحق: ${stats.totalNet.toLocaleString()} جنيه</div>
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
            `;
        }
        
        printHtml += '</body></html>';
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        iframe.style.visibility = 'hidden';
        iframe.srcdoc = printHtml;
        document.body.appendChild(iframe);
        
        iframe.onload = function() {
            setTimeout(() => {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 5000); // Cleanup after a delay
            }, 500); // Wait for images to render
        };
    };
