import jwt from 'jsonwebtoken';
const authSeller = async (req, res, next) => {
    const { sellerToken } = req.cookies;
    if (!sellerToken) {
        return res.status(401).json({ message: 'No auth token, access denied' });
    }
    try {
        const tokenDecode = jwt.verify(sellerToken, process.env.JWT_SECRET);
        if (tokenDecode.email === process.env.SELLER_EMAIL) {
            next();
        } else {
            return res.status(401).json({ message: 'Invalid auth token, access denied' });
        }
    } catch (error) {
        res.status(401).json({ message: 'Invalid auth token, access denied' });
    }
}
export default authSeller;