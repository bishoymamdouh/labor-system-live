const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

const oldCode = `        printHtml += '<scr' + 'ipt>window.onload = function() { window.print(); };</scr' + 'ipt></body></html>';
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printHtml);
        printWindow.document.close();`;

const newCode = `        printHtml += '</body></html>';
        
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
        };`;

content = content.replace(oldCode, newCode);

fs.writeFileSync("index.html", content);
console.log("Updated printWorkerReceipts to use iframe");
