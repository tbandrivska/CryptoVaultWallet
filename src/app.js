import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from 'express-session';

import transactionRoutes from "./routes/transactionRoutes.js";
import userRoutes from './routes/userRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import { loginUser } from './config/login.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: 'cryptovault-secret-key', // In production, use a proper secret
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../public")));

app.use("/api/transactions", transactionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profiles', profileRoutes);

// Show login page
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "login.html"));
});

// Handle login form
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await loginUser(email, password);

    if (user) {
      req.session.user = user;
      return res.redirect('/portfolio.html');
    } else {
      return res.redirect('/login.html?error=1');
    }
  } catch (err) {
    return res.redirect('/login.html?error=1');
  }
});


// Ensure this is near your other app.use calls in app.js
app.get('/api/chart/:coinId', async (req, res) => {
    try {
        const { coinId } = req.params;
        const apiKey = 'CG-2UhE78yESRWdrAX3pU6fMsCZ'; // Your API Key
        const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=gbp&days=7`;

        const response = await fetch(url, {
            headers: {
                'accept': 'application/json',
                'x-cg-demo-api-key': apiKey
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: "CoinGecko Error" });
        }

        const data = await response.json();
        res.json(data); // Send actual JSON
    } catch (error) {
        console.error("Proxy Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// Ensure this is near your other app.use calls in app.js
app.get('/api/chart/:coinId', async (req, res) => {
    try {
        const { coinId } = req.params;
        const apiKey = 'CG-2UhE78yESRWdrAX3pU6fMsCZ'; // Your API Key
        const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=gbp&days=7`;

        const response = await fetch(url, {
            headers: {
                'accept': 'application/json',
                'x-cg-demo-api-key': apiKey
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: "CoinGecko Error" });
        }

        const data = await response.json();
        res.json(data); // Send actual JSON
    } catch (error) {
        console.error("Proxy Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// Ensure this is near your other app.use calls in app.js
app.get('/api/chart/:coinId', async (req, res) => {
    try {
        const { coinId } = req.params;
        const apiKey = 'CG-2UhE78yESRWdrAX3pU6fMsCZ'; // Your API Key
        const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=gbp&days=7`;

        const response = await fetch(url, {
            headers: {
                'accept': 'application/json',
                'x-cg-demo-api-key': apiKey
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: "CoinGecko Error" });
        }

        const data = await response.json();
        res.json(data); // Send actual JSON
    } catch (error) {
        console.error("Proxy Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get current user
app.get('/api/user', (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ error: 'Not logged in' });
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/login');
  });
});

export default app;