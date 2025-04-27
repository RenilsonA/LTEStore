document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('login-button');
    const logoutBtn = document.getElementById('logout-button');
    const productsContainer = document.getElementById('products-container');
    const errorDiv = document.getElementById('error');
    const paymentModal = document.getElementById('paymentModal');
    const closeButton = document.querySelector('.close-button');
    const pixPaymentBtn = document.getElementById('pixPaymentBtn');
    const creditCardPaymentBtn = document.getElementById('creditCardPaymentBtn');
    let selectedProductId = null;

    if (localStorage.getItem('token')) {
        document.getElementById('login-container').style.display = 'none';
        logoutBtn.style.display = 'block';
        fetchProducts(localStorage.getItem('token'));
    } else {
        document.getElementById('loading').style.display = 'none';
        logoutBtn.style.display = 'none';
    }

    loginBtn.addEventListener('click', async () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

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
            document.getElementById('login-container').style.display = 'none';
            logoutBtn.style.display = 'block';
            errorDiv.style.display = 'none';
            fetchProducts(data.token);
        } catch (err) {
            errorDiv.textContent = err.message;
            errorDiv.style.display = 'block';
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        logoutBtn.style.display = 'none';
        document.getElementById('login-container').style.display = 'block';
        document.getElementById('products-container').innerHTML = '';
        errorDiv.style.display = 'none';
    });

    productsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('buy-btn')) {
            selectedProductId = event.target.dataset.productId;
            const token = localStorage.getItem('token');
            if (token) {
                console.log('Botão Comprar clicado. Produto ID:', selectedProductId);
                paymentModal.style.display = 'block';
            } else {
                alert('Você precisa estar logado para comprar.');
            }
        }
    });

    closeButton.addEventListener('click', () => {
        paymentModal.style.display = 'none';
        selectedProductId = null;
        console.log('Modal de pagamento fechado.');
    });

    window.addEventListener('click', (event) => {
        if (event.target === paymentModal) {
            paymentModal.style.display = 'none';
            selectedProductId = null;
            console.log('Modal de pagamento fechado ao clicar fora.');
        }
    });

    pixPaymentBtn.addEventListener('click', () => {
        console.log('Botão Pix clicado.');
        initiatePayment('pix');
    });

    creditCardPaymentBtn.addEventListener('click', () => {
        console.log('Botão Cartão de Crédito clicado.');
        initiatePayment('credit_card');
    });

    async function initiatePayment(paymentMethod) {
        const token = localStorage.getItem('token');
        if (!token || !selectedProductId) {
            alert('Erro ao iniciar o pagamento. Faça login novamente e tente novamente.');
            paymentModal.style.display = 'none';
            return;
        }

        console.log('Iniciando pedido para produto ID:', selectedProductId, 'com método:', paymentMethod);

        try {
            const response = await fetch('http://localhost:5002/buy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ product_id: selectedProductId, payment_method: paymentMethod })
            });

            console.log('Resposta do serviço de pedido:', response);

            if (response.ok) {
                const data = await response.json();
                alert(data.message || 'Obrigado pela sua compra!');
            } else {
                const data = await response.json();
                console.error('Erro ao registrar o pedido:', data);
                throw new Error(data.error || 'Erro ao registrar o pedido');
            }
        } catch (error) {
            console.error('Erro na requisição de pedido:', error);
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        } finally {
            paymentModal.style.display = 'none';
            selectedProductId = null;
            console.log('Processo de pedido finalizado.');
        }
    }
});

async function fetchProducts(token) {
    const container = document.getElementById('products-container');
    const loading = document.getElementById('loading');
    const errorDiv = document.getElementById('error');

    const apiEndpoints = [
        'http://localhost:5000/products',
        'http://127.0.0.1:5000/products'
    ];

    loading.style.display = 'block';
    let success = false;

    for (const endpoint of apiEndpoints) {
        try {
            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) continue;

            const products = await response.json();
            loading.style.display = 'none';

            if (products.length === 0) {
                errorDiv.textContent = 'Nenhum pacote disponível.';
                errorDiv.style.display = 'block';
                return;
            }

            container.innerHTML = products.map(product => `
                <div class="product-card">
                    <h3>${product.name}</h3>
                    <p>${product.description || ''}</p>
                    <p><strong>Dados:</strong> ${product.data_volume}MB</p>
                    <p><strong>Validade:</strong> ${product.validity_days} dias</p>
                    <p class="price">R$ ${product.price.toFixed(2)}</p>
                    <span class="operator">${product.operator}</span>
                    <button class="buy-btn" data-product-id="${product.id}">Comprar</button>
                </div>
            `).join('');

            success = true;
            break;

        } catch (error) {
            console.error(`Erro ao acessar ${endpoint}:`, error);
        }
    }

    if (!success) {
        loading.style.display = 'none';
        errorDiv.innerHTML = `
            <p>Erro ao conectar à API. Verifique:</p>
            <ul>
                <li>Se o backend de produtos está rodando</li>
                <li>Se o token é válido</li>
                <li>Se o servidor permite CORS</li>
            </ul>
        `;
        errorDiv.style.display = 'block';
    }
}