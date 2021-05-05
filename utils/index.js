const Jimp = require('jimp');
const jwt = require('jsonwebtoken');

const getImageMatching = async (file, originalUrl) => {
  const uploadedImage = await Jimp.read(file);
  const originalImage = await Jimp.read(originalUrl);
  const { percent } = Jimp.diff(uploadedImage, originalImage);
  return parseInt(100 - percent * 100);
}

const generateHTML = (html, css) => {
  return `
    <html>
      <head>
        <style>
          body {
            width: 400px!important;
            height: 300px!important;
            margin: 0!important;
            padding: 0!important;
            background: #FFF;
          }
          ${css}
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `;
}

const getTokenData = (req) => {
  const authHeader = req.header('authorization');
  if (!authHeader) return false;
  const token = authHeader.split(' ')[1];
  return jwt.verify(token, process.env.SECRET);
}

const toSqlDatetime = (inputDate) => {
  const date = new Date(inputDate);
  const dateWithOffest = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  return dateWithOffest
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');
}

module.exports = {
  getImageMatching,
  generateHTML,
  getTokenData,
  toSqlDatetime,
}
