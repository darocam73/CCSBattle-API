const express = require('express');
const {
  add,
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

/* Add new level */
router.post('/create', async (req, res) => {
  add(req, res);
});

module.exports = router;