const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const refreshBtn = `<button id="floating-refresh" onclick="location.reload()" style="position: fixed; top: 10px; left: 10px; background: var(--primary-color); border: none; color: white; border-radius: 50%; width: 32px; height: 32px; font-size: 0.8rem; cursor: pointer; z-index: 1000; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><i class="fas fa-sync-alt"></i></button>`;

if (!html.includes('id="floating-refresh"')) {
    html = html.replace('</body>', refreshBtn + '\n</body>');
    fs.writeFileSync('index.html', html, 'utf8');
    console.log("Floating refresh button added!");
} else {
    console.log("Refresh button already exists.");
}
