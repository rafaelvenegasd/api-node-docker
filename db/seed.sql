INSERT INTO customers (id, name, email, phone, created_at) VALUES
(1, 'ACME Corporation', 'ops@acme.com', '+1-555-0101', '2024-01-01 10:00:00'),
(2, 'TechStart Inc', 'procurement@techstart.com', '+1-555-0102', '2024-01-01 11:00:00'),
(3, 'Global Industries', 'buyers@globalind.com', '+1-555-0103', '2024-01-01 12:00:00'),
(4, 'Innovate Ltd', 'orders@innovate.com', '+1-555-0104', '2024-01-01 13:00:00'),
(5, 'NextGen Solutions', 'purchasing@nextgen.com', '+1-555-0105', '2024-01-01 14:00:00');

INSERT INTO products (id, sku, name, price_cents, stock, created_at) VALUES
(1, 'LAPTOP-001', 'Professional Laptop', 129900, 50, '2024-01-01 09:00:00'),
(2, 'MOUSE-001', 'Wireless Mouse', 2599, 200, '2024-01-01 09:00:00'),
(3, 'KEYBOARD-001', 'Mechanical Keyboard', 8999, 75, '2024-01-01 09:00:00'),
(4, 'MONITOR-001', '27-inch Monitor', 29999, 30, '2024-01-01 09:00:00'),
(5, 'HEADSET-001', 'Noise-Cancelling Headset', 15999, 100, '2024-01-01 09:00:00'),
(6, 'WEBCAM-001', 'HD Webcam', 7999, 60, '2024-01-01 09:00:00'),
(7, 'DOCKING-001', 'USB-C Docking Station', 19999, 40, '2024-01-01 09:00:00'),
(8, 'BACKPACK-001', 'Laptop Backpack', 5999, 150, '2024-01-01 09:00:00'),
(9, 'MOUSEPAD-001', 'Gaming Mousepad', 1999, 300, '2024-01-01 09:00:00'),
(10, 'CABLE-001', 'USB-C Cable', 999, 500, '2024-01-01 09:00:00');

INSERT INTO orders (id, customer_id, status, total_cents, created_at) VALUES
(1, 1, 'CONFIRMED', 389700, '2024-01-01 14:00:00'),
(2, 2, 'CREATED', 159999, '2024-01-01 15:00:00'),
(3, 3, 'CONFIRMED', 899700, '2024-01-01 15:30:00'),
(4, 1, 'CANCELED', 259900, '2024-01-01 15:45:00');

INSERT INTO order_items (id, order_id, product_id, qty, unit_price_cents, subtotal_cents) VALUES
(1, 1, 2, 3, 2599, 7797),
(2, 1, 3, 2, 8999, 17998),
(3, 1, 4, 1, 29999, 29999),
(4, 1, 5, 5, 15999, 79995),
(5, 1, 8, 2, 5999, 11998),
(6, 1, 10, 10, 999, 9990),
(7, 2, 1, 1, 129900, 129900),
(8, 2, 6, 2, 7999, 15999),
(9, 2, 9, 3, 1999, 5997),
(10, 3, 1, 5, 129900, 649500),
(11, 3, 3, 3, 8999, 26997),
(12, 3, 4, 2, 29999, 59998),
(13, 3, 7, 3, 19999, 59997),
(14, 3, 10, 5, 999, 4995),
(15, 4, 1, 2, 129900, 259800);

INSERT INTO idempotency_keys (key_value, target_type, target_id, status, response_body, created_at, expires_at) VALUES
('order-confirm-001', 'order', 1, 'completed', '{"success": true, "orderId": 1, "status": "CONFIRMED"}', '2024-01-01 14:00:00', '2024-01-02 14:00:00'),
('order-confirm-002', 'order', 3, 'completed', '{"success": true, "orderId": 3, "status": "CONFIRMED"}', '2024-01-01 15:30:00', '2024-01-02 15:30:00'),
('order-cancel-001', 'order', 4, 'completed', '{"success": true, "orderId": 4, "status": "CANCELED"}', '2024-01-01 15:45:00', '2024-01-02 15:45:00');