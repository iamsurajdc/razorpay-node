// MYSQL Database file

const mysql = require('mysql');
const config = require('../../config');

const con = mysql.createConnection({
  host: config.databaseHost,
  user: config.databaseUser,
  password: config.databasePassword,
  database: config.databaseDatabaseName,
  multipleStatements: true
});

con.connect(function(err) {
  if (err) {
    console.log(err);
    console.log('Error connecting to Database');
    return;
  }
  console.log('Connection established Successfully to [' + config.databaseHost + " DB : [" + config.databaseDatabaseName + "]" );
});

module.exports = con;
