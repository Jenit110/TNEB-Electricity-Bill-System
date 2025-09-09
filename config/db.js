// backend/config/db.js
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',      // your phpMyAdmin/MySQL username
  password: '',      // your MySQL password
  database: 'nodejs_tneb_db'
});

db.connect((err) => {
  if (err) {
    console.error('❌ MySQL connection failed:', err);
  } else {
    console.log('✅ Connected to MySQL database');
  }
});

module.exports = db;
