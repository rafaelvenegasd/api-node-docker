CREATE TABLE customers (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), email VARCHAR(255), phone VARCHAR(50), created_at DATETIME);
CREATE TABLE products (id INT AUTO_INCREMENT PRIMARY KEY, sku VARCHAR(100), name VARCHAR(255), price_cents INT, stock INT, created_at DATETIME);
CREATE TABLE orders (id INT AUTO_INCREMENT PRIMARY KEY, customer_id INT, status VARCHAR(20), total_cents INT, created_at DATETIME);
CREATE TABLE order_items (id INT AUTO_INCREMENT PRIMARY KEY, order_id INT, product_id INT, qty INT, unit_price_cents INT, subtotal_cents INT);
CREATE TABLE idempotency_keys (key_value VARCHAR(255) PRIMARY KEY, target_type VARCHAR(50), target_id INT, status VARCHAR(50), response_body TEXT, created_at DATETIME, expires_at DATETIME);