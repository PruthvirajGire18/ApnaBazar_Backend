import mogoose from 'mongoose';

const userSchema = new mogoose.Schema({
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
  }
},{minimize:false});
const User = mogoose.models.user||mogoose.model('user', userSchema);

export default User;