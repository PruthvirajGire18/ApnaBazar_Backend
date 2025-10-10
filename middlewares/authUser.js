import jwt from 'jsonwebtoken';
const authUser=async(req,res,next)=>{
    const{token}=req.cookies;
    if(!token){
        return res.status(401).json({message:'No auth token,access denied'});
    }
    try {
        const tokenDecode=jwt.verify(token,process.env.JWT_SECRET);
        if(tokenDecode.id){
            req.body.userId=tokenDecode.id;
        }
        else{
            return res.status(401).json({message:'Invalid auth token,access denied'});
        }
        next();
    } catch (error) {
        res.status(401).json({message:'Invalid auth token,access denied'});
    }
}
export default authUser;