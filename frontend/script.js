document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('login-button');
    const logoutBtn = document.getElementById('logout-button');
    const token = localStorage.getItem('token');
    const errorDiv = document.getElementById('error');

    // Se o token estiver armazenado, o usuário está logado
    if (token) {
        document.getElementById('login-container').style.display = 'none';
        logoutBtn.style.display = 'block';
        fetchProducts(token);
    } else {
        document.getElementById('loading').style.display = 'none';
        logoutBtn.style.display = 'none';
    }

    // Função de login
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
            errorDiv.style.display = 'none';  // Limpar erro de credenciais inválidas
            fetchProducts(data.token);
        } catch (err) {
            errorDiv.textContent = err.message;
            errorDiv.style.display = 'block';
        }
    });

    // Função de logout
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        logoutBtn.style.display = 'none';
        document.getElementById('login-container').style.display = 'block';
        document.getElementById('products-container').innerHTML = '';
        errorDiv.style.display = 'none';  // Limpar erro ao deslogar
    });
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
