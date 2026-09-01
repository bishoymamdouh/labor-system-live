const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

// 1. Give the summary item an ID
content = content.replace(
    '<div class="summary-item">\n                                <span>إجمالي السركي:</span>',
    '<div class="summary-item" id="summary-total-amount">\n                                <span>إجمالي السركي:</span>'
);

// 2. Inject CSS logic in setupWorkspace()
const setupWorkspacePattern = /async setupWorkspace\(\) \{/;
const setupWorkspaceCode = `async setupWorkspace() {
        const role = auth.getRole();
        if (role === 'supervisor') {
            if (!document.getElementById('supervisor-hide-wage')) {
                document.head.insertAdjacentHTML('beforeend', '<style id="supervisor-hide-wage">#workers-table th:nth-child(3), #workers-table td:nth-child(3), #summary-total-amount { display: none !important; }</style>');
            }
        } else {
            const styleNode = document.getElementById('supervisor-hide-wage');
            if (styleNode) styleNode.remove();
        }
`;
content = content.replace(setupWorkspacePattern, setupWorkspaceCode);

fs.writeFileSync("index.html", content);
console.log("Success");
