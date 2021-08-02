var express = require('express');
var router = express.Router();

const db = require('../db/db.js');
const async = require('async')
console.log()

const meeting = require('../db/db_struct').meeting//用户排序
const cmsContent = require('../db/db_struct').cmsContent
//result.recordsets[[{}]]
//result.output{}
//result.rowsAffected[5]
//result.returnValue:number
/* GET home page. */
router.get('/', function(req, res, next) {
	//首页
	let data = {}
	async.waterfall([
		function(cb){
			db.select('cmsSlider',5,'isDisplay=1 and isDelete=0','','list asc',function(err,result){
				if(err){
					cb(err)
				}
				data.slider = result.recordsets[0]////array
				console.log('1111111111')
				cb()
			})
		},function(cb){
			//党建select top 6 * from cmsContent where trees='179-181-' and isDelete=0 and isDisplay=1 order by isTop desc, list desc,id desc
			db.select('cmsContent',3,'trees=\'267-\' and isDelete=0 and isDisplay=1','','isTop desc, list desc,id desc',function(err,result){
				if(err){
					console.log(err)
				}
				data.dangjian = result.recordsets[0]
				cb()
			})	
		},function(cb){
			//新闻select top 6 * from cmsContent where trees='179-181-' and isDelete=0 and isDisplay=1 order by isTop desc, list desc,id desc
			db.select('cmsContent',6,'trees=\'179-181-\' and isDelete=0 and isDisplay=1','','isTop desc, list desc,id desc',function(err,result){
				if(err){
					console.log(err)
				}
				data.news = result.recordsets[0]
				cb()
			})	
		},function(cb){
			//通知公告select top 6 * from cmsContent where trees='179-182-' and isDelete=0 and isDisplay=1 order by isTop desc, list desc,id desc
			db.select('cmsContent',6,'trees=\'179-182-\' and isDelete=0 and isDisplay=1','','isTop desc, list desc,id desc',function(err,result){
				if(err){
					console.log(err)
				}
				data.notice = result.recordsets[0]
				cb()
			})	
		},function(cb){
			//学生事务select top 6 * from cmsContent where trees='179-182-' and isDelete=0 and isDisplay=1 order by isTop desc, list desc,id desc
			db.select('cmsContent',6,'trees=\'179-262-\' and isDelete=0 and isDisplay=1','','isTop desc, list desc,id desc',function(err,result){
				if(err){
					console.log(err)
				}
				data.student = result.recordsets[0]
				cb()
			})
		}
	],function(error,result){
		if(error){
			console.log('waterfall error')
			return res.json(result)
		}
		console.log('check language---->',req.query['L'],typeof(req.query['L']))
		return res.render('index',{data:data,L:req.query['L']})
		//return res.json(data)
	})
});
router.get('/setLanguage',function(req,res){
	console.log('check req.query[L]',req.query.language,typeof(req.query.language))
	res.cookie("L", parseInt(req.query.language), { maxAge: 6 * 60 * 60 * 1000 });//中文
	req.query["L"] = req.query.language;
	res.json({
		success: 1
	});
})
function formatTime(date){
	return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()
}
router.get('/info',function(req,res){
	//“信息发布”进来，默认取学院通知内容
	let id = req.query.id,data,L=req.query.L
	// if(typeof(L)!='undefined'){
	// 	console.log('设置了---->',L,req.query.L)
	// }
	db.querySql('select * from cmsContent where id=\''+id+'\'','',function(err,result){
		if(err){
			res.json(err)
		}
		//res.json(result)
		data = result.recordsets[0][0]
		data.timeEdit = formatTime(data.timeEdit)
		console.log('timeEdit---->',data.timeEdit)
		console.log('check language---->',req.query['L'],typeof(req.query['L']))
		res.render('info',{'data':data,'L':req.query["L"]})
	})	
})
router.get('/infolist',function(req,res){
	
	let page = req.query.page,
		pagesize = req.query.pagesize
	if(!page||typeof(page)=='undefined'){
		page = 1
	}
	if(!pagesize||typeof(pagesize)=='undefined'){
		pagesize = 10
	}
	let total = 0,data
	console.log('page,pagesize',page,pagesize)
	let path = req.query.path,leftMenu,first
	console.log('path---->',path)
	if(path){
		first = path.split('-')[0]
		console.log('一级菜单--->',first)
	}
	if(!path||typeof(path)=='undefined'){
		path = '179-182-'
	}
	console.log('path---->',path)
	let isList
	async.waterfall([
		function(cb){
			//生成菜单
			db.querySql('select * from cmsClass where idClass=\''+first+'\'and isDisplay=1 order by list asc,id asc','',function(err,result){
				if(err){
					cb(err)
				}
				leftMenu = result.recordsets[0]
				console.log('leftMenu--->',leftMenu)
				cb()
			})
		},
		function(cb){
			//判断列表还是内容
			db.querySql('select * from cmsClass where trees=\''+path+'\'and isDisplay=1 ','',function(err,result){
				if(err){
					cb(err)
				}

				isList = result.recordsets[0]
				if(isList[0].listView=='内容'){
					console.log('内容页----------')
					isList = 1
				}else{
					isList = 0
				}
				console.log('isList--->',isList)
				//return res.json(isList)
				cb()
			})
		},
		function(cb){
			//取数量
			db.querySql('select count(*) as count from cmsContent where trees=\''+path+'\' and isDelete=0 and isDisplay=1','',function(err,result){
				if(err){
					res.json(err)
				}
				total = result.recordset[0].count
				cb()
			})
		},
		function(cb){
			//select top 10 * from (select ROW_NUMBER() over(order by isTop desc,list desc,timeAdd desc) as rownumber,* from cmsContent) temp_row where rownumber > 10
			let numSkip = (page-1)*pagesize
			pagesize = parseInt(pagesize)
			db.querySql('select top '+pagesize+' * from (select ROW_NUMBER() over(order by isTop desc,list desc,timeAdd desc) as rownumber,* from cmsContent where trees=\''+path+'\' and isDelete=0 and isDisplay=1) temp_row where rownumber >'+numSkip,'',function(err,result){
				if(err){
					res.json(err)
				}
				data = result.recordsets[0]
				cb()
			})
		}
	],function(error,result){
		if(error){
			console.log('waterfall error',error)
			return res.json(error)
		}
		console.log('infolist',req.query['L'])
		return res.render('info_list',{'count':total,'page':page,'data':data,'title':'新闻','path':path,'L':req.query['L'],'leftMenu':leftMenu,'isList':isList})
	})
})
router.get('/tempaddcms',function(req,res){
	return res.render('tempaddcms')
}).post('/tempaddcms',function(req,res){
	let search = cmsContent.findOne({})
		search.sort({'id':-1})//倒序，取最大值
		search.limit(1)
		search.exec(function(error,doc){
			if(error){
				console.log('cmsContent error',error)
				return res.json({'code':-1,'msg':error})
			}
			let id = 0
			if(doc){
				id = parseInt(doc.id) + 1
			}
			console.log('最大id',doc.id,req.body)
			let cmsContentadd = new cmsContent({
				id : id,
				title : req.body.title,
				titleEN : req.body.titleEN,
				timeAdd : req.body.timeAdd,
				tag1 : req.body.tag1,
				tag2 : req.body.tag2,
				pageContent : req.body.pageContent,
				pageContentEN : req.body.pageContentEN
			})
			cmsContentadd.save(function(err,doc){
				if(err){
					console.log('cmsContentadd save err',err)
					return res.json({'code':-1,'msg':err})
				}
				console.log('save success',doc)
				return res.json({'code':0,'msg':'cmsContentadd save success'})
			})
		})
})
module.exports = router;
