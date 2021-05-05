const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const fileupload = require("express-fileupload");
const logger = require('morgan');
const dotenv = require('dotenv').config();
const { wipeDB } = require('./controllers/wipeDB');
const { ROOMS } = require('./utils/constants');

const indexRouter = require('./routes/index');
const playerRouter = require('./routes/player');
const solutionsRouter = require('./routes/solutions');
const levelRouter = require('./routes/level');
const battleRouter = require('./routes/battle');
const scoreRouter = require('./routes/score');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, { cors: { origin: '*' }});
server.listen(process.env.SOCKET_PORT);

/* --- socket.io --- */
io.on('connection', socket => {
  console.log('Client connected!');

  socket.on('join-room', battleId => {
    const roomName = `${ROOMS.BATTLE}${battleId}`;
    socket.join(roomName);
    io.to(roomName).emit('join-room-client', `conectado a room ${roomName}`)
  })
});

app.use((req, res, next) => {
  req.io = io;
  next();
});
/* ----------------- */

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(fileupload());
app.use(express.static('public'));

app.use('/', indexRouter);
app.use('/player', playerRouter);
app.use('/solution', solutionsRouter);
app.use('/level', levelRouter);
app.use('/battle', battleRouter);
app.use('/score', scoreRouter);
app.use('/wipeDB', wipeDB);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send({ error: err });
});

module.exports = app;
