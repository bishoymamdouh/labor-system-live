const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

const notifHtml = `
        <section id="view-notifications" class="view hidden">
            <div class="view-header">
                <h2>إدارة الإشعارات 🔔</h2>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 20px;">
                
                <!-- Manual Broadcast -->
                <div class="card" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <h3>إرسال إشعار فوري</h3>
                    <p style="color: #666; font-size: 0.9rem; margin-bottom: 15px;">أرسل إشعاراً في اللحظة الحالية لمن تحدده.</p>
                    <input type="text" id="broadcast-title" placeholder="عنوان الإشعار..." class="input-field" style="margin-bottom: 10px;">
                    <textarea id="broadcast-message" placeholder="نص الإشعار..." class="input-field" style="margin-bottom: 15px; min-height: 80px;"></textarea>
                    
                    <h4 style="margin-bottom: 5px;">المستهدفين (بالوظيفة):</h4>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 15px;">
                        <label><input type="checkbox" class="broadcast-role" value="admin"> مديرين</label>
                        <label><input type="checkbox" class="broadcast-role" value="engineer"> مهندسين</label>
                        <label><input type="checkbox" class="broadcast-role" value="supervisor"> مشرفين</label>
                    </div>
                    
                    <h4 style="margin-bottom: 5px;">المستهدفين (بالاسم):</h4>
                    <select id="broadcast-users" multiple class="input-field" style="height: 100px; margin-bottom: 15px;">
                        <!-- Options populated by JS -->
                    </select>
                    
                    <button id="btn-send-broadcast" class="btn btn-primary" style="width: 100%;">إرسال الإشعار الآن <i class="fas fa-paper-plane"></i></button>
                </div>

                <!-- Scheduled Notifications -->
                <div class="card" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3>الإشعارات المجدولة</h3>
                        <button id="btn-add-scheduled" class="btn btn-secondary btn-sm"><i class="fas fa-plus"></i> إضافة</button>
                    </div>
                    <div id="scheduled-list" style="display: flex; flex-direction: column; gap: 10px;">
                        <!-- Populated by JS -->
                    </div>
                    
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                    
                    <h3>إشعار النظام (3 ساعات)</h3>
                    <p style="color: #666; font-size: 0.9rem; margin-bottom: 10px;">يُرسل للمهندس إذا تأخر في الرد على طلب أو سركي. استخدم {name} لذكر اسم المهندس.</p>
                    <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <input type="checkbox" id="sys-remind-active">
                        <span>تفعيل الإشعار التلقائي</span>
                    </label>
                    <textarea id="sys-remind-text" class="input-field" style="min-height: 60px; margin-bottom: 10px;"></textarea>
                    <button id="btn-save-sys-remind" class="btn btn-primary btn-sm">حفظ إعدادات النظام</button>
                </div>
            </div>
        </section>

        <!-- Add/Edit Scheduled Modal -->
        <div id="modal-scheduled" class="modal">
            <div class="modal-content" style="max-width: 500px;">
                <h3 id="modal-scheduled-title">إضافة إشعار مجدول</h3>
                <input type="hidden" id="sched-id">
                
                <label>عنوان الإشعار</label>
                <input type="text" id="sched-title" class="input-field" style="margin-bottom: 10px;">
                
                <label>نص الإشعار</label>
                <textarea id="sched-message" class="input-field" style="margin-bottom: 10px; min-height: 60px;"></textarea>
                
                <label>وقت الإرسال (AM/PM)</label>
                <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                    <select id="sched-hour" class="input-field" style="width: auto;">
                        <option value="01">01</option><option value="02">02</option><option value="03">03</option><option value="04">04</option><option value="05">05</option><option value="06">06</option><option value="07">07</option><option value="08">08</option><option value="09">09</option><option value="10">10</option><option value="11">11</option><option value="12">12</option>
                    </select>
                    <span style="align-self: center;">:</span>
                    <select id="sched-min" class="input-field" style="width: auto;">
                        <option value="00">00</option><option value="15">15</option><option value="30">30</option><option value="45">45</option>
                    </select>
                    <select id="sched-ampm" class="input-field" style="width: auto;">
                        <option value="AM">AM</option><option value="PM">PM</option>
                    </select>
                </div>
                
                <label>المستهدفين (بالوظيفة):</label>
                <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 10px;">
                    <label><input type="checkbox" class="sched-role" value="admin"> مديرين</label>
                    <label><input type="checkbox" class="sched-role" value="engineer"> مهندسين</label>
                    <label><input type="checkbox" class="sched-role" value="supervisor"> مشرفين</label>
                </div>
                
                <label>المستهدفين (بالاسم):</label>
                <select id="sched-users" multiple class="input-field" style="height: 80px; margin-bottom: 15px;"></select>
                
                <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
                    <input type="checkbox" id="sched-active" checked>
                    <span>مُفعّل (يعمل)</span>
                </label>
                
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="document.getElementById('modal-scheduled').style.display='none'">إلغاء</button>
                    <button class="btn btn-primary" id="btn-save-scheduled">حفظ الإشعار</button>
                </div>
            </div>
        </div>
`;

if (!content.includes('id="view-notifications"')) {
    content = content.replace('<section id="view-reports"', notifHtml + '\n            <section id="view-reports"');
    fs.writeFileSync("index.html", content);
    console.log("Injected HTML properly!");
} else {
    console.log("HTML already exists");
}
