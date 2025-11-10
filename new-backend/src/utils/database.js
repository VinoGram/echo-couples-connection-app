const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  retry: {
    match: [
      /ETIMEDOUT/,
      /EHOSTUNREACH/,
      /ECONNRESET/,
      /ECONNREFUSED/,
      /SequelizeConnectionError/
    ],
    max: 3
  }
});

let dbConnected = false;

const connectDB = async () => {
  let retries = 5;
  while (retries > 0) {
    try {
      await sequelize.authenticate();
      console.log('Neon PostgreSQL Connected successfully');
      dbConnected = true;
      
      // Sync models in development
      if (process.env.NODE_ENV === 'development') {
        await sequelize.sync({ alter: true });
        console.log('Database synced');
      }
      return;
    } catch (error) {
      console.error(`Database connection error (${retries} retries left):`, error.message);
      retries--;
      dbConnected = false;
      if (retries === 0) {
        console.error('Failed to connect to database after 5 attempts. Using Memcached cache...');
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

const isDbConnected = () => dbConnected;

module.exports = { connectDB, sequelize, isDbConnected };