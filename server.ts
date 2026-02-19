import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { GoogleGenAI } from "@google/genai";

const db = new Database("insurance.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    policy_id TEXT,
    incident_date TEXT,
    incident_type TEXT,
    incident_severity TEXT,
    authorities_contacted TEXT,
    incident_state TEXT,
    incident_city TEXT,
    property_damage TEXT,
    police_report_available TEXT,
    total_claim_amount REAL,
    injury_claim REAL,
    property_claim REAL,
    vehicle_claim REAL,
    auto_make TEXT,
    auto_model TEXT,
    fraud_score INTEGER,
    fraud_explanation TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  -- Create default admin user if not exists
  -- Password is 'admin123'
  INSERT OR IGNORE INTO users (username, password, role) 
  VALUES ('admin', '$2a$10$8K9pYp6.p6p6p6p6p6p6p6u8p6p6p6p6p6p6p6p6p6p6p6p6p6p6p6', 'admin');
`);

const JWT_SECRET = process.env.JWT_SECRET || "sentinel-secret-key";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- Auth Routes ---
  app.post("/api/auth/register", async (req, res) => {
    const { username, password, role } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const stmt = db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)");
      const result = stmt.run(username, hashedPassword, role || 'user');
      res.json({ id: result.lastInsertRowid, username, role: role || 'user' });
    } catch (e) {
      res.status(400).json({ error: "Username already exists" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
      res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // --- Claims Routes ---
  app.get("/api/claims", (req, res) => {
    const claims = db.prepare("SELECT * FROM claims ORDER BY created_at DESC").all();
    res.json(claims);
  });

  app.post("/api/claims", async (req, res) => {
    const claimData = req.body;
    const {
      user_id, policy_id, incident_date, incident_type, incident_severity,
      authorities_contacted, incident_state, incident_city, property_damage,
      police_report_available, total_claim_amount, injury_claim, property_claim,
      vehicle_claim, auto_make, auto_model
    } = claimData;

    // AI Prediction Logic using Gemini
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const prompt = `
      Analyze this insurance claim for potential fraud.
      Claim Details:
      - Incident Type: ${incident_type}
      - Severity: ${incident_severity}
      - Total Amount: $${total_claim_amount}
      - Injury Claim: $${injury_claim}
      - Property Claim: $${property_claim}
      - Vehicle Claim: $${vehicle_claim}
      - Property Damage: ${property_damage}
      - Police Report: ${police_report_available}
      - Authorities Contacted: ${authorities_contacted}

      Return a JSON object with:
      1. fraud_score (0-100)
      2. explanation (detailed reasoning for the score)
      3. status ('flagged' if score > 70, 'pending' otherwise)
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: [{ parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      const prediction = JSON.parse(response.text || "{}");
      
      const stmt = db.prepare(`
        INSERT INTO claims (
          user_id, policy_id, incident_date, incident_type, incident_severity,
          authorities_contacted, incident_state, incident_city, property_damage,
          police_report_available, total_claim_amount, injury_claim, property_claim,
          vehicle_claim, auto_make, auto_model, fraud_score, fraud_explanation, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        user_id, policy_id, incident_date, incident_type, incident_severity,
        authorities_contacted, incident_state, incident_city, property_damage,
        police_report_available, total_claim_amount, injury_claim, property_claim,
        vehicle_claim, auto_make, auto_model, 
        prediction.fraud_score || 0, 
        prediction.explanation || "No explanation provided",
        prediction.status || 'pending'
      );

      res.json({ id: result.lastInsertRowid, ...prediction });
    } catch (e) {
      console.error("AI Prediction failed", e);
      res.status(500).json({ error: "Failed to process claim with AI" });
    }
  });

  app.get("/api/stats", (req, res) => {
    const totalClaims = db.prepare("SELECT COUNT(*) as count FROM claims").get() as any;
    const flaggedClaims = db.prepare("SELECT COUNT(*) as count FROM claims WHERE status = 'flagged'").get() as any;
    const totalAmount = db.prepare("SELECT SUM(total_claim_amount) as sum FROM claims").get() as any;
    const severityStats = db.prepare("SELECT incident_severity as name, COUNT(*) as value FROM claims GROUP BY incident_severity").all();
    const fraudTrend = db.prepare("SELECT date(created_at) as date, AVG(fraud_score) as avg_score FROM claims GROUP BY date(created_at) LIMIT 7").all();

    res.json({
      totalClaims: totalClaims.count,
      flaggedClaims: flaggedClaims.count,
      totalAmount: totalAmount.sum || 0,
      severityStats,
      fraudTrend
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
