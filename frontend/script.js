document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('products-container');
    const loading = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    
    // Tentativas de endpoints alternativos
    const apiEndpoints = [
        'http://localhost:5000/products',
        'http://127.0.0.1:5000/products'
    ];

    let success = false;

    for (const endpoint of apiEndpoints) {
        try {
            const response = await fetch(endpoint);
            
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
            console.error(`Falha no endpoint ${endpoint}:`, error);
            continue;
        }
    }

    if (!success) {
        loading.style.display = 'none';
        errorDiv.innerHTML = `
            <p>Não foi possível conectar à API. Verifique:</p>
            <ol>
                <li>Se o servidor backend está rodando (python app.py)</li>
                <li>Se não há erros no terminal do backend</li>
                <li>Se a URL está correta: http://localhost:5000/products</li>
            </ol>
            <p>Erro técnico: NetworkError when attempting to fetch resource</p>
        `;
        errorDiv.style.display = 'block';
    }
});