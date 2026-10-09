// Temporary passwords given by the administration. Shown once; the person chooses their own at first sign-in.
const crypto = require("crypto");

const ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";

// Three groups of four letters and digits: easy to read out, hard to guess
const createTempPassword = () => {
  const chars = Array.from(crypto.randomBytes(12), (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8)}`;
};

module.exports = { createTempPassword };
