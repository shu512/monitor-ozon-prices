const fs = require("fs");

const validateEnv = () => {
  const requiredEnvFields = ['DB_NAME', 'DB_USER', 'DB_HOST', 'DB_PASSWORD', 'DB_PORT'];

  if (!fs.existsSync('.env')) {
    throw Error("[Error] Couldn't find .env file! Use .env.exmaple and fill it with your own parameters.");
  }
  const unexistedFields = requiredEnvFields.filter(field => !process.env[field])
  if (unexistedFields.length > 0) {
    throw Error(`[Error] Next fields are required in .env file: ${unexistedFields.join(', ')}.`);
  }
}

module.exports = {
  validateEnv,
}
