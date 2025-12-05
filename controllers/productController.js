import { v2 as cloudinary } from 'cloudinary';
import Product from '../models/Product.js';
// add product =/api/product/add
export const addProduct = async (req, res) => {
    try {
        let productData = JSON.parse(req.body.productData);
        const images = req.files;
        let imagesUrl = await Promise.all(images.map(async (item) => {
            let result = await cloudinary.uploader.upload(item.path, { resource_type: "image" });
            return result.secure_url;
        }));
    await Product.create({ ...productData, images: imagesUrl });
    res.status(201).json({ success: true, message: 'Product added successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error adding product', error });
    }

}

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
