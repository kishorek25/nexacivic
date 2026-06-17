const jwt = require("jsonwebtoken");

// Must match the secret in server.js
const JWT_SECRET = "nexacivic_super_secret_key";

// 1. Middleware to verify if the user is successfully logged in
const verifyToken = (req, res, next) => {
    // Check for token in the Authorization header
    const authHeader = req.header("Authorization");
    if (!authHeader) {
        console.log("❌ Auth Error: No token provided");
        return res.status(401).json({ error: "Access Denied. No token provided." });
    }

    // The header is usually "Bearer <token>", so we split it to get just the token
    const token = authHeader.split(" ")[1];
    if (!token) {
        console.log("❌ Auth Error: Invalid token format");
        return res.status(401).json({ error: "Access Denied. Invalid token format." });
    }

    try {
        // Verify the token using our secret key
        const verified = jwt.verify(token, JWT_SECRET);

        // Attach the user info (id, role) from the token to the request object
        req.user = verified;

        // Proceed to the actual API route
        next();
    } catch (err) {
        console.log("❌ Auth Error: Invalid Token", err.message);
        res.status(401).json({ error: "Invalid Token" });
    }
};

// 2. Middleware to verify if the logged in user is an ADMIN
const verifyAdmin = (req, res, next) => {
    // This runs AFTER verifyToken, so req.user already exists
    if (req.user && req.user.role === 'admin') {
        next(); // Proceed if admin
    } else {
        res.status(403).json({ error: "Access Denied. Admins only." });
    }
};

module.exports = { verifyToken, verifyAdmin };
