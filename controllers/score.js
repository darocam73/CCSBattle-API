const { connection, asyncConnection, query } = require('../db');
const { TABLES } = require('../utils/constants');
const { getSolutionsByBattleId } = require('./solutions');

const getCodeLength = (code = '') => (
  unescape(code).replace(/ /g, '').replace(/(?:\r\n|\r|\n)/g, '').length
);

const getCodeLengthPoints = (desired, solution, matching) => {
  if (matching < 90) return 0;
  const diff = desired - solution;
  return diff > 0 ? diff : 0;
}

const getMatchingPoints = (matching) => {
  if (matching < 90) {
    return parseInt(50 * (matching / 100));
  }
  if (matching < 97) {
    return parseInt(100 * (matching / 100));
  }
  return parseInt(150 * (matching / 100));
}

const calculateScores = async (req, res) => {
  const { params } = req;
  try {
    const solutions = await getSolutionsByBattleId(params.battleId);
  
    const scores = solutions.reduce((acc, cur) => {
      const htmlLengthSolution = getCodeLength(cur.html);
      const cssLengthSolution = getCodeLength(cur.css);
  
      const htmlPoints = getCodeLengthPoints(cur.htmlLength, htmlLengthSolution, cur.matching);
      const cssPoints = getCodeLengthPoints(cur.cssLength, cssLengthSolution, cur.matching);
      const matchingPoints = getMatchingPoints(cur.matching);
      const bonus = cur.matching === 100 ? 50 : null;
  
      const challengeTotal = htmlPoints + cssPoints + matchingPoints + bonus;
  
      return {
        ...acc,
        [cur.userId]: {
          data: [
            ...(acc[cur.userId]?.data || []),
            {
              ...cur,
              htmlLengthSolution,
              cssLengthSolution,
              points: {
                htmlPoints,
                cssPoints,
                matchingPoints,
                bonus,
                total: challengeTotal,
              }
            }
          ],
          total: (acc[cur.userId]?.total || 0) + challengeTotal,
        }
      }
    }, {});

    const parsedScores = Object.keys(scores).map((playerId) => {
      const playerScores = scores[playerId];
      return {
        playerId,
        username: unescape(playerScores.data[0]?.username),
        scores: playerScores.data,
        totalScore: playerScores.total,
      }
    });
  
    return res.status(200).send({ data: parsedScores });
  } catch (error) {
    return res.status(404).send({ error });
  }
};

module.exports = {
  calculateScores,
};
