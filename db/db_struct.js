/**
 *  @Author:    chenrongxin
 *  @Create Date:   2021-7-30
 *  @Description:   题目类别表
 */

 const mongoose = require('mongoose')
 mongoose.Promise = global.Promise;
 //服务器上
 //const DB_URL = 'mongodb://localhost:27017/csse'
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
avatar:{type:String,default:''},//头像
idCardNO:{type:String},
email:{type:String,default:''},
qq:{type:String},
mobile:{type:String,default:''},
mobileSZU:{type:String,default:''},
phoneOffice:{type:String,default:''},
AddressOffice:{type:String,default:''},
AddressOffice1:{type:String,default:''},
zhicheng:{type:String,default:''},
zhicheng1:{type:String,default:''},
xuewei:{type:String},
xuewei1:{type:String},
xueli:{type:String},
xueli1:{type:String},
biyeSchool:{type:String},
biyeSchool1:{type:String},
zhiwu:{type:String,default:''},
zhiwu1:{type:String,default:''},
intro:{type:String,default:''},
intro1:{type:String,default:''},
introNaked:{type:String,default:''},
intro1Naked:{type:String,default:''},
inXi:{type:String,default:''},
inxi1:{type:String,default:''},
inSuo:{type:String,default:''},
inSuo1:{type:String,default:''},
inDang:{type:String,default:''},
inDang1:{type:String,default:''},
urlJump:{type:String,default:''},
urlJumpBool:{type:String,default:''},
isVerify:{type:String},
isDelete:{type:String},
timeAdd:{type:String},
timeEdit:{type:String},
ipAdd:{type:String},
idAdd:{type:String},
accountAdd:{type:String},
personalLink:{type:String},//个人主页，新增
personalLink_switch:{type:Number,default:1},//是否展示个人主页
suoxi:{type:String,default:''},//所/系，新增
suoxi1:{type:String,default:''},
jybj:{type:String,default:''},//教育背景，新增
jybj1:{type:String,default:''},
yjly:{type:String,default:''},//研究领域 新增
yjly1:{type:String,default:''},
jstype1:{type:String,default:''},
jstype:{type:String,default:''},//教师队伍类别，新增
userName_py:{type:String,default:''},
display:{type:Number,default:0},//默认显示
peopleid:{type:Number,default:11},//人员类别，用来排序 1杰出2教授3副教授4讲师5助理教授6研究员7博后8技术管理9助理10副研11为其它
suoxiid:{type:Number},//所系id，排序
login_date:{type:String,default:moment().format('YYYY-MM-DD')},//限制登录
login_num:{type:Number,default:0},
rongyujibie:{type:Number},
rongyujibiename:{type:String,default:''},
rongyuname:{type:String,default:''},
rongyuname1:{type:String,default:''},//en
yewukouid:{type:Number},
yewukouname:{type:String,default:''},
yewukouname1:{type:String,default:''},
yewukousort:{type:Number,default:20}
},{collection:'allUser'})
const cmsContentSchema = new Schema({
 id:{type:Number},
 idKey:{type:Number},//文章id
 idClass:{type:Number},//不知道
 trees:{type:String},//分类 学院介绍153-227-
 title:{type:String},
 titleEN:{type:String},
 pageContent:{type:String,default:''},
 pageContentNaked:{type:String,default:''},
 pageContentEN:{type:String,default:''},
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
 url:{type:String,default:''},
    content_source_url:{type:String,default:''},
    digest:{type:String,default:''},
 idAdd:{type:Number},
 accountAdd:{type:String},
 fujianName:{type:String,default:''},//附件
 fujianPath:{type:String,default:''},
 leixing :{type:String,default:'科研动态'},//21年 新闻类型，新闻类型
 leixing1 :{type:String,default:'学术讲座'},//21年 新闻类型，通知公告类型
 year:{type:Number},//21年 成果年份
 kanwu:{type:String,default:''},//21年，刊物
 zuozhe:{type:String,default:''},//21年，作者
 danwei:{type:String,default:''},//21年，论文单位
 belongsto:{type:String,default:''},//所属研究所
 zhur:{type:String,default:''},//21主任,用于教学系
 fuzhur:{type:String,default:''},//21副主任，用于教学系
 zhur1:{type:String,default:''},//21主任,用于教学系
 fuzhur1:{type:String,default:''},//21副主任，用于教学系
 zplx:{type:String,default:''},//21新增，招聘类型
 timeAddStamp:{type:String,default:moment().format('X')},//主要用于排序
 csrankings:{type:String,default:''},
 csrankingsEN:{type:String,default:''},
 pyxm:{type:String,default:''},//国际合作培养项目
 pyxm1:{type:String,default:''},//国际合作培养项目
 hbsort:{type:Number},//合作伙伴排序
 tag1:{type:String,default:''},//2021新增字段，标识所属一级菜单
    tag2:{type:String,default:''},//2021新增字段，标识当前菜单
    review:{type:String,default:0},//审核状态,
    fromwx:{type:String,default:0},//是否来自于微信
    mediaid:{type:String},//素材id
    articleid:{type:String}//素材id
},{collection:'cmsContent'})
const cmsSliderSchema = new Schema({
 id:{type:Number},
 isDisplay:{type:Number,default:1},
 isDelete:{type:Number},
 list:{type:Number},
 title:{type:String},
 title1:{type:String},
 pic:{type:String},
 url:{type:String,default:'#'},
 urlTarget:{type:String},
 memo:{type:String,default:''},
 memo1:{type:String,default:''},
 timeAdd:{type:String,default:moment(new Date()).format('YYYY-MM-DD HH:mm')},
 timeEdit:{type:String,default:moment(new Date()).format('YYYY-MM-DD HH:mm')},
 idAdd:{type:Number},
 accountAdd:{type:String},
 jianjie:{type:String,default:'无'},
 jianjie1:{type:String,default:''},
 isen:{type:Number,default:0}
},{collection:'cmsSlider'})
const xrldSchema = new Schema({ 
 id:{type:Number},
 name :{type:String},//
 name1 :{type:String},//
 title : {type:String},//职务
 title1 : {type:String},//职务
 work : {type:String},//分管工作
 work1 : {type:String},//分管工作
 pic : {type:String},
 paixu : {type:Number},//排序
 timeAdd:{type:String,default:moment().format('YYYY/MM/DD HH:mm:ss')},
 timeEdit:{type:String,default:moment().format('YYYY/MM/DD HH:mm:ss')}
},{collection:'xrld'})
const highlightSchema = new Schema({ 
 ruanke :{type:String,default:''},//软科
 usnews : {type:String,default:''},//USNEWS
 csrankings : {type:String,default:''},//CSRANKINGS
 taiws : {type:String,default:''},//泰晤士
 qs : {type:String,default:''},//qs排名
 esc : {type:String,default:''},//esc排名
 zhuanzjs : {type:String,default:''},//专职教师
 benks : {type:String,default:''},//本科生
 yanjs : {type:String,default:''},//研究所
 guojjxm : {type:String,default:''},//国家级项目
 guojjpt : {type:String,default:''},//国家级平台
 guojjrc : {type:String,default:''},//国家级人才
 xueymj : {type:String,default:''},//总面积
 shebjz : {type:String,default:''},//设备价值
 timeAdd:{type:String,default:moment().format('YYYY/MM/DD HH:mm:ss')},
 timeEdit:{type:String,default:moment().format('YYYY/MM/DD HH:mm:ss')}
},{collection:'highlight'})
const bkzsSchema = new Schema({ 
 id:{type:Number},
 bsort:{type:String},
 zhuanye :{type:String,default:''},//
 neirong :{type:String,default:''},//
 xuefei : {type:String,default:''},//
 jxj : {type:String,default:''},//
 jiuye : {type:String,default:''},
 xyhj : {type:String,default:''},//
 lxfs : {type:String,default:''},//
 patharr:{type:Array,default:[]},//附件路径，用，隔开
 namearr:{type:Array,default:[]},//附件名，用，隔开
 timeAdd:{type:String,default:moment().format('YYYY/MM/DD HH:mm:ss')},
 timeEdit:{type:String,default:moment().format('YYYY/MM/DD HH:mm:ss')},
 timeStamp:{type:String,default:moment().format('X')}
},{collection:'bkzs'})
const bkzsinfoSchema = new Schema({ 
 id:{type:Number},
 xuefei : {type:String,default:''},//
 jxj : {type:String,default:''},//
 jiuye : {type:String,default:''},
 xyhj : {type:String,default:''},//
 lxfs : {type:String,default:''},//
 zsqk : {type:String,default:''},//
 timeAdd:{type:String,default:moment().format('YYYY/MM/DD HH:mm:ss')},
 timeEdit:{type:String,default:moment().format('YYYY/MM/DD HH:mm:ss')},
 timeStamp:{type:String,default:moment().format('X')}
},{collection:'bkzsinfo'})
const officehourSchema = new Schema({ 
 id:{type:Number},
 account :{type:String},//
 userName :{type:String},//
 term : {type:String},//
 address : {type:String},//
 phone : {type:String},
 cellphone : {type:String},//
 email : {type:String},//
 week : {type:String},//
 timeStart : {type:String},//
 timeEnd : {type:String},//
 timeStart1 : {type:String},//
 timeEnd1 : {type:String},//
 timeAdd:{type:String,default:moment().format('YYYY/MM/DD HH:mm:ss')},
 timeEdit:{type:String,default:moment().format('YYYY/MM/DD HH:mm:ss')}
},{collection:'officehour'})

const cglrSchema = new Schema({ 
 id:{type:Number},
 title :{type:String},//
 year :{type:Number},//
 yearid:{type:String,default:''},
 kanwu : {type:String,default:''},//
 zuozhe : {type:String,default:''},//
 belongsto : {type:String,default:''},
 belongsto1:{type:String,default:''},
 belongstoid : {type:Number},//
 danwei : {type:String,default:''},//
 fujianPath : {type:String,default:''},//
 pageContent:{type:String,default:''},
 pageContentEN:{type:String,default:''},
 patharr:{type:String,default:null},//附件路径，用，隔开
 namearr:{type:String,default:null},//附件名，用，隔开
    review:{type:String,default:0},//审核状态

 timeAdd:{type:String,default:moment().format('YYYY/MM/DD HH:mm:ss')},
 timeEdit:{type:String,default:moment().format('YYYY/MM/DD HH:mm:ss')}
},{collection:'cglr'})
const kanwu = new Schema({ 
},{collection:'kanwu'})

//20220105 操作记录
const forlogSchema = new Schema({ 
    ip:{type:String},
    caozuo :{type:String},//
    url :{type:String},//
    date:{type:String,default:moment().format('YYYY-MM-DD')},
    exacttime : {type:String},//
    user : {type:String}
},{collection:'forlog'})

//20220122 教学文档
const jxwdSchema = new Schema({ 
    id:{type:Number},
    cTerm :{type:String},//
    cCode :{type:String},//
    cName : {type:String},//
    cPoint : {type:Number},//
    cType : {type:String},
    cClass : {type:String},
    cTeacher : {type:String},//
    jxdg : {type:String},//教学大纲路径
    jxjdb : {type:String},//教学进度表
    syjxdg : {type:String},//实验教学大纲
    syjxapb : {type:String},//实验教学安排表
    timeAdd:{type:String,default:moment().format('YYYY/MM/DD HH:mm:ss')},
    timeEdit:{type:String,default:moment().format('YYYY/MM/DD HH:mm:ss')}
   },{collection:'jxwd'})
exports.forlog = mongoose.model('forlog',forlogSchema)
exports.cglr = mongoose.model('cglr',cglrSchema)//成果录入
exports.kanwu = mongoose.model('kanwu',kanwu)//成果录入
exports.officehour = mongoose.model('officehour',officehourSchema)//本科招生
exports.bkzs = mongoose.model('bkzs',bkzsSchema)//本科招生
exports.bkzsinfo = mongoose.model('bkzsinfo',bkzsinfoSchema)//本科招生
exports.highlight = mongoose.model('highlight',highlightSchema)//highlight
exports.xrld = mongoose.model('xrld',xrldSchema)//现任领导
exports.user = mongoose.model('allUser',userSchema)
exports.cmsContent = mongoose.model('cmsContent',cmsContentSchema)
exports.cmsSlider = mongoose.model('cmsSlider',cmsSliderSchema)
exports.jxwd = mongoose.model('jxwd',jxwdSchema)//本科招生
