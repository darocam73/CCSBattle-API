const express = require('express');
const {
  getAll,
  getById,
  add,
  getByBattleId,
  startBattle,
  getBattleStatus,
  addLevels,
} = require('../controllers/battle');
const router = express.Router();

// /* GET battles */
router.get('/', async (req, res) => {
  getAll(req, res);
});

/* GET levels by battle id */
router.get('/:id/status', async (req, res) => {
  const { params: { id }} = req;
  const status = await getBattleStatus(id);
  if (!status) {
    return res.status(500).send({ error: 'Internal error' });
  }
  if (status.finished === 1) {
    return res.status(200).send({ data: { finished: true } });
  }
  if (!status.started_at) {
    return res.status(200).send({ data: { waiting: true } });
  }
  res.status(200).send({ data: { running: true } });
});

/* GET levels by battle id */
router.get('/:id/levels', async (req, res) => {
  getByBattleId(req, res);
});

/* GET battle by id. */
router.get('/:id', async (req, res) => {
  getById(req, res);
});

/* Add battle */
router.post('/', (req, res) => {
  add(req, res);
});

/* Start battle */
router.patch('/:id/start', (req, res) => {
  startBattle(req, res);
});

router.post('/:id/addLevels', (req, res) => {
  addLevels(req, res);
});

module.exports = router;