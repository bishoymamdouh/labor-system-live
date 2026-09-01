const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(
    /<div class="card mb-30" style="margin-bottom: 30px;">/,
    '<div id="record-card-${r.id}" class="card mb-30 record-scroll-target" style="margin-bottom: 30px;">'
);

const initInject = `
        auth.init();
        
        // Deep linking scroll
        setTimeout(() => {
            const urlParams = new URLSearchParams(window.location.search);
            const viewRecordId = urlParams.get('view_record');
            if (viewRecordId) {
                const target = document.getElementById('record-card-' + viewRecordId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    target.style.boxShadow = "0 0 15px var(--primary-color)";
                    target.style.border = "2px solid var(--primary-color)";
                    
                    window.history.replaceState({}, document.title, "/");
                }
            }
        }, 1500); 
`;

content = content.replace(
    /auth\.init\(\);/s,
    initInject
);

fs.writeFileSync("index.html", content);
console.log("Added record card ID and deep link scroll logic");
