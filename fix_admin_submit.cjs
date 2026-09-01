const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Fix submitRecord logic for auto-approval
html = html.replace(
    /status: \(role === 'engineer' \|\| role === 'admin'\) \? 'approved' : 'pending'/,
    "status: (role === 'admin') ? 'approved' : 'pending'"
);

html = html.replace(
    /if \(role === 'engineer' \|\| role === 'admin'\) \{[\s\S]*?alert\('?? ????? ?????? ??????'\);/,
    `if (role === 'admin') {
                alert('تم تسجيل واعتماد السركي بنجاح!');`
);

fs.writeFileSync('index.html', html);
console.log("Updated submitRecord auto-approve for admin only");
