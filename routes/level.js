const express = require('express');
const {
  getAll,
  getById,
} = require('../controllers/level');
const router = express.Router();

/* GET levels */
router.get('/', async (req, res) => {
  getAll(req, res);
});

/* GET level by id. */
router.get('/:id', async (req, res) => {
  getById(req, res);
});

module.exports = router;