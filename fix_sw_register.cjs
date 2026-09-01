const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

const oldCode = `        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) {
                    registration.unregister();
                    console.log('ServiceWorker unregistered');
                }
            });
        }`;

const newCode = `        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js?v=' + Date.now()).then(reg => {
                console.log('ServiceWorker registered cleanly.');
            });
        }`;

content = content.replace(oldCode, newCode);
fs.writeFileSync("index.html", content);
