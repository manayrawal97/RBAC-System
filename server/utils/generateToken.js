const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token for a logged-in user
 * @param {string} userId  - MongoDB _id of the user
 * @param {string} userType - ADMIN | CLIENT | USER
 */

const generateToken = (userId, userType) => {
    return jwt.sign(
        { id: userId, userType},
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

/**
 * Verify a token and return its decoded payload
 * Throws an error if invalid or expired
 */

const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new Error("Invalid or expired token");
    }
};

module.exports = { generateToken, verifyToken };


