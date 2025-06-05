// Authentication functionality
class Auth {
    constructor() {
        this.auth = window.app.auth;
        this.setupAuthListeners();
        this.setupUIHandlers();
    }

    setupAuthListeners() {
        this.auth.onAuthStateChanged(user => {
            this.updateUI(user);
        });
    }

    setupUIHandlers() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;

        try {
            await this.auth.signInWithEmailAndPassword(email, password);
            // Redirect to profile or home page
            window.location.href = '/profile';
        } catch (error) {
            console.error('Login error:', error);
            alert('Ошибка входа: ' + error.message);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;
        const name = e.target.name.value;

        try {
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            await userCredential.user.updateProfile({
                displayName: name
            });
            // Redirect to profile completion page
            window.location.href = '/profile/complete';
        } catch (error) {
            console.error('Registration error:', error);
            alert('Ошибка регистрации: ' + error.message);
        }
    }

    async handleLogout() {
        try {
            await this.auth.signOut();
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
            alert('Ошибка выхода: ' + error.message);
        }
    }

    updateUI(user) {
        const authSection = document.getElementById('authSection');
        const profileSection = document.getElementById('profileSection');
        
        if (user) {
            // User is signed in
            if (authSection) authSection.style.display = 'none';
            if (profileSection) {
                profileSection.style.display = 'block';
                const userNameElement = profileSection.querySelector('.user-name');
                if (userNameElement) {
                    userNameElement.textContent = user.displayName || user.email;
                }
            }
        } else {
            // User is signed out
            if (authSection) authSection.style.display = 'block';
            if (profileSection) profileSection.style.display = 'none';
        }
    }
}

// Initialize authentication
new Auth();
