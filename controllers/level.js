const { connection, asyncConnection, query } = require('../db');
const { TABLES } = require('../utils/constants');
const { getTokenData } = require('../utils');

const getAll = async (req, res) => {
  const { id: userId } = getTokenData(req);
  if (!userId) return res.status(400).send({ error: 'Token is missing...' });

  const q = `
    SELECT a.id, a.level_order, b.matching
    FROM ${TABLES.CHALLENGES_TABLE} as a
    LEFT JOIN ${TABLES.SOLUTIONS_TABLE} as b
    ON b.id = (SELECT MAX(c.id) FROM ${TABLES.SOLUTIONS_TABLE} as c WHERE c.challengeId = a.id AND c.userId = ${userId})
    ORDER BY level_order ASC;
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
    SELECT a.id, a.html as initialHtml, a.css as initialCss, a.image, a.htmlLength, a.cssLength, a.colors, a.level_order,
    b.userId, b.challengeId, b.html, b.css, b.matching
    FROM ${TABLES.CHALLENGES_TABLE} as a
    LEFT JOIN ${TABLES.SOLUTIONS_TABLE} as b
    ON b.id = (SELECT MAX(c.id) FROM ${TABLES.SOLUTIONS_TABLE} as c WHERE c.challengeId = a.id AND c.userId = ${userId})
    WHERE a.id=${params.id};
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

const getLevelImage = async (id) => {
  const q = `SELECT image FROM ${TABLES.CHALLENGES_TABLE} WHERE id=${id};`;

  try {
    const con = await asyncConnection();
    const [rows, fields] = await con.execute(q);
    if (!rows[0]?.image) {
      throw new Error('No image found');
    } else {
      con.end();
      return rows[0].image;
    }
  } catch (error) {
    console.log('error', error);
    con.end();
    return false;
  }
}

module.exports = {
  getAll, getById, getLevelImage,
};
