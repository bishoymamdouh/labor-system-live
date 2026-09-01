const fs = require("fs");
let content = fs.readFileSync("sw.js", "utf8");

const oldLogic = `self.addEventListener('notificationclick', e => {
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

const newLogic = `self.addEventListener('notificationclick', e => {
    e.notification.close();
    const targetUrl = e.notification.data || '/';
    const recordIdMatch = targetUrl.match(/view_record=([^&]+)/);
    const viewRecordId = recordIdMatch ? recordIdMatch[1] : null;

    e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            if (clientList.length > 0) {
                let client = clientList[0];
                if (viewRecordId) {
                    client.postMessage({ type: 'JUMP_TO_RECORD', id: viewRecordId });
                    return client.focus();
                } else {
                    return client.navigate(targetUrl).then(c => c ? c.focus() : client.focus());
                }
            }
            return clients.openWindow(targetUrl);
        })
    );
});`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync("sw.js", content);
console.log("Updated sw.js with postMessage");
