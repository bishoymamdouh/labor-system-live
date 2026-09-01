const fs = require("fs");
let content = fs.readFileSync("sw.js", "utf8");

const oldLogic = `self.addEventListener('notificationclick', e => {
    e.notification.close();
    e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus();
            }
            return clients.openWindow(e.notification.data || '/');
        })
    );
});`;

const newLogic = `self.addEventListener('notificationclick', e => {
    e.notification.close();
    const targetUrl = e.notification.data || '/';
    e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            if (clientList.length > 0) {
                let client = clientList[0];
                return client.navigate(targetUrl).then(c => c ? c.focus() : client.focus());
            }
            return clients.openWindow(targetUrl);
        })
    );
});`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync("sw.js", content);
console.log("Fixed sw.js notification click");
