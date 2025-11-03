import User from "../models/User.js";
// Update user cart data
export const updateCart = async (req, res) => {
  try {
    const { cartItems } = req.body;
    const { userId } = req;
    await User.findByIdAndUpdate(userId, {cartItems});
    res.status(200).json({message: 'Cart updated successfully'});
  } catch (error) {
    res.status(500).json({message: 'Error updating cart', error});
  }
}