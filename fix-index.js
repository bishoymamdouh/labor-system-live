let html = Deno.readTextFileSync('index.html');
const regex = /(<input type="password" id="password" required placeholder="أدخل كلمة المرور">\s*<\/div>)[\s\S]*?(<!-- Admin View: Manage Users -->)/;

const replacement = `$1
                        <button type="submit" class="btn btn-primary btn-block">دخول <i class="fas fa-arrow-left"></i></button>
                    </form>
                </div>
            </section>

            $2`;

if (regex.test(html)) {
    html = html.replace(regex, replacement);
    Deno.writeTextFileSync('index.html', html);
    console.log("Fixed successfully.");
} else {
    console.log("Regex not found.");
}
