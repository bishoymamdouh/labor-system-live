
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js?v=' + Date.now()).then(reg => {
                console.log('ServiceWorker registered cleanly.');
            });
        }
    