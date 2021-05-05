const express = require('express');
const {
  calculateScores,
} = require('../controllers/score');
const router = express.Router();

/* Calculate scores for the battle id. */
router.get('/:battleId', async (req, res) => {
  calculateScores(req, res);
});

module.exports = router;