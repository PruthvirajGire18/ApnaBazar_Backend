import jwt from "jsonwebtoken";

const authUser = async (req, res, next) => {
  try {
    let token = req.cookies.userToken;

    // Read token from Authorization header (Bearer <token>)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      return res.status(401).json({ message: "No auth token, access denied" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.id;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Invalid or expired token, access denied" });
  }
};

export default authUser;
