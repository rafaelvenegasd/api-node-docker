import { Router } from 'express';
import { CustomerController } from '../controllers/customerController';
import { authenticateServiceToken } from '../middleware/auth';

const router = Router();
const customerController = new CustomerController();

router.post('/customers', customerController.createCustomer.bind(customerController));
router.get('/customers/:id', customerController.getCustomer.bind(customerController));
router.get('/customers', customerController.getCustomers.bind(customerController));
router.put('/customers/:id', customerController.updateCustomer.bind(customerController));
router.delete('/customers/:id', customerController.deleteCustomer.bind(customerController));

router.get('/internal/customers/:id',
  authenticateServiceToken,
  customerController.getInternalCustomer.bind(customerController)
);

export default router;