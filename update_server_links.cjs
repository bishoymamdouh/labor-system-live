const fs = require("fs");
let content = fs.readFileSync("server.ts", "utf8");

content = content.replace(
    /JSON\.stringify\(\{ title: "طلب اعتماد جديد", body: "يوجد سركي جديد بانتظار الاعتماد", url: "\/", badgeCount: pendingCount \}\)/,
    'JSON.stringify({ title: "طلب اعتماد جديد", body: "يوجد سركي جديد بانتظار الاعتماد", url: "/?view_record=" + id, badgeCount: pendingCount })'
);

content = content.replace(
    /JSON\.stringify\(\{ title: titleText, body: bodyText, url: "\/" \}\)/,
    'JSON.stringify({ title: titleText, body: bodyText, url: "/?view_record=" + id })'
);

fs.writeFileSync("server.ts", content);
console.log("Updated server.ts notifications with deep links");
