const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

const oldLogout = `    logout() {
        this.currentUser = null;
        localStorage.removeItem('labor_app_user');
        window.location.reload();
    }`;

const newLogout = `    async logout() {
        if (this.currentUser && 'serviceWorker' in navigator && 'PushManager' in window) {
            try {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    await fetch('/api/unsubscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: this.currentUser.id, endpoint: subscription.endpoint })
                    });
                    // Also unsubscribe locally
                    await subscription.unsubscribe();
                }
            } catch (e) {
                console.error('Unsubscribe error:', e);
            }
        }
        this.currentUser = null;
        localStorage.removeItem('labor_app_user');
        window.location.reload();
    }`;

content = content.replace(oldLogout, newLogout);
fs.writeFileSync("index.html", content);
console.log("Updated logout function to unsubscribe from push notifications");
