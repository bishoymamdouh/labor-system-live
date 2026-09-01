const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

const oldModalStart = content.indexOf('<!-- Add/Edit Scheduled Modal -->');
const oldModalEnd = content.indexOf('</div>', content.indexOf('<div class="modal-actions">')) + 20;

if (oldModalStart !== -1 && oldModalEnd !== -1) {
    const betterModal = `
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
                    <input type="text" id="sched-title" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 5px; background: var(--bg-body); color: var(--text-main);" placeholder="مثال: تذكير بموعد الإفطار">
                </div>
                
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; font-weight: bold; margin-bottom: 8px;">نص الإشعار <span style="color:red;">*</span></label>
                    <textarea id="sched-message" required style="width: 100%; min-height: 80px; padding: 10px; border: 1px solid var(--border-color); border-radius: 5px; background: var(--bg-body); color: var(--text-main);" placeholder="اكتب رسالتك هنا..."></textarea>
                </div>
                
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; font-weight: bold; margin-bottom: 8px;">وقت الإرسال (يومياً)</label>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <select id="sched-hour" style="padding: 10px; border: 1px solid var(--border-color); border-radius: 5px; background: var(--bg-body); color: var(--text-main); flex: 1;">
                            <option value="01">01</option><option value="02">02</option><option value="03">03</option><option value="04">04</option><option value="05">05</option><option value="06">06</option><option value="07">07</option><option value="08">08</option><option value="09">09</option><option value="10" selected>10</option><option value="11">11</option><option value="12">12</option>
                        </select>
                        <span style="font-weight: bold;">:</span>
                        <select id="sched-min" style="padding: 10px; border: 1px solid var(--border-color); border-radius: 5px; background: var(--bg-body); color: var(--text-main); flex: 1;">
                            <option value="00">00</option><option value="15">15</option><option value="30">30</option><option value="45">45</option>
                        </select>
                        <select id="sched-ampm" style="padding: 10px; border: 1px solid var(--border-color); border-radius: 5px; background: var(--bg-body); color: var(--text-main); flex: 1;">
                            <option value="AM">صباحاً (AM)</option><option value="PM">مساءً (PM)</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; font-weight: bold; margin-bottom: 8px;">المستهدفين (حسب الوظيفة):</label>
                    <div style="display: flex; gap: 15px; flex-wrap: wrap; background: var(--bg-body); padding: 10px; border-radius: 5px; border: 1px solid var(--border-color);">
                        <label style="display: flex; align-items: center; cursor: pointer; gap: 8px;"><input type="checkbox" class="sched-role" value="admin" style="width: 16px; height: 16px;"> المديرين</label>
                        <label style="display: flex; align-items: center; cursor: pointer; gap: 8px;"><input type="checkbox" class="sched-role" value="engineer" style="width: 16px; height: 16px;"> المهندسين</label>
                        <label style="display: flex; align-items: center; cursor: pointer; gap: 8px;"><input type="checkbox" class="sched-role" value="supervisor" style="width: 16px; height: 16px;"> المشرفين</label>
                    </div>
                </div>
                
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; font-weight: bold; margin-bottom: 8px;">المستهدفين (حسب الاسم):</label>
                    <select id="sched-users" multiple style="width: 100%; height: 120px; padding: 10px; border: 1px solid var(--border-color); border-radius: 5px; background: var(--bg-body); color: var(--text-main);"></select>
                    <small style="color: #666; display: block; margin-top: 5px;">* يمكنك تحديد أكثر من شخص بالضغط المستمر على Ctrl</small>
                </div>
                
                <div class="form-group" style="margin-bottom: 25px; margin-top: 20px; border-top: 1px solid var(--border-color); padding-top: 15px;">
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                        <input type="checkbox" id="sched-active" checked style="width: 20px; height: 20px; accent-color: #10b981;">
                        <span style="font-weight: bold; font-size: 1.1rem; color: #10b981;">تفعيل الإشعار المجدول</span>
                    </label>
                </div>
                
                <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 10px;">
                    <button class="btn btn-secondary" onclick="document.getElementById('modal-scheduled').style.display='none'">إلغاء</button>
                    <button class="btn btn-primary" id="btn-save-scheduled" style="background-color: #6366f1;">حفظ الإشعار <i class="fas fa-save"></i></button>
                </div>
            </div>
        </div>
`;
    
    // We replace from oldModalStart to oldModalEnd
    content = content.substring(0, oldModalStart) + betterModal + content.substring(oldModalEnd);
    fs.writeFileSync("index.html", content);
    console.log("Improved Modal HTML injected successfully!");
}
