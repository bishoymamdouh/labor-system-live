// Authentication & Role Management (Firebase Adapted)

class Auth {
    constructor() {
        this.currentUser = null;
    }

    async init() {
        await db.init();
        await this.checkDefaultAdmin();
        this.loadSession();
    }

    async checkDefaultAdmin() {
        try {
            const adminDoc = await db.getById('users', 'admin_default_id');
            if (!adminDoc) {
                // Create default admin if it doesn't exist
                await db.setWithId('users', 'admin_default_id', {
                    username: 'admin',
                    password: '123', // In a real app, this should be hashed, or use Firebase Auth
                    role: 'admin'
                });
                console.log("Default admin created on Firebase: admin / 123");
            }
        } catch (e) {
            console.error("Error checking default admin:", e);
        }
    }

    async login(username, password) {
        // Query users collection for matching username and password
        const users = await db.getByField('users', 'username', username);
        const user = users.find(u => u.password === password);
        
        if (user) {
            this.currentUser = user;
            localStorage.setItem('labor_app_user', JSON.stringify(user));
            return true;
        }
        return false;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('labor_app_user');
        window.location.reload();
    }

    loadSession() {
        const saved = localStorage.getItem('labor_app_user');
        if (saved) {
            this.currentUser = JSON.parse(saved);
        }
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    getRole() {
        return this.currentUser ? this.currentUser.role : null;
    }
    
    getRoleNameAr(role) {
        const roles = {
            'admin': 'مدير النظام',
            'supervisor': 'مشرف',
            'surveyor': 'مساح',
            'warehouse_manager': 'مدير مخزن',
            'operator_supervisor': 'مشرف مشغل',
            'engineer': 'مهندس'
        };
        return roles[role] || 'غير محدد';
    }
}

const auth = new Auth();
