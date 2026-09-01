const text = Deno.readTextFileSync("index.html").replace(/\r\n/g, "\n");

const toFix1 = `        const allCheckbox = document.getElementById('broadcast-target-all');
        const broadcastUserList = document.getElementById('broadcast-user-list');
        const updateMultiselectTitle = () => {
                const origText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
                btn.disabled = true;`.replace(/\r\n/g, "\n");

const fixed1 = `        const allCheckbox = document.getElementById('broadcast-target-all');
        const broadcastUserList = document.getElementById('broadcast-user-list');
        const updateMultiselectTitle = () => {
            const titleSpan = document.getElementById('multiselect-title');
            if (!titleSpan) return;
            const total = document.querySelectorAll('.broadcast-user-checkbox').length;
            const checked = document.querySelectorAll('.broadcast-user-checkbox:checked').length;
            if (checked === total) {
                titleSpan.innerText = "جميع المستخدمين";
            } else if (checked === 0) {
                titleSpan.innerText = "لم يتم تحديد أحد";
            } else {
                titleSpan.innerText = \`تم تحديد (\${checked}) مستخدمين\`;
            }
        };
        
        if (allCheckbox) {
            allCheckbox.addEventListener('change', (e) => {
                const checkboxes = document.querySelectorAll('.broadcast-user-checkbox');
                checkboxes.forEach(cb => {
                    cb.checked = e.target.checked;
                });
                updateMultiselectTitle();
            });
        }
        if (broadcastUserList) {
            broadcastUserList.addEventListener('change', (e) => {
                if (e.target.classList.contains('broadcast-user-checkbox')) {
                    const total = document.querySelectorAll('.broadcast-user-checkbox').length;
                    const checked = document.querySelectorAll('.broadcast-user-checkbox:checked').length;
                    if(allCheckbox) allCheckbox.checked = (total === checked);
                    updateMultiselectTitle();
                }
            });
        }

        const broadcastForm = document.getElementById('broadcast-form');
        if (broadcastForm) {
            broadcastForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = document.getElementById('broadcast-submit-btn');
                const origText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
                btn.disabled = true;`.replace(/\r\n/g, "\n");

const toFix2 = `        // Import System Data
        const importInput = document.getElementById('import-file-input');
        if (importInput) {
            importInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                        }
                    };
                    reader.readAsText(file);
                }
                e.target.value = '';
            });
        }`.replace(/\r\n/g, "\n");

const fixed2 = `        // Import System Data
        const importInput = document.getElementById('import-file-input');
        if (importInput) {
            importInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                if (confirm('تحذير: استعادة النظام من ملف خارجي سيؤدي إلى الكتابة فوق جميع البيانات الحالية. هل أنت متأكد من المتابعة؟')) {
                    const reader = new FileReader();
                    reader.onload = async (ev) => {
                        try {
                            const data = JSON.parse(ev.target.result);
                            const res = await fetch('/api/import', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(data)
                            });
                            if (res.ok) {
                                alert('تم استعادة النظام بنجاح! سيتم إعادة تحديث الصفحة.');
                                window.location.reload();
                            } else {
                                alert('فشل في استعادة النظام.');
                            }
                        } catch (err) {
                            console.error(err);
                            alert('ملف غير صالح.');
                        }
                    };
                    reader.readAsText(file);
                }
                e.target.value = '';
            });
        }`.replace(/\r\n/g, "\n");

let newText = text;
if (newText.includes(toFix1)) {
    newText = newText.replace(toFix1, fixed1);
    console.log("Fixed 1 applied");
} else {
    console.log("Failed to apply Fix 1");
}

if (newText.includes(toFix2)) {
    newText = newText.replace(toFix2, fixed2);
    console.log("Fixed 2 applied");
} else {
    console.log("Failed to apply Fix 2");
}

Deno.writeTextFileSync("index.html", newText);
console.log("Done");
