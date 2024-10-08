const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const pool = require("../conexaobd");
const e = require("express");

// Segredo para assinar o JWT (deve ser armazenado em uma variável de ambiente)
const JWT_SECRET = "ifsp";

// Rota de autenticação
router.post("/", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(401).send("Email ou senha inválidos 1");
    }

    const user = rows[0];

    if (user.password !== password) {
      return res.status(401).send("Email ou senha inválidos 2");
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "500h" });
    //trocar 1 ou 0 por true ou false no admin do banco
    if (user.admin == 1) {
      user.admin = true;
    }else{
      user.admin = false;
    }

    console.log(user.admin);
    res.send({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        admin: user.admin,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    res.status(500).send("Erro ao fazer login");
  }
});

module.exports = router;
