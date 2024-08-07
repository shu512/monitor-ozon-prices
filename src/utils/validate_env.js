const fs = require("fs");

const fileNotExistMsg = "[Error] Couldn't find .env file! Use .env.exmaple and fill it with your own parameters.";
const requiredFieldsMsg = '[Error] Next fields are required in .env file:';

const validateEnv = () => {
  const requiredEnvFields = ['DB_NAME', 'DB_USER', 'DB_HOST', 'DB_PASSWORD', 'DB_PORT'];

  if (!fs.existsSync('.env')) {
    throw Error(fileNotExistMsg);
  }
  const unexistedFields = requiredEnvFields.filter(field => !process.env[field])
  if (unexistedFields.length > 0) {
    throw Error(`${requiredFieldsMsg} ${unexistedFields.join(', ')}.`);
  }
}

module.exports = {
  validateEnv,
}
