import { registerUser } from '../config/userService.js';

export const register = async (req, res) => {
  const { username, email, phoneNumber, password } = req.body;

  try {
    await registerUser(username, email, password);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: "User already exists" });
  }
};