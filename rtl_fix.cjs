const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

const fixedOrder = `
                            <div class="form-group" style="flex: 1; margin: 0;">
                                <input type="text" id="broadcast-title" placeholder="عنوان الإشعار (اختياري)" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 5px;">
                            </div>
                            
                            <div class="form-group" style="flex: 2; margin: 0;">
                                <input type="text" id="broadcast-message" required placeholder="نص الإشعار..." style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 5px;">
                            </div>
                            
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
                            
                            <button type="submit" class="btn" style="background: #6366f1; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: bold; white-space: nowrap; height: 42px;" id="broadcast-submit-btn">إرسال <i class="fas fa-paper-plane"></i></button>
`;

const start = content.indexOf('<button type="submit" class="btn" style="background: #6366f1;');
const end = content.indexOf('</form>', start);
if (start !== -1 && end !== -1) {
    content = content.substring(0, start) + fixedOrder + '                        ' + content.substring(end);
    fs.writeFileSync("index.html", content);
    console.log("Fixed RTL order");
}
