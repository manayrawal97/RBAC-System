const { Sequelize } = require('sequelize');

/**
 * Sequelize instance — connects to MySQL
 * Used by all models via db.sequelize
 */
const sequelize = new Sequelize(
  process.env.DB_NAME,      // database name
  process.env.DB_USER,      // username (usually 'root' locally)
  process.env.DB_PASSWORD,  // your MySQL password
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,          // set to console.log to see SQL queries
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

/**
 * Connect and sync all models to MySQL
 * alter: true updates table columns if schema changes — safe for dev
 */
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL Connected successfully.');

    await sequelize.sync({ alter: true });
    console.log('✅ Database tables synced.');
  } catch (error) {
    console.error('❌ MySQL Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };