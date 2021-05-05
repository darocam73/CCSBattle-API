const express = require('express');
const {
  add,
  getPlayer,
} = require('../controllers/player');
const router = express.Router();

/* GET player */
router.get('/info', async (req, res) => {
  getPlayer(req, res);
});

/* Add player */
router.post('/', (req, res) => {
  add(req, res);
});

module.exports = router;
