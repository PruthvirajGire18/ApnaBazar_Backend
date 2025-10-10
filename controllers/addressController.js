import Address from "../models/Address.js";

// Add address =/api/address/add
export const addAddress=async(req,res)=>{
    try {
        const {address,userId}=req.body;
        await Address.create({...address,userId});
        res.status(201).json({message:'Address added successfully'});
    } catch (error) {
        res.status(500).json({message:'Error adding address',error});
    }
}

// Get user addresses =/api/address/get
export const getAddress=async(req,res)=>{
    try {
        const {userId}=req.body;
        const addresses=await Address.find({userId});   
        res.status(200).json(addresses);
    } catch (error) {
        res.status(500).json({message:'Error fetching addresses',error});
    }
}