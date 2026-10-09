// One-time codes that let a patient registered at the desk create their own login.
// Only a hash of the code is stored, so the database never holds a usable code.
const crypto = require("crypto");

// No 0/O, 1/I/L: easy to read out over the phone and to type
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const VALID_DAYS = 14;

// "k7qm-4zrp " and "K7QM4ZRP" are the same code
const normalize = (code) => String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

const hashCode = (code) => crypto.createHash("sha256").update(normalize(code)).digest("hex");

// Returns the code to show once ("K7QM-4ZRP"), its hash to store, and when it stops working
const createActivationCode = (now = new Date()) => {
  const chars = Array.from(crypto.randomBytes(8), (b) => ALPHABET[b % ALPHABET.length]).join("");
  const code = `${chars.slice(0, 4)}-${chars.slice(4)}`;
  return {
    code,
    hash: hashCode(code),
    expiresAt: new Date(now.getTime() + VALID_DAYS * 24 * 60 * 60 * 1000),
  };
};

module.exports = { createActivationCode, hashCode, normalize, VALID_DAYS };
