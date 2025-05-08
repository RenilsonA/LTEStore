document.addEventListener('DOMContentLoaded', () => {
    const showLoginFormButton = document.getElementById('show-login-form-button');
    const logoutBtn = document.getElementById('logout-button');

    const loginContainer = document.getElementById('login-container'); 
    const loginSubmitBtn = document.getElementById('login-button'); 
    const cancelLoginBtn = document.getElementById('cancel-login-button');

    const productsContainer = document.getElementById('products-container');
    const errorDiv = document.getElementById('error');
    const loadingDiv = document.getElementById('loading');
    const paymentModal = document.getElementById('paymentModal');
    const closePaymentModalButton = document.querySelector('.close-button');
    const pixPaymentBtn = document.getElementById('pixPaymentBtn');
    const creditCardPaymentBtn = document.getElementById('creditCardPaymentBtn');
    let selectedProductId = null;

    function showProductsAndHideLogin() {
        productsContainer.style.display = 'grid';
        loginContainer.style.display = 'none';
        errorDiv.style.display = 'none'; 
    }

    function showLoginFormAndHideProducts() {
        loginContainer.style.display = 'block';
        productsContainer.style.display = 'none';
        showLoginFormButton.style.display = 'none'; 
        errorDiv.textContent = 'Faça login para continuar.';
        errorDiv.style.display = 'block';
    }

    function updateUserLoginUI(isLoggedIn) {
        if (isLoggedIn) {
            showLoginFormButton.style.display = 'none';
            logoutBtn.style.display = 'block';
            loginContainer.style.display = 'none'; 
        } else {
            showLoginFormButton.style.display = 'block';
            logoutBtn.style.display = 'none';
            loginContainer.style.display = 'none'; 
        }
        productsContainer.style.display = 'grid';
    }

    async function checkLoginStatusAndLoadProducts() {
        loadingDiv.style.display = 'block';
        errorDiv.style.display = 'none';
        const token = localStorage.getItem('token');
        let currentTokenForProducts = null;

        showLoginFormButton.style.display = 'none';
        logoutBtn.style.display = 'none';
        loginContainer.style.display = 'none';


        if (token) {
            try {
                const verifyResponse = await fetch('http://localhost:5001/verify', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (verifyResponse.ok) {
                    updateUserLoginUI(true);
                    currentTokenForProducts = token;
                } else {
                    localStorage.removeItem('token');
                    updateUserLoginUI(false);
                }
            } catch (error) {
                console.error('Erro ao verificar token:', error);
                localStorage.removeItem('token');
                updateUserLoginUI(false);
            }
        } else {
            updateUserLoginUI(false);
        }
        await fetchProducts(currentTokenForProducts);
    }

    checkLoginStatusAndLoadProducts();

    showLoginFormButton.addEventListener('click', () => {
        showLoginFormAndHideProducts();
    });

    cancelLoginBtn.addEventListener('click', () => {
        showProductsAndHideLogin();
        updateUserLoginUI(false);
    });

    loginSubmitBtn.addEventListener('click', async () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        loadingDiv.style.display = 'block';
        errorDiv.style.display = 'none';

        try {
            const response = await fetch('http://localhost:5001/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao autenticar');
            }
            localStorage.setItem('token', data.token);
            updateUserLoginUI(true);
            showProductsAndHideLogin(); 
            await fetchProducts(data.token);
        } catch (err) {
            errorDiv.textContent = err.message; 
            errorDiv.style.display = 'block';   
            loadingDiv.style.display = 'none';
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        updateUserLoginUI(false);
        showProductsAndHideLogin(); 
        fetchProducts(); 
    });

    productsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('buy-btn')) {
            selectedProductId = event.target.dataset.productId;
            const token = localStorage.getItem('token');
            if (token && logoutBtn.style.display === 'block') {
                paymentModal.style.display = 'block';
            } else {
                showLoginFormAndHideProducts(); 
            }
        }
    });

    closePaymentModalButton.addEventListener('click', () => {
        paymentModal.style.display = 'none';
        selectedProductId = null;
    });

    window.addEventListener('click', (event) => {
        if (event.target === paymentModal) {
            paymentModal.style.display = 'none';
            selectedProductId = null;
        }
    });

    pixPaymentBtn.addEventListener('click', () => initiatePayment('pix'));
    creditCardPaymentBtn.addEventListener('click', () => initiatePayment('credit_card'));

    async function initiatePayment(paymentMethod) {
        const token = localStorage.getItem('token');
        if (!token || !selectedProductId) {
            alert('Você precisa estar logado e selecionar um produto para comprar.');
            if (!token) {
                updateUserLoginUI(false);
                showLoginFormAndHideProducts();
            }
            paymentModal.style.display = 'none';
            return;
        }

        loadingDiv.style.display = 'block';
        errorDiv.style.display = 'none';

        try {
            const response = await fetch('http://localhost:5002/buy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ product_id: selectedProductId, payment_method: paymentMethod })
            });
            const data = await response.json();
            if (response.ok) {
                alert(data.message || 'Obrigado pela sua compra!');
            } else {
                if (response.status === 401) {
                     alert('Sua sessão expirou. Por favor, faça login novamente.');
                     localStorage.removeItem('token'); 
                     updateUserLoginUI(false);         
                     showProductsAndHideLogin();       
                } else {
                    throw new Error(data.error || 'Erro ao registrar o pedido');
                }
            }
        } catch (error) {
            console.error('Erro na requisição de pedido:', error);
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        } finally {
            paymentModal.style.display = 'none';
            selectedProductId = null;
            loadingDiv.style.display = 'none';
        }
    }
});

async function fetchProducts(token) { 
    const container = document.getElementById('products-container');
    const loadingIndicator = document.getElementById('loading');
    const errorDisplay = document.getElementById('error');

    loadingIndicator.style.display = 'block';
    container.innerHTML = '';
    let success = false;
    const apiEndpoints = ['http://localhost:5000/products', 'http://127.0.0.1:5000/products'];

    for (const endpoint of apiEndpoints) {
        try {
            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const response = await fetch(endpoint, { headers });
            if (!response.ok) {
                console.warn(`Falha ao buscar produtos de ${endpoint}. Status: ${response.status}`);
                continue;
            }
            const products = await response.json();
            if (products.length === 0) {
                 if(apiEndpoints.indexOf(endpoint) === apiEndpoints.length -1 && !success){
                    if (errorDisplay.style.display === 'none' || errorDisplay.textContent === '') {
                        errorDisplay.textContent = 'Nenhum pacote disponível no momento.';
                        errorDisplay.style.display = 'block';
                    }
                 }
            } else {
                 container.innerHTML = products.map(product => `
                    <div class="product-card">
                        <h3>${product.name}</h3>
                        <p>${product.description || ''}</p>
                        <p><strong>Dados:</strong> ${product.data_volume}MB</p>
                        <p><strong>Validade:</strong> ${product.validity_days} dias</p>
                        <p class="price">R$ ${parseFloat(product.price).toFixed(2)}</p>
                        <span class="operator">${product.operator}</span>
                        <button class="buy-btn" data-product-id="${product.id}">Comprar</button>
                    </div>
                `).join('');
                 if (errorDisplay.textContent === 'Nenhum pacote disponível no momento.' || errorDisplay.textContent.includes("Erro ao conectar à API de produtos")) {
                    errorDisplay.style.display = 'none';
                 }
            }
            success = true;
            break;
        } catch (error) {
            console.error(`Erro ao acessar ${endpoint}:`, error);
        }
    }

    if (!success && (errorDisplay.style.display === 'none' || errorDisplay.textContent === '')) {
        errorDisplay.innerHTML = `<p>Erro ao conectar à API de produtos.</p>`;
        errorDisplay.style.display = 'block';
        container.style.display = 'none';
    } else if (success) {
        container.style.display = 'grid';
    }
    loadingIndicator.style.display = 'none';
}