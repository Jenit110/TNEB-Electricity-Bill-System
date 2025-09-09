// backend/controllers/billController.js
const db = require('../config/db');

// Insert new bill
exports.addBill = (req, res) => {
  const { firstReading, secondReading, units, energyTotal, fixedCharge, otherCharges, grandTotal } = req.body;

  if (!firstReading || !secondReading) {
    return res.status(400).json({ message: "Readings are required" });
  }

  const sql = `INSERT INTO bills 
    (first_reading, second_reading, units, energy_total, fixed_charge, other_charges, grand_total)
    VALUES (?, ?, ?, ?, ?, ?, ?)`;

  db.query(sql, [firstReading, secondReading, units, energyTotal, fixedCharge, otherCharges, grandTotal], (err, result) => {
    if (err) {
      console.error('Insert error:', err);
      return res.status(500).json({ message: "Error saving bill" });
    }
    res.json({ message: "Bill saved successfully", billId: result.insertId });
  });
};

// Get all bills
exports.getBills = (req, res) => {
  const sql = `SELECT * FROM bills ORDER BY created_at DESC`;
  db.query(sql, (err, rows) => {
    if (err) {
      console.error('Fetch error:', err);
      return res.status(500).json({ message: "Error fetching bills" });
    }
    res.json(rows);
  });
};
