const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

const roleJs = `
        // Role filters for broadcast dropdown
        document.body.addEventListener('change', (e) => {
            if (e.target.classList.contains('role-filter-cb')) {
                const role = e.target.value;
                const isChecked = e.target.checked;
                
                // Uncheck 'all' if we are touching specific roles
                document.getElementById('broadcast-target-all').checked = false;
                
                const userCbs = document.querySelectorAll('.broadcast-user-checkbox');
                userCbs.forEach(cb => {
                    const row = cb.closest('label');
                    if (row && row.querySelector('.badge').getAttribute('data-role') === role) {
                        cb.checked = isChecked;
                    }
                });
                
                // Trigger title update
                if(typeof updateMultiselectTitle === "function") updateMultiselectTitle();
            }
        });
`;

if (!content.includes('Role filters for broadcast dropdown')) {
    content = content.replace('// --- Notification Management Logic ---', roleJs + '\n        // --- Notification Management Logic ---');
    fs.writeFileSync("index.html", content);
    console.log("Injected Role JS");
}
