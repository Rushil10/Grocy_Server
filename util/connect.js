const mysql = require('mysql');

const connection = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'password',
    database:'test_schema',
    charset:'utf8mb4'
})

connection.connect()

module.exports={connection};

