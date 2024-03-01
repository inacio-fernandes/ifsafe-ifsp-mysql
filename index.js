const express = require("express");
const app = express();
const port = 3000;

// Rota para retornar um JSON
app.get("/dados", (req, res) => {
  const dados = [
    { id: 1, nome: "Alice", idade: 25 },
    { id: 2, nome: "Bob", idade: 30 },
    { id: 3, nome: "Charlie", idade: 22 },
    // Adicione mais dados conforme necessário
  ];

  res.json(dados);
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});