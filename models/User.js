import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  cartItems:{
    type:Object,
    default:{}
  },
  phone:{
    type:String,
    default:null
  },
  role:{
    type:String,
    enum:['user', 'seller', 'admin', 'delivery'],
    default:'user'
  },
  googleId:{
    type:String,
    default:null
  },
  isEmailVerified:{
    type:Boolean,
    default:false
  },
  emailVerificationToken:{
    type:String,
    default:null
  },
  loyaltyPoints:{
    type:Number,
    default:0
  },
  totalOrders:{
    type:Number,
    default:0
  },
  totalSpent:{
    type:Number,
    default:0
  },
  referralCode:{
    type:String,
    unique:true,
    sparse:true
  },
  referredBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'user',
    default:null
  },
  otp:{
    type:String,
    default:null
  },
  otpExpiry:{
    type:Date,
    default:null
  },
  isActive:{
    type:Boolean,
    default:true
  }
},{minimize:false});
const User = mongoose.models.user||mongoose.model('user', userSchema);

export default User;