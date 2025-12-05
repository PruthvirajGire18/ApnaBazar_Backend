import Address from "../models/Address.js";

// Add address =/api/address/add
export const addAddress=async(req,res)=>{
    try {
        const addressData=req.body;
        const userId=req.userId;

        // Validate required fields
        const requiredFields = ['firstName', 'lastName', 'email', 'street', 'city', 'state', 'country', 'zipCode', 'phone'];
        const missingFields = requiredFields.filter(field => !addressData[field]);
        
        if(missingFields.length > 0){
            return res.status(400).json({
                message:`Missing required fields: ${missingFields.join(', ')}`,
                missingFields
            });
        }

        // Create address with userId
        const address = await Address.create({
            ...addressData,
            userId
        });

        res.status(201).json({
            success:true,
            message:'Address added successfully',
            address
        });
    } catch (error) {
        console.error('Address creation error:', error);
        
        // Handle duplicate key errors or validation errors
        if(error.name === 'ValidationError'){
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                message:'Validation error',
                errors
            });
        }

        res.status(500).json({
            message:'Error adding address',
            error:error.message
        });
    }
}

// Get user addresses =/api/address/get
export const getAddress=async(req,res)=>{
    try {
        const userId=req.userId;
        const addresses=await Address.find({userId});   
        res.status(200).json({success:true,addresses});
    } catch (error) {
        res.status(500).json({message:'Error fetching addresses',error:error.message});
    }
}