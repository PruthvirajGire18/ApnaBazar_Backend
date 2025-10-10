import Order from "../models/Order.js";
import Product from "../models/Product.js";

// Place order COD:/api/order/cod
export const placeOrderCOD=async(req,res)=>{
    try {
        const {userId,items,address}=req.body;
        if(!userId || !items || items.length===0 || !address){
            return res.status(400).json({message:'All fields are required'});
        }
        let amount=await items.reduce(async(acc,item)=>{
            const product=await Product.findById(item.product);
            return (await acc)+product.offerPrice*item.quantity;
        },0)

        // add tax 2%
        amount+=Math.floor(amount*0.02);
        await Order.create({userId,items,amount,address,paymentType:"COD"});
        res.status(201).json({message:'Order placed successfully'});
    } catch (error) {
        res.status(500).json({message:'Error placing order',error});
    }
}

// get order by userId =/api/order/user

export const getUserOrders=async(req,res)=>{
    try {
        const {userId}=req.body;
        const orders=await Order.find({userId,$or:[{paymentType:"COD"},{isPaid:true}]}).populate('items.product address').sort({createdAt:-1});
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({message:'Error fetching orders',error});
    }
}

// get all orders(for seller/admin):/api/order/seller
export const getAllOrders=async(req,res)=>{
    try {
        const orders=await Order.find({
            $or:[{paymentType:"COD"},{isPaid:true}]
        }).populate('items.product address').sort({createdAt:-1});
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({message:'Error fetching orders',error});
    }
}