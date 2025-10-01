import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import helmet from "helmet";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// ====== CONFIGURACIÓN DE SESIÓN ======
app.set("trust proxy", 1); // necesario en Railway para cookies secure

app.use(
  session({
    secret: process.env.SESSION_SECRET || "cambia-esta-clave",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: true, // Railway usa HTTPS → true
    },
  })
);

// ====== CSP con Helmet ======
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: false,
    directives: {
      "default-src": ["'self'"],
      "script-src": [
        "'self'",
        "'unsafe-inline'",
        "https://translate.googleapis.com",
        "https://translate.google.com",
        "https://www.gstatic.com",
      ],
      "script-src-elem": [
        "'self'",
        "'unsafe-inline'",
        "https://translate.googleapis.com",
        "https://translate.google.com",
        "https://www.gstatic.com",
      ],
      "style-src": [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://translate.googleapis.com",
        "https://www.gstatic.com",
      ],
      "style-src-elem": [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://translate.googleapis.com",
        "https://www.gstatic.com",
      ],
      "img-src": [
        "'self'",
        "data:",
        "https://*.gstatic.com",
        "https://*.googleusercontent.com",
      ],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "frame-src": ["https://translate.google.com"],
      "connect-src": ["'self'"],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
      "frame-ancestors": ["'self'"],
    },
  })
);

// ====== PARSERS ======
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ====== LOGIN ======
app.get("/login", (req, res) => {
  return res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.post("/login", (req, res) => {
  const { usuario, clave } = req.body;

  // ⚠️ Reemplaza esto con tu validación real (DB, etc.)
  const valido = usuario === "admin" && clave === "1234";

  if (!valido) {
    return res.status(401).send("Credenciales incorrectas");
  }

  req.session.usuario = { nombre: usuario };
  req.session.save((err) => {
    if (err) {
      console.error("Error guardando sesión:", err);
      return res.status(500).send("No se pudo iniciar sesión");
    }
    return res.redirect("/inicio");
  });
});

// ====== RUTAS PROTEGIDAS ======
app.get("/inicio", (req, res) => {
  if (!req.session?.usuario) return res.redirect("/login.html");
  return res.sendFile(path.join(__dirname, "views", "inicio.html"));
});

// Redirige /inicio.html → /inicio
app.get("/inicio.html", (req, res) => res.redirect(302, "/inicio"));

// ====== ESTÁTICOS ======
app.use(express.static(path.join(__dirname, "public")));

// ====== ARRANQUE ======
app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://0.0.0.0:${PORT}`);
});














