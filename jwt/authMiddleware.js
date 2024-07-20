const jwt = require("jsonwebtoken");
const pool = require("./conexaobd");

const JWT_SECRET = "ifsp";

async function authMiddleware(req, res, next) {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).send("Acesso negado. Nenhum token fornecido.");
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "")
    : null;

  if (!token) {
    return res.status(401).send("Acesso negado. Formato de token inválido.");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    const [rows] = await pool.query("SELECT * FROM users WHERE _id = ?", [
      userId
    ]);

    if (rows.length === 0) {
      return res.status(401).send("Acesso negado. Usuário não encontrado.");
    }
    //definir userId, userName e userAvatar


    const userFromDB = rows[0];
    req.user = userFromDB;
    console.log("req.user dentro do auth", req.user);
    
    

    next();

    console.log("req.user.id dentro do auth", req.user._id);
  } catch (error) {
    console.error("Erro ao verificar token:", error);
    res.status(400).send("Token inválido.");
  }
}

module.exports = authMiddleware;
