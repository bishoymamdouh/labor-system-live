const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");
content = content.replace(
    '</head>',
    `<script>
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) {
                    registration.unregister();
                    console.log('ServiceWorker unregistered');
                }
            });
        }
    </script>
</head>`
);
fs.writeFileSync("index.html", content);
console.log("Added SW unregister script to index.html");
