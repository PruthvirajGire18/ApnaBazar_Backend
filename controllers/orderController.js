import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Address from "../models/Address.js";
import mongoose from "mongoose";

// Place order COD:/api/order/cod
export const placeOrderCOD=async(req,res)=>{
    try {
        const {items,address,deliveryTimeSlot,isExpressDelivery,couponCode,discount}=req.body;
        const userId=req.userId;
        
        if(!userId){
            return res.status(401).json({message:'User not authenticated'});
        }
        
        if(!items || items.length===0){
            return res.status(400).json({message:'Cart is empty. Please add items to cart'});
        }
        
        if(!address){
            return res.status(400).json({message:'Please select a delivery address'});
        }
        let subtotal=0;
        for(const item of items){
            const product=await Product.findById(item.product);
            if(!product){
                return res.status(400).json({message:`Product ${item.product} not found`});
            }
            subtotal+=product.offerPrice*item.quantity;
        }

        // Calculate tax (2%)
        const tax=Math.floor(subtotal*0.02);
        
        // Calculate delivery fee
        let deliveryFee=0;
        if(subtotal<500){
            deliveryFee=isExpressDelivery?50:30;
        }else if(isExpressDelivery){
            deliveryFee=30;
        }

        // Apply coupon if provided
        let finalDiscount = discount || 0;
        if(couponCode && finalDiscount === 0){
            // If coupon code provided but discount not calculated, validate coupon
            // For now, accept discount from frontend
            finalDiscount = 0;
        }
        
        // Ensure discount doesn't exceed subtotal
        finalDiscount = Math.min(finalDiscount, subtotal);

        // Calculate total
        const amount=Math.max(0, subtotal+tax+deliveryFee-finalDiscount);

        // Generate tracking number
        const trackingNumber='APNA'+Date.now().toString().slice(-8);

        // Calculate estimated delivery
        const estimatedDelivery=new Date();
        if(isExpressDelivery){
            estimatedDelivery.setHours(estimatedDelivery.getHours()+2);
        }else{
            estimatedDelivery.setDate(estimatedDelivery.getDate()+1);
            estimatedDelivery.setHours(10, 0, 0, 0); // Default to 10 AM next day
            if(deliveryTimeSlot){
                const [hours,minutes]=deliveryTimeSlot.split(':');
                if(hours && minutes){
                    estimatedDelivery.setHours(parseInt(hours),parseInt(minutes || 0),0,0);
                }
            }
        }

        const statusHistory=[{
            status:'Order Placed',
            timestamp:new Date(),
            message:'Your order has been placed successfully'
        }];

        // Validate address is ObjectId
        let addressId = address;
        if(typeof address === 'string'){
            // Check if it's a valid MongoDB ObjectId
            if(mongoose.Types.ObjectId.isValid(address)){
                addressId = address;
            } else {
                return res.status(400).json({message:'Invalid address ID format'});
            }
        } else if(address && address._id){
            addressId = address._id;
        } else {
            return res.status(400).json({message:'Invalid address provided'});
        }
        
        // Verify address exists and belongs to user
        const addressDoc = await Address.findOne({_id: addressId, userId: userId});
        if(!addressDoc){
            return res.status(404).json({message:'Address not found or does not belong to user'});
        }

        const order=await Order.create({
            userId,
            items,
            subtotal,
            tax,
            deliveryFee,
            discount: finalDiscount,
            couponCode:couponCode || null,
            amount: Math.max(0, amount), // Ensure amount is not negative
            address: addressId,
            paymentType:"COD",
            deliveryTimeSlot:deliveryTimeSlot || null,
            isExpressDelivery:isExpressDelivery || false,
            estimatedDelivery,
            trackingNumber,
            statusHistory
        });
        res.status(201).json({success:true,message:'Order placed successfully',orderId:order._id,trackingNumber:order.trackingNumber});
    } catch (error) {
        console.error('Order placement error:', error);
        res.status(500).json({message:'Error placing order',error:error.message, details: error.stack});
    }
}

// get order by userId =/api/order/user

export const getUserOrders=async(req,res)=>{
    try {
        const userId=req.userId;
        const orders=await Order.find({userId,$or:[{paymentType:"COD"},{isPaid:true}]})
            .populate({
                path: 'items.product',
                select: 'name images image price offerPrice category inStock',
                model: 'product'
            })
            .populate({
                path: 'address',
                select: 'firstName lastName street city state country zipCode zipcode phone email',
                model: 'address'
            })
            .sort({createdAt:-1});
        res.status(200).json({success:true,orders});
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({success:false,message:'Error fetching orders',error:error.message});
    }
}

// get all orders(for seller/admin):/api/order/seller
export const getAllOrders=async(req,res)=>{
    try {
        // Get all orders - no filter, seller should see all orders
        const orders=await Order.find({})
            .populate({
                path: 'items.product',
                select: 'name images image price offerPrice category inStock',
                model: 'product'
            })
            .populate({
                path: 'address',
                select: 'firstName lastName street city state country zipCode phone email',
                model: 'address'
            })
            .populate({
                path: 'userId',
                select: 'name email',
                model: 'user'
            })
            .sort({createdAt:-1})
            .lean(); // Use lean() for better performance
        
        console.log(`Fetched ${orders.length} orders for seller`);
        
        // If no orders, return empty array with success
        res.status(200).json({
            success:true,
            orders: orders || [],
            count: orders.length,
            message: orders.length === 0 ? 'No orders found' : `Found ${orders.length} orders`
        });
    } catch (error) {
        console.error('Error fetching orders for seller:', error);
        res.status(500).json({
            success: false,
            message:'Error fetching orders',
            error:error.message,
            orders: []
        });
    }
}

// update order status:/api/order/status
export const updateOrderStatus=async(req,res)=>{
    try {
        const {orderId,status,message}=req.body;
        if(!orderId || !status){
            return res.status(400).json({message:'Order ID and status are required'});
        }
        const order=await Order.findById(orderId);
        if(!order){
            return res.status(404).json({message:'Order not found'});
        }
        
        // Add to status history
        order.statusHistory.push({
            status,
            timestamp:new Date(),
            message:message || `Order status updated to ${status}`
        });
        order.status=status;
        await order.save();
        
        res.status(200).json({success:true,message:'Order status updated successfully'});
    } catch (error) {
        res.status(500).json({message:'Error updating order status',error:error.message});
    }
}

// Get order tracking: /api/order/track/:trackingNumber
export const trackOrder=async(req,res)=>{
    try {
        const {trackingNumber}=req.params;
        const order=await Order.findOne({trackingNumber})
            .populate({
                path: 'items.product',
                select: 'name images image price offerPrice category inStock',
                model: 'product'
            })
            .populate({
                path: 'address',
                select: 'firstName lastName street city state country zipCode zipcode phone email',
                model: 'address'
            })
            .populate({
                path: 'userId',
                select: 'name email',
                model: 'user'
            });
        
        if(!order){
            return res.status(404).json({success: false, message:'Order not found'});
        }
        
        res.status(200).json({success:true,order});
    } catch (error) {
        console.error('Error tracking order:', error);
        res.status(500).json({success: false, message:'Error tracking order',error:error.message});
    }
}

// Get single order: /api/order/:orderId
export const getOrderById=async(req,res)=>{
    try {
        const {orderId}=req.params;
        const userId=req.userId;
        const order=await Order.findOne({_id:orderId,userId})
            .populate('items.product address');
        
        if(!order){
            return res.status(404).json({message:'Order not found'});
        }
        
        res.status(200).json({success:true,order});
    } catch (error) {
        res.status(500).json({message:'Error fetching order',error:error.message});
    }
}

// Cancel order: /api/order/cancel
export const cancelOrder=async(req,res)=>{
    try {
        const {orderId,reason}=req.body;
        const userId=req.userId;
        
        if(!orderId){
            return res.status(400).json({message:'Order ID is required'});
        }
        
        const order=await Order.findOne({_id:orderId,userId});
        if(!order){
            return res.status(404).json({message:'Order not found'});
        }
        
        // Check if order can be cancelled
        const cancellableStatuses=['Order Placed','Confirmed'];
        if(!cancellableStatuses.includes(order.status)){
            return res.status(400).json({
                message:`Order cannot be cancelled. Current status: ${order.status}`,
                currentStatus:order.status
            });
        }
        
        // Update order status
        order.status='Cancelled';
        order.cancelledAt=new Date();
        order.cancellationReason=reason || 'Cancelled by user';
        
        // Add to status history
        order.statusHistory.push({
            status:'Cancelled',
            timestamp:new Date(),
            message:reason || 'Order cancelled by user'
        });
        
        // If paid online, initiate refund
        if(order.isPaid && order.paymentType==='Online'){
            order.refundStatus='Pending';
            order.refundAmount=order.amount;
            // In production, integrate with Razorpay refund API here
        }
        
        await order.save();
        
        res.status(200).json({
            success:true,
            message:'Order cancelled successfully',
            order,
            refundStatus:order.refundStatus
        });
    } catch (error) {
        console.error('Order cancellation error:',error);
        res.status(500).json({message:'Error cancelling order',error:error.message});
    }
}