// Products management and cart functionality
export class ProductManager {
    constructor() {
        this.db = window.app.db;
        this.storage = window.app.storage;
        this.productsContainer = document.getElementById('products');
        this.cart = JSON.parse(localStorage.getItem('cart') || '[]');
        this.setupEventListeners();
        this.loadProducts();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.querySelector('input[type="text"]');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
                this.showAutocomplete(e.target.value);
            });
            // Автодополнение: скрывать при потере фокуса
            searchInput.addEventListener('blur', () => {
                setTimeout(() => {
                    const ac = document.getElementById('autocompleteList');
                    if (ac) ac.style.display = 'none';
                }, 200);
            });
        }

        // Category filters
        document.querySelectorAll('[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = e.target.getAttribute('href');
                // Поддержка всех категорий
                if (href && (
                    href.includes('clothing') ||
                    href.includes('electronics') ||
                    href.includes('shoes') ||
                    href.includes('accessories')
                )) {
                    e.preventDefault();
                    const category = href.replace('#/category/', '');
                    this.filterByCategory(category);
                }
            });
        });

        // Cart management
        window.addEventListener('storage', (e) => {
            if (e.key === 'cart') {
                this.cart = JSON.parse(e.newValue || '[]');
                this.updateCartUI();
            }
        });
    }

    async loadProducts() {
        try {
            const querySnapshot = await this.db.collection('products')
                .orderBy('createdAt', 'desc')
                .get();
            
            const products = [];
            querySnapshot.forEach((doc) => {
                products.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            this.renderProducts(products);
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('Ошибка загрузки товаров');
        }
    }

    renderProducts(products) {
        if (!this.productsContainer) return;

        this.productsContainer.innerHTML = products.map(product => `
            <div class="product-card bg-white rounded-lg shadow-md p-4">
                <img src="${product.imageUrl}" alt="${product.name}" class="product-image mb-4">
                <h3 class="font-semibold text-lg mb-2">${product.name}</h3>
                <p class="text-gray-600 mb-2">${product.description}</p>
                <p class="text-lg font-bold text-blue-600 mb-4">${product.price} ₽</p>
                <div class="flex space-x-2">
                    <button class="btn-primary flex-1 add-to-cart-btn" data-id="${product.id}">
                        В корзину
                    </button>
                    <div class="flex flex-col space-y-1 items-end">
                        <a href="https://t.me/nurik1418" class="btn-primary text-center px-4 flex items-center" target="_blank">
                            <svg class="w-6 h-6 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.2-.04-.28-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.89.03-.25.34-.51.93-.78 3.63-1.58 6.06-2.62 7.29-3.13 3.47-1.45 4.19-1.7 4.66-1.71.1 0 .33.02.47.12.12.08.19.2.22.33.02.12.02.24.02.36z"/>
                            </svg>
                            <span>Telegram: <b>@nurik1418</b></span>
                        </a>
                        <a href="tel:+905061528830" class="btn-primary text-center px-4 flex items-center" style="margin-top:2px;">
                            <svg class="w-6 h-6 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.21c1.21.49 2.53.76 3.88.76a1 1 0 011 1v3.5a1 1 0 01-1 1C7.61 22 2 16.39 2 9.5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.35.27 2.67.76 3.88a1 1 0 01-.21 1.11l-2.2 2.2z"/>
                            </svg>
                            <span>Тел: <b>+905061528830</b></span>
                        </a>
                    </div>
                </div>
            </div>
        `).join('');

        // Add cart functionality with animation
        this.productsContainer.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = btn.getAttribute('data-id');
                this.animateAddToCart(btn);
                window.addToCart(productId);
            });
        });
        window.addToCart = (productId) => this.addToCart(productId);
    }

    animateAddToCart(btn) {
        // Найти картинку товара
        const card = btn.closest('.product-card');
        const img = card.querySelector('img');
        if (!img) return;
        const imgRect = img.getBoundingClientRect();
        const cartIcon = document.querySelector('a[href="#/cart"]');
        if (!cartIcon) return;
        const cartRect = cartIcon.getBoundingClientRect();
        // Клонировать картинку
        const flyingImg = img.cloneNode(true);
        flyingImg.style.position = 'fixed';
        flyingImg.style.left = imgRect.left + 'px';
        flyingImg.style.top = imgRect.top + 'px';
        flyingImg.style.width = imgRect.width + 'px';
        flyingImg.style.height = imgRect.height + 'px';
        flyingImg.style.zIndex = 9999;
        flyingImg.style.transition = 'all 0.8s cubic-bezier(.4,0,.2,1)';
        document.body.appendChild(flyingImg);
        // Запустить анимацию
        setTimeout(() => {
            flyingImg.style.left = cartRect.left + cartRect.width/2 - imgRect.width/4 + 'px';
            flyingImg.style.top = cartRect.top + cartRect.height/2 - imgRect.height/4 + 'px';
            flyingImg.style.width = imgRect.width/2 + 'px';
            flyingImg.style.height = imgRect.height/2 + 'px';
            flyingImg.style.opacity = '0.5';
        }, 10);
        // Удалить после анимации
        setTimeout(() => {
            flyingImg.remove();
        }, 850);
    }

    async addToCart(productId) {
        const product = await this.getProduct(productId);
        if (!product) return;

        const existingItem = this.cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                id: productId,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                quantity: 1
            });
        }

        this.saveCart();
        this.updateCartUI();
    }

    async getProduct(productId) {
        try {
            const doc = await this.db.collection('products').doc(productId).get();
            if (doc.exists) {
                return {
                    id: doc.id,
                    ...doc.data()
                };
            }
            return null;
        } catch (error) {
            console.error('Error getting product:', error);
            return null;
        }
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    updateCartUI() {
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
        
        if (!cartItems || !cartTotal) return;

        cartItems.innerHTML = this.cart.map(item => `
            <div class="flex items-center justify-between bg-white p-4 rounded-lg shadow">
                <div class="flex items-center space-x-4">
                    <img src="${item.imageUrl}" alt="${item.name}" class="w-16 h-16 object-cover rounded">
                    <div>
                        <h4 class="font-medium">${item.name}</h4>
                        <p class="text-gray-600">${item.price} ₽ x ${item.quantity}</p>
                    </div>
                </div>
                <button onclick="removeFromCart('${item.id}')" class="text-red-600 hover:text-red-800">
                    Удалить
                </button>
            </div>
        `).join('');

        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotal.textContent = `${total} ₽`;

        // Add remove functionality
        window.removeFromCart = (productId) => this.removeFromCart(productId);
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartUI();
    }

    async handleSearch(query) {
        if (!query) {
            this.loadProducts();
            return;
        }

        try {
            const querySnapshot = await this.db.collection('products')
                .where('searchTerms', 'array-contains', query.toLowerCase())
                .get();

            const products = [];
            querySnapshot.forEach((doc) => {
                products.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            this.renderProducts(products);
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Ошибка поиска');
        }
    }

    async filterByCategory(category) {
        try {
            const querySnapshot = await this.db.collection('products')
                .where('category', '==', category)
                .get();

            const products = [];
            querySnapshot.forEach((doc) => {
                products.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            this.renderProducts(products);
        } catch (error) {
            console.error('Filter error:', error);
            this.showError('Ошибка фильтрации');
        }
    }

    async showAutocomplete(query) {
        let ac = document.getElementById('autocompleteList');
        if (!ac) {
            ac = document.createElement('div');
            ac.id = 'autocompleteList';
            ac.className = 'absolute bg-white border rounded shadow-md w-64 z-50';
            const searchInput = document.querySelector('input[type="text"]');
            if (searchInput && searchInput.parentElement) {
                searchInput.parentElement.appendChild(ac);
            }
        }
        if (!query) {
            ac.style.display = 'none';
            return;
        }
        // Получить все продукты (или из кеша)
        if (!this._allProducts) {
            try {
                const querySnapshot = await this.db.collection('products').get();
                this._allProducts = [];
                querySnapshot.forEach((doc) => {
                    this._allProducts.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
            } catch {
                ac.style.display = 'none';
                return;
            }
        }
        // Фильтровать по названию
        const suggestions = this._allProducts.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
        if (suggestions.length === 0) {
            ac.style.display = 'none';
            return;
        }
        // Показать подсказки
        ac.innerHTML = suggestions.map(s => `
            <div class="p-2 cursor-pointer hover:bg-gray-100" onclick="selectSuggestion('${s.name}')">
                ${s.name}
            </div>
        `).join('');
        ac.style.display = 'block';

        // Select suggestion
        window.selectSuggestion = (productName) => {
            const searchInput = document.querySelector('input[type="text"]');
            if (searchInput) {
                searchInput.value = productName;
                this.handleSearch(productName);
            }
        }
    }

    showError(message) {
        // Реализация показа ошибки пользователю (например, через алерт или уведомление на странице)
        alert(message);
    }
}

window.productManager = new ProductManager();

// Service worker registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    });
}