// server.js — Express + Session (SQLite) + CSP + /inicio protegido

const express = require("express");
const path = require("path");
const fs = require("fs");
const session = require("express-session");
const SQLiteStoreFactory = require("connect-sqlite3");
const helmet = require("helmet");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;

// ===== Healthcheck para Railway =====
app.get("/salud", (_, res) => res.status(200).send("ok"));

// ===== Parsers =====
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ===== Sesión con SQLiteStore =====
app.set("trust proxy", 1);
const SQLiteStore = SQLiteStoreFactory(session);
const sessionsDir = path.join(__dirname, "db");
if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir, { recursive: true });

app.use(session({
  store: new SQLiteStore({
    dir: sessionsDir,
    db: "sessions.sqlite",
  }),
  secret: process.env.SESSION_SECRET || "cambia-esta-clave",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: true,            // Railway corre por HTTPS
    maxAge: 1000 * 60 * 60 * 8
  }
}));

// ===== CSP con Helmet =====
app.use(helmet.contentSecurityPolicy({
  useDefaults: false,
  directives: {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", "https://translate.googleapis.com", "https://translate.google.com", "https://www.gstatic.com"],
    "script-src-elem": ["'self'", "'unsafe-inline'", "https://translate.googleapis.com", "https://translate.google.com", "https://www.gstatic.com"],
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://translate.googleapis.com", "https://www.gstatic.com"],
    "style-src-elem": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://translate.googleapis.com", "https://www.gstatic.com"],
    "img-src": ["'self'", "data:", "https://*.gstatic.com", "https://*.googleusercontent.com"],
    "font-src": ["'self'", "https://fonts.gstatic.com"],
    "frame-src": ["https://translate.google.com"],
    "connect-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "frame-ancestors": ["'self'"]
  }
}));

// ===== Evitar cache de HTML =====
app.use((req, res, next) => {
  if (req.path.endsWith(".html") || req.path === "/inicio") {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.set("Surrogate-Control", "no-store");
  }
  next();
});

// ===== Login =====
app.get("/login", (req, res) => {
  return res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.post("/login", (req, res) => {
  const { usuario, clave } = req.body;
  const valido = usuario === "admin" && clave === "1234"; // demo

  if (!valido) return res.status(401).send("Credenciales incorrectas");

  req.session.usuario = { nombre: usuario };
  req.session.save(err => {
    if (err) return res.status(500).send("No se pudo iniciar sesión");
    return res.redirect("/inicio");
  });
});

// ===== Redirección /inicio.html =====
app.get("/inicio.html", (req, res) => res.redirect(302, "/inicio"));

// ===== Ruta protegida /inicio =====
app.get("/inicio", (req, res) => {
  if (!req.session?.usuario) return res.redirect("/login.html");
  return res.sendFile(path.join(__dirname, "views", "inicio.html"));
});

// ===== Estáticos =====
app.use(express.static(path.join(__dirname, "public")));

// ===== Arranque =====
app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://0.0.0.0:${PORT}`);
});












