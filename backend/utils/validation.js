const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

const isValidEmail = (v) =>
  typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// Returns an error message for invalid credentials, otherwise null
const getCredentialsError = (username, password) => {
  if (!isNonEmptyString(username) || !isNonEmptyString(password)) {
    return "Username and password are required";
  }
  if (username.trim().length < 3) {
    return "Username must be at least 3 characters";
  }
  if (password.trim().length < 6) {
    return "Password must be at least 6 characters";
  }
  return null;
};

module.exports = { isNonEmptyString, isValidEmail, getCredentialsError };
