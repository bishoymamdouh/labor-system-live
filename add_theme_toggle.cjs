const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

const cssToInject = `
    /* Light Mode Theme */
    body.light-mode {
        --primary-color: #4f46e5;
        --primary-dark: #4338ca;
        --secondary-color: #f1f5f9;
        --text-main: #0f172a;
        --text-muted: #475569;
        --bg-main: #e2e8f0;
        --bg-card: #ffffff;
        --border-color: #cbd5e1;
    }
    body.light-mode .btn-secondary {
        background-color: #e2e8f0;
        color: #0f172a;
    }
    body.light-mode .btn-secondary:hover {
        background-color: #cbd5e1;
    }
    body.light-mode .modal-input, body.light-mode select, body.light-mode input {
        background-color: #ffffff;
        color: #0f172a;
        border: 1px solid #cbd5e1;
    }
    body.light-mode .records-table th {
        background-color: #f8fafc;
    }
    body.light-mode .status-badge {
        font-weight: bold;
    }
    body.light-mode .sidebar {
        background-color: #ffffff;
        border-left: 1px solid #cbd5e1;
    }
    body.light-mode .nav-links li a {
        color: #475569;
    }
    body.light-mode .nav-links li a:hover, body.light-mode .nav-links li a.active {
        background-color: #f1f5f9;
        color: #4f46e5;
    }
    body.light-mode .stat-card {
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        border: 1px solid #cbd5e1;
    }
    body.light-mode .btn-logout {
        background-color: #fee2e2;
        color: #dc2626;
    }
    body.light-mode .btn-logout:hover {
        background-color: #fecaca;
    }
`;

// Insert CSS
if (!content.includes('body.light-mode {')) {
    content = content.replace('</style>', cssToInject + '\n</style>');
}

// Insert FAB HTML
const fabHtml = `
    <!-- Theme Toggle FAB -->
    <button id="theme-toggle-fab" title="تغيير المظهر (ليلي/نهاري)" style="position: fixed; bottom: 20px; left: 20px; border-radius: 50%; width: 50px; height: 50px; z-index: 9999; box-shadow: var(--shadow-md); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; background-color: var(--primary-color); color: white; border: none; cursor: pointer; transition: var(--transition);">
        <i class="fas fa-sun"></i>
    </button>
`;
if (!content.includes('id="theme-toggle-fab"')) {
    content = content.replace('</body>', fabHtml + '\n</body>');
}

// Insert JS
const jsToInject = `
        // --- Theme Toggle Logic ---
        const themeBtn = document.getElementById('theme-toggle-fab');
        const themeIcon = themeBtn.querySelector('i');
        
        // Load preference
        const currentTheme = localStorage.getItem('app-theme') || 'dark';
        if (currentTheme === 'light') {
            document.body.classList.add('light-mode');
            themeIcon.classList.replace('fa-sun', 'fa-moon');
        }
        
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            if (document.body.classList.contains('light-mode')) {
                localStorage.setItem('app-theme', 'light');
                themeIcon.classList.replace('fa-sun', 'fa-moon');
            } else {
                localStorage.setItem('app-theme', 'dark');
                themeIcon.classList.replace('fa-moon', 'fa-sun');
            }
        });
`;
if (!content.includes('// --- Theme Toggle Logic ---')) {
    content = content.replace('// --- Initialization ---', jsToInject + '\n        // --- Initialization ---');
}

fs.writeFileSync("index.html", content);
console.log("Dark/Light mode added successfully.");
