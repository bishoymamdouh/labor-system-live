const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace('<li><a href="#" data-view="view-admin"><i class="fas fa-users-cog"></i> لوحة الإدارة</a></li>', '<li><a href="#" data-view="view-admin"><i class="fas fa-users-cog"></i> لوحة الإدارة</a></li>\n                <li><a href="#" data-view="view-notifications" id="menu-notifications-link"><i class="fas fa-bell"></i> إدارة الإشعارات</a></li>');

fs.writeFileSync("index.html", content);
console.log("Injected nav link correctly this time");
