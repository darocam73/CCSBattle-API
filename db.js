const mysql = require('mysql2');
const mysqlPromise = require('mysql2/promise');

const connection = () => {
  const conn = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DATABASE,
    multipleStatements: true,
  });

  conn.connect((err) => {
    if (err) {
      console.log(`connectionRequest Failed ${err.stack}`);
    } else {
      console.log(`DB connectionRequest Successful`);
    }
  });

  return conn;
}

const asyncConnection = async () => {
  const connection = await mysqlPromise.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DATABASE,
    multipleStatements: true,
  });
  return connection;
}

module.exports = {
  connection,
  asyncConnection,
}
