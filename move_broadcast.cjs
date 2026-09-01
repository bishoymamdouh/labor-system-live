const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

// 1. Extract the old broadcast block
const oldBroadcastStart = content.indexOf('<h3 class="mt-20 mb-10"><i class="fas fa-bell"></i> إرسال إشعار للمستخدمين</h3>');
let oldBroadcastEnd = content.indexOf('<details class="card mt-20" style="padding: 10px; cursor: pointer;">');

if (oldBroadcastStart !== -1 && oldBroadcastEnd !== -1) {
    const oldBroadcastHtml = content.substring(oldBroadcastStart, oldBroadcastEnd);
    
    // Remove it from Admin View
    content = content.substring(0, oldBroadcastStart) + content.substring(oldBroadcastEnd);
    
    // 2. Find the Manual Broadcast block in view-notifications and replace it
    const newBroadcastStart = content.indexOf('<!-- Manual Broadcast -->');
    const newBroadcastEnd = content.indexOf('<!-- Scheduled Notifications -->');
    
    if (newBroadcastStart !== -1 && newBroadcastEnd !== -1) {
        content = content.substring(0, newBroadcastStart) + 
                  '<!-- Manual Broadcast -->\n                ' + 
                  oldBroadcastHtml.trim() + '\n\n                ' + 
                  content.substring(newBroadcastEnd);
    }
    
    fs.writeFileSync("index.html", content);
    console.log("Moved broadcast form successfully!");
} else {
    console.log("Could not find old broadcast form to move.");
}
