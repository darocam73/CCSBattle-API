const Jimp = require('jimp');
const jwt = require('jsonwebtoken');
const nodeHtmlToImage = require('node-html-to-image');

const getImageMatching = async (file, originalUrl) => {
  const uploadedImage = await Jimp.read(file);
  const originalImage = await Jimp.read(originalUrl);
  const { percent } = Jimp.diff(uploadedImage, originalImage);
  return parseInt(100 - percent * 100);
}

const generateHTML = (html, css) => {
  const parseHTMLCode = (code = '') => (
    code.replace(/(?:\r\n|\r|\n)/g, '').replace(/>\s+</g, '><')
  );

  return `
    <html>
      <html lang="en" style="height: 100%; margin: 0; padding: 0;">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <title>Document</title>
      </head>
      <script>
        window.resizeTo(400, 300)
    
    </script>
      <body>${parseHTMLCode(html)}</body>

      <style>
        body {
          background: #FFF;
          padding: 0;
          margin: 0;
        }
      </style>
      <style>${css}</style>
      <style>
        html, body {
          overflow: hidden!important;
          width: 400px!important;
          height: 300px!important;
          position: relative!important;
        }
      </style>
      
    </html>
  `;
}

const getImageFromHtml = (html, css) => {
  return nodeHtmlToImage({
    html: generateHTML(unescape(html), unescape(css)),
    puppeteerArgs: {
      defaultViewport: {
        width: 400,
        height: 300,
      }
    }
  });
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
  getImageFromHtml,
  getTokenData,
  toSqlDatetime,
}
