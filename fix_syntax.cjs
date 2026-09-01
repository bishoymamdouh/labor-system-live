const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

// 1. Remove the invalid block from inside the class
const invalidBlock = `
        // --- Modal Scheduled Logic ---
        document.body.addEventListener('click', (e) => {
            if (e.target.closest('#btn-add-scheduled')) {
                const m = document.getElementById('modal-scheduled');
                if (m) m.style.display = 'flex';
            }
        });
`;
content = content.replace(invalidBlock, "");

// 2. Add it to the end of the script, OUTSIDE the class
const validBlock = `
// --- Modal Scheduled Logic ---
document.body.addEventListener('click', (e) => {
    if (e.target.closest('#btn-add-scheduled')) {
        const m = document.getElementById('modal-scheduled');
        if (m) m.style.display = 'flex';
    }
});
`;

content = content.replace('// Initialize App', validBlock + '\n// Initialize App');

fs.writeFileSync("index.html", content);
console.log("Fixed SyntaxError!");
