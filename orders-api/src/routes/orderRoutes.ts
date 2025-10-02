import { Router } from 'express';
import { OrderController } from '../controllers/orderController';

const router = Router();
const orderController = new OrderController();

router.post('/orders', orderController.createOrder.bind(orderController));
router.get('/orders/:id', orderController.getOrder.bind(orderController));
router.get('/orders', orderController.getOrders.bind(orderController));
router.post('/orders/:id/confirm', orderController.confirmOrder.bind(orderController));
router.post('/orders/:id/cancel', orderController.cancelOrder.bind(orderController));

export default router;