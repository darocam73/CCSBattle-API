const { connection, query } = require('../db');
const jwt = require('jsonwebtoken');
const { TABLES } = require('../utils/constants');
const { getTokenData } = require('../utils');

const getPlayer = async (req, res) => {
  const { id } = getTokenData(req);
  if (!id) return res.status(400).send({ error: 'Token is missing...' });

  const q = `SELECT id, name FROM ${TABLES.PLAYER_TABLE} WHERE id=${id};`;
  const db = connection();

  db.query(q, (err, results) => {
    if (err) {
      return res.status(500).send({ error: err });
    }
    if(results) {
      return res.status(200).send({ data: { player: results[0] } });
    }
    return res.status(500).send();
  });

  db.end();
};

const add = async (req, res) => {
  const { body } = req;
  if (!body?.name) return res.status(400).send({ error: 'Empty name' });
  const q = `INSERT INTO ${TABLES.PLAYER_TABLE} (name) VALUES ("${escape(body.name)}");`;
  const db = connection();

  db.query(q, (err, results) => {
    if (err) {
      return res.status(500).send({ error: err });
    }
    if(results?.insertId) {
      const token = jwt.sign({ userName: body.name, id: results.insertId }, process.env.SECRET);
      return res.status(200).send({ data: { token } });
    }
    return res.status(500).send();
  });

  db.end();
};

module.exports = { add, getPlayer };
