var express = require('express');
var router = express.Router();

//const db = require('../db/db.js');
const async = require('async')
const moment = require('moment')
console.log()
const user = require('../db/db_struct').user//用户
const meeting = require('../db/db_struct').meeting//用户排序
const cmsContent = require('../db/db_struct').cmsContent
const slider = require('../db/db_struct').cmsSlider
const xrld = require('../db/db_struct').xrld
const highlight = require('../db/db_struct').highlight
const bkzs = require('../db/db_struct').bkzs
const bkzsinfo = require('../db/db_struct').bkzsinfo
const cglr = require('../db/db_struct').cglr
const officehour = require('../db/db_struct').officehour
const co_images = require('images')
const fs = require('fs')
const path = require('path')
const attachmentuploaddir = path.resolve(__dirname, '../public/attachment/ueditor_images')//G:\spatial_lab\public\attachment
//result.recordsets[[{}]]
//result.output{}
//result.rowsAffected[5]
//result.returnValue:number
/* GET home page. */
router.get('/pages/open/oh_data_list',function(req,res){
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
}).get('/pages/open/officehourlist',function(req,res){
	console.log('-------')
	res.render('pages/open/officehourlist')
})
function compress_images(arg){
	console.log('----------------- attachmentuploaddir ------------------',attachmentuploaddir)
	fs.readdir(arg, function(err, files){    
        if(err){
            console.log('---------------------error:\n' + err);
            return;
        }
		console.log('files--------------------------------',files)
	//	return false
 
        files.forEach(function(file){
            fs.stat(arg + '/' + file, function(err, stat){
                if(err){console.log(err); return;}
                if(stat.isDirectory()){                
                    // 如果是文件夹遍历
                    compress_images(arg + '\\' + file);
                }else{
                     //遍历图片
                    console.log('文件名:' + arg + '\\' + file);
                    let name = arg + '\\' + file;
                    let outName =  arg + '\\' +file
					console.log('outNmae-------------------',outName)
					//return 
					let check = new RegExp('pdf'),
						check1 = new RegExp('xls'),
						check2 = new RegExp('xlsx'),
						check3 = new RegExp('doc'),
						check4 = new RegExp('docx'),
						check5 = new RegExp('gif')
					if(!name.match(check)&&!name.match(check1)&&!name.match(check2)&&!name.match(check3)&&!name.match(check4)&&!name.match(check5)){
						console.log('--------------- 排除PDF -----------------')
						co_images(name) .save(outName, {            
												quality : 82                    //保存图片到文件,图片质量为50
											});
						let staSync = fs.statSync(name).size;// 压缩后的图片大小
						console.log('--------------------- 图片大小 -------------------',staSync)
						if((staSync+"").length > 6){// 存储后的图片超过1MB，再重新压缩（上传我限制图片大小10MB）
							console.log('--------------------- 太大，再次压缩 -------------------')
							co_images(name).save(outName, {
								quality : 80
							});
						}
					}
					
                }              
            });
        });
    });
}
router.get('/co_images',function(req,res){
	compress_images(attachmentuploaddir)
})
function checkMonth(arg){
	if(arg=='1'||arg=='01'){
		return 'Jan'
	}
	else if(arg=='2'||arg=='02'){
		return 'Feb'
	}
	else if(arg=='3'||arg=='03'){
		return 'Mar'
	}
	else if(arg=='4'||arg=='04'){
		return 'Apr'
	}
	else if(arg=='5'||arg=='05'){
		return 'May'
	}
	else if(arg=='6'||arg=='06'){
		return 'Jun'
	}
	else if(arg=='7'||arg=='07'){
		return 'Jul'
	}
	else if(arg=='8'||arg=='08'){
		return 'Aug'
	}
	else if(arg=='9'||arg=='09'){
		return 'Sep'
	}
	else if(arg=='10'){
		return 'Oct'
	}
	else if(arg=='11'){
		return 'Nov'
	}
	else{
		return 'Dec'
	}
}
function getRandomArrayElements(arr, count) {
    var shuffled = arr.slice(0), i = arr.length, min = i - count, temp, index;
    while (i-- > min) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(min);
}
router.get('/', function(req, res, next) {
	//首页
	let data = {}
	async.waterfall([
		function(cb){
			let search
			if(req.query['L']==1){
				console.log('-----------------cn slider--------------------')
				search = slider.find({isen:0})
			}else{
				search = slider.find({isen:1})
			}
				search.where({'isDisplay':1})
				search.sort({'sortbyhand':-1})
				search.limit(8)
			search.exec(function(err,docs){
				if(err){
					cb(err)
				}
				console.log('slider -------',docs.length)
				if(docs.length==0){
					docs[0].title = 'CSSE'
					docs[0].pic = '/csse/attachment/slider/1645815507_index5_05.png'
					docs[0].url = '#'
					docs[0].title1 = 'CSSE'
				}
				data.slider = docs
				cb()
			})
		},
		function(cb){
			let _filter = {
				$or:[
					{tag2:'计软新闻','isDisplay':1},
					{trees:'179-181-','isDisplay':1}					
				]
			}
			let search = cmsContent.find(_filter)
				search.sort({'timeAdd':-1})
				search.sort({'isTop':-1})//正序
				search.sort({'timeAddStamp':-1})
				search.limit(2)
				search.exec(function(err,docs){
					if(err){
						cb(err)
					}
					data.news1 = docs[0]
					data.news1.month = checkMonth(docs[0].timeAdd.slice(5,7))
					data.news1.day = docs[0].timeAdd.slice(8,11)
					data.news2 = docs[1]
					data.news2.month = checkMonth(docs[1].timeAdd.slice(5,7))
					data.news2.day = docs[1].timeAdd.slice(8,11)
					cb()
				})
		},
		function(cb){
			let _filter = {
				leixing1:'学术讲座',
				isDisplay:1,
				$or:[
					{tag2:'通知公告'},
					{trees:'179-182-'}
				]
			}
			let search = cmsContent.find(_filter)
				search.sort({'timeAdd':-1})
				search.sort({'isTop':-1})//正序
				search.sort({'timeAddStamp':-1})
				search.limit(3)
				search.exec(function(err,docs){
					if(err){
						cb(err)
					}
					docs.forEach(function(item){
						item.month = checkMonth(item.timeAdd.slice(5,7))
						console.log('item.month-----',item.month)
						console.log('item.title--------------->',item.title)
					})
					data.notice = docs
					cb()
				})
		},
		function(cb){
			let searchobj = {review:'1',showinslider:1},findwhatobj = {title:1,kanwu:1,year:1,id:1,fujianPath:1,belongsto:1,zuozhe:1}
			let search = cglr.find(searchobj,findwhatobj)
			//let search = cglr.find({"review" : "1"},{title:1,kanwu:1,year:1,id:1,fujianPath:1,belongsto:1})
				search.sort({'year':-1})
				search.sort({'isTop':-1})
				search.sort({'plusN':-1})
				search.sort({'sortbyhand':-1})
				search.sort({'timeAdd':-1})
				search.limit(8)
				search.exec(function(err,docs){
					if(err){
						cb(err)
					}
					if(docs.length==0){
						console.log('----------- 没有设置显示slider--------------')
						let search1 = cglr.find({"review" : "1"},findwhatobj)
							search1.sort({'year':-1})
							search1.sort({'isTop':-1})
							search1.sort({'plusN':-1})
							search1.sort({'sortbyhand':-1})
							search1.sort({'timeAdd':-1})
							search1.limit(8)
							search1.exec(function(error,docs1){
								if(error){
									cb(error)
								}
								data.kycg = docs1
								data.kycg1 = docs1[0]//第一次用
								data.kycgstr = encodeURIComponent(JSON.stringify(data.kycg))//js中用
								cb()
							})
					}else{
						data.kycg = docs
						//data.kycg = getRandomArrayElements(docs,5)//循环用
						data.kycg.forEach(function(item){
							console.log('item-----year-----',item.year)
						})
						data.kycg1 = docs[0]//第一次用
						data.kycgstr = encodeURIComponent(JSON.stringify(data.kycg))//js中用
						cb()
					}
					
				})
			//let search_year = moment()
			// let search = cglr.aggregate([{$match:{review:'1'}},{$sample:{size:5}}])
			// 	search.exec(function(err,docs){
			// 		if(err){
			// 			cb(err)
			// 		}
			// 		data.kycg = docs//循环用
			// 		//console.log('cglr',docs)
			// 		if(docs.length>0)
			// 		    data.kycg1 = docs[0]//第一次用
			// 		else
			// 		    data.kycg1 = []
			// 		data.kycgstr = encodeURIComponent(JSON.stringify(docs))//js中用
			// 		cb()
			// 	})
		},
		function(cb){
			let search = cmsContent.find({'tag2':'合作伙伴'})
				search.sort({'hbsort':1})
				search.exec(function(err,docs){
					if(err){
						cb(err)
					}
					data.hzhb = docs
					//console.log('docs',docs)
					cb()
				})
		},
		function(cb){
			let search = highlight.findOne({})
				search.exec(function(err,doc){
					if(err){
						cb(err)
					}
					data.highlights = doc
					//console.log('docs',docs)
					cb()
				})
		},
		function(cb){
			let search = cmsContent.findOne({})
				search.where('title').equals('院长寄语')
				search.exec(function(err,doc){
					if(err){
						return res.send(err)
					}
					//console.log(doc)	
					data.yzjy = doc
					cb()
				})
		},
		function(cb){
			let search = cmsContent.findOne({id:724})//获取position的微信链接
				search.exec(function(err,doc){
					if(err){
						return res.send(err)
					}
					console.log('------------------------',doc.gzhlink)
					data.position_gzhlink = doc.gzhlink
					cb()
				})
		}
	],function(error,result){
		if(error){
			res.json(error)
		}
		if(req.query['L']==1){
			return res.render('index',{L:req.query['L'],data:data})
		}else{
			return res.render('indexen',{L:req.query['L'],data:data})
		}
		
	})
	// async.waterfall([
	// 	function(cb){
	// 		db.select('cmsSlider',5,'isDisplay=1 and isDelete=0','','list asc',function(err,result){
	// 			if(err){
	// 				cb(err)
	// 			}
	// 			data.slider = result.recordsets[0]////array
	// 			console.log('1111111111')
	// 			cb()
	// 		})
	// 	},function(cb){
	// 		//党建select top 6 * from cmsContent where trees='179-181-' and isDelete=0 and isDisplay=1 order by isTop desc, list desc,id desc
	// 		db.select('cmsContent',3,'trees=\'267-\' and isDelete=0 and isDisplay=1','','isTop desc, list desc,id desc',function(err,result){
	// 			if(err){
	// 				console.log(err)
	// 			}
	// 			data.dangjian = result.recordsets[0]
	// 			cb()
	// 		})	
	// 	},function(cb){
	// 		//新闻select top 6 * from cmsContent where trees='179-181-' and isDelete=0 and isDisplay=1 order by isTop desc, list desc,id desc
	// 		db.select('cmsContent',6,'trees=\'179-181-\' and isDelete=0 and isDisplay=1','','isTop desc, list desc,id desc',function(err,result){
	// 			if(err){
	// 				console.log(err)
	// 			}
	// 			data.news = result.recordsets[0]
	// 			cb()
	// 		})	
	// 	},function(cb){
	// 		//通知公告select top 6 * from cmsContent where trees='179-182-' and isDelete=0 and isDisplay=1 order by isTop desc, list desc,id desc
	// 		db.select('cmsContent',6,'trees=\'179-182-\' and isDelete=0 and isDisplay=1','','isTop desc, list desc,id desc',function(err,result){
	// 			if(err){
	// 				console.log(err)
	// 			}
	// 			data.notice = result.recordsets[0]
	// 			cb()
	// 		})	
	// 	},function(cb){
	// 		//学生事务select top 6 * from cmsContent where trees='179-182-' and isDelete=0 and isDisplay=1 order by isTop desc, list desc,id desc
	// 		db.select('cmsContent',6,'trees=\'179-262-\' and isDelete=0 and isDisplay=1','','isTop desc, list desc,id desc',function(err,result){
	// 			if(err){
	// 				console.log(err)
	// 			}
	// 			data.student = result.recordsets[0]
	// 			cb()
	// 		})
	// 	}
	// ],function(error,result){
	// 	if(error){
	// 		console.log('waterfall error')
	// 		return res.json(result)
	// 	}
	// 	console.log('check language---->',req.query['L'],typeof(req.query['L']))
		
	// 	//return res.json(data)
	// })
});
//学院概况
router.get('/pages/university/index',function(req,res){
	let data = {}
	async.waterfall([
		function(cb){
			let search = cmsContent.findOne({'id':2844})
				search.exec(function(err,doc){
					if(err){
						cb(err)
					}	
					data.xyjj = doc
					cb()
				})
		},
		function(cb){
			let search = highlight.findOne({})
				search.exec(function(err,doc){
					if(err){
						cb(err)
					}
					data.highlights = doc
					cb()
				})
		}
	],function(error,result){
		if(error){
			return res.json(error.message)
		}
		if(req.query['L']=='1'){
			res.render('pages/university/index',{L:req.query['L'],data:data,check_nav:'active_university'})
		}else{
			res.render('pages/university/indexen',{L:req.query['L'],data:data,check_nav:'active_university'})
		}	
	})
}).get('/pages/university/message',function(req,res){
	console.log('dddd')
	let data = {}
	async.waterfall([
		function(cb){
			let search = cmsContent.findOne({})
				search.where('title').equals('院长寄语')
				search.exec(function(err,doc){
					if(err){
						return res.send(err)
					}
					console.log(doc)	
					data.yzjy = doc
					cb()
				})
		}
	],function(error,result){
		if(error){
			return res.json(error.message)
		}
		if(req.query['L']=='1'){
			res.render('pages/university/message',{L:req.query['L'],data:data,check_nav:'active_university'})
		}
		else{
			res.render('pages/university/messageen',{L:req.query['L'],data:data,check_nav:'active_university'})
		}
		
	})
}).get('/pages/university/develop',function(req,res){
	res.render('pages/university/develop',{L:req.query['L'],check_nav:'active_university'})
}).get('/pages/university/leader',function(req,res){
	let data = {}
	async.waterfall([
		function(cb){
			let search = xrld.find({})
				search.sort({'paixu':1})
				search.exec(function(error,docs){
					if(error){
						cb(error)
					}
					data.xrld = docs
					cb()
				})
		}
	],function(error,result){
		if(error){
			return res.json(error.message)
		}
		console.log('data',data)
		if(req.query['L']=='1'){
			res.render('pages/university/leader',{L:req.query['L'],data:data,check_nav:'active_university'})
		}
		else{
			res.render('pages/university/leaderen',{L:req.query['L'],data:data,check_nav:'active_university'})
		}
	})
}).get('/pages/university/logo',function(req,res){
	res.render('pages/university/logo',{L:req.query['L'],check_nav:'active_university'})
})
function mysort(attr,rev){
	//第二个参数没有传递 默认升序排列
	if(rev ==  undefined){
		rev = 1;
	}else{
		rev = (rev) ? 1 : -1;
	}
	return function(a,b){
		a = a[attr];
		b = b[attr];
		if(a < b){
			return rev * -1;
		}
		if(a > b){
			return rev * 1;
		}
		return 0;
	}
}
//research 页面老何要分开检索条件20220113,20220117完成
router.get('/pages/research/index',function(req,res){
	let page = req.query.p,
		limit = req.query.limit,
		search_txt = req.query.s,
		year = req.query.y,
		belongstoid = req.query.b
	if(!page){page = 1}
	if(!limit){limit = 8 }//8
	let total = 0,data = {},totalpage = 0
	console.log('page limit',page,limit,search_txt,year,belongstoid,typeof(year))
	let obj = {},aggregate_obj = {}
	let myarr = [1,2,3,4,5,6,7,8,9,10,11]//目前11个所/系
	if(search_txt){
		console.log('-------------- 有搜索条件 --------------')
		if(year){
			console.log('------------------------ 还有年份 -----------------------------')
			if(year=='Before'){
				year = parseInt(moment().format('YYYY')-7)
				obj = {year:{$lte:year},title:{$regex:search_txt,$options:"$i"}}
			}else{
				year = parseInt(year)
				obj = {year:year,title:{$regex:search_txt,$options:"$i"}}
			}
			aggregate_obj = {title:{$regex:search_txt,$options:"$i"},review:'1'}
		}
		if(belongstoid){
			console.log('------------------------ 只有所 ----------------------------')
			obj = {belongstoid:belongstoid,title:{$regex:search_txt,$options:"$i"}}
			aggregate_obj = {title:{$regex:search_txt,$options:"$i"},review:'1'}
		}
		if(!year && !belongstoid){
			console.log('----------------------- 没有限制年 所 -------------------------')
			obj = {title:{$regex:search_txt,$options:"$i"}}
			aggregate_obj = {title:{$regex:search_txt,$options:"$i"},review:'1'}
		}
		obj['review'] = 1
		console.log('check obj aggregate_obj ----------------->',obj,aggregate_obj)
		async.waterfall([
			function(cb){
				//get count
				let search = cglr.find(obj).count()
					search.exec(function(err,count){
						if(err){
							console.log('research get total err',err)
							cb(err)
						}
						console.log('research count',count)
						total = count
						cb(null)
					})
			},
			function(cb){
				let numSkip = (page-1)*limit
					limit = parseInt(limit)
					console.log('obj-----------------',obj)
					async.waterfall([
						function(cbb){
							console.log('year -------')
							let search = cglr.aggregate([
								{$match:aggregate_obj},
								{$sort:{year:1}},
								{$group:{'_id':'$year',num:{$sum:1}}}
								
							])
							search.exec(function(err,docs){
								if(err){
									cbb(err)
								}
								let tempcount = 0
								docs.forEach(function(item,index){
									if(item._id<parseInt(moment().format('YYYY')-6)){
										tempcount += item.num
									}
								})
								data.yearNum = docs
								data.beforeyear = parseInt(moment().format('YYYY')-6) //近5年
								data.beforeyearNum = tempcount
								console.log('check data.yearNum -----------------',data.yearNum)
								cbb()
							})
						},
						function(cbb){
							console.log('belongsto -------')
							//统计所系人数
							let temp = {},temparr=[]
							async.eachLimit(myarr,1,function(item,callback){
								console.log('item-------',item)
								let search = cglr.find({belongstoid:item,title:{$regex:search_txt,$options:"$i"}}).count()
									search.exec(function(err,count){
										if(err){
											callback(err)
										}
										temp.num = count
										temp.sx = checksuotype(item)
										temp._id = item
										temparr.push(temp)
										temp={}
										callback()
									})
							},function(error){
								if(error){
									cbb(error)
								}
								console.log('check belongstoNum ------------',temparr)
								data.belongstoNum = temparr
								temparr=[]
								cbb()
							})
						},
						function(cbb){
							console.log('aaa')
							let search = cglr.find(obj)
								search.sort({'year':-1})
								search.sort({'isTop':-1})
								search.sort({'plusN':-1})
								search.sort({'sortbyhand':-1})
								search.sort({'timeAdd':-1})
								search.limit(limit)
								search.skip(numSkip)
								search.exec(function(error,docs){
									if(error){
										console.log('error',error)
										cb(error)
									}		
									data.kycg = docs
									cbb(null)
								})
						},
						function(cbb){
							let search = cmsContent.findOne({'tag2':'成果概况'})
								search.exec(function(err,doc){
									if(err){
										cb(err)
									}
									data.cggk = doc
									cbb()
								})
						}
					],function(error,result){
						if(error){
							return cb(error)
						}
						console.log('总页数------->',total,limit)
						totalpage = Math.ceil(total/limit)
						console.log('总页数------->',totalpage)
						cb()
					})
			}
		],function(error,result){
			if(error){
				console.log('cglr_data async waterfall error',error)
				return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
			}
			console.log('check year ------',year)
			if(year==parseInt(moment().format('YYYY')-7) ){
				year = 'Before'
			}
			console.log('check year ------',year)
			if(req.query['L']=='1'){
				res.render('pages/research/indextest',{check_nav:'active_research',L:req.query['L'],data:data,count:total,page:page,totalpage:totalpage,year:year,belongsto:belongstoid,search_txt:search_txt})
			}else{
				res.render('pages/research/indextesten',{check_nav:'active_research',L:req.query['L'],data:data,count:total,page:page,totalpage:totalpage,year:year,belongsto:belongstoid,search_txt:search_txt})
			}	
		})
	}else{
		if(year){
			console.log('------------------------ 只有年份 -----------------------------')
			if(year=='Before'){
				year = parseInt(moment().format('YYYY')-7)
				obj = {year:{$lte:year}}
				aggregate_obj = {}
				//aggregate_obj = {year:{$lte:year}}
			}else{
				year = parseInt(year)
				obj = {year:year}
				aggregate_obj = {}
			}
		}
		if(belongstoid){
			console.log('------------------------ 只有所 ----------------------------')
			obj = {belongstoid:belongstoid}
			aggregate_obj = {}
			//aggregate_obj = {belongstoid:parseInt(belongstoid)}
		}
		if(!year && !belongstoid){
			console.log('----------------------- 没有限制条件 -------------------------')
			obj = {}
			aggregate_obj = {}
		}
		obj['review'] = '1'
		console.log('check obj,aggregate_obj---------------------------->',obj,aggregate_obj)
		async.waterfall([
			function(cb){
				//get count
				let search = cglr.find(obj).count()
					search.exec(function(err,count){
						if(err){
							console.log('research get total err',err)
							cb(err)
						}
						console.log('research count---------------->',count)
						total = count
						cb(null)
					})
			},
			function(cb){
				let numSkip = (page-1)*limit
					limit = parseInt(limit)
					console.log('obj-----------------',obj,aggregate_obj)
					async.waterfall([
						function(cbb){
							//统计年份数据
							console.log('----------------- 统计年份数据 ------------------')
							let search = cglr.aggregate([
								{$match:{review:'1'}},
								{$sort:{year:1}},
								{$group:{'_id':'$year',num:{$sum:1}}}	
							])
							
							search.exec(function(err,docs){
								if(err){
									cbb(err)
								}
								let tempcount = 0
								docs = docs.sort(mysort('_id',false))
								docs.forEach(function(item,index){
									if(item._id<parseInt(moment().format('YYYY')-6)){//2021 2017即小于2017为before
										tempcount += item.num
									}
								})
								data.yearNum = docs
								data.beforeyear = parseInt(moment().format('YYYY')-6) //近5年
								data.beforeyearNum = tempcount
								console.log('check data.yearNum,data.beforeyear------->',data.yearNum,data.beforeyear)
								cbb()
							})
						},
						function(cbb){
							console.log('---------------------- 统计所系数据 --------------------')
							let temp = {},temparr=[]
							async.eachLimit(myarr,1,function(item,callback){
								console.log('item-------',item)
								let search = cglr.find({belongstoid:item,review:1}).count()
									search.exec(function(err,count){
										if(err){
											callback(err)
										}
										temp.num = count
										temp.sx = checksuotype(item)
										temp._id = item
										temparr.push(temp)
										temp={}
										callback()
									})
							},function(error){
								if(error){
									cbb(error)
								}
								console.log('chenck belongstoNum   ---------- >',temparr)
								data.belongstoNum = temparr
								temparr=[]
								cbb()
							})
						},
						function(cbb){
							console.log('aaa')
							//obj.isTop = 1
							console.log('obj----',obj)
							let search = cglr.find(obj)
								search.sort({'year':-1})
								search.sort({'isTop':-1})
								search.sort({'plusN':-1})
								search.sort({'sortbyhand':-1})
								search.sort({'timeAdd':-1})
								search.sort({'timeEdit':-1})
								search.limit(limit)
								search.skip(numSkip)
								search.exec(function(error,docs){
									if(error){
										console.log('error',error)
										cb(error)
									}		
									data.kycg = docs
									cbb(null)
								})
						},
						function(cbb){
							let search = cmsContent.findOne({'tag2':'成果概况'})
								search.exec(function(err,doc){
									if(err){
										cb(err)
									}
									data.cggk = doc
									cbb()
								})
						}
					],function(error,result){
						if(error){
							return cb(error)
						}
						console.log('总页数------->',total,limit)
						totalpage = Math.ceil(total/limit)
						console.log('总页数------->',totalpage)
						cb()
					})
			}
		],function(error,result){
			if(error){
				console.log('cglr_data async waterfall error',error)
				return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
			}
			console.log('check year ------',year)
			if(year==parseInt(moment().format('YYYY')-7) ){
				year = 'Before'
			}
			console.log('check year ------',year)
			if(req.query['L']=='1'){
				res.render('pages/research/indextest',{check_nav:'active_research',L:req.query['L'],data:data,count:total,page:page,totalpage:totalpage,year:year,belongsto:belongstoid,search_txt:search_txt})
			}else{
				res.render('pages/research/indextesten',{check_nav:'active_research',L:req.query['L'],data:data,count:total,page:page,totalpage:totalpage,year:year,belongsto:belongstoid,search_txt:search_txt})
			}
			
		})
	}
})
router.get('/pages/research/index1',function(req,res){
	let page = req.query.p,
		limit = req.query.limit,
		search_txt = req.query.s,
		year = req.query.y,
		belongsto = req.query.b
	if(!page){page = 1}
	if(!limit){limit = 1 }//8
	let total = 0,data = {},totalpage = 0
	console.log('page limit',page,limit,search_txt,year,belongsto,typeof(year))
	let obj = {},aggregate_obj = {}
	if(search_txt){
		console.log('search--------------')
		if(year && belongsto){
			console.log('年 所')
			if(year=='Before'){
				year = parseInt(moment().format('YYYY')-5)
				obj = {year:{$lte:year},belongsto:belongsto,tag2:'成果录入',title:{$regex:search_txt}}
			}else{
				year = parseInt(year)
				obj = {year:year,belongsto:belongsto,tag2:'成果录入',title:{$regex:search_txt}}
			}
			aggregate_obj = {tag2:'成果录入',title:{$regex:search_txt}}
		}
		if(year && !belongsto){
			console.log('年 ')
			if(year=='Before'){
				year = parseInt(moment().format('YYYY')-5)
				obj = {year:{$lte:year},tag2:'成果录入',title:{$regex:search_txt}}
			}else{
				year = parseInt(year)
				obj = {year:year,tag2:'成果录入',title:{$regex:search_txt}}
			}
			aggregate_obj = {tag2:'成果录入',title:{$regex:search_txt}}
		}
		if(!year && belongsto){
			console.log('所 ')
			obj = {belongsto:belongsto,tag2:'成果录入',title:{$regex:search_txt}}
			aggregate_obj = {tag2:'成果录入',title:{$regex:search_txt}}
		}
		if(!year && !belongsto){
			console.log('nothing')
			obj = {tag2:'成果录入',title:{$regex:search_txt}}
			aggregate_obj = {tag2:'成果录入',title:{$regex:search_txt}}
		}
		async.waterfall([
			function(cb){
				//get count
				let search = cmsContent.find(obj).count()
					search.exec(function(err,count){
						if(err){
							console.log('research get total err',err)
							cb(err)
						}
						console.log('research count',count)
						total = count
						cb(null)
					})
			},
			function(cb){
				let numSkip = (page-1)*limit
					limit = parseInt(limit)
					console.log('obj-----------------',obj)
					async.waterfall([
						function(cbb){
							console.log('year -------')
							let search = cmsContent.aggregate([
								{$match:aggregate_obj},
								{$group:{'_id':'$year',num:{$sum:1}}},
								{$sort:{year:-1}}
							])
							search.exec(function(err,docs){
								if(err){
									cbb(err)
								}
								let tempcount = 0
								docs.forEach(function(item,index){
									if(item._id<=parseInt(moment().format('YYYY')-5)){
										tempcount += item.num
									}
								})
								data.yearNum = docs
								data.beforeyear = parseInt(moment().format('YYYY')-5) //近5年
								data.beforeyearNum = tempcount
								console.log('check -------',data.yearNum)
								cbb()
							})
						},
						function(cbb){
							console.log('belongsto -------')
							let search = cmsContent.aggregate([
								{$match:aggregate_obj},
								{$group:{'_id':'$belongsto',num:{$sum:1}}},
								{$sort:{belongsto:-1}}
							])
							search.exec(function(err,docs){
								if(err){
									cbb(err)
								}
								console.log('check -------',docs)
								data.belongstoNum = docs
								cbb()
							})
						},
						function(cbb){
							console.log('aaa')
							let search = cmsContent.find(obj)
								search.where('isDelete').equals(0)
								search.sort({'year':-1})
								search.sort({'isTop':-1})//正序
								search.sort({'timeAdd':-1})
								search.sort({'isDisplay':1})
								search.limit(limit)
								search.skip(numSkip)
								search.exec(function(error,docs){
									if(error){
										console.log('error',error)
										cb(error)
									}		
									data.kycg = docs
									cbb(null)
								})
						},
						function(cbb){
							let search = cmsContent.findOne({'tag2':'成果概况'})
								search.exec(function(err,doc){
									if(err){
										cb(err)
									}
									data.cggk = doc
									cbb()
								})
						}
					],function(error,result){
						if(error){
							return cb(error)
						}
						console.log('总页数------->',total,limit)
						totalpage = Math.ceil(total/limit)
						console.log('总页数------->',totalpage)
						cb()
					})
			}
		],function(error,result){
			if(error){
				console.log('cglr_data async waterfall error',error)
				return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
			}
			console.log('check year ------',year)
			if(year==parseInt(moment().format('YYYY')-5) ){
				year = 'Before'
			}
			console.log('check year ------',year)
			res.render('pages/research/index',{L:req.query['L'],data:data,count:total,page:page,totalpage:totalpage,year:year,belongsto:belongsto,search_txt:search_txt})
		})
	}else{
		if(year && belongsto){
			console.log('年 所')
			if(year=='Before'){
				year = parseInt(moment().format('YYYY')-5)
				obj = {year:{$lte:year},belongsto:belongsto,tag2:'成果录入'}
			}else{
				year = parseInt(year)
				obj = {year:year,belongsto:belongsto,tag2:'成果录入'}
			}
			aggregate_obj = {tag2:'成果录入'}
		}
		if(year && !belongsto){
			console.log('年 ')
			if(year=='Before'){
				year = parseInt(moment().format('YYYY')-5)
				obj = {year:{$lte:year},tag2:'成果录入'}
			}else{
				year = parseInt(year)
				obj = {year:year,tag2:'成果录入'}
			}
			aggregate_obj = {tag2:'成果录入'}
		}
		if(!year && belongsto){
			console.log('所 ')
			obj = {belongsto:belongsto,tag2:'成果录入'}
			aggregate_obj = {tag2:'成果录入'}
		}
		if(!year && !belongsto){
			console.log('nothing')
			obj = {tag2:'成果录入'}
			aggregate_obj = {tag2:'成果录入'}
		}
		async.waterfall([
			function(cb){
				//get count
				let search = cmsContent.find(obj).count()
					search.exec(function(err,count){
						if(err){
							console.log('research get total err',err)
							cb(err)
						}
						console.log('research count',count)
						total = count
						cb(null)
					})
			},
			function(cb){
				let numSkip = (page-1)*limit
					limit = parseInt(limit)
					console.log('obj-----------------',obj)
					async.waterfall([
						function(cbb){
							console.log('year -------')
							let search = cmsContent.aggregate([
								{$match:aggregate_obj},
								{$group:{'_id':'$year',num:{$sum:1}}},
								{$sort:{year:-1}}
							])
							search.exec(function(err,docs){
								if(err){
									cbb(err)
								}
								let tempcount = 0
								docs.forEach(function(item,index){
									if(item._id<=parseInt(moment().format('YYYY')-5)){
										tempcount += item.num
									}
								})
								data.yearNum = docs
								data.beforeyear = parseInt(moment().format('YYYY')-5) //近5年
								data.beforeyearNum = tempcount
								console.log('check -------',data.yearNum)
								cbb()
							})
						},
						function(cbb){
							console.log('belongsto -------')
							let search = cmsContent.aggregate([
								{$match:aggregate_obj},
								{$group:{'_id':'$belongsto',num:{$sum:1}}},
								{$sort:{belongsto:-1}}
							])
							search.exec(function(err,docs){
								if(err){
									cbb(err)
								}
								console.log('check -------',docs)
								data.belongstoNum = docs
								cbb()
							})
						},
						function(cbb){
							console.log('aaa')
							let search = cmsContent.find(obj)
								search.where('isDelete').equals(0)
								search.sort({'year':-1})
								search.sort({'isTop':-1})//正序
								search.sort({'timeAdd':-1})
								search.sort({'isDisplay':1})
								search.limit(limit)
								search.skip(numSkip)
								search.exec(function(error,docs){
									if(error){
										console.log('error',error)
										cb(error)
									}		
									data.kycg = docs
									cbb(null)
								})
						},
						function(cbb){
							let search = cmsContent.findOne({'tag2':'成果概况'})
								search.exec(function(err,doc){
									if(err){
										cb(err)
									}
									data.cggk = doc
									cbb()
								})
						}
					],function(error,result){
						if(error){
							return cb(error)
						}
						console.log('总页数------->',total,limit)
						totalpage = Math.ceil(total/limit)
						console.log('总页数------->',totalpage)
						cb()
					})
			}
		],function(error,result){
			if(error){
				console.log('cglr_data async waterfall error',error)
				return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
			}
			console.log('check year ------',year)
			if(year==parseInt(moment().format('YYYY')-5) ){
				year = 'Before'
			}
			console.log('check year ------',year)
			res.render('pages/research/index',{L:req.query['L'],data:data,count:total,page:page,totalpage:totalpage,year:year,belongsto:belongsto,search_txt:search_txt})
		})
	}
}).get('/pages/research/details',function(req,res){
	let id = req.query.id,data={}
	if(!id){
		return res.json('wrong arg')
	}
	let search = cglr.findOne({'id':id})
		search.exec(function(error,doc){
			if(error){
				return res.json(error.message)
			}
			if(!doc){
				return res.json({'msg':'No result'})
			}
			let danwei_arr
			
			if(doc.danwei&&typeof(doc.danwei)!='undefined'){
				danwei_arr = doc.danwei.split(',')
			}
			// let zuozhe_arr = doc.zuozhe.split(',')
			data = doc
			// data.zuozhe_arr = zuozhe_arr
			// data.danwei_arr = danwei_arr
			let patharr=[],namearr=[]
			if(doc.patharr){
				patharr = (doc.patharr).split(',')
				namearr = (doc.namearr).split(',')
			}
			if(req.query['L']=='1'){
				res.render('pages/research/details',{check_nav:'active_research',L:req.query['L'],data:data,patharr:patharr,namearr:namearr})
			}else{
				res.render('pages/research/detailsen',{check_nav:'active_research',L:req.query['L'],data:data,patharr:patharr,namearr:namearr})
			}	
			
		})
}).get('/pages/research/index---详情见备注',function(req,res){
	// 该路由是联合条件搜索，可用，当不需要分开检索条件时直接使用------20220117-crx
	//views中index.ejs/indexen.ejs也是联合检索条件可用版本,分开检索条件使用的是indextest.ejs/indextesten.ejs
	let page = req.query.p,
		limit = req.query.limit,
		search_txt = req.query.s,
		year = req.query.y,
		belongstoid = req.query.b
	if(!page){page = 1}
	if(!limit){limit = 8 }//8
	let total = 0,data = {},totalpage = 0
	console.log('page limit',page,limit,search_txt,year,belongstoid,typeof(year))
	let obj = {},aggregate_obj = {}
	let myarr = [1,2,3,4,5,6,7,8,9,10,11]
	if(search_txt){
		console.log('search--------------')
		if(year && belongstoid){
			console.log('年 所')
			if(year=='Before'){
				year = parseInt(moment().format('YYYY')-6)
				obj = {year:{$lte:year},belongstoid:belongstoid,title:{$regex:search_txt,$options:"$i"}}
			}else{
				year = parseInt(year)
				obj = {year:year,belongstoid:belongstoid,title:{$regex:search_txt,$options:"$i"}}
			}
			aggregate_obj = {title:{$regex:search_txt,$options:"$i"}}
		}
		if(year && !belongstoid){
			console.log('年 ')
			if(year=='Before'){
				year = parseInt(moment().format('YYYY')-6)
				obj = {year:{$lte:year},title:{$regex:search_txt,$options:"$i"}}
			}else{
				year = parseInt(year)
				obj = {year:year,title:{$regex:search_txt,$options:"$i"}}
			}
			aggregate_obj = {title:{$regex:search_txt,$options:"$i"}}
		}
		if(!year && belongstoid){
			console.log('所 ')
			obj = {belongstoid:belongstoid,title:{$regex:search_txt,$options:"$i"}}
			aggregate_obj = {title:{$regex:search_txt,$options:"$i"}}
		}
		if(!year && !belongstoid){
			console.log('nothing')
			obj = {title:{$regex:search_txt,$options:"$i"}}
			aggregate_obj = {title:{$regex:search_txt,$options:"$i"}}
		}
		obj['review'] = 1
		async.waterfall([
			function(cb){
				//get count
				let search = cglr.find(obj).count()
					search.exec(function(err,count){
						if(err){
							console.log('research get total err',err)
							cb(err)
						}
						console.log('research count',count)
						total = count
						cb(null)
					})
			},
			function(cb){
				let numSkip = (page-1)*limit
					limit = parseInt(limit)
					console.log('obj-----------------',obj)
					async.waterfall([
						function(cbb){
							console.log('year -------')
							let search = cglr.aggregate([
								{$match:aggregate_obj},
								{$sort:{year:1}},
								{$group:{'_id':'$year',num:{$sum:1}}}
								
							])
							search.exec(function(err,docs){
								if(err){
									cbb(err)
								}
								let tempcount = 0
								docs.forEach(function(item,index){
									if(item._id<parseInt(moment().format('YYYY')-5)){
										tempcount += item.num
									}
								})
								data.yearNum = docs
								data.beforeyear = parseInt(moment().format('YYYY')-5) //近5年
								data.beforeyearNum = tempcount
								console.log('check -------',data.yearNum)
								cbb()
							})
						},
						function(cbb){
							console.log('belongsto -------')
							//统计所系人数
							let temp = {},temparr=[]
							async.eachLimit(myarr,1,function(item,callback){
								console.log('item-------',item)
								let search = cglr.find({belongstoid:item}).count()
									search.exec(function(err,count){
										if(err){
											callback(err)
										}
										temp.num = count
										temp.sx = checksuotype(item)
										temp._id = item
										temparr.push(temp)
										temp={}
										callback()
									})
							},function(error){
								if(error){
									cbb(error)
								}
								console.log('temparr-----',temparr)
								data.belongstoNum = temparr
								temparr=[]
								cbb()
							})
						},
						function(cbb){
							console.log('aaa')
							let search = cglr.find(obj)
								search.sort({'year':-1})
								search.sort({'timeAdd':-1})
								search.limit(limit)
								search.skip(numSkip)
								search.exec(function(error,docs){
									if(error){
										console.log('error',error)
										cb(error)
									}		
									data.kycg = docs
									cbb(null)
								})
						},
						function(cbb){
							let search = cmsContent.findOne({'tag2':'成果概况'})
								search.exec(function(err,doc){
									if(err){
										cb(err)
									}
									data.cggk = doc
									cbb()
								})
						}
					],function(error,result){
						if(error){
							return cb(error)
						}
						console.log('总页数------->',total,limit)
						totalpage = Math.ceil(total/limit)
						console.log('总页数------->',totalpage)
						cb()
					})
			}
		],function(error,result){
			if(error){
				console.log('cglr_data async waterfall error',error)
				return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
			}
			console.log('check year ------',year)
			if(year==parseInt(moment().format('YYYY')-6) ){
				year = 'Before'
			}
			console.log('check year ------',year)
			if(req.query['L']=='1'){
				res.render('pages/research/index',{L:req.query['L'],data:data,count:total,page:page,totalpage:totalpage,year:year,belongsto:belongstoid,search_txt:search_txt})
			}else{
				res.render('pages/research/indexen',{L:req.query['L'],data:data,count:total,page:page,totalpage:totalpage,year:year,belongsto:belongstoid,search_txt:search_txt})
			}	
		})
	}else{
		if(year && belongstoid){
			console.log('年 所')
			if(year=='Before'){
				year = parseInt(moment().format('YYYY')-6)
				obj = {year:{$lte:year},belongstoid:belongstoid}
			}else{
				year = parseInt(year)
				obj = {year:year,belongstoid:belongstoid}
			}
			aggregate_obj = {}
		}
		if(year && !belongstoid){
			console.log('年 ')
			if(year=='Before'){
				year = parseInt(moment().format('YYYY')-6)
				obj = {year:{$lte:year}}
				aggregate_obj = {year:{$lte:year}}
			}else{
				year = parseInt(year)
				obj = {year:year}
				//aggregate_obj = {year:year}
				aggregate_obj = {}
			}
			//aggregate_obj = {}
		}
		if(!year && belongstoid){
			console.log('所 ')
			obj = {belongstoid:belongstoid}
			//aggregate_obj = {}
			aggregate_obj = {belongstoid:parseInt(belongstoid)}
		}
		if(!year && !belongstoid){
			console.log('nothing')
			obj = {}
			aggregate_obj = {}
		}
		obj['review'] = 1
		async.waterfall([
			function(cb){
				//get count
				let search = cglr.find(obj).count()
					search.exec(function(err,count){
						if(err){
							console.log('research get total err',err)
							cb(err)
						}
						console.log('research count',count)
						total = count
						cb(null)
					})
			},
			function(cb){
				let numSkip = (page-1)*limit
					limit = parseInt(limit)
					console.log('obj-----------------',obj,aggregate_obj)
					async.waterfall([
						function(cbb){
							//统计年份数据
							console.log('year -------')
							let search = cglr.aggregate([
								{$match:aggregate_obj},
								{$sort:{year:1}},
								{$group:{'_id':'$year',num:{$sum:1}}}
								
							])
							
							search.exec(function(err,docs){
								if(err){
									cbb(err)
								}
								let tempcount = 0
								docs = docs.sort(mysort('_id',false))
								console.log('check ----------',docs)
								docs.forEach(function(item,index){
									if(item._id<parseInt(moment().format('YYYY')-5)){
										tempcount += item.num
									}
								})
								data.yearNum = docs
								data.beforeyear = parseInt(moment().format('YYYY')-5) //近5年
								data.beforeyearNum = tempcount
								console.log('check -------',data.yearNum,data.beforeyear)
								cbb()
							})
						},
						function(cbb){
							console.log('belongsto -------')
							//统计所系人数
							let temp = {},temparr=[]
							async.eachLimit(myarr,1,function(item,callback){
								console.log('item-------',item)
								let search = cglr.find({belongstoid:item,review:1}).count()
									search.exec(function(err,count){
										if(err){
											callback(err)
										}
										temp.num = count
										temp.sx = checksuotype(item)
										temp._id = item
										temparr.push(temp)
										temp={}
										callback()
									})
							},function(error){
								if(error){
									cbb(error)
								}
								console.log('belongstoNum-----',temparr)
								data.belongstoNum = temparr
								temparr=[]
								cbb()
							})
						},
						function(cbb){
							console.log('aaa')
							let search = cglr.find(obj)
								search.sort({'year':-1})
								search.sort({'timeAdd':-1})
								search.limit(limit)
								search.skip(numSkip)
								search.exec(function(error,docs){
									if(error){
										console.log('error',error)
										cb(error)
									}		
									data.kycg = docs
									cbb(null)
								})
						},
						function(cbb){
							let search = cmsContent.findOne({'tag2':'成果概况'})
								search.exec(function(err,doc){
									if(err){
										cb(err)
									}
									data.cggk = doc
									cbb()
								})
						}
					],function(error,result){
						if(error){
							return cb(error)
						}
						console.log('总页数------->',total,limit)
						totalpage = Math.ceil(total/limit)
						console.log('总页数------->',totalpage)
						cb()
					})
			}
		],function(error,result){
			if(error){
				console.log('cglr_data async waterfall error',error)
				return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
			}
			console.log('check year ------',year)
			if(year==parseInt(moment().format('YYYY')-6) ){
				year = 'Before'
			}
			console.log('check year ------',year)
			if(req.query['L']=='1'){
				res.render('pages/research/index',{L:req.query['L'],data:data,count:total,page:page,totalpage:totalpage,year:year,belongsto:belongstoid,search_txt:search_txt})
			}else{
				res.render('pages/research/indexen',{L:req.query['L'],data:data,count:total,page:page,totalpage:totalpage,year:year,belongsto:belongstoid,search_txt:search_txt})
			}
			
		})
	}
})
router.get('/pages/teacherTeam/index-2022',function(req,res){
	//6 9 10 为专职研究人员
	let data={},total=0,totalpage=0,myarr=[1,2,3,4,5,6,7,8,9,10,11],myarr1=[1,2,3,4,5,6,7,8,9,10]//myarr1根人员类别数量相对应，myarr跟所系数量对应
	let page = req.query.p,
		search_txt = req.query.s,
		zhicheng = req.query.zc,//peopleid
		suoxi = req.query.sx,//suoxiid
		i = req.query.i ///字母搜索
	if(!page){page = 1}
	if(!i){i = ''}
	let temp = {},temparr=[],obj,limit = 9
	let jsdw_ys = [],jsdw_gjzj = [],jsdw_gjqn = [],jsdw_gjqt = [],jsdw_gjry = []
	console.log('------------------------------------')
	if(search_txt){
		let searchobj = {}
		console.log('搜索----------------',search_txt)
		if(zhicheng&&suoxi){
			console.log('职称 && 所系')
			if(zhicheng==1){
				searchobj = {display:1,rongyujibie:{$ne:null,$exists:true},suoxiid:suoxi,userName:{$regex:search_txt},$or:[{power:'教职工'},{power:'管理员'}]}
			}else{
				searchobj = {display:1,peopleid:zhicheng,suoxiid:suoxi,userName:{$regex:search_txt},$or:[{power:'教职工'},{power:'管理员'}]}
			}
		}
		if(zhicheng&&!suoxi){
			console.log('职称')
			if(zhicheng==1){
				searchobj = {display:1,rongyujibie:{$ne:null,$exists:true},userName:{$regex:search_txt},$or:[{power:'教职工'},{power:'管理员'}]}
			}else{
				searchobj = {display:1,peopleid:zhicheng,userName:{$regex:search_txt},$or:[{power:'教职工'},{power:'管理员'}]}
			}
		}
		if(!zhicheng&&suoxi){
			console.log('所系')
			searchobj = {display:1,suoxiid:suoxi,userName:{$regex:search_txt},$or:[{power:'教职工'},{power:'管理员'}]}
		}
		if(!zhicheng&&!suoxi){
			console.log('都没有')
			searchobj = {display:1,userName:{$regex:search_txt},$or:[{power:'教职工'},{power:'管理员'}]}
		}
		console.log('check searchobj --------',searchobj)
		async.waterfall([
			function(cb){
				//get count
				let search = user.find(searchobj).count()
					search.exec(function(err,count){
						if(err){
							console.log('user get total err',err)
							cb(err)
						}
						console.log('user count',count)
						total = count
						cb(null)
					})
			},
			function(cb){
				let search = cmsContent.findOne({'tag2':'师资概况'})
					search.exec(function(err,doc){
						if(err){
							cb(err)
						}
						data.szgk = doc
						cb()
					})
			},
			function(cb){
				//统计职称人数
				async.eachLimit(myarr1,1,function(item,cbb){
					console.log('item-------',item)
					let search
					if(item==1){
						search = user.find({rongyujibie:{$ne:null,$exists:true},display:1,userName:{$regex:search_txt},$or:[{power:'教职工'},{power:'管理员'}]}).count()
					}else{
						search = user.find({peopleid:item,display:1,userName:{$regex:search_txt},$or:[{power:'教职工'},{power:'管理员'}]}).count()
					}
					
						search.exec(function(err,count){
							if(err){
								cbb(err)
							}
							temp.num = count
							temp.zc = checkjstype(item)
							temp._id = item
							temparr.push(temp)
							temp={}
							cbb()
						})
				},function(error){
					if(error){
						cb(error)
					}
					console.log('职称人数统计----------',temparr)
					data.zhichengNum = temparr
					temparr = []
					cb()
				})
			},
			function(cb){
				//统计所系人数
				async.eachLimit(myarr,1,function(item,cbb){
					console.log('item-------',item)
					let search = user.find({suoxiid:item,display:1,userName:{$regex:search_txt},$or:[{power:'教职工'},{power:'管理员'}]}).count()
						search.exec(function(err,count){
							if(err){
								cbb(err)
							}
							temp.num = count
							temp.sx = checksuotype(item)
							temp._id = item
							temparr.push(temp)
							temp={}
							cbb()
						})
				},function(error){
					if(error){
						cb(error)
					}
					console.log('所系人数----------',temparr)
					data.suoxiNum = temparr
					cb()
				})
			},
			function(cb){
				console.log('aaa')
				let numSkip = (page-1)*limit
					limit = parseInt(limit)
				let search = user.find(searchobj)
					search.where({'display':1})
					search.sort({'userName_py':1})
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('error',error)
							cb(error)
						}	
						//console.log('docs-----',docs)	
						data.jsdw = docs
						if(zhicheng==1){
							console.log('------------ 杰出人才 --------------')
							docs.forEach(function(item){
								if(parseInt(item.rongyujibie)==1){
									jsdw_ys.push(item)
								}
								if(parseInt(item.rongyujibie)==2){
									jsdw_gjzj.push(item)
								}
								if(parseInt(item.rongyujibie)==3){
									jsdw_gjqn.push(item)
								}
								if(parseInt(item.rongyujibie)==4){
									jsdw_gjqt.push(item)
								}
								if(parseInt(item.rongyujibie)==5){
									jsdw_gjry.push(item)
								}
							})
						}
						cb(null)
					})
			},
		],function(error,result){
			if(error){
				return res.json(error)
			}
			totalpage = Math.ceil(total/limit)
			console.log('总页数------->',totalpage)
			if(req.query['L']=='1'){
				res.render('pages/teacherTeam/index',{L:req.query['L'],jsdw_ys,jsdw_gjzj,jsdw_gjqn,jsdw_gjqt,jsdw_gjry,data:data,page:page,totalpage:totalpage,zhicheng:zhicheng,suoxi:suoxi,search_txt:search_txt,zimu:i})
			}else{
				res.render('pages/teacherTeam/indexen',{L:req.query['L'],jsdw_ys,jsdw_gjzj,jsdw_gjqn,jsdw_gjqt,jsdw_gjry,data:data,page:page,totalpage:totalpage,zhicheng:zhicheng,suoxi:suoxi,search_txt:search_txt,zimu:i})
			}
		})
	}
	else if(i){
		let searchobj = {}
		console.log('字母筛选----------------',i)
		if(zhicheng&&suoxi){
			console.log('职称 && 所系')
			if(zhicheng==1){
				searchobj = {rongyujibie:{$ne:null,$exists:true},suoxiid:suoxi,display:1,userName_py:{$regex:i,$options:"$i"},$or:[{power:'教职工'},{power:'管理员'}]}
			}else{
				searchobj = {peopleid:zhicheng,suoxiid:suoxi,display:1,userName_py:{$regex:i,$options:"$i"},$or:[{power:'教职工'},{power:'管理员'}]}
			}
		}
		if(zhicheng&&!suoxi){
			console.log('职称')
			if(zhicheng==1){
				searchobj = {rongyujibie:{$ne:null,$exists:true},display:1,userName_py:{$regex:i,$options:"$i"},$or:[{power:'教职工'},{power:'管理员'}]}
			}else{
				searchobj = {peopleid:zhicheng,display:1,userName_py:{$regex:i,$options:"$i"},$or:[{power:'教职工'},{power:'管理员'}]}
			}
		}
		if(!zhicheng&&suoxi){
			console.log('所系')
			searchobj = {suoxiid:suoxi,display:1,userName_py:{$regex:i,$options:"$i"},$or:[{power:'教职工'},{power:'管理员'}]}
		}
		if(!zhicheng&&!suoxi){
			console.log('都没有')
			searchobj = {display:1,userName_py:{$regex:i,$options:"$i"},$or:[{power:'教职工'},{power:'管理员'}]}
		}
		console.log('check searchobj --------',searchobj)
		async.waterfall([
			function(cb){
				//get count
				let search = user.find(searchobj).count()
					search.exec(function(err,count){
						if(err){
							console.log('user get total err',err)
							cb(err)
						}
						console.log('user count',count)
						total = count
						cb(null)
					})
			},
			function(cb){
				let search = cmsContent.findOne({'tag2':'师资概况'})
					search.exec(function(err,doc){
						if(err){
							cb(err)
						}
						data.szgk = doc
						cb()
					})
			},
			function(cb){
				//统计职称人数
				async.eachLimit(myarr1,1,function(item,cbb){
					console.log('item-------',item)
					let search
					if(item==1){
						search = user.find({rongyujibie:{$ne:null,$exists:true},display:1,userName_py:{$regex:i,$options:"$i"},$or:[{power:'教职工'},{power:'管理员'}]}).count()
					}else{
						search = user.find({peopleid:item,display:1,userName_py:{$regex:i,$options:"$i"},$or:[{power:'教职工'},{power:'管理员'}]}).count()
					}
					
						search.exec(function(err,count){
							if(err){
								cbb(err)
							}
							temp.num = count
							temp.zc = checkjstype(item)
							temp._id = item
							temparr.push(temp)
							temp={}
							cbb()
						})
				},function(error){
					if(error){
						cb(error)
					}
					console.log('职称人数统计----------',temparr)
					data.zhichengNum = temparr
					temparr = []
					cb()
				})
			},
			function(cb){
				//统计所系人数
				async.eachLimit(myarr,1,function(item,cbb){
					console.log('item-------',item)
					let search = user.find({suoxiid:item,display:1,userName_py:{$regex:i,$options:"$i"},$or:[{power:'教职工'},{power:'管理员'}]}).count()
						search.exec(function(err,count){
							if(err){
								cbb(err)
							}
							temp.num = count
							temp.sx = checksuotype(item)
							temp._id = item
							temparr.push(temp)
							temp={}
							cbb()
						})
				},function(error){
					if(error){
						cb(error)
					}
					console.log('所系人数----------',temparr)
					data.suoxiNum = temparr
					cb()
				})
			},
			function(cb){
				console.log('aaa')
				let numSkip = (page-1)*limit
					limit = parseInt(limit)
				let search = user.find(searchobj)
					search.where({'display':1})
					search.sort({'userName_py':1})
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('error',error)
							cb(error)
						}	
						//console.log('docs-----',docs)	
						data.jsdw = docs
						if(zhicheng==1){
							console.log('------------ 杰出人才 --------------')
							docs.forEach(function(item){
								if(parseInt(item.rongyujibie)==1){
									jsdw_ys.push(item)
								}
								if(parseInt(item.rongyujibie)==2){
									jsdw_gjzj.push(item)
								}
								if(parseInt(item.rongyujibie)==3){
									jsdw_gjqn.push(item)
								}
								if(parseInt(item.rongyujibie)==4){
									jsdw_gjqt.push(item)
								}
								if(parseInt(item.rongyujibie)==5){
									jsdw_gjry.push(item)
								}
							})
						}
						cb(null)
					})
			},
		],function(error,result){
			if(error){
				return res.json(error)
			}
			totalpage = Math.ceil(total/limit)
			console.log('总页数------->',totalpage)
			console.log('i-------------------',i)
			if(req.query['L']=='1'){
				res.render('pages/teacherTeam/index',{L:req.query['L'],jsdw_ys,jsdw_gjzj,jsdw_gjqn,jsdw_gjqt,jsdw_gjry,data:data,page:page,totalpage:totalpage,zhicheng:zhicheng,suoxi:suoxi,search_txt:search_txt,zimu:i})
			}else{
				res.render('pages/teacherTeam/indexen',{L:req.query['L'],jsdw_ys,jsdw_gjzj,jsdw_gjqn,jsdw_gjqt,jsdw_gjry,data:data,page:page,totalpage:totalpage,zhicheng:zhicheng,suoxi:suoxi,search_txt:search_txt,zimu:i})
			}
			
		})
	}
	else{
		if(zhicheng&&suoxi){
			console.log('职称 & 所系 参数--------------',zhicheng,suoxi)
			async.waterfall([
				function(cb){
					//get count
					let search 
					if(zhicheng==1){
						search = user.find({rongyujibie:{$ne:null,$exists:true},suoxiid:suoxi,display:1,$or:[{power:'教职工'},{power:'管理员'}]}).count()
					}else{
						search = user.find({peopleid:zhicheng,suoxiid:suoxi,display:1,$or:[{power:'教职工'},{power:'管理员'}]}).count()
					}
					
						search.exec(function(err,count){
							if(err){
								console.log('user get total err',err)
								cb(err)
							}
							console.log('user count',count)
							total = count
							cb(null)
						})
				},
				function(cb){
					let search = cmsContent.findOne({'tag2':'师资概况'})
						search.exec(function(err,doc){
							if(err){
								cb(err)
							}
							data.szgk = doc
							cb()
						})
				},
				function(cb){
					//统计职称人数
					async.eachLimit(myarr1,1,function(item,cbb){
						console.log('item-------',item)
						let search
						if(item==1){
							search = user.find({rongyujibie:{$ne:null,$exists:true},suoxiid:suoxi,display:1,$or:[{power:'教职工'},{power:'管理员'}]}).count()
						}else{
							search = user.find({peopleid:item,suoxiid:suoxi,display:1,$or:[{power:'教职工'},{power:'管理员'}]}).count()
						}
						
							search.exec(function(err,count){
								if(err){
									cbb(err)
								}
								temp.num = count
								temp.zc = checkjstype(item)
								temp._id = item
								temparr.push(temp)
								temp={}
								cbb()
							})
					},function(error){
						if(error){
							cb(error)
						}
						console.log('temparr-----',temparr)
						data.zhichengNum = temparr
						temparr = []
						cb()
					})
				},
				function(cb){
					//统计所系人数
					async.eachLimit(myarr,1,function(item,cbb){
						console.log('item-------',item)
						let search = user.find({suoxiid:item,display:1,$or:[{power:'教职工'},{power:'管理员'}]}).count()
							search.exec(function(err,count){
								if(err){
									cbb(err)
								}
								temp.num = count
								temp.sx = checksuotype(item)
								temp._id = item
								temparr.push(temp)
								temp={}
								cbb()
							})
					},function(error){
						if(error){
							cb(error)
						}
						console.log('temparr-----',temparr)
						data.suoxiNum = temparr
						cb()
					})
				},
				function(cb){
					console.log('aaa')
					let numSkip = (page-1)*limit
						limit = parseInt(limit)
					let search
					if(zhicheng==1){
						search = user.find({rongyujibie:{$ne:null,$exists:true},suoxiid:suoxi,$or:[{power:'教职工'},{power:'管理员'}]})
					}else{
						search = user.find({peopleid:zhicheng,suoxiid:suoxi,$or:[{power:'教职工'},{power:'管理员'}]})
					}
					
						search.where({'display':1})	
						search.sort({'userName_py':1})
						search.sort({'userName':1})
						
						search.limit(limit)
						search.skip(numSkip)
						search.exec(function(error,docs){
							if(error){
								console.log('error',error)
								cb(error)
							}	
							console.log('docs-----',docs)	
							data.jsdw = docs
							if(zhicheng==1){
								console.log('------------ 杰出人才 --------------')
								docs.forEach(function(item){
									if(parseInt(item.rongyujibie)==1){
										jsdw_ys.push(item)
									}
									if(parseInt(item.rongyujibie)==2){
										jsdw_gjzj.push(item)
									}
									if(parseInt(item.rongyujibie)==3){
										jsdw_gjqn.push(item)
									}
									if(parseInt(item.rongyujibie)==4){
										jsdw_gjqt.push(item)
									}
									if(parseInt(item.rongyujibie)==5){
										jsdw_gjry.push(item)
									}
								})
							}
							console.log('jsdw--------------------->',jsdw_ys.length,jsdw_gjzj.length,jsdw_gjqn.length,jsdw_gjqt.length,jsdw_gjry.length)
							cb(null)
						})
				},
			],function(error,result){
				if(error){
					return res.json(error)
				}
				totalpage = Math.ceil(total/limit)
				console.log('总页数------->',totalpage)
				if(req.query['L']=='1'){
					res.render('pages/teacherTeam/index',{L:req.query['L'],jsdw_ys,jsdw_gjzj,jsdw_gjqn,jsdw_gjqt,jsdw_gjry,data:data,page:page,totalpage:totalpage,zhicheng:zhicheng,suoxi:suoxi,search_txt:search_txt,zimu:i})
				}else{
					res.render('pages/teacherTeam/indexen',{L:req.query['L'],jsdw_ys,jsdw_gjzj,jsdw_gjqn,jsdw_gjqt,jsdw_gjry,data:data,page:page,totalpage:totalpage,zhicheng:zhicheng,suoxi:suoxi,search_txt:search_txt,zimu:i})
				}
			})
		}
		if(zhicheng&&!suoxi){
			console.log('所系人数改变，其它不变------zhicheng',zhicheng)
			async.waterfall([
				function(cb){
					//get count
					let search
					if(zhicheng==1){
						search = user.find({rongyujibie:{$ne:null,$exists:true},display:1,$or:[{power:'教职工'},{power:'管理员'}]}).count()
					}else{
						search = user.find({peopleid:zhicheng,display:1,$or:[{power:'教职工'},{power:'管理员'}]}).count()
					}
						search.exec(function(err,count){
							if(err){
								console.log('user get total err',err)
								cb(err)
							}
							console.log('user count',count)
							total = count
							cb(null)
						})
				},
				function(cb){
					let search = cmsContent.findOne({'tag2':'师资概况'})
						search.exec(function(err,doc){
							if(err){
								cb(err)
							}
							data.szgk = doc
							cb()
						})
				},
				function(cb){
					//统计职称人数
					console.log('----------------- 分步统计职称人数 ----------------')
					async.waterfall([
						function(cbb){
							console.log('正常统计职称人数')
							let search = user.aggregate([
								{$match:{display:1,$or:[{power:'教职工'},{power:'管理员'}]}},
								{$group:{'_id':'$peopleid',num:{$sum:1}}},
								{$sort:{_id:1}}
							])
							search.exec(function(err,docs){
								if(err){
									cbb(err)
								}
								console.log('check -------',docs)
								docs.forEach(function(item,index){
									console.log('1    ----------------------------')
									console.log(item._id)
									item.zc = checkjstype(item._id)
								})
								data.zhichengNum = docs
								console.log(data.zhichengNum)
								console.log('----------------------------')
								cbb()
							})
						},
						function(cbb){
							console.log('统计杰出人才数量')
							let search = user.find({display:1,rongyujibie:{$ne:null,$exists:true},$or:[{power:'教职工'},{power:'管理员'}]}).count()
								search.exec(function(err,count){
									if(err){
										console.log('user get total err',err)
										cbb(err)
									}
									console.log('user count',count)
									let tempobj = {'_id':1,num:count,'zc':'杰出人才'}
									data.zhichengNum.unshift(tempobj)
									//(data.zhichengNum).sort(sort_id)
									console.log('最终zhihengNum  ----------------------------')
									console.log(data.zhichengNum)
									cbb(null)
								})
						}
					],function(error,results){
						if(error){
							cb(error)
						}
						cb()
					})
				},
				function(cb){
					//统计所系人数
					async.eachLimit(myarr,1,function(item,cbb){
						console.log('item-------',item)
						let search
						if(zhicheng == 1){
							search = user.find({rongyujibie:{$ne:null,$exists:true},suoxiid:item,display:1,$or:[{power:'教职工'},{power:'管理员'}]}).count()
						}else{
							search = user.find({peopleid:zhicheng,suoxiid:item,display:1,$or:[{power:'教职工'},{power:'管理员'}]}).count()
						}
						
							search.exec(function(err,count){
								if(err){
									cbb(err)
								}
								temp.num = count
								temp.sx = checksuotype(item)
								temp._id = item
								temparr.push(temp)
								temp={}
								cbb()
							})
					},function(error){
						if(error){
							cb(error)
						}
						console.log('temparr-----',temparr)
						data.suoxiNum = temparr
						cb()
					})
				},
				function(cb){
					console.log('aaa')
					let numSkip = (page-1)*limit
						limit = parseInt(limit)
					let search
					if(zhicheng==1){
						search = user.find({display:1,rongyujibie:{$ne:null,$exists:true},$or:[{power:'教职工'},{power:'管理员'}]})
						search.sort({'rongyujibie':1})
					}else{
						search = user.find({display:1,peopleid:zhicheng,$or:[{power:'教职工'},{power:'管理员'}]})
					}
						search.sort({'userName_py':1})
						search.limit(limit)
						search.skip(numSkip)
						search.exec(function(error,docs){
							if(error){
								console.log('error',error)
								cb(error)
							}	
							//console.log('docs-----',docs)	
							let check = new RegExp('院')//院长，院长助理
							let check1 = new RegExp('所')//所长

							docs.forEach(function(item){
								if(!item.zhiwu.match(check)){
									//console.log('----item',item)
									item.zhiwu=''
								}
							})
							data.jsdw = docs
							
							if(zhicheng==1){
								console.log('------------ 杰出人才 --------------')
								docs.forEach(function(item){
									if(parseInt(item.rongyujibie)==1){
										jsdw_ys.push(item)
									}
									if(parseInt(item.rongyujibie)==2){
										jsdw_gjzj.push(item)
									}
									if(parseInt(item.rongyujibie)==3){
										jsdw_gjqn.push(item)
									}
									if(parseInt(item.rongyujibie)==4){
										jsdw_gjqt.push(item)
									}
									if(parseInt(item.rongyujibie)==5){
										jsdw_gjry.push(item)
									}
								})
							}
							console.log('jsdw--------------------->',jsdw_ys.length,jsdw_gjzj.length,jsdw_gjqn.length,jsdw_gjqt.length,jsdw_gjry.length)
							cb(null)
						})
				},
			],function(error,result){
				if(error){
					return res.json(error)
				}
				totalpage = Math.ceil(total/limit)
				console.log('总页数------->',totalpage,zhicheng)
				if(req.query['L']=='1'){
					res.render('pages/teacherTeam/index',{L:req.query['L'],jsdw_ys,jsdw_gjzj,jsdw_gjqn,jsdw_gjqt,jsdw_gjry,data:data,page:page,totalpage:totalpage,zhicheng:zhicheng,suoxi:suoxi,search_txt:search_txt,zimu:i})
				}else{
					res.render('pages/teacherTeam/indexen',{L:req.query['L'],data:data,page:page,totalpage:totalpage,zhicheng:zhicheng,suoxi:suoxi,search_txt:search_txt,zimu:i})
				}
			})
		}
		if(suoxi&&!zhicheng){
			console.log('职称人数改变，其它不变------suoxi',suoxi)
			async.waterfall([
				function(cb){
					//get count
					let search = user.find({suoxiid:suoxi,display:1,$or:[{power:'教职工'},{power:'管理员'}]}).count()
						search.exec(function(err,count){
							if(err){
								console.log('user get total err',err)
								cb(err)
							}
							console.log('user count',count)
							total = count
							cb(null)
						})
				},
				function(cb){
					let search = cmsContent.findOne({'tag2':'师资概况'})
						search.exec(function(err,doc){
							if(err){
								cb(err)
							}
							data.szgk = doc
							cb()
						})
				},
				function(cb){
					//统计职称人数
					async.eachLimit(myarr1,1,function(item,cbb){
						console.log('item-------',item)
						let search
						if(item==1){
							search = user.find({rongyujibie:{$ne:null,$exists:true},suoxiid:suoxi,display:1,$or:[{power:'教职工'},{power:'管理员'}]}).count()
						}else{
							search = user.find({peopleid:item,suoxiid:suoxi,display:1,$or:[{power:'教职工'},{power:'管理员'}]}).count()
						}
						
							search.exec(function(err,count){
								if(err){
									cbb(err)
								}
								temp.num = count
								temp.sx = checkjstype(item)
								temp._id = item
								temparr.push(temp)
								temp={}
								cbb()
							})
					},function(error){
						if(error){
							cb(error)
						}
						console.log('temparr-----',temparr)
						data.zhichengNum = temparr
						temparr = []
						cb()
					})
				},
				function(cb){
					//统计所系人数
					async.eachLimit(myarr,1,function(item,cbb){
						console.log('item-------',item)
						let search = user.find({suoxiid:item,display:1,$or:[{power:'教职工'},{power:'管理员'}]}).count()
							search.exec(function(err,count){
								if(err){
									cbb(err)
								}
								temp.num = count
								temp.sx = checksuotype(item)
								temp._id = item
								temparr.push(temp)
								temp={}
								cbb()
							})
					},function(error){
						if(error){
							cb(error)
						}
						console.log('temparr-----',temparr)
						data.suoxiNum = temparr
						cb()
					})
				},
				function(cb){
					console.log('aaa')
					let numSkip = (page-1)*limit
						limit = parseInt(limit)
					let search = user.find({suoxiid:suoxi,$or:[{power:'教职工'},{power:'管理员'}]})
						search.where({'display':1})	
						search.sort({'userName_py':1})
						search.limit(limit)
						search.skip(numSkip)
						search.exec(function(error,docs){
							if(error){
								console.log('error',error)
								cb(error)
							}	
							//console.log('docs-----',docs)	
							data.jsdw = docs
							cb(null)
						})
				},
			],function(error,result){
				if(error){
					return res.json(error)
				}
				totalpage = Math.ceil(total/limit)
				console.log('总页数------->',totalpage)
				if(req.query['L']=='1'){
					res.render('pages/teacherTeam/index',{L:req.query['L'],data:data,page:page,totalpage:totalpage,zhicheng:zhicheng,suoxi:suoxi,search_txt:search_txt,zimu:i})
				}else{
					res.render('pages/teacherTeam/indexen',{L:req.query['L'],data:data,page:page,totalpage:totalpage,zhicheng:zhicheng,suoxi:suoxi,search_txt:search_txt,zimu:i})
				}
			})
		}
		if(!zhicheng&&!suoxi&!search_txt){
			console.log('nothing')
			async.waterfall([
				function(cb){
					//get count
					let search = user.find({display:1,$or:[{power:'教职工'},{power:'管理员'}]}).count()
						search.exec(function(err,count){
							if(err){
								console.log('user get total err',err)
								cb(err)
							}
							console.log('user count',count)
							total = count
							cb(null)
						})
				},
				function(cb){
					let search = cmsContent.findOne({'tag2':'师资概况'})
						search.exec(function(err,doc){
							if(err){
								cb(err)
							}
							data.szgk = doc
							cb()
						})
				},
				function(cb){
					//统计职称人数
					console.log('----------------- 分步统计职称人数 ----------------')
					async.waterfall([
						function(cbb){
							console.log('正常统计职称人数')
							let search = user.aggregate([
								{$match:{display:1,$or:[{power:'教职工'},{power:'管理员'}]}},
								{$group:{'_id':'$peopleid',num:{$sum:1}}},
								{$sort:{_id:1}}
							])
							search.exec(function(err,docs){
								if(err){
									cbb(err)
								}
								console.log('check -------',docs)
								docs.forEach(function(item,index){
									console.log('1    ----------------------------')
									console.log(item._id)
									item.zc = checkjstype(item._id)
								})
								data.zhichengNum = docs
								console.log(data.zhichengNum)
								console.log('----------------------------')
								cbb()
							})
						},
						function(cbb){
							console.log('统计杰出人才数量')
							let search = user.find({display:1,rongyujibie:{$ne:null,$exists:true},$or:[{power:'教职工'},{power:'管理员'}]}).count()
								search.exec(function(err,count){
									if(err){
										console.log('user get total err',err)
										cbb(err)
									}
									console.log('user count',count)
									let tempobj = {'_id':1,num:count,'zc':'杰出人才'}
									data.zhichengNum.unshift(tempobj)
									//data.zhichengNum.sort(sort_id)
									console.log('最终zhihengNum  ----------------------------')
									console.log(data.zhichengNum)
									cbb(null)
								})
						}
					],function(error,results){
						if(error){
							cb(error)
						}
						cb()
					})
					
				},
				function(cb){
					//统计所系人数
					async.eachLimit(myarr,1,function(item,cbb){
						console.log('item-------',item)
						let search = user.find({suoxiid:item,display:1,$or:[{power:'教职工'},{power:'管理员'}]}).count()
							search.exec(function(err,count){
								if(err){
									cbb(err)
								}
								temp.num = count
								temp.sx = checksuotype(item)
								temp._id = item
								temparr.push(temp)
								temp={}
								cbb()
							})
					},function(error){
						if(error){
							cb(error)
						}
						console.log('temparr-----',temparr)
						data.suoxiNum = temparr
						cb()
					})
				},
				function(cb){
					console.log('aaa')
					let numSkip = (page-1)*limit
						limit = parseInt(limit)
					let search = user.find({$or:[{power:'教职工'},{power:'管理员'}]})
						search.where({'display':1})
						search.sort({'userName_py':1})
						search.limit(limit)
						search.skip(numSkip)
						search.exec(function(error,docs){
							if(error){
								console.log('error',error)
								cb(error)
							}	
							//console.log('docs-----',docs)	
							data.jsdw = docs
							cb(null)
						})
				},
			],function(error,result){
				if(error){
					return res.json(error)
				}
				totalpage = Math.ceil(total/limit)
				console.log('总页数------->',totalpage)
				if(req.query['L']=='1'){
					res.render('pages/teacherTeam/index',{L:req.query['L'],data:data,page:page,totalpage:totalpage,zhicheng:zhicheng,suoxi:suoxi,search_txt:search_txt,zimu:i})
				}else{
					res.render('pages/teacherTeam/indexen',{L:req.query['L'],data:data,page:page,totalpage:totalpage,zhicheng:zhicheng,suoxi:suoxi,search_txt:search_txt,zimu:i})
				}				
			})
		}
	}	
}).get('/pages/teacherTeam/index',function(req,res){
	//6 9 10 为专职研究人员
	//该接口为条件分开检索，搜索独立，字母独立，所系独立，职称独立，可用
	//20220121新写，views中indextest和indextesten可用，如果到时候要分开
	//直接把该接口改为/index即可,index-2022是联合条件搜索接口
	let data={},total=0,totalpage=0,myarr=[1,2,3,4,5,6,7,8,9,10,11],myarr1=[1,2,3,4,5,6,7,8,9,10]//myarr1根人员类别数量相对应，myarr跟所系数量对应
	let page = req.query.p,
		search_txt = req.query.s,
		zhicheng = req.query.zc,//peopleid
		suoxi = req.query.sx,//suoxiid
		i = req.query.i ///字母搜索
	if(!page){page = 1}
	if(!i){i = ''}
	let temp = {},temparr=[],obj,limit = 9
	let jsdw_ys = [],jsdw_gjzj = [],jsdw_gjqn = [],jsdw_gjqt = [],jsdw_gjry = []
	console.log('------------------------------------')
	if(search_txt){
		let searchobj = {}
		console.log('单独搜索----------------',search_txt)
		if(req.query['L']==1){
			searchobj = {display:1,userName:{$regex:search_txt,$options:'$i'},$or:[{power:'教职工'},{power:'管理员'}]}
		}else{
			searchobj = {display:1,userName1:{$regex:search_txt,$options:'$i'},$or:[{power:'教职工'},{power:'管理员'}]}
		}
		
		
		console.log('check searchobj --------',searchobj)
		async.waterfall([
			function(cb){
				//get count
				let search = user.find(searchobj).count()
					search.exec(function(err,count){
						if(err){
							console.log('user get total err',err)
							cb(err)
						}
						console.log('user count',count)
						total = count
						cb(null)
					})
			},
			function(cb){
				let search = cmsContent.findOne({'tag2':'师资概况'})
					search.exec(function(err,doc){
						if(err){
							cb(err)
						}
						data.szgk = doc
						cb()
					})
			},
			function(cb){
				//统计职称人数
				async.eachLimit(myarr1,1,function(item,cbb){
					console.log('item-------',item)
					let search
					if(item==1){
						search = user.find({rongyujibie:{$ne:null,$exists:true},display:1,$or:[{power:'教职工'},{power:'管理员'}]}).count()
					}else{
						search = user.find({peopleid:item,display:1,$or:[{power:'教职工'},{power:'管理员'}]}).count()
					}
					
						search.exec(function(err,count){
							if(err){
								cbb(err)
							}
							temp.num = count
							temp.zc = checkjstype(item)
							temp._id = item
							temparr.push(temp)
							temp={}
							cbb()
						})
				},function(error){
					if(error){
						cb(error)
					}
					console.log('职称人数统计----------',temparr)
					data.zhichengNum = temparr
					temparr = []
					cb()
				})
			},
			function(cb){
				//统计所系人数
				async.eachLimit(myarr,1,function(item,cbb){
					console.log('item-------',item)
					let search = user.find({suoxiid:item,display:1,$or:[{power:'教职工'},{power:'管理员'}]}).count()
						search.exec(function(err,count){
							if(err){
								cbb(err)
							}
							temp.num = count
							temp.sx = checksuotype(item)
							temp._id = item
							temparr.push(temp)
							temp={}
							cbb()
						})
				},function(error){
					if(error){
						cb(error)
					}
					console.log('所系人数----------',temparr)
					data.suoxiNum = temparr
					cb()
				})
			},
			function(cb){
				console.log('aaa')
				let numSkip = (page-1)*limit
					limit = parseInt(limit)
				let search = user.find(searchobj)
					search.where({'display':1})
					search.sort({'peopleid':1})
					search.sort({'userName_py':1})
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('error',error)
							cb(error)
						}	
						//console.log('docs-----',docs)	
						
						data.jsdw = docs
						if(zhicheng==1){
							console.log('------------ 杰出人才 --------------')
							docs.forEach(function(item){
								if(parseInt(item.rongyujibie)==1){
									jsdw_ys.push(item)
								}
								if(parseInt(item.rongyujibie)==2){
									jsdw_gjzj.push(item)
								}
								if(parseInt(item.rongyujibie)==3){
									jsdw_gjqn.push(item)
								}
								if(parseInt(item.rongyujibie)==4){
									jsdw_gjqt.push(item)
								}
								if(parseInt(item.rongyujibie)==5){
									jsdw_gjry.push(item)
								}
							})
						}
						cb(null)
					})
			},
		],function(error,result){
			if(error){
				return res.json(error)
			}
			totalpage = Math.ceil(total/limit)
			console.log('总页数------->',totalpage)
			if(req.query['L']=='1'){
				res.render('pages/teacherTeam/indextest',{check_nav:'active_teacherteam',L:req.query['L'],jsdw_ys,jsdw_gjzj,jsdw_gjqn,jsdw_gjqt,jsdw_gjry,data:data,page:page,totalpage:totalpage,zhicheng:zhicheng,suoxi:suoxi,search_txt:search_txt,zimu:i})
			}else{
				res.render('pages/teacherTeam/indexentest',{check_nav:'active_teacherteam',L:req.query['L'],jsdw_ys,jsdw_gjzj,jsdw_gjqn,jsdw_gjqt,jsdw_gjry,data:data,page:page,totalpage:totalpage,zhicheng:zhicheng,suoxi:suoxi,search_txt:search_txt,zimu:i})
			}
		})
	}
	else if(i){
		let searchobj = {}
		console.log('单独字母筛选----------------',i)

		searchobj = {display:1,userName_py:{$regex:i,$options:"$i"},$or:[{power:'教职工'},{power:'管理员'}]}
		
		console.log('check searchobj --------',searchobj)
		async.waterfall([
			function(cb){
				//get count
				let search = user.find(searchobj).count()
					search.exec(function(err,count){
						if(err){
							console.log('user get total err',err)
							cb(err)
						}
						console.log('user count',count)
						total = count
						cb(null)
					})
			},
			function(cb){
				let search = cmsContent.findOne({'tag2':'师资概况'})
					search.exec(function(err,doc){
						if(err){
							cb(err)
						}
						data.szgk = doc
						cb()
					})
			},
			function(cb){
				//统计职称人数
				async.eachLimit(myarr1,1,function(item,cbb){
					console.log('item-------',item)
					let search
					if(item==1){
						search = user.find({rongyujibie:{$ne:null,$exists:true},display:1,$or:[{power:'教职工'},{power:'管理员'}]}).count()
					}else{
						search = user.find({peopleid:item,display:1,$or:[{power:'教职工'},{power:'管理员'}]}).count()
					}
						search.exec(function(err,count){
							if(err){
								cbb(err)
							}
							temp.num = count
							temp.zc = checkjstype(item)
							temp._id = item
							temparr.push(temp)
							temp={}
							cbb()
						})
				},function(error){
					if(error){
						cb(error)
					}
					console.log('职称人数统计----------',temparr)
					data.zhichengNum = temparr
					temparr = []
					cb()
				})
			},
			function(cb){
				//统计所系人数
				async.eachLimit(myarr,1,function(item,cbb){
					console.log('item-------',item)
					let search = user.find({suoxiid:item,display:1,$or:[{power:'教职工'},{power:'管理员'}]}).count()
						search.exec(function(err,count){
							if(err){
								cbb(err)
							}
							temp.num = count
							temp.sx = checksuotype(item)
							temp._id = item
							temparr.push(temp)
							temp={}
							cbb()
						})
				},function(error){
					if(error){
						cb(error)
					}
					console.log('所系人数----------',temparr)
					data.suoxiNum = temparr
					cb()
				})
			},
			function(cb){
				console.log('aaa')
				let numSkip = (page-1)*limit
					limit = parseInt(limit)
				let search = user.find(searchobj)
					search.where({'display':1})
					search.sort({'zhiwu':-1})
					search.sort({'userName_py':1})
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('error',error)
							cb(error)
						}	
						//console.log('docs-----',docs)	
						data.jsdw = docs
						if(zhicheng==1){
							console.log('------------ 杰出人才 --------------')
							docs.forEach(function(item){
								if(parseInt(item.rongyujibie)==1){
									jsdw_ys.push(item)
								}
								if(parseInt(item.rongyujibie)==2){
									jsdw_gjzj.push(item)
								}
								if(parseInt(item.rongyujibie)==3){
									jsdw_gjqn.push(item)
								}
								if(parseInt(item.rongyujibie)==4){
									jsdw_gjqt.push(item)
								}
								if(parseInt(item.rongyujibie)==5){
									jsdw_gjry.push(item)
								}
							})
						}
						cb(null)
					})
			},
		],function(error,result){
			if(error){
				return res.json(error)
			}
			totalpage = Math.ceil(total/limit)
			console.log('总页数------->',totalpage)
			console.log('i-------------------',i)
			if(req.query['L']=='1'){
				res.render('pages/teacherTeam/indextest',{check_nav:'active_teacherteam',L:req.query['L'],jsdw_ys,jsdw_gjzj,jsdw_gjqn,jsdw_gjqt,jsdw_gjry,data:data,page:page,totalpage:totalpage,zhicheng:zhicheng,suoxi:suoxi,search_txt:search_txt,zimu:i})
			}else{
				res.render('pages/teacherTeam/indexentest',{check_nav:'active_teacherteam',L:req.query['L'],jsdw_ys,jsdw_gjzj,jsdw_gjqn,jsdw_gjqt,jsdw_gjry,data:data,page:page,totalpage:totalpage,zhicheng:zhicheng,suoxi:suoxi,search_txt:search_txt,zimu:i})
			}
			
		})
	}
	else{
		console.log('------------------')
		if(zhicheng){
			console.log('只有职称---------',zhicheng)
			async.waterfall([
				function(cb){
					//get count
					let search
					if(zhicheng==1){
						search = user.find({rongyujibie:{$ne:null,$exists:true},display:1,$or:[{power:'教职工'},{power:'管理员'}]}).count()
					}else{
						search = user.find({peopleid:zhicheng,display:1,$or:[{power:'教职工'},{power:'管理员'}]}).count()
					}
						search.exec(function(err,count){
							if(err){
								console.log('user get total err',err)
								cb(err)
							}
							console.log('user count',count)
							total = count
							cb(null)
						})
				},
				function(cb){
					let search = cmsContent.findOne({'tag2':'师资概况'})
						search.exec(function(err,doc){
							if(err){
								cb(err)
							}
							data.szgk = doc
							cb()
						})
				},
				function(cb){
					//统计职称人数
					console.log('----------------- 分步统计职称人数 ----------------')
					async.waterfall([
						function(cbb){
							console.log('正常统计职称人数')
							let search = user.aggregate([
								{$match:{display:1,$or:[{power:'教职工'},{power:'管理员'}]}},
								{$group:{'_id':'$peopleid',num:{$sum:1}}},
								{$sort:{_id:1}}
							])
							search.exec(function(err,docs){
								if(err){
									cbb(err)
								}
								console.log('check -------',docs)
								docs.forEach(function(item,index){
									console.log('1    ----------------------------')
									console.log(item._id)
									item.zc = checkjstype(item._id)
								})
								data.zhichengNum = docs
								console.log(data.zhichengNum)
								console.log('----------------------------')
								cbb()
							})
						},
						function(cbb){
							console.log('统计杰出人才数量')
							let search = user.find({display:1,rongyujibie:{$ne:null,$exists:true},$or:[{power:'教职工'},{power:'管理员'}]}).count()
								search.exec(function(err,count){
									if(err){
										console.log('user get total err',err)
										cbb(err)
									}
									console.log('user count',count)
									let tempobj = {'_id':1,num:count,'zc':'杰出人才'}
									data.zhichengNum.unshift(tempobj)
									//(data.zhichengNum).sort(sort_id)
									console.log('最终zhihengNum  ----------------------------')
									console.log(data.zhichengNum)
									cbb(null)
								})
						}
					],function(error,results){
						if(error){
							cb(error)
						}
						cb()
					})
				},
				function(cb){
					//统计所系人数
					async.eachLimit(myarr,1,function(item,cbb){
						console.log('统计所系人数---item-------',item)
						let search = user.find({suoxiid:item,display:1,$or:[{power:'教职工'},{power:'管理员'}]}).count()
							search.exec(function(err,count){
								if(err){
									cbb(err)
								}
								temp.num = count
								temp.sx = checksuotype(item)
								temp._id = item
								temparr.push(temp)
								temp={}
								cbb()
							})
					},function(error){
						if(error){
							cb(error)
						}
						console.log('统计所系人数---temparr-----',temparr)
						data.suoxiNum = temparr
						cb()
					})
				},
				function(cb){
					console.log('aaa')
					let numSkip = (page-1)*limit
						limit = parseInt(limit)
					let search
					if(zhicheng==1){
						limit = 20
						search = user.find({display:1,rongyujibie:{$ne:null,$exists:true},$or:[{power:'教职工'},{power:'管理员'}]})
						search.sort({'rongyujibie':1})
					}else{
						search = user.find({display:1,peopleid:zhicheng,$or:[{power:'教职工'},{power:'管理员'}]})
					}
						// search.sort({'zhiwu':-1})
						search.sort({'userName_py':1})
						search.limit(limit)
						search.skip(numSkip)
						search.exec(function(error,docs){
							if(error){
								console.log('error',error)
								cb(error)
							}
							// let check = new RegExp('讲师')//院长，院长助理
							// let check1 = new RegExp('研究员')//所长
							// let check2 = new RegExp('教授')
							// let check3 = new RegExp('博士后')
							// docs.forEach(function(item){
							// 	if(item.zhiwu.match(check)){
							// 		//console.log('----item',item)
							// 		item.zhiwu=''
							// 	}
							// 	if(item.zhiwu.match(check1)){
							// 		//console.log('----item',item)
							// 		item.zhiwu=''
							// 	}
							// 	if(item.zhiwu.match(check2)){
							// 		//console.log('----item',item)
							// 		item.zhiwu=''
							// 	}
							// 	if(item.zhiwu.match(check3)){
							// 		//console.log('----item',item)
							// 		item.zhiwu=''
							// 	}
							// })	
							//console.log('docs-----',docs)	
							// let check = new RegExp('院')//院长，院长助理
							// let check1 = new RegExp('所')//所长

							// docs.forEach(function(item){
							// 	if(!item.zhiwu.match(check)){
							// 		//console.log('----item',item)
							// 		item.zhiwu=''
							// 	}
							// })
							data.jsdw = docs
							
							if(zhicheng==1){
								console.log('------------ 杰出人才 --------------')
								docs.forEach(function(item){
									if(parseInt(item.rongyujibie)==1){
										jsdw_ys.push(item)
									}
									if(parseInt(item.rongyujibie)==2){
										jsdw_gjzj.push(item)
									}
									if(parseInt(item.rongyujibie)==3){
										jsdw_gjqn.push(item)
									}
									if(parseInt(item.rongyujibie)==4){
										jsdw_gjqt.push(item)
									}
									if(parseInt(item.rongyujibie)==5){
										jsdw_gjry.push(item)
									}
								})
							}
							console.log('jsdw--------------------->',jsdw_ys.length,jsdw_gjzj.length,jsdw_gjqn.length,jsdw_gjqt.length,jsdw_gjry.length)
							cb(null)
						})
				},
			],function(error,result){
				if(error){
					return res.json(error)
				}
				totalpage = Math.ceil(total/limit)
				console.log('总页数------->',totalpage,zhicheng)
				if(req.query['L']=='1'){
					res.render('pages/teacherTeam/indextest',{check_nav:'active_teacherteam',L:req.query['L'],jsdw_ys,jsdw_gjzj,jsdw_gjqn,jsdw_gjqt,jsdw_gjry,data:data,page:page,totalpage:totalpage,zhicheng:zhicheng,suoxi:suoxi,search_txt:search_txt,zimu:i})
				}else{
					res.render('pages/teacherTeam/indexentest',{check_nav:'active_teacherteam',L:req.query['L'],jsdw_ys,jsdw_gjzj,jsdw_gjqn,jsdw_gjqt,jsdw_gjry,data:data,page:page,totalpage:totalpage,zhicheng:zhicheng,suoxi:suoxi,search_txt:search_txt,zimu:i})
				}
			})
		}
		if(suoxi){
			console.log('只有所系---------------',suoxi)
			async.waterfall([
				function(cb){
					//get count
					let search = user.find({suoxiid:suoxi,display:1,$or:[{power:'教职工'},{power:'管理员'}]}).count()
						search.exec(function(err,count){
							if(err){
								console.log('user get total err',err)
								cb(err)
							}
							console.log('user count',count)
							total = count
							cb(null)
						})
				},
				function(cb){
					let search = cmsContent.findOne({'tag2':'师资概况'})
						search.exec(function(err,doc){
							if(err){
								cb(err)
							}
							data.szgk = doc
							cb()
						})
				},
				function(cb){
					//统计职称人数
					async.eachLimit(myarr1,1,function(item,cbb){
						console.log('item-------',item)
						let search
						if(item==1){
							search = user.find({rongyujibie:{$ne:null,$exists:true},display:1,$or:[{power:'教职工'},{power:'管理员'}]}).count()
						}else{
							search = user.find({peopleid:item,display:1,$or:[{power:'教职工'},{power:'管理员'}]}).count()
						}
							search.exec(function(err,count){
								if(err){
									cbb(err)
								}
								temp.num = count
								temp.sx = checkjstype(item)
								temp._id = item
								temparr.push(temp)
								temp={}
								cbb()
							})
					},function(error){
						if(error){
							cb(error)
						}
						console.log('temparr-----',temparr)
						data.zhichengNum = temparr
						temparr = []
						cb()
					})
				},
				function(cb){
					//统计所系人数
					async.eachLimit(myarr,1,function(item,cbb){
						console.log('item-------',item)
						let search = user.find({suoxiid:item,display:1,$or:[{power:'教职工'},{power:'管理员'}]}).count()
							search.exec(function(err,count){
								if(err){
									cbb(err)
								}
								temp.num = count
								temp.sx = checksuotype(item)
								temp._id = item
								temparr.push(temp)
								temp={}
								cbb()
							})
					},function(error){
						if(error){
							cb(error)
						}
						console.log('temparr-----',temparr)
						data.suoxiNum = temparr
						cb()
					})
				},
				function(cb){
					console.log('aaa')
					let numSkip = (page-1)*limit
						limit = parseInt(limit)
					let search = user.find({suoxiid:suoxi,$or:[{power:'教职工'},{power:'管理员'}]})
						search.where({'display':1})	
						search.sort({'yanjiusuosort':1})
						//search.sort({'userName_py':1})

						search.limit(limit)
						search.skip(numSkip)
						search.exec(function(error,docs){
							if(error){
								console.log('error',error)
								cb(error)
							}	
							//console.log('docs-----',docs)	
							// let check = new RegExp('讲师')//院长，院长助理
							// let check1 = new RegExp('研究员')//所长
							// let check2 = new RegExp('教授')
							// let check3 = new RegExp('博士后')
							// docs.forEach(function(item){
							// 	if(item.zhiwu.match(check)){
							// 		//console.log('----item',item)
							// 		item.zhiwu=''
							// 	}
							// 	if(item.zhiwu.match(check1)){
							// 		//console.log('----item',item)
							// 		item.zhiwu=''
							// 	}
							// 	if(item.zhiwu.match(check2)){
							// 		//console.log('----item',item)
							// 		item.zhiwu=''
							// 	}
							// 	if(item.zhiwu.match(check3)){
							// 		//console.log('----item',item)
							// 		item.zhiwu=''
							// 	}
							// })
							//docs.sort(sort_yjs('yanjiusuosort'))
							data.jsdw = docs
							cb(null)
						})
				},
			],function(error,result){
				if(error){
					return res.json(error)
				}
				totalpage = Math.ceil(total/limit)
				console.log('总页数------->',totalpage)
				if(req.query['L']=='1'){
					res.render('pages/teacherTeam/indextest',{check_nav:'active_teacherteam',L:req.query['L'],data:data,page:page,totalpage:totalpage,zhicheng:zhicheng,suoxi:suoxi,search_txt:search_txt,zimu:i})
				}else{
					res.render('pages/teacherTeam/indexentest',{check_nav:'active_teacherteam',L:req.query['L'],data:data,page:page,totalpage:totalpage,zhicheng:zhicheng,suoxi:suoxi,search_txt:search_txt,zimu:i})
				}
			})
		}
		if(!zhicheng&&!suoxi){
			console.log('----- 没有限制条件-----')
			async.waterfall([
				function(cb){
					//get count
					let search = user.find({display:1,$or:[{power:'教职工'},{power:'管理员'}]}).count()
						search.exec(function(err,count){
							if(err){
								console.log('user get total err',err)
								cb(err)
							}
							console.log('user count',count)
							total = count
							cb(null)
						})
				},
				function(cb){
					let search = cmsContent.findOne({'tag2':'师资概况'})
						search.exec(function(err,doc){
							if(err){
								cb(err)
							}
							data.szgk = doc
							cb()
						})
				},
				function(cb){
					//统计职称人数
					console.log('----------------- 分步统计职称人数 ----------------')
					async.waterfall([
						function(cbb){
							console.log('正常统计职称人数')
							let search = user.aggregate([
								{$match:{display:1,$or:[{power:'教职工'},{power:'管理员'}]}},
								{$group:{'_id':'$peopleid',num:{$sum:1}}},
								{$sort:{_id:1}}
							])
							search.exec(function(err,docs){
								if(err){
									cbb(err)
								}
								console.log('check -------',docs)
								docs.forEach(function(item,index){
									console.log('1    ----------------------------')
									console.log(item._id)
									item.zc = checkjstype(item._id)
								})
								data.zhichengNum = docs
								console.log(data.zhichengNum)
								console.log('----------------------------')
								cbb()
							})
						},
						function(cbb){
							console.log('统计杰出人才数量')
							let search = user.find({display:1,rongyujibie:{$ne:null,$exists:true},$or:[{power:'教职工'},{power:'管理员'}]}).count()
								search.exec(function(err,count){
									if(err){
										console.log('user get total err',err)
										cbb(err)
									}
									console.log('user count',count)
									let tempobj = {'_id':1,num:count,'zc':'杰出人才'}
									data.zhichengNum.unshift(tempobj)
									//data.zhichengNum.sort(sort_id)
									console.log('最终zhihengNum  ----------------------------')
									console.log(data.zhichengNum)
									cbb(null)
								})
						}
					],function(error,results){
						if(error){
							cb(error)
						}
						cb()
					})
					
				},
				function(cb){
					//统计所系人数
					async.eachLimit(myarr,1,function(item,cbb){
						console.log('item-------',item)
						let search = user.find({suoxiid:item,display:1,$or:[{power:'教职工'},{power:'管理员'}]}).count()
							search.exec(function(err,count){
								if(err){
									cbb(err)
								}
								temp.num = count
								temp.sx = checksuotype(item)
								temp._id = item
								temparr.push(temp)
								temp={}
								cbb()
							})
					},function(error){
						if(error){
							cb(error)
						}
						console.log('temparr-----',temparr)
						data.suoxiNum = temparr
						cb()
					})
				},
				function(cb){
					console.log('aaa')
					let numSkip = (page-1)*limit
						limit = parseInt(limit)
					let search = user.find({$or:[{power:'教职工'},{power:'管理员'}]})
						search.where({'display':1})
						search.sort({'userName_py':1})
						search.limit(limit)
						search.skip(numSkip)
						search.exec(function(error,docs){
							if(error){
								console.log('error',error)
								cb(error)
							}	
							//console.log('docs-----',docs)	
							// let check = new RegExp('讲师')//院长，院长助理
							// let check1 = new RegExp('研究员')//所长
							// let check2 = new RegExp('教授')
							// let check3 = new RegExp('博士后')
							// docs.forEach(function(item){
							// 	if(item.zhiwu.match(check)){
							// 		//console.log('----item',item)
							// 		item.zhiwu=''
							// 	}
							// 	if(item.zhiwu.match(check1)){
							// 		//console.log('----item',item)
							// 		item.zhiwu=''
							// 	}
							// 	if(item.zhiwu.match(check2)){
							// 		//console.log('----item',item)
							// 		item.zhiwu=''
							// 	}
							// 	if(item.zhiwu.match(check3)){
							// 		//console.log('----item',item)
							// 		item.zhiwu=''
							// 	}
							// })
							data.jsdw = docs
							cb(null)
						})
				},
			],function(error,result){
				if(error){
					return res.json(error)
				}
				totalpage = Math.ceil(total/limit)
				console.log('总页数------->',totalpage)
				if(req.query['L']=='1'){
					res.render('pages/teacherTeam/indextest',{check_nav:'active_teacherteam',L:req.query['L'],data:data,page:page,totalpage:totalpage,zhicheng:zhicheng,suoxi:suoxi,search_txt:search_txt,zimu:i})
				}else{
					res.render('pages/teacherTeam/indexentest',{check_nav:'active_teacherteam',L:req.query['L'],data:data,page:page,totalpage:totalpage,zhicheng:zhicheng,suoxi:suoxi,search_txt:search_txt,zimu:i})
				}				
			})
		}
	}	
})
function sort_yjs (keyName) {
	return function (objectN, objectM) {
	 var valueN = objectN[keyName]
	 var valueM = objectM[keyName]
	 if (valueN < valueM) return 1
	 else if (valueN > valueM) return -1
	 else return 0
	}
}

function sort_id(a,b){
	return a._id - b._id
}
//个人主页
router.get('/pages/user/index',function(req,res){
	let id = req.query.id
	if(!id){
		return res.json('wrong arg')
	}
	let search = user.findOne({id:id})
		search.exec(function(err,doc){
			if(err){
				return res.json({'errMsg':err})
			}
			if(!doc){
				return res.json({'errMsg':'no result'})
			}
			if(req.query['L']=='1'){
				res.render('pages/user/index',{L:req.query['L'],data:doc,check_nav:'active_teacherteam'})
			}else{
				res.render('pages/user/indexen',{L:req.query['L'],data:doc,check_nav:'active_teacherteam'})
			}
			
		})
})
router.get('/pages/teacherTeam/index1',function(req,res){
	let page = req.query.p,
		limit = req.query.limit,
		search_txt = req.query.s,
		zhicheng = req.query.zc,
		suoxi = req.query.sx
	//职称可能有 两个 分割考虑
	if(!page){page = 1}
	if(!limit){limit = 9 }//8
	let total = 0,data = {},totalpage = 0
	console.log('page limit',page,limit,search_txt,zhicheng,suoxi)
	let obj = {},aggregate_obj_zc = {},aggregate_obj_sx = {}
	if(search_txt){}
	else{
		console.log('没有搜索')
		if(zhicheng && suoxi){
			obj = {zhicheng:zhicheng,suoxi:suoxi,$or:[{power:'教职工'},{power:'管理员'}]}
			aggregate_obj = {zhicheng:zhicheng,suoxi:suoxi,$or:[{power:'教职工'},{power:'管理员'}]}
		}
		if(zhicheng && !suoxi){
			console.log('职称 ')
			obj = {zhicheng:zhicheng,$or:[{power:'教职工'},{power:'管理员'}]}
			aggregate_obj_zc = {$or:[{power:'教职工'},{power:'管理员'}]}
			aggregate_obj_sx = {zhicheng:zhicheng,$or:[{power:'教职工'},{power:'管理员'}]}
		}
		if(!zhicheng && suoxi){
			console.log('所 ')
			obj = {suoxi:suoxi,$or:[{power:'教职工'},{power:'管理员'}]}
			aggregate_obj = {suoxi:suoxi,$or:[{power:'教职工'},{power:'管理员'}]}
		}
		if(!zhicheng && !suoxi){
			console.log('nothing')
			obj = {$or:[{power:'教职工'},{power:'管理员'}]}
			aggregate_obj = {$or:[{power:'教职工'},{power:'管理员'}]}
		}
		async.waterfall([
			function(cb){
				//get count
				let search = user.find(obj).count()
					search.exec(function(err,count){
						if(err){
							console.log('user get total err',err)
							cb(err)
						}
						console.log('user count',count)
						total = count
						cb(null)
					})
			},
			function(cb){
				let numSkip = (page-1)*limit
					limit = parseInt(limit)
					console.log('obj-----------------',obj)
					async.waterfall([
						function(cbb){
							console.log('jstype -------')
							let search = user.aggregate([
								{$match:aggregate_obj_zc},
								{$group:{'_id':'$peopleid',num:{$sum:1}}},
								{$sort:{_id:1}}
							])
							search.exec(function(err,docs){
								if(err){
									cbb(err)
								}
								console.log('check -------',docs)
								docs.forEach(function(item,index){
									item.zc = checkjstype(item._id)
								})
								data.zhichengNum = docs
								console.log(data.zhichengNum)
								cbb()
							})
						},
						function(cbb){
							console.log('suoxi -------')
							let search = user.aggregate([
								{$match:aggregate_obj_sx},
								{$group:{'_id':'$suoxiid',num:{$sum:1}}},
								{$sort:{_id:1}}
							])
							search.exec(function(err,docs){
								if(err){
									cbb(err)
								}
								docs.forEach(function(item,index){
									item.sx = checksuotype(item._id)
								})
								console.log('check -------',docs)
								data.suoxiNum = docs
								cbb()
							})
						},
						function(cbb){
							console.log('aaa',obj)
							let search = user.find(obj)
								search.sort({'isTop':-1})//正序
								search.sort({'timeAdd':-1})
								search.sort({'isDisplay':1})
								search.limit(limit)
								search.skip(numSkip)
								search.exec(function(error,docs){
									if(error){
										console.log('error',error)
										cb(error)
									}	
									console.log('docs-----',docs)	
									data.jsdw = docs
									cbb(null)
								})
						},
						function(cbb){
							let search = cmsContent.findOne({'tag2':'师资概况'})
								search.exec(function(err,doc){
									if(err){
										cb(err)
									}
									data.szgk = doc
									cbb()
								})
						}
					],function(error,result){
						if(error){
							return cb(error)
						}
						console.log('总页数------->',total,limit)
						totalpage = Math.ceil(total/limit)
						console.log('总页数------->',totalpage)
						cb()
					})
			}
		],function(error,result){
			if(error){
				console.log('teacher async waterfall error',error)
				return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
			}
			console.log(data.zhichengNum)
			if(zhicheng=='教授'||zhicheng=='研究员'){
				zhicheng='教授/研究员'
			}
			if(zhicheng=='副教授'||zhicheng=='副研究员'){
				zhicheng='副教授/副研究员'
			}
			res.render('pages/teacherTeam/index',{L:req.query['L'],data:data,count:total,page:page,totalpage:totalpage,zhicheng:zhicheng,suoxi:suoxi,search_txt:search_txt})
		})
	}
})
function checksuotype(arg){
	if(arg==1){
		return '高性能计算研究所'
	}
	else if(arg==2){
		return '大数据技术与应用研究所'
	}
	else if(arg==3){
		return '未来媒体技术与计算研究所'
	}
	else if(arg==4){
		return '网络与信息安全研究所'
	}
	else if(arg==5){
		return '计算机视觉研究所'
	}
	else if(arg==6){
		return '智能技术与系统集成研究所'
	}
	else if(arg==7){
		return '物联网研究中心'
	}
	else if(arg==8){
		return '可视计算研究中心'
	}
	else if(arg==9){
		return '教学系'
	}
	else if(arg==10){
		return '院办管理/技术人员'
	}
	else if(arg==11){
		return '软件工程研究中心'
	}
	else{
		return '其它'
	}
}
function checkjstype(arg){
	if(arg == 1){
		return '杰出人才'
	}
	else if (arg==2){
		return '教授'
	}
	else if (arg==3){
		return '副教授'
	}
	else if (arg==4){
		return '讲师'
	}
	else if (arg==5){
		return '助理教授'
	}
	else if (arg==6){
		return '研究员'
	}
	else if (arg==7){
		return '博士后'
	}
	else if (arg==8){
		return '技术/管理人员'
	}
	else if(arg==9){
		return '研究/辅助管理'
	}
	else{
		return '副研究员'
	}
}
//临时用，更新人员peopleid
router.get('/pages/teacherTeam/update',function(req,res){
	let obj = {}
	let search = user.find({$or:[{power:'管理员'},{power:'教职工'}]})
		search.exec(function(error,docs){
			if(error){
				return res.json(error)
			}
			async.eachLimit(docs,1,function(item,cb){
				if(item.jstype=='杰出人才'||item.zhicheng=='杰出人才'){
					obj = {peopleid:1}
				}
				if(item.jstype=='教授'||item.zhicheng=='教授'){
					obj = {peopleid:2}
				}
				if(item.jstype=='副教授'||item.zhicheng=='副教授'){
					obj = {peopleid:3}
				}
				if(item.jstype=='副研究员'||item.zhicheng=='副研究员'){
					obj = {peopleid:3}
				}
				if(item.jstype=='助理教授'||item.zhicheng=='助理教授'){
					obj = {peopleid:4}
				}
				if(item.jstype=='讲师'||item.zhicheng=='讲师'){
					obj = {peopleid:5}
				}
				if(item.jstype=='博士后'||item.zhicheng=='博士后'){
					obj = {peopleid:6}
				}
				if(item.jstype=='研究/管理助理'||item.zhicheng=='研究/管理助理'){
					obj = {peopleid:7}
				}
				user.updateOne({id:item.id},obj,function(err1){
					if(err1){
						cb(err1)
					}
					console.log('ok')
					cb()
				})
			},function(err){
				if(err){
					console.log(err)
					return res.json(err)
				}
				return res.json({'msg':'ok'})
			})
		})
}).get('/pages/teacherTeam/update1',function(req,res){
	let obj = {}
	let search = user.find({$or:[{power:'管理员'},{power:'教职工'}]})
		search.exec(function(error,docs){
			if(error){
				return res.json(error)
			}
			async.eachLimit(docs,1,function(item,cb){
				if(item.suoxi=='高性能计算研究所'){
					obj = {suoxiid:1}
				}
				else if(item.suoxi=='大数据技术与应用研究所'){
					obj = {suoxiid:2}
				}
				else if(item.suoxi=='未来媒体技术与计算研究所'){
					obj = {suoxiid:3}
				}
				else if(item.suoxi=='网络与信息安全研究所'){
					obj = {suoxiid:4}
				}
				else if(item.suoxi=='计算机视觉研究所'){
					obj = {suoxiid:5}
				}
				else if(item.suoxi=='智能技术与系统集成研究所'){
					obj = {suoxiid:6}
				}
				else if(item.suoxi=='物联网研究中心'){
					obj = {suoxiid:7}
				}
				else if(item.suoxi=='可视计算研究中心'){
					obj = {suoxiid:8}
				}
				else{
					obj = {suoxiid:9,suoxi:'其它'}
				}
				user.updateOne({id:item.id},obj,function(err1){
					if(err1){
						cb(err1)
					}
					console.log('ok')
					cb()
				})
			},function(err){
				if(err){
					console.log(err)
					return res.json(err)
				}
				return res.json({'msg':'ok'})
			})
		})
}).get('/pages/teacherTeam/updatedisplay',function(req,res){
	let obj = {}
	let search = user.find({$or:[{power:'管理员'},{power:'教职工'}]})
		search.exec(function(error,docs){
			if(error){
				return res.json(error)
			}
			async.eachLimit(docs,1,function(item,cb){
				obj={display:1}
				user.updateOne({id:item.id},obj,function(err1){
					if(err1){
						cb(err1)
					}
					console.log('ok')
					cb()
				})
			},function(err){
				if(err){
					console.log(err)
					return res.json(err)
				}
				return res.json({'msg':'ok'})
			})
		})
})

router.get('/pages/regulation/index',function(req,res){
	let page = req.query.p,
		limit = req.query.limit,
		search_txt = req.query.search_txt
	if(!page){page = 1}
	if(!limit){limit = 8 }
	let total = 0,data={}
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			let search = cmsContent.find({'tag2':'党建活动',isDisplay:1}).count()
				search.exec(function(err,count){
					if(err){
						console.log('get total err',err)
						cb(err)
					}
					console.log(' count',count)
					total = count
					cb(null)
				})
		},
		function(cb){
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			console.log('不带搜索参数')
			let search = cmsContent.find({tag2:'党建活动',isDisplay:1})
				//search.where('isDelete').equals(0)
				//search.sort({'id':-1})
				search.sort({'isTop':-1})//正序
				search.sort({'plusN':-1})
				search.sort({'sortbyhand':-1})
				search.sort({'timeAdd':-1})
				//search.sort({'isDisplay':1})
				search.limit(limit)
				search.skip(numSkip)
				search.exec(function(error,docs){
					if(error){
						console.log('djhd_data error',error)
						cb(error)
					}
					docs.forEach(function(item,index){
						item.timeAdd = (item.timeAdd).slice(0,10)
					})
					data.djhd = docs
					cb(null)
				})
		}
	],function(error,result){
		if(error){
			console.log(' async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		//console.log(' async waterfall success',data)
		let totalpage = Math.ceil(total/limit)
		res.render('pages/regulation/index',{check_nav:'active_regulation',L:req.query['L'],data:data,count:total,page:page,totalpage:totalpage})
	})
}).get('/pages/regulation/constitute',function(req,res){
	let search = cmsContent.findOne({})
	search.where('tag2').equals('组织概况')
	search.exec(function(err,doc){
		if(err){
			return res.send(err)
		}
		res.render('pages/regulation/constitute',{check_nav:'active_regulation',L:req.query['L'],data:doc})
	})
}).get('/pages/regulation/rules',function(req,res){
	let page = req.query.p,
	limit = req.query.limit
	if(!page){page = 1}
	if(!limit){limit = 8 }
	let total = 0,data={}
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			let search = cmsContent.find({'tag2':'规章制度',isDisplay:1}).count()
				search.exec(function(err,count){
					if(err){
						console.log('get total err',err)
						cb(err)
					}
					console.log(' count',count)
					total = count
					cb(null)
				})
		},
		function(cb){
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			console.log('不带搜索参数')
			let search = cmsContent.find({tag2:'规章制度',isDisplay:1})
				//search.where('isDelete').equals(0)
				//search.sort({'id':-1})
				
				search.sort({'isTop':-1})//正序
				search.sort({'plusN':-1})
				search.sort({'sortbyhand':-1})
				search.sort({'timeAdd':-1})
				search.sort({'isDisplay':1})
				search.limit(limit)
				search.skip(numSkip)
				search.exec(function(error,docs){
					if(error){
						console.log('djhd_data error',error)
						cb(error)
					}
					docs.forEach(function(item,index){
						item.timeAdd = (item.timeAdd).slice(0,10)
					})
					data.gzzd = docs
					cb(null)
				})
		}
	],function(error,result){
		if(error){
			console.log(' async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log(' async waterfall success',data)
		let totalpage = Math.ceil(total/limit)
		res.render('pages/regulation/rules',{check_nav:'active_regulation',L:req.query['L'],data:data,count:total,page:page,totalpage:totalpage})
	})
}).get('/pages/regulation/study',function(req,res){
	let page = req.query.p,
	limit = req.query.limit
	if(!page){page = 1}
	if(!limit){limit = 8 }
	let total = 0,data={}
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			let search = cmsContent.find({'tag2':'学习园地',isDisplay:1}).count()
				search.exec(function(err,count){
					if(err){
						console.log('get total err',err)
						cb(err)
					}
					console.log(' count',count)
					total = count
					cb(null)
				})
		},
		function(cb){
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			console.log('不带搜索参数')
			let search = cmsContent.find({tag2:'学习园地',isDisplay:1})
				//search.where('isDelete').equals(0)
				
				search.sort({'isTop':-1})//正序
				search.sort({'plusN':-1})
				search.sort({'sortbyhand':-1})
				search.sort({'timeAdd':-1})
				//search.sort({'isDisplay':1})
				search.limit(limit)
				search.skip(numSkip)
				search.exec(function(error,docs){
					if(error){
						console.log('djhd_data error',error)
						cb(error)
					}
					docs.forEach(function(item,index){
						item.timeAdd = (item.timeAdd).slice(0,10)
					})
					data.xxyd = docs
					cb(null)
				})
		}
	],function(error,result){
		if(error){
			console.log(' async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		//console.log(' async waterfall success',data)
		let totalpage = Math.ceil(total/limit)
		res.render('pages/regulation/study',{check_nav:'active_regulation',L:req.query['L'],data:data,count:total,page:page,totalpage:totalpage})
	})
}).get('/pages/regulation/details',function(req,res){
	let id = req.query.id
	if(!id){
		return res.json('wrong arg')
	}
	let search = cmsContent.findOne({'id':id})
		search.exec(function(error,doc){
			if(error){
				return res.json(error.message)
			}
			if(!doc){
				return res.json({'msg':'No result'})
			}
			console.log(doc)
			res.render('pages/regulation/details',{check_nav:'active_regulation',L:req.query['L'],data:doc})
		})
})
router.get('/pages/news/index',function(req,res){
	console.log('router news_data')
	let page = req.query.p,//页面
		leixing = req.query.type,
		limit = req.query.limit,
		search_txt = req.query.search_txt
	let obj = {}
	if(!page){page = 1}
	if(!limit){limit = 15 }//8
	if(!leixing){leixing = 1 }
	if(leixing==1||leixing=='科研动态'){
		leixing='科研动态'
		obj = {leixing:leixing,$or:[{tag2:'计软新闻'},{trees:'179-181-'}]}
	}
	if(leixing==2||leixing=='合作交流'){
		leixing='国际交流'
		obj = {leixing:leixing,$or:[{tag2:'计软新闻'},{trees:'179-181-'}]}
	}
	if(leixing==3||leixing=='学生工作'){
		leixing='学生工作'
		obj = {leixing:leixing,$or:[{tag2:'计软新闻'},{trees:'179-181-'}]}
	}
	if(leixing==4||leixing=='党务行政'){
		leixing='党务行政'
		obj = {leixing:leixing,$or:[{tag2:'计软新闻'},{trees:'179-181-'}]}
	}
	if(leixing==5||leixing=='学术讲座'){
		leixing='学术讲座'
		obj = {leixing1:leixing,$or:[{tag2:'通知公告'},{trees:'179-182-'}]}
	}
	if(leixing==6||leixing=='教务教学'){
		leixing='教务教学'
		obj = {leixing1:leixing,$or:[{tag2:'通知公告'},{trees:'179-182-'}]}
	}
	let total = 0,data={}
	console.log('page limit',page,limit)
	obj['isDisplay']=1
	console.log('check obj -------',obj)
	async.waterfall([
		function(cb){
			//get count
			let search = cmsContent.find(obj).count()
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
				console.log('obj-------------------',obj)
				let search = cmsContent.find(obj)
					//search.where('isDelete').equals(0)
					search.sort({'isTop':-1})
					search.sort({'plusN':-1})
					search.sort({'sortbyhand':-1})
					search.sort({'timeAdd':-1})
					search.sort({'timeAddStamp':-1})
					//search.sort({'isDisplay':1})
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('news_data error',error)
							cb(error)
						}
						data = docs
						data.forEach(function(item,index){
							item.timeAdd = (item.timeAdd).slice(0,10)
						})
						cb(null)
					})
		}
	],function(error,result){
		if(error){
			console.log('news async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('news async waterfall success')
		let totalpage = Math.ceil(total/limit)
		if(leixing=='国际交流'){
			leixing = '合作交流'
		}
		res.render('pages/news/index',{check_nav:'active_news',L:req.query['L'],data:data,leixing:leixing,count:total,page:page,totalpage:totalpage})
	})
}).get('/pages/news/details',function(req,res){
	let id = req.query.id,data={}
	if(!id){
		return res.json('wrong arg')
	}
	let search = cmsContent.findOne({'id':id})
		search.exec(function(error,doc){
			if(error){
				return res.json(error.message)
			}
			if(!doc){
				return res.json({'msg':'No result'})
			}
			res.render('pages/news/details',{check_nav:'active_news',L:req.query['L'],data:doc})
		})
})
router.get('/pages/globalCooperation/coresearch',function(req,res){
	async.waterfall([
		function(cb){
			console.log('不带搜索参数')
			let search = cmsContent.find({'tag2':'科研合作'})
				search.where('isDelete').equals(0)
				search.sort({'id':-1})
				search.sort({'isTop':-1})//正序
				search.sort({'timeAdd':-1})
				search.sort({'isDisplay':1})
				search.exec(function(error,docs){
					if(error){
						console.log('error',error)
						cb(error)
					}
					cb(null,docs)
				})
			
		}
	],function(error,result){
		if(error){
			console.log('hzhb_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('hzhb_data async waterfall success',result)
		if(req.query['L']=='1'){
			res.render('pages/globalCooperation/index',{L:req.query['L'],data:result,check_nav:'active_globalcooperation'})
		}else{
			res.render('pages/globalCooperation/indexen',{L:req.query['L'],data:result,check_nav:'active_globalcooperation'})
		}
	})
}).get('/pages/globalCooperation/jointTraining',function(req,res){
	async.waterfall([
		function(cb){
			console.log('不带搜索参数')
			let search = cmsContent.find({'tag2':'联合培养'})
				search.sort({'hbsort':1})
				search.exec(function(error,docs){
					if(error){
						console.log('hzhb_data error',error)
						cb(error)
					}
					cb(null,docs)
				})
			
		}
	],function(error,result){
		if(error){
			console.log('hzhb_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('hzhb_data async waterfall success',result)
		result.forEach(function(item,index){
			item.img1 = (item.fujianPath).split(';')[0]
			item.img2 = (item.fujianPath).split(';')[1]
		})
		if(req.query['L']=='1'){
			res.render('pages/globalCooperation/jointTraining',{L:req.query['L'],data:result,check_nav:'active_globalcooperation'})
		}else{
			res.render('pages/globalCooperation/jointTrainingen',{L:req.query['L'],data:result,check_nav:'active_globalcooperation'})
		}
	})
}).get('/pages/globalCooperation/partner',function(req,res){
	async.waterfall([
		function(cb){
			console.log('不带搜索参数')
			let search = cmsContent.find({'tag2':'合作伙伴'})
				search.where('isDelete').equals(0)
				search.sort({'hbsort':1})
				
				search.exec(function(error,docs){
					if(error){
						console.log('hzhb_data error',error)
						cb(error)
					}
					cb(null,docs)
				})
		}
	],function(error,result){
		if(error){
			console.log('hzhb_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('hzhb_data async waterfall success',result)
		if(req.query['L']=='1'){
			res.render('pages/globalCooperation/partner',{L:req.query['L'],data:result,check_nav:'active_globalcooperation'})
		}else{
			res.render('pages/globalCooperation/partneren',{L:req.query['L'],data:result,check_nav:'active_globalcooperation'})
		}
	})
})
router.get('/pages/recruitment/doctor',function(req,res){
	if(req.query['L']!=1){
		res.redirect('admission')
	}else{
		console.log('in bsszs')
		let search = cmsContent.findOne({tag2:'博士生招生'})
			search.exec(function(err,doc){
				if(err){
					return res.send(err)
				}
				res.render('pages/recruitment/doctor',{L:req.query['L'],data:doc,check_nav:'active_recruitment'})
			})
	}
}).get('/pages/recruitment/admission',function(req,res){
	console.log('in bsszs')
	let search = cmsContent.findOne({tag2:'留学生招生'})
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('pages/recruitment/admission',{L:req.query['L'],data:doc,check_nav:'active_admission'})
		})
}).get('/pages/recruitment/position',function(req,res){
	console.log('in bsszs')
	let search = cmsContent.findOne({tag2:'faculty'})
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('pages/recruitment/position',{L:req.query['L'],data:doc,check_nav:'active_position'})
		})
}).get('/pages/recruitment/master',function(req,res){
	console.log('router news_data')
	if(req.query['L']!=1){
		res.redirect('admission')
	}else{
		let page = req.query.page,
			limit = req.query.limit
			if(!page){page = 1}
			if(!limit){limit = 8 }
		let total = 0,data = {}
		console.log('page limit',page,limit)
		async.waterfall([
			function(cb){
				//get count
				let search = cmsContent.find({'tag2':'硕士生招生',isDisplay:1}).count()
					search.exec(function(err,count){
						if(err){
							console.log('ssszs_data get total err',err)
							cb(err)
						}
						console.log('ssszs_data count',count)
						total = count
						cb(null)
					})
			},
			function(cb){
				let numSkip = (page-1)*limit
				limit = parseInt(limit)
					console.log('不带搜索参数')
					let search = cmsContent.find({'tag2':'硕士生招生',isDisplay:1})
						//search.where('isDelete').equals(0)
						//search.sort({'year':-1})
						search.sort({'isTop':-1})
						search.sort({'plusN':-1})
						search.sort({'sortbyhand':-1})
						search.sort({'timeAdd':-1})
						//search.sort({'isDisplay':1})
						search.limit(limit)
						search.skip(numSkip)
						search.exec(function(error,docs){
							if(error){
								console.log('ssszs_data error',error)
								cb(error)
							}
							docs.forEach(function(item,index){
								item.timeAdd = (item.timeAdd).slice(0,10)
							})
							data.ssszs = docs
							cb(null)
						})
			}
		],function(error,result){
			if(error){
				console.log('ssszs async waterfall error',error)
				return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
			}
			let totalpage = Math.ceil(total/limit)
			res.render('pages/recruitment/master',{L:req.query['L'],data:data,count:total,page:page,totalpage:totalpage,check_nav:'active_recruitment'})
		})
	}
	
}).get('/pages/recruitment/details',function(req,res){
	let id = req.query.id,data={}
	if(!id){
		return res.json('wrong arg')
	}
	let search = cmsContent.findOne({'id':id})
		search.exec(function(error,doc){
			if(error){
				return res.json(error.message)
			}
			if(!doc){
				return res.json({'msg':'No result'})
			}
			res.render('pages/recruitment/details',{L:req.query['L'],data:doc,check_nav:'active_recruitment'})
		})
}).get('/pages/recruitment/talents',function(req,res){
	console.log('router rczp_data')
	let page = req.query.p,
		limit = req.query.limit,
		type = req.query.t
	if(!type){
		type = '教师招聘'
	}else{
		console.log('type')
		type = decodeURIComponent(type)

	}
	let obj = {tag2:'人才招聘',zplx:type,isDisplay:1}
	console.log('obj ------>' ,obj,type)
	//return
	if(!page){page = 1}
	if(!limit){limit = 8 }
	let total = 0,data={}
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let search = cmsContent.find(obj).count()
				search.exec(function(err,count){
					if(err){
						console.log('rczp_data get total err',err)
						cb(err)
					}
					console.log('rczp_data count',count)
					total = count
					cb(null)
				})
		},
		function(cb){
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
				console.log('不带搜索参数')
				let search = cmsContent.find(obj)
					//search.where('isDelete').equals(0)
					//search.sort({'id':-1})
					//search.sort({'year':-1})
					search.sort({'isTop':-1})
					search.sort({'plusN':-1})
					search.sort({'sortbyhand':-1})
					search.sort({'timeAdd':-1})
					//search.sort({'isDisplay':1})
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('rczp_data error',error)
							cb(error)
						}
						docs.forEach(function(item,index){
							item.timeAdd = (item.timeAdd).slice(0,10)
						})
						data.rczp = docs
						cb(null)
					})
		},
		function(cb){
			let search = cmsContent.aggregate([
				{$match:{tag2:'人才招聘',isDisplay:1}},
				{$group:{'_id':'$zplx',num:{$sum:1}}},
				{$sort:{zplx:-1}}
			])
			search.exec(function(err,docs){
				if(err){
					cbb(err)
				}
				console.log('check -------',docs)
				data.rczpNum = docs
				cb()
			})
		}
	],function(error,result){
		if(error){
			console.log('rczp_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		let totalpage = Math.ceil(total/limit)
		res.render('pages/recruitment/talents',{L:req.query['L'],data:data,count:total,page:page,totalpage:totalpage,type:type,check_nav:'active_recruitment'})
	})
}).get('/pages/recruitment/index',function(req,res){
	if(req.query['L']!=1){
		res.redirect('admission')
	}else{
		let zhuanye = req.query.bsort,//中文名表示，用来选中左侧菜单
			info = req.query.info,
			z = 1 //数字表示
		if(!zhuanye){
			zhuanye = 1
		}
		// if(zhuanye == 1){
		// 	zhuanye = '计算机科学与技术'
		// }else{
		// 	zhuanye = '计算机科学与技术（卓越班）'
		// 	z=2
		// }
		// else{
		// 	zhuanye = '软件工程（腾班）'
		// 	z=3
		// }
		let data = {},lmenu=[],allinfo={}
		console.log(zhuanye)
		async.waterfall([
			function(cb){
				let search = bkzs.findOne({bsort:zhuanye})
					//search.sort({'timeAdd':-1})
					search.exec(function(error,docs){
						if(error){
							console.log('bkzs_data error',error)
							cb(error)
						}
						data = docs
						console.log(data)
						cb(null)
					})
			},
			function(cb){
				//获取左侧菜单
				let search = bkzs.find({})
					search.sort({bsort:1})
					search.exec(function(err,docs){
						if(err){
							cb(err)
						}
						
						docs.forEach(function(item,index){
							lmenu.push(item.zhuanye)
						})
						console.log('check lmenu-----',lmenu)
						//lmenu = docs
						cb()
					})
			},
			function(cb){
				let search = bkzsinfo.findOne({})
					search.exec(function(err,docs){
						if(err){
							cb(err)
						}
						console.log('check info -----',docs)
						allinfo = docs
						cb()
					})
			}
		],function(error,result){
			if(error){
				console.log('hzhb_data async waterfall error',error)
				return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
			}
			//console.log('hzhb_data async waterfall success',result)
			if(info==1){data.info = allinfo.xuefei,info='学费与住宿'}
			else if(info==2){data.info = allinfo.jxj,info='奖学金'}
			else if(info==3){data.info = allinfo.jiuye,info='就业情况'}
			else if(info==4){data.info = allinfo.xyhj,info='校园环境'}
			else if(info==5){data.info = allinfo.lxfs,info='联系方式'}
			else if(info==6){data.info = allinfo.zsqk,info='招生情况'}
			else{info=0}
			//console.log(data.info,info)
			console.log(data.patharr.length)
			//return 
			res.render('pages/recruitment/index',{check_nav:'active_recruitment',L:req.query['L'],data:data,zhuanye:data.zhuanye,z:data.bsort,info:info,patharr:data.patharr,namearr:data.namearr,lmenu:lmenu})
		})
	}
	
})
router.get('/pages/organization/jxxdetails',function(req,res){
	let search = cmsContent.findOne({id:req.query.id})
		search.exec(function(err,doc){
			if(err){
				res.send(err)
			}
			res.render('pages/organization/jxxdetails',{L:req.query['L'],check_nav:'active_organization',data:doc})
		})
})
router.get('/pages/organization/departments',function(req,res){
	let data = {},type = req.query.t,content={}
	console.log('type----',type)
	if(req.query['L']=='1'){
		if(!type){type = '计算机科学与技术系'}
	}else{
		if(!type){type = 'Department of Computer Science and Technology'}
	}
	
	async.waterfall([
		function(cb){
			console.log('不带搜索参数')
			let search = cmsContent.find({'tag2':'教学系'})
				search.where('isDelete').equals(0)
				search.sort({'id':-1})
				search.sort({'isTop':-1})//正序
				search.sort({'timeAdd':-1})
				search.sort({'isDisplay':1})
				search.exec(function(error,docs){
					if(error){
						console.log('error',error)
						cb(error)
					}
					data = docs
					console.log('length ------ >',data.length)
					cb(null)
				})
		},
		function(cb){
			let obj = {}
			if(req.query['L']=='1'){
				obj = {'tag2':'教学系',title:type}
			}else{
				obj = {'tag2':'教学系',titleEN:type}
			}
			let search = cmsContent.findOne(obj)
				search.exec(function(error,doc){
					if(error){
						cb(error)
					}
					content = doc
					cb()
				})
		}
	],function(error,result){
		if(error){
			console.log('hzhb_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('hzhb_data async waterfall success',result)
		if(req.query['L']=='1'){
			res.render('pages/organization/index',{L:req.query['L'],data:data,doc:content,type:type,check_nav:'active_organization'})
		}else{
			res.render('pages/organization/indexen',{L:req.query['L'],data:data,doc:content,type:type,check_nav:'active_organization'})
		}
	})
}).get('/pages/organization/index',function(req,res){
	let data = {}
	async.waterfall([
		function(cb){
			console.log('不带搜索参数')
			let search = cmsContent.find({'tag2':'研究所'})
				search.where('isDelete').equals(0)
				search.sort({'organizationsort':1})
				//search.sort({'isTop':-1})//正序
				//search.sort({'timeAdd':1})
				//search.sort({'isDisplay':1})
				search.exec(function(error,docs){
					if(error){
						console.log('error',error)
						cb(error)
					}
					data = docs
					cb(null)
				})
			
		}
	],function(error,result){
		if(error){
			console.log('hzhb_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('hzhb_data async waterfall success',result)
		data.forEach(function(item,index){
			item.img1 = (item.fujianPath).split(';')[0]
			item.img2 = (item.fujianPath).split(';')[1]
		})
		data.forEach(function(item,index){
			item.enimg1 = (item.fujianPath1).split(';')[0]
			//item.img2 = (item.fujianPath).split(';')[1]
		})
		if(req.query['L']=='1'){
			res.render('pages/organization/graduateSchool',{L:req.query['L'],data:data,check_nav:'active_organization'})
		}else{
			res.render('pages/organization/graduateSchoolen',{L:req.query['L'],data:data,check_nav:'active_organization'})
		}
	})
	
}).get('/pages/organization/periodical',function(req,res){
	console.log('in qkbjb')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('期刊编辑部')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			if(req.query['L']=='1'){
				res.render('pages/organization/periodical',{L:req.query['L'],data:doc,check_nav:'active_organization'})
			}else{
				res.render('pages/organization/periodicalen',{L:req.query['L'],data:doc,check_nav:'active_organization'})
			}
			
		})
}).get('/pages/organization/executive1',function(req,res){
	console.log('in executive')
	let search = cmsContent.findOne({})
		search.where('tag2').equals('行政办公室')
		search.exec(function(err,doc){
			if(err){
				return res.send(err)
			}
			res.render('pages/organization/executive',{L:req.query['L'],data:doc,check_nav:'active_organization'})
		})
}).get('/pages/organization/executive',function(req,res){
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
		res.render('pages/organization/executive1',{L:req.query['L'],data:data,check_nav:'active_organization'})
	})
})


router.get('/setLanguage',function(req,res){
	console.log('check req.query[L]',req.query.language,typeof(req.query.language))
	res.cookie("L", parseInt(req.query.language), { maxAge: 6 * 60 * 60 * 1000 });//中文
	req.query["L"] = req.query.language;
	console.log('设置之后------------------ --------------------------------',req.query["L"] )
	console.log()
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
	return res.render('tempaddcms',{data:''})
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
router.get('/index1',function(req,res){
	//res.render('info',{'data':data,'L':req.query["L"]})
	//“信息发布”进来，默认取学院通知内容
	// let id = req.query.id,data,L=req.query.L
	// // if(typeof(L)!='undefined'){
	// // 	console.log('设置了---->',L,req.query.L)
	// // }
	// db.querySql('select * from cmsContent where id=\''+id+'\'','',function(err,result){
	// 	if(err){
	// 		res.json(err)
	// 	}
	// 	//res.json(result)
	// 	data = result.recordsets[0][0]
	// 	data.timeEdit = formatTime(data.timeEdit)
	// 	console.log('timeEdit---->',data.timeEdit)
	// 	console.log('check language---->',req.query['L'],typeof(req.query['L']))
	// 	res.render('info',{'data':data,'L':req.query["L"]})
	// })	
})
router.get('/remove_csse',function(req,res){

})
module.exports = router;
