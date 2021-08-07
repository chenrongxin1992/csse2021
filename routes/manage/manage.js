var express = require('express');
var router = express.Router();

//20210730
const svgcaptcha = require('svg-captcha')
const crypto = require('crypto');

const user = require('../../db/db_struct').user//用户
const cmsContent = require('../../db/db_struct').cmsContent//内容
const slider = require('../../db/db_struct').cmsSlider

const path = require('path')
const multiparty = require('multiparty')
const fs = require('fs')
const moment  = require('moment')
const attachmentuploaddir = path.resolve(__dirname, '../../public/attachment')//G:\spatial_lab\public\attachment
fs.existsSync(attachmentuploaddir) || fs.mkdirSync(attachmentuploaddir)
const async = require('async')

function cryptoPassFunc(password) {
  const md5 = crypto.createHash('md5');
  return md5.update(password).digest('hex');
}

/* GET users listing. */
router.get('/login', function(req, res, next) {
    console.log('login')
	res.type('html')
	res.render('manage/login')
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
				if(doc){
					//20210730 判断密码是否一致
					console.log('记录中的密码 & 提交密码--------',doc.password,cryptoPassFunc(req.body.password))
					if(doc.password != cryptoPassFunc(req.body.password)){
						console.log('密码错误')
						return res.json({'code':-1,msg:'密码错误'})
					}else{
						console.log('密码一致,设置session.....')
						req.session.account = doc.account//可能是字母，可能是校园卡号
						req.session.username = doc.userName
						req.session.avatar = doc.avatar
						req.session.power = doc.power
						return res.json({'code':0})
					}
					// let searchuserrole = user_role.findOne({})
					// 	searchuserrole.where('userid').equals(doc.id)
					// 	searchuserrole.sort({'id':1})
					// 	searchuserrole.limit(1)
					// 	searchuserrole.exec(function(ee,dd){
					// 		if(ee){
					// 			console.log('search user_role error',ee)
					// 			return res.json({'code':-1,msg:ee})
					// 		}else{
					// 			console.log('search user_role success',dd)
					// 			let searchrole = role.findOne({})
					// 			    searchrole.where('id').equals(dd.roleid)
					// 			    searchrole.exec(function(eee,ddd){
					// 			    	if(eee){
					// 			    		console.log('search role eee',eee)
					// 			    		return res.json({'code':-1,msg:eee})
					// 			    	}else{
					// 			    		console.log('search role success',ddd)
					// 			    		req.session.account = req.body.username
					// 			    		req.session.rolename = ddd.name
					// 			    		req.session.userid = dd.userid
					// 			    		req.session.username = doc.name
					// 			    		req.session.photo = doc.photo
					// 			    		return res.json({'code':0})
					// 			    	}
					// 			    })
					// 		}
					// 	})
				}
				if(!doc){
					console.log('用户不存在')
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
			res.render('manage/index',{user:doc})
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
		console.log('req.session--------',req.session)
		res.redirect('/manage/login')
	})
})
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
			res.render('manage/xygk/xrld',{data:doc})
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
			res.render('manage/jgsz/publictpl',{data:doc})
		})
}).get('/yjs',function(req,res){
	console.log('in yjs')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('研究所')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/jgsz/publictpl',{data:doc})
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
})
//招生就业
router.get('/bkszs',function(req,res){
	console.log('in bkszs')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('本科生招生')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/zsjy/publictpl',{data:doc})
		})
}).get('/ssszs',function(req,res){
	console.log('in ssszs')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('硕士生招生')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/zsjy/publictpl',{data:doc})
		})
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
})
//科学研究
router.get('/gxn',function(req,res){
	console.log('in gxn')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('高性能计算研究所')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/kxyj/publictpl',{data:doc})
		})
}).get('/dsj',function(req,res){
	console.log('in dsj')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('大数据技术与应用研究所')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/kxyj/publictpl',{data:doc})
		})
}).get('/wlmt',function(req,res){
	console.log('in wlmt')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('未来媒体技术与计算研究所')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/kxyj/publictpl',{data:doc})
		})
}).get('/wls',function(req,res){
	console.log('in wls')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('网络与信息安全研究所')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/kxyj/publictpl',{data:doc})
		})
}).get('/sjs',function(req,res){
	console.log('in sjs')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('计算机视觉研究所')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/kxyj/publictpl',{data:doc})
		})
}).get('/xtjc',function(req,res){
	console.log('in xtjc')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('智能技术与系统集成研究所')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/kxyj/publictpl',{data:doc})
		})
}).get('/wlw',function(req,res){
	console.log('in wlw')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('物联网研究中心')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/kxyj/publictpl',{data:doc})
		})
}).get('/vcc',function(req,res){
	console.log('in vcc')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('可视计算研究中心')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/kxyj/publictpl',{data:doc})
		})
}).post('/kxyj',function(req,res){
	console.log('keyj 更新')
	//console.log('req.bdoy',req.body)
	cmsContent.updateOne({'id':req.body.id},{'title':req.body.title,'titleEN':req.body.titleEN,'pageContent':req.body.pageContent,'pageContentEN':req.body.pageContentEN,'timeAdd':req.body.timeAdd,'timeEdit':req.body.timeEdit},function(error){
		if(error){
			console.log('keyj error',error)
			res.json({'code':-1,'msg':error})
		}
		console.log('keyj success')
		res.json({'code':0,'msg':'update success'})
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
			res.render('manage/gjhz/publictpl',{data:doc})
		})
}).get('/lhpy',function(req,res){
	console.log('in lhpy')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('联合培养')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/gjhz/publictpl',{data:doc})
		})
})
.get('/kyhz',function(req,res){
	console.log('in kyhz')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('科研合作')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/gjhz/publictpl',{data:doc})
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
}).get('/gzzd',function(req,res){
	console.log('in gzzd')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('规章制度')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/dqgz/publictpl',{data:doc})
		})
}).get('/tzgg',function(req,res){
	console.log('in tzgg')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('通知公告')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/dqgz/publictpl',{data:doc})
		})
}).get('/djhd',function(req,res){
	console.log('in djhd')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('党建活动')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/dqgz/publictpl',{data:doc})
		})
}).get('/xxyd',function(req,res){
	console.log('in xxyd')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('学“习”园地')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			console.log('doc',doc)
			res.render('manage/dqgz/publictpl',{data:doc})
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
})
//人才招聘
router.get('/jszp',function(req,res){
	console.log('in jszp')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('教师')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('manage/rczp/publictpl',{data:doc})
		})
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
})
//教师队伍
function checkType(str){
	let info = {}
	info.type = str
	if(str=='jcrc')
		info.typeName = '杰出人才'
	else if(str=='professor')
		info.typeName = '教授'
	else if(str=='yjy')
		info.typeName = '研究员'
	else if(str=='fjs')
		info.typeName = '副教授'
	else if(str=='fyjy')
		info.typeName = '副研究员'
	else if(str=='zljs')
		info.typeName = '助理教授'
	else if(str=='jiangshi')
		info.typeName = '讲师'
	else if(str=='boshihou')
		info.typeName = '博士后'
	else
		info.typeName = '其他'
	return info
}
router.get('/jsdw',function(req,res){
	let type = req.query.type
	console.log('type',type)
	let info = checkType(type)
	console.log('info',info)
	res.render('manage/jsdw/publictpl',{info:info})
}).get('/jsdw_data',function(req,res){
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
						_filter = {
							$and:[
								{$or:[
									{userName:{$regex:userName}},//忽略大小写
									{jstype:jstype},
									{power:power}
								]},
								{$or:[
									{userName:{$regex:userName}},//忽略大小写
									{zhicheng:jstype},
									{power:power}
								]}
							]
						}
					}
					if(!power && jstype){
						console.log('有姓名，jstype',userName,jstype)
						_filter = {
							$and:[
								{$or:[
									{userName:{$regex:userName}},//忽略大小写
									{jstype:jstype}
								]},
								{$or:[
									{userName:{$regex:userName}},//忽略大小写
									{zhicheng:jstype}
								]}
							]
						}
					}
					if(power && !jstype){
						console.log('有姓名，角色',userName,power)
						_filter = {
							$and:[
								{$or:[
									{userName:{$regex:userName}},//忽略大小写
									{power:power}
								]},
								{$or:[
									{userName:{$regex:userName}},//忽略大小写
									{power:power}
								]}
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
						search.sort({'userName':-1})//正序
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
						_filter = {
							$and:[
								{$or:[{power:power},{jstype:{$regex:jstype}}]},
								{$or:[{zhicheng:jstype},{jstype:{$regex:jstype}}]}
							]
						}
					}
					if(!power && jstype){
						_filter = {
							$or:[{zhicheng:jstype},{jstype:{$regex:jstype}}]
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
									search.sort({'userName':-1})//正序
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
					search.sort({'userName':-1})//正序
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
					password:cryptoPassFunc(req.body.password)
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
					power:req.body.power
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
	let id = req.query.id
	console.log('个人信息 ID,',id)
	let search = user.findOne({})
		search.where('id').equals(id)
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			return res.render('manage/jsdw/userinfo',{user:doc})
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
		//现在有csse,加上路径，后续去除
		returnimgurl = '/csse'+returnimgurl
    	return res.json({"errno":0,"data":returnimgurl,"returnfilename":returnfilename})
    })
}).post('/userinfo',function(req,res){
	console.log(req.body.jstype)
	console.log(req.body.jstype1)
	console.log('-----------------------')
	let updateobj = {
		userName:req.body.userName,
		userName1:req.body.userName,
		sex:req.body.sex,
		sex1:req.body.sex1,
		jstype:req.body.jstype,
		jstype1:req.body.jstype1,
		zhicheng:req.body.zhicheng,
		zhicheng1:req.body.zhicheng,
		phoneOffice:req.body.phoneOffice,
		email:req.body.email,
		AddressOffice:req.body.AddressOffice,
		AddressOffice1:req.body.AddressOffice1,
		xuewei:req.body.xuewei,
		xuewei1:req.body.xuewei1,
		xueli:req.body.xueli,
		xueli1:req.body.xueli1,
		intro:req.body.intro,
		intro1:req.body.intro1,
		avatar:req.body.avatar
	}
	console.log('obj',updateobj)
	//return false
	user.updateOne({'id':req.body.id},updateobj,function(err){
		if(err){
			console.log('update userinfo err')
			return res.json({'code':-1,'msg':err})
		}else{
			console.log('update success')
			return res.json({'code':0})
		}
	})
})
//首页发布
router.get('/slider',function(req,res){
	res.render('manage/syfb/slider')
}).get('/slider_data',function(req,res){
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
			let search = slider.find({}).count()
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
				let search = slider.find({})
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
		//现在有csse,加上路径，后续去除
		returnimgurl = '/csse'+returnimgurl
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
					title1:req.body.title1,
					jianjie:req.body.jianjie,
					jianjie1:req.body.jianjie,
					pic:req.body.pic,
					url:req.body.url
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
					title1:req.body.title1,
					jianjie:req.body.jianjie,
					jianjie1:req.body.jianjie1,
					pic:req.body.pic,
					url:req.body.url
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
}).get('/jrnews',function(req,res){
	res.render('manage/syfb/jrxw')
}).get('/news_data',function(req,res){
	console.log('router news_data')
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
			let search = cmsContent.find({'trees':'179-181-'}).count()
				search.exec(function(err,count){
					if(err){
						console.log('news get total err',err)
						cb(err)
					}
					console.log('news count',count)
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
						{trees:'179-181-'}
					]
				}
				console.log('_filter',_filter)
				let search = cmsContent.find(_filter)
					search.sort({'id':-1})
					search.sort({'timeAddStamp':-1})
					search.sort({'timeAdd':-1})
					search.sort({'isTop':-1})//正序
					search.sort({'isDisplay':1})
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('news_data error',error)
							cb(error)
						}
						//获取搜索参数的记录总数
						cmsContent.count(_filter,function(err,count_search){
							if(err){
								console.log('news_data count_search err',err)
								cb(err)
							}
							console.log('搜索到记录数',count_search)
							total = count_search
							cb(null,docs)
						})
					})
			}else{
				console.log('不带搜索参数')
				let search = cmsContent.find({'trees':'179-181-'})
					search.sort({'id':-1})
					search.sort({'isTop':-1})//正序
					search.sort({'timeAdd':-1})
					search.sort({'isDisplay':1})
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
		}
	],function(error,result){
		if(error){
			console.log('news async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('news async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
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
					tag2:'计软新闻'
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
			console.log('slideradd',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}
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
	res.render('manage/syfb/notice')
}).get('/notice_data',function(req,res){
	console.log('router notice_data')
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
			let search = cmsContent.find({'trees':'179-182-'}).count()
				search.exec(function(err,count){
					if(err){
						console.log('notice_data get total err',err)
						cb(err)
					}
					console.log('notice_data count',count)
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
						{trees:'179-182-'}
					]
				}
				console.log('_filter',_filter)
				let search = cmsContent.find(_filter)
					search.sort({'id':-1})
					search.sort({'timeAddStamp':-1})
					search.sort({'timeAdd':-1})
					search.sort({'isTop':-1})//正序
					search.sort({'isDisplay':1})
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('news_data error',error)
							cb(error)
						}
						//获取搜索参数的记录总数
						cmsContent.count(_filter,function(err,count_search){
							if(err){
								console.log('news_data count_search err',err)
								cb(err)
							}
							console.log('搜索到记录数',count_search)
							total = count_search
							cb(null,docs)
						})
					})
			}else{
				console.log('不带搜索参数')
				let search = cmsContent.find({'trees':'179-182-'})
					search.sort({'id':-1})
					search.sort({'isTop':-1})//正序
					search.sort({'timeAdd':-1})
					search.sort({'isDisplay':1})
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
		}
	],function(error,result){
		if(error){
			console.log('news async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('news async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
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
					tag2:'通知公告'
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
					timeEdit:req.body.timeEdit
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
	res.render('manage/syfb/jrfc')
}).get('/jrfc_data',function(req,res){
	console.log('router jrfc_data')
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
			let search = cmsContent.find({'tag2':'计软风采'}).count()
				search.exec(function(err,count){
					if(err){
						console.log('jrfc_data get total err',err)
						cb(err)
					}
					console.log('jrfc_data count',count)
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
						{'tag2':'计软风采'}
					]
				}
				console.log('_filter',_filter)
				let search = cmsContent.find(_filter)
					search.sort({'id':-1})
					search.sort({'timeAddStamp':-1})
					search.sort({'timeAdd':-1})
					search.sort({'isTop':-1})//正序
					search.sort({'isDisplay':1})
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('news_data error',error)
							cb(error)
						}
						//获取搜索参数的记录总数
						cmsContent.count(_filter,function(err,count_search){
							if(err){
								console.log('news_data count_search err',err)
								cb(err)
							}
							console.log('搜索到记录数',count_search)
							total = count_search
							cb(null,docs)
						})
					})
			}else{
				console.log('不带搜索参数')
				let search = cmsContent.find({'tag2':'计软风采'})
					search.sort({'id':-1})
					search.sort({'isTop':-1})//正序
					search.sort({'timeAdd':-1})
					search.sort({'isDisplay':1})
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('jrfc_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
			}
		}
	],function(error,result){
		if(error){
			console.log('jrfc_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('jrfc_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
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
    	//现在有csse,加上路径，后续去除
		returnimgurl = '/csse'+returnimgurl
    	return res.json({"errno":0,"data":returnimgurl,"returnfilename":returnfilename})
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
    	//现在有csse,加上路径，后续去除
		returnimgurl = '/csse'+returnimgurl
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
module.exports = router;
