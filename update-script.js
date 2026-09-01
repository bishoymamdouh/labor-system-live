const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

// 1. Add "تسجيل سركي" tab for Engineer
content = content.replace(
    /\} else if \(role === 'engineer'\) \{\s*navLinks\.innerHTML \+= `\s*<li><a href="#" data-view="view-engineer"><i class="fas fa-check-double"><\/i> اعتماد السراكي<\/a><\/li>\s*<li><a href="#" data-view="view-reports"><i class="fas fa-chart-bar"><\/i> التقارير المجمعة<\/a><\/li>\s*`;\s*\}/,
    `} else if (role === 'engineer') {
            navLinks.innerHTML += \`
                <li><a href="#" data-view="view-engineer"><i class="fas fa-check-double"></i> اعتماد السراكي</a></li>
                <li><a href="#" data-view="view-supervisor"><i class="fas fa-file-signature"></i> تسجيل سركي</a></li>
                <li><a href="#" data-view="view-reports"><i class="fas fa-chart-bar"></i> التقارير المجمعة</a></li>
            \`;
        }`
);

// 2. Add supervisor initialization to Engineer in initData
content = content.replace(
    /\} else if \(role === 'engineer'\) \{\s*this\.loadEngineerData\(\);\s*this\.generateReport\(\);\s*\}/,
    `} else if (role === 'engineer') {
            this.loadEngineerData();
            this.generateReport();
            
            await UI.renderEngineerOptions();
            let dirWorkers = await db.getAll('worker_directory');
            dirWorkers.sort((a, b) => customSort(a, b, false));
            this.directoryWorkers = dirWorkers;
            this.loadSupervisorData();
            this.currentWorkers = [];
            document.getElementById('workers-list').innerHTML = '';
            this.addWorkerRow();
            this.updateTotals();
        }`
);

// Remove the dead code `else if (role === 'engineer') { this.loadEngineerData(); }`
content = content.replace(/\} else if \(role === 'engineer'\) \{\s*this\.loadEngineerData\(\);\s*\}/, '');

fs.writeFileSync('index.html', content, 'utf8');
console.log('Modifications applied');
