const { connection, asyncConnection, query } = require('../db');
const { TABLES, ROOMS } = require('../utils/constants');
const { getTokenData, toSqlDatetime } = require('../utils');

const getAll = async (req, res) => {
  const q = `
    SELECT id, name, duration
    FROM ${TABLES.BATTLE_TABLE};
  `;
  const db = connection();

  db.query(q, (err, results) => {
    if (err) {
      return res.status(500).send({ error: err });
    }
    if(results) {
      return res.status(200).send({ data: results });
    }
    return res.status(500).send();
  });

  db.end();
};

const getById = (req, res) => {
  const { params } = req;
  const { id: userId } = getTokenData(req);
  if (!userId) return res.status(400).send({ error: 'Token is missing...' });

  const q = `
    SELECT id, name, duration, IF(created_by=${userId}, 1, 0) as is_owner
    FROM ${TABLES.BATTLE_TABLE}
    WHERE id = ${params.id};
  `;
  const db = connection();

  db.query(q, (err, results) => {
    if (err) {
      return res.status(500).send({ error: err });
    }
    if(results?.length) {
      return res.status(200).send({ data: results[0] });
    } else {
      return res.status(404).send({ error: 'Entry not found.' });
    }
  });

  db.end();
};

const add = async (req, res) => {
  const { body } = req;
  if (!body?.name || !body?.duration) return res.status(400).send({ error: 'Missing fields' });
  const q = `
    INSERT INTO ${TABLES.BATTLE_TABLE} (name, duration)
    VALUES ("${escape(body.name)}", ${body.duration});
  `;
  const db = connection();

  db.query(q, (err, results) => {
    if (err) {
      return res.status(500).send({ error: err });
    }
    if(results?.insertId) {
      return res.status(200).send({ data: results?.insertId });
    }
    return res.status(500).send();
  });

  db.end();
};

const getByBattleId = (req, res) => {
  const { params } = req;
  const { id: userId, userName } = getTokenData(req);
  if (!userId) return res.status(400).send({ error: 'Token is missing...' });

  const q = `
    SELECT a.id, a.level_order, b.matching
    FROM ${TABLES.CHALLENGES_TABLE} as a
    INNER JOIN ${TABLES.BATTLE_CHALLENGES_TABLE_RELATION} as c
    ON c.battleId = ${params.id} AND c.challengeId = a.id
    LEFT JOIN ${TABLES.SOLUTIONS_TABLE} as b
    ON b.id = (
      SELECT MAX(d.id)
      FROM ${TABLES.SOLUTIONS_TABLE} as d
      WHERE d.challengeId = c.challengeId AND d.userId = ${userId}
    )
    ORDER BY level_order ASC;
  `;

  console.log('q ', q )

  const db = connection();

  db.query(q, (err, results) => {
    if (err) {
      return res.status(500).send({ error: err });
    }
    if(results?.length) {
      return res.status(200).send({ data: { levels: results, userName } });
    } else {
      return res.status(404).send({ error: 'Entry not found.' });
    }
  });

  db.end();
};

const getBattleStatus = async (battleId) => {
  const q = `
    SELECT id, duration, started_at, finished
    FROM ${TABLES.BATTLE_TABLE}
    WHERE id=${battleId};
  `;

  try {
    const con = await asyncConnection();
    const [rows] = await con.execute(q);
    if (!rows?.length)
      return false;
    return rows[0];
  } catch (error) {
    console.error('Error getting battle status', error);
    return false;
  }
}

// Start countdown
const startBattle = async (req, res) => {
  const { params: { id: battleId } } = req;

  const { id: userId } = getTokenData(req);
  if (!userId) return res.status(400).send({ error: 'Token is missing...' });

  // Check if current user is the owner of the battle
  const q = `
    SELECT id, duration, started_at
    FROM ${TABLES.BATTLE_TABLE}
    WHERE id=${battleId} AND created_by=${userId};
  `;
  let startedAt = null;
  let duration = 0;
  try {
    const con = await asyncConnection();
    const [rows] = await con.execute(q);
    if (!rows?.length)
      return res.status(404).send({ error: 'No battle found for this user' });
    startedAt = rows[0].started_at;
    duration = rows[0].duration;
  } catch (error) {
    return res.status(404).send({ error: `Error trying to get the battle for the user ${userId}` });
  }

  const roomName = `${ROOMS.BATTLE}${battleId}`;

  // Check if the battle has finished
  if (startedAt) {
    const endDate = new Date(startedAt).getTime() + duration * 60 * 1000;
    const remainingTime = endDate - new Date().getTime();
    if (remainingTime <= 0) {
      req.io.to(roomName).emit('battle-finished');
      return res.status(200).send({ data: { status: 'ok' } });
    }
  }

  // Start counter and emit to all connected clients
  let counter = 5;
  const counterInterval = setInterval(() => {
    console.log(`Countdown: ${counter}`);
    if (counter === 0) {
      clearInterval(counterInterval);
      initBattle(battleId, duration, startedAt, req.io);
    } else {
      req.io.to(roomName).emit('battle-countdown', counter--);
    }
  }, 1000);

  return res.status(200).send({ data: { status: 'ok' } });
};

// Initiate Battle
const initBattle = async (battleId, duration, startedAt, io) => {
  console.log(`Iniciar batalla ${battleId}`);
  const roomName = `${ROOMS.BATTLE}${battleId}`;

  // Update DB started_at value if battle has not started yet
  startDate = startedAt;
  if (!startedAt) {
    startDate = new Date();
    const q = `UPDATE ${TABLES.BATTLE_TABLE} SET started_at="${toSqlDatetime(startDate)}" WHERE id=${battleId};`;
    try {
      const con = await asyncConnection();
      const [rows] = await con.execute(q);
      if (rows?.affectedRows !== 1) {
        console.error('There was a problem saving the starting time for this battle...');
        return;
      }
      con.end();
    } catch (error) {
      console.error('Error trying to start the battle', error);
    }
  }

  const endDate = new Date(startDate).getTime() + duration * 60 * 1000;

  // Battle timer
  const battleTimer = setInterval(() => {
    const remainingTime = endDate - new Date().getTime();
    console.log(`Remaining time: ${remainingTime} miliseconds`);
    if (remainingTime < 0) {
      clearInterval(battleTimer);
      finishBattle(battleId);
      io.sockets.emit('battle-finished');
      console.log('fin de la batalla');
    } else {
      io.to(roomName).emit('battle-timer', remainingTime);
    }
  }, 1000);
}

const finishBattle = async (battleId) => {
  const q = `UPDATE ${TABLES.BATTLE_TABLE} SET finished=1 WHERE id=${battleId};`;
    try {
      const con = await asyncConnection();
      const [rows] = await con.execute(q);
      if (rows?.affectedRows !== 1) {
        console.error('There was a problem finishing this battle...');
        return;
      }
      con.end();
    } catch (error) {
      console.error('Error trying to start the battle', error);
    }
}

module.exports = {
  getAll, getById, add, getByBattleId, startBattle, getBattleStatus,
};
