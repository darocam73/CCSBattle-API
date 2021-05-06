const express = require('express');
const {
  add,
  compareImages,
  downloadImage,
} = require('../controllers/solutions');
const {
  getBattleStatus,
} = require('../controllers/battle');
const router = express.Router();

/* Add solution */
router.post('/', async (req, res) => {
  const { body } = req;
  if (body?.battleId) {
    const status = await getBattleStatus(body.battleId);
    if (!status) {
      return res.status(500).send({ error: 'Internal error' });
    }
    if (status.finished === 1) {
      return res.status(200).send({ data: { finished: true } });
    }
    if (!status.started_at) {
      return res.status(200).send({ data: { waiting: true } });
    }
  }
  add(req, res);
});

/* Compare Images */
router.post('/compare', async (req, res) => {
  const { matchingPercent } = await compareImages(req, res);
  return res.status(200).send({ data: { result: matchingPercent } });
});

/* Download image */
router.post('/download', async (req, res) => {
  downloadImage(req, res);
});

module.exports = router;