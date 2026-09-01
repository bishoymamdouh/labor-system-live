const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

const start = content.indexOf('<section id="view-admin"');
const end = content.indexOf('</section>', start) + 10;

const cleanHtml = `
            <section id="view-admin" class="view hidden">
                <header class="view-header">
                    <h2><i class="fas fa-users-cog"></i> لوحة الإدارة</h2>
                </header>
                
                <h3 class="mb-10"><i class="fas fa-user-shield"></i> إدارة المستخدمين</h3>
                <div class="card">
                    <form id="add-user-form" class="inline-form">
                        <div class="form-group">
                            <input type="text" id="new-username" required placeholder="اسم المستخدم">
                        </div>
                        <div class="form-group">
                            <input type="password" id="new-password" required placeholder="كلمة المرور">
                        </div>
                        <div class="form-group">
                            <select id="new-role" required>
                                <option value="" disabled selected>اختر الصلاحية</option>
                                <option value="supervisor">مشرف</option>
                                <option value="surveyor">مساح</option>
                                <option value="warehouse_manager">مدير مخزن</option>
                                <option value="operator_supervisor">مشرف مشغل</option>
                                <option value="engineer">مهندس</option>
                                <option value="admin">مدير</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary"><i class="fas fa-plus"></i> إضافة مستخدم</button>
                    </form>
                </div>

                <details class="card mt-20" style="padding: 10px; cursor: pointer;">
                    <summary style="font-weight: bold; margin-bottom: 10px;"><i class="fas fa-chevron-down"></i> عرض جدول المستخدمين</summary>
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>اسم المستخدم</th>
                                    <th>الباسورد</th>
                                    <th>الصلاحية</th>
                                    <th>إجراءات</th>
                                </tr>
                            </thead>
                            <tbody id="users-table-body">
                                <!-- Users list populated dynamically -->
                            </tbody>
                        </table>
                    </div>
                </details>

                <h3 class="mt-20 mb-10"><i class="fas fa-address-book"></i> إدارة قاعدة العمال</h3>
                <div class="card">
                    <form id="add-dir-worker-form" class="inline-form">
                        <div class="form-group">
                            <input type="text" id="dir-worker-name" required placeholder="اسم العامل">
                        </div>
                        <div class="form-group">
                            <select id="dir-worker-type" required>
                                <option value="عامل">عامل</option>
                                <option value="نحات">نحات</option>
                                <option value="صنايعى">صنايعى</option>
                                <option value="مشرف عمال">مشرف عمال</option>
                                <option value="بوفيه">بوفيه</option>
                                <option value="اخرى">اخرى</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <input type="number" id="dir-worker-amount" required min="0" placeholder="اليومية الافتراضية">
                        </div>
                        <button type="submit" class="btn btn-primary"><i class="fas fa-plus"></i> إضافة لقاعدة العمال</button>
                    </form>
                </div>
                
                <details class="card mt-20" style="padding: 10px; cursor: pointer;">
                    <summary style="font-weight: bold; margin-bottom: 10px;"><i class="fas fa-chevron-down"></i> عرض جدول العمالة</summary>
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>اسم العامل</th>
                                    <th>النوع</th>
                                    <th>اليومية</th>
                                    <th>إجراءات</th>
                                </tr>
                            </thead>
                            <tbody id="dir-workers-table-body">
                                <!-- Directory workers list populated dynamically -->
                            </tbody>
                        </table>
                    </div>
                </details>

                <details class="card mt-20" style="padding: 10px; cursor: pointer;">
                    <summary style="font-weight: bold; margin-bottom: 10px;"><i class="fas fa-database"></i> استعادة بيانات النظام</summary>
                    <div style="padding: 10px;">
                        <p style="margin-bottom: 15px; color: #555;">يتم أخذ نسخة احتياطية من النظام تلقائياً عند تصدير تقرير الإكسيل. يمكنك استعادة النظام بالكامل من هنا عن طريق اختيار ملف النسخة الاحتياطية (.json).</p>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="file" id="import-file-input" accept=".json" style="display: none;">
                            <button type="button" class="btn btn-secondary" onclick="document.getElementById('import-file-input').click()"><i class="fas fa-file-import"></i> استعادة النظام (.json)</button>
                        </div>
                    </div>
                </details>
            </section>
`;

content = content.substring(0, start) + cleanHtml.trim() + content.substring(end);
fs.writeFileSync("index.html", content);
console.log("Restored view-admin correctly!");
