const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const { DEMO_RESET_TOKEN, isDemoEnabled } = require("../config/demo");
const { resetDemoData } = require("../demo/resetDemo");

// Constant-time comparison so the token cannot be guessed from response timing
const isValidToken = (token) => {
  const expected = Buffer.from(DEMO_RESET_TOKEN);
  const received = Buffer.from(String(token || ""));
  return expected.length > 0 && expected.length === received.length && crypto.timingSafeEqual(expected, received);
};

// Called by the nightly GitHub Actions workflow
router.post("/reset", async (req, res) => {
  if (!isDemoEnabled() || !DEMO_RESET_TOKEN) {
    return res.status(404).json({ message: "Demo mode is not enabled" });
  }
  if (!isValidToken(req.headers["x-demo-reset-token"])) {
    return res.status(401).json({ message: "Invalid reset token" });
  }
  try {
    await resetDemoData();
    res.json({ message: "Demo data reset" });
  } catch (error) {
    console.error("Demo reset failed:", error);
    res.status(500).json({ message: "Demo reset failed" });
  }
});

module.exports = router;
