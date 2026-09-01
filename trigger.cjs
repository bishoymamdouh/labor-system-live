const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

const modalJs = `
        // --- Modal Scheduled Logic ---
        document.body.addEventListener('click', (e) => {
            if (e.target.closest('#btn-add-scheduled')) {
                const m = document.getElementById('modal-scheduled');
                if (m) m.style.display = 'flex';
            }
        });
`;

if (!content.includes('Modal Scheduled Logic')) {
    content = content.replace('// --- Notification System ---', modalJs + '\n    // --- Notification System ---');
    fs.writeFileSync("index.html", content);
    console.log("Added modal trigger");
}
