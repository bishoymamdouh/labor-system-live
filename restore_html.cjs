const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

// 1. Remove the messed up view-notifications
const viewStart = content.indexOf('<section id="view-notifications"');
const viewEnd = content.indexOf('</section>', viewStart) + 10;
content = content.substring(0, viewStart) + content.substring(viewEnd);

// 2. We need to rebuild it carefully
const correctHtml = `
        <section id="view-notifications" class="view hidden">
            <div class="view-header">
                <h2>إدارة الإشعارات 🔔</h2>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 30px; padding: 20px;">
                
                <!-- Manual Broadcast -->
                <div>
                    <h3 class="mb-10"><i class="fas fa-bell"></i> إرسال إشعار للمستخدمين</h3>
                    <div class="card" style="padding: 15px;">
                        <form id="broadcast-form" class="inline-form" style="align-items: center;">
                            <button type="submit" class="btn" style="background: #6366f1; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: bold; white-space: nowrap;" id="broadcast-submit-btn">إرسال <i class="fas fa-paper-plane"></i></button>
                            
                            <div class="form-group" style="flex: 1; min-width: 250px; margin: 0;">
                                <div class="custom-multiselect" id="broadcast-multiselect" style="position: relative; width: 100%;">
                                    <div class="multiselect-header" style="border: 1px solid var(--border-color); padding: 10px 15px; border-radius: 5px; background: white; cursor: pointer; display: flex; justify-content: space-between; align-items: center; height: 42px; transition: border-color 0.2s;">
                                        <span id="multiselect-title" style="color: #333; font-weight: normal; font-size: 14px;">جميع المستخدمين</span>
                                        <i class="fas fa-chevron-down" style="color: #666; transition: transform 0.3s;" id="multiselect-icon"></i>
                                    </div>
                                    <div class="multiselect-dropdown" style="display: none; position: absolute; top: calc(100% + 5px); left: 0; right: 0; background: white; border: 1px solid var(--border-color); border-radius: 5px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); z-index: 1000; max-height: 300px; overflow-y: auto;">
                                        <label style="display: flex; align-items: center; padding: 12px 15px; border-bottom: 2px solid #eee; cursor: pointer; margin: 0; background: #f8f9fa; position: sticky; top: 0; z-index: 2;">
                                            <input type="checkbox" id="broadcast-target-all" checked style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--primary-color);"> 
                                            <strong style="color: var(--primary-color); margin-right: 10px; font-size: 15px;">جميع المستخدمين</strong>
                                        </label>
                                        <div style="padding: 10px; border-bottom: 1px solid #eee; background: #fafafa;">
                                            <strong style="display:block; margin-bottom: 8px; color: #555; font-size: 13px;">حسب الوظيفة:</strong>
                                            <label style="display:flex; align-items:center; margin-bottom:5px; cursor:pointer;"><input type="checkbox" class="role-filter-cb" value="admin" style="margin-left:8px;"> المديرين</label>
                                            <label style="display:flex; align-items:center; margin-bottom:5px; cursor:pointer;"><input type="checkbox" class="role-filter-cb" value="engineer" style="margin-left:8px;"> المهندسين</label>
                                            <label style="display:flex; align-items:center; margin-bottom:5px; cursor:pointer;"><input type="checkbox" class="role-filter-cb" value="supervisor" style="margin-left:8px;"> المشرفين</label>
                                        </div>
                                        <div id="broadcast-user-list" style="padding: 0;">
                                            <!-- Users populated here -->
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group" style="flex: 2; margin: 0;">
                                <input type="text" id="broadcast-message" required placeholder="نص الإشعار..." style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 5px;">
                            </div>
                            
                            <div class="form-group" style="flex: 1; margin: 0;">
                                <input type="text" id="broadcast-title" placeholder="عنوان الإشعار (اختياري)" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 5px;">
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Scheduled Notifications -->
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3><i class="fas fa-clock"></i> الإشعارات المجدولة</h3>
                        <button id="btn-add-scheduled" class="btn btn-secondary btn-sm"><i class="fas fa-plus"></i> إضافة إشعار مجدول</button>
                    </div>
                    <div id="scheduled-list" style="display: flex; flex-direction: column; gap: 10px;">
                        <!-- Populated by JS -->
                    </div>
                </div>
                
                <hr style="margin: 10px 0; border: none; border-top: 1px solid #eee;">
                
                <div>
                    <h3><i class="fas fa-robot"></i> إشعار تأخير المهندسين (3 ساعات)</h3>
                    <p style="color: #666; font-size: 0.9rem; margin-bottom: 15px;">يُرسل للمهندس تلقائياً إذا تأخر في الرد على طلب أو سركي معلق لأكثر من 3 ساعات. (استخدم <code>{name}</code> لذكر اسم المهندس).</p>
                    <div class="card" style="padding: 20px; background: #fff;">
                        <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px; cursor: pointer;">
                            <input type="checkbox" id="sys-remind-active" style="width: 18px; height: 18px; accent-color: var(--primary-color);">
                            <span style="font-weight: bold;">تفعيل الإشعار التلقائي</span>
                        </label>
                        <textarea id="sys-remind-text" class="input-field" style="min-height: 60px; margin-bottom: 15px; width: 100%; border: 1px solid var(--border-color); padding: 10px; border-radius: 5px;"></textarea>
                        <button id="btn-save-sys-remind" class="btn btn-primary btn-sm">حفظ الإعدادات</button>
                    </div>
                </div>
            </div>
        </section>
`;

const insertPos = content.indexOf('<section id="view-reports"');
content = content.substring(0, insertPos) + correctHtml + '\n            ' + content.substring(insertPos);

fs.writeFileSync("index.html", content);
console.log("Restored view-notifications with perfect UI");
