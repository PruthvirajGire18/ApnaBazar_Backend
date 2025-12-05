import mongoose from 'mongoose'; 
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: Array,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    offerPrice: {
        type: Number,
        required: true
    },
    images: {
        type: Array,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    inStock: {
        type: Boolean,
        default: true
    },
    averageRating: {
        type: Number,
        default: 0
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    tags: {
        type: Array,
        default: []
    },
    variants: [{
        name: {
            type: String,
            required: true
        },
        value: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            default: 0
        },
        stock: {
            type: Number,
            default: 0
        }
    }],
    weight: {
        type: String,
        default: null
    },
    brand: {
        type: String,
        default: null
    }
}, { timestamps: true });

const Product = mongoose.models.product || mongoose.model('product', productSchema);

export default Product;
