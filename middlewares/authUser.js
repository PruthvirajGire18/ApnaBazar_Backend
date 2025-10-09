import jwt from 'jsonwebtoken';
const authUser = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const tokenDecoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!tokenDecoded) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    
};
export default authUser;