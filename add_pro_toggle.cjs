const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

// 1. Remove the old FAB
const fabRegex = /<!-- Theme Toggle FAB -->[\s\S]*?<\/button>/;
content = content.replace(fabRegex, "");

// 2. Add the Switch HTML to the sidebar footer (before logout button)
const switchHtml = `
                <div class="theme-toggle-container" style="display: flex; align-items: center; justify-content: center; margin-bottom: 15px; gap: 10px;">
                    <i class="fas fa-moon" style="color: #6366f1; font-size: 1.1rem;" title="الوضع الليلي"></i>
                    <label class="theme-switch" style="position: relative; display: inline-block; width: 46px; height: 24px;" title="تغيير المظهر">
                        <input type="checkbox" id="theme-checkbox" style="opacity: 0; width: 0; height: 0;">
                        <span class="theme-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--border-color); transition: .4s; border-radius: 24px;">
                            <span class="theme-slider-circle" style="position: absolute; content: ''; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%;"></span>
                        </span>
                    </label>
                    <i class="fas fa-sun" style="color: #f59e0b; font-size: 1.1rem;" title="الوضع النهاري"></i>
                </div>
                <button id="logout-btn"`;

content = content.replace('<button id="logout-btn"', switchHtml);

// 3. Add JS for the switch
const jsLogic = `
        // --- Theme Toggle Logic ---
        const themeCheckbox = document.getElementById('theme-checkbox');
        const themeSliderCircle = document.querySelector('.theme-slider-circle');
        const themeSlider = document.querySelector('.theme-slider');
        
        const currentTheme = localStorage.getItem('app-theme') || 'dark';
        if (currentTheme === 'light') {
            document.body.classList.add('light-mode');
            if (themeCheckbox) themeCheckbox.checked = true;
            if (themeSliderCircle) themeSliderCircle.style.transform = 'translateX(22px)';
            if (themeSlider) themeSlider.style.backgroundColor = '#4f46e5';
        }
        
        if (themeCheckbox) {
            themeCheckbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    document.body.classList.add('light-mode');
                    localStorage.setItem('app-theme', 'light');
                    themeSliderCircle.style.transform = 'translateX(22px)';
                    themeSlider.style.backgroundColor = '#4f46e5';
                } else {
                    document.body.classList.remove('light-mode');
                    localStorage.setItem('app-theme', 'dark');
                    themeSliderCircle.style.transform = 'translateX(0)';
                    themeSlider.style.backgroundColor = 'var(--border-color)';
                }
            });
        }
`;

if (!content.includes('const themeCheckbox = document.getElementById(')) {
    content = content.replace('// --- Initialization ---', jsLogic + '\n        // --- Initialization ---');
}

fs.writeFileSync("index.html", content);
console.log("Professional toggle added");
