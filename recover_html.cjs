const fs = require("fs");
let lines = fs.readFileSync("index.html", "utf8").split('\n');

const replacement = `                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="file" id="backup-file-input" accept=".json" style="flex: 1;" class="input-field">
                            <button class="btn btn-warning" onclick="app.restoreBackup()">استعادة</button>
                        </div>
                    </div>
                </details>
            </div>
        </section>

        <!-- Reports View -->
        

        
        <!-- Add/Edit Scheduled Modal -->
        <div id="modal-scheduled" class="modal" style="display: none; z-index: 10000;">
            <div class="card" style="width: 100%; max-width: 550px; max-height: 90vh; overflow-y: auto; position: relative;">
                <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 15px;">
                    <h3 id="modal-scheduled-title" style="margin: 0;"><i class="fas fa-clock"></i> إضافة إشعار مجدول</h3>
                    <button class="btn-icon" onclick="document.getElementById('modal-scheduled').style.display='none'" style="font-size: 1.5rem; color: #888; background: none; border: none; cursor: pointer;">&times;</button>
                </div>
                
                <input type="hidden" id="sched-id">
                
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; font-weight: bold; margin-bottom: 8px;">عنوان الإشعار (اختياري)</label>
                    <input type="text" id="sched-title" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 5px; background: var(--bg-body); color: var(--text-main);" placeholder="مثال: تذكير باضافة العمالة">
                </div>
                
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; font-weight: bold; margin-bottom: 8px;">نص الإشعار <span style="color:red;">*</span></label>
                    <textarea id="sched-message" required style="width: 100%; min-height: 80px; padding: 10px; border: 1px solid var(--border-color); border-radius: 5px; background: var(--bg-body); color: var(--text-main);" placeholder="اكتب رسالتك هنا..."></textarea>
                </div>
                
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; font-weight: bold; margin-bottom: 8px;">وقت الإرسال (يومياً)</label>
                    <div style="display: flex; gap: 10px; align-items: center;">
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

// Replace lines 975 through 987 (inclusive) with the replacement
lines.splice(975, 13, replacement);
fs.writeFileSync("index.html", lines.join('\n'));
console.log("Recovered the corrupted HTML block!");
