const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const target1 = `if (isEditable) {
            let engineerOptions = '<option value="">-- اختر مهندس (اختياري) --</option>';`;

const replace1 = `if (isAdmin || (role === 'engineer' && r.status === 'pending')) {
            let engineerOptions = '<option value="">-- اختر مهندس (اختياري) --</option>';`;

if (html.includes(target1)) {
    html = html.replace(target1, replace1);
    fs.writeFileSync('index.html', html, 'utf8');
    console.log("Supervisor forward UI hidden successfully!");
} else {
    console.log("Could not find the target string. Let's try with regex.");
    const regex = /if \(isEditable\) \{\s*let engineerOptions = '<option value="">-- اختر مهندس/;
    if (html.match(regex)) {
        html = html.replace(regex, `if (isAdmin || (role === 'engineer' && r.status === 'pending')) {\n            let engineerOptions = '<option value="">-- اختر مهندس`);
        fs.writeFileSync('index.html', html, 'utf8');
        console.log("Supervisor forward UI hidden successfully with regex!");
    } else {
        console.log("Not found with regex either.");
    }
}
