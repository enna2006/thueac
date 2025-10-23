document.addEventListener('DOMContentLoaded', () => {

    // --- KHỞI TẠO BIẾN TOÀN CỤC (DEMO) ---
    const formatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let users = JSON.parse(localStorage.getItem('users')) || [];
    let purchases = JSON.parse(localStorage.getItem('purchases')) || [];
    let currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || null;

    // --- NÂNG CẤP "CHUYÊN SÂU" 1: HỆ THỐNG THÔNG BÁO "TOAST" (SIÊU PRO) ---
    const toastEl = document.getElementById('liveToast');
    let toastBootstrap;
    if (toastEl) { 
        toastBootstrap = new bootstrap.Toast(toastEl);
    }
    
    function showToast(title, body, type = 'success') {
        if (!toastBootstrap) return; 
        const toastTitle = document.getElementById('toast-title');
        const toastBody = document.getElementById('toast-body');
        const toastHeader = toastEl.querySelector('.toast-header');
        toastTitle.textContent = title;
        toastBody.textContent = body;
        if (type === 'danger') {
            toastHeader.classList.add('text-bg-danger');
            toastHeader.classList.remove('text-bg-success');
            toastTitle.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i>' + title;
        } else {
            toastHeader.classList.remove('text-bg-danger');
            toastHeader.classList.add('text-bg-success');
            toastTitle.innerHTML = '<i class="fas fa-check-circle me-2"></i>' + title;
        }
        toastBootstrap.show();
    }
    // ------------------------------------------------------------------

    // --- HÀM LƯU TRỮ (DEMO) ---
    function saveCart() { localStorage.setItem('cart', JSON.stringify(cart)); updateNavbar(); }
    function saveUsers() { localStorage.setItem('users', JSON.stringify(users)); }
    function savePurchases() { localStorage.setItem('purchases', JSON.stringify(purchases)); }

    // --- HÀM CẬP NHẬT GIAO DIỆN NAVBAR (NÂNG CẤP CHUYÊN SÂU) ---
    function updateNavbar() {
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
        }
        const loginBtn = document.querySelector('.btn-login');
        if (loginBtn) {
            if (currentUser) {
                // ĐÃ ĐĂNG NHẬP: Đổi thành "Tài Khoản" và link tới profile.html
                loginBtn.textContent = 'Tài Khoản';
                loginBtn.href = 'profile.html'; 
                loginBtn.onclick = null;
            } else {
                // CHƯA ĐĂNG NHẬP: Giữ nguyên
                loginBtn.textContent = 'Đăng Nhập';
                loginBtn.href = 'login.html';
                loginBtn.onclick = null;
            }
        }
    }
    updateNavbar(); // Chạy ngay khi tải trang

    // --- LOGIC TRANG CHỦ (index.html) ---
    document.querySelectorAll('.btn-buy').forEach(button => {
        button.addEventListener('click', () => {
            const card = button.closest('.product-card');
            const product = {
                id: card.dataset.id,
                name: card.dataset.name,
                price: parseFloat(card.dataset.price),
                image: card.querySelector('img').src,
                quantity: 1
            };
            const existingItem = cart.find(item => item.id === product.id);
            if (existingItem) {
                existingItem.quantity++;
            } else {
                cart.push(product);
            }
            saveCart();
            // ĐÃ THAY BẰNG TOAST "SIÊU PRO"
            showToast('Thành công!', `Đã thêm "${product.name}" vào giỏ hàng.`);
        });
    });

    // --- NÂNG CẤP "CHUYÊN SÂU" 2: THANH TÌM KIẾM (HOẠT ĐỘNG THẬT) ---
    const searchBar = document.querySelector('.search-bar');
    if (searchBar) {
        const searchInput = searchBar.querySelector('input');
        if (searchInput) {
            searchInput.addEventListener('keyup', () => {
                const query = searchInput.value.toLowerCase().trim();
                const productGrid = document.getElementById('products');
                if (productGrid) { 
                    const products = productGrid.querySelectorAll('.product-card');
                    products.forEach(card => {
                        const productName = card.querySelector('.card-title').textContent.toLowerCase();
                        if (productName.includes(query)) {
                            card.parentElement.style.display = 'block'; // Hiển thị (col)
                        } else {
                            card.parentElement.style.display = 'none'; // Ẩn (col)
                        }
                    });
                }
            });
        }
        searchBar.addEventListener('submit', (e) => {
            e.preventDefault();
        });
    }
    // ------------------------------------------------------------------

    // --- LOGIC TRANG GIỎ HÀNG (cart.html) (ĐÃ CÓ COUPON) ---
    const cartItemsContainer = document.getElementById('cart-items');
    if (cartItemsContainer) {
        displayCartItems();
    }
    
    function displayCartItems() {
        const cartEmpty = document.getElementById('cart-empty');
        const cartSummary = document.getElementById('cart-summary');
        const cartTableWrapper = document.getElementById('cart-table-wrapper');
        
        cartItemsContainer.innerHTML = '';
        if (cart.length === 0) {
            cartEmpty.classList.remove('hidden');
            cartSummary.classList.add('hidden');
            cartTableWrapper.classList.add('hidden');
        } else {
            cartEmpty.classList.add('hidden');
            cartSummary.classList.remove('hidden');
            cartTableWrapper.classList.remove('hidden');
            
            let subtotal = 0;
            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                subtotal += itemTotal;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><div class="d-flex align-items-center gap-2"><img src="${item.image}" alt="${item.name}" width="60" class="rounded"><span>${item.name}</span></div></td>
                    <td>${formatter.format(item.price)}</td>
                    <td><input class="form-control form-control-sm quantity-input" type="number" value="${item.quantity}" min="1" data-id="${item.id}" style="width: 70px;"></td>
                    <td class="fw-bold">${formatter.format(itemTotal)}</td>
                    <td><button class="btn btn-sm btn-outline-danger remove-item" data-id="${item.id}"><i class="fas fa-trash"></i></button></td>
                `;
                cartItemsContainer.appendChild(tr);
            });

            // --- LOGIC COUPON CHUYÊN SÂU ---
            let discountAmount = 0;
            let totalPrice = subtotal;
            const appliedCoupon = sessionStorage.getItem('appliedCoupon'); // Lấy mã đã lưu
            const discountRow = document.getElementById('discount-row');
            
            if (appliedCoupon === 'VIPPRO') {
                discountAmount = subtotal * 0.10; // Giảm 10%
                totalPrice = subtotal - discountAmount;
                
                // Hiển thị dòng giảm giá
                document.getElementById('discount-amount').textContent = `-${formatter.format(discountAmount)}`;
                discountRow.classList.remove('hidden');
                // Cập nhật lại ô input để user biết mã đã được áp dụng
                const couponInput = document.getElementById('coupon-code');
                if (couponInput) {
                    couponInput.value = 'VIPPRO';
                    couponInput.disabled = true; // Khóa ô lại
                    document.getElementById('apply-coupon-btn').textContent = 'Xóa';
                }
            } else {
                // Ẩn dòng giảm giá
                discountRow.classList.add('hidden');
                const couponInput = document.getElementById('coupon-code');
                if (couponInput) {
                    couponInput.value = '';
                    couponInput.disabled = false; // Mở khóa ô
                    document.getElementById('apply-coupon-btn').textContent = 'Áp dụng';
                }
            }
            // --- KẾT THÚC LOGIC COUPON ---

            document.getElementById('subtotal-price').textContent = formatter.format(subtotal);
            document.getElementById('total-price').textContent = formatter.format(totalPrice); // Hiển thị tổng tiền cuối cùng
            addCartEventListeners();
        }
    }

    function addCartEventListeners() {
        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', (e) => {
                const idToRemove = e.currentTarget.dataset.id;
                cart = cart.filter(item => item.id !== idToRemove);
                saveCart();
                displayCartItems();
            });
        });
        document.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const idToUpdate = e.currentTarget.dataset.id;
                const newQuantity = parseInt(e.currentTarget.value);
                const item = cart.find(item => item.id === idToUpdate);
                if (item && newQuantity > 0) { item.quantity = newQuantity; saveCart(); displayCartItems(); }
            });
        });
    }

    // --- LOGIC TRANG THANH TOÁN (checkout.html) (ĐÃ CÓ QR) ---
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        const emailInput = document.getElementById('email');
        if (currentUser && emailInput) {
            emailInput.value = currentUser.email;
            emailInput.readOnly = true;
        }
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (cart.length === 0) {
                showToast('Lỗi!', 'Giỏ hàng của bạn đang trống!', 'danger');
                return;
            }
            const email = document.getElementById('email').value;
            // Lấy tổng tiền cuối cùng (sau khi giảm giá) từ trang giỏ hàng
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            let discount = 0;
            if (sessionStorage.getItem('appliedCoupon') === 'VIPPRO') {
                discount = subtotal * 0.10;
            }
            const finalTotal = subtotal - discount;

            const newPurchases = cart.map(item => ({
                userEmail: email.toLowerCase(),
                productName: item.name,
                price: item.price, // Lưu giá gốc
                purchaseDate: new Date().toISOString()
            }));
            
            // Cách mới "chuyên sâu" hơn: Lưu 1 đơn hàng
            purchases.push({
                orderId: `VIP${Math.floor(Math.random() * 100000)}`,
                userEmail: email.toLowerCase(),
                items: newPurchases, // Mảng các sản phẩm
                total: finalTotal,
                discount: discount,
                purchaseDate: new Date().toISOString()
            });

            savePurchases();
            cart = [];
            saveCart();
            sessionStorage.removeItem('appliedCoupon'); // Xóa coupon sau khi mua
            
            showToast('Đặt hàng thành công!', 'Cảm ơn bạn đã mua hàng. Đang chuyển về Trang chủ...');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000); 
        });

        // Tạo một mã đơn hàng duy nhất
        const orderId = `VIP${Math.floor(Math.random() * 100000)}`;
        
        // Gán mã đơn hàng cho cả 2 phương thức (MOMO và Bank)
        const momoOrderIdEl = document.getElementById('momo-order-id');
        const bankOrderIdEl = document.getElementById('bank-order-id');
        
        if (momoOrderIdEl) {
            momoOrderIdEl.textContent = orderId;
        }
        if (bankOrderIdEl) {
            bankOrderIdEl.textContent = orderId;
        }
        // Bootstrap's collapse component (data-bs-toggle) đã tự động xử lý
        // việc ẩn/hiện, chúng ta không cần viết JS cho việc đó nữa.
    }

    // --- LOGIC TRANG BẢO HÀNH (warranty.html) ---
    const warrantyForm = document.getElementById('warrantyForm');
    if (warrantyForm) {
        warrantyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('warranty-email').value.toLowerCase();
            const resultDiv = document.getElementById('warranty-result');
            const resultList = document.getElementById('warranty-list');
            
            const userPurchases = purchases.filter(p => p.userEmail === email);
            
            resultList.innerHTML = '';
            if (userPurchases.length === 0) {
                resultList.innerHTML = '<p class="text-muted">Không tìm thấy thông tin mua hàng cho email này.</p>';
            } else {
                userPurchases.forEach(order => {
                    order.items.forEach(item => { 
                        const purchaseDate = new Date(item.purchaseDate);
                        const expiryDate = new Date(purchaseDate);
                        expiryDate.setFullYear(expiryDate.getFullYear() + 1); // Bảo hành 1 năm
                        const today = new Date();
                        const isExpired = today > expiryDate;
                        const itemHTML = `
                            <div class="card product-card">
                                <div class="card-body">
                                    <h5 class="card-title fw-bold">${item.productName}</h5>
                                    <p class="card-text mb-1">Ngày mua: ${purchaseDate.toLocaleDateString('vi-VN')}</p>
                                    <p class="card-text mb-2">Ngày hết hạn: ${expiryDate.toLocaleDateString('vi-VN')}</p>
                                    <strong class="h5 ${isExpired ? 'text-danger' : 'text-success'}">
                                        ${isExpired ? 'Đã Hết Hạn' : 'Còn Hạn Bảo Hành'}
                                    </strong>
                                </div>
                            </div>`;
                        resultList.innerHTML += itemHTML;
                    });
                });
            }
            resultDiv.classList.remove('hidden');
        });
    }

    // --- LOGIC TRANG TÀI KHOẢN (login.html) ---
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authMessage = document.getElementById('auth-message');
    if (loginForm && registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value.toLowerCase();
            const password = document.getElementById('register-password').value;
            if (users.find(user => user.email === email)) {
                authMessage.textContent = 'Email này đã được đăng ký!';
                authMessage.classList.remove('alert-success', 'hidden');
                authMessage.classList.add('alert-danger');
                return;
            }
            users.push({ name, email, password });
            saveUsers();
            authMessage.textContent = 'Đăng ký thành công! Vui lòng chuyển qua tab Đăng nhập.';
            authMessage.classList.remove('alert-danger', 'hidden');
            authMessage.classList.add('alert-success');
        });
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.toLowerCase();
            const password = document.getElementById('login-password').value;
            const user = users.find(u => u.email === email && u.password === password);
            if (user) {
                currentUser = { email: user.email, name: user.name };
                sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
                showToast('Đăng nhập thành công!', `Chào mừng ${user.name}! Đang chuyển về trang chủ...`);
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                authMessage.textContent = 'Sai email hoặc mật khẩu!';
                authMessage.classList.remove('alert-success', 'hidden');
                authMessage.classList.add('alert-danger');
            }
        });
    }
    
    // --- NÂNG CẤP "CHUYÊN SÂU" 3: TRANG TÀI KHOẢN (profile.html) ---
    const profileName = document.getElementById('profile-name');
    if (profileName) { // Kiểm tra xem có phải trang profile.html không
        if (currentUser) {
            // Đã đăng nhập
            document.getElementById('profile-name').textContent = `Chào, ${currentUser.name}`;
            document.getElementById('profile-email').textContent = currentUser.email;
            const orderList = document.getElementById('order-history-list');
            const noOrders = document.getElementById('no-orders');
            
            const userPurchases = purchases.filter(p => p.userEmail === currentUser.email);
            
            if (userPurchases.length === 0) {
                noOrders.classList.remove('hidden');
            } else {
                noOrders.classList.add('hidden');
                orderList.innerHTML = ''; // Xóa chữ "Không có đơn hàng"
                
                userPurchases.forEach(order => {
                    const purchaseDate = new Date(order.purchaseDate);
                    
                    const orderCard = document.createElement('div');
                    orderCard.className = 'card product-card';
                    
                    let itemsHTML = '';
                    order.items.forEach(item => {
                        itemsHTML += `<li class="list-group-item">${item.productName} - ${formatter.format(item.price)}</li>`;
                    });

                    orderCard.innerHTML = `
                        <div class="card-header fw-bold d-flex justify-content-between">
                            <span>Đơn hàng: #${order.orderId}</span>
                            <span>${purchaseDate.toLocaleDateString('vi-VN')}</span>
                        </div>
                        <ul class="list-group list-group-flush">
                            ${itemsHTML}
                        </ul>
                        <div class="card-footer">
                            ${order.discount > 0 ? `<div class="text-danger">Giảm giá: -${formatter.format(order.discount)}</div>` : ''}
                            <div class="h5 fw-bold text-end">Tổng cộng: <span class="text-warning">${formatter.format(order.total)}</span></div>
                        </div>
                    `;
                    orderList.appendChild(orderCard);
                });
            }
        } else {
            // Chưa đăng nhập
            showToast('Lỗi!', 'Bạn cần đăng nhập để xem trang này.', 'danger');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
    }
    // ------------------------------------------------------------------

    // --- LOGIC CHUNG (CHO TẤT CẢ CÁC TRANG) ---
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    if (scrollToTopBtn) {
        window.onscroll = () => {
            scrollToTopBtn.style.display = (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) ? "flex" : "none";
        };
        scrollToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- LOGIC "CHUYÊN SÂU" MỚI CHO TRANG GIỎ HÀNG (COUPON) ---
    const applyCouponBtn = document.getElementById('apply-coupon-btn');
    const couponCodeInput = document.getElementById('coupon-code');

    if (applyCouponBtn) { // Chỉ chạy nếu đang ở trang cart.html
        applyCouponBtn.addEventListener('click', () => {
            const currentCoupon = sessionStorage.getItem('appliedCoupon');

            if (currentCoupon) {
                sessionStorage.removeItem('appliedCoupon');
                showToast('Đã xóa mã', 'Đã xóa mã giảm giá thành công.');
                displayCartItems(); // Tính toán lại tổng tiền
            } else {
                const code = couponCodeInput.value.trim().toUpperCase(); // Viết hoa code cho "pro"
                if (code === 'VIPPRO') {
                    sessionStorage.setItem('appliedCoupon', 'VIPPRO');
                    showToast('Thành công!', 'Đã áp dụng mã giảm giá 10%!');
                    displayCartItems(); // Tính toán lại tổng tiền
                } else {
                    showToast('Lỗi!', 'Mã giảm giá không hợp lệ.', 'danger');
                }
            }
        });
    }
});