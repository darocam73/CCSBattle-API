const { connection, query } = require('../db');
const { TABLES } = require('../utils/constants');

// SCHEMAS
const schema = `
  DROP TABLE IF EXISTS ${TABLES.PLAYER_TABLE};
  CREATE TABLE IF NOT EXISTS ${TABLES.PLAYER_TABLE} (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=INNODB;

  DROP TABLE IF EXISTS ${TABLES.SOLUTIONS_TABLE};
  CREATE TABLE IF NOT EXISTS ${TABLES.SOLUTIONS_TABLE} (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    challengeId INT NOT NULL,
    battleId INT NOT NULL,
    html TEXT NOT NULL,
    css TEXT NOT NULL,
    matching INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=INNODB;

  DROP TABLE IF EXISTS ${TABLES.CHALLENGES_TABLE};
  CREATE TABLE IF NOT EXISTS ${TABLES.CHALLENGES_TABLE} (
    id INT AUTO_INCREMENT PRIMARY KEY,
    html TEXT NOT NULL,
    css TEXT NOT NULL,
    image VARCHAR(255) NOT NULL,
    htmlLength INT DEFAULT 0,
    cssLength INT DEFAULT 0,
    colors TEXT DEFAULT NULL,
    level_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=INNODB;

  INSERT INTO
    ${TABLES.CHALLENGES_TABLE} (html, css, image, htmlLength, cssLength, colors, level_order)
  VALUES
    ("<div></div>", "div {}", "level1.png", 20, 58, '[\"#121212\",\"#734274\",\"#948135\"]', 0),
    ("<div></div>", "div {}", "level2.png", 23, 68, '[\"#121212\",\"#734274\",\"#948135\"]', 1);

  DROP TABLE IF EXISTS ${TABLES.BATTLE_TABLE};
  CREATE TABLE IF NOT EXISTS ${TABLES.BATTLE_TABLE} (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    duration INT DEFAULT 0,
    finished TINYINT DEFAULT 0,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL DEFAULT NULL
  ) ENGINE=INNODB;

  INSERT INTO ${TABLES.BATTLE_TABLE} (name, duration, created_by) VALUES ("First battle", 30, 1);

  DROP TABLE IF EXISTS ${TABLES.BATTLE_CHALLENGES_TABLE_RELATION};
  CREATE TABLE IF NOT EXISTS ${TABLES.BATTLE_CHALLENGES_TABLE_RELATION} (
    id INT AUTO_INCREMENT PRIMARY KEY,
    battleId INT,
    challengeId INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=INNODB;

  INSERT INTO ${TABLES.BATTLE_CHALLENGES_TABLE_RELATION} (battleId, challengeId) VALUES (1, 1), (1, 2);
`;

const wipeDB = async (_, res) => {
  const db = connection();
  db.query(schema, (err, rows) => {
    if (err) throw err;
    return res.status(200).send({ status: 'ok' });
  });
  db.end();
};

module.exports = { wipeDB };
