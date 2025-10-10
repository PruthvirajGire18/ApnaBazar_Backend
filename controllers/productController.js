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
        const products = await Product.find({});
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products', error });
    }
}

// get single product =/api/product/:id
export const productById = async (req, res) => {
    try {
        const { id } = req.body;
        const product = await Product.findById(id);
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching product', error });
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
