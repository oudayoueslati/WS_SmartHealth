// Configuration Fuseki partagée
const FUSEKI_URL = process.env.FUSEKI_URL;
const FUSEKI_USER = process.env.FUSEKI_USER || 'admin';
const FUSEKI_PASSWORD = process.env.FUSEKI_PASSWORD || 'admin123';

const fusekiAuth = {
  auth: {
    username: FUSEKI_USER,
    password: FUSEKI_PASSWORD
  }
};

module.exports = {
  FUSEKI_URL,
  fusekiAuth
};
