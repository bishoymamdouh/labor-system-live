const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldFooter = `<div class="modal-footer" id="record-modal-footer">
                            <button id="approve-record-btn" class="btn btn-success"><i class="fas fa-check"></i> اعتماد السركي</button>
                            <button id="reject-record-btn" class="btn btn-danger"><i class="fas fa-times"></i> رفض السركي</button>
                        </div>`;

const newFooter = `<div class="modal-footer" id="record-modal-footer" style="flex-wrap: wrap;">
                            <div style="width: 100%; margin-bottom: 15px; background: var(--surface-color); padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); display: flex; gap: 10px; align-items: center; justify-content: space-between;">
                                <div style="flex: 1;">
                                    <label style="font-size: 0.9em; margin-bottom: 5px; display: block; color: var(--text-color);">إبلاغ / تحويل إلى مهندس آخر:</label>
                                    <select id="forward-engineer-select" class="modal-input" style="margin-bottom: 0;">
                                        <option value="">-- اختر مهندس (اختياري) --</option>
                                    </select>
                                </div>
                                <button id="forward-record-btn" class="btn btn-primary" style="margin-top: 20px;"><i class="fas fa-share"></i> إرسال</button>
                            </div>
                            <div style="display: flex; gap: 10px; width: 100%;">
                                <button id="approve-record-btn" class="btn btn-success" style="flex: 1;"><i class="fas fa-check"></i> اعتماد السركي</button>
                                <button id="reject-record-btn" class="btn btn-danger" style="flex: 1;"><i class="fas fa-times"></i> رفض السركي</button>
                            </div>
                        </div>`;

if (html.includes(oldFooter)) {
    html = html.replace(oldFooter, newFooter);
    fs.writeFileSync('index.html', html, 'utf8');
    console.log("Footer HTML updated!");
} else {
    console.log("Old footer not found!");
}
