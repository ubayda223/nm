import { ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";
import { ProductManager } from './products.js';

// Main application logic and routing
class App {
    constructor() {
        // Bind methods to this instance
        this.showHome = this.showHome.bind(this);
        this.showProfile = this.showProfile.bind(this);
        this.showAdmin = this.showAdmin.bind(this);
        this.showCart = this.showCart.bind(this);
        this.showCategory = this.showCategory.bind(this);
        this.showSettings = this.showSettings.bind(this);

        this.routes = {
            '/': this.showHome,
            '/profile': this.showProfile,
            '/admin': this.showAdmin,
            '/cart': this.showCart,
            '/category/clothing': () => this.showCategory('clothing'),
            '/category/electronics': () => this.showCategory('electronics'),
            '/settings': this.showSettings // Новый маршрут
        };
        
        this.setupRouter();
        this.setupUI();
    }

    setupRouter() {
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    }

    setupUI() {
        // Initialize UI components
        this.mainContent = document.querySelector('main');
        this.setupNavigation();
        this.addSettingsLink();
    }

    setupNavigation() {
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                if (e.target.getAttribute('href').startsWith('#')) {
                    e.preventDefault();
                    const route = e.target.getAttribute('href').substring(1);
                    this.navigateTo(route);
                }
            });
        });
    }

    navigateTo(route) {
        window.location.hash = route;
    }    handleRoute() {
        const hash = window.location.hash || '#/';
        let route = hash.substring(1);
        
        // If route is empty, default to home
        if (!route) route = '/';
        
        const handler = this.routes[route];
        if (handler) {
            handler.call(this);
        } else {
            this.show404();
        }
    }    // Route handlers
    async showHome() {
        if (!this.mainContent) return;
        this.mainContent.innerHTML = `
            <section class="main-hero main-hero-animated mb-8">
                <h1 class="text-3xl md:text-4xl font-bold mb-2 animate-fade-in">TurkiyaMode</h1>
                <p class="text-lg md:text-xl mb-4 animate-fade-in" style="animation-delay:0.15s;">${this.t('mainSlogan') || 'Ваш стильный магазин турецкой одежды и техники'}</p>
                <div class="flex flex-wrap gap-4 animate-fade-in" style="animation-delay:0.25s;">
                    <a href="#/category/clothing" class="btn-primary">${this.t('clothing') || 'Одежда'}</a>
                    <a href="#/category/electronics" class="btn-primary">${this.t('electronics') || 'Техника'}</a>
                </div>
            </section>
            <section class="mb-8 animate-fade-in">
                <h2 class="text-2xl font-semibold mb-4">${this.t('categories') || 'Категории'}</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <a href="#/category/clothing" class="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow product-card">
                        <div class="text-center">
                            <h3 class="font-medium">${this.t('clothing') || 'Одежда'}</h3>
                        </div>
                    </a>
                    <a href="#/category/electronics" class="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow product-card">
                        <div class="text-center">
                            <h3 class="font-medium">${this.t('electronics') || 'Техника'}</h3>
                        </div>
                    </a>
                </div>
            </section>
            <section id="products" class="mb-8 animate-fade-in">
                <h2 class="text-2xl font-semibold mb-4">${this.t('popularProducts') || 'Популярные товары'}</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <!-- Products will be dynamically loaded here -->
                </div>
            </section>
        `;

        // Initialize product manager to load products
        const productManager = new ProductManager();
        await productManager.loadProducts();
    }    async showProfile() {
        const user = window.app.auth.currentUser;
        if (!this.mainContent) return;
        if (!user) {
            // Show login form if user is not authenticated
            this.mainContent.innerHTML = `
                <div class="container mx-auto px-4 py-8 animate-fade-in">
                    <div class="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 animate-fade-in">
                        <h2 class="text-2xl font-semibold mb-6 text-center">${this.t('loginTitle') || 'Вход в систему'}</h2>
                        <form id="loginForm" class="space-y-4">
                            <div class="form-floating">
                                <input type="email" name="email" required placeholder="Email" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500">
                                <label>Email</label>
                            </div>
                            <div class="form-floating">
                                <input type="password" name="password" required placeholder="${this.t('password') || 'Пароль'}" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500">
                                <label>${this.t('password') || 'Пароль'}</label>
                            </div>
                            <button type="submit" class="w-full btn-primary">${this.t('loginBtn') || 'Войти'}</button>
                        </form>
                        <div class="mt-4 text-center">
                            <p class="text-gray-600">${this.t('noAccount') || 'Нет аккаунта?'}</p>
                            <button id="showRegister" class="text-blue-600 hover:text-blue-800">${this.t('registerBtn') || 'Зарегистрироваться'}</button>
                        </div>
                    </div>
                </div>
            `;

            // Setup form handlers
            const loginForm = document.getElementById('loginForm');
            const showRegisterBtn = document.getElementById('showRegister');
            
            if (loginForm) {
                loginForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const form = e.target;
                    const email = form.email.value;
                    const password = form.password.value;
                    
                    try {
                        await window.app.auth.signInWithEmailAndPassword(email, password);
                        this.showProfile(); // Refresh profile page after login
                    } catch (error) {
                        alert('Ошибка входа: ' + error.message);
                    }
                });
            }

            if (showRegisterBtn) {
                showRegisterBtn.addEventListener('click', () => {
                    this.mainContent.innerHTML = `
                        <div class="container mx-auto px-4 py-8">
                            <div class="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
                                <h2 class="text-2xl font-semibold mb-6">${this.t('registerTitle') || 'Регистрация'}</h2>
                                <form id="registerForm" class="space-y-4">
                                    <div>
                                        <label class="block text-gray-700 mb-2">${this.t('name') || 'Имя'}</label>
                                        <input type="text" name="name" required 
                                            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500">
                                    </div>
                                    <div>
                                        <label class="block text-gray-700 mb-2">Email</label>
                                        <input type="email" name="email" required 
                                            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500">
                                    </div>
                                    <div>
                                        <label class="block text-gray-700 mb-2">${this.t('password') || 'Пароль'}</label>
                                        <input type="password" name="password" required 
                                            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500">
                                    </div>
                                    <button type="submit" class="w-full btn-primary">${this.t('registerBtn') || 'Зарегистрироваться'}</button>
                                </form>
                                
                                <div class="mt-4 text-center">
                                    <p class="text-gray-600">${this.t('alreadyHaveAccount') || 'Уже есть аккаунт?'}</p>
                                    <button id="showLogin" class="text-blue-600 hover:text-blue-800">${this.t('loginBtn') || 'Войти'}</button>
                                </div>
                            </div>
                        </div>
                    `;

                    const registerForm = document.getElementById('registerForm');
                    const showLoginBtn = document.getElementById('showLogin');

                    if (registerForm) {
                        registerForm.addEventListener('submit', async (e) => {
                            e.preventDefault();
                            const form = e.target;
                            const email = form.email.value;
                            const password = form.password.value;
                            const name = form.name.value;                            try {
                                const userCredential = await window.app.createUser(email, password);
                                await window.app.updateProfile(userCredential.user, { displayName: name });
                                this.showProfile(); // Refresh profile page after registration
                            } catch (error) {
                                console.error('Registration error:', error);
                                alert('Ошибка регистрации: ' + error.message);
                            }
                        });
                    }

                    if (showLoginBtn) {
                        showLoginBtn.addEventListener('click', () => {
                            this.showProfile();
                        });
                    }
                });
            }
        } else {
            // Show profile if user is authenticated
            this.mainContent.innerHTML = `
                <div class="container mx-auto px-4 py-8">
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h2 class="text-2xl font-semibold mb-6">${this.t('profile') || 'Профиль'}</h2>
                        <div class="mb-4">
                            <p class="text-gray-600">${this.t('name') || 'Имя'}:</p>
                            <p class="font-medium">${user.displayName || this.t('notSpecified') || 'Не указано'}</p>
                        </div>
                        <div class="mb-4">
                            <p class="text-gray-600">Email:</p>
                            <p class="font-medium">${user.email}</p>
                        </div>
                        <div class="mb-4">
                            <p class="text-gray-600">${this.t('regDate') || 'Дата регистрации'}:</p>
                            <p class="font-medium">${user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : '—'}</p>
                        </div>
                        <div class="mb-4">
                            <p class="text-gray-600">${this.t('changeName') || 'Изменить имя'}:</p>
                            <form id="updateNameForm" class="flex gap-2 items-center">
                                <input type="text" name="newName" placeholder="${this.t('newName') || 'Новое имя'}" class="px-2 py-1 border rounded" required>
                                <button type="submit" class="btn-primary">${this.t('save') || 'Сохранить'}</button>
                            </form>
                        </div>
                        <button id="logoutBtn" class="btn-primary">${this.t('logout') || 'Выйти'}</button>
                    </div>
                    <div class="mt-8">
                        <h3 class="text-xl font-semibold mb-4">${this.t('myOrders') || 'Мои заказы'}</h3>
                        <div id="orders" class="space-y-4">
                            <div class="text-gray-400">(${this.t('ordersSoon') || 'История заказов появится в будущих обновлениях'})</div>
                        </div>
                    </div>
                </div>
            `;
            // Setup logout handler
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async () => {
                    try {
                        await window.app.auth.signOut();
                        this.showProfile();
                    } catch (error) {
                        alert('Ошибка выхода: ' + error.message);
                    }
                });
            }
            // Setup update name handler
            const updateNameForm = document.getElementById('updateNameForm');
            if (updateNameForm) {
                updateNameForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const newName = updateNameForm.newName.value.trim();
                    if (!newName) return;
                    try {
                        await window.app.updateProfile(user, { displayName: newName });
                        alert('Имя успешно обновлено!');
                        this.showProfile();
                    } catch (err) {
                        alert('Ошибка обновления имени: ' + err.message);
                    }
                });
            }
        }
    }

    async showAdmin() {
        const user = window.app.auth.currentUser;
        // Разрешить нескольким пользователям-админам (по email)
        const allowedAdmins = [
            'ubaydaghaybulloev@gmail.com',
            'nurmuhammadgulyamov9@gmail.com',
            'admin@turkiyamode.com'
        ];
        if (!user || (!user.email.endsWith('@admin.com') && !allowedAdmins.includes(user.email))) {
            this.navigateTo('/');
            return;
        }

        if (!this.mainContent) return;
        
        this.mainContent.innerHTML = `
            <div class="container mx-auto px-2 py-4 md:px-4 md:py-8">
                <div class="bg-white rounded-lg shadow-md p-4 md:p-6 animate-fade-in">
                    <h2 class="text-2xl font-semibold mb-6 flex items-center gap-2">
                        <span>${this.t('adminPanel') || 'Панель администратора'}</span>
                        <span class="inline-block animate-bounce text-green-500">🛒</span>
                    </h2>
                    <form id="productForm" class="space-y-4">
                        <div>
                            <label class="block text-gray-700 mb-2">${this.t('productName') || 'Название товара'}</label>
                            <input type="text" name="name" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500">
                        </div>
                        <div>
                            <label class="block text-gray-700 mb-2">${this.t('productDesc') || 'Описание'}</label>
                            <textarea name="description" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"></textarea>
                        </div>
                        <div class="flex flex-col md:flex-row gap-4">
                            <div class="flex-1">
                                <label class="block text-gray-700 mb-2">${this.t('productPrice') || 'Цена'}</label>
                                <input type="number" name="price" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500">
                            </div>
                            <div class="flex-1">
                                <label class="block text-gray-700 mb-2">${this.t('productCategory') || 'Категория'}</label>
                                <select name="category" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500">
                                    <option value="clothing">${this.t('clothing') || 'Одежда'}</option>
                                    <option value="electronics">${this.t('electronics') || 'Техника'}</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label class="block text-gray-700 mb-2">${this.t('productImage') || 'Изображение'}</label>
                            <input type="file" name="image" accept="image/*" required>
                        </div>
                        <button type="submit" class="btn-primary w-full animate-pulse">${this.t('addProduct') || 'Добавить товар'}</button>
                    </form>
                </div>
                <div class="mt-8">
                    <h3 class="text-xl font-semibold mb-4">${this.t('manageProducts') || 'Управление товарами'}</h3>
                    <div id="adminProducts" class="space-y-4">
                        <!-- Products will be loaded here -->
                    </div>
                </div>
                <!-- FAB для мобильных -->
                <button id="fabAddProduct" class="fixed bottom-6 right-6 z-50 bg-blue-600 text-white rounded-full shadow-lg p-4 md:hidden animate-fade-in hover:bg-blue-700 focus:outline-none">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                </button>
            </div>
        `;
        // FAB обработчик для мобильных
        const fab = document.getElementById('fabAddProduct');
        if (fab) {
            fab.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                document.querySelector('#productForm input[name="name"]').focus();
            });
        }
        // Setup form handler
        const productForm = document.getElementById('productForm');
        if (productForm) {
            productForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleProductSubmit(e.target);
                await this.loadAdminProducts();
            });
        }
        await this.loadAdminProducts();
    }

    async loadAdminProducts() {
        const adminProducts = document.getElementById('adminProducts');
        if (!adminProducts) return;
        adminProducts.innerHTML = '<div class="text-gray-500 text-center">Загрузка товаров...</div>';
        try {
            const querySnapshot = await window.app.db.collection('products').orderBy('createdAt', 'desc').get();
            if (querySnapshot.empty) {
                adminProducts.innerHTML = '<div class="text-gray-400 text-center">Нет товаров</div>';
                return;
            }
            adminProducts.innerHTML = '';
            querySnapshot.forEach(doc => {
                const product = doc.data();
                const productId = doc.id;
                const card = document.createElement('div');
                card.className = 'flex flex-col md:flex-row items-center bg-white rounded-lg shadow p-4 gap-4 animate-fade-in';
                card.innerHTML = `
                    <img src="${product.imageUrl}" alt="${product.name}" class="w-24 h-24 object-cover rounded mb-2 md:mb-0">
                    <div class="flex-1">
                        <div class="font-semibold text-lg">${product.name}</div>
                        <div class="text-gray-600 text-sm mb-1">${product.description}</div>
                        <div class="text-blue-600 font-bold mb-1">${product.price} ₽</div>
                        <div class="text-xs text-gray-400">Категория: ${product.category}</div>
                    </div>
                    <button data-id="${productId}" class="deleteProductBtn bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded transition">Удалить</button>
                `;
                adminProducts.appendChild(card);
            });
            adminProducts.querySelectorAll('.deleteProductBtn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.getAttribute('data-id');
                    if (confirm('Удалить этот товар?')) {
                        await window.app.db.collection('products').doc(id).delete();
                        await this.loadAdminProducts();
                    }
                });
            });
        } catch (error) {
            adminProducts.innerHTML = '<div class="text-red-500 text-center">Ошибка загрузки товаров</div>';
        }

        // Показать логи админа (последние 10)
        const logsContainer = document.createElement('div');
        logsContainer.className = 'mt-8';
        logsContainer.innerHTML = '<h3 class="text-lg font-semibold mb-2">Логи действий админа (последние 10)</h3><div id="adminLogs" class="text-xs text-gray-500"></div>';
        this.mainContent.appendChild(logsContainer);
        try {
            const logsSnap = await window.app.db.collection('adminLogs').orderBy('timestamp', 'desc').get();
            let html = '';
            let count = 0;
            logsSnap.forEach(logDoc => {
                if (count++ >= 10) return;
                const log = logDoc.data();
                html += `<div>${new Date(log.timestamp).toLocaleString()} — <b>${log.adminEmail}</b>: ${log.action} (${log.productName || ''})</div>`;
            });
            document.getElementById('adminLogs').innerHTML = html;
        } catch {}
    }

    async handleProductSubmit(form) {
        try {
            const formData = new FormData(form);
            const imageFile = formData.get('image');
            // --- Cloudinary upload ---
            // 1. Замените <cloud_name> и <unsigned_preset> на свои значения из Cloudinary Dashboard
            const cloudName = 'dzmc2mg1x';
            const unsignedPreset = 'ubayda223'; // preset должен быть создан в аккаунте ubayda223 и быть unsigned
            const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
            const uploadData = new FormData();
            uploadData.append('file', imageFile);
            uploadData.append('upload_preset', unsignedPreset);
            uploadData.append('folder', 'products');
            // Можно добавить uploadData.append('folder', 'products');
            const response = await fetch(url, {
                method: 'POST',
                body: uploadData
            });
            const data = await response.json();
            if (!data.secure_url) throw new Error('Ошибка загрузки изображения на Cloudinary');
            const imageUrl = data.secure_url;
            // --- End Cloudinary upload ---
            // Create product document
            const product = {
                name: formData.get('name'),
                description: formData.get('description'),
                price: parseFloat(formData.get('price')),
                category: formData.get('category'),
                imageUrl,
                createdAt: new Date(),
                searchTerms: this.generateSearchTerms(formData.get('name'))
            };
            const docRef = await window.app.db.collection('products').add(product);
            // Логирование действия админа
            await window.app.db.collection('adminLogs').add({
                action: 'add_product',
                productId: docRef.id,
                productName: product.name,
                adminEmail: window.app.auth.currentUser?.email || '',
                timestamp: new Date()
            });
            form.reset();
            alert('Товар успешно добавлен!');
        } catch (error) {
            console.error('Error adding product:', error);
            alert('Ошибка при добавлении товара: ' + error.message);
        }
    }

    generateSearchTerms(name) {
        return name.toLowerCase().split(' ');
    }

    async showCart() {
        if (!this.mainContent) return;
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        this.mainContent.innerHTML = `
            <div class="container mx-auto px-4 py-8">
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-2xl font-semibold mb-6">${this.t('cart') || 'Корзина'}</h2>
                    <div id="cartItems" class="space-y-4"></div>
                    <div class="mt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <p class="text-lg">${this.t('total') || 'Итого'}: <span id="cartTotal" class="font-bold">0 ₽</span></p>
                        </div>
                        <div class="w-full md:w-auto flex flex-col md:flex-row gap-2">
                            <form id="orderMessageForm" class="flex flex-col md:flex-row gap-2 w-full">
                                <input type="text" id="orderMessageInput" class="px-2 py-1 border rounded flex-1" placeholder="${this.t('orderMessagePlaceholder') || 'Комментарий к заказу'}">
                                <div id="orderMessageAutocomplete" class="absolute bg-white border rounded shadow-md w-64 z-50 hidden"></div>
                            </form>
                            <a href="https://wa.me/992905746633" class="btn-primary">${this.t('orderWhatsapp') || 'Заказать через WhatsApp'}</a>
                            <a href="https://t.me/ubayda_1507" class="btn-primary">${this.t('orderTelegram') || 'Заказать через Telegram'}</a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Рендерим товары корзины
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
        if (cartItems && cartTotal) {
            let total = 0;
            cartItems.innerHTML = cart.map(item => {
                total += item.price * item.quantity;
                return `<div class="flex items-center justify-between bg-white p-4 rounded-lg shadow">
                    <div class="flex items-center space-x-4">
                        <img src="${item.imageUrl}" alt="${item.name}" class="w-16 h-16 object-cover rounded">
                        <div>
                            <h4 class="font-medium">${item.name}</h4>
                            <p class="text-gray-600">${item.price} ₽ x ${item.quantity}</p>
                        </div>
                    </div>
                    <button onclick="removeFromCart('${item.id}')" class="text-red-600 hover:text-red-800">Удалить</button>
                </div>`;
            }).join('');
            cartTotal.textContent = `${total} ₽`;
            window.removeFromCart = (productId) => {
                const newCart = cart.filter(item => item.id !== productId);
                localStorage.setItem('cart', JSON.stringify(newCart));
                this.showCart();
            };
        }
        // Автодополнение для сообщения заказа
        const orderInput = document.getElementById('orderMessageInput');
        const ac = document.getElementById('orderMessageAutocomplete');
        const suggestions = [
            this.t('orderMsg1'),
            this.t('orderMsg2'),
            this.t('orderMsg3'),
            this.t('orderMsg4')
        ];
        if (orderInput && ac) {
            orderInput.addEventListener('input', (e) => {
                const val = e.target.value.toLowerCase();
                const filtered = suggestions.filter(s => s.toLowerCase().includes(val)).slice(0, 5);
                if (filtered.length > 0 && val) {
                    ac.innerHTML = filtered.map(s => `<div class='px-4 py-2 hover:bg-blue-100 cursor-pointer'>${s}</div>`).join('');
                    ac.style.display = 'block';
                    ac.classList.remove('hidden');
                } else {
                    ac.style.display = 'none';
                    ac.classList.add('hidden');
                }
                ac.querySelectorAll('div').forEach(div => {
                    div.addEventListener('mousedown', () => {
                        orderInput.value = div.textContent;
                        ac.style.display = 'none';
                        ac.classList.add('hidden');
                    });
                });
            });
            orderInput.addEventListener('blur', () => setTimeout(() => { ac.style.display = 'none'; ac.classList.add('hidden'); }, 200));
        }
    }    show404() {
        if (!this.mainContent) return;
        
        this.mainContent.innerHTML = `
            <div class="container mx-auto px-4 py-8 text-center">
                <h2 class="text-2xl font-semibold mb-4">404 - Страница не найдена</h2>
                <p class="mb-4">Извините, запрашиваемая страница не существует.</p>
                <a href="#/" class="btn-primary">Вернуться на главную</a>
            </div>
        `;
    }

    async showCategory(category) {
        if (!this.mainContent) return;

        const categoryNames = {
            'clothing': this.t('clothing'),
            'electronics': this.t('electronics')
        };

        this.mainContent.innerHTML = `
            <div class="container mx-auto px-4 py-8">
                <h2 class="text-2xl font-semibold mb-6">${categoryNames[category] || category}</h2>
                <div id="products" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <!-- Products will be loaded here -->
                </div>
            </div>
        `;

        // Trigger products filtering
        const productManager = new ProductManager();
        await productManager.filterByCategory(category);
    }

    addSettingsLink() {
        // Добавить ссылку "Настройки" в шапку, если нет
        const nav = document.querySelector('nav .flex.items-center.space-x-4');
        if (nav && !nav.querySelector('.settings-link')) {
            const link = document.createElement('a');
            link.href = '#/settings';
            link.className = 'hover:text-blue-600 settings-link';
            link.textContent = this.t('settings');
            nav.appendChild(link);
        }
    }

    async showSettings() {
        if (!this.mainContent) return;
        const currentLang = this.getLang();
        const currentTheme = document.body.getAttribute('data-theme') || 'light';
        this.mainContent.innerHTML = `
            <div class="container mx-auto px-4 py-8">
                <div class="bg-white rounded-lg shadow-md p-6 max-w-lg mx-auto">
                    <h2 class="text-2xl font-semibold mb-6">${this.t('settings')}</h2>
                    <div class="mb-4">
                        <label class="block text-gray-700 mb-2">${this.t('language')}</label>
                        <select id="langSelect" class="w-full px-4 py-2 border rounded-lg">
                            <option value="ru" ${currentLang==='ru'?'selected':''}>Русский</option>
                            <option value="en" ${currentLang==='en'?'selected':''}>English</option>
                            <option value="tr" ${currentLang==='tr'?'selected':''}>Türkçe</option>
                        </select>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 mb-2">${this.t('theme')}</label>
                        <button id="themeToggleSettings" class="btn-primary">${currentTheme==='dark'?this.t('dark'):this.t('light')}</button>
                    </div>
                    <div class="mb-4">
                        <a href="#/profile" class="text-blue-600 hover:underline">${this.t('editProfile')}</a>
                    </div>
                </div>
            </div>
        `;
        // Язык
        const langSelect = document.getElementById('langSelect');
        if (langSelect) {
            langSelect.addEventListener('change', (e) => {
                this.setLang(e.target.value);
                window.location.reload();
            });
        }
        // Тема
        const themeBtn = document.getElementById('themeToggleSettings');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                const body = document.body;
                const current = body.getAttribute('data-theme') || 'light';
                const next = current === 'light' ? 'dark' : 'light';
                body.setAttribute('data-theme', next);
                localStorage.setItem('theme', next);
                themeBtn.textContent = this.t(next);
            });
        }
    }

    // --- Мультиязычность ---
    translations = {
        ru: {
            settings: 'Настройки',
            language: 'Язык',
            theme: 'Тема',
            dark: 'Тёмная',
            light: 'Светлая',
            editProfile: 'Редактировать профиль',
            categories: 'Категории',
            clothing: 'Одежда',
            electronics: 'Техника',
            popularProducts: 'Популярные товары',
            cart: 'Корзина',
            total: 'Итого',
            orderMessagePlaceholder: 'Комментарий к заказу',
            orderWhatsapp: 'Заказать через WhatsApp',
            orderTelegram: 'Заказать через Telegram',
            orderMsg1: 'Позвоните мне для уточнения деталей',
            orderMsg2: 'Доставка по адресу',
            orderMsg3: 'Свяжитесь со мной в Telegram',
            orderMsg4: 'Хотел бы узнать о скидках',
            adminPanel: 'Панель администратора',
            productName: 'Название товара',
            productDesc: 'Описание',
            productPrice: 'Цена',
            productCategory: 'Категория',
            productImage: 'Изображение',
            addProduct: 'Добавить товар',
            manageProducts: 'Управление товарами',
            loginTitle: 'Вход в систему',
            password: 'Пароль',
            loginBtn: 'Войти',
            noAccount: 'Нет аккаунта?',
            registerBtn: 'Зарегистрироваться',
            profile: 'Профиль',
            name: 'Имя',
            notSpecified: 'Не указано',
            regDate: 'Дата регистрации',
            changeName: 'Изменить имя',
            newName: 'Новое имя',
            save: 'Сохранить',
            logout: 'Выйти',
            myOrders: 'Мои заказы',
            ordersSoon: 'История заказов появится в будущих обновлениях',
            mainSlogan: 'Ваш стильный магазин турецкой одежды и техники',
        },
        en: {
            settings: 'Settings',
            language: 'Language',
            theme: 'Theme',
            dark: 'Dark',
            light: 'Light',
            editProfile: 'Edit Profile',
            categories: 'Categories',
            clothing: 'Clothing',
            electronics: 'Electronics',
            popularProducts: 'Popular Products',
            cart: 'Cart',
            total: 'Total',
            orderMessagePlaceholder: 'Order comment',
            orderWhatsapp: 'Order via WhatsApp',
            orderTelegram: 'Order via Telegram',
            orderMsg1: 'Call me for details',
            orderMsg2: 'Delivery to address',
            orderMsg3: 'Contact me on Telegram',
            orderMsg4: 'I want to know about discounts',
            adminPanel: 'Admin Panel',
            productName: 'Product Name',
            productDesc: 'Description',
            productPrice: 'Price',
            productCategory: 'Category',
            productImage: 'Image',
            addProduct: 'Add Product',
            manageProducts: 'Manage Products',
            loginTitle: 'Login',
            password: 'Password',
            loginBtn: 'Login',
            noAccount: 'No account?',
            registerBtn: 'Register',
            profile: 'Profile',
            name: 'Name',
            notSpecified: 'Not specified',
            regDate: 'Registration date',
            changeName: 'Change name',
            newName: 'New name',
            save: 'Save',
            logout: 'Logout',
            myOrders: 'My Orders',
            ordersSoon: 'Order history will appear in future updates',
            mainSlogan: 'Your stylish Turkish fashion & tech store',
        },
        tr: {
            settings: 'Ayarlar',
            language: 'Dil',
            theme: 'Tema',
            dark: 'Koyu',
            light: 'Açık',
            editProfile: 'Profili Düzenle',
            categories: 'Kategoriler',
            clothing: 'Giyim',
            electronics: 'Elektronik',
            popularProducts: 'Popüler Ürünler',
            cart: 'Sepet',
            total: 'Toplam',
            orderMessagePlaceholder: 'Sipariş yorumu',
            orderWhatsapp: 'WhatsApp ile Sipariş',
            orderTelegram: 'Telegram ile Sipariş',
            orderMsg1: 'Detaylar için beni arayın',
            orderMsg2: 'Adrese teslimat',
            orderMsg3: 'Benimle Telegram üzerinden iletişime geçin',
            orderMsg4: 'İndirimler hakkında bilgi almak istiyorum',
            adminPanel: 'Yönetici Paneli',
            productName: 'Ürün Adı',
            productDesc: 'Açıklama',
            productPrice: 'Fiyat',
            productCategory: 'Kategori',
            productImage: 'Görsel',
            addProduct: 'Ürün Ekle',
            manageProducts: 'Ürünleri Yönet',
            loginTitle: 'Giriş',
            password: 'Şifre',
            loginBtn: 'Giriş Yap',
            noAccount: 'Hesabınız yok mu?',
            registerBtn: 'Kayıt Ol',
            profile: 'Profil',
            name: 'İsim',
            notSpecified: 'Belirtilmedi',
            regDate: 'Kayıt tarihi',
            changeName: 'İsmi değiştir',
            newName: 'Yeni isim',
            save: 'Kaydet',
            logout: 'Çıkış Yap',
            myOrders: 'Siparişlerim',
            ordersSoon: 'Sipariş geçmişi yakında eklenecek',
            mainSlogan: 'Şık Türk moda ve teknoloji mağazanız',
        }
    };
    t(key) {
        const lang = this.getLang();
        return (this.translations[lang] && this.translations[lang][key]) || this.translations['ru'][key] || key;
    }
    getLang() {
        return localStorage.getItem('lang') || 'ru';
    }
    setLang(lang) {
        localStorage.setItem('lang', lang);
    }
}

// Initialize the application
new App();
