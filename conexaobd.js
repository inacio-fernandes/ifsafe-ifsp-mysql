const mysql = require("mysql2");

const pool = mysql.createPool({
  host: "roundhouse.proxy.rlwy.net",
  user: "root",
  password: "ALyyKahqpBJXaKmhiOLIDRYUfkjiIvSg",
  database: "railway",
  port: 17699,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


module.exports = pool.promise();
