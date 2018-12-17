const mysql = require('mysql');
const log = require('../logs/logger');
const config = require('config');

const config_db = config.get("db");

const connexion = mysql.createConnection({
    host: config_db.mysql.host,
    port: config_db.mysql.port,
    database: config_db.mysql.database,
    user: config_db.mysql.user,
    password: config_db.mysql.password
});
  
connexion.connect(function(err) {
    if (err) {
        console.log("... Connect database KO");
        log.logger.error(new Date().toISOString() + ' - ' + err);
    } else {
        console.log("... Connect database OK");
    }
});

exports.con_mysql = connexion;