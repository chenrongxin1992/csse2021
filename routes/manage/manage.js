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
//第一栏 学院概况
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
})
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
})
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
})
module.exports = router;
