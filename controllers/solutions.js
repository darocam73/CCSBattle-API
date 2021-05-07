const { connection, asyncConnection, query } = require('../db');
const { getLevelImage } = require('./level');
const { getImageMatching, generateHTML, getTokenData, getImageFromHtml } = require('../utils');
const { TABLES } = require('../utils/constants');

const add = async (req, res) => {
  const { body } = req;
  const { id: userId } = getTokenData(req);
  
  if (
    !userId
    || !body?.challengeId
    || !body?.battleId
    || typeof body?.html === 'undefined'
    || typeof body?.css === 'undefined'
  ) return res.status(400).send({ error: 'Empty data' });
  const { matchingPercent, solutionImage } = await compareImages(req, res);
  // res.writeHead(200, { 'Content-Type': 'image/png' });
  // res.end(solutionImage, 'binary');

  const q = `
    INSERT INTO ${TABLES.SOLUTIONS_TABLE} (userId, challengeId, battleId, html, css, matching)
    VALUES (
      ${userId},
      "${body.challengeId}",
      "${body.battleId}",
      "${escape(body.html)}",
      "${escape(body.css)}",
      "${matchingPercent}"
    );
  `;
  const db = connection();

  db.query(q, (err, results) => {
    if (err) {
      return res.status(500).send({ error: err });
    }
    if(results?.insertId) {
      return res.status(200).send({
        data: {
          id: results?.insertId,
          matchingPercent,
        }
      });
    }
    return res.status(500).send();
  });

  db.end();
};

const downloadImage = async (req, res) => {
  const { body } = req;
  const { id: userId } = getTokenData(req);
  
  if (
    !userId
    || typeof body?.html === 'undefined'
    || typeof body?.css === 'undefined'
  ) return res.status(400).send({ error: 'Empty data' });

  const solutionImage = await getImageFromHtml(body.html, body.css);
  res.writeHead(200, { 'Content-Type': 'image/png' });
  res.end(solutionImage, 'binary');
};

const compareImages = async (req, res) => {
  const { body } = req;
  if (!body?.challengeId || typeof body?.css === 'undefined' || typeof body?.html === 'undefined')
    return res.status(400).send({ error: 'Empty data on compare image' });

  const originalUrl = await getLevelImage(body.challengeId);
  const solutionImage = await getImageFromHtml(body.html, body.css);
  const matchingPercent = await getImageMatching(
    solutionImage,
    `public/images/${originalUrl}`,
  );
  return { matchingPercent, solutionImage };
};

const getSolutionsByBattleId = async (battleId) => {
  const q = `
    SELECT
      a.id,
      a.challengeId,
      a.userId,
      a.html,
      a.css,
      a.matching,
      b.htmlLength,
      b.cssLength,
      b.image,
      c.name as username
    FROM ${TABLES.SOLUTIONS_TABLE} AS a
    LEFT JOIN ${TABLES.PLAYER_TABLE} AS c ON c.id = a.userId
    LEFT JOIN ${TABLES.CHALLENGES_TABLE} AS b
    ON b.id = a.challengeId
    WHERE a.battleId=${battleId}
    AND a.created_at = (
      SELECT MAX(d.created_at)
      FROM ${TABLES.SOLUTIONS_TABLE} AS d
      WHERE d.userId = a.userId AND d.challengeId=a.challengeId
      LIMIT 1
    )
    ORDER BY b.level_order ASC;
  `;

  const con = await asyncConnection();
  try {
    const [rows, fields] = await con.execute(q);
    return rows || [];
  } catch (error) {
    console.log('error', error);
    return false;
  } finally {
    con.end();
  }
}

module.exports = {
  add,
  compareImages,
  getSolutionsByBattleId,
  downloadImage,
};
