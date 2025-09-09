// backend/routes/billRoutes.js
const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');

router.post('/', billController.addBill);   // POST /api/bills
router.get('/', billController.getBills);   // GET /api/bills

module.exports = router;
