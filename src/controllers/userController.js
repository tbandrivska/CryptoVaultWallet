import { registerUser } from '../config/userService.js';

// In userController.js
export const register = async (req, res) => {
  const { username, email, phoneNumber, password } = req.body;
  try {
    await registerUser(username, email, password);
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.json({ success: false, message: "Username or email already exists" });
    } else {
      res.json({ success: false, message: "Registration failed" });
    }
  }
};