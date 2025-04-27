import requests
import os
from urllib.parse import quote_plus
from dotenv import load_dotenv

load_dotenv()

PRODUCTS_SERVICE_URL = os.getenv('PRODUCTS_SERVICE_URL', 'http://localhost:5000')

class OrderService:
    def process_order(self, user_id, product_id, quantity=1, payment_method=None):
        product_url = f"{PRODUCTS_SERVICE_URL}/products/{product_id}"
        try:
            response = requests.get(product_url)
            response.raise_for_status()
            product_data = response.json()
            product_name = product_data.get('name', 'Produto Desconhecido')
            total_price = product_data.get('price', 0) * quantity
        except requests.exceptions.RequestException as e:
            raise ValueError(f"Falha ao obter o produto com ID {product_id}: {e}")
        except Exception:
            raise ValueError(f"Produto com ID {product_id} não encontrado.")

        order_details = {
            'user_id': user_id,
            'product_id': product_id,
            'product_name': product_name,
            'quantity': quantity,
            'total_price': total_price,
            'payment_method': payment_method,
            'order_date': 'agora'
        }

        print(f"Pedido registrado: {order_details}")

        return {'message': 'Obrigado pela sua compra!', 'order_id': 'TEMP_' + str(user_id) + '_' + str(product_id)}