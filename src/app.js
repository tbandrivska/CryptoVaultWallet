import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import transactionRoutes from "./routes/transactionRoutes.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../public")));

app.use("/api/transactions", transactionRoutes);

// Hardcoded demo user for prototype
const demoUser = {
  email: "demo@cryptovault.com",
  password: "Password123"
};

// Show login page
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "login.html"));
});

// Handle login form
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (email === demoUser.email && password === demoUser.password) {
    return res.send(`
      <html>
        <head>
          <title>Login Successful</title>
          <link rel="stylesheet" href="/login.css">
        </head>
        <body>
          <div class="container">
            <div class="card">
              <h1>Login Successful</h1>
              <p>Welcome to CryptoVaultWallet prototype.</p>
              <p><strong>Email:</strong> ${email}</p>
            </div>
          </div>
        </body>
      </html>
    `);
  }

  return res.send(`
    <html>
      <head>
        <title>Login Failed</title>
        <link rel="stylesheet" href="/login.css">
      </head>
      <body>
        <div class="container">
          <div class="card">
            <h1>Login Failed</h1>
            <p>Invalid email or password.</p>
            <br>
            <a href="/login" style="color: #22c55e;">Try again</a>
          </div>
        </div>
      </body>
    </html>
  `);
});

export default app;