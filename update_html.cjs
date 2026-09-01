const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

// 1. Fix placeholder
content = content.replace('placeholder="تذكير باضافة العمالة"', 'placeholder="مثال: تذكير باضافة العمالة"');

// 2. Fix time selects order: ampm, min, hour.
// Wait, currently they are: min, hour, ampm (because of RTL, min on right, hour left, ampm left).
// If they are:
// <select id="sched-min">...</select>
// <span>:</span>
// <select id="sched-hour">...</select>
// <select id="sched-ampm">...</select>
// The user wants AM/PM on the far right, which means it should come FIRST in the HTML since it's RTL (flex row default is right-to-left for Arabic).
// Let's replace the whole time row:
const oldTimeRowRegex = /<div style="display: flex; gap: 10px; align-items: center;">[\s\S]*?<select id="sched-ampm"[\s\S]*?<\/select>\s*<\/div>/;
const newTimeRow = `<div style="display: flex; gap: 10px; align-items: center;">
                        <select id="sched-ampm" style="padding: 10px; border: 1px solid var(--border-color); border-radius: 5px; background: var(--bg-body); color: var(--text-main); flex: 1;">
                            <option value="AM">صباحاً (AM)</option><option value="PM">مساءً (PM)</option>
                        </select>
                        <select id="sched-min" style="padding: 10px; border: 1px solid var(--border-color); border-radius: 5px; background: var(--bg-body); color: var(--text-main); flex: 1;">
                            <option value="00">00</option><option value="15">15</option><option value="30">30</option><option value="45">45</option>
                        </select>
                        <span style="font-weight: bold;">:</span>
                        <select id="sched-hour" style="padding: 10px; border: 1px solid var(--border-color); border-radius: 5px; background: var(--bg-body); color: var(--text-main); flex: 1;">
                            <option value="01">01</option><option value="02">02</option><option value="03">03</option><option value="04">04</option><option value="05">05</option><option value="06">06</option><option value="07">07</option><option value="08">08</option><option value="09">09</option><option value="10" selected>10</option><option value="11">11</option><option value="12">12</option>
                        </select>
                    </div>`;

content = content.replace(oldTimeRowRegex, newTimeRow);

// 3. Make sched-users-container taller
content = content.replace('max-height: 150px;', 'max-height: 250px;');

fs.writeFileSync("index.html", content);
console.log("index.html updated successfully!");
