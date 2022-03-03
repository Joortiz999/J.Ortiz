const util = require('util');
const mysql = require('mysql');

const { database } = require('./keys');

const pool = mysql.createPool(database);

pool.getConnection((err, connection) => {
    if (err) {
        console.error("ERROR CONNECTING TO DATABASE: " + err);
    }
    if (connection) 
        connection.release();
        console.log('CONNECTED TO DATABASE')
        return;
    
});

pool.query = util.promisify(pool.query);

module.exports = pool;