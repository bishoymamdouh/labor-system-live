const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the library to the <head>
const excelJsTag = '<script src="https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js"></script>';
const ptrJsTag = '<script src="https://cdnjs.cloudflare.com/ajax/libs/pulltorefreshjs/0.2.9/index.umd.min.js"></script>';

if (html.includes(excelJsTag) && !html.includes('pulltorefreshjs')) {
    html = html.replace(excelJsTag, excelJsTag + '\n    ' + ptrJsTag);
}

// 2. Fix the PullToRefresh initialization block to have correct Arabic strings
const ptrInitRegex = /if \(window\.PullToRefresh\) \{[\s\S]*?\}\)/;
if (html.match(ptrInitRegex)) {
    const newPtrInit = `if (window.PullToRefresh) {
        PullToRefresh.init({
            mainElement: 'body',
            instructionsPullToRefresh: 'اسحب للأسفل للتحديث',
            instructionsReleaseToRefresh: 'أفلت للتحديث',
            instructionsRefreshing: 'جاري التحديث...',
            onRefresh() {
                window.location.reload();
            }
        });
    }`;
    html = html.replace(ptrInitRegex, newPtrInit);
}

fs.writeFileSync('index.html', html);
console.log("Added PullToRefresh.js library and fixed Arabic strings");
