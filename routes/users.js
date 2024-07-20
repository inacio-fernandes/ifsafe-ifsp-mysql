const express = require("express");
const pool = require("../conexaobd");
const authMiddleware = require("../jwt/authMiddleware");

const router = express.Router();

// Middleware para verificar a identidade
const verifyIdenty = (req, res, next) => {
  const userIdFromToken = req.user._id;
  const userIdFromParams = req.params.id;

  if (userIdFromToken != userIdFromParams) {
    console.log(
      "userIdFromToken",
      userIdFromToken,
      "userIdFromParams",
      userIdFromParams
    );

    return res
      .status(403)
      .send("Você não tem permissão para atualizar este usuário");
  }

  // Se a identidade for verificada com sucesso, chame next() para continuar com a próxima função de middleware ou rota
  next();
};

// GET /users - Obtém todos os usuários
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users");
    res.status(200).send(rows);
  } catch (error) {
    console.error("Erro ao buscar todos usuários:", error);
    res.status(500).send("Erro ao buscar todos usuários");
  }
});

// GET /users/id - Obtém o nome do usuário autenticado
router.get("/id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const [rows] = await pool.query("SELECT name FROM users WHERE _id = ?", [
      userId,
    ]);
    if (rows.length === 0) {
      return res.status(404).send("Usuário não encontrado");
    }
    res.status(200).send(rows[0].name);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    res.status(500).send("Erro ao buscar usuário");
  }
});

// POST /users - Cria um novo usuário
router.post("/", async (req, res) => {
  try {
    let { email, password, name, avatar } = req.body;
    if (!email || !password || !name) {
      return res
        .status(400)
        .send(
          "Todos os campos (email, password, name e avatar) são necessários"
        );
    }
    email = email.toLowerCase();

    const [existingUser] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if (existingUser.length > 0) {
      return res.status(409).send("Email já cadastrado");
    }

    const [result] = await pool.query(
      "INSERT INTO users (email, password, name, admin, avatar) VALUES (?, ?, ?, ?, ?)",
      [email, password, name, 0, avatar]
    );

    res.status(201).send("Usuário criado com sucesso!");
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    res.status(500).send("Erro ao criar usuário");
  }
});

// PUT /users/:id - Atualiza o usuário com um ID específico
router.put("/:id", authMiddleware, verifyIdenty, async (req, res) => {
  try {
    const userIdFromParams = req.params.id;
    const { newpassword, oldpassword, name, avatar } = req.body;

    const [rows] = await pool.query("SELECT * FROM users WHERE _id = ?", [
      userIdFromParams,
    ]);

    if (rows.length === 0) {
      return res.status(404).send("Usuário não encontrado");
    }

    const user = rows[0];
    const updateData = {};

    if (newpassword) {
      if (oldpassword !== user.password) {
        console.log(
          "Senha antiga:",
          oldpassword,
          " Senha do usuário ",
          user.password
        );
        return res.status(400).send("Senha antiga não confere");
      }
      updateData.password = newpassword;
    }

    if (name) {
      updateData.name = name;
    }
    if (avatar) {
      updateData.avatar = avatar;
    }

    const fields = Object.keys(updateData)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(updateData);

    if (fields.length > 0) {
      await pool.query(`UPDATE users SET ${fields} WHERE _id = ?`, [
        ...values,
        userIdFromParams,
      ]);
    }

    res.status(200).send("Usuário atualizado com sucesso");
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).send("Erro ao atualizar usuário");
  }
});

module.exports = router;
