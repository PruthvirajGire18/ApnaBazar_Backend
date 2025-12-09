import { v2 as cloudinary } from 'cloudinary';
import Product from '../models/Product.js';
import fs from 'fs';
import path from 'path';
// add product =/api/product/add
export const addProduct = async (req, res) => {
  const uploadedFiles = []; // Track files for cleanup
  try {
    console.log('----- /api/product/add hit hua -----');
    console.log('BODY:', req.body);
    console.log('FILES:', req.files);

    if (!req.body.productData) {
      return res.status(400).json({ success: false, message: 'productData is required' });
    }

    let productData;
    try {
      productData = JSON.parse(req.body.productData);
    } catch (err) {
      console.error('JSON parse error:', err);
      return res.status(400).json({ success: false, message: 'Invalid JSON in productData', error: err.message });
    }

    const images = req.files;
    if (!images || images.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one image is required' });
    }

    // Upload images to Cloudinary
    const imagesUrl = [];
    for (const item of images) {
      try {
        if (!item.path) {
          console.error('File path is missing:', item);
          continue;
        }
        
        // Check if file exists
        if (!fs.existsSync(item.path)) {
          console.error('File does not exist:', item.path);
          continue;
        }

        console.log('Uploading file to Cloudinary:', item.path);
        const result = await cloudinary.uploader.upload(item.path, {
          resource_type: 'image',
          folder: 'products',
        });
        console.log('Uploaded to Cloudinary, url:', result.secure_url);
        imagesUrl.push(result.secure_url);
        uploadedFiles.push(item.path); // Track for cleanup
      } catch (uploadError) {
        console.error('Error uploading file to Cloudinary:', uploadError);
        // Continue with other files, but log the error
        if (fs.existsSync(item.path)) {
          uploadedFiles.push(item.path);
        }
      }
    }

    if (imagesUrl.length === 0) {
      // Cleanup uploaded files
      uploadedFiles.forEach(filePath => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      });
      return res.status(400).json({ success: false, message: 'Failed to upload images to Cloudinary. Please check your Cloudinary configuration.' });
    }

    // Create product in database
    const newProduct = await Product.create({ ...productData, images: imagesUrl });
    console.log('Product created successfully:', newProduct._id);

    // Cleanup uploaded files after successful Cloudinary upload
    uploadedFiles.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('Cleaned up file:', filePath);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    });

    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      product: newProduct
    });
  } catch (error) {
    console.error('Error adding product:', error);
    console.error('Error stack:', error.stack);
    
    // Cleanup uploaded files on error
    uploadedFiles.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    });

    // Return proper error response
    res.status(500).json({ 
      success: false,
      message: 'Error adding product', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


// get all products =/api/product/list
export const productList = async (req, res) => {
    try {
        const { 
            search, 
            category, 
            minPrice, 
            maxPrice, 
            minRating, 
            sortBy, 
            inStock,
            limit,
            page 
        } = req.query;

        let query = {};

        // Search by name or tags
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        // Filter by category
        if (category) {
            query.category = { $regex: category, $options: 'i' };
        }

        // Filter by price range
        if (minPrice || maxPrice) {
            query.offerPrice = {};
            if (minPrice) query.offerPrice.$gte = parseFloat(minPrice);
            if (maxPrice) query.offerPrice.$lte = parseFloat(maxPrice);
        }

        // Filter by rating
        if (minRating) {
            query.averageRating = { $gte: parseFloat(minRating) };
        }

        // Filter by stock
        if (inStock !== undefined) {
            query.inStock = inStock === 'true';
        }

        // Sort options
        let sort = {};
        switch (sortBy) {
            case 'price-low':
                sort = { offerPrice: 1 };
                break;
            case 'price-high':
                sort = { offerPrice: -1 };
                break;
            case 'rating':
                sort = { averageRating: -1 };
                break;
            case 'newest':
                sort = { createdAt: -1 };
                break;
            default:
                sort = { createdAt: -1 };
        }

        // Pagination
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 20;
        const skip = (pageNum - 1) * limitNum;

        const products = await Product.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limitNum);

        const total = await Product.countDocuments(query);

        res.status(200).json({
            products,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum)
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
}

// get single product =/api/product/:id
export const productById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        if(!product){
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({success:true,product});
    } catch (error) {
        res.status(500).json({ message: 'Error fetching product', error:error.message });
    }

}

// change product inStock=/api/product/stock
export const changeStock = async (req, res) => {
    try {
        const { id, inStock } = req.body;
        await Product.findByIdAndUpdate(id, {
            inStock
        });
        res.status(200).json({ message: 'Product stock status updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating stock status', error });
    }

}
