var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

//路由
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
//20210730
const manage = require('./routes/manage/manage');
const ueditor = require('./routes/ueditor/ueditor');

//20210730
const session = require('express-session')
const MongoStore = require('connect-mongo')(session);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//设置 session
app.use(session({ 
    resave: true, //是指每次请求都重新设置session cookie，假设你的cookie是6000毫秒过期，每次请求都会再设置6000毫秒
    saveUninitialized: false, // 是指无论有没有session cookie，每次请求都设置个session cookie ，默认给个标示为 connect.sid。
    secret: 'spatial',
    cookie:{ 
        maxAge: 60 * 60 * 1000, //60分钟有效期
        httpOnly: true
        //expires : new Date(Date.now() + 7200000)//默认是UTC时间，Date.now()获取当前时间的时间戳，输出是毫秒。
    },
    store:new MongoStore({url: 'mongodb://newcsse:youtrytry@localhost:27017/newcsse'})
    //store: MongoStore.create({ mongoUrl: 'mongodb://newcsse:youtrytry@localhost:27017/newcsse' })
}));

app.use(function(req,res,next){
	//console.log('----设置语言-----')
	if (!req.cookies["L"]) {
		  console.log('------- 没设置，默认1 -------')
      res.cookie("L", 1, {maxAge: 6*60*60*1000, httpOnly: true});//中文
      req.query["L"] = 1
    }else {
    	console.log('有设置语言，是--->',req.cookies["L"])
      req.query["L"] = req.cookies["L"];
      //res.clearCookie('L')
    }
    next()
})

app.use('/', indexRouter);
app.use('/users', usersRouter);
//20210730
app.use('/manage',function(req,res,next){
  console.log('check login',req.url)
  console.log()
  console.log(req.session)

  if(req.url == '/login' || (req.url).indexOf("/vcode") != -1){
    next()
  }else{
    if(req.session.account==''||req.session.account==null){
        console.log('no login redirect')
        //return res.redirect('/csse/manage/login')
        return res.redirect('/manage/login')//本地
    }else{
      console.log('------- 有session 设置 ----------')
      res.locals.username = req.session.username;   // 从session 获取 user对象
      res.locals.power = req.session.power;
      res.locals.account = req.session.account;
      //res.locals.userid = req.session.userid;
      res.locals.photo = req.session.avatar;
      next()
    }
  }
})
app.use('/manage', manage);//后台路由
app.use('/ueditor', ueditor);
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
