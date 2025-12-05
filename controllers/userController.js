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

// Google OAuth Login: /api/user/google-login
export const googleLogin = async (req, res) => {
    try {
        const { name, email, googleId } = req.body;

        if (!email || !googleId) {
            return res.status(400).json({ message: 'Email and Google ID are required' });
        }

        let user = await User.findOne({ $or: [{ email }, { googleId }] });

        if (user) {
            // Update Google ID if not set
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }
        } else {
            // Create new user
            const referralCode = 'REF' + Date.now().toString().slice(-8);
            user = await User.create({
                name: name || 'User',
                email,
                googleId,
                password: '', // No password for OAuth users
                isEmailVerified: true,
                referralCode
            });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.cookie('userToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.json({
            success: true,
            user: {
                email: user.email,
                name: user.name,
                id: user._id
            }
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// OTP Login - Send OTP: /api/user/send-otp
export const sendOTP = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ message: 'Phone number is required' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store OTP in user document or cache (for production, use Redis)
        let user = await User.findOne({ phone });
        if (!user) {
            user = await User.create({
                name: 'User',
                email: `${phone}@temp.com`,
                phone,
                password: '', // Will be set later
                otp,
                otpExpiry: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
            });
        } else {
            user.otp = otp;
            user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
            await user.save();
        }

        // In production, send OTP via SMS service
        console.log(`OTP for ${phone}: ${otp}`);

        res.status(200).json({
            success: true,
            message: 'OTP sent successfully',
            // In development, return OTP. Remove in production!
            otp: process.env.NODE_ENV === 'development' ? otp : undefined
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// OTP Login - Verify OTP: /api/user/verify-otp
export const verifyOTP = async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ message: 'Phone and OTP are required' });
        }

        const user = await User.findOne({ phone });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (user.otpExpiry && new Date() > user.otpExpiry) {
            return res.status(400).json({ message: 'OTP expired' });
        }

        // Clear OTP
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.cookie('userToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.json({
            success: true,
            user: {
                email: user.email,
                name: user.name,
                phone: user.phone,
                id: user._id
            }
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get Loyalty Points: /api/user/loyalty-points
export const getLoyaltyPoints = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('loyaltyPoints totalOrders totalSpent');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            loyaltyPoints: user.loyaltyPoints || 0,
            totalOrders: user.totalOrders || 0,
            totalSpent: user.totalSpent || 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching loyalty points', error: error.message });
    }
};