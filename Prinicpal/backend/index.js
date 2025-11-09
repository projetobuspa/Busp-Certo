//importing express library
const express = require("express");
const app = express();

//importing database function
const DBConn = require("./config/DBConn");

//importing dotenv library
require("dotenv").config();
const port = process.env.PORT || 5000;

//importing auth router here
const router = require("./routes/AuthRoutes");

//importing cors library
const cors = require("cors");

//importing the bodyparser library for accepting json data
const bodyParser = require("body-parser");

//using cors for avoiding cross origin resource sharing error while sending req to server
app.use(cors());

//middlewares for accepting incoming json and parsing data
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

//creating a IIFE async await function for starting the database connection function as soon as possible and passing it down to the routes and starting the server after it

let pool; // initialize the database connection pool

const startServer = async () => {
  try {
    // Tenta conectar ao banco de dados
    pool = await DBConn();
    console.log('Database connection established successfully');

    // Middleware para tratamento de erros de banco de dados
    app.use((req, res, next) => {
      if (!pool) {
        return res.status(500).json({ error: 'Database connection not available' });
      }
      req.pool = pool;
      next();
    });

    // Middleware para tratamento de erros
    app.use((err, req, res, next) => {
      console.error('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });

    //declaring auth router here
    app.use("/auth", router);

    // Inicia o servidor
    const server = app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });

    // Tratamento de erros do servidor
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use`);
        process.exit(1);
      } else {
        console.error('Server error:', error);
      }
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  if (pool && pool.raw) {
    console.log('Closing database connection...');
    await pool.raw.close();
  }
  process.exit(0);
});

// Start the server
startServer();
