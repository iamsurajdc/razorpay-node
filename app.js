const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const exphbs = require('express-handlebars');
const indexRouter = require('./routes/index');
// const serviceRouter = require('./modules/service/routes');
const userRouter = require('./modules/user/routes');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

app.use(logger('dev'));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({limit: '500mb'}));
app.use(bodyParser.urlencoded({limit: "500mb", extended: true, parameterLimit:50000}));
app.use(cookieParser());
app.use(
  cors()
  // cors({
  //   exposedHeaders: ['auth']
  // })
);
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api/user', userRouter);
// app.use('/api/service', serviceRouter)
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
