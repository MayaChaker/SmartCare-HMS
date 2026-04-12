const { Sequelize } = require("sequelize");
require("dotenv").config();

// Create a new Sequelize instance with MySQL
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "localhost",
    dialect: process.env.DB_DIALECT || "mysql",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      // Uncomment if you need SSL or specific options for production
    },
  }
);

module.exports = { sequelize };
