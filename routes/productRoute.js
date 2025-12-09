import express from 'express';
import { upload } from '../configs/multer.js';
import authSeller from '../middlewares/authSeller.js';
import { addProduct, changeStock, productById, productList } from '../controllers/productController.js';
const productRouter = express.Router();

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err) {
    console.error('Multer error:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        message: 'File size too large. Maximum size is 5MB.' 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        success: false, 
        message: 'Too many files. Maximum is 4 files.' 
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        success: false, 
        message: 'Unexpected file field name. Use "images" as the field name.' 
      });
    }
    return res.status(400).json({ 
      success: false, 
      message: 'File upload error', 
      error: err.message 
    });
  }
  next();
};

productRouter.post("/add", upload.array("images", 4), handleMulterError, authSeller, addProduct);
productRouter.get("/list",productList);
productRouter.get("/:id",productById);
productRouter.post("/stock",authSeller,changeStock);
export default productRouter; 