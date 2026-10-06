const { isDemoAccount } = require("../config/demo");

// Public demo accounts may use the main flows but not manage users or edit profiles
const blockDemoAccounts = (req, res, next) => {
  if (isDemoAccount(req.user?.username)) {
    return res.status(403).json({ message: "This action is disabled in the demo" });
  }
  next();
};

module.exports = { blockDemoAccounts };
