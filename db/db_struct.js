/**
 *  @Author:    chenrongxin
 *  @Create Date:   2021-7-30
 *  @Description:   题目类别表
 */

    const mongoose = require('mongoose')
    mongoose.Promise = global.Promise;
    //服务器上
    const DB_URL = 'mongodb://newcsse:youtrytry@localhost:27017/newcsse'
    //本地
    //const DB_URL = 'mongodb://localhost:27017/dxxxhjs'
    mongoose.connect(DB_URL,{useNewUrlParser:true,useUnifiedTopology: true})//{ useUnifiedTopology: true }

    /**
      * 连接成功
      */
    mongoose.connection.on('connected', function () {    
        console.log('Mongoose connection open to ' + DB_URL);  
    });    

    /**
     * 连接异常
     */
    mongoose.connection.on('error',function (err) {    
        console.log('Mongoose connection error: ' + err);  
    });    
     
    /**
     * 连接断开
     */
    mongoose.connection.on('disconnected', function () {    
        console.log('Mongoose connection disconnected');  
    });   

//var mongoose = require('./db'),
    let Schema = mongoose.Schema,
    moment = require('moment')

const userSchema = new Schema({
  id:{type:Number},
  list:{type:Number},//不知道是啥，后期看看删除
  type:{type:String},//分系统创建和校园卡两种
  power:{type:String},//分管理员和教职工两种
  pageName:{type:String},//页面名称，有的为空，有的为校园卡号
  account:{type:String},//登录账号，英文或者校园卡号
  college:{type:String},//学院
  college1:{type:String},//英文
  number:{type:String},//校园卡号，后期去掉
  userName:{type:String},//名字
  userName1:{type:String},//英文名
  password:{type:String},
  sex:{type:String},
  sex1:{type:String},
  avatar:{type:String},//头像
  idCardNO:{type:String},
  email:{type:String},
  qq:{type:String},
  mobile:{type:String},
  mobileSZU:{type:String},
  phoneOffice:{type:String},
  AddressOffice:{type:String},
  AddressOffice1:{type:String},
  zhicheng:{type:String},
  zhicheng1:{type:String},
  xuewei:{type:String},
  xuewei1:{type:String},
  xueli:{type:String},
  xueli1:{type:String},
  biyeSchool:{type:String},
  biyeSchool1:{type:String},
  zhiwu:{type:String},
  zhiwu1:{type:String},
  intro:{type:String},
  intro1:{type:String},
  introNaked:{type:String},
  intro1Naked:{type:String},
  inXi:{type:String},
  inxi1:{type:String},
  inSuo:{type:String},
  inSuo1:{type:String},
  inDang:{type:String},
  inDang1:{type:String},
  urlJump:{type:String},
  urlJumpBool:{type:String},
  isVerify:{type:String},
  isDelete:{type:String},
  timeAdd:{type:String},
  timeEdit:{type:String},
  ipAdd:{type:String},
  idAdd:{type:String},
  accountAdd:{type:String},
  personalLink:{type:String},//个人主页，新增
  personalLink_switch:{type:Number,default:1},//是否展示个人主页
  suoxi:{type:String},//所/系，新增
  suoxi1:{type:String},
  jybj:{type:String},//教育背景，新增
  jybj1:{type:String},
  yjly:{type:String},//研究领域 新增
  yjly1:{type:String},
  jstype1:{type:String},
  jstype:{type:String,default:''}//教师队伍类别，新增
},{collection:'allUser'})
const cmsContentSchema = new Schema({
    id:{type:Number},
    idKey:{type:Number},//文章id
    idClass:{type:Number},//不知道
    trees:{type:String},//分类 学院介绍153-227-
    title:{type:String},
    titleEN:{type:String},
    pageContent:{type:String},
    pageContentNaked:{type:String},
    pageContentEN:{type:String},
    viewsInt:{type:Number,default:0},
    viewsCount:{type:Number}, 
    timeAdd:{type:String,default:moment().format('YYYY/MM/DD HH:mm:ss')},
    timeEdit:{type:String,default:moment().format('YYYY/MM/DD HH:mm:ss')},
    list:{type:Number},
    isRed:{type:Number,default:0},
    isBold:{type:Number,default:0},
    isTop:{type:Number,default:0},
    isDisplay:{type:Number,default:1},
    isCas:{type:Number,default:0},
    isDelete:{type:Number,default:0},
    url:{type:String},
    idAdd:{type:Number},
    accountAdd:{type:String},
    fujianName:{type:String},//附件
    fujianPath:{type:String},
    timeAddStamp:{type:String,default:moment().format('X')},//主要用于排序
    tag1:{type:String},//2021新增字段，标识所属一级菜单
    tag2:{type:String}//2021新增字段，标识当前菜单
},{collection:'cmsContent'})
const cmsSliderSchema = new Schema({
    id:{type:Number},
    isDisplay:{type:Number,default:1},
    isDelete:{type:Number},
    list:{type:Number},
    title:{type:String},
    title1:{type:String},
    pic:{type:String},
    url:{type:String},
    urlTarget:{type:String},
    memo:{type:String},
    memo1:{type:String},
    timeAdd:{type:String,default:moment(new Date()).format('YYYY-MM-DD HH:mm')},
    timeEdit:{type:String,default:moment(new Date()).format('YYYY-MM-DD HH:mm')},
    idAdd:{type:Number},
    accountAdd:{type:String},
    jianjie:{type:String,default:'无'},
    jianjie1:{type:String,}
},{collection:'cmsSlider'})
var meetingSchema = new Schema({ 
    room_name :{type:String},//会议室编号
    title : {type:String},//会议主题
    num : {type:Number},//人数
    start : {type:String},//开始时间
    alldaystart : {type:String},//api开始时间 2019-12-18 08:30
    end : {type:String},//结束时间
    endtimestamp:{type:String},
    alldayend : {type:String},//api结束时间 2019-12-18 20:30
    date : {type:String},//日期
    fuzeren : {type:String},//负责人
    phone : {type:String},//联系方式
    applyname : {type:String},//申请人
    applytime : {type:String,default:moment(new Date()).format('YYYY-MM-DD HH:mm')},//申请时间
    applytimestamp : {type:String,default:moment().format('X')},
    date_timestamp : {type:String},//日期时间戳
    allDay : {type:Boolean,default:false},
    judgedate : {type:String},//全天申请的时候使用，用于判断是否过期变灰，默认等于req.body.end
    isok : {type:Number,default:0}//是否批准 0否 1准
},{collection:'meeting'})

exports.meeting = mongoose.model('meeting',meetingSchema)
exports.user = mongoose.model('allUser',userSchema)
exports.cmsContent = mongoose.model('cmsContent',cmsContentSchema)
exports.cmsSlider = mongoose.model('cmsSlider',cmsSliderSchema)
