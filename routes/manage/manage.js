var express = require('express');
var router = express.Router();
var mammoth = require("mammoth");
//20210730
const svgcaptcha = require('svg-captcha')
const crypto = require('crypto');

const pinyin = require('pinyin')
const user = require('../../db/db_struct').user//用户
const cmsContent = require('../../db/db_struct').cmsContent//内容
const slider = require('../../db/db_struct').cmsSlider
const xrld = require('../../db/db_struct').xrld
const highlight = require('../../db/db_struct').highlight
const bkzs = require('../../db/db_struct').bkzs
const bkzsinfo = require('../../db/db_struct').bkzsinfo
const officehour = require('../../db/db_struct').officehour
const cglr = require('../../db/db_struct').cglr
const kanwu = require('../../db/db_struct').kanwu
const forlog = require('../../db/db_struct').forlog
const jxwd = require('../../db/db_struct').jxwd
const gzl = require('../../db/db_struct').gzl
const manageconfig = require('./manageconfig')
const wx = require('../../public/manage/js/wx')
const commonfunc = require('../../public/manage/js/commonfunc')
const path = require('path')
const multiparty = require('multiparty')
const fs = require('fs')
const ejsExcel = require('ejsexcel')
const moment  = require('moment')
const attachmentuploaddir = path.resolve(__dirname, '../../public/attachment')//G:\spatial_lab\public\attachment
console.log('attachmentuploaddir --------------->',attachmentuploaddir)
fs.existsSync(attachmentuploaddir) || fs.mkdirSync(attachmentuploaddir)
const async = require('async')
const co_images = require('images')
//const basedir = '/csse'
const basedir = ''
//参数code表示退出码
process.on("exit",function(code){
	//进行一些清理工作
	console.log("I am tired...")
});
process.on('uncaughtException', function (err) {
	//打印出错误
	console.log(err);
	//打印出错误的调用栈方便调试
	console.log(err.stack);
});
function cryptoPassFunc(password) {
  const md5 = crypto.createHash('md5');
  return md5.update(password).digest('hex');
}

/* GET users listing. */
router.get('/login', function(req, res, next) {
    console.log('login')
	if(req.session.account){
		console.log('session',req.session)
		res.redirect('index')	
	}else{
		res.type('html')
		res.render('manage/login')
	}
	
	//res.render('manage/login')
}).get('/vcode',function(req,res){
	console.log(req.query)
	let option = req.query;
    // 验证码，有两个属性，text是字符，data是svg代码
    let code = svgcaptcha.create(option);
    //console.log('code',code)
    // 保存到session,忽略大小写
    req.session["randomcode"] = code.text.toLowerCase();
    console.log('session vcode',req.session["randomcode"])
	console.log()
    // 返回数据直接放入页面元素展示即可
    res.send({
        img: code.data
    });
}).post('/login',function(req,res){
	console.log('check verify',req.body.verify,req.session.randomcode)
	console.log('check username,password',req.body.username,req.body.password,cryptoPassFunc(req.body.password))
	if((req.body.verify).toUpperCase() == (req.session.randomcode).toUpperCase()){
		console.log('验证码正确-----------密码--------------------->',cryptoPassFunc(req.body.password))
		let search = user.findOne({})
			search.where('account').equals(req.body.username)
			//search.where('password').equals(cryptoPassFunc(req.body.password))
			search.exec(function(error,doc){
				console.log(doc)
				if(error){
					console.log('login error',error)
					return res.json({'code':-1,msg:error})
				}
				//20211231新增登录限制，一天中登录失败5次，不给登录
				if(doc){
					let doc_login_date = moment(doc.login_date),
							today = moment().format('YYYY-MM-DD')
						console.log('check today,login_date----->',today,doc_login_date,doc_login_date.isSame(today,'date'))
					if(doc.login_num>=5&&doc_login_date.isSame(today,'date')){
						console.log('doc.login_num------->',doc.login_num)
						return res.json({'code':-1,msg:'您今天输入密码错误5次，请明天再试。'})
					}
					//20210730 判断密码是否一致
					console.log('记录中的密码 & 提交密码--------',doc.password,cryptoPassFunc(req.body.password))
					if(doc.password != cryptoPassFunc(req.body.password)){
						console.log('------------密码错误，修改密码错误次数------------')
						
						if(doc_login_date.isSame(today,'date')){
							console.log('同一天登录，密码错误，次数加1')
							let update_obj = {
								login_date:moment().format('YYYY-MM-DD'),
								login_num:(doc.login_num)?doc.login_num+1:1
							}
							user.updateOne({'_id':doc._id},update_obj,function(error){
								if(error){
									console.log('error',error)
									return res.json({'code':-1,msg:error})
								}
								let try_num = 5-(update_obj.login_num)
								console.log('try_num---------->',try_num)
								if(try_num==0){
									return res.json({'code':-1,msg:'当天密码输错次数太多，账号锁定一天。'})
								}
								return res.json({'code':-1,msg:'密码错误，您今天还能尝试 '+ try_num + ' 次登录。'})
							})
						}else{
							console.log('不是同一天登录，密码错误，次数加1，日期更新为今天')
							let update_obj = {
								login_date:moment().format('YYYY-MM-DD'),
								login_num:(doc.login_num)?doc.login_num+1:1
							}
							user.updateOne({'_id':doc._id},update_obj,function(error){
								if(error){
									console.log('error',error)
									return res.json({'code':-1,msg:error})
								}
								let try_num = 5-(update_obj.login_num)
								console.log('try_num---------->',try_num)
								if(try_num==0){
									return res.json({'code':-1,msg:'当天密码输错次数太多，账号锁定一天。'})
								}
								return res.json({'code':-1,msg:'密码错误，您今天还能尝试 '+ try_num + ' 次登录。'})
							})
						}
					}else{
						console.log('密码一致,设置session.....')
						req.session.account = doc.account//可能是字母，可能是校园卡号
						req.session.username = doc.userName
						req.session.avatar = doc.avatar
						req.session.power = doc.power
						req.session.cookie.expires= new Date(Date.now() + 60 * 60 * 24 * 1000);
						//在这里指定各类管理员类型，党群的目前张芯蕾
						if(doc.power=='管理员'){
							if(doc.userName == '张芯蕾'){
								console.log('管理党建模块')
								req.session.powerType = 'dangqMenu'
								req.session.menu = 'dangqMenu'
							}
							if(doc.userName == '樊婷'||doc.userName=='test'){
								console.log('樊婷')
								req.session.powerType = 'ftMenu'
								req.session.menu = 'ftMenu'
							}
							if(doc.userName == '许小楚'){
								req.session.powerType = 'xxcMenu'
								req.session.menu = 'xxcMenu'
							}
							if(doc.userName == '姜欣彤'){
								req.session.powerType = 'jxtMenu'
								req.session.menu = 'jxtMenu'
							}
							if(doc.userName == '王佳岱'){
								req.session.powerType = 'wjdMenu'
								req.session.menu = 'wjdMenu'
							}
							if(doc.userName == '洪岚军'){
								req.session.powerType = 'hljMenu'
								req.session.menu = 'hljMenu'
							}
							if(doc.userName == '何文锋'||doc.userName == '何文锋2022'){
								req.session.powerType = 'hwfMenu'
								req.session.menu = 'hwfMenu'
							}
							if(doc.userName == '刘晔'){
								req.session.powerType = 'lyMenu'
								req.session.menu = 'lyMenu'
							}
							if(doc.userName == '熊大容'){
								req.session.powerType = 'xdrMenu'
								req.session.menu = 'xdrMenu'
							}
							if(doc.userName == '陈荣鑫'){
								req.session.powerType = 'all'
								req.session.menu = 'shiyanshiManagement'
							}
						}
						console.log('密码一致，如果登录错误次数不为零，重置为0')
						if(doc.login_num!=0){
							let update_obj = {
								login_date:moment().format('YYYY-MM-DD'),
								login_num:0
							}
							user.updateOne({'_id':doc._id},update_obj,function(error){
								if(error){
									console.log('error',error)
									return res.json({'code':-1,msg:error})
								}
								return res.json({'code':0})
							})
						}else{
							return res.json({'code':0})
						}
						
					}
				}
				if(!doc){
					console.log('用户不存在，移除session验证码')
					req.session["randomcode"] = null
					return res.json({'code':-1,msg:'用户不存在'})
				}
			})
	}else{
		return res.json({'code':-1,msg:'验证码错误'})
	}
}).get('/index',function(req,res){
	console.log('in manage index router',req.session.account)
	let account = req.session.account
	let search = user.findOne({'account':account})
		search.exec(function(err,doc){
			if(err){
				res.send(err)
			}
			res.render('manage/index',{user:doc,powerType:req.session.powerType,menu:req.session.menu})
		})	
})
router.get('/main',function(req,res){
	console.log('in manage main router')
	res.render('manage/main')
}).get('/logout',function(req,res){
	console.log('-------- destroy --------',req.session)
	req.session.destroy(function(err){
		if(err){
			console.log('err')
			return res.send(err)
		}
		console.log('destroy req.session--------',req.session)
		res.redirect('/manage/login')
	})
})

//科研成果-成果录入
router.get('/material',function(req,res){
	console.log('in gxn')
	console.log(manageconfig.wx)
	wx.GetAccessToken(req,manageconfig.wx.appid,manageconfig.wx.appkey,function(wxres){
		console.log("accesstoken:"+req.session.accesstoken)
		//res.render('manage/xygk/xyjj')
		res.render('manage/wx/material',{search_param:manageconfig.search_param.material})
	})

}).get('/material_data',function(req,res){
	commonfunc.DataSearch(req,res,cmsContent,manageconfig.search_param.material,{'fromwx':1})
}).get('/materialadd',function(req,res){
	let id = req.query.id
	console.log('cmsContent ID,',id)
	if(id&&typeof(id)!='undefined'){
		let search = cmsContent.findOne({})
		search.where('id').equals(id)
		search.exec(function(err,doc){
			console.log(doc)
			if(err){
				return res.send(err)
			}
			if(doc){
				res.render('manage/wx/materialadd',{data:doc})
			}
			if(!doc){
				res.render('manage/wx/materialadd',{data:{}})
			}
		})
	}else{
		res.render('manage/wx/materialadd',{data:{}})
	}
}).post('/materialdel',function(req,res){
	console.log('materialdel----------------------',req.body.id)
	cmsContent.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('materialdel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del materialdel success'})
	})
}).post('/material_download',function(req,res){
	console.log('material_download')
	console.log(manageconfig.wx)
	wx.GetAccessToken(req,manageconfig.wx.appid,manageconfig.wx.appkey,function(wxres){
		console.log("开始下载微信公众号已发布文章")
		wx.GetMarterial(req,"publish",null,1,20,function(result){
			console.log("微信公众号已发布文章下载完成")
			console.log("开始下载微信公众号草稿素材")
			wx.GetMarterial(req,"draft",null,1,20,function(result){
				console.log("微信公众号草稿素材下载完成")
				return res.json({'code':0,'msg':'更新成功',data: result})
			});
		})	
	})
	
}).post('/material_update',function(req,res){
	console.log('material_update')
	console.log(manageconfig.wx)
	let othersaveparam = {trees:'179-181-',tag2:'计软新闻'}
	let saveparam = ['title','titleEN','pageContent','pageContentEN','isTop','timeAdd','timeEdit','fujianPath','leixing','leixing1','trees'];
	commonfunc.DataUpdate(req,res,cmsContent,saveparam,othersaveparam)
	
}).post('/material_upload',function(req,res){
	console.log('material_update')
	console.log(manageconfig.wx)
	let id = req.body.id
	let search = cmsContent.findOne({id:id})
		search.exec(function(err,doc){
			if(err){
				console.log('find id err',err)
			}else{
				//console.log(doc)
				wx.GetAccessToken(req,manageconfig.wx.appid,manageconfig.wx.appkey,function(wxres){
					console.log("开始上传素材")
					wx.UploadMaterial(req,'news',doc,function(error, response, body){
						console.log("上传素材完成")
						//console.log(body.media_id)
						//console.log("id"+id)
						cmsContent.updateOne({'id':id},{'mediaid':body.media_id},function(error){
							if(error){
								console.log('更新失败',error)
								return res.json({'code':-1,'msg':'更新失败',data: body})
							}else{
								console.log('更新成功',error)
								return res.json({'code':0,'msg':'更新成功',data: body})
							}
						})
					})
				})	
			}
		});
});
//第一栏 学院概况 学院简介
//这个版块，不需设置置顶什么的，模板都一样，可以使用一个页面，更新的时候用id来区别
router.get('/xyjj',function(req,res){
	console.log('in xyjj')
	let search = cmsContent.findOne({})
		search.where('trees').equals('153-227-')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}	
			res.render('manage/xygk/xyjj',{data:doc})
		})
}).post('/year',function(req,res){
	let resultdata = {
		totalRow: manageconfig.years.length,
		totalPage: 1,
		list: manageconfig.years
	}
	return res.json({'code':0,'msg':'获取数据成功','count':manageconfig.years.length,'data':resultdata})
}).post('/kanwu',function(req,res){
	console.log('in xyjj')
	let page = req.body.pageNumber
	let limit = req.body.pageSize
	let q_word = req.body.title
	page = page ? page : 1;//当前页
	limit = limit ? limit : 20;//每页数据
	q_word = q_word?q_word:''
	let numSkip = (page-1)*limit
	limit = parseInt(limit)
	async.waterfall([
		function(cb){
			//get count
			let search = kanwu.find({title:{$regex:q_word,$options:'$i'}}).count()
				search.exec(function(err,count){
					if(err){
						console.log('xrld get total err',err)
						cb(err)
					}
					console.log('xrld count',count)
					total = count
					cb(null)
				})
		},
		function(cb){
			let search = kanwu.find({title:{$regex:q_word,$options:'$i'}})
				search.sort({'rank':1})
				search.limit(limit)
				search.skip(numSkip)
				search.exec(function(error,docs){
					if(error){
						console.log('news_data error',error)
						cb(error)
					}
					cb(null,docs)
				})
		}
	],function(error,result){
		if(error){
			console.log('xrld async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		let resultdata = {
			pageSize: limit,
			pageNumber: page,
			totalRow: total,
			totalPage: Math.ceil(total/limit),
			list: result
		}
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':resultdata})
	})

}).post('/wordupload',function(req,res){
	//G:\newcsse\public\attachment\hzhb 
	let imgpath = attachmentuploaddir + '\\word' //替换 
	fs.existsSync(imgpath) || fs.mkdirSync(imgpath) 
	let form = new multiparty.Form();
	form.encoding = 'utf-8';
	form.uploadDir = imgpath 
	let baseimgpath = imgpath.split('\\') 
	let baseimgpathlength = baseimgpath.length
	baseimgpath = baseimgpath[baseimgpathlength-2] + '/' + baseimgpath[baseimgpathlength-1]
	form.parse(req, function(err, fields, files) {
		if(err){
			console.log('imgpath  parse err',err.stack)
		}

		let uploadfiles =  files.file
		let returnimgurl = [],
			returnfilename = [],
			originalFilename = []

		uploadfiles.forEach(function(item,index){
			console.log('item------',item)
			//1012更改，加入时间戳，防止同名文件覆盖
			originalFilename.push(item.originalFilename)
			let newfilename =  moment().unix() + '_' + item.originalFilename
			returnimgurl.push('/'+baseimgpath+'/'+ newfilename)
			fs.renameSync(item.path,imgpath+'\\'+ newfilename);
			returnfilename.push(imgpath+'\\'+ newfilename)
		})
		
		let transfile = returnfilename[0]
		//translate(transfile)
		console.log(transfile)
		var options = {
			styleMap: [
				"p[style-name='Section Title'] => h1:fresh",
				"p[style-name='Subsection Title'] => h2:fresh"
			]
		};
		mammoth.convertToHtml({path: transfile},options)
	   .then(function(result){
		  var html = result.value; // The generated HTML
		  html = commonfunc.TranlateWordString(html,function(result){
			return res.json({"errno":0,"data":result})
		  })
		 // return res.json({"errno":0,"data":html})
		 // var messages = result.messages; // Any messages, such as warnings during conversion
	   })
	   .done();

		//return res.json({"errno":0,"data":returnimgurl,"returnfilename":returnfilename})
	})

	 
}).post('/ckupload',function(req,res){
	//G:\newcsse\public\attachment\hzhb 
	let imgpath = attachmentuploaddir + '\\word' //替换 
	fs.existsSync(imgpath) || fs.mkdirSync(imgpath) 
	let form = new multiparty.Form();
	form.encoding = 'utf-8';
	form.uploadDir = imgpath 
	let baseimgpath = imgpath.split('\\') 
		let baseimgpathlength = baseimgpath.length
	baseimgpath = baseimgpath[baseimgpathlength-2] + '/' + baseimgpath[baseimgpathlength-1]
	form.parse(req, function(err, fields, files) {
		if(err){
			console.log('imgpath  parse err',err.stack)
		}

		let uploadfiles =  files.upload
		let returnimgurl = [],
			originalFilename = []

		uploadfiles.forEach(function(item,index){
			console.log('item------',item)
			//1012更改，加入时间戳，防止同名文件覆盖
			originalFilename.push(item.originalFilename)
			let newfilename =  moment().unix() + '_' + item.originalFilename
			returnimgurl.push(basedir +baseimgpath+'/'+ newfilename)
			fs.renameSync(item.path,imgpath+'/'+ newfilename);
			return res.json({'code':0,'msg':'update success','fileName':returnimgurl[0],uploaded:1,url:returnimgurl[0]})
		});
	})
}).post('/base64upload',function(req,res){
	let item = req.body.image
	var imgData = item.replace(/^data:image\/\w+;base64,/, '');
	var dataBuffer = Buffer.from(imgData, 'base64');
	//写入文件
	let newfilename =  '/base64/'+'img'+'_'+moment().unix()+Math.round(Math.random()*100000)+'_'+ '.jpg'
	let actualnewfilename =attachmentuploaddir + newfilename
	console.log(newfilename)
	fs.writeFile(actualnewfilename, dataBuffer, function(err){
		if(err){
			return res.json({'code':-1,'msg':'上传失败'})
			console.log('图片保存失败'+err)
		}else{
			console.log("item:"+item)
			console.log("newfilename:"+newfilename)
			return res.json({'code':0,'msg':'update success','fileName': basedir+"/attachment"+newfilename,uploaded:1,url: "/attachment"+newfilename})
		} 
	});
}).post('/xyjj',function(req,res){
	console.log('xyjj post')
	//console.log('req.bdoy',req.body)
	cmsContent.updateOne({'id':req.body.id},{'title':req.body.title,'titleEN':req.body.titleEN,'pageContent':req.body.pageContent,'pageContentEN':req.body.pageContentEN,'timeAdd':req.body.timeAdd,'timeEdit':req.body.timeEdit},function(error){
		if(error){
			console.log('cmsContent error',error)
			res.json({'code':-1,'msg':error})
		}
		console.log('cmsContent success')
		res.json({'code':0,'msg':'update success'})
	})
})
//院长寄语
router.get('/yzjy',function(req,res){
	console.log('in yzjy')
	let search = cmsContent.findOne({})
		search.where('title').equals('院长寄语')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}	
			res.render('manage/xygk/yzjy',{data:doc})
		})
}).post('/yzjy',function(req,res){
	console.log('yzjy post')
	//console.log('req.bdoy',req.body)
	cmsContent.updateOne({'id':req.body.id},{'title':req.body.title,'titleEN':req.body.titleEN,'pageContent':req.body.pageContent,'pageContentEN':req.body.pageContentEN,'timeAdd':req.body.timeAdd,'timeEdit':req.body.timeEdit},function(error){
		if(error){
			console.log('yzjy error',error)
			res.json({'code':-1,'msg':error})
		}
		console.log('yzjy success')
		res.json({'code':0,'msg':'update success'})
	})
})
//发展改革
router.get('/fzyg',function(req,res){
	console.log('in fzyg')
	let search = cmsContent.findOne({})
		search.where('trees').equals('153-229-')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/xygk/fzyg',{data:doc})
		})
}).post('/fzyg',function(req,res){
	console.log('fzyg post')
	//console.log('req.bdoy',req.body)
	cmsContent.updateOne({'id':req.body.id},{'title':req.body.title,'titleEN':req.body.titleEN,'pageContent':req.body.pageContent,'pageContentEN':req.body.pageContentEN,'timeAdd':req.body.timeAdd,'timeEdit':req.body.timeEdit},function(error){
		if(error){
			console.log('fzyg error',error)
			res.json({'code':-1,'msg':error})
		}
		console.log('fzyg success')
		res.json({'code':0,'msg':'update success'})
	})
})
//现任领导
router.get('/xrld',function(req,res){
	console.log('in xrld')
	let search = cmsContent.findOne({})
		search.where('trees').equals('153-261-')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/xygk/xrld',{data:doc,search_param:manageconfig.search_param.xrld})
		})
}).post('/xrld',function(req,res){
	console.log('xrld post')
	//console.log('req.bdoy',req.body)
	cmsContent.updateOne({'id':req.body.id},{'title':req.body.title,'titleEN':req.body.titleEN,'pageContent':req.body.pageContent,'pageContentEN':req.body.pageContentEN,'timeAdd':req.body.timeAdd,'timeEdit':req.body.timeEdit},function(error){
		if(error){
			console.log('xrld error',error)
			res.json({'code':-1,'msg':error})
		}
		console.log('xrld success')
		res.json({'code':0,'msg':'update success'})
	})
}).get('/xrld_data',function(req,res){
	commonfunc.DataSearch(req,res,xrld,manageconfig.search_param.xrld)
}).get('/xrldadd',function(req,res){
	let id = req.query.id
	console.log('xrldadd ID,',id)
	if(id&&typeof(id)!='undefined'){
		let search = xrld.findOne({})
		search.where('id').equals(id)
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			let search = user.find({$or:[{power:'教职工'},{power:'管理员'}]},{userName:1,_id:1})
			search.sort({'userName_py':1})
			search.exec(function(err,docs){
				if(err){
					return res.json({'err':err})
				}
				console.log('----------',docs)
				res.render('manage/xygk/xrldadd',{data:doc,users:docs})
			})
		})
	}else{
		console.log('----------')
		let search = user.find({$or:[{power:'教职工'},{power:'管理员'}]},{userName:1,_id:1})
			search.sort({'userName_py':1})
			search.exec(function(err,docs){
				if(err){
					return res.json({'err':err})
				}
				console.log('----------',docs)
				res.render('manage/xygk/xrldadd',{data:{},users:docs})
			})
		
	}
}).post('/xrldupload',function(req,res){
	console.log('xrldupload')
	console.log(attachmentuploaddir,attachmentuploaddir + '\\xrld')
	
	let xrldimg = attachmentuploaddir + '\\xrld'//G:\newcsse\public\attachment\xrld
	fs.existsSync(xrldimg) || fs.mkdirSync(xrldimg)
	console.log('userinfo img dir ',xrldimg)
	let form = new multiparty.Form();
    //设置编码
    form.encoding = 'utf-8';
    //设置文件存储路径
    form.uploadDir = xrldimg
    console.log('form.uploadDir-->',form.uploadDir)
    let baseimgpath = xrldimg.split('\\')
    	let baseimgpathlength = baseimgpath.length
    baseimgpath = baseimgpath[baseimgpathlength-2] + '/' + baseimgpath[baseimgpathlength-1]
    	console.log('baseimgpath-----',baseimgpath)//attachment/xrldimg
		//return false
    form.parse(req, function(err, fields, files) {
    	if(err){
    		console.log('xrldimg  parse err',err.stack)
    	}
    	console.log('fields->',fields)
    	console.log('files->',files)
    	let uploadfiles =  files.file
    	let returnimgurl = [],
    		returnfilename = []
    	uploadfiles.forEach(function(item,index){
    		console.log('读取文件路径-->',item.path,xrldimg+'\\'+item.originalFilename)
			//1012更改，加入时间戳，防止同名文件覆盖
			returnimgurl.push('/'+baseimgpath+'/'+ moment().unix() + '_' + item.originalFilename)
    		fs.renameSync(item.path,xrldimg+'\\'+ moment().unix() + '_' + item.originalFilename);
    		returnfilename.push(moment().unix() + '_' + item.originalFilename)
    	})
    	console.log('returnimgurl',returnimgurl)
		
		returnimgurl = basedir+returnimgurl
    	return res.json({"errno":0,"data":returnimgurl,"returnfilename":returnfilename})
    })
}).post('/xrldadd',function(req,res){
	console.log('xrldadd------------------>',)
	if(req.body.id==''||req.body.id==null){
		console.log('新增 xrldadd')
		async.waterfall([
			function(cb){
				let search = xrld.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						if(doc){
							console.log('表中最大id',doc.id)
							cb(null,doc.id)
						}
						if(!doc){
							console.log('表中无记录')
							cb(0,null)
						}
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				let xrldadd = new xrld({
					id:id,
					title:req.body.title,//加入权限后需要更新
					name:req.body.name,
					work:req.body.work,
					title1:req.body.title1,//加入权限后需要更新
					name1:req.body.name1,
					work1:req.body.work1,
					paixu:req.body.paixu,
					pic:req.body.pic
				})
				xrldadd.save(function(error,doc){
					if(error){
						console.log('xrldadd save error',error)
						cb(error)
					}
					console.log('xrldadd save success')
					cb(null,doc)
				})
			}
		],function(error,result){
			if(error){
				console.log('xrldadd async error',error)
				return res.end(error)
			}
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}else{
		console.log('xrldadd',req.body)
		//return false
		async.waterfall([
			function(cb){
				let obj = {
					title:req.body.title,//加入权限后需要更新
					name:req.body.name,
					work:req.body.work,
					paixu:req.body.paixu,
					title1:req.body.title1,//加入权限后需要更新
					name1:req.body.name1,
					work1:req.body.work1,
					pic:req.body.pic
				}
				xrld.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('xrld update error',error)
						cb(error)
					}
					console.log('xrld update success')
					cb(null)
				})
			},
		],function(error,result){
			if(error){
				console.log('xrld async error',error)
				return res.end(error)
			}
			console.log('xrld',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}
}).post('/xrlddel',function(req,res){
	console.log('xrlddel',req.body.id)
	xrldadd.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('xrlddel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del xrlddel success'})
	})
})
//学院标识
router.get('/xybs',function(req,res){
	console.log('in xybs')
	let search = cmsContent.findOne({})
		search.where('trees').equals('153-256-')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/xygk/xybs',{data:doc})
		})
}).post('/xybs',function(req,res){
	console.log('xybs post')
	//console.log('req.bdoy',req.body)
	cmsContent.updateOne({'id':req.body.id},{'title':req.body.title,'titleEN':req.body.titleEN,'pageContent':req.body.pageContent,'pageContentEN':req.body.pageContentEN,'timeAdd':req.body.timeAdd,'timeEdit':req.body.timeEdit},function(error){
		if(error){
			console.log('xybs error',error)
			res.json({'code':-1,'msg':error})
		}
		console.log('xybs success')
		res.json({'code':0,'msg':'update success'})
	})
})
//机构设置
//行政办公室
router.get('/xzbgs',function(req,res){
	console.log('in xzbgs')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('行政办公室')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/jgsz/publictpl',{data:doc})
		})
}).get('/jxx',function(req,res){
	console.log('in jxx')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('教学系')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/jgsz/jxx',{data:doc,search_param:manageconfig.search_param.jxx})
		})
}).get('/yjs',function(req,res){
	console.log('in yjs')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('研究所')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/jgsz/yjs',{data:doc,search_param:manageconfig.search_param.yjs})
		})
}).get('/syzx',function(req,res){
	console.log('in syzx')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('实验中心')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/jgsz/publictpl',{data:doc})
		})
}).get('/bdsc',function(req,res){
	console.log('in bdsc')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('国家工程实验室')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/jgsz/publictpl',{data:doc})
		})
}).get('/qkbjb',function(req,res){
	console.log('in qkbjb')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('期刊编辑部')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/jgsz/publictpl',{data:doc})
		})
}).post('/jgsz',function(req,res){
	console.log('jgsz 更新')
	//console.log('req.bdoy',req.body)
	cmsContent.updateOne({'id':req.body.id},{'title':req.body.title,'titleEN':req.body.titleEN,'pageContent':req.body.pageContent,'pageContentEN':req.body.pageContentEN,'timeAdd':req.body.timeAdd,'timeEdit':req.body.timeEdit},function(error){
		if(error){
			console.log('jgsz error',error)
			res.json({'code':-1,'msg':error})
		}
		console.log('jgsz success')
		res.json({'code':0,'msg':'update success'})
	})
}).get('/jxx_data',function(req,res){
	commonfunc.DataSearch(req,res,cmsContent,manageconfig.search_param.jxx,{'tag2':'教学系'})
	
}).get('/jxxadd',function(req,res){
	let id = req.query.id
	console.log('cmsContent ID,',id)
	if(id&&typeof(id)!='undefined'){
		let search = cmsContent.findOne({})
		search.where('id').equals(id)
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			if(doc){
				res.render('manage/jgsz/jxxadd',{data:doc})
			}
			if(!doc){
				res.render('manage/jgsz/jxxadd',{data:{}})
			}
		})
	}else{
		res.render('manage/jgsz/jxxadd',{data:{}})
	}
}).post('/jxxadd',function(req,res){
	console.log('jxxadd------------------>',)
	if(req.body.id==''||req.body.id==null){
		console.log('新增 jxxadd')
		async.waterfall([
			function(cb){
				let search = cmsContent.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						if(doc){
							console.log('表中最大id',doc.id)
							cb(null,doc.id)
						}
						if(!doc){
							console.log('表中无记录')
							cb(0,null)
						}
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				let cmsContentadd = new cmsContent({
					id:id,
					title:req.body.title,//加入权限后需要更新
					titleEN:req.body.titleEN,
					pageContent:req.body.pageContent,
					pageContentEN:req.body.pageContentEN,
					zhur:req.body.zhur,
					fuzhur:req.body.fuzhur,
					zhur1:req.body.zhur1,
					fuzhur1:req.body.fuzhur1,
					tag2:'教学系',
					fujianPath:req.body.fujianPath
				})
				cmsContentadd.save(function(error,doc){
					if(error){
						console.log('cmsContentadd save error',error)
						cb(error)
					}
					console.log('cmsContentadd save success')
					cb(null,doc)
				})
			}
		],function(error,result){
			if(error){
				console.log('cmsContentadd async error',error)
				return res.end(error)
			}
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}else{
		console.log('cmsContentadd',req.body)
		//return false
		async.waterfall([
			function(cb){
				let obj = {
					title:req.body.title,//加入权限后需要更新
					titleEN:req.body.titleEN,
					pageContent:req.body.pageContent,
					pageContentEN:req.body.pageContentEN,
					zhur:req.body.zhur,
					fuzhur:req.body.fuzhur,
					zhur1:req.body.zhur1,
					fuzhur1:req.body.fuzhur1,
					tag2:'教学系',
					fujianPath:req.body.fujianPath
				}
				cmsContent.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('cmsContent update error',error)
						cb(error)
					}
					console.log('cmsContent update success')
					cb(null)
				})
			},
		],function(error,result){
			if(error){
				console.log('cmsContent async error',error)
				return res.end(error)
			}
			console.log('jxxadd',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}
}).post('/jxxdel',function(req,res){
	console.log('jxxdel',req.body.id)
	cmsContent.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('jxxdel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del jxxdel success'})
	})
}).post('/jxxupload',function(req,res){
	let jxximg = attachmentuploaddir + '\\jxx' //替换 //G:\newcsse\public\attachment\xrld 
	fs.existsSync(jxximg) || fs.mkdirSync(jxximg) //替换
	let form = new multiparty.Form();
    form.encoding = 'utf-8';
    form.uploadDir = jxximg //替换
    let baseimgpath = jxximg.split('\\') //替换
    	let baseimgpathlength = baseimgpath.length
    baseimgpath = baseimgpath[baseimgpathlength-2] + '/' + baseimgpath[baseimgpathlength-1]
    form.parse(req, function(err, fields, files) {
    	if(err){
    		console.log('jxximg  parse err',err.stack)
    	}

    	let uploadfiles =  files.file
    	let returnimgurl = [],
    		returnfilename = []
    	uploadfiles.forEach(function(item,index){
			//1012更改，加入时间戳，防止同名文件覆盖
			returnimgurl.push('/'+baseimgpath+'/'+ moment().unix() + '_' + item.originalFilename)
    		fs.renameSync(item.path,jxximg+'\\'+ moment().unix() + '_' + item.originalFilename);//替换
    		returnfilename.push(moment().unix() + '_' + item.originalFilename)
    	})
		
		returnimgurl = basedir+returnimgurl
    	return res.json({"errno":0,"data":returnimgurl,"returnfilename":returnfilename})
    })
}).get('/yjs_data',function(req,res){
	commonfunc.DataSearch(req,res,cmsContent,manageconfig.search_param.yjs,{'tag2':'研究所'},{'organizationsort':1})
}).get('/yjsadd',function(req,res){
	let id = req.query.id
	console.log('cmsContent ID,',id)
	if(id&&typeof(id)!='undefined'){
		let search = cmsContent.findOne({})
		search.where('id').equals(id)
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			if(doc){
				res.render('manage/jgsz/yjsadd',{data:doc})
			}
			if(!doc){
				res.render('manage/jgsz/yjsadd',{data:{}})
			}
		})
	}else{
		res.render('manage/jgsz/yjsadd',{data:{}})
	}
}).post('/yjsadd',function(req,res){
	console.log('yjsadd------------------>',)
	if(req.body.id==''||req.body.id==null){
		console.log('新增 yjsadd')
		async.waterfall([
			function(cb){
				let search = cmsContent.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						if(doc){
							console.log('表中最大id',doc.id)
							cb(null,doc.id)
						}
						if(!doc){
							console.log('表中无记录')
							cb(0,null)
						}
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				let cmsContentadd = new cmsContent({
					id:id,
					title:req.body.title,//加入权限后需要更新
					titleEN:req.body.titleEN,
					pageContent:req.body.pageContent,
					pageContentEN:req.body.pageContentEN,
					tag2:'研究所',
					fujianPath:req.body.fujianPath,
					url:req.body.url
				})
				cmsContentadd.save(function(error,doc){
					if(error){
						console.log('cmsContentadd save error',error)
						cb(error)
					}
					console.log('cmsContentadd save success')
					cb(null,doc)
				})
			}
		],function(error,result){
			if(error){
				console.log('cmsContentadd async error',error)
				return res.end(error)
			}
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}else{
		console.log('cmsContentadd',req.body)
		//return false
		async.waterfall([
			function(cb){
				let obj = {
					title:req.body.title,//加入权限后需要更新
					titleEN:req.body.titleEN,
					pageContent:req.body.pageContent,
					pageContentEN:req.body.pageContentEN,
					tag2:'研究所',
					fujianPath:req.body.fujianPath,
					url:req.body.url
				}
				cmsContent.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('cmsContent update error',error)
						cb(error)
					}
					console.log('cmsContent update success')
					cb(null)
				})
			},
		],function(error,result){
			if(error){
				console.log('cmsContent async error',error)
				return res.end(error)
			}
			console.log('yjsadd',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}
}).post('/yjsdel',function(req,res){
	console.log('yjsdel',req.body.id)
	cmsContent.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('yjsdel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del yjsdel success'})
	})
}).post('/yjsupload',function(req,res){
	let yjsimg = attachmentuploaddir + '\\yjs' //替换 //G:\newcsse\public\attachment\xrld 
	fs.existsSync(yjsimg) || fs.mkdirSync(yjsimg) //替换
	let form = new multiparty.Form();
    form.encoding = 'utf-8';
    form.uploadDir = yjsimg //替换
    let baseimgpath = yjsimg.split('\\') //替换
    	let baseimgpathlength = baseimgpath.length
    baseimgpath = baseimgpath[baseimgpathlength-2] + '/' + baseimgpath[baseimgpathlength-1]
    form.parse(req, function(err, fields, files) {
    	if(err){
    		console.log('yjsimg  parse err',err.stack)
    	}

    	let uploadfiles =  files.file
    	let returnimgurl = [],
    		returnfilename = []
    	uploadfiles.forEach(function(item,index){
			//1012更改，加入时间戳，防止同名文件覆盖
			returnimgurl.push('/'+baseimgpath+'/'+ moment().unix() + '_' + item.originalFilename)
    		fs.renameSync(item.path,yjsimg+'\\'+ moment().unix() + '_' + item.originalFilename);//替换
    		returnfilename.push(moment().unix() + '_' + item.originalFilename)
    	})
		
		returnimgurl = basedir+returnimgurl
    	return res.json({"errno":0,"data":returnimgurl,"returnfilename":returnfilename})
    })
})
//招生就业
router.get('/bkszs',function(req,res){
	res.render('manage/zsjy/bkzs',{search_param:manageconfig.search_param.bkzs})
}).get('/bkzs_data',function(req,res){
	commonfunc.DataSearch(req,res,bkzs,manageconfig.search_param.bkzs)
	
}).get('/bkzsadd',function(req,res){
	let id = req.query.id
	console.log('cmsContent ID,',id)
	if(id&&typeof(id)!='undefined'){
		let search = bkzs.findOne({id:id})
		search.where('id').equals(id)
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			if(doc){
				res.render('manage/zsjy/bkzsadd',{data:doc})
			}
			if(!doc){
				res.render('manage/zsjy/bkzsadd',{data:{}})
			}
		})
	}else{
		res.render('manage/zsjy/bkzsadd',{data:{}})
	}
}).post('/bkzsadd',function(req,res){
	console.log('bkzsadd------------------>',req.body.patharr,(req.body.patharr.split(',')))
	if(req.body.id==''||req.body.id==null){
		console.log('新增 bkzsadd')
		async.waterfall([
			function(cb){
				let search = bkzs.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						if(doc){
							console.log('表中最大id',doc.id)
							cb(null,doc.id)
						}
						if(!doc){
							console.log('表中无记录')
							cb(0,null)
						}
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				let newbkzsadd = new bkzs({
					id:id,
					zhuanye:req.body.zhuanye,//加入权限后需要更新
					neirong:req.body.neirong,
					xuefei:req.body.xuefei,
					jxj:req.body.jxj,
					jiuye:req.body.jiuye,
					timeAdd:req.body.timeAdd,
					timeEdit:req.body.timeEdit,
					xyhj:req.body.xyhj,
					lxfs:req.body.lxfs,
					patharr:req.body.patharr.split(','),
					namearr:req.body.namearr.split(',')
				})
				newbkzsadd.save(function(error,doc){
					if(error){
						console.log('newbkzsadd save error',error)
						cb(error)
					}
					console.log('newbkzsadd save success')
					cb(null,doc)
				})
			}
		],function(error,result){
			if(error){
				console.log('newbkzsadd async error',error)
				return res.end(error)
			}
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}else{
		console.log('newbkzsadd',req.body)
		//return false
		async.waterfall([
			function(cb){
				let obj = {
					zhuanye:req.body.zhuanye,//加入权限后需要更新
					neirong:req.body.neirong,
					xuefei:req.body.xuefei,
					jxj:req.body.jxj,
					jiuye:req.body.jiuye,
					timeAdd:req.body.timeAdd,
					timeEdit:req.body.timeEdit,
					xyhj:req.body.xyhj,
					lxfs:req.body.lxfs,
					patharr:req.body.patharr.split(','),
					namearr:req.body.namearr.split(',')
				}
				bkzs.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('newbkzsadd update error',error)
						cb(error)
					}
					console.log('newbkzsadd update success')
					cb(null)
				})
			},
		],function(error,result){
			if(error){
				console.log('newbkzsadd async error',error)
				return res.end(error)
			}
			console.log('ssszsadd',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}
}).post('/bkzsupload',function(req,res){
	let bkzs = attachmentuploaddir + '\\bkzs' //替换 //G:\newcsse\public\attachment\xrld 
	fs.existsSync(bkzs) || fs.mkdirSync(bkzs) //替换
	let form = new multiparty.Form();
    form.encoding = 'utf-8';
    form.uploadDir = bkzs //替换
    let baseimgpath = bkzs.split('\\') //替换
    	let baseimgpathlength = baseimgpath.length
    baseimgpath = baseimgpath[baseimgpathlength-2] + '/' + baseimgpath[baseimgpathlength-1]
    form.parse(req, function(err, fields, files) {
    	if(err){
    		console.log('bkzs  parse err',err.stack)
    	}

    	let uploadfiles =  files.file
    	let returnimgurl = [],
    		returnfilename = []
    	uploadfiles.forEach(function(item,index){
			//1012更改，加入时间戳，防止同名文件覆盖
			returnimgurl.push('/'+baseimgpath+'/'+ moment().unix() + '_' + item.originalFilename)
    		fs.renameSync(item.path,bkzs+'\\'+ moment().unix() + '_' + item.originalFilename);//替换
    		returnfilename.push(moment().unix() + '_' + item.originalFilename)
    	})
		
		returnimgurl = basedir+returnimgurl
    	return res.json({"errno":0,"data":returnimgurl,"returnfilename":returnfilename})
    })
}).post('/bkzsdel',function(req,res){
	console.log('bkzsdel',req.body.id)
	//console.log('newsdel del',req.bdoy.id)
	bkzs.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('bkzsdel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del bkzsdel success'})
	})
}).get('/ssszs',function(req,res){
	console.log('in ssszs')
	res.render('manage/zsjy/ssszs',{search_param:manageconfig.search_param.sszs})
	
}).get('/bsszs',function(req,res){
	console.log('in bsszs')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('博士生招生')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/zsjy/publictpl',{data:doc})
		})
}).get('/cjzkzs',function(req,res){
	console.log('in cjzkzs')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('成教/自考招生')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/zsjy/publictpl',{data:doc})
		})
}).get('/jyfw',function(req,res){
	console.log('in jyfw')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('就业服务')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/zsjy/publictpl',{data:doc})
		})
}).post('/zsjy',function(req,res){
	console.log('zsjy 更新')
	//console.log('req.bdoy',req.body)
	cmsContent.updateOne({'id':req.body.id},{'title':req.body.title,'titleEN':req.body.titleEN,'pageContent':req.body.pageContent,'pageContentEN':req.body.pageContentEN,'timeAdd':req.body.timeAdd,'timeEdit':req.body.timeEdit},function(error){
		if(error){
			console.log('zsjy error',error)
			res.json({'code':-1,'msg':error})
		}
		console.log('zsjy success')
		res.json({'code':0,'msg':'update success'})
	})
}).get('/ssszs_data',function(req,res){
	commonfunc.DataSearch(req,res,cmsContent,manageconfig.search_param.sszs,{'tag2':'硕士生招生'})
	
}).get('/ssszsadd',function(req,res){
	let id = req.query.id
	console.log('cmsContent ID,',id)
	if(id&&typeof(id)!='undefined'){
		let search = cmsContent.findOne({})
		search.where('id').equals(id)
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			if(doc){
				res.render('manage/zsjy/ssszsadd',{data:doc})
			}
			if(!doc){
				res.render('manage/zsjy/ssszsadd',{data:{}})
			}
		})
	}else{
		res.render('manage/zsjy/ssszsadd',{data:{}})
	}
}).post('/ssszsadd',function(req,res){
	console.log('ssszsadd------------------>',)
	if(req.body.id==''||req.body.id==null){
		console.log('新增 ssszsadd')
		async.waterfall([
			function(cb){
				let search = cmsContent.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						if(doc){
							console.log('表中最大id',doc.id)
							cb(null,doc.id)
						}
						if(!doc){
							console.log('表中无记录')
							cb(0,null)
						}
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				let cmsContentadd = new cmsContent({
					id:id,
					title:req.body.title,//加入权限后需要更新
					titleEN:req.body.titleEN,
					pageContent:req.body.pageContent,
					pageContentEN:req.body.pageContentEN,
					isTop:req.body.isTop,
					timeAdd:req.body.timeAdd,
					timeEdit:req.body.timeEdit,
					tag2:'硕士生招生'
				})
				cmsContentadd.save(function(error,doc){
					if(error){
						console.log('ssszsadd save error',error)
						cb(error)
					}
					console.log('ssszsadd save success')
					cb(null,doc)
				})
			}
		],function(error,result){
			if(error){
				console.log('ssszsadd async error',error)
				return res.end(error)
			}
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}else{
		console.log('ssszsadd',req.body)
		//return false
		async.waterfall([
			function(cb){
				let obj = {
					title:req.body.title,//加入权限后需要更新
					titleEN:req.body.titleEN,
					pageContent:req.body.pageContent,
					pageContentEN:req.body.pageContentEN,
					isTop:req.body.isTop,
					timeAdd:req.body.timeAdd,
					timeEdit:req.body.timeEdit
				}
				cmsContent.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('cmsContent update error',error)
						cb(error)
					}
					console.log('cmsContent update success')
					cb(null)
				})
			},
		],function(error,result){
			if(error){
				console.log('cmsContent async error',error)
				return res.end(error)
			}
			console.log('ssszsadd',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}
}).post('/ssszsdel',function(req,res){
	console.log('ssszsdel',req.body.id)
	//console.log('newsdel del',req.bdoy.id)
	cmsContent.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('newsdel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del newsdel success'})
	})
}).post('/changessszsdisplay',function(req,res){
	console.log(req.body.isDisplay)
	let obj = {	isDisplay:req.body.isDisplay }
	cmsContent.updateOne({id:req.body.id},obj,function(error){
		if(error){
			console.log('cmsContent isDisplay hide error',error)
			return res.json({'code':1,'msg':error})
		}
		console.log('cmsContent isDisplay hide success')
		return res.json({'code':0})		
	})
}).post('/changessszstop',function(req,res){
	console.log(req.body.isTop)
	let obj = {	isTop:req.body.isTop }
	cmsContent.updateOne({id:req.body.id},obj,function(error){
		if(error){
			console.log('cmsContent isTop hide error',error)
			return res.json({'code':1,'msg':error})
		}
		console.log('cmsContent isTop hide success')
		return res.json({'code':0})		
	})
})
//科研成果-成果录入
router.get('/cglr',function(req,res){
	console.log('in gxn')
	res.render('manage/kxyj/cglr',{search_param:manageconfig.search_param.cglr})
	// let search = cmsContent.findOne({})
	// 	search.where('tag2').equals('成果录入')
	// 	search.exec(function(err,doc){
	// 		if(err){
	// 			return res.send(err)
	// 		}
			
	// 	})
}).get('/cglr_data',function(req,res){
	console.log('cglr_data')
	commonfunc.DataSearch(req,res,cglr,manageconfig.search_param.cglr,{},{review:1,id:-1})
	/*console.log('router cglr_data')
	let page = req.query.page,
		limit = req.query.limit,
		search_txt = req.query.search
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	let order_field = 'id',
		order_type = -1
	if(req.query.order_field!=''||req.query.order_field!=null){
		order_field = req.query.order_field
		if(req.query.order_type&&req.query.order_type=='asc')
			order_type = 1
	}
	let sortobject = {}
	sortobject[order_field] = order_type
	if(!search_txt)
	   search_txt = ''
	let _filter = {
		$or:[
			{title:{$regex:search_txt,$options:'$i'}},
			{kanwu:{$regex:search_txt,$options:'$i'}},
			{pageContent:{$regex:search_txt,$options:'$i'}},
			{pageContentEN:{$regex:search_txt,$options:'$i'}},
			{danwei:{$regex:search_txt,$options:'$i'}},
			{zuozhe:{$regex:search_txt,$options:'$i'}},
			{belongsto:{$regex:search_txt,$options:'$i'}},
			{belongsto1:{$regex:search_txt,$options:'$i'}}
		]
	}
	if(manageconfig.search_param.cglr){
		manageconfig.search_param.cglr.forEach(function(item,index){
			if(req.query[item.field]!=''&&req.query[item.field]!=null&&req.query[item.field]!=undefined){
				if(item.type=='input')
				   _filter[item.field] = {$regex:req.query[item.field],$options:'$i'}
				else 
				   _filter[item.field] = req.query[item.field]
			}
		});
	}
	async.waterfall([
		function(cb){
			//get count
			let search = cglr.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('cglr_data get total err',err)
						cb(err)
					}
					console.log('lhpy_data count',count)
					total = count
					cb(null)
				})
		},
		function(cb){
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			//if(search_txt){
				console.log('带搜索参数',search_txt)
				console.log('_filter',_filter)
				let search = cglr.find(_filter)
					search.sort(sortobject)
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('cglr_data error',error)
							cb(error)
						}
						//获取搜索参数的记录总数
						cglr.count(_filter,function(err,count_search){
							if(err){
								console.log('cglr_data count_search err',err)
								cb(err)
							}
							console.log('搜索到记录数',count_search)
							total = count_search
							cb(null,docs)
						})
					})
			/*}else{
				console.log('不带搜索参数')
				let search = cglr.find({})
					search.sort(sortobject)
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('hzhb_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
			}*/
		/*}
	],function(error,result){
		if(error){
			console.log('cglr_data async waterfall error',error)
			return res.json({'code':-1,'msg':error.stack,'count':0,'data':''})
		}
		console.log('cglr_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})*/
}).get('/cglradd',function(req,res){
	let id = req.query.id
	console.log('cglr ID,',id)
	if(id&&typeof(id)!='undefined'){
		let search = cglr.findOne({})
		search.where('id').equals(id)
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			if(doc){
				res.render('manage/kxyj/cglradd',{data:doc})
			}
			if(!doc){
				res.render('manage/kxyj/cglradd',{data:{}})
			}
		})
	}else{
		res.render('manage/kxyj/cglradd',{data:{}})
	}
}).post('/cglradd',function(req,res){
	console.log('cglradd------------------>',)
	if(req.body.id==''||req.body.id==null){
		console.log('新增 cglradd')
		async.waterfall([
			function(cb){
				let search = cglr.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						if(doc){
							console.log('表中最大id',doc.id)
							cb(null,doc.id)
						}
						if(!doc){
							console.log('表中无记录')
							cb(0,null)
						}
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				let yearid = req.body.year
				if(parseInt(req.body.year)<=parseInt(moment().format('YYYY')-5)){
					console.log('属于前5年记录')
					yearid = 'Before'
				}
				let cmsContentadd = new cglr({
					id:id,
					title:req.body.title,
					year:req.body.year,
					kanwu:req.body.kanwu,
					zuozhe:req.body.zuozhe,
					danwei:req.body.danwei,
					belongsto:req.body.belongsto,
					belongsto1:req.body.belongsto1,
					pageContent:req.body.pageContent,
					pageContentEN:req.body.pageContentEN,
					fujianPath:req.body.fujianPath,
					belongstoid:req.body.belongstoid,
					yearid : yearid,
					patharr : req.body.patharr,
					namearr : req.body.namearr
				})
				cmsContentadd.save(function(error,doc){
					if(error){
						console.log('cmsContentadd save error',error)
						cb(error)
					}
					console.log('cmsContentadd save success')
					cb(null,doc)
				})
			}
		],function(error,result){
			if(error){
				console.log('cmsContentadd async error',error)
				return res.end(error)
			}
			return res.json({'code':0,'data':[]})//返回跳转到该新增的项目
		})
	}else{
		console.log('cmsContentadd',req.body)
		//return false
		async.waterfall([
			function(cb){
				let yearid = req.body.year
				if(parseInt(req.body.year)<=parseInt(moment().format('YYYY')-5)){
					console.log('属于前5年记录')
					yearid = 'Before'
				}
				let obj = {
					title:req.body.title,
					year:req.body.year,
					kanwu:req.body.kanwu,
					zuozhe:req.body.zuozhe,
					danwei:req.body.danwei,
					belongsto:req.body.belongsto,
					belongsto1:req.body.belongsto1,
					pageContent:req.body.pageContent,
					pageContentEN:req.body.pageContentEN,
					fujianPath:req.body.fujianPath,
					belongstoid:req.body.belongstoid,
					yearid:yearid,
					patharr : req.body.patharr,
					namearr : req.body.namearr
				}
				cglr.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('cmsContent update error',error)
						cb(error)
					}
					console.log('cmsContent update success')
					cb(null)
				})
			},
		],function(error,result){
			if(error){
				console.log('cmsContent async error',error)
				return res.end(error)
			}
			console.log('cglradd',result)
			return res.json({'code':0,'data':[]})//返回跳转到该新增的项目
		})
	}
}).post('/cglrupload',function(req,res){
	//G:\newcsse\public\attachment\hzhb 
	let imgpath = attachmentuploaddir + '\\cglr' //替换 
	fs.existsSync(imgpath) || fs.mkdirSync(imgpath) 
	let form = new multiparty.Form();
    form.encoding = 'utf-8';
    form.uploadDir = imgpath 
    let baseimgpath = imgpath.split('\\') 
    	let baseimgpathlength = baseimgpath.length
    baseimgpath = baseimgpath[baseimgpathlength-2] + '/' + baseimgpath[baseimgpathlength-1]
    form.parse(req, function(err, fields, files) {
    	if(err){
    		console.log('imgpath  parse err',err.stack)
    	}

    	let uploadfiles =  files.file
    	let returnimgurl = [],
    		returnfilename = []
    	uploadfiles.forEach(function(item,index){
			console.log('item------',item)
			//1012更改，加入时间戳，防止同名文件覆盖
			returnimgurl.push('/'+baseimgpath+'/'+ moment().unix() + '_' + item.originalFilename)
    		fs.renameSync(item.path,imgpath+'\\'+ moment().unix() + '_' + item.originalFilename);
    		returnfilename.push(moment().unix() + '_' + item.originalFilename)
    	})
		
		returnimgurl = basedir+returnimgurl
    	return res.json({"errno":0,"data":returnimgurl,"returnfilename":returnfilename})
    })
}).post('/cglrupload1',function(req,res){
	//G:\newcsse\public\attachment\hzhb 
	console.log(req.body,req.query)

	let imgpath = attachmentuploaddir + '\\cglr_fujian' //替换 
	fs.existsSync(imgpath) || fs.mkdirSync(imgpath) 
	let form = new multiparty.Form();
    form.encoding = 'utf-8';
    form.uploadDir = imgpath 
    let baseimgpath = imgpath.split('\\') 
    	let baseimgpathlength = baseimgpath.length
    baseimgpath = baseimgpath[baseimgpathlength-2] + '/' + baseimgpath[baseimgpathlength-1]
    form.parse(req, function(err, fields, files) { ///fields:{ filename: [ '工作整理.docx' ] } 
    	if(err){
    		console.log('imgpath  parse err',err.stack)
    	}
		 
		console.log('文件名----->',(fields.filename)[0])
    	let uploadfiles =  files.file
    	let returnimgurl = [],
    		returnfilename = []
		returnimgurl.push('/'+baseimgpath+'/'+ moment().unix() + '_' + (fields.filename)[0])
		returnfilename.push(moment().unix() + '_' + (fields.filename)[0])
		//fs.renameSync(item.path,imgpath+'\\'+ moment().unix() + '_' + item.originalFilename);
    	// uploadfiles.forEach(function(item,index){
		// 	//1012更改，加入时间戳，防止同名文件覆盖
		// 	returnimgurl.push('/'+baseimgpath+'/'+ moment().unix() + '_' + item.originalFilename)
    	// 	fs.renameSync(item.path,imgpath+'\\'+ moment().unix() + '_' + item.originalFilename);
    	// 	returnfilename.push(moment().unix() + '_' + item.originalFilename)
    	// })
		
		returnimgurl = basedir+returnimgurl
    	return res.json({"errno":0,"data":returnimgurl,"returnfilename":returnfilename})
    })
}).post('/contentreview',function(req,res){
	console.log('cglrupdate----------------------',req.body.id)
	cglr.updateOne({id:req.body.id},{$set:{'review':1}},function(error){
		if(error){
			return res.json({'code':'-1','msg':error})
		}else
		   return res.json({'code':'0','msg':'审核成功'})
	})
}).post('/cglrdel',function(req,res){
	console.log('cglrdel----------------------',req.body.id)
	cglr.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('cglrdel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del cglrdel success'})
	})
}).get('/cgjj',function(req,res){
	let search = cmsContent.findOne({'tag2':'成果概况'})
		search.exec(function(err,doc){
			if(err){
				res.end(err)
			}
			console.log('---------------------------',doc.pageContent)
			res.render('manage/kxyj/cgjj',{data:doc})
		})
}).post('/cgjjadd',function(req,res){
	console.log('id------------------',req.body.id,req.body.pageContent)
	let obj = {
		pageContent:req.body.pageContent,
		csrankings:req.body.csrankings,
		pageContentEN:req.body.pageContentEN,
		csrankingsEN:req.body.csrankingsEN
	}
	cmsContent.updateOne({id:req.body.id},obj,function(error){
		if(error){
			console.log('cmsContent update error',error)
			return res.json({'code':-1,'msg':error})
		}
		console.log('cmsContent update success')
		return res.json({'code':0})
	})
})
//国际合作
router.get('/hzhb',function(req,res){
	console.log('in hzhb')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('合作伙伴')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/gjhz/hzhb',{data:doc,search_param:manageconfig.search_param.hzhb})
		})
}).get('/hzhb_data',function(req,res){
	commonfunc.DataSearch(req,res,cmsContent,manageconfig.search_param.hzhb,{'tag2':'合作伙伴'})
	
}).get('/hzhbadd',function(req,res){
	let id = req.query.id
	console.log('cmsContent ID,',id)
	if(id&&typeof(id)!='undefined'){
		let search = cmsContent.findOne({})
		search.where('id').equals(id)
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			if(doc){
				res.render('manage/gjhz/hzhbadd',{data:doc})
			}
			if(!doc){
				res.render('manage/gjhz/hzhbadd',{data:{}})
			}
		})
	}else{
		res.render('manage/gjhz/hzhbadd',{data:{}})
	}
}).post('/hzhbadd',function(req,res){
	console.log('hzhbadd------------------>',)
	if(req.body.id==''||req.body.id==null){
		console.log('新增 hzhbadd')
		async.waterfall([
			function(cb){
				let search = cmsContent.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						if(doc){
							console.log('表中最大id',doc.id)
							cb(null,doc.id)
						}
						if(!doc){
							console.log('表中无记录')
							cb(0,null)
						}
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				let cmsContentadd = new cmsContent({
					id:id,
					title:req.body.title,//加入权限后需要更新
					url:req.body.url,
					tag2:'合作伙伴',
					fujianPath:req.body.fujianPath,
					hbsort:id
				})
				cmsContentadd.save(function(error,doc){
					if(error){
						console.log('cmsContentadd save error',error)
						cb(error)
					}
					console.log('cmsContentadd save success')
					cb(null,doc)
				})
			}
		],function(error,result){
			if(error){
				console.log('cmsContentadd async error',error)
				return res.end(error)
			}
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}else{
		console.log('cmsContentadd',req.body)
		//return false
		async.waterfall([
			function(cb){
				let obj = {
					title:req.body.title,//加入权限后需要更新
					url:req.body.url,
					tag2:'合作伙伴',
					fujianPath:req.body.fujianPath,
					hbsort:req.body.id
				}
				cmsContent.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('cmsContent update error',error)
						cb(error)
					}
					console.log('cmsContent update success')
					cb(null)
				})
			},
		],function(error,result){
			if(error){
				console.log('cmsContent async error',error)
				return res.end(error)
			}
			console.log('hzhbadd',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}
}).post('/hzhbdel',function(req,res){
	console.log('hzhbdel',req.body.id)
	cmsContent.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('hzhbdel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del hzhbdel success'})
	})
}).post('/hzhbupload',function(req,res){
	//G:\newcsse\public\attachment\hzhb 
	let imgpath = attachmentuploaddir + '\\hzhb' //替换 
	fs.existsSync(imgpath) || fs.mkdirSync(imgpath) 
	let form = new multiparty.Form();
    form.encoding = 'utf-8';
    form.uploadDir = imgpath 
    let baseimgpath = imgpath.split('\\') 
    	let baseimgpathlength = baseimgpath.length
    baseimgpath = baseimgpath[baseimgpathlength-2] + '/' + baseimgpath[baseimgpathlength-1]
    form.parse(req, function(err, fields, files) {
    	if(err){
    		console.log('imgpath  parse err',err.stack)
    	}

    	let uploadfiles =  files.file
    	let returnimgurl = [],
    		returnfilename = []
    	uploadfiles.forEach(function(item,index){
			//1012更改，加入时间戳，防止同名文件覆盖
			returnimgurl.push('/'+baseimgpath+'/'+ moment().unix() + '_' + item.originalFilename)
    		fs.renameSync(item.path,imgpath+'\\'+ moment().unix() + '_' + item.originalFilename);
    		returnfilename.push(moment().unix() + '_' + item.originalFilename)
    	})
		//现在有csse,加上路径，后续去除
		returnimgurl = ''+returnimgurl
		//returnimgurl = '/csse'+returnimgurl
		//returnimgurl = basedir+returnimgurl
    	return res.json({"errno":0,"data":returnimgurl,"returnfilename":returnfilename})
    })
}).get('/hzhbsort',function(req,res){
	console.log('伙伴排序')
	let search = cmsContent.find({'tag2':'合作伙伴'})
		search.sort({'hbsort':1})
		search.exec(function(error,docs){
			if(error){
				console.log('伙伴排序 error',error)
				return error
			}
			res.render('manage/gjhz/hzhbsort',{'data':docs})
		})
}).post('/hzhbsort',function(req,res){
	console.log('排序信息',req.body.sortarr)
	async.eachLimit(req.body.sortarr,1,function(item,callback){
		console.log('item',item,item.split(','))
		let temp = item.split(',')
		let tempid = temp[1],
			tempsort = parseInt(temp[2])
		let obj = {
			hbsort : tempsort
		}
		console.log(tempid,tempsort)
		cmsContent.updateOne({_id:tempid},obj,function(error){
			if(error){
				console.log('ptgl sort update error',error)
				callback(error)
			}
			console.log('ptgl sort update success')
			callback(null)
		})
	},function(error){
		if(error){
			onsole.log('eachLimit update sort error',error)
			return res.json({'code':-1,'msg':error})
		}
		return res.json({'code':0})
	})
}).get('/lhpy',function(req,res){
	console.log('in lhpy')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('联合培养')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/gjhz/lhpy',{data:doc,search_param:manageconfig.search_param.lhpy})
		})
}).get('/lhpy_data',function(req,res){
	commonfunc.DataSearch(req,res,cmsContent,manageconfig.search_param.hzhb,{'tag2':'联合培养'})
}).get('/lhpyadd',function(req,res){
	let id = req.query.id
	console.log('cmsContent ID,',id)
	if(id&&typeof(id)!='undefined'){
		let search = cmsContent.findOne({})
		search.where('id').equals(id)
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			if(doc){
				res.render('manage/gjhz/lhpyadd',{data:doc})
			}
			if(!doc){
				res.render('manage/gjhz/lhpyadd',{data:{}})
			}
		})
	}else{
		res.render('manage/gjhz/lhpyadd',{data:{}})
	}
}).post('/lhpyadd',function(req,res){
	console.log('lhpyadd------------------>',)
	if(req.body.id==''||req.body.id==null){
		console.log('新增 lhpyadd')
		async.waterfall([
			function(cb){
				let search = cmsContent.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						if(doc){
							console.log('表中最大id',doc.id)
							cb(null,doc.id)
						}
						if(!doc){
							console.log('表中无记录')
							cb(0,null)
						}
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				let cmsContentadd = new cmsContent({
					id:id,
					title:req.body.title,//加入权限后需要更新
					titleEN:req.body.titleEN,
					pageContent:req.body.pageContent,
					pageContentEN:req.body.pageContentEN,
					tag2:'联合培养',
					fujianPath:req.body.fujianPath,
					pyxm:req.body.pyxm,
					pyxm1:req.body.pyxm1
				})
				cmsContentadd.save(function(error,doc){
					if(error){
						console.log('cmsContentadd save error',error)
						cb(error)
					}
					console.log('cmsContentadd save success')
					cb(null,doc)
				})
			}
		],function(error,result){
			if(error){
				console.log('cmsContentadd async error',error)
				return res.end(error)
			}
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}else{
		console.log('cmsContentadd',req.body)
		//return false
		async.waterfall([
			function(cb){
				let obj = {
					title:req.body.title,//加入权限后需要更新
					titleEN:req.body.titleEN,
					pageContent:req.body.pageContent,
					pageContentEN:req.body.pageContentEN,
					tag2:'联合培养',
					fujianPath:req.body.fujianPath,
					pyxm:req.body.pyxm,
					pyxm1:req.body.pyxm1
				}
				cmsContent.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('cmsContent update error',error)
						cb(error)
					}
					console.log('cmsContent update success')
					cb(null)
				})
			},
		],function(error,result){
			if(error){
				console.log('cmsContent async error',error)
				return res.end(error)
			}
			console.log('lhpyadd',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}
}).post('/lhpyupload',function(req,res){
	//G:\newcsse\public\attachment\hzhb 
	let imgpath = attachmentuploaddir + '\\lhpy' //替换 
	fs.existsSync(imgpath) || fs.mkdirSync(imgpath) 
	let form = new multiparty.Form();
    form.encoding = 'utf-8';
    form.uploadDir = imgpath 
    let baseimgpath = imgpath.split('\\') 
    	let baseimgpathlength = baseimgpath.length
    baseimgpath = baseimgpath[baseimgpathlength-2] + '/' + baseimgpath[baseimgpathlength-1]
    form.parse(req, function(err, fields, files) {
    	if(err){
    		console.log('imgpath  parse err',err.stack)
    	}

    	let uploadfiles =  files.file
    	let returnimgurl = [],
    		returnfilename = []
    	uploadfiles.forEach(function(item,index){
			//1012更改，加入时间戳，防止同名文件覆盖
			returnimgurl.push('/'+baseimgpath+'/'+ moment().unix() + '_' + item.originalFilename)
    		fs.renameSync(item.path,imgpath+'\\'+ moment().unix() + '_' + item.originalFilename);
    		returnfilename.push(moment().unix() + '_' + item.originalFilename)
    	})
		
		returnimgurl = basedir+returnimgurl
    	return res.json({"errno":0,"data":returnimgurl,"returnfilename":returnfilename})
    })
}).post('/lhpydel',function(req,res){
	console.log('lhpydel',req.body.id)
	cmsContent.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('lhpydel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del lhpydel success'})
	})
}).get('/lhpysort',function(req,res){
	console.log('联合培养')
	let search = cmsContent.find({'tag2':'联合培养'})
		search.sort({'hbsort':1})
		search.exec(function(error,docs){
			if(error){
				console.log('伙伴排序 error',error)
				return error
			}
			res.render('manage/gjhz/lhpysort',{'data':docs})
		})
}).post('/lhpysort',function(req,res){
	console.log('排序信息',req.body.sortarr)
	async.eachLimit(req.body.sortarr,1,function(item,callback){
		console.log('item',item,item.split(','))
		let temp = item.split(',')
		let tempid = temp[1],
			tempsort = parseInt(temp[2])
		let obj = {
			hbsort : tempsort
		}
		console.log(tempid,tempsort)
		cmsContent.updateOne({_id:tempid},obj,function(error){
			if(error){
				console.log('ptgl sort update error',error)
				callback(error)
			}
			console.log('ptgl sort update success')
			callback(null)
		})
	},function(error){
		if(error){
			onsole.log('eachLimit update sort error',error)
			return res.json({'code':-1,'msg':error})
		}
		return res.json({'code':0})
	})
}).get('/kyhz',function(req,res){
	console.log('in kyhz')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('科研合作')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/gjhz/kyhz',{data:doc,search_param:manageconfig.search_param.kyhz})
		})
}).get('/kyhz_data',function(req,res){
	commonfunc.DataSearch(req,res,cmsContent,manageconfig.search_param.kyhz,{'tag2':'科研合作'})
}).get('/kyhzadd',function(req,res){
	let id = req.query.id
	console.log('cmsContent ID,',id)
	if(id&&typeof(id)!='undefined'){
		let search = cmsContent.findOne({})
		search.where('id').equals(id)
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			if(doc){
				res.render('manage/gjhz/kyhzadd',{data:doc})
			}
			if(!doc){
				res.render('manage/gjhz/kyhzadd',{data:{}})
			}
		})
	}else{
		res.render('manage/gjhz/kyhzadd',{data:{}})
	}
}).post('/kyhzadd',function(req,res){
	console.log('kyhzadd------------------>',)
	if(req.body.id==''||req.body.id==null){
		console.log('新增 kyhzadd')
		async.waterfall([
			function(cb){
				let search = cmsContent.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						if(doc){
							console.log('表中最大id',doc.id)
							cb(null,doc.id)
						}
						if(!doc){
							console.log('表中无记录')
							cb(0,null)
						}
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				let cmsContentadd = new cmsContent({
					id:id,
					title:req.body.title,//加入权限后需要更新
					titleEN:req.body.titleEN,
					pageContent:req.body.pageContent,
					pageContentEN:req.body.pageContentEN,
					tag2:'科研合作',
					fujianPath:req.body.fujianPath
				})
				cmsContentadd.save(function(error,doc){
					if(error){
						console.log('cmsContentadd save error',error)
						cb(error)
					}
					console.log('cmsContentadd save success')
					cb(null,doc)
				})
			}
		],function(error,result){
			if(error){
				console.log('cmsContentadd async error',error)
				return res.end(error)
			}
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}else{
		console.log('cmsContentadd',req.body)
		//return false
		async.waterfall([
			function(cb){
				let obj = {
					title:req.body.title,//加入权限后需要更新
					titleEN:req.body.titleEN,
					pageContent:req.body.pageContent,
					pageContentEN:req.body.pageContentEN,
					tag2:'科研合作',
					fujianPath:req.body.fujianPath
				}
				cmsContent.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('cmsContent update error',error)
						cb(error)
					}
					console.log('cmsContent update success')
					cb(null)
				})
			},
		],function(error,result){
			if(error){
				console.log('cmsContent async error',error)
				return res.end(error)
			}
			console.log('kyhzadd',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}
}).post('/kyhzupload',function(req,res){
	//G:\newcsse\public\attachment\hzhb 
	let imgpath = attachmentuploaddir + '\\kyhz' //替换 
	fs.existsSync(imgpath) || fs.mkdirSync(imgpath) 
	let form = new multiparty.Form();
    form.encoding = 'utf-8';
    form.uploadDir = imgpath 
    let baseimgpath = imgpath.split('\\') 
    	let baseimgpathlength = baseimgpath.length
    baseimgpath = baseimgpath[baseimgpathlength-2] + '/' + baseimgpath[baseimgpathlength-1]
    form.parse(req, function(err, fields, files) {
    	if(err){
    		console.log('imgpath  parse err',err.stack)
    	}

    	let uploadfiles =  files.file
    	let returnimgurl = [],
    		returnfilename = []
    	uploadfiles.forEach(function(item,index){
			//1012更改，加入时间戳，防止同名文件覆盖
			returnimgurl.push('/'+baseimgpath+'/'+ moment().unix() + '_' + item.originalFilename)
    		fs.renameSync(item.path,imgpath+'\\'+ moment().unix() + '_' + item.originalFilename);
    		returnfilename.push(moment().unix() + '_' + item.originalFilename)
    	})
		
		returnimgurl = basedir+returnimgurl
    	return res.json({"errno":0,"data":returnimgurl,"returnfilename":returnfilename})
    })
}).post('/kyhzdel',function(req,res){
	console.log('lhpydel',req.body.id)
	cmsContent.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('lhpydel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del lhpydel success'})
	})
}).post('/gjhz',function(req,res){
	console.log('gjhz 更新')
	//console.log('req.bdoy',req.body)
	cmsContent.updateOne({'id':req.body.id},{'title':req.body.title,'titleEN':req.body.titleEN,'pageContent':req.body.pageContent,'pageContentEN':req.body.pageContentEN,'timeAdd':req.body.timeAdd,'timeEdit':req.body.timeEdit},function(error){
		if(error){
			console.log('gjhz error',error)
			res.json({'code':-1,'msg':error})
		}
		console.log('gjhz success')
		res.json({'code':0,'msg':'update success'})
	})
})
//党群工作
router.get('/zzgk',function(req,res){
	console.log('in zzgk')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('组织概况')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/dqgz/publictpl',{data:doc})
		})
}).get('/tzgg',function(req,res){
	//应该是列表
	console.log('in tzgg')
	res.render('manage/dqgz/tzgg',{title:'通知公告',search_param:manageconfig.search_param.tzgg})
	// let search = cmsContent.findOne({})
	// 	search.where('tag2').equals('通知公告')
	// 	search.exec(function(err,doc){
	// 		if(err){
	// 			return res.send(err)
	// 		}
	// 		res.render('manage/dqgz/publictpl',{data:doc})
	// 	})
}).get('/tzgg_data',function(req,res){
	commonfunc.DataSearch(req,res,cmsContent,manageconfig.search_param.tzgg,{'tag2':'通知公告'})
	
}).post('/tzggdel',function(req,res){
	console.log('tzggdel',req.body.id)
	//console.log('newsdel del',req.bdoy.id)
	cmsContent.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('tzggdel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del tzggdel success'})
	})
}).post('/changetzggdisplay',function(req,res){
	console.log(req.body.isDisplay)
	let obj = {	isDisplay:req.body.isDisplay }
	cmsContent.updateOne({id:req.body.id},obj,function(error){
		if(error){
			console.log(' changetzggdisplay hide error',error)
			return res.json({'code':1,'msg':error})
		}
		console.log(' changetzggdisplay hide success')
		return res.json({'code':0})		
	})
}).post('/changetzggtop',function(req,res){
	console.log(req.body.isTop)
	let obj = {	isTop:req.body.isTop }
	cmsContent.updateOne({id:req.body.id},obj,function(error){
		if(error){
			console.log('changetzggtop isTop hide error',error)
			return res.json({'code':1,'msg':error})
		}
		console.log('changetzggtop isTop hide success')
		return res.json({'code':0})		
	})
}).get('/tzggadd',function(req,res){
	let id = req.query.id
	console.log('cmsContent ID,',id)
	if(id&&typeof(id)!='undefined'){
		let search = cmsContent.findOne({})
		search.where('id').equals(id)
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			if(doc){
				res.render('manage/dqgz/tzggadd',{data:doc})
			}
			if(!doc){
				res.render('manage/dqgz/tzggadd',{data:{}})
			}
		})
	}else{
		res.render('manage/dqgz/tzggadd',{data:{}})
	}
}).post('/tzggadd',function(req,res){
	console.log('tzggadd------------------>',)
	if(req.body.id==''||req.body.id==null){
		console.log('新增 tzggadd')
		async.waterfall([
			function(cb){
				let search = cmsContent.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						if(doc){
							console.log('表中最大id',doc.id)
							cb(null,doc.id)
						}
						if(!doc){
							console.log('表中无记录')
							cb(0,null)
						}
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				let cmsContentadd = new cmsContent({
					id:id,
					title:req.body.title,//加入权限后需要更新
					pageContent:req.body.pageContent,
					isTop:req.body.isTop,
					timeAdd:req.body.timeAdd,
					timeEdit:req.body.timeEdit,
					tag2:'通知公告',
					tag1:'党群工作'
				})
				cmsContentadd.save(function(error,doc){
					if(error){
						console.log('tzggadd save error',error)
						cb(error)
					}
					console.log('tzggadd save success')
					cb(null,doc)
				})
			}
		],function(error,result){
			if(error){
				console.log('tzggadd async error',error)
				return res.end(error)
			}
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}else{
		console.log('cmsContentadd',req.body)
		//return false
		async.waterfall([
			function(cb){
				let obj = {
					title:req.body.title,//加入权限后需要更新
					pageContent:req.body.pageContent,
					isTop:req.body.isTop,
					timeAdd:req.body.timeAdd,
					timeEdit:req.body.timeEdit
				}
				cmsContent.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('tzggadd update error',error)
						cb(error)
					}
					console.log('tzggadd update success')
					cb(null)
				})
			},
		],function(error,result){
			if(error){
				console.log('tzggadd async error',error)
				return res.end(error)
			}
			console.log('tzggadd',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}
}).get('/djhd',function(req,res){
	//应该是列表
	console.log('in djhd')
	res.render('manage/dqgz/djhd',{title:'党建活动',search_param:manageconfig.search_param.djhd})
	// console.log('in djhd')
	// let search = cmsContent.findOne({})
	// 	search.where('tag2').equals('党建活动')
	// 	search.exec(function(err,doc){
	// 		if(err){
	// 			return res.send(err)
	// 		}
	// 		res.render('manage/dqgz/publictpl',{data:doc})
	// 	})
}).get('/djhd_data',function(req,res){
	commonfunc.DataSearch(req,res,cmsContent,manageconfig.search_param.djhd,{'tag2':'党建活动'})
	
}).post('/djhddel',function(req,res){
	console.log('djhddel',req.body.id)
	cmsContent.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('djhddel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del djhddel success'})
	})
}).post('/changedjhddisplay',function(req,res){
	console.log(req.body.isDisplay)
	let obj = {	isDisplay:req.body.isDisplay }
	cmsContent.updateOne({id:req.body.id},obj,function(error){
		if(error){
			console.log(' changedjhddisplay hide error',error)
			return res.json({'code':1,'msg':error})
		}
		console.log(' changedjhddisplay hide success')
		return res.json({'code':0})		
	})
}).post('/changedjhdtop',function(req,res){
	console.log(req.body.isTop)
	let obj = {	isTop:req.body.isTop }
	cmsContent.updateOne({id:req.body.id},obj,function(error){
		if(error){
			console.log('changedjhdtop isTop hide error',error)
			return res.json({'code':1,'msg':error})
		}
		console.log('changedjhdtop isTop hide success')
		return res.json({'code':0})		
	})
}).get('/djhdadd',function(req,res){
	let id = req.query.id
	console.log('cmsContent ID,',id)
	if(id&&typeof(id)!='undefined'){
		let search = cmsContent.findOne({})
		search.where('id').equals(id)
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			if(doc){
				res.render('manage/dqgz/djhdadd',{data:doc})
			}
			if(!doc){
				res.render('manage/dqgz/djhdadd',{data:{}})
			}
		})
	}else{
		res.render('manage/dqgz/djhdadd',{data:{}})
	}
}).post('/djhdadd',function(req,res){
	console.log('djhdadd------------------>',)
	if(req.body.id==''||req.body.id==null){
		console.log('新增 djhdadd')
		async.waterfall([
			function(cb){
				let search = cmsContent.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						if(doc){
							console.log('表中最大id',doc.id)
							cb(null,doc.id)
						}
						if(!doc){
							console.log('表中无记录')
							cb(0,null)
						}
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				let cmsContentadd = new cmsContent({
					id:id,
					title:req.body.title,//加入权限后需要更新
					pageContent:req.body.pageContent,
					isTop:req.body.isTop,
					timeAdd:req.body.timeAdd,
					timeEdit:req.body.timeEdit,
					fujianPath:req.body.fujianPath,
					tag2:'党建活动',
					tag1:'党群工作'
				})
				cmsContentadd.save(function(error,doc){
					if(error){
						console.log('djhdadd save error',error)
						cb(error)
					}
					console.log('djhdadd save success')
					cb(null,doc)
				})
			}
		],function(error,result){
			if(error){
				console.log('djhdadd async error',error)
				return res.end(error)
			}
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}else{
		console.log('djhdadd',req.body)
		//return false
		async.waterfall([
			function(cb){
				let obj = {
					title:req.body.title,//加入权限后需要更新
					pageContent:req.body.pageContent,
					isTop:req.body.isTop,
					timeAdd:req.body.timeAdd,
					fujianPath:req.body.fujianPath,
					timeEdit:req.body.timeEdit
				}
				cmsContent.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('djhdadd update error',error)
						cb(error)
					}
					console.log('djhdadd update success')
					cb(null)
				})
			},
		],function(error,result){
			if(error){
				console.log('djhdadd async error',error)
				return res.end(error)
			}
			console.log('djhdadd',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}
}).post('/djhdupload',function(req,res){
	console.log('djhdupload')
	console.log(attachmentuploaddir,attachmentuploaddir + '\\news')
	
	let djhdimg = attachmentuploaddir + '\\djhd'//G:\newcsse\public\attachment\slider
	fs.existsSync(djhdimg) || fs.mkdirSync(djhdimg)
	console.log('djhdimg img dir ',djhdimg)
	let form = new multiparty.Form();
    //设置编码
    form.encoding = 'utf-8';
    //设置文件存储路径
    form.uploadDir = djhdimg
    console.log('form.uploadDir-->',form.uploadDir)
    let baseimgpath = djhdimg.split('\\')
    	// baseimgpath.shift()
    	// baseimgpath.shift()
    	// baseimgpath.shift()
    	// baseimgpath = baseimgpath.join('/')
    	let baseimgpathlength = baseimgpath.length
    baseimgpath = baseimgpath[baseimgpathlength-2] + '/' + baseimgpath[baseimgpathlength-1]
    	console.log('baseimgpath-----',baseimgpath)//attachment/sliderimg
		//return false
    form.parse(req, function(err, fields, files) {
    	if(err){
    		console.log('djhdimg img parse err',err.stack)
    	}
    	console.log('fields->',fields)
    	console.log('files->',files)
    	let uploadfiles =  files.file
    	let returnimgurl = [],
    		returnfilename = []
    	uploadfiles.forEach(function(item,index){
    		console.log('读取文件路径-->',item.path,djhdimg+'\\'+item.originalFilename)
			//1012更改，加入时间戳，防止同名文件覆盖
			returnimgurl.push(baseimgpath+'/'+ moment().unix() + '_' + item.originalFilename)
    		fs.renameSync(item.path,djhdimg+'\\'+ moment().unix() + '_' + item.originalFilename);
    		returnfilename.push(moment().unix() + '_' + item.originalFilename)
    	})
    	console.log('returnimgurl',returnimgurl)
		
		returnimgurl = basedir+returnimgurl
    	return res.json({"errno":0,"data":returnimgurl,"returnfilename":returnfilename})
    })
}).get('/xxyd',function(req,res){
	console.log('in xxyd')
	res.render('manage/dqgz/xxyd',{title:'学习园地',search_param:manageconfig.search_param.xxyd})
}).get('/xxyd_data',function(req,res){
	commonfunc.DataSearch(req,res,cmsContent,manageconfig.search_param.xxyd,{'tag2':'学习园地'})
	
}).post('/xxyddel',function(req,res){
	console.log('xxyddel',req.body.id)
	cmsContent.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('xxyddel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del xxyddel success'})
	})
}).post('/changexxyddisplay',function(req,res){
	console.log(req.body.isDisplay)
	let obj = {	isDisplay:req.body.isDisplay }
	cmsContent.updateOne({id:req.body.id},obj,function(error){
		if(error){
			console.log(' changexxyddisplay hide error',error)
			return res.json({'code':1,'msg':error})
		}
		console.log(' changexxyddisplay hide success')
		return res.json({'code':0})		
	})
}).post('/changexxydtop',function(req,res){
	console.log(req.body.isTop)
	let obj = {	isTop:req.body.isTop }
	cmsContent.updateOne({id:req.body.id},obj,function(error){
		if(error){
			console.log('changexxydtop isTop hide error',error)
			return res.json({'code':1,'msg':error})
		}
		console.log('changexxydtop isTop hide success')
		return res.json({'code':0})		
	})
}).get('/xxydadd',function(req,res){
	let id = req.query.id
	console.log('cmsContent ID,',id)
	if(id&&typeof(id)!='undefined'){
		let search = cmsContent.findOne({})
		search.where('id').equals(id)
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			if(doc){
				res.render('manage/dqgz/xxydadd',{data:doc})
			}
			if(!doc){
				res.render('manage/dqgz/xxydadd',{data:{}})
			}
		})
	}else{
		res.render('manage/dqgz/xxydadd',{data:{}})
	}
}).post('/xxydadd',function(req,res){
	console.log('xxydadd------------------>',)
	if(req.body.id==''||req.body.id==null){
		console.log('新增 xxydadd')
		async.waterfall([
			function(cb){
				let search = cmsContent.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						if(doc){
							console.log('表中最大id',doc.id)
							cb(null,doc.id)
						}
						if(!doc){
							console.log('表中无记录')
							cb(0,null)
						}
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				let cmsContentadd = new cmsContent({
					id:id,
					title:req.body.title,//加入权限后需要更新
					pageContent:req.body.pageContent,
					isTop:req.body.isTop,
					timeAdd:req.body.timeAdd,
					timeEdit:req.body.timeEdit,
					fujianPath:req.body.fujianPath,
					tag2:'学习园地',
					tag1:'党群工作'
				})
				cmsContentadd.save(function(error,doc){
					if(error){
						console.log('xxydadd save error',error)
						cb(error)
					}
					console.log('xxydadd save success')
					cb(null,doc)
				})
			}
		],function(error,result){
			if(error){
				console.log('xxydadd async error',error)
				return res.end(error)
			}
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}else{
		console.log('xxydadd',req.body)
		//return false
		async.waterfall([
			function(cb){
				let obj = {
					title:req.body.title,//加入权限后需要更新
					pageContent:req.body.pageContent,
					isTop:req.body.isTop,
					timeAdd:req.body.timeAdd,
					fujianPath:req.body.fujianPath,
					timeEdit:req.body.timeEdit
				}
				cmsContent.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('xxydadd update error',error)
						cb(error)
					}
					console.log('xxydadd update success')
					cb(null)
				})
			},
		],function(error,result){
			if(error){
				console.log('xxydadd async error',error)
				return res.end(error)
			}
			console.log('xxydadd',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}
}).post('/xxydupload',function(req,res){
	console.log('xxydupload')
	console.log(attachmentuploaddir,attachmentuploaddir + '\\xxyd')
	
	let xxydimg = attachmentuploaddir + '\\xxyd'//G:\newcsse\public\attachment\slider
	fs.existsSync(xxydimg) || fs.mkdirSync(xxydimg)
	console.log('xxydimg img dir ',xxydimg)
	let form = new multiparty.Form();
    //设置编码
    form.encoding = 'utf-8';
    //设置文件存储路径
    form.uploadDir = xxydimg
    console.log('form.uploadDir-->',form.uploadDir)
    let baseimgpath = xxydimg.split('\\')
    	// baseimgpath.shift()
    	// baseimgpath.shift()
    	// baseimgpath.shift()
    	// baseimgpath = baseimgpath.join('/')
    	let baseimgpathlength = baseimgpath.length
    baseimgpath = baseimgpath[baseimgpathlength-2] + '/' + baseimgpath[baseimgpathlength-1]
    	console.log('baseimgpath-----',baseimgpath)//attachment/sliderimg
		//return false
    form.parse(req, function(err, fields, files) {
    	if(err){
    		console.log('xxydimg img parse err',err.stack)
    	}
    	console.log('fields->',fields)
    	console.log('files->',files)
    	let uploadfiles =  files.file
    	let returnimgurl = [],
    		returnfilename = []
    	uploadfiles.forEach(function(item,index){
    		console.log('读取文件路径-->',item.path,xxydimg+'\\'+item.originalFilename)
			//1012更改，加入时间戳，防止同名文件覆盖
			returnimgurl.push('/'+baseimgpath+'/'+ moment().unix() + '_' + item.originalFilename)
    		fs.renameSync(item.path,xxydimg+'\\'+ moment().unix() + '_' + item.originalFilename);
    		returnfilename.push(moment().unix() + '_' + item.originalFilename)
    	})
    	console.log('returnimgurl',returnimgurl)
		
		returnimgurl = basedir+returnimgurl
    	return res.json({"errno":0,"data":returnimgurl,"returnfilename":returnfilename})
    })
}).get('/ztjy',function(req,res){
	console.log('in ztjy')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('主题教育')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/dqgz/publictpl',{data:doc})
		})
}).post('/dqgz',function(req,res){
	console.log('dqgz 更新')
	//console.log('req.bdoy',req.body)
	cmsContent.updateOne({'id':req.body.id},{'title':req.body.title,'titleEN':req.body.titleEN,'pageContent':req.body.pageContent,'pageContentEN':req.body.pageContentEN,'timeAdd':req.body.timeAdd,'timeEdit':req.body.timeEdit},function(error){
		if(error){
			console.log('dqgz error',error)
			res.json({'code':-1,'msg':error})
		}
		console.log('dqgz success')
		res.json({'code':0,'msg':'update success'})
	})
}).get('/gzzd',function(req,res){
	//应该是列表
	console.log('in gzzd')
	res.render('manage/dqgz/gzzd',{title:'规章制度',search_param:manageconfig.search_param.gzzd})
}).get('/gzzd_data',function(req,res){
	commonfunc.DataSearch(req,res,cmsContent,manageconfig.search_param.gzzd,{'tag2':'规章制度'})
}).post('/gzzddel',function(req,res){
	console.log('gzzddel',req.body.id)
	cmsContent.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('gzzddel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del gzzddel success'})
	})
}).post('/changegzzddisplay',function(req,res){
	console.log(req.body.isDisplay)
	let obj = {	isDisplay:req.body.isDisplay }
	cmsContent.updateOne({id:req.body.id},obj,function(error){
		if(error){
			console.log(' changegzzddisplay hide error',error)
			return res.json({'code':1,'msg':error})
		}
		console.log(' changegzzddisplay hide success')
		return res.json({'code':0})		
	})
}).post('/changegzzdtop',function(req,res){
	console.log(req.body.isTop)
	let obj = {	isTop:req.body.isTop }
	cmsContent.updateOne({id:req.body.id},obj,function(error){
		if(error){
			console.log('changegzzdtop isTop hide error',error)
			return res.json({'code':1,'msg':error})
		}
		console.log('changegzzdtop isTop hide success')
		return res.json({'code':0})		
	})
}).get('/gzzdadd',function(req,res){
	let id = req.query.id
	console.log('cmsContent ID,',id)
	if(id&&typeof(id)!='undefined'){
		let search = cmsContent.findOne({})
		search.where('id').equals(id)
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			if(doc){
				res.render('manage/dqgz/gzzdadd',{data:doc})
			}
			if(!doc){
				res.render('manage/dqgz/gzzdadd',{data:{}})
			}
		})
	}else{
		res.render('manage/dqgz/gzzdadd',{data:{}})
	}
}).post('/gzzdadd',function(req,res){
	console.log('gzzdadd------------------>',)
	if(req.body.id==''||req.body.id==null){
		console.log('新增 gzzdadd')
		async.waterfall([
			function(cb){
				let search = cmsContent.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						if(doc){
							console.log('表中最大id',doc.id)
							cb(null,doc.id)
						}
						if(!doc){
							console.log('表中无记录')
							cb(0,null)
						}
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				let cmsContentadd = new cmsContent({
					id:id,
					title:req.body.title,//加入权限后需要更新
					pageContent:req.body.pageContent,
					isTop:req.body.isTop,
					timeAdd:req.body.timeAdd,
					timeEdit:req.body.timeEdit,
					//fujianPath:req.body.fujianPath,
					tag2:'规章制度',
					tag1:'党群工作'
				})
				cmsContentadd.save(function(error,doc){
					if(error){
						console.log('gzzdadd save error',error)
						cb(error)
					}
					console.log('gzzdadd save success')
					cb(null,doc)
				})
			}
		],function(error,result){
			if(error){
				console.log('gzzdadd async error',error)
				return res.end(error)
			}
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}else{
		console.log('gzzdadd',req.body)
		//return false
		async.waterfall([
			function(cb){
				let obj = {
					title:req.body.title,//加入权限后需要更新
					pageContent:req.body.pageContent,
					isTop:req.body.isTop,
					timeAdd:req.body.timeAdd,
					//fujianPath:req.body.fujianPath,
					timeEdit:req.body.timeEdit
				}
				cmsContent.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('gzzdadd update error',error)
						cb(error)
					}
					console.log('gzzdadd update success')
					cb(null)
				})
			},
		],function(error,result){
			if(error){
				console.log('gzzdadd async error',error)
				return res.end(error)
			}
			console.log('gzzdadd',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}
})
//人才招聘
router.get('/jszp',function(req,res){
	console.log('in jszp')
	//应该是列表
	console.log('in gzzd')
	res.render('manage/rczp/rczp',{title:'人才招聘',search_param:manageconfig.search_param.rczp})
	// let search = cmsContent.findOne({})
	// 	search.where('tag2').equals('教师')
	// 	search.exec(function(err,doc){
	// 		if(err){
	// 			return res.send(err)
	// 		}
	// 		res.render('manage/rczp/publictpl',{data:doc})
	// 	})
}).get('/zzyjry',function(req,res){
	console.log('in zzyjry')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('专职研究人员')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/rczp/publictpl',{data:doc})
		})
}).get('/bsh',function(req,res){
	console.log('in bsh')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('博士后')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/rczp/publictpl',{data:doc})
		})
}).post('/rczp',function(req,res){
	console.log('rczp 更新')
	//console.log('req.bdoy',req.body)
	cmsContent.updateOne({'id':req.body.id},{'title':req.body.title,'titleEN':req.body.titleEN,'pageContent':req.body.pageContent,'pageContentEN':req.body.pageContentEN,'timeAdd':req.body.timeAdd,'timeEdit':req.body.timeEdit},function(error){
		if(error){
			console.log('rczp error',error)
			res.json({'code':-1,'msg':error})
		}
		console.log('rczp success')
		res.json({'code':0,'msg':'update success'})
	})
}).get('/rczp_data',function(req,res){
	commonfunc.DataSearch(req,res,cmsContent,manageconfig.search_param.rczp,{'tag2':'人才招聘'})
	
}).post('/rczpdel',function(req,res){
	console.log('rczpdel',req.body.id)
	cmsContent.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('rczpdel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del rczpdel success'})
	})
}).post('/changerczpdisplay',function(req,res){
	console.log(req.body.isDisplay)
	let obj = {	isDisplay:req.body.isDisplay }
	cmsContent.updateOne({id:req.body.id},obj,function(error){
		if(error){
			console.log(' changerczpdisplay hide error',error)
			return res.json({'code':1,'msg':error})
		}
		console.log(' changerczpdisplay hide success')
		return res.json({'code':0})		
	})
}).post('/changerczptop',function(req,res){
	console.log(req.body.isTop)
	let obj = {	isTop:req.body.isTop }
	cmsContent.updateOne({id:req.body.id},obj,function(error){
		if(error){
			console.log('changerczptop isTop hide error',error)
			return res.json({'code':1,'msg':error})
		}
		console.log('changerczptop isTop hide success')
		return res.json({'code':0})		
	})
}).get('/rczpadd',function(req,res){
	let id = req.query.id
	console.log('cmsContent ID,',id)
	if(id&&typeof(id)!='undefined'){
		let search = cmsContent.findOne({})
		search.where('id').equals(id)
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			if(doc){
				res.render('manage/rczp/rczpadd',{data:doc})
			}
			if(!doc){
				res.render('manage/rczp/rczpadd',{data:{}})
			}
		})
	}else{
		res.render('manage/rczp/rczpadd',{data:{}})
	}
}).post('/rczpadd',function(req,res){
	console.log('rczpadd------------------>',)
	if(req.body.id==''||req.body.id==null){
		console.log('新增 rczpadd')
		async.waterfall([
			function(cb){
				let search = cmsContent.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						if(doc){
							console.log('表中最大id',doc.id)
							cb(null,doc.id)
						}
						if(!doc){
							console.log('表中无记录')
							cb(0,null)
						}
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				let cmsContentadd = new cmsContent({
					id:id,
					title:req.body.title,//加入权限后需要更新
					pageContent:req.body.pageContent,
					isTop:req.body.isTop,
					timeAdd:req.body.timeAdd,
					timeEdit:req.body.timeEdit,
					//fujianPath:req.body.fujianPath,
					tag2:'人才招聘',
					tag1:'招生招聘',
					zplx:req.body.zplx
				})
				cmsContentadd.save(function(error,doc){
					if(error){
						console.log('rczpadd save error',error)
						cb(error)
					}
					console.log('rczpadd save success')
					cb(null,doc)
				})
			}
		],function(error,result){
			if(error){
				console.log('rczpadd async error',error)
				return res.end(error)
			}
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}else{
		console.log('rczpadd',req.body)
		//return false
		async.waterfall([
			function(cb){
				let obj = {
					title:req.body.title,//加入权限后需要更新
					pageContent:req.body.pageContent,
					isTop:req.body.isTop,
					timeAdd:req.body.timeAdd,
					//fujianPath:req.body.fujianPath,
					timeEdit:req.body.timeEdit,
					zplx:req.body.zplx
				}
				cmsContent.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('rczpadd update error',error)
						cb(error)
					}
					console.log('rczpadd update success')
					cb(null)
				})
			},
		],function(error,result){
			if(error){
				console.log('rczpadd async error',error)
				return res.end(error)
			}
			console.log('rczpadd',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}
})
//教师队伍
function checkType(peopleid){
	let info = {}
	info.peopleid = peopleid
	if(peopleid =='1')
		info.typeName = '杰出人才'
	else if(peopleid=='2')
		info.typeName = '教授'
	else if(peopleid =='3')
		info.typeName = '副教授'
	else if(peopleid =='4')
		info.typeName = '讲师'
	else if(peopleid =='5')
		info.typeName = '助理教授'
	else if(peopleid =='6')
		info.typeName = '研究员'
	else if(peopleid =='7')
		info.typeName = '博士后'
	else if(peopleid =='8')
		info.typeName = '技术管理人员'
	else if(peopleid =='9')
		info.typeName = '研究/辅助管理'
	else if(peopleid =='10')
		info.typeName = '副研究员'
	else
		info.typeName = '其它'
	return info
}
router.get('/jsdw',function(req,res){
	let peopleid = req.query.peopleid
	console.log('peopleid',peopleid)
	let info = checkType(peopleid)
	console.log('info',info)
	res.render('manage/jsdw/publictpl',{info:info})
}).get('/jsdw_data',function(req,res){
	console.log('router jsdw_data',req.query.power,req.query.peopleid,typeof(req.query.peopleid))
	//return false
	let page = req.query.page,
		limit = req.query.limit,
		userName = req.query.userName,
		power = req.query.power,
		peopleid = req.query.peopleid
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit,power,peopleid)
	async.waterfall([
		function(cb){
			//get count
			let search = user.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('jsdw get total err',err)
						cb(err)
					}
					console.log('jsdw count',count)
					total = count
					cb(null)
				})
		},
		function(cb){//$or:[{year:2018},{year:/2018/}]//{$or:[{name:name},{principal:principal},{year:year},{year:{$regex:year}}]}
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			console.log('userName ------',userName)
			if(userName || power || peopleid){//20191024增加 搜姓名的时候，找出id进行关联搜索
				let _filter = {}
				if(userName){
					if(power && peopleid){
						console.log('三个参数都有',userName,peopleid,power)
						_filter = {
							$and:[
								{userName:{$regex:userName}},//忽略大小写
								{peopleid:peopleid},
								{power:power}
							]
						}
					}
					if(!power && peopleid){
						console.log('有姓名，peopleid',userName,peopleid)
						let check = new RegExp('\/'),arr = []
						_filter = {
							$and:[
								{userName:{$regex:userName}},//忽略大小写
								{peopleid:peopleid}
							]
						}
					}
					if(power && !peopleid){
						console.log('有姓名，角色',userName,power)
						_filter = {
							$and:[
								{userName:{$regex:userName}},//忽略大小写
								{power:power}
							]
						}
					}
					if(!power && !peopleid){
						console.log('只有姓名',userName,power)
						_filter = {
							userName:{$regex:userName}
						}
					}
				}
				if(userName){
					console.log('userName,_filter',userName,_filter)
					//let search = user.find(_filter)
					let search = user.find(_filter)
						search.sort({'zhicheng':-1})
						search.sort({'userName_py':-1})//正序
						search.limit(limit)
						search.skip(numSkip)
						search.exec(function(error,docs){
							if(error){
								console.log('jsdw_data error',error)
								cb(error)
							}
										//获取搜索参数的记录总数
							user.count(_filter,function(err,count_search){
								if(err){
									console.log('jsdw_data count_search err',err)
									cb(err)
								}
								console.log('搜索到记录数',count_search)
								total = count_search
								cb(null,docs)
							})
						})
				}else{//ok
					if(power && peopleid){
						_filter = {
							$and:[{power:power},{peopleid:peopleid}]
						}
					}
					if(!power && peopleid){
						console.log('peopleid----->',peopleid)
						_filter = {
							peopleid:peopleid
						}
					}
					if(power && !jstype){
						_filter = {
							power:{$regex:power}
						}
					}
					console.log('_filter',_filter)
						let search = user.find(_filter)
							search.sort({'zhicheng':-1})
							search.sort({'userName_py':1})//正序
							search.limit(limit)
							search.skip(numSkip)
							search.exec(function(error,docs){
								if(error){
									console.log('jsdw_data error',error)
									cb(error)
								}
								//获取搜索参数的记录总数
								user.count(_filter,function(err,count_search){
									if(err){
										console.log('jsdw_data count_search err',err)
										cb(err)
									}
									console.log('搜索到记录数',count_search)
									total = count_search
									cb(null,docs)
								})
							})
				}				
			}else{
				console.log('不带搜索参数')
				let search = user.find({})
					search.sort({'jstype':-1})
					search.sort({'userName_py':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('jsdw_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
			}
		}
	],function(error,result){
		if(error){
			console.log('jsdw_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('jsdw_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).get('/jsdw_data1',function(req,res){
	//20211106 备份，按原人员分类使用的接口
	console.log('router jsdw_data',req.query.power,req.query.jstype,typeof(req.query.jstype))
	//return false
	let page = req.query.page,
		limit = req.query.limit,
		userName = req.query.userName,
		power = req.query.power,
		jstype = req.query.jstype
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit,power,jstype)
	async.waterfall([
		function(cb){
			//get count
			let search = user.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('jsdw get total err',err)
						cb(err)
					}
					console.log('jsdw count',count)
					total = count
					cb(null)
				})
		},
		function(cb){//$or:[{year:2018},{year:/2018/}]//{$or:[{name:name},{principal:principal},{year:year},{year:{$regex:year}}]}
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			console.log('userName ------',userName)
			if(userName || power || jstype){//20191024增加 搜姓名的时候，找出id进行关联搜索
				let _filter = {}
				if(userName){
					if(power && jstype){
						console.log('三个参数都有',userName,jstype,power)
						let check = new RegExp('\/'),arr = []
						if(jstype.match(check)){
							console.log('find')
							arr = jstype.split('/')
							console.log('arr------',arr)
						}
						_filter = {
							$and:[
								{$or:[
									{userName:{$regex:userName}},//忽略大小写
									{jstype:(arr[0])?arr[0]:jstype},
									{power:power}
								]},
								{$or:[
									{userName:{$regex:userName}},//忽略大小写
									{jstype:(arr[1])?arr[1]:jstype},
									{power:power}
								]},
								{$or:[
									{userName:{$regex:userName}},//忽略大小写
									{zhicheng:(arr[0])?arr[0]:jstype},
									{power:power}
								]},
								{$or:[
									{userName:{$regex:userName}},//忽略大小写
									{zhicheng:(arr[1])?arr[1]:jstype},
									{power:power}
								]}
							]
						}
					}
					if(!power && jstype){
						console.log('有姓名，jstype',userName,jstype)
						let check = new RegExp('\/'),arr = []
						if(jstype.match(check)){
							console.log('find')
							arr = jstype.split('/')
							console.log('arr------',arr)
						}
						_filter = {
							$and:[
								{$or:[
									{userName:{$regex:userName}},//忽略大小写
									{jstype:(arr[0])?arr[0]:jstype}
								]},
								{$or:[
									{userName:{$regex:userName}},//忽略大小写
									{jstype:(arr[1])?arr[1]:jstype}
								]},
								{$or:[
									{userName:{$regex:userName}},//忽略大小写
									{zhicheng:(arr[0])?arr[0]:jstype}
								]},
								{$or:[
									{userName:{$regex:userName}},//忽略大小写
									{zhicheng:(arr[1])?arr[1]:jstype}
								]}
							]
						}
					}
					if(power && !jstype){
						console.log('有姓名，角色',userName,power)
						_filter = {
							$and:[
								{userName:{$regex:userName}},//忽略大小写
								{power:power}
							]
						}
					}
					if(!power && !jstype){
						console.log('只有姓名',userName,power)
						_filter = {
							userName:{$regex:userName}
						}
					}
				}
				if(userName){
					console.log('userName,_filter',userName,_filter)
					//let search = user.find(_filter)
					let search = user.find(_filter)
						search.sort({'jstype':-1})
						search.sort({'userName_py':-1})//正序
						search.limit(limit)
						search.skip(numSkip)
						search.exec(function(error,docs){
							if(error){
								console.log('jsdw_data error',error)
								cb(error)
							}
										//获取搜索参数的记录总数
							user.count(_filter,function(err,count_search){
								if(err){
									console.log('jsdw_data count_search err',err)
									cb(err)
								}
								console.log('搜索到记录数',count_search)
								total = count_search
								cb(null,docs)
							})
						})
				}else{//ok
					if(power && jstype){
						let check = new RegExp('\/'),arr = []
						if(jstype.match(check)){
							console.log('find')
							arr = jstype.split('/')
							console.log('arr------',arr)
						}
						_filter = {
							$and:[
								{$or:[{power:power},{jstype:(arr[0])?arr[0]:jstype}]},
								{$or:[{power:power},{jstype:(arr[1])?arr[1]:jstype}]},
								{$or:[{zhicheng:(arr[0])?arr[0]:jstype},{jstype:(arr[0])?arr[0]:jstype}]},
								{$or:[{zhicheng:(arr[1])?arr[1]:jstype},{jstype:(arr[1])?arr[1]:jstype}]}
							]
						}
					}
					if(!power && jstype){
						console.log('jstype----->',jstype)
						let check = new RegExp('\/'),arr = []
						if(jstype.match(check)){
							console.log('find')
							arr = jstype.split('/')
							console.log('arr------',arr)
						}
						_filter = {
							$or:[
								{$or:[{zhicheng:(arr[0])?arr[0]:jstype},{jstype:(arr[0])?arr[0]:jstype}]},
								{$or:[{zhicheng:(arr[1])?arr[1]:jstype},{jstype:(arr[1])?arr[1]:jstype}]}
							]
						}
					}
					if(power && !jstype){
						_filter = {
							power:{$regex:power}
						}
					}
					// _filter = {
					// 				$or:[	
					// 					{$or:[{power:power},{jstype:{$regex:jstype}}]},
					// 					{$and:[{power:power},{jstype:{$regex:jstype}}]}
					// 				]
					// 			}
					console.log('_filter',_filter)
								let search = user.find(_filter)
									search.sort({'jstype':-1})
									search.sort({'userName_py':1})//正序
									search.limit(limit)
									search.skip(numSkip)
									search.exec(function(error,docs){
										if(error){
											console.log('jsdw_data error',error)
											cb(error)
										}
										//获取搜索参数的记录总数
										user.count(_filter,function(err,count_search){
											if(err){
												console.log('jsdw_data count_search err',err)
												cb(err)
											}
											console.log('搜索到记录数',count_search)
											total = count_search
											cb(null,docs)
										})
									})
				}				
			}else{
				console.log('不带搜索参数')
				let search = user.find({})
					search.sort({'jstype':-1})
					search.sort({'userName_py':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('jsdw_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
			}
		}
	],function(error,result){
		if(error){
			console.log('jsdw_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('jsdw_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).get('/jsdwadd',function(req,res){
	let id = req.query.id
	console.log('id-----',id)
	if(id){
		console.log('修改账号信息')
		let search = user.findOne({})
		search.where('id').equals(id)
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			return res.render('manage/jsdw/account',{user:doc,isExist:1,title:'编辑账号'})
		})
	}else{
		console.log('新增账号')
		return res.render('manage/jsdw/account',{user:{},isExist:0,title:'新增账号'})
	}
	
}).post('/jsdwadd',function(req,res){
	console.log('jsdwadd post')
	//将信息存入project表
	if(req.body.id==''||req.body.id==null){
		console.log('jsdwadd 新增user')
		let userdoc 
		async.waterfall([
			function(cb){
				let search = user.findOne({'account':req.body.account})
					search.exec(function(error,doc){
						if(error){
							console.log('error',error)
							cb(error)
						}
						if(doc){
							console.log(req.body.account , '已存在')
							cb('账号冲突，请重新输入')
						}
						if(!doc){
							cb()
						}
					})
			},
			function(cb){
				let search = user.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						console.log('表中最大id',doc.id)
						cb(null,doc.id)
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				console.log('最大id',id)
				let useradd = new user({
					id:id,
					userName:req.body.userName,
					power:req.body.power,
					account:req.body.account,//加入权限后需要更新
					peopleid:11,//默认人员职称是其它
					password:cryptoPassFunc(req.body.password),
					userName_py:pinyin(req.body.userName,{
						style:pinyin.STYLE_FIRST_LETTER
					})[0][0]
				})
				useradd.save(function(error,doc){
					if(error){
						console.log('user save error',error)
						cb(error)
					}
					console.log('user save success')
					userdoc = doc
					cb(null)
				})
			},
		],function(error,result){
			if(error){
				console.log('jsdwadd async error',error)
				return res.json({'code':-1,'msg':error})
			}
			//console.log('result',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}else{
		console.log('更新 user',req.body.id)
		let userdoc
		async.waterfall([
			function(cb){
				let obj = {
					account:req.body.account,
					userName:req.body.userName,//加入权限后需要更新
					password:cryptoPassFunc(req.body.password),
					power:req.body.power,
					userName_py:pinyin(req.body.userName,{
						style:pinyin.STYLE_FIRST_LETTER
					})[0][0]
				}
				user.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('user update error',error)
						cb(error)
					}
					user.findOne({id:req.body.id},function(err,doc){
						if(error){
							console.log(error)
							cb()
						}
						userdoc = doc
						console.log('user update success')
						cb(null)
					})
				})
			},
		],function(error,result){
			if(error){
				console.log('jsdw async error',error)
				return res.end(error)
			}
			console.log('jsdw',result)
			return res.json({'code':0})
		})
	}
}).post('/jsdwdel',function(req,res){
	console.log('删除账号')
	console.log('jsdwdel del')
	user.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('jsdwdel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del jsdwdel success'})
	})
}).get('/userinfo',function(req,res){
	//普通用户从session获取account
	let id = req.query.id
	if(id){
		console.log('个人信息 ID,',id)
		let search = user.findOne({})
			search.where('id').equals(id)
			search.exec(function(err,doc){
				if(err){
					return res.send(err)
				}
				return res.render('manage/jsdw/userinfo',{user:doc})
			})
	}else{
		console.log('个人信息 account,',req.session.account)
		let search = user.findOne({})
			search.where('account').equals(req.session.account)
			search.exec(function(err,doc){
				if(err){
					return res.send(err)
				}
				return res.render('manage/jsdw/userinfo',{user:doc})
			})
	}
	
}).get('/usertx',function(req,res){
	console.log(req.query.imgsrc)
	return res.render('manage/jsdw/usertx',{imgsrc:req.query.imgsrc,userid:req.query.userid})
})
const jimp = require('jimp')
function isNaN(n) {
	if(typeof(n) === "number" && isNaN(n)) {
		return true;
	} else {
		return false;
	}
}
router.post('/usertx',function(req,res){
	let search = user.findOne({'id':req.body.id})
		search.exec(function(err,doc){
			if(err){
				return res.json({'code':-1,'msg':err})
			}
			console.log('img src ------>',doc,doc.avatar)// /csse/attachment/userimg/1635602692_1628310982_bbhu.jpg
			let temparr = doc.avatar.split('/')
			console.log('temparr---->',temparr)
			temparr.shift()
			temparr.shift()
			console.log('temparr---->',temparr)
			let tempstr = temparr.join('/')
			console.log('tempstr---->',tempstr)
			let imgpath = 'G:/newcsse-master/public/' + tempstr
			imgpath = imgpath.split('?')[0]
			console.log('imgpath-----',imgpath)
			jimp.read(imgpath, function (err, img) {
				if (err) throw err
				img.crop(parseInt(req.body.xzuobiao), parseInt(req.body.yzuobiao), parseInt(req.body.width), parseInt(req.body.height))
				.write(imgpath)
				return res.json({'code':0,'msg':'success'})
			})
		})
}).post('/userimgupload',function(req,res){
	console.log('userimgupload')
	console.log(attachmentuploaddir,attachmentuploaddir + '\\userimg')
	
	let userimg = attachmentuploaddir + '\\userimg'//G:\newcsse\public\attachment\userimg
	fs.existsSync(userimg) || fs.mkdirSync(userimg)
	console.log('userinfo img dir ',userimg)
	let form = new multiparty.Form();
    //设置编码
    form.encoding = 'utf-8';
    //设置文件存储路径
    form.uploadDir = userimg
    console.log('form.uploadDir-->',form.uploadDir)
    let baseimgpath = userimg.split('\\')
    	// baseimgpath.shift()
    	// baseimgpath.shift()
    	// baseimgpath.shift()
    	// baseimgpath = baseimgpath.join('/')
    	let baseimgpathlength = baseimgpath.length
    baseimgpath = baseimgpath[baseimgpathlength-2] + '/' + baseimgpath[baseimgpathlength-1]
    	console.log('baseimgpath-----',baseimgpath)//attachment/userimg
		//return false
    form.parse(req, function(err, fields, files) {
    	if(err){
    		console.log('userinfo img parse err',err.stack)
    	}
    	console.log('fields->',fields)
    	console.log('files->',files)
    	let uploadfiles =  files.file
    	let returnimgurl = [],
    		returnfilename = []
    	uploadfiles.forEach(function(item,index){
    		console.log('读取文件路径-->',item.path,userimg+'\\'+item.originalFilename)
    		//returnimgurl.push('/'+baseimgpath+'/'+item.originalFilename)///images/attachment/news/84f1914cedd048ad90eeaaefc25c7be9.jpeg
			//fs.renameSync(item.path,userimg+'\\'+item.originalFilename);
			//returnfilename.push(item.originalFilename)
			//1012更改，加入时间戳，防止同名文件覆盖
			returnimgurl.push('/'+baseimgpath+'/'+ moment().unix() + '_' + item.originalFilename)
    		fs.renameSync(item.path,userimg+'\\'+ moment().unix() + '_' + item.originalFilename);
    		returnfilename.push(moment().unix() + '_' + item.originalFilename)
    	})
    	console.log('returnimgurl',returnimgurl)
		
		returnimgurl = basedir+returnimgurl
    	return res.json({"errno":0,"data":returnimgurl,"returnfilename":returnfilename})
    })
}).post('/userinfo',function(req,res){
	console.log(req.body.yewukouid)
	let yewukouid 
	
	if(!req.body.yewukouid){
		console.log('业务口没有选')
		yewukouid = 0
	}else{
		yewukouid = parseInt(req.body.yewukouid)
	}

	console.log('-----------------------')
	let updateobj = {
		userName:req.body.userName,
		userName1:req.body.userName1,
		sex:req.body.sex,
		sex1:req.body.sex1,
		zhicheng:req.body.zhicheng,
		zhicheng1:req.body.zhicheng1,
		phoneOffice:req.body.phoneOffice,
		email:req.body.email,
		AddressOffice:req.body.AddressOffice,
		AddressOffice1:req.body.AddressOffice1,
		personalLink:req.body.personalLink,
		suoxi:req.body.suoxi,
		suoxi1:req.body.suoxi1,
		jybj:req.body.jybj,
		jybj1:req.body.jybj1,
		intro:req.body.intro,
		intro1:req.body.intro1,
		avatar:req.body.avatar,
		zhiwu:req.body.zhiwu,
		zhiwu1:req.body.zhiwu1,
		//inDang:req.body.inDang,
		//inDang1:req.body.inDang1,
		yjly:req.body.yjly,
		yjly1:req.body.yjly1,
		peopleid:req.body.peopleid,
		suoxiid:req.body.suoxiid,
		rongyujibie:req.body.rongyujibie?parseInt(req.body.rongyujibie):null,
		rongyujibiename:req.body.rongyujibiename?req.body.rongyujibiename:'',
		rongyuname:req.body.rongyuname?req.body.rongyuname:'',
		rongyuname1:req.body.rongyuname1?req.body.rongyuname1:'',
		yewukouid:yewukouid,
		yewukouname:req.body.yewukouname?req.body.yewukouname:'',
		yewukouname1:req.body.yewukouname1?req.body.yewukouname1:''
	}
	console.log('obj',updateobj)
	//return false
	user.updateOne({'id':req.body.id},updateobj,function(err){
		if(err){
			console.log('update userinfo err',err)
			return res.json({'code':-1,'msg':err})
		}else{
			console.log('update success')
			return res.json({'code':0})
		}
	})
}).post('/changejsdwdis',function(req,res){
	console.log(req.body)
	let obj = {	display:req.body.display }
	user.updateOne({id:req.body.id},obj,function(error){
		if(error){
			console.log('isDisplay hide error',error)
			return res.json({'code':1,'msg':error})
		}
		console.log('isDisplay hide success')
		return res.json({'code':0})		
	})
}).get('/dis_menu',function(req,res){
	res.render('manage/jsdw/dis_menu',{title:'分配菜单'})
}).get('/szgk',function(req,res){
	let search = cmsContent.findOne({'tag2':'师资概况'})
		search.exec(function(err,doc){
			if(err){
				res.end(err)
			}
			console.log('---------------------------',doc.pageContent)
			res.render('manage/jsdw/szgk',{data:doc})
		})
}).post('/szgkadd',function(req,res){
	console.log('id------------------',req.body.id,req.body.pageContentEN)
	let obj = {
		pageContent:req.body.pageContent,
		pageContentEN:req.body.pageContentEN
	}
	cmsContent.updateOne({id:req.body.id},obj,function(error){
		if(error){
			console.log('cmsContent update error',error)
			return res.json({'code':-1,'msg':error})
		}
		console.log('cmsContent update success')
		return res.json({'code':0})
	})
})
//首页发布
router.get('/slider',function(req,res){
	res.render('manage/syfb/slider',{search_param:manageconfig.search_param.slider})
}).get('/slider1',function(req,res){
	res.render('manage/syfb/slider1',{search_param:manageconfig.search_param.slider})
}).get('/slider_data',function(req,res){
	//commonfunc.DataSearch(req,res,slider,manageconfig.search_param.slider)
	console.log('router slider_data')
	let page = req.query.page,
		limit = req.query.limit
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let search = slider.find({isen:0}).count()
				search.exec(function(err,count){
					if(err){
						console.log('slider_data get total err',err)
						cb(err)
					}
					console.log('slider_data count',count)
					total = count
					cb(null)
				})
		},
		function(cb){//$or:[{year:2018},{year:/2018/}]//{$or:[{name:name},{principal:principal},{year:year},{year:{$regex:year}}]}
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
				console.log('不带搜索参数')
				let search = slider.find({isen:0})
					//search.where('isDisplay').equals(0)
					//search.sort({'publishyear':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.sort({'id':-1})
					search.exec(function(error,docs){
						if(error){
							console.log('slider_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
			
		}
	],function(error,result){
		if(error){
			console.log('slider_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('slider_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).get('/slider_data1',function(req,res){
	console.log('router tdgl_data')
	let page = req.query.page,
		limit = req.query.limit
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let search = slider.find({isen:1}).count()
				search.exec(function(err,count){
					if(err){
						console.log('slider_data get total err',err)
						cb(err)
					}
					console.log('slider_data count',count)
					total = count
					cb(null)
				})
		},
		function(cb){//$or:[{year:2018},{year:/2018/}]//{$or:[{name:name},{principal:principal},{year:year},{year:{$regex:year}}]}
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
				console.log('不带搜索参数')
				let search = slider.find({isen:1})
					//search.where('isDisplay').equals(0)
					//search.sort({'publishyear':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.sort({'id':-1})
					search.exec(function(error,docs){
						if(error){
							console.log('slider_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
			
		}
	],function(error,result){
		if(error){
			console.log('slider_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('slider_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).post('/changedisplay',function(req,res){
	console.log(req.body)
	let obj = {	isDisplay:req.body.isDisplay }
	slider.updateOne({id:req.body.id},obj,function(error){
		if(error){
			console.log('isDisplay hide error',error)
			return res.json({'code':1,'msg':error})
		}
		console.log('isDisplay hide success')
		return res.json({'code':0})		
	})
}).get('/slideradd',function(req,res){
	let id = req.query.id
	console.log('slider ID,',id)
	if(id&&typeof(id)!='undefined'){
		let search = slider.findOne({})
		search.where('id').equals(id)
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			if(doc){
				res.render('manage/syfb/slideradd',{data:doc})
			}
			if(!doc){
				res.render('manage/syfb/slideradd',{data:{}})
			}
		})
	}else{
		res.render('manage/syfb/slideradd',{data:{}})
	}
}).get('/slideradd1',function(req,res){
	let id = req.query.id
	console.log('slider ID,',id)
	if(id&&typeof(id)!='undefined'){
		let search = slider.findOne({})
		search.where('id').equals(id)
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			if(doc){
				res.render('manage/syfb/slideradd1',{data:doc})
			}
			if(!doc){
				res.render('manage/syfb/slideradd1',{data:{}})
			}
		})
	}else{
		res.render('manage/syfb/slideradd1',{data:{}})
	}
}).post('/sliderupload',function(req,res){
	console.log('sliderimgupload')
	console.log(attachmentuploaddir,attachmentuploaddir + '\\slider')
	
	let sliderimg = attachmentuploaddir + '\\slider'//G:\newcsse\public\attachment\slider
	fs.existsSync(sliderimg) || fs.mkdirSync(sliderimg)
	console.log('userinfo img dir ',sliderimg)
	let form = new multiparty.Form();
    //设置编码
    form.encoding = 'utf-8';
    //设置文件存储路径
    form.uploadDir = sliderimg
    console.log('form.uploadDir-->',form.uploadDir)
    let baseimgpath = sliderimg.split('\\')
    	// baseimgpath.shift()
    	// baseimgpath.shift()
    	// baseimgpath.shift()
    	// baseimgpath = baseimgpath.join('/')
    	let baseimgpathlength = baseimgpath.length
    baseimgpath = baseimgpath[baseimgpathlength-2] + '/' + baseimgpath[baseimgpathlength-1]
    	console.log('baseimgpath-----',baseimgpath)//attachment/sliderimg
		//return false
    form.parse(req, function(err, fields, files) {
    	if(err){
    		console.log('userinfo img parse err',err.stack)
    	}
    	console.log('fields->',fields)
    	console.log('files->',files)
    	let uploadfiles =  files.file
    	let returnimgurl = [],
    		returnfilename = []
    	uploadfiles.forEach(function(item,index){
    		console.log('读取文件路径-->',item.path,sliderimg+'\\'+item.originalFilename)
    		//returnimgurl.push('/'+baseimgpath+'/'+item.originalFilename)///images/attachment/news/84f1914cedd048ad90eeaaefc25c7be9.jpeg
			//fs.renameSync(item.path,userimg+'\\'+item.originalFilename);
			//returnfilename.push(item.originalFilename)
			//1012更改，加入时间戳，防止同名文件覆盖
			returnimgurl.push('/'+baseimgpath+'/'+ moment().unix() + '_' + item.originalFilename)
    		fs.renameSync(item.path,sliderimg+'\\'+ moment().unix() + '_' + item.originalFilename);
    		returnfilename.push(moment().unix() + '_' + item.originalFilename)
    	})
    	console.log('returnimgurl',returnimgurl)
		
		returnimgurl = basedir+returnimgurl
    	return res.json({"errno":0,"data":returnimgurl,"returnfilename":returnfilename})
    })
}).post('/slideradd',function(req,res){
	console.log('slideradd------------------>',)
	if(req.body.id==''||req.body.id==null){
		console.log('新增 slideradd')
		async.waterfall([
			function(cb){
				let search = slider.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						if(doc){
							console.log('表中最大id',doc.id)
							cb(null,doc.id)
						}
						if(!doc){
							console.log('表中无记录')
							cb(0,null)
						}
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				let slideradd = new slider({
					id:id,
					title:req.body.title,//加入权限后需要更新
					// title1:req.body.title1,
					jianjie:req.body.jianjie,
					jianjie1:req.body.jianjie,
					pic:req.body.pic,
					url:req.body.url,
					isen:0
				})
				slideradd.save(function(error,doc){
					if(error){
						console.log('slideradd save error',error)
						cb(error)
					}
					console.log('slideradd save success')
					cb(null,doc)
				})
			}
		],function(error,result){
			if(error){
				console.log('slideradd async error',error)
				return res.end(error)
			}
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}else{
		console.log('slideradd',req.body)
		//return false
		async.waterfall([
			function(cb){
				let obj = {
					title:req.body.title,//加入权限后需要更新
					// title1:req.body.title1,
					jianjie:req.body.jianjie,
					jianjie1:req.body.jianjie1,
					pic:req.body.pic,
					url:req.body.url,
					isen:0
				}
				slider.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('slideradd update error',error)
						cb(error)
					}
					console.log('slideradd update success')
					cb(null)
				})
			},
		],function(error,result){
			if(error){
				console.log('slideradd async error',error)
				return res.end(error)
			}
			console.log('slideradd',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}
}).post('/slideradd1',function(req,res){
	console.log('slideradd------------------>',)
	if(req.body.id==''||req.body.id==null){
		console.log('新增 slideradd')
		async.waterfall([
			function(cb){
				let search = slider.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						if(doc){
							console.log('表中最大id',doc.id)
							cb(null,doc.id)
						}
						if(!doc){
							console.log('表中无记录')
							cb(0,null)
						}
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				let slideradd = new slider({
					id:id,
					// title:req.body.title,//加入权限后需要更新
					title1:req.body.title1,
					jianjie:req.body.jianjie,
					jianjie1:req.body.jianjie,
					pic:req.body.pic,
					url:req.body.url,
					isen:1
				})
				slideradd.save(function(error,doc){
					if(error){
						console.log('slideradd save error',error)
						cb(error)
					}
					console.log('slideradd save success')
					cb(null,doc)
				})
			}
		],function(error,result){
			if(error){
				console.log('slideradd async error',error)
				return res.end(error)
			}
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}else{
		console.log('slideradd',req.body)
		//return false
		async.waterfall([
			function(cb){
				let obj = {
					// title:req.body.title,//加入权限后需要更新
					title1:req.body.title1,
					jianjie:req.body.jianjie,
					jianjie1:req.body.jianjie1,
					pic:req.body.pic,
					url:req.body.url,
					isen:1
				}
				slider.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('slideradd update error',error)
						cb(error)
					}
					console.log('slideradd update success')
					cb(null)
				})
			},
		],function(error,result){
			if(error){
				console.log('slideradd async error',error)
				return res.end(error)
			}
			console.log('slideradd',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}
}).post('/sliderdel',function(req,res){
	console.log('sliderdel',req.body.id)
	//console.log('newsdel del',req.bdoy.id)
	slider.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('sliderdel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del sliderdel success'})
	})
}).post('/newsupload',function(req,res){
	console.log('newsupload')
	console.log(attachmentuploaddir,attachmentuploaddir + '\\news')
	
	let newsimg = attachmentuploaddir + '\\news'//G:\newcsse\public\attachment\slider
	fs.existsSync(newsimg) || fs.mkdirSync(newsimg)
	console.log('newsimg img dir ',newsimg)
	let form = new multiparty.Form();
    //设置编码
    form.encoding = 'utf-8';
    //设置文件存储路径
    form.uploadDir = newsimg
    console.log('form.uploadDir-->',form.uploadDir)
    let baseimgpath = newsimg.split('\\')
    	// baseimgpath.shift()
    	// baseimgpath.shift()
    	// baseimgpath.shift()
    	// baseimgpath = baseimgpath.join('/')
    	let baseimgpathlength = baseimgpath.length
    baseimgpath = baseimgpath[baseimgpathlength-2] + '/' + baseimgpath[baseimgpathlength-1]
    	console.log('baseimgpath-----',baseimgpath)//attachment/sliderimg
		//return false
    form.parse(req, function(err, fields, files) {
    	if(err){
    		console.log('newsimg img parse err',err.stack)
    	}
    	console.log('fields->',fields)
    	console.log('files->',files)
    	let uploadfiles =  files.file
    	let returnimgurl = [],
    		returnfilename = []
    	uploadfiles.forEach(function(item,index){
    		console.log('读取文件路径-->',item.path,newsimg+'\\'+item.originalFilename)
    		//returnimgurl.push('/'+baseimgpath+'/'+item.originalFilename)///images/attachment/news/84f1914cedd048ad90eeaaefc25c7be9.jpeg
			//fs.renameSync(item.path,userimg+'\\'+item.originalFilename);
			//returnfilename.push(item.originalFilename)
			//1012更改，加入时间戳，防止同名文件覆盖
			returnimgurl.push(baseimgpath+'/'+ moment().unix() + '_' + item.originalFilename)
    		fs.renameSync(item.path,newsimg+'\\'+ moment().unix() + '_' + item.originalFilename);
    		returnfilename.push(moment().unix() + '_' + item.originalFilename)
    	})
    	console.log('returnimgurl',returnimgurl)
		
		returnimgurl = basedir+returnimgurl
    	return res.json({"errno":0,"data":returnimgurl,"returnfilename":returnfilename})
    })
}).get('/jrnews',function(req,res){
	res.render('manage/syfb/jrxw',{search_param:manageconfig.search_param.jrxw})
}).get('/news_data',function(req,res){
	commonfunc.DataSearch(req,res,cmsContent,manageconfig.search_param.jrxw,{'trees':'179-181-'},{timeAdd:-1,isTop:-1,timeAddStamp:-1})
}).get('/jrxwadd',function(req,res){
	let id = req.query.id
	console.log('cmsContent ID,',id)
	if(id&&typeof(id)!='undefined'){
		let search = cmsContent.findOne({})
		search.where('id').equals(id)
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			if(doc){
				res.render('manage/syfb/jrxwadd',{data:doc})
			}
			if(!doc){
				res.render('manage/syfb/jrxwadd',{data:{}})
			}
		})
	}else{
		res.render('manage/syfb/jrxwadd',{data:{}})
	}
}).post('/jrxwadd',function(req,res){
	console.log('jrxwadd------------------>',)
	let othersaveparam = {trees:'179-181-',tag2:'计软新闻'}
	let saveparam = ['title','titleEN','pageContent','pageContentEN','isTop','timeAdd','timeEdit','fujianPath','leixing','trees'];
	commonfunc.DataUpdate(req,res,cmsContent,saveparam,othersaveparam)
/*	
	if(req.body.id==''||req.body.id==null){
		console.log('新增 jrxwadd')
		async.waterfall([
			function(cb){
				let search = cmsContent.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						if(doc){
							console.log('表中最大id',doc.id)
							cb(null,doc.id)
						}
						if(!doc){
							console.log('表中无记录')
							cb(0,null)
						}
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				let cmsContentadd = new cmsContent({
					id:id,
					title:req.body.title,//加入权限后需要更新
					titleEN:req.body.titleEN,
					pageContent:req.body.pageContent,
					pageContentEN:req.body.pageContentEN,
					isTop:req.body.isTop,
					timeAdd:req.body.timeAdd,
					timeEdit:req.body.timeEdit,
					trees:'179-181-',
					tag2:'计软新闻',
					fujianPath:req.body.fujianPath,
					leixing:req.body.leixing
				})
				cmsContentadd.save(function(error,doc){
					if(error){
						console.log('cmsContentadd save error',error)
						cb(error)
					}
					console.log('cmsContentadd save success')
					cb(null,doc)
				})
			}
		],function(error,result){
			if(error){
				console.log('cmsContentadd async error',error)
				return res.end(error)
			}
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}else{
		console.log('cmsContentadd',req.body)
		//return false
		async.waterfall([
			function(cb){
				let obj = {
					title:req.body.title,//加入权限后需要更新
					titleEN:req.body.titleEN,
					pageContent:req.body.pageContent,
					pageContentEN:req.body.pageContentEN,
					isTop:req.body.isTop,
					timeAdd:req.body.timeAdd,
					timeEdit:req.body.timeEdit,
					fujianPath:req.body.fujianPath,
					leixing:req.body.leixing,
					tag2:'计软新闻',
				}
				cmsContent.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('cmsContent update error',error)
						cb(error)
					}
					console.log('cmsContent update success')
					cb(null)
				})
			},
		],function(error,result){
			if(error){
				console.log('cmsContent async error',error)
				return res.end(error)
			}
			console.log('slideradd',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}*/
}).post('/newsdel',function(req,res){
	console.log('newsdel',req.body.id)
	//console.log('newsdel del',req.bdoy.id)
	cmsContent.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('newsdel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del newsdel success'})
	})
}).post('/changenewsdisplay',function(req,res){
	console.log(req.body.isDisplay)
	let obj = {	isDisplay:req.body.isDisplay }
	cmsContent.updateOne({id:req.body.id},obj,function(error){
		if(error){
			console.log('cmsContent isDisplay hide error',error)
			return res.json({'code':1,'msg':error})
		}
		console.log('cmsContent isDisplay hide success')
		return res.json({'code':0})		
	})
}).post('/changenewstop',function(req,res){
	console.log(req.body.isTop)
	let obj = {	isTop:req.body.isTop }
	cmsContent.updateOne({id:req.body.id},obj,function(error){
		if(error){
			console.log('cmsContent isTop hide error',error)
			return res.json({'code':1,'msg':error})
		}
		console.log('cmsContent isTop hide success')
		return res.json({'code':0})		
	})
}).get('/notice',function(req,res){
	res.render('manage/syfb/notice',{search_param:manageconfig.search_param.notice})
}).get('/notice_data',function(req,res){
	console.log('router notice_data')
	commonfunc.DataSearch(req,res,cmsContent,manageconfig.search_param.jrfc,{'trees':'179-182-'})
}).post('/noticedel',function(req,res){
	console.log('noticedel',req.body.id)
	//console.log('newsdel del',req.bdoy.id)
	cmsContent.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('noticedel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del newsdel success'})
	})
}).post('/changenoticedisplay',function(req,res){
	console.log(req.body.isDisplay)
	let obj = {	isDisplay:req.body.isDisplay }
	cmsContent.updateOne({id:req.body.id},obj,function(error){
		if(error){
			console.log('changenoticedisplay hide error',error)
			return res.json({'code':1,'msg':error})
		}
		console.log('changenoticedisplay  hide success')
		return res.json({'code':0})		
	})
}).post('/changenoticetop',function(req,res){
	console.log(req.body.isTop)
	let obj = {	isTop:req.body.isTop }
	cmsContent.updateOne({id:req.body.id},obj,function(error){
		if(error){
			console.log('changenoticetop isTop hide error',error)
			return res.json({'code':1,'msg':error})
		}
		console.log('changenoticetop isTop hide success')
		return res.json({'code':0})		
	})
}).get('/noticeadd',function(req,res){
	let id = req.query.id
	console.log('noticeadd ID,',id)
	if(id&&typeof(id)!='undefined'){
		let search = cmsContent.findOne({})
		search.where('id').equals(id)
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			if(doc){
				res.render('manage/syfb/noticeadd',{data:doc})
			}
			if(!doc){
				res.render('manage/syfb/noticeadd',{data:{}})
			}
		})
	}else{
		res.render('manage/syfb/noticeadd',{data:{}})
	}
}).post('/noticeadd',function(req,res){
	console.log('noticeadd------------------>',)
	if(req.body.id==''||req.body.id==null){
		console.log('新增 noticeadd')
		async.waterfall([
			function(cb){
				let search = cmsContent.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						if(doc){
							console.log('表中最大id',doc.id)
							cb(null,doc.id)
						}
						if(!doc){
							console.log('表中无记录')
							cb(0,null)
						}
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				let cmsContentadd = new cmsContent({
					id:id,
					title:req.body.title,//加入权限后需要更新
					titleEN:req.body.titleEN,
					pageContent:req.body.pageContent,
					pageContentEN:req.body.pageContentEN,
					isTop:req.body.isTop,
					timeAdd:req.body.timeAdd,
					timeEdit:req.body.timeEdit,
					trees:'179-182-',
					tag2:'通知公告',
					leixing1:req.body.leixing1
				})
				cmsContentadd.save(function(error,doc){
					if(error){
						console.log('cmsContentadd save error',error)
						cb(error)
					}
					console.log('cmsContentadd save success',doc)
					//return
					cb(null,doc)
				})
			}
		],function(error,result){
			if(error){
				console.log('noticeadd async error',error)
				return res.end(error)
			}
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}else{
		console.log('noticeadd',req.body)
		//return false
		async.waterfall([
			function(cb){
				let obj = {
					title:req.body.title,//加入权限后需要更新
					titleEN:req.body.titleEN,
					pageContent:req.body.pageContent,
					pageContentEN:req.body.pageContentEN,
					isTop:req.body.isTop,
					timeAdd:req.body.timeAdd,
					timeEdit:req.body.timeEdit,
					trees:'179-182-',
					tag2:'通知公告',
					leixing1:req.body.leixing1
				}
				cmsContent.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('noticeadd update error',error)
						cb(error)
					}
					console.log('noticeadd update success')
					cb(null)
				})
			},
		],function(error,result){
			if(error){
				console.log('noticeadd async error',error)
				return res.end(error)
			}
			console.log('noticeadd',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}
}).get('/jrfc',function(req,res){
	res.render('manage/syfb/jrfc',{search_param:manageconfig.search_param.jrfc})
}).get('/jrfc_data',function(req,res){
	commonfunc.DataSearch(req,res,cmsContent,manageconfig.search_param.jrfc,{'tag2':'计软风采'})

}).post('/jrfcdel',function(req,res){
	console.log('jrfcdel',req.body.id)
	//console.log('newsdel del',req.bdoy.id)
	cmsContent.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('jrfcdel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del newsdel success'})
	})
}).post('/changejrfcdisplay',function(req,res){
	console.log(req.body.isDisplay)
	let obj = {	isDisplay:req.body.isDisplay }
	cmsContent.updateOne({id:req.body.id},obj,function(error){
		if(error){
			console.log('changejrfcdisplay hide error',error)
			return res.json({'code':1,'msg':error})
		}
		console.log('changejrfcdisplay  hide success')
		return res.json({'code':0})		
	})
}).post('/changejrfctop',function(req,res){
	console.log(req.body.isTop)
	let obj = {	isTop:req.body.isTop }
	cmsContent.updateOne({id:req.body.id},obj,function(error){
		if(error){
			console.log('changejrfctop isTop hide error',error)
			return res.json({'code':1,'msg':error})
		}
		console.log('changejrfctop isTop hide success')
		return res.json({'code':0})		
	})
}).get('/jrfcadd',function(req,res){
	let id = req.query.id
	console.log('jrfcadd ID,',id)
	if(id&&typeof(id)!='undefined'){
		let search = cmsContent.findOne({})
		search.where('id').equals(id)
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			if(doc){
				res.render('manage/syfb/jrfcadd',{data:doc})
			}
			if(!doc){
				res.render('manage/syfb/jrfcadd',{data:{}})
			}
		})
	}else{
		res.render('manage/syfb/jrfcadd',{data:{}})
	}
}).post('/jrfcadd',function(req,res){
	console.log('jrfcadd------------------>',)
	if(req.body.id==''||req.body.id==null){
		console.log('新增 jrfcadd')
		async.waterfall([
			function(cb){
				let search = cmsContent.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						if(doc){
							console.log('表中最大id',doc.id)
							cb(null,doc.id)
						}
						if(!doc){
							console.log('表中无记录')
							cb(0,null)
						}
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				let cmsContentadd = new cmsContent({
					id:id,
					title:req.body.title,//加入权限后需要更新
					titleEN:req.body.titleEN,
					pageContent:req.body.pageContent,
					pageContentEN:req.body.pageContentEN,
					isTop:req.body.isTop,
					timeAdd:req.body.timeAdd,
					timeEdit:req.body.timeEdit,
					//trees:'179-182-',
					tag2:'计软风采',
					fujianPath:req.body.fujianPath
				})
				cmsContentadd.save(function(error,doc){
					if(error){
						console.log('jrfc save error',error)
						cb(error)
					}
					console.log('jrfc save success',doc)
					//return
					cb(null,doc)
				})
			}
		],function(error,result){
			if(error){
				console.log('jrfcadd async error',error)
				return res.end(error)
			}
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}else{
		console.log('jrfcadd',req.body)
		//return false
		async.waterfall([
			function(cb){
				let obj = {
					title:req.body.title,//加入权限后需要更新
					titleEN:req.body.titleEN,
					pageContent:req.body.pageContent,
					pageContentEN:req.body.pageContentEN,
					isTop:req.body.isTop,
					timeAdd:req.body.timeAdd,
					timeEdit:req.body.timeEdit,
					fujianPath:req.body.fujianPath
				}
				cmsContent.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('jrfcadd update error',error)
						cb(error)
					}
					console.log('jrfcadd update success')
					cb(null)
				})
			},
		],function(error,result){
			if(error){
				console.log('jrfcadd async error',error)
				return res.end(error)
			}
			console.log('noticeadd',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}
}).post('/jrfcupload',function(req,res){
	console.log('jrfcupload')
	console.log(attachmentuploaddir,attachmentuploaddir + '\\jrfc')
	let jrfcdir = attachmentuploaddir + '\\jrfc'//G:\spatial_lab\public\attachment\gzzdpdf
	fs.existsSync(jrfcdir) || fs.mkdirSync(jrfcdir)
	console.log('jrfcdir img dir ',jrfcdir)
	let form = new multiparty.Form();
    //设置编码
    form.encoding = 'utf-8';
    //设置文件存储路径
    form.uploadDir = jrfcdir
    console.log('form.uploadDir-->',form.uploadDir)
    let baseimgpath = jrfcdir.split('\\')
    	// baseimgpath.shift()
    	// baseimgpath.shift()
    	// baseimgpath.shift()
    	// baseimgpath = baseimgpath.join('/')
    	let baseimgpathlength = baseimgpath.length
    baseimgpath = baseimgpath[baseimgpathlength-2] + '/' + baseimgpath[baseimgpathlength-1]
    	console.log('baseimgpath',baseimgpath)
    form.parse(req, function(err, fields, files) {
    	if(err){
    		console.log('jrfcdir parse err',err.stack)
    	}
    	console.log('fields->',fields)
    	console.log('files->',files)
    	let uploadfiles =  files.file
    	let returnimgurl = [],
    		returnfilename = []
    	uploadfiles.forEach(function(item,index){
    		console.log('读取文件路径-->',item.path,jrfcdir+'\\'+item.originalFilename)
    		//returnimgurl.push('/'+baseimgpath+'/'+item.originalFilename)///images/attachment/news/84f1914cedd048ad90eeaaefc25c7be9.jpeg
			//fs.renameSync(item.path,gzzddir+'\\'+item.originalFilename);
			//returnfilename.push(item.originalFilename)
			//1012更改，加入时间戳，防止同名文件覆盖
			returnimgurl.push('/'+baseimgpath+'/'+ moment().unix() + '_' + item.originalFilename)
    		fs.renameSync(item.path,jrfcdir+'\\'+ moment().unix() + '_' + item.originalFilename);
    		returnfilename.push(moment().unix() + '_' + item.originalFilename)
    	})
    	console.log('returnimgurl',returnimgurl)
    	
		returnimgurl = basedir+returnimgurl
    	return res.json({"errno":0,"data":returnimgurl,"returnfilename":returnfilename})
    })
}).get('/highlights',function(req,res){
	let search = highlight.findOne({})
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/syfb/hightlight',{data:doc})
		})
}).post('/hightlight',function(req,res){
	let updateobj = {
		ruanke : req.body.ruanke,
	    usnews : req.body.usnews, 
        csrankings : req.body.csrankings,
	    taiws : req.body.taiws,
        qs : req.body.qs,
	    esc : req.body.esc,
        zhuanzjs : req.body.zhuanzjs,
	    benks : req.body.benks,
        yanjs : req.body.yanjs,
	    guojjxm : req.body.guojjxm,
        guojjpt : req.body.guojjpt,
	    guojjrc : req.body.guojjrc,
        xueymj  : req.body.xueymj,
	    shebjz : req.body.shebjz
	}
	highlight.updateOne({_id:req.body._id},updateobj,function(error){
		if(error){
			console.log('hightlightadd updateobj error',error)
			cb(error)
		}
		//console.log('hightlightadd updateobj success',doc)
		res.json({'code':0})
	})
})
//英文
//​Join Us
router.get('/zpxxen',function(req,res){
	console.log('in zpxxen')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('Join Us')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/en/joinus/publictpl',{data:doc})
		})
})
//research,列表页,放研究成果
router.get('/research',function(req,res){
	res.render('manage/en/research/research')
}).get('/research_data',function(req,res){
	console.log('router research_data')
	let page = req.query.page,
		limit = req.query.limit,
		search_txt = req.query.search_txt
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let search = cmsContent.find({'tag2':'Research'}).count()
				search.exec(function(err,count){
					if(err){
						console.log('research_data get total err',err)
						cb(err)
					}
					console.log('research_data count',count)
					total = count
					cb(null)
				})
		},
		function(cb){
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			if(search_txt){
				console.log('带搜索参数',search_txt)
				let _filter = {
					$and:[
						{title:{$regex:search_txt,$options:'$i'}},//忽略大小写
						{tag2:'Research'}
					]
				}
				console.log('_filter',_filter)
				let search = cmsContent.find(_filter)
					search.sort({'id':-1})
					search.sort({'timeAddStamp':-1})
					search.sort({'timeAdd':-1})
					search.sort({'isDisplay':1})
					search.sort({'isTop':-1})//正序
					
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('research_data error',error)
							cb(error)
						}
						//获取搜索参数的记录总数
						cmsContent.count(_filter,function(err,count_search){
							if(err){
								console.log('research_data count_search err',err)
								cb(err)
							}
							console.log('搜索到记录数',count_search)
							total = count_search
							cb(null,docs)
						})
					})
			}else{
				console.log('不带搜索参数')
				let search = cmsContent.find({'tag2':'Research'})
					search.sort({'id':-1})
					search.sort({'isTop':-1})//正序
					search.sort({'isDisplay':1})
					search.sort({'timeAdd':-1})
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('research_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
			}
		}
	],function(error,result){
		if(error){
			console.log('research_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('research_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).post('/researchdel',function(req,res){
	console.log('researchdel',req.body.id)
	//console.log('newsdel del',req.bdoy.id)
	cmsContent.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('researchdel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del newsdel success'})
	})
}).post('/changeresearchdisplay',function(req,res){
	console.log(req.body.isDisplay)
	let obj = {	isDisplay:req.body.isDisplay }
	cmsContent.updateOne({id:req.body.id},obj,function(error){
		if(error){
			console.log('changeresearchdisplay hide error',error)
			return res.json({'code':1,'msg':error})
		}
		console.log('changeresearchdisplay  hide success')
		return res.json({'code':0})		
	})
}).post('/changeresearchtop',function(req,res){
	console.log(req.body.isTop)
	let obj = {	isTop:req.body.isTop }
	cmsContent.updateOne({id:req.body.id},obj,function(error){
		if(error){
			console.log('changeresearchtop isTop hide error',error)
			return res.json({'code':1,'msg':error})
		}
		console.log('changeresearchtop isTop hide success')
		return res.json({'code':0})		
	})
}).get('/researchadd',function(req,res){
	let id = req.query.id
	console.log('researchadd ID,',id)
	if(id&&typeof(id)!='undefined'){
		let search = cmsContent.findOne({})
		search.where('id').equals(id)
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			if(doc){
				res.render('manage/en/research/researchadd',{data:doc})
			}
			if(!doc){
				res.render('manage/en/research/researchadd',{data:{}})
			}
		})
	}else{
		res.render('manage/en/research/researchadd',{data:{}})
	}
}).post('/researchadd',function(req,res){
	console.log('researchadd------------------>',)
	if(req.body.id==''||req.body.id==null){
		console.log('新增 researchadd')
		async.waterfall([
			function(cb){
				let search = cmsContent.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						if(doc){
							console.log('表中最大id',doc.id)
							cb(null,doc.id)
						}
						if(!doc){
							console.log('表中无记录')
							cb(0,null)
						}
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				let cmsContentadd = new cmsContent({
					id:id,
					title:req.body.title,//加入权限后需要更新
					titleEN:req.body.titleEN,
					pageContent:req.body.pageContent,
					pageContentEN:req.body.pageContentEN,
					isTop:req.body.isTop,
					timeAdd:req.body.timeAdd,
					timeEdit:req.body.timeEdit,
					//trees:'179-182-',
					tag2:'Research',
					fujianPath:req.body.fujianPath
				})
				cmsContentadd.save(function(error,doc){
					if(error){
						console.log('researchadd save error',error)
						cb(error)
					}
					console.log('researchadd save success',doc)
					//return
					cb(null,doc)
				})
			}
		],function(error,result){
			if(error){
				console.log('jrfcadd async error',error)
				return res.end(error)
			}
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}else{
		console.log('researchadd',req.body)
		//return false
		async.waterfall([
			function(cb){
				let obj = {
					title:req.body.title,//加入权限后需要更新
					titleEN:req.body.titleEN,
					pageContent:req.body.pageContent,
					pageContentEN:req.body.pageContentEN,
					isTop:req.body.isTop,
					timeAdd:req.body.timeAdd,
					timeEdit:req.body.timeEdit,
					fujianPath:req.body.fujianPath
				}
				cmsContent.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('researchadd update error',error)
						cb(error)
					}
					console.log('researchadd update success')
					cb(null)
				})
			},
		],function(error,result){
			if(error){
				console.log('researchadd async error',error)
				return res.end(error)
			}
			console.log('researchadd',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}
}).post('/researchupload',function(req,res){
	console.log('jrfcupload')
	console.log(attachmentuploaddir,attachmentuploaddir + '\\research')
	let researchdir = attachmentuploaddir + '\\research'//G:\spatial_lab\public\attachment\research
	fs.existsSync(researchdir) || fs.mkdirSync(researchdir)
	console.log('researchdir img dir ',researchdir)
	let form = new multiparty.Form();
    //设置编码
    form.encoding = 'utf-8';
    //设置文件存储路径
    form.uploadDir = researchdir
    console.log('form.uploadDir-->',form.uploadDir)
    let baseimgpath = researchdir.split('\\')
    	// baseimgpath.shift()
    	// baseimgpath.shift()
    	// baseimgpath.shift()
    	// baseimgpath = baseimgpath.join('/')
    	let baseimgpathlength = baseimgpath.length
    baseimgpath = baseimgpath[baseimgpathlength-2] + '/' + baseimgpath[baseimgpathlength-1]
    	console.log('baseimgpath',baseimgpath)
    form.parse(req, function(err, fields, files) {
    	if(err){
    		console.log('researchdir parse err',err.stack)
    	}
    	console.log('fields->',fields)
    	console.log('files->',files)
    	let uploadfiles =  files.file
    	let returnimgurl = [],
    		returnfilename = []
    	uploadfiles.forEach(function(item,index){
    		console.log('读取文件路径-->',item.path,researchdir+'\\'+item.originalFilename)
    		//returnimgurl.push('/'+baseimgpath+'/'+item.originalFilename)///images/attachment/news/84f1914cedd048ad90eeaaefc25c7be9.jpeg
			//fs.renameSync(item.path,gzzddir+'\\'+item.originalFilename);
			//returnfilename.push(item.originalFilename)
			//1012更改，加入时间戳，防止同名文件覆盖
			returnimgurl.push('/'+baseimgpath+'/'+ moment().unix() + '_' + item.originalFilename)
    		fs.renameSync(item.path,researchdir+'\\'+ moment().unix() + '_' + item.originalFilename);
    		returnfilename.push(moment().unix() + '_' + item.originalFilename)
    	})
    	console.log('returnimgurl',returnimgurl)
    	
		returnimgurl = basedir+returnimgurl
    	return res.json({"errno":0,"data":returnimgurl,"returnfilename":returnfilename})
    })
})
//people
//修改密码
router.get('/changePassword',function(req,res){
	let account = req.session.account
	console.log('account-------',account)
	let search = user.findOne({'account':account})
		search.exec(function(err,doc){
			if(err){
				res.end(err)
			}
			res.render('manage/password/changepassword',{user:doc})
		})
}).post('/changePassword',function(req,res){
	console.log('id,password',req.body.id,req.body.password)
	let obj = {
		password:cryptoPassFunc(req.body.password)
	}
	user.updateOne({id:req.body.id},obj,function(error){
		if(error){
			console.log('password update error',error)
			cb(error)
		}
		req.session.destroy(function(err){
			if(err){
				console.log('err')
				return res.send(err)
			}
			console.log('req.session--------',req.session)
			res.json({'code':0,'msg':'update success'})
		})
	})
})
//about facts and figures
router.get('/figures',function(req,res){
	console.log('in figures')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('Facts and Figures')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}	
			res.render('manage/en/about/figures',{data:doc})
		})
}).post('/figures',function(req,res){
	console.log('figures post')
	//console.log('req.bdoy',req.body)
	cmsContent.updateOne({'id':req.body.id},{'title':req.body.title,'titleEN':req.body.titleEN,'pageContent':req.body.pageContent,'pageContentEN':req.body.pageContentEN,'timeAdd':req.body.timeAdd,'timeEdit':req.body.timeEdit},function(error){
		if(error){
			console.log('figures error',error)
			res.json({'code':-1,'msg':error})
		}
		console.log('figures success')
		res.json({'code':0,'msg':'update success'})
	})
})
router.get('/get_py',function(req,res){
	let result = []
	async.waterfall([
		function(cb){
			let search = user.find({})
				search.exec(function(err,docs){
					if(err){
						cb(err)
					}
					cb(null,docs)
				})
		},
		function(docs,cb){
			async.eachLimit(docs,1,function(item,callback){
				console.log('userName-----------------------',item.userName)
				let temp = []
				if(item.userName){
					temp = pinyin(item.userName,{
						style:pinyin.STYLE_FIRST_LETTER
					})
				}
				console.log('转换结果---------',temp[0][0])
				let updateobj = {
					userName_py:temp[0][0]
				}
				user.updateOne({'_id':item._id},updateobj,function(error){
					if(error){
						callback(error)
					}
					callback()
				})
			},function(error){
				if(error){
					console.log(error)
					cb(error)
				}
				cb()
			})
		}
	],function(error,result){
		if(error){
			console.log('get_py async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack})
		}
		console.log('get_py async waterfall success')
		return res.json({'code':0,'msg':'done'})
	})
})
router.get('/officehour',function(req,res){
	let search = officehour.distinct('term')
		search.exec(function(err,docs){
			if(err){
				console.log('err',err)
				return res.json(err)
			}
			console.log(docs)
			res.render('manage/personal/officehour',{term:docs})
		})
}).get('/oh_data',function(req,res){
	console.log('router oh_data',req.session)
	let page = req.query.page,
		limit = req.query.limit,
		term  = req.query.term,
		userName = req.query.userName
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let _obj = {}
			if(req.session.power!='管理员'){
				_obj = {
					'account':req.session.account
				}
			}else{
				if(userName){
					_obj = {
						'userName':userName
					}
				}
				if(term){
					_obj = {
						'term':term
					}
				}
				if(userName && term){
					_obj = {
						'term':term,
						'userName':userName
					}
				}
			}
			console.log('_obj',_obj)
			let search = officehour.find(_obj).count()
				search.exec(function(err,count){
					if(err){
						console.log('oh_data get total err',err)
						cb(err)
					}
					console.log('oh_data count',count)
					total = count
					cb(null)
				})
		},
		function(cb){
			let _obj = {}
			if(req.session.power!='管理员'){
				_obj = {
					'account':req.session.account
				}
			}else{
				if(userName){
					_obj = {
						'userName':userName
					}
				}
				if(term){
					_obj = {
						'term':term
					}
				}
				if(userName && term){
					_obj = {
						'term':term,
						'userName':userName
					}
				}
			}
			console.log('_obj',_obj)
			let numSkip = (page-1)*limit
			limit = parseInt(limit)			
				let search = officehour.find(_obj)
					search.sort({'id':-1})
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('oh_data error',error)
							cb(error)
						}
						cb(null,docs)
					})	
		}
	],function(error,result){
		if(error){
			console.log('oh_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('oh_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).get('/ohadd',function(req,res){
	let id = req.query.id
	console.log('officehour ID,',id)
	if(id&&typeof(id)!='undefined'){
		let search = officehour.findOne({})
		search.where('id').equals(id)
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			if(doc){
				res.render('manage/personal/ohadd',{data:doc})
			}
			if(!doc){
				res.render('manage/personal/ohadd',{data:{}})
			}
		})
	}else{
		res.render('manage/personal/ohadd',{data:{}})
	}
}).post('/ohadd',function(req,res){
	console.log('ohadd------------------>',)
	if(req.body.id==''||req.body.id==null){
		console.log('新增 ohadd')
		async.waterfall([
			function(cb){
				let search = officehour.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						if(doc){
							console.log('表中最大id',doc.id)
							cb(null,doc.id)
						}
						if(!doc){
							console.log('表中无记录')
							cb(0,null)
						}
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				let officehourAdd = new officehour({
					id:id,
					address:req.body.address,//加入权限后需要更新
					email:req.body.email,
					phone:req.body.phone,
					cellphone:req.body.cellphone,
					term:req.body.term,
					timeEnd:req.body.timeEnd,
					timeStart:req.body.timeStart,
					timeEnd1:req.body.timeEnd1,
					timeStart1:req.body.timeStart1,
					account:req.session.account,
					userName:req.session.username,
					week:req.body.week
				})
				officehourAdd.save(function(error,doc){
					if(error){
						console.log('officehourAdd save error',error)
						cb(error)
					}
					console.log('officehourAdd save success')
					cb(null,doc)
				})
			}
		],function(error,result){
			if(error){
				console.log('officehourAdd async error',error)
				return res.end(error)
			}
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}else{
		console.log('officehourAdd',req.body)
		//return false
		async.waterfall([
			function(cb){
				let obj = {
					address:req.body.address,//加入权限后需要更新
					email:req.body.email,
					phone:req.body.phone,
					cellphone:req.body.cellphone,
					term:req.body.term,
					timeEnd:req.body.timeEnd,
					timeStart:req.body.timeStart,
					timeEnd1:req.body.timeEnd1,
					timeStart1:req.body.timeStart1,
					week:req.body.week,
				}
				officehour.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('officehourAdd update error',error)
						cb(error)
					}
					console.log('officehourAdd update success')
					cb(null)
				})
			},
		],function(error,result){
			if(error){
				console.log('officehourAdd async error',error)
				return res.end(error)
			}
			console.log('officehourAdd',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}
}).post('/ohdel',function(req,res){
	console.log('ohdel',req.body.id)
	officehour.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('ohdel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del ohdel success'})
	})
}).get('/oh_data_list',function(req,res){
	console.log('router oh_data',req.session)
	let page = req.query.page,
		limit = req.query.limit

	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	let nowyear = moment().year(),nowmonth = moment().month(),nowterm
    console.log('----------------',nowyear,nowmonth)
    if(nowmonth >= 7){
        nowterm = nowyear + ' - ' + (nowyear+1) + '第一学期'
    }else{
        nowterm = (nowyear-1) + ' - '  + nowyear + '第二学期'
    }
    console.log('nowterm----',nowterm)
	async.waterfall([
		function(cb){
			//get count
			let _obj = {'term':nowterm}
			console.log('_obj',_obj)
			let search = officehour.find(_obj).count()
				search.exec(function(err,count){
					if(err){
						console.log('oh_data get total err',err)
						cb(err)
					}
					console.log('oh_data count',count)
					total = count
					cb(null)
				})
		},
		function(cb){
			let _obj = {'term':nowterm}
			console.log('_obj',_obj)
			let numSkip = (page-1)*limit
			limit = parseInt(limit)			
				let search = officehour.find(_obj)
					search.sort({'id':-1})
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('oh_data error',error)
							cb(error)
						}
						cb(null,docs)
					})	
		}
	],function(error,result){
		if(error){
			console.log('oh_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('oh_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).get('/officehourlist',function(req,res){
	res.render('manage/personal/officehourlist')
})
//教学文档
router.get('/jxwd',function(req,res){
	let search = jxwd.distinct('cTerm')
		search.exec(function(err,docs){
			if(err){
				console.log('err',err)
				return res.json(err)
			}
			docs.sort()
			docs.reverse()
			console.log(docs)
			res.render('manage/personal/jxwd',{term:docs})
		})
}).get('/jxwd_data',function(req,res){
	console.log('router oh_data',req.session)
	let page = req.query.page,
		limit = req.query.limit,
		term  = req.query.term,
		userName = req.query.userName
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit,req.session.userName)
	async.waterfall([
		function(cb){
			//get count
			let _obj = {}
			if(req.session.power!='管理员'){
				_obj = {
					'cTeacher':{$regex:req.session.username,$options:'$i'}
				}
			}else{
				if(userName){
					_obj = {
						'cTeacher':{$regex:userName,$options:'$i'}//title:{$regex:q_word,$options:'$i'}
					}
				}
				if(term){
					_obj = {
						'cTerm':term
					}
				}
				if(userName && term){
					_obj = {
						'cTerm':term,
						'cTeacher':{$regex:userName,$options:'$i'}
					}
				}
			}
			console.log('_obj',_obj)
			let search = jxwd.find(_obj).count()
				search.exec(function(err,count){
					if(err){
						console.log('oh_data get total err',err)
						cb(err)
					}
					console.log('oh_data count',count)
					total = count
					cb(null)
				})
		},
		function(cb){
			let _obj = {}
			if(req.session.power!='管理员'){
				_obj = {
					'cTeacher':{$regex:req.session.username,$options:'$i'}
				}
			}else{
				if(userName){
					_obj = {
						'cTeacher':{$regex:userName,$options:'$i'}
					}
				}
				if(term){
					_obj = {
						'cTerm':term
					}
				}
				if(userName && term){
					_obj = {
						'cTerm':term,
						'cTeacher':{$regex:userName,$options:'$i'}
					}
				}
			}
			console.log('_obj',_obj)
			let numSkip = (page-1)*limit
			limit = parseInt(limit)			
				let search = jxwd.find(_obj)
					search.sort({'cTerm':-1})
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('oh_data error',error)
							cb(error)
						}
						cb(null,docs)
					})	
		}
	],function(error,result){
		if(error){
			console.log('oh_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('oh_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).get('/jxwdadd',function(req,res){
	let id = req.query.id
	console.log('jxwdadd ID,',id)
	if(id&&typeof(id)!='undefined'){
		let search = jxwd.findOne({})
		search.where('id').equals(id)
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			if(doc){
				res.render('manage/personal/jxwdadd',{data:doc})
			}
			if(!doc){
				res.render('manage/personal/jxwdadd',{data:{}})
			}
		})
	}else{
		res.render('manage/personal/jxwdadd',{data:{}})
	}
}).post('/jxwdadd',function(req,res){
	console.log('jxwdadd------------------>',)
	if(req.body.id==''||req.body.id==null){
		console.log('新增 jxwdadd')
		async.waterfall([
			function(cb){
				let search = jxwd.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						if(doc){
							console.log('表中最大id',doc.id)
							cb(null,doc.id)
						}
						if(!doc){
							console.log('表中无记录')
							cb(0,null)
						}
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				let jxwdAdd = new jxwd({
					id:id,
					cTerm:req.body.cTerm,//加入权限后需要更新
					cTeacher:req.body.cTeacher,
					cCode:req.body.cCode,
					cName:req.body.cName,
					cPoint:req.body.cPoint,
					cType:req.body.cType,
					cClass:req.body.cClass
				})
				jxwdAdd.save(function(error,doc){
					if(error){
						console.log('jxwdAdd save error',error)
						cb(error)
					}
					console.log('jxwdAdd save success')
					cb(null,doc)
				})
			}
		],function(error,result){
			if(error){
				console.log('jxwdAdd async error',error)
				return res.end(error)
			}
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}else{
		console.log('officehourAdd',req.body)
		//return false
		async.waterfall([
			function(cb){
				let obj = {
					cTerm:req.body.cTerm,//加入权限后需要更新
					cTeacher:req.body.cTeacher,
					cCode:req.body.cCode,
					cName:req.body.cName,
					cPoint:req.body.cPoint,
					cType:req.body.cType,
					cClass:req.body.cClass
				}
				jxwd.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('jxwd update error',error)
						cb(error)
					}
					console.log('jxwd update success')
					cb(null)
				})
			},
		],function(error,result){
			if(error){
				console.log('jxwd async error',error)
				return res.end(error)
			}
			console.log('officehourAdd',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}
}).post('/jxwdupload',function(req,res){
	//G:\newcsse\public\attachment\hzhb 
	console.log('req.body---------------',req.body,req.query,req.params,req.data)
	let imgpath = attachmentuploaddir + '\\jxwd' //替换 
	console.log('url---------------',imgpath)
	fs.existsSync(imgpath) || fs.mkdirSync(imgpath) 
	let form = new multiparty.Form();
    form.encoding = 'utf-8';
    form.uploadDir = imgpath 
    let baseimgpath = imgpath.split('\\') 
    	let baseimgpathlength = baseimgpath.length
		
    baseimgpath = baseimgpath[baseimgpathlength-2] + '/' + baseimgpath[baseimgpathlength-1]
    form.parse(req, function(err, fields, files) {
		console.log(fields.id,fields.mytype,typeof((fields.id)[0]))
    	if(err){
    		console.log('imgpath  parse err',err.stack)
    	}

    	let uploadfiles =  files.file
    	let returnimgurl = [],
    		returnfilename = []
    	uploadfiles.forEach(function(item,index){
			console.log('item------',item)
			//1012更改，加入时间戳，防止同名文件覆盖
			returnimgurl.push('/'+baseimgpath+'/'+ moment().unix() + '_' + item.originalFilename)
    		fs.renameSync(item.path,imgpath+'\\'+ moment().unix() + '_' + item.originalFilename);
    		returnfilename.push(moment().unix() + '_' + item.originalFilename)
    	})
		console.log('basedir------------------',basedir)
		console.log('returnimgurl------------------',returnimgurl)
		//returnimgurl = '/csse'+returnimgurl
		returnimgurl = ''+returnimgurl
		console.log('req.body-----',req.body)
		let checkuploadfile = (fields.mytype)[0],_obj={},id=(fields.id)[0]
		console.log('checkuploadtype-----',checkuploadfile,id)
		//return
		if(checkuploadfile=='syjxjdb'){
			console.log('实验教学进度表')
			_obj = {syjxapb:returnimgurl}
		}
		if(checkuploadfile=='jxdg'){
			console.log('教学大纲')
			_obj = {jxdg:returnimgurl}
		}
		if(checkuploadfile=='jxjdb'){
			console.log('教学进度表')
			_obj = {jxjdb:returnimgurl}
		}
		if(checkuploadfile=='syjxdg'){
			console.log('实验教学大纲')
			_obj = {syjxdg:returnimgurl}
		}
		console.log('_obj-----',_obj)
		jxwd.updateOne({'id':parseInt((fields.id)[0])},_obj,function(error){
			if(error){
				console.log('jxwdupload  error',error)
				return res.json({'errno':'-1','msg':error})
			}
			return res.json({"errno":0,"data":returnimgurl,"returnfilename":returnfilename})
		})
    })
}).post('/jxwdimport',function(req,res){
	let imgpath = attachmentuploaddir + '\\jxwd' //替换 
	console.log('url---------------',imgpath)
	fs.existsSync(imgpath) || fs.mkdirSync(imgpath) 

	console.log('in excelimport router')
	var form = new multiparty.Form();
    //设置编码
    form.encoding = 'utf-8';
    //设置文件存储路径
    form.uploadDir = imgpath
    //设置单文件大小限制
    //form.maxFilesSize = 2 * 1024 * 1024;
    //form.maxFields = 1000;  设置所以文件的大小总和
    form.parse(req, function(err, fields, files) {
    	if(err){
    		console.log('parse err',err.stack)
    	}
    })
 	 form.on('file', (name, file, ...rest) => { // 接收到文件参数时，触发file事件
	    console.log('-------------',name, file)
	    let exBuf=fs.readFileSync(file.path)
		    console.log('exBuf-->',exBuf)
		    //使用ejsExcel的getExcelArr将buffer读取为数组
		    ejsExcel.getExcelArr(exBuf).then(exlJson=>{
		    	console.log("---------------- read success:getExcelArr ----------------");
			    let workBook=exlJson;
			    let workSheets=workBook[0];//第一个工作表
			    console.log('workBook-->',workBook)
			    console.log('workSheets-->',workSheets)
			    //res.end(workSheets)
			    //return false
			    let count = 0//计数，排除第一行
				let id 
				let search = jxwd.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
							console.log('find id err',err)
							cb(err)
						}
						if(doc){
							id = doc.id + 1
							console.log('最新id ----- ',id)
							async.eachLimit(workSheets,1,function(item,cb){
								console.log('当前id------',id)
								if(count === 0){
									count++
									cb()
								}else{					   
									console.log('check item-->',item.length)
									
									if(item.length!=0){
										let	new_jxwd = new jxwd({
											id:id,
											cTerm : item[0].trim(),
											cCode : item[1].trim(),
											cName : item[2].trim(),
											cPoint : item[3].trim(),
											cTeacher : item[7].trim(),
											cType : item[8].trim(),
											cClass : item[9].trim(),
										})
										console.log('new_jxwd-----',new_jxwd)
										new_jxwd.save(function(err){
											if(err){						    	
												cb(err)
											}
											id ++
											cb()
										})
									}else{
										cb()
									}
								}//排除第一行
							},function(err){
								if(err){
									console.log('async err')
									return res.json({'code':-1,'msg':err.stack})
								}else{
									   //删除上传的文件
									console.log('----- 删除上传文件 -----')
									fs.unlinkSync(file.path)
									return res.json({'code':0,'msg':'导入成功'})
								}
						})
						}
					})
			    //async	 			    
			}).catch(error=>{
				console.log("************** 读表 error!");
				console.log(error); 
				return res.json({'code':-1,'msg':error})
			});
	  })

  	form.on('close', () => {  // 表单数据解析完成，触发close事件
	    console.log('表单数据解析完成')
	  })
}).post('/jxwddel',function(req,res){
	console.log('jxwddel',req.body.id)
	jxwd.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('jxwddel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del jxwddel success'})
	})
})
//20220105
router.get('/czjl',function(req,res){
	console.log('in czjl')
	res.render('manage/czjl')
}).get('/czjl_data',function(req,res){
	console.log('router czjl_data')
	let page = req.query.page,
		limit = req.query.limit,
		search_txt = req.query.search_txt
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let search = forlog.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('czjl_data get total err',err)
						cb(err)
					}
					console.log('czjl_data count',count)
					total = count
					cb(null)
				})
		},
		function(cb){
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			let search = forlog.find({})
				search.sort({'date':-1})
				search.sort({'exacttime':-1})
				search.limit(limit)
				search.skip(numSkip)
				search.exec(function(error,docs){
					if(error){
						console.log('news_data error',error)
						cb(error)
					}
					cb(null,docs)
				})
		}
	],function(error,result){
		if(error){
			console.log('czjl_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('czjl_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).post('/resetloginnum',function(req,res){
	console.log('resetloginnum',req.body._id)
	user.updateOne({'account':req.body.user},{login_num:0},function(error){
		if(error){
			console.log('resetloginnum del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'resetloginnum success'})
	})
})
//20220127 研究所排序
router.get('/yjssort',function(req,res){
	console.log('in yjssort')
	let data={},gxn_arr=[],dsj_arr=[],mts_arr=[],wls_arr=[],sjs_arr=[],vcc_arr=[],zns_arr=[],wlw_arr=[],jxx_arr=[],rgs_arr=[]
	async.waterfall([
		function(cb){
			let search = user.find({suoxiid:1})
				search.sort({'yanjiusuosort':1})
				//search.sort({'userName_py':1})
				search.exec(function(err,docs){
					if(err){
						cb(err)
					}
					data.gxn_arr = docs
					cb()
				})
		},
		function(cb){
			let search = user.find({suoxiid:2})
				search.sort({'yanjiusuosort':1})
				//search.sort({'userName_py':1})
				search.exec(function(err,docs){
					if(err){
						cb(err)
					}
					data.dsj_arr = docs
					cb()
				})
		},
		function(cb){
			let search = user.find({suoxiid:3})
				search.sort({'yanjiusuosort':1})
				//search.sort({'userName_py':1})
				search.exec(function(err,docs){
					if(err){
						cb(err)
					}
					data.mts_arr = docs
					cb()
				})
		},
		function(cb){
			let search = user.find({suoxiid:4})
				search.sort({'yanjiusuosort':1})
				//search.sort({'userName_py':1})
				search.exec(function(err,docs){
					if(err){
						cb(err)
					}
					data.wls_arr = docs
					cb()
				})
		},
		function(cb){
			let search = user.find({suoxiid:5})
				search.sort({'yanjiusuosort':1})
				//search.sort({'userName_py':1})
				search.exec(function(err,docs){
					if(err){
						cb(err)
					}
					data.sjs_arr = docs
					cb()
				})
		},
		function(cb){
			let search = user.find({suoxiid:6})
				search.sort({'yanjiusuosort':1})
				//search.sort({'userName_py':1})
				search.exec(function(err,docs){
					if(err){
						cb(err)
					}
					data.zns_arr = docs
					cb()
				})
		},
		function(cb){
			let search = user.find({suoxiid:7})
				search.sort({'yanjiusuosort':1})
				//search.sort({'userName_py':1})
				search.exec(function(err,docs){
					if(err){
						cb(err)
					}
					data.wlw_arr = docs
					cb()
				})
		},
		function(cb){
			let search = user.find({suoxiid:8})
				search.sort({'yanjiusuosort':1})
				//search.sort({'userName_py':1})
				search.exec(function(err,docs){
					if(err){
						cb(err)
					}
					data.vcc_arr = docs
					cb()
				})
		}	,
		function(cb){
			let search = user.find({suoxiid:9})
				search.sort({'yanjiusuosort':1})
				//search.sort({'userName_py':1})
				search.exec(function(err,docs){
					if(err){
						cb(err)
					}
					data.jxx_arr = docs
					cb()
				})
		},
		function(cb){
			let search = user.find({suoxiid:11})
				search.sort({'yanjiusuosort':1})
				//search.sort({'userName_py':1})
				search.exec(function(err,docs){
					if(err){
						cb(err)
					}
					data.rgs_arr = docs
					cb()
				})
		}
	],function(error,result){
		if(error){
			return res.json(error)
		}
		res.render('manage/jsdw/yjssort',{L:req.query['L'],data:data})
	})
}).post('/yjssort',function(req,res){
	console.log('排序信息',req.body)
	//return 
	async.waterfall([
		function(cb){
			console.log('------------------',req.body.gxn_sortarr)
			async.eachLimit(req.body.gxn_sortarr,1,function(item,callback){
				console.log('item',item,item.split(','))
				let temp = item.split(',')
				let tempid = temp[1],
					tempsort = parseInt(temp[2])
				let obj = {
					yanjiusuosort : tempsort
				}
				console.log(tempid,tempsort)
				user.updateOne({_id:tempid},obj,function(error){
					if(error){
						console.log('user sort update error',error)
						callback(error)
					}
					console.log('user sort update success')
					callback(null)
				})
			},function(error){
				if(error){
					cb(error)
				}
				cb()
			})
		},
		function(cb){
			console.log('------------------',req.body.dsj_sortarr)
			async.eachLimit(req.body.dsj_sortarr,1,function(item,callback){
				console.log('item',item,item.split(','))
				let temp = item.split(',')
				let tempid = temp[1],
					tempsort = parseInt(temp[2])
				let obj = {
					yanjiusuosort : tempsort
				}
				console.log(tempid,tempsort)
				user.updateOne({_id:tempid},obj,function(error){
					if(error){
						console.log('user sort update error',error)
						callback(error)
					}
					console.log('user sort update success')
					callback(null)
				})
			},function(error){
				if(error){
					cb(error)
				}
				cb()
			})
		},
		function(cb){
			console.log('------------------',req.body.mts_sortarr)
			async.eachLimit(req.body.mts_sortarr,1,function(item,callback){
				console.log('item',item,item.split(','))
				let temp = item.split(',')
				let tempid = temp[1],
					tempsort = parseInt(temp[2])
				let obj = {
					yanjiusuosort : tempsort
				}
				console.log(tempid,tempsort)
				user.updateOne({_id:tempid},obj,function(error){
					if(error){
						console.log('user sort update error',error)
						callback(error)
					}
					console.log('user sort update success')
					callback(null)
				})
			},function(error){
				if(error){
					cb(error)
				}
				cb()
			})
		},
		function(cb){
			console.log('------------------',req.body.wls_sortarr)
			async.eachLimit(req.body.wls_sortarr,1,function(item,callback){
				console.log('item',item,item.split(','))
				let temp = item.split(',')
				let tempid = temp[1],
					tempsort = parseInt(temp[2])
				let obj = {
					yanjiusuosort : tempsort
				}
				console.log(tempid,tempsort)
				user.updateOne({_id:tempid},obj,function(error){
					if(error){
						console.log('user sort update error',error)
						callback(error)
					}
					console.log('user sort update success')
					callback(null)
				})
			},function(error){
				if(error){
					cb(error)
				}
				cb()
			})
		},
		function(cb){
			console.log('------------------',req.body.sjs_sortarr)
			async.eachLimit(req.body.sjs_sortarr,1,function(item,callback){
				console.log('item',item,item.split(','))
				let temp = item.split(',')
				let tempid = temp[1],
					tempsort = parseInt(temp[2])
				let obj = {
					yanjiusuosort : tempsort
				}
				console.log(tempid,tempsort)
				user.updateOne({_id:tempid},obj,function(error){
					if(error){
						console.log('user sort update error',error)
						callback(error)
					}
					console.log('user sort update success')
					callback(null)
				})
			},function(error){
				if(error){
					cb(error)
				}
				cb()
			})
		},
		function(cb){
			console.log('------------------',req.body.vcc_sortarr)
			async.eachLimit(req.body.vcc_sortarr,1,function(item,callback){
				console.log('item',item,item.split(','))
				let temp = item.split(',')
				let tempid = temp[1],
					tempsort = parseInt(temp[2])
				let obj = {
					yanjiusuosort : tempsort
				}
				console.log(tempid,tempsort)
				user.updateOne({_id:tempid},obj,function(error){
					if(error){
						console.log('user sort update error',error)
						callback(error)
					}
					console.log('user sort update success')
					callback(null)
				})
			},function(error){
				if(error){
					cb(error)
				}
				cb()
			})
		},
		function(cb){
			console.log('------------------',req.body.zns_sortarr)
			async.eachLimit(req.body.zns_sortarr,1,function(item,callback){
				console.log('item',item,item.split(','))
				let temp = item.split(',')
				let tempid = temp[1],
					tempsort = parseInt(temp[2])
				let obj = {
					yanjiusuosort : tempsort
				}
				console.log(tempid,tempsort)
				user.updateOne({_id:tempid},obj,function(error){
					if(error){
						console.log('user sort update error',error)
						callback(error)
					}
					console.log('user sort update success')
					callback(null)
				})
			},function(error){
				if(error){
					cb(error)
				}
				cb()
			})
		},
		function(cb){
			console.log('------------------',req.body.wlw_sortarr)
			async.eachLimit(req.body.wlw_sortarr,1,function(item,callback){
				console.log('item',item,item.split(','))
				let temp = item.split(',')
				let tempid = temp[1],
					tempsort = parseInt(temp[2])
				let obj = {
					yanjiusuosort : tempsort
				}
				console.log(tempid,tempsort)
				user.updateOne({_id:tempid},obj,function(error){
					if(error){
						console.log('user sort update error',error)
						callback(error)
					}
					console.log('user sort update success')
					callback(null)
				})
			},function(error){
				if(error){
					cb(error)
				}
				cb()
			})
		},
		function(cb){
			console.log('------------------',req.body.jxx_sortarr)
			async.eachLimit(req.body.jxx_sortarr,1,function(item,callback){
				console.log('item',item,item.split(','))
				let temp = item.split(',')
				let tempid = temp[1],
					tempsort = parseInt(temp[2])
				let obj = {
					yanjiusuosort : tempsort
				}
				console.log(tempid,tempsort)
				user.updateOne({_id:tempid},obj,function(error){
					if(error){
						console.log('user sort update error',error)
						callback(error)
					}
					console.log('user sort update success')
					callback(null)
				})
			},function(error){
				if(error){
					cb(error)
				}
				cb()
			})
		},
		function(cb){
			console.log('------------------',req.body.rgs_sortarr)
			async.eachLimit(req.body.rgs_sortarr,1,function(item,callback){
				console.log('item',item,item.split(','))
				let temp = item.split(',')
				let tempid = temp[1],
					tempsort = parseInt(temp[2])
				let obj = {
					yanjiusuosort : tempsort
				}
				console.log(tempid,tempsort)
				user.updateOne({_id:tempid},obj,function(error){
					if(error){
						console.log('user sort update error',error)
						callback(error)
					}
					console.log('user sort update success')
					callback(null)
				})
			},function(error){
				if(error){
					cb(error)
				}
				cb()
			})
		}
	],function(error,result){
		if(error){
			return res.json({'code':-1,'msg':error})
		}
		return res.json({'code':0,'msg':'ok'})
	})
})
//20220129 工作量
router.get('/gzl',function(req,res){
	let add_sum = 0,confirm_sum = 0,final_sum = 0
	async.waterfall([
		function(cb){
			let search = gzl.find({'username':req.session.username,year:moment().format('YYYY')})
				search.exec(function(err,docs){
					if(err){
						console.log(err)
						return res.json(err)
					}
					docs.forEach(function(item){
						add_sum += item.addPoint
						//confirm_sum += item.chkPoint
					})
					cb()
					//final_sum = confirm_sum
				})
		},
		function(cb){
			let search = gzl.find({'username':req.session.username,year:moment().format('YYYY'),isConfirm:1})
				search.exec(function(err,docs){
					if(err){
						console.log(err)
						return res.json(err)
					}
					docs.forEach(function(item){
					//	add_sum += item.addPoint
						confirm_sum += item.chkPoint
					})
					
					final_sum = confirm_sum
					cb()
				})
		}
	],function(error,result){
		if(error){
			console.log(error)
				return res.json(error)
		}
		res.render('manage/personal/gzl',{add_sum:add_sum,confirm_sum:confirm_sum,final_sum:final_sum})
	})	
}).get('/gzl_data',function(req,res){
	console.log('router gzl_data',req.session)
	let page = req.query.page,
		limit = req.query.limit,
		year  = req.query.year
	console.log('year -------',year)
	if(!year){
		console.log('-------- 默认当前年份 ---------')
		year = moment().format('YYYY')
	}
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit,req.session.userName)
	async.waterfall([
		function(cb){
			//get count
			let _obj = {}
			if(req.session.power!='管理员'){
				_obj = {
					'username':{$regex:req.session.username,$options:'$i'}
				}
			}else{
				if(year){
					_obj = {
						'year':year
					}
				}
			}
			console.log('_obj',_obj)
			let search = gzl.find(_obj).count()
				search.exec(function(err,count){
					if(err){
						console.log('oh_data get total err',err)
						cb(err)
					}
					console.log('oh_data count',count)
					total = count
					cb(null)
				})
		},
		function(cb){
			let _obj = {}
			if(req.session.power!='管理员'){
				_obj = {
					'username':{$regex:req.session.username,$options:'$i'}
				}
			}else{
				if(year){
					_obj = {
						'year':year
					}
				}
			}
			console.log('_obj',_obj)
			let numSkip = (page-1)*limit
			limit = parseInt(limit)			
				let search = gzl.find(_obj)
					search.sort({'year':-1})
					search.sort({'username':1})
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('oh_data error',error)
							cb(error)
						}
						cb(null,docs)
					})	
		}
	],function(error,result){
		if(error){
			console.log('oh_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('oh_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).get('/gzladd',function(req,res){
	let id = req.query.id
	console.log('gzladd ID,',id)
	if(id&&typeof(id)!='undefined'){
		let yemiandata = {}
		if(req.session.power!='管理员'){
			console.log('------ 非管理员 --------')
			yemiandata.addName = req.session.username
			yemiandata.username = req.session.username
			yemiandata.power = ''
		}else{
			console.log('------ 管理员 --------')
			yemiandata.addName = '院办'
			yemiandata.username = ''
			yemiandata.power = '管理员'
		}
		yemiandata.year = moment().format('YYYY')
		let search = gzl.findOne({})
		search.where('id').equals(id)
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			if(doc){
				console.log('doc-----',doc)
				res.render('manage/personal/gzladd',{doc:doc,data:yemiandata})
			}
			if(!doc){
				res.render('manage/personal/gzladd',{doc:{},data:yemiandata})
			}
		})
	}else{
		let yemiandata = {}
		if(req.session.power!='管理员'){
			console.log('------ 非管理员 --------')
			yemiandata.addName = req.session.username
			yemiandata.username = req.session.username
			yemiandata.power = ''
		}else{
			console.log('------ 管理员 --------')
			yemiandata.addName = '院办'
			yemiandata.username = ''
			yemiandata.power = '管理员'
		}
		yemiandata.year = moment().format('YYYY')
		res.render('manage/personal/gzladd',{data:yemiandata,doc:{}})
	}
}).post('/gzladd',function(req,res){
	console.log('gzladd------------------>',)
	if(req.body.id==''||req.body.id==null){
		console.log('新增 gzladd')
		async.waterfall([
			function(cb){
				let search = gzl.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						if(doc){
							console.log('表中最大id',doc.id)
							cb(null,doc.id)
						}
						if(!doc){
							console.log('表中无记录')
							cb(0,null)
						}
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				let gzlAdd = new gzl({
					id:id,
					year:req.body.year,//加入权限后需要更新
					addName:req.body.addName,
					username:req.body.username,
					addPoint:req.body.addPoint,
					sortA:req.body.sortA,
					addContent:req.body.addContent
				})
				gzlAdd.save(function(error,doc){
					if(error){
						console.log('jxwdAdd save error',error)
						cb(error)
					}
					console.log('jxwdAdd save success')
					cb(null,doc)
				})
			}
		],function(error,result){
			if(error){
				console.log('jxwdAdd async error',error)
				return res.end(error)
			}
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}else{
		console.log('officehourAdd',req.body)
		//return false
		async.waterfall([
			function(cb){
				let obj = {
					year:req.body.year,//加入权限后需要更新
					addName:req.body.addName,
					username:req.body.username,
					addPoint:req.body.addPoint,
					sortA:req.body.sortA,
					addContent:req.body.addContent
				}
				gzl.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('jxwd update error',error)
						cb(error)
					}
					console.log('jxwd update success')
					cb(null)
				})
			},
		],function(error,result){
			if(error){
				console.log('jxwd async error',error)
				return res.end(error)
			}
			console.log('officehourAdd',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}
}).post('/gzlconfirm',function(req,res){
	console.log('gzlconfirm------------------>',req.body)
	gzl.updateOne({'id':req.body.id},{isConfirm:1,chkPoint:req.body.chkPoint,chkName:req.session.username},function(error){
		if(error){
			console.log('gzlconfirm  error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'gzlconfirm success'})
	})
}).post('/gzldel',function(req,res){
	console.log('gzldel',req.body.id)
	gzl.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('gzldel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del gzldel success'})
	})
})
//20220124 业务口排序
router.get('/ywksort',function(req,res){
	console.log('in executive')
	let data={},dw_ry=[],jw_ry=[],sy_ry=[],qt_ry=[],fdy_ry=[]
	async.waterfall([
		function(cb){
			let search = user.find({yewukouid:{$ne:null,$exists:true}})
				search.where('yewukouid').equals(1)
				search.sort({'yewukousort':1})
				search.sort({'userName_py':1})
				search.exec(function(err,docs){
					if(err){
						cb(err)
					}
					data.dw_ry = docs
					cb()
				})
		},
		function(cb){
			let search = user.find({yewukouid:{$ne:null,$exists:true}})
				search.where('yewukouid').equals(2)
				search.sort({'yewukousort':1})
				search.sort({'userName_py':1})
				search.exec(function(err,docs){
					if(err){
						cb(err)
					}
					data.jw_ry = docs
					cb()
				})
		},
		function(cb){
			let search = user.find({yewukouid:{$ne:null,$exists:true}})
				search.where('yewukouid').equals(3)
				search.sort({'yewukousort':1})
				search.sort({'userName_py':1})
				search.exec(function(err,docs){
					if(err){
						cb(err)
					}
					data.sy_ry = docs
					cb()
				})
		},
		function(cb){
			let search = user.find({yewukouid:{$ne:null,$exists:true}})
				search.where('yewukouid').equals(4)
				search.sort({'yewukousort':1})
				search.sort({'userName_py':1})
				search.exec(function(err,docs){
					if(err){
						cb(err)
					}
					data.qt_ry = docs
					cb()
				})
		},
		function(cb){
			let search = user.find({yewukouid:{$ne:null,$exists:true}})
				search.where('yewukouid').equals(5)
				search.sort({'yewukousort':1})
				search.sort({'userName_py':1})
				search.exec(function(err,docs){
					if(err){
						cb(err)
					}
					data.fdy_ry = docs
					cb()
				})
		}		
	],function(error,result){
		if(error){
			return res.json(error)
		}
		res.render('manage/jsdw/ywksort',{L:req.query['L'],data:data})
	})
}).post('/ywksort',function(req,res){
	console.log('排序信息',req.body)
	async.waterfall([
		function(cb){
			console.log('---------- 党务 ---------',req.body.dw_sortarr)
			async.eachLimit(req.body.dw_sortarr,1,function(item,callback){
				console.log('item',item,item.split(','))
				let temp = item.split(',')
				let tempid = temp[1],
					tempsort = parseInt(temp[2])
				let obj = {
					yewukousort : tempsort
				}
				console.log(tempid,tempsort)
				user.updateOne({_id:tempid},obj,function(error){
					if(error){
						console.log('user sort update error',error)
						callback(error)
					}
					console.log('user sort update success')
					callback(null)
				})
			},function(error){
				if(error){
					cb(error)
				}
				cb()
			})
		},
		function(cb){
			console.log('---------- 教务 ---------')
			async.eachLimit(req.body.jw_sortarr,1,function(item,callback){
				console.log('item',item,item.split(','))
				let temp = item.split(',')
				let tempid = temp[1],
					tempsort = parseInt(temp[2])
				let obj = {
					yewukousort : tempsort
				}
				console.log(tempid,tempsort)
				user.updateOne({_id:tempid},obj,function(error){
					if(error){
						console.log('user sort update error',error)
						callback(error)
					}
					console.log('user sort update success')
					callback(null)
				})
			},function(error){
				if(error){
					cb(error)
				}
				cb()
			})
		},
		function(cb){
			console.log('---------- 实验 ---------')
			async.eachLimit(req.body.sy_sortarr,1,function(item,callback){
				console.log('item',item,item.split(','))
				let temp = item.split(',')
				let tempid = temp[1],
					tempsort = parseInt(temp[2])
				let obj = {
					yewukousort : tempsort
				}
				console.log(tempid,tempsort)
				user.updateOne({_id:tempid},obj,function(error){
					if(error){
						console.log('user sort update error',error)
						callback(error)
					}
					console.log('user sort update success')
					callback(null)
				})
			},function(error){
				if(error){
					cb(error)
				}
				cb()
			})
		},
		function(cb){
			console.log('---------- 其他 ---------')
			async.eachLimit(req.body.qt_sortarr,1,function(item,callback){
				console.log('item',item,item.split(','))
				let temp = item.split(',')
				let tempid = temp[1],
					tempsort = parseInt(temp[2])
				let obj = {
					yewukousort : tempsort
				}
				console.log(tempid,tempsort)
				user.updateOne({_id:tempid},obj,function(error){
					if(error){
						console.log('user sort update error',error)
						callback(error)
					}
					console.log('user sort update success')
					callback(null)
				})
			},function(error){
				if(error){
					cb(error)
				}
				cb()
			})
		},
		function(cb){
			console.log('---------- 辅导员 ---------')
			async.eachLimit(req.body.fdy_sortarr,1,function(item,callback){
				console.log('item',item,item.split(','))
				let temp = item.split(',')
				let tempid = temp[1],
					tempsort = parseInt(temp[2])
				let obj = {
					yewukousort : tempsort
				}
				console.log(tempid,tempsort)
				user.updateOne({_id:tempid},obj,function(error){
					if(error){
						console.log('user sort update error',error)
						callback(error)
					}
					console.log('user sort update success')
					callback(null)
				})
			},function(error){
				if(error){
					cb(error)
				}
				cb()
			})
		}
	],function(error,result){
		if(error){
			return res.json({'code':-1,'msg':error})
		}
		return res.json({'code':0,'msg':'ok'})
	})
})
//20220124本科招生 中共用信息
router.get('/binfo',function(req,res){
	let search = bkzsinfo.findOne({})
		search.exec(function(error,doc){
			if(error){
				return res.json(err)
			}
			res.render('manage/zsjy/binfo',{L:req.query['L'],data:doc})
		})
}).post('/bkzsinfo',function(req,res){
	let _obj = {
		xuefei:req.body.xuefei,
		jxj:req.body.jxj,
		jiuye:req.body.jiuye,
		xyhj:req.body.xyhj,
		lxfs:req.body.lxfs,
		zsqk:req.body.zsqk
	}
	console.log('_obj',_obj)
	bkzsinfo.updateOne({'id':req.body.id},_obj,function(error){
		if(error){
			console.log(error)
			return res.json({'code':-1,'msg':error})
		}
		return res.json({'code':0,'msg':'ok'})
	})
}).get('/bsort',function(req,res){
	console.log('本科专业排序')
	let search = bkzs.find({})
		search.sort({'bsort':1})
		search.exec(function(error,docs){
			if(error){
				console.log('伙伴排序 error',error)
				return error
			}
			res.render('manage/zsjy/bsort',{'data':docs})
		})
}).post('/bsort',function(req,res){
	console.log('排序信息',req.body.sortarr)
	async.eachLimit(req.body.sortarr,1,function(item,callback){
		console.log('item',item,item.split(','))
		let temp = item.split(',')
		let tempid = temp[1],
			tempsort = parseInt(temp[2])
		let obj = {
			hbsort : tempsort
		}
		console.log(tempid,tempsort)
		bkzs.updateOne({_id:tempid},obj,function(error){
			if(error){
				console.log('ptgl sort update error',error)
				callback(error)
			}
			console.log('ptgl sort update success')
			callback(null)
		})
	},function(error){
		if(error){
			onsole.log('eachLimit update sort error',error)
			return res.json({'code':-1,'msg':error})
		}
		return res.json({'code':0})
	})
})
module.exports = router;
