const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
const { promisify } = require("util");

const DBConn = async () => {
  try {
    // Configurar caminho do banco de dados
    const dbFile = process.env.DB_FILE || path.join(__dirname, "..", "data", "database.sqlite");
    const dbDir = path.dirname(dbFile);
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

    // Criar conexão com o banco
    const db = new sqlite3.Database(dbFile);

    // Funções auxiliares
    const runAsync = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        });
      });

    const allAsync = promisify(db.all.bind(db));
    const getAsync = promisify(db.get.bind(db));

    // Criar tabela se não existir
    const table = process.env.DB_TABLENAME || "users";
    await runAsync(
      `CREATE TABLE IF NOT EXISTS ${table} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    );

    // Interface compatível com mysql2
    return {
      query: async (sql, params = []) => {
        try {
          sql = sql
            .replace(/\`/g, '"')
            .replace(/\\"/g, '"')
            .replace(/TIMESTAMP/gi, 'DATETIME');

          const trimmed = sql.trim().toUpperCase();
          
          if (trimmed.startsWith("SELECT COUNT")) {
            const result = await getAsync(sql, params);
            return [result ? [result] : []];
          } else if (trimmed.startsWith("SELECT")) {
            const rows = await allAsync(sql, params);
            return [rows];
          } else if (trimmed.startsWith("INSERT")) {
            const result = await runAsync(sql, params);
            return [{ insertId: result.lastID }];
          } else {
            const result = await runAsync(sql, params);
            return [{ affectedRows: result.changes }];
          }
        } catch (error) {
          console.error("Query error:", error);
          throw error;
        }
      },
      close: () => {
        return new Promise((resolve, reject) => {
          db.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
    };
  } catch (error) {
    console.error("Database connection error:", error);
    throw error;
  }
};

module.exports = DBConn;