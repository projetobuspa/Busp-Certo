const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
const { promisify } = require("util");

const DBConn = async () => {
  try {
    const dbFile = process.env.DB_FILE || path.join(__dirname, "..", "data", "database.sqlite");
    const dbDir = path.dirname(dbFile);
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

    const db = new sqlite3.Database(dbFile, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        throw err;
      }
    });

    // Promisify database methods
    const runAsync = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
          if (err) {
            console.error('Error executing query:', err);
            return reject(err);
          }
          resolve({ lastID: this.lastID, changes: this.changes });
        });
      });
    const allAsync = promisify(db.all.bind(db));
    const getAsync = promisify(db.get.bind(db));

    const table = process.env.DB_TABLENAME || "users";
    await runAsync(
      "CREATE TABLE IF NOT EXISTS " + table + " (" +
      "id INTEGER PRIMARY KEY AUTOINCREMENT," +
      "username TEXT NOT NULL UNIQUE," +
      "email TEXT NOT NULL UNIQUE," +
      "password TEXT NOT NULL," +
      "created_at DATETIME DEFAULT CURRENT_TIMESTAMP)"
    );

    const poolLike = {
      query: async (sql, params = []) => {
        const trimmed = sql.trim().toUpperCase();
        if (trimmed.startsWith("SELECT")) {
          const rows = await allAsync(sql, params);
          return [rows];
        } else if (trimmed.startsWith("INSERT")) {
          const result = await runAsync(sql, params);
          return [{ insertId: result.lastID }];
        } else {
          const result = await runAsync(sql, params);
          return [{ changes: result.changes }];
        }
      },
      raw: db
    };

    console.log("SQLite DB opened at " + dbFile);
    return poolLike;
  } catch (error) {
    console.error("Error during SQLite DB connection", error);
    throw error;
  }
};

module.exports = DBConn;
