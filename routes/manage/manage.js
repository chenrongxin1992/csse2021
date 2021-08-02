var express = require('express');
var router = express.Router();

//20210730
const svgcaptcha = require('svg-captcha')
const crypto = require('crypto');

const user = require('../../db/db_struct').user//用户
const cmsContent = require('../../db/db_struct').cmsContent//用户

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
	console.log('in manage index router')
	res.render('manage/index')	
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
}).post('/keyj',function(req,res){
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
module.exports = router;
