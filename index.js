const express = require("express");
const home = require("./routes/home");
const users = require("./routes/users");
const posts = require("./routes/posts");
const auth = require("./jwt/auth");
const authMiddleware = require("./jwt/authMiddleware");

const app = express();

// Aumentando o limite de tamanho do payload
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Routes
app.use("/auth", auth); // Rota de autenticação
app.use("/home", home);
app.use("/users", users);
app.use("/posts", authMiddleware, posts); // Protege a rota de posts

// Connection
const port = 3000;
app.listen(port, () => console.log(`Listening to port ${port}`));

module.exports = app;


console.log(
  "\n\n\n\n\n\n--------------------------------------------------------------"
);
