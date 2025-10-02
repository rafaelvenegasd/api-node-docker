import { Router } from 'express';
import { ProductController } from '../controllers/productController';

const router = Router();
const productController = new ProductController();

router.post('/products', productController.createProduct.bind(productController));
router.get('/products/:id', productController.getProduct.bind(productController));
router.get('/products', productController.getProducts.bind(productController));
router.patch('/products/:id', productController.updateProduct.bind(productController));

export default router;