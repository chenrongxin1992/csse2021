var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const bodyParser = require('body-parser');

//路由
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
//20210730
const manage = require('./routes/manage/manage');
const ueditor = require('./routes/ueditor/ueditor');
//20220105
const moment = require('moment')
const forlog = require('./db/db_struct').forlog
const cmsContent = require('./db/db_struct').cmsContent
//20210730
const session = require('express-session')
const MongoStore = require('connect-mongo')(session);

//20210818
var fs = require('fs')
var FileStreamRotator = require('file-stream-rotator')
var logDirectory = path.join(__dirname, 'logs')
console.log('logs path------>',logDirectory)
// ensure log directory exists
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)
console.log('logs path------>',logDirectory)
//log4js
const log4js = require('log4js')
//通过configure()配置log4js
log4js.configure({
    'appenders': {
      //设置控制台输出 （默认日志级别是关闭的（即不会输出日志））
      //console: {  type: 'stdout' },
      'fileLog': { 
        type: 'file', 
        filename: './logs/error-',
        pattern: ".yyyy-MM-dd.log",
        maxLogSize: 100000000,
        encoding: "utf-8",
        alwaysIncludePattern: true
      }
    },'categories':{
      //'fileLog': { appenders: ['fileLog'], level: 'INFO' },
      default: { appenders: ['fileLog'], level: 'ALL' }
    }
});
//manage route
const base_url = '/csse/manage/'//'/manage/'

const logger1 = log4js.getLogger('default');
const logger2 = log4js.getLogger('default');
//console.log = logger2.info.bind(logger2)

var app = express();

//20210818
// create a rotating write stream
var accessLogStream = FileStreamRotator.getStream({
  date_format: 'YYYYMMDD',
  filename: path.join(logDirectory, 'access-%DATE%.log'),
  frequency: 'daily',
  verbose: false
})

// setup the logger //两个记录
app.use(logger('short', {stream: accessLogStream}))
app.use(log4js.connectLogger(logger1, {level: log4js.levels.INFO,format:':method :url'}));//error log

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json({limit: '50mb'}));
app.use(bodyParser.json({limit:'50mb'}));
app.use(bodyParser.urlencoded({ limit:'50mb',extended: false }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//设置 session
app.use(session({ 
    resave: true, //是指每次请求都重新设置session cookie，假设你的cookie是6000毫秒过期，每次请求都会再设置6000毫秒
    saveUninitialized: false, // 是指无论有没有session cookie，每次请求都设置个session cookie ，默认给个标示为 connect.sid。
    secret: 'spatial',
    cookie:{ 
        maxAge: 24 *60 * 60 * 1000, //60分钟有效期
        httpOnly: true
        //expires : new Date(Date.now() + 7200000)//默认是UTC时间，Date.now()获取当前时间的时间戳，输出是毫秒。
    },
    //store:new MongoStore({url: 'mongodb://test:test@localhost:27017/csse'})
    store:new MongoStore({url: 'mongodb://newcsse:youtrytry@localhost:27017/newcsse'})
}));

app.use(function(req,res,next){
  console.log('---------------- 设置语言 req.cookies["L"] ------------- ',req.cookies["L"])
  console.log('---------------- 设置语言 req.query["L"]------------- ',req.query["L"])
	//console.log('----设置语言-----') typeof(reValue) == “undefined”
 if (!req.cookies["L"]) {
	//if (typeof(req.cookies["L"]) == "undefined") {
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
//check ip && 操作记录
app.use(function(req,res,next){
  let ip = req.headers['x-forwarded-for'] || // 判断是否有反向代理 IP
  req.connection.remoteAddress || // 判断 connection 的远程 IP
  req.socket.remoteAddress || // 判断后端的 socket 的 IP
  req.connection.socket.remoteAddress || 
  req.headers['x-real-ip']
  if(ip){
    // 拿到ip进行下一步操作
    //res.send({ip:ip})
  }else{ 
      //获取不到时
      ip =req.ip().substring(req.ip().lastIndexOf(":") + 1)	
  }
  console.log('ip --------------------->' ,ip)
  let url = req.originalUrl
  console.log('访问链接---------------------------->',url)
  if(url.indexOf('manage')!=-1){
    console.log('--------------访问后台链接，检查session---------------')
    if(req.session.account){
      let newforlog = new forlog({
        ip:ip,
        url:url,
        date:moment().format('YYYY-MM-DD'),
        exacttime:moment().format('YYYY-MM-DD HH:mm:ss'),
        user:req.session.account,
        caozuo:check_caozuo(url)
      })
      newforlog.save(function(error){
        if(error){
          next(error)
        }
        next()
      })
    }else{
      console.log('----------用户未登录，暂不操作----------------')
      next()
    }
  }else{
    next()
  }
})
//20220105
function check_caozuo(url){
  if(url.indexOf('add')!=-1){
    return '新增/更新'
  }
  else if(url.indexOf('del')!=-1){
    return '删除'
  }
  else if(url.indexOf('upload')!=-1){
    return '上传'
  }
  else if(url.indexOf('_data')!=-1){
    return '查询'
  }
  else{
    return '手动确认'
  }
}
app.use(function(req,res,next){
  console.log('------------ 获取菜单中跳转公众号链接 --------------')
  let search = cmsContent.findOne({id:724})//获取position的微信链接
			search.exec(function(err,doc){
					if(err){
						return next(err)
					}
					console.log('------------------------',doc.gzhlink)
					res.locals.position_gzhlink = doc.gzhlink
					next()
				})
})
app.use('/', indexRouter);
app.use('/users', usersRouter);
//20210730
app.use('/manage',function(req,res,next){
  console.log('check login',req.url)
  console.log()
  console.log(req.session)
  res.locals.base_url = base_url
  console.log('check baseurl----->',base_url)
  if(req.url == '/login' || (req.url).indexOf("/vcode") != -1){
    next()
  }else{
    if(req.session.account==''||req.session.account==null){
        console.log('no login redirect')
        //本地与服务器
        //return res.redirect('/manage/login')
        return res.redirect('/csse/manage/login')//本地
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
