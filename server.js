// server.js
const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "nodejs_tneb_db"
});

// Connect to MySQL
db.connect(err => {
  if (err) {
    console.error("❌ DB Connection Failed:", err);
    return;
  }
  console.log("✅ Connected to MySQL Database");
});
const SLABS = [
  { to: 100, rate: 0.00 },
  { to: 400, rate: 4.70 },
  { to: 500, rate: 6.30 },
  { to: 600, rate: 8.40 },
  { to: 800, rate: 9.45 },
  { to: 1000, rate: 10.50 },
  { to: Infinity, rate: 11.55 }
];

// ✅ fixed charge calculator
function calculateFixedCharge(units) {
  if (units <= 100) return 20.00;
  if (units <= 400) return 50.00;
  return 100.00;
}

// ✅ API route
app.post("/api/calculate-bill", (req, res) => {
  const { consumer_id, first_reading, second_reading } = req.body;

  if (!consumer_id || first_reading == null || second_reading == null) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (second_reading < first_reading) {
    return res.status(400).json({ error: "Second reading must be >= first reading" });
  }

  const units = second_reading - first_reading;
  let remaining = units;
  let lower = 0;
  let energy_total = 0;

  for (let i = 0; i < SLABS.length && remaining > 0; i++) {
    const slab = SLABS[i];
    const slabUpper = slab.to;
    const slabUnits = Math.max(0, Math.min(remaining, slabUpper - lower));
    if (slabUnits > 0) {
      energy_total += slabUnits * slab.rate;
      remaining -= slabUnits;
    }
    lower = slabUpper;
  }

  const fixed_charge = calculateFixedCharge(units);
  const other_charges = +(energy_total * 0.05).toFixed(2);
  const grand_total = +(energy_total + fixed_charge + other_charges).toFixed(2);

  // ✅ Insert into DB
  const sql = `
    INSERT INTO bills 
    (consumer_id, first_reading, second_reading, units, energy_total, fixed_charge, other_charges, grand_total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(
    sql,
    [consumer_id, first_reading, second_reading, units, energy_total, fixed_charge, other_charges, grand_total],
    (err, result) => {
      if (err) {
        console.error("Insert error:", err);
        return res.status(500).json({ error: "Failed to save bill" });
      }

      res.json({
        message: "Bill calculated & saved",
        bill: {
          consumer_id,
          first_reading,
          second_reading,
          units,
          energy_total,
          fixed_charge,
          other_charges,
          grand_total
        }
      });
    }
  );
});

// Add new consumer
app.post("/api/consumers", (req, res) => {
  const { consumer_number, name, address } = req.body;

  if (!consumer_number || !name || !address) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql = "INSERT INTO consumers (consumer_number, name, address) VALUES (?, ?, ?)";
  db.query(sql, [consumer_number, name, address], (err, result) => {
    if (err) {
      console.error("❌ Insert consumer error:", err);
      return res.status(500).json({ error: "Failed to add consumer" });
    }
    res.json({ message: "✅ Consumer added successfully", consumerId: result.insertId });
  });
});
// UPDATE consumer by ID
// UPDATE consumer by ID
app.put("/api/consumers/:id", (req, res) => {
  const { id } = req.params;
  const { consumer_number, name, address } = req.body;

  if (!consumer_number || !name || !address) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql = `
    UPDATE consumers 
    SET consumer_number = ?, name = ?, address = ? 
    WHERE id = ?
  `;

  db.query(sql, [consumer_number, name, address, id], (err, result) => {
    if (err) {
      console.error("❌ Update error:", err.sqlMessage || err);
      return res.status(500).json({ error: err.sqlMessage || "DB error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Consumer not found" });
    }

    res.json({ message: "✅ Consumer updated successfully!" });
  });
});



// REGISTER
app.post("/api/auth/register", (req, res) => {
  const { email, phone, password } = req.body;

  if (!email || !phone || !password) {
    return res.status(400).json({ success: false, message: "All fields required" });
  }

  const sql = "INSERT INTO users_1 (email, phone, password) VALUES (?, ?, ?)";
  db.query(sql, [ email, phone, password], (err, result) => {
    if (err) {
      console.error("❌ Insert error:", err.sqlMessage);
      return res.status(500).json({ success: false, message: "DB error", error: err.sqlMessage });
    }
    res.json({ success: true, message: "User registered successfully" });
  });
});

// LOGIN
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users_1 WHERE email = ? AND password = ?";
  db.query(sql, [email, password], (err, result) => {
    if (err) {
      console.error("❌ Login error:", err.sqlMessage);
      return res.status(500).json({ success: false, message: "DB error", error: err.sqlMessage });
    }
    if (result.length > 0) {
      res.json({ success: true, message: "Login successful", user: result[0] });
    } else {
      res.json({ success: false, message: "Invalid email or password" });
    }
  });
});
app.post("/api/consumer/add", (req, res) => {
  const { consumer_number, name, password, address } = req.body;

  if (!consumer_number || !name || !address) {
    return res.status(400).json({ success: false, message: "All fields required" });
  }

  const sql = "INSERT INTO consumers (consumer_number, name, password, address, created_at) VALUES (?, ?, ?, ?, NOW())";
  db.query(sql, [consumer_number, name, password || null, address], (err, result) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to add consumer",
        error: err.sqlMessage
      });
    }
    res.json({ success: true, message: "Consumer added successfully", consumerId: result.insertId });
  });
});



// FETCH CONSUMERS
app.get("/api/consumers", (req, res) => {
  const sql = "SELECT id, consumer_number, name, address FROM consumers ORDER BY id DESC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Fetch consumers error:", err);
      return res.status(500).json({ error: "Failed to fetch consumers" });
    }
    res.json(results);
  });
});

// SAVE BILL
// API to calculate and save bill
app.post("/api/save-bill", (req, res) => {
  const { consumerNumber, firstReading, secondReading } = req.body;

  if (!consumerNumber || !firstReading || !secondReading) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const units = secondReading - firstReading;

  // 💡 Sample charges logic (you can modify as per TNEB rules)
  let energyTotal = 0;
  if (units <= 100) {
    energyTotal = units * 2;   // ₹2 per unit
  } else if (units <= 200) {
    energyTotal = (100 * 2) + (units - 100) * 3; // Next 100 units ₹3
  } else {
    energyTotal = (100 * 2) + (100 * 3) + (units - 200) * 5; // Above 200 units ₹5
  }

  const fixedCharge = 50;
  const otherCharges = 25;
  const grandTotal = energyTotal + fixedCharge + otherCharges;

  // Find consumer
  db.query("SELECT id FROM consumers WHERE consumer_number = ?", [consumerNumber], (err, result) => {
    if (err) {
      console.error("❌ Consumer lookup error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (result.length === 0) {
      return res.status(404).json({ error: "Consumer not found" });
    }

    const consumerId = result[0].id;

    // Save bill
    const sql = `
      INSERT INTO bills 
      (consumer_id, first_reading, second_reading, units, energy_total, fixed_charge, other_charges, grand_total) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [consumerId, firstReading, secondReading, units, energyTotal, fixedCharge, otherCharges, grandTotal], (err, result) => {
      if (err) {
        console.error("❌ Insert error:", err);
        return res.status(500).json({ error: "Failed to save bill" });
      }

      res.json({
        message: "✅ Bill calculated & saved successfully!",
        billId: result.insertId,
        details: {
          consumerNumber,
          units,
          energyTotal,
          fixedCharge,
          otherCharges,
          grandTotal
        }
      });
    });
  });
});
app.put("/api/pay-bill/:id", (req, res) => {
  const { id } = req.params;

  const sql = "UPDATE bills SET status = 'PAID' WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("❌ Pay bill error:", err.sqlMessage || err);
      return res.status(500).json({ error: err.sqlMessage || "DB error" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Bill not found" });
    }
    res.json({ message: "✅ Bill paid successfully!" });
  });
});
// Get all payments
app.get("/api/payments", (req, res) => {
  const sql = "SELECT * FROM payments ORDER BY id DESC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Fetch payments error:", err.sqlMessage || err);
      return res.status(500).json({ error: err.sqlMessage || "DB error" });
    }
    res.json(results);
  });
});

// Get payments for one consumer
app.get("/api/payments/:consumer_number", (req, res) => {
  const { consumer_number } = req.params;
  const sql = "SELECT * FROM payments WHERE consumer_number = ? ORDER BY id DESC";
  db.query(sql, [consumer_number], (err, results) => {
    if (err) {
      console.error("❌ Fetch payments error:", err.sqlMessage || err);
      return res.status(500).json({ error: err.sqlMessage || "DB error" });
    }
    res.json(results);
  });
});

// Save Payment (Pay Bill)
app.post("/api/pay", (req, res) => {
  const { consumer_number, amount, method } = req.body;

  const sqlPayment = "INSERT INTO payments (consumer_number, amount, method) VALUES (?, ?, ?)";
  const sqlHistory = "INSERT INTO payment_history (consumer_number, amount, method) VALUES (?, ?, ?)";

  db.query(sqlPayment, [consumer_number, amount, method], (err, result) => {
    if (err) {
      console.error("❌ Payment insert error:", err.sqlMessage || err);
      return res.status(500).json({ error: err.sqlMessage || "Failed to save payment" });
    }

    // also save in history
    db.query(sqlHistory, [consumer_number, amount, method], (err2) => {
      if (err2) {
        console.error("❌ Payment history insert error:", err2.sqlMessage || err2);
        return res.status(500).json({ error: err2.sqlMessage || "Failed to save history" });
      }

      res.json({ message: "✅ Payment successful, saved in payments & history!" });
    });
  });
});

app.delete("/api/payment-history/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM payment_history WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("❌ Delete history error:", err.sqlMessage || err);
      return res.status(500).json({ error: err.sqlMessage || "Failed to delete history" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "History record not found" });
    }
    res.json({ message: "✅ History record deleted successfully" });
  });
});

app.put("/api/pay-bill/:id", (req, res) => {
  const billId = req.params.id;

  // 1. Get the bill first
  const getBill = "SELECT * FROM bills WHERE id = ?";
  db.query(getBill, [billId], (err, billResult) => {
    if (err) return res.status(500).json({ error: err });
    if (billResult.length === 0) return res.status(404).json({ error: "Bill not found" });

    const bill = billResult[0];

    // 2. Update bill status
    const updateBill = "UPDATE bills SET status = 'PAID' WHERE id = ?";
    db.query(updateBill, [billId], (err) => {
      if (err) return res.status(500).json({ error: err });

      // 3. Insert into payment_history
      const insertHistory = `
        INSERT INTO payment_history (consumer_number, amount, method, status)
        VALUES (?, ?, ?, ?)`;

      db.query(insertHistory, [
        bill.consumer_number,
        bill.grand_total,
        "Credit Card",   // 🔄 or take from frontend req.body.method
        "Success"
      ], (err) => {
        if (err) return res.status(500).json({ error: err });

        return res.json({ message: "Bill paid and history saved ✅" });
      });
    });
  });
});

app.post("/api/pay", (req, res) => {
  const { consumer_number, amount, method } = req.body;
  const sql = `
    INSERT INTO payment_history (consumer_number, amount, method, payment_date)
    VALUES (?, ?, ?, NOW())
  `;
  db.query(sql, [consumer_number, amount, method], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Payment stored successfully" });
  });
});


// Get Payment History
app.get("/api/history/:consumer_number", (req, res) => {
  const { consumer_number } = req.params;
  const sql = "SELECT * FROM payment_history WHERE consumer_number = ?";
  
  db.query(sql, [consumer_number], (err, result) => {
    if (err) {
      console.error("❌ Fetch history error:", err.sqlMessage);
      return res.status(500).json({ error: "Failed to fetch history", details: err.sqlMessage });
    }
    res.json(result);
  });
});

// Delete a history record
app.delete("/api/history/delete/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM payments WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: "Failed to delete history" });
    res.json({ message: "History deleted successfully" });
  });
});


app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
