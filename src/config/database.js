import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dialect = process.env.DB_DIALECT || 'mysql';
const isPostgres = dialect === 'postgres';

const dialectOptions = {};
if (isPostgres && process.env.DB_SSL === 'true') {
  dialectOptions.ssl = {
    require: true,
    rejectUnauthorized: false
  };
}

export const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect,
      dialectOptions,
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
    })
  : new Sequelize(
      process.env.DB_NAME || 'proyecto_grados',
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : (isPostgres ? 5432 : 3306),
        dialect,
        dialectOptions,
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
      }
    );

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`Conexión a la base de datos (${dialect.toUpperCase()}) establecida correctamente.`);
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error.message);
    throw error;
  }
};
