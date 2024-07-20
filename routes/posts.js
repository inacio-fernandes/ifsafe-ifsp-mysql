const express = require("express");
const router = express.Router();
const pool = require("../conexaobd");

// Pegar todos os posts
router.get("/", async (req, res) => {
  try {
    const queryPosts = `
      SELECT 
        p._id, 
        p.title, 
        p.description,
        p.image, 
        p.location,
        p.authorId,
        u.name AS authorName,
        p.status, 
        p.date,
        COUNT(DISTINCT l._id) AS likes
      FROM 
        posts p
      LEFT JOIN 
        likes l ON p._id = l.postId
      LEFT JOIN
        users u ON p.authorId = u._id
      GROUP BY 
        p._id
      ORDER BY 
        p.date DESC
    `;

    const [rowsPosts] = await pool.query(queryPosts);

    const postsWithComments = await Promise.all(
      rowsPosts.map(async (post) => {
        const queryComments = `
        SELECT 
          c._id AS commentId, 
          c.comment, 
          c.commentDate, 
          c.userId, 
          c.userName
        FROM 
          comments c
        WHERE 
          c.postId = ?
      `;
        const [rowsComments] = await pool.query(queryComments, [post._id]);

        return {
          _id: post._id,
          description: post.description,
          image: post.image,
          title: post.title,
          location: post.location,
          authorId: post.authorId.string(),
          authorName: post.authorName,
          date: post.date,
          status: post.status,
          likes: post.likes,
          comments: rowsComments,
        };
      })
    );

    res.status(200).send(postsWithComments);
  } catch (error) {
    res.status(500).send("Erro ao buscar todos posts");
    console.error("Erro ao buscar todos posts:", error);
  }
});


// Pegar um post com id específico
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const queryPost = `
      SELECT 
        p._id, 
        p.title, 
        p.description,
        p.image, 
        p.location,
        p.authorId,
        u.name AS authorName,
        p.status, 
        p.date,
        COUNT(DISTINCT l._id) AS likes
      FROM 
        posts p
      LEFT JOIN 
        likes l ON p._id = l.postId
      LEFT JOIN
        users u ON p.authorId = u._id
      WHERE 
        p._id = ?
      GROUP BY 
        p._id
    `;

    const [rowsPost] = await pool.query(queryPost, [id]);
    if (rowsPost.length === 0) {
      return res.status(404).send("Post não encontrado");
    }

    const post = rowsPost[0];

    const queryComments = `
      SELECT 
        c._id AS commentId, 
        c.comment, 
        c.commentDate, 
        c.userId, 
        c.userName
      FROM 
        comments c
      WHERE 
        c.postId = ?
    `;
    const [rowsComments] = await pool.query(queryComments, [post._id]);

    const postWithComments = {
      _id: post._id.string(),
      description: post.description,
      image: post.image,
      title: post.title,
      location: post.location,
      authorId: post.authorId,
      authorName: post.authorName,
      date: post.date,
      status: post.status,
      likes: post.likes,
      comments: rowsComments,
    };

    res.status(200).send(postWithComments);
  } catch (error) {
    res.status(500).send("Erro ao buscar post");
    console.error("Erro ao buscar post:", error);
  }
});



// Pegar todos os posts de um autor
router.get("/autor/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM posts WHERE authorId = ?", [
      id,
    ]);
    if (rows.length === 0) {
      return res.status(404).send("Posts não encontrados");
    }
    res.status(200).send(rows);
  } catch (error) {
    res.status(500).send("Erro ao buscar posts");
    console.error("Erro ao buscar posts:", error);
  }
});



// Rota para criar um novo post
router.post("/", validatePostData, async (req, res) => {
  try {
    const { description, image, title, location } = req.body;
    const newPost = {
      description,
      image,
      title,
      location,
      authorId: req.user._id,
      date: new Date(),
      status: "Pendente",
    };
    await pool.query("INSERT INTO posts SET ?", newPost);
    res.send("Post criado com sucesso!");
  } catch (error) {
    console.error("Erro ao criar post:", error);
    res.status(500).send("Erro ao criar post");
  }
});

function validatePostData(req, res, next) {
  const { description, image, title, location } = req.body;

  if (!description || !image || !title || !location) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  }
  req.body = { description, image, title, location };
  next();
}




// Rota para alterar o STATUS de um post com um ID específico
router.put("/status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, statusComment } = req.body;

    if (
      status !== "Pendente" &&
      status !== "Solucionado" &&
      status !== "Cancelado"
    ) {
      return res.status(400).send("Status do post é obrigatório");
    }

    if (!req.user || req.user.admin !== 1) {
      return res
        .status(403)
        .send("Você não tem permissão para alterar o status do post");
    }

    const [result] = await pool.query(
      "UPDATE posts SET status = ?, statusComment = ? WHERE _id = ?",
      [status, statusComment, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).send("Post não encontrado");
    }

    res.send("Status do post alterado com sucesso!");
  } catch (error) {
    console.error("Erro ao alterar status do post:", error);
    res.status(500).json({ error: "Erro ao alterar status do post" });
  }
});

// Adicionar um comentário a um post específico
router.post("/comments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    // Verificar se o post existe
    const [postRows] = await pool.query("SELECT * FROM posts WHERE _id = ?", [
      id,
    ]);
    if (postRows.length === 0) {
      return res.status(404).send("ID de post não encontrado");
    }

    const newComment = {
      comment,
      commentDate: new Date(),
      userId: req.user._id,
      userName: req.user.name,
      postId: id,
    };

    // Inserir o comentário na tabela de comentários
    const [result] = await pool.query("INSERT INTO comments SET ?", newComment);

    res.send("Comentário adicionado com sucesso!");
  } catch (error) {
    console.error("Erro ao adicionar comentário:", error);
    res.status(500).send("Erro ao adicionar comentário");
  }
});


// Adicionar uma curtida em um post específico
router.post("/likes/:id", async (req, res) => {
  try {

    const { id } = req.params;

    const [result] = await pool.query(
      "INSERT into likes SET  ?",
      { userId: req.user._id, postId: id, } 

    );
    if (result.affectedRows === 0) {
      return res.status(404).send("ID de post não encontrado");
    }

    res.send("Like adicionado com sucesso!");
  } catch (error) {
    console.error("Erro ao adicionar like:", error);
    res.status(500).send("Erro ao adicionar like");
  }
});


module.exports = router;
