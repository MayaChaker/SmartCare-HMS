const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/auth");
const { User } = require("../models");

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }

  // Load the user so deleted accounts and role changes take effect before the token expires
  const user = await User.findByPk(decoded.id, {
    attributes: ["id", "username", "role", "mustChangePassword"],
  });
  if (!user) {
    return res.status(401).json({ message: "Invalid token" });
  }

  // Someone signed in with a temporary password may only choose their own password
  if (user.mustChangePassword && req.originalUrl.split("?")[0] !== "/api/auth/change-password") {
    return res.status(403).json({ message: "Choose a new password to continue", code: "PASSWORD_CHANGE_REQUIRED" });
  }

  req.user = { id: user.id, username: user.username, role: user.role };
  next();
};
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions" });
    }
    next();
  };
};

module.exports = { verifyToken, checkRole };
