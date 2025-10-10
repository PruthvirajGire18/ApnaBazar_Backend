import jwt from 'jsonwebtoken';
// Login Seller:/api/seller/login
export const sellerLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Please enter all the fields' });
        }
        if (email !== process.env.SELLER_EMAIL || password !== process.env.SELLER_PASSWORD) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const sellerToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.cookie('sellerToken', sellerToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict' }, { maxAge: 7 * 24 * 60 * 60 * 1000 });
        return res.json({ success: true, message: 'Seller logged in successfully' });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Server Error' });
    }
}

// Check seller is auth:/api/seller/is-auth
export const isSellerAuth = async (req, res) => {
    try {
        
        return res.json({ success: true });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Server Error' });
    }
}

// Logout seller:/api/seller/logout
export const sellerLogout=async(req,res)=>{
    try {
        res.clearCookie('sellerToken',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:process.env.NODE_ENV==='production'?'none':'strict'});
        return res.json({success:true,message:"Logout Successfully"});
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Server Error' });
    }
}

