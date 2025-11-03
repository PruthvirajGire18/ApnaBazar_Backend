import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// Register user:/api/user/register
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please enter all the fields' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword });
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.cookie('userToken', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict' }, { maxAge: 7 * 24 * 60 * 60 * 1000 });
        return res.json({ success: true, user: { email: user.email, name: user.name,}});

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Server Error' });
    }

}
// Login User:/api/user/login

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;       

        if (!email || !password) {
            return res.status(400).json({ message: 'Please enter all the fields' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.cookie('userToken', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict' }, { maxAge: 7 * 24 * 60 * 60 * 1000 });
        return res.json({ success: true, user: { email: user.email, name: user.name, } });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Server Error' });
    }

}

// Check auth:/api/user/is-auth
export const isAuth = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ success: true, user });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Logout user:/api/user/logout
export const logout=async(req,res)=>{
    try {
        res.clearCookie('userToken',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:process.env.NODE_ENV==='production'?'none':'strict'});
        return res.json({success:true,message:"Logout Successfully"});
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Server Error' });
    }
}