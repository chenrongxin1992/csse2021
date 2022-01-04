/**
 *  @Author:    chenrongxin
 *  @Create Date:   2021-7-30
 *  @Description:   题目类别表
 */
 const path = require('path')
 const download = require('download')
 const fs = require('fs')
 var mammoth = require("mammoth");
 var request = require('request');
 const moment  = require('moment')
 const async = require('async')
 const basedir = '/csse/'
 const attachmentuploaddir = path.resolve(__dirname, '../..')//G:\spatial_lab\public\attachment
 const TranlateWordString = function TranlateWordString(str,callback){
	if(str ==undefined||str==''){
		callback(str)
	 }
    let imglist = str.match(/data:image.*?\"/g)
    let count = 0
    if(imglist&&imglist.length>0){
        imglist.forEach(function(item,index){
            //将前台传来的base64数据去掉前缀
            item = item.replace("\"",'')
            var imgData = item.replace(/^data:image\/\w+;base64,/, '');
    
            var dataBuffer = Buffer.from(imgData, 'base64');
            //写入文件
            let newfilename =  basedir +'/attachment/word/'+'wordimg'+'_'+moment().unix()+'_'+ index + '_' + '.jpg'
            let actualnewfilename =attachmentuploaddir + newfilename
            //console.log(newfilename)
            fs.writeFile(actualnewfilename, dataBuffer, function(err){
                count++
                if(err){
                    console.log('图片保存失败'+err)
                }else{
                    console.log("item:"+item)
                    console.log("newfilename:"+newfilename)
                    str = str.replace(item,newfilename);
                }
                if(count==imglist.length){
                    //console.log(str)
                    callback(str)
                    //return str
                }
            });
        });
    }else{
        callback(str)
    }
    
 }

 const TranlateMultiText = async function TranlateMultiText(type='normal',str,callback){
	if(str ==undefined||str==''){
		callback(str)
	 }
	// console.log("TranlateMultiText-str"+str)
    let imglist = str.match(/src="http.*?(jpg|png|jpeg|gif)/g)
	if(type=='wx')
	  imglist = str.match(/src="http.*?\"/g)
	//console.log("imglist",imglist)
    let count = 0
    if(imglist&&imglist.length>0){
        imglist.forEach(function(item,index){
			item = item.replace(/\"/g,'')
			item = item.replace("src=",'')	
            //将前台传来的base64数据去掉前缀
			
			let relativepath = '/attachment/wx/' +moment().format('YYYYMMDD')+'/'; 
			fs.existsSync(attachmentuploaddir+relativepath) || fs.mkdirSync(attachmentuploaddir+relativepath) 
			let newfilename =  relativepath+'wximg'+'_'+moment().unix()+'_'+ Math.round(Math.random()*100000) + '_' + '.jpg'
			let actualnewfilename =attachmentuploaddir + newfilename
			download(item).pipe(fs.createWriteStream(actualnewfilename));
			count++
			//console.log("item:"+item)
			//console.log("newfilename:"+newfilename)
			newfilename = basedir+ newfilename
			str = str.replace('data-src="'+item, 'src="'+newfilename+'"')
			str = str.replace('src="'+item, 'src="'+newfilename)
			if(count==imglist.length){
				//console.log(str)
				callback(str)
				//return str
			}
        });
    }else{
        callback(str)
    }
    
 }

 const TranlateRevertMultiText = async function TranlateRevertMultiText(str,url,callback){
	 //console.log(str)
	 if(str ==undefined||str==''){
		console.log("转换的富文本为空")
		callback(str)
		return
	 }
	// console.log("str"+str)
    let imglist = str.match(/src=".*?(jpg|png|jpeg|gif)/g)
	if(imglist==null||imglist==undefined)
	{
		console.log("未找到图片")
		callback(str)
		return
	}
	imglist = imglist.filter(d=>{
		if(d.indexOf('http')==-1)
		  return true
		else
		  return false
	});
	//console.log(imglist)
    let count = 0
    if(imglist&&imglist.length>0){
        imglist.forEach(function(item,index){
			
			item = item.replace("src=",'')	
			item = item.replace(/\"/g,'')
			tempitem = item.replace(basedir,'') //临时使用
			//console.log(item)
            //将前台传来的base64数据去掉前缀
			let newfilename =  basedir + '/attachment/wx/'+'wximg'+'_'+moment().unix()+'_'+ Math.round(Math.random()*100000) + '_' + '.jpg'
			let actualnewfilename =attachmentuploaddir + tempitem
			//console.log(actualnewfilename)
			//download(item).pipe(fs.createWriteStream(actualnewfilename));
			var formData = {
				media: fs.createReadStream(actualnewfilename)
			 }
			 request.post({url: url, formData: formData,json:true}, function(err,response,body){
				   count++
				   console.log('转换第'+count+'张富文本图片');
				   if(err) {
					  console.log('上传图片失败' , err);
					 // return
				   }else{
					  // console.log("body",body)
					   str = str.replace(item, body.url)  
					   if(count==imglist.length){
							//console.log(str)
							console.log('富文本图片全部转换完毕');
							callback(str)
							//return str
							return
						}
				   }
			 });
			
		
			//str = str.replace('data-src="'+item, 'src="'+newfilename+'"')
			
        });
    }else{
		console.log("富文本内无图片，不需要转换")
        callback(str)
		return
    }
    
 }

 const UploadImg = async function(url,filepath,callback){
	var formData = {
		media: fs.createReadStream(filepath)
	 }
	 request.post({url: url, formData: formData,json:true}, function(err,response,body){
		   if(err) {
			  console.log('上传图片失败' , err);
			  callback(-1,'')
			 // return
		   }else{
			   callback(1,body)
		   }
	 });
 }
 const PostData = async function(url='',data={},callback){
	request.post({url:url, body:data,json:true}, function(error, response, body) {
		callback(error, response, body)
	})
 }
 const DataSearch = function DataSearch(req,res,dbobject,searchparam=[],filter={},sortobject = {id:-1}){
    console.log('router DataSearch')
	let page = req.query.page,
		limit = req.query.limit,
		search_txt = req.query.search
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	let order_field = '',
		order_type = -1
	if(req.query.order_field!=''&&req.query.order_field!=null){
		order_field = req.query.order_field
		if(req.query.order_type&&req.query.order_type=='asc')
			order_type = 1
	}
	if(order_field!=='')
	   sortobject[order_field] = order_type
	
	if(!search_txt)
	   search_txt = ''
    let orfilter = []

	let _filter = filter
   /* {
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
	}*/
    //console.log(searchparam)
	if(searchparam.length>0){
		searchparam.forEach(function(item,index){
			if(req.query[item.field]!=''&&req.query[item.field]!=null&&req.query[item.field]!=undefined){
				if(item.type=='input'){
                    _filter[item.field] = {$regex:req.query[item.field],$options:'$i'}
                }
				else 
				   _filter[item.field] = req.query[item.field]
			}
            if(search_txt!=''&&item.type=='input'){
                let oritem = {}
                oritem[item.field] = {$regex:search_txt,$options:'$i'}
                orfilter.push(oritem)
            }
		});
        if(orfilter.length>0)
          _filter.$or = orfilter
	}
    //console.log(_filter)
	async.waterfall([
		function(cb){
			//get count
			let search = dbobject.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('DataSearch get total err',err)
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
				//console.log('带搜索参数',search_txt)
				//console.log('_filter',_filter)
				let search = dbobject.find(_filter)
					search.sort(sortobject)
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('DataSearch error',error)
							cb(error)
						}
						//获取搜索参数的记录总数
						dbobject.count(_filter,function(err,count_search){
							if(err){
								console.log('DataSearch count_search err',err)
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
		}
	],function(error,result){
		if(error){
			console.log('DataSearch async waterfall error',error)
			return res.json({'code':-1,'msg':error.stack,'count':0,'data':''})
		}
		console.log('DataSearch async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
 }

 const DataUpdate = function DataUpdate(req,res,dbobject,saveparam=[],othersaveparam={}){
	console.log('xrldadd------------------>',)
	let saveobject = othersaveparam
	//console.log("othersaveparam",othersaveparam)
	saveobject['pageContent'] = ''
	saveparam.forEach(function(item,index){
		if(req.body[item]!=undefined&&req.body[item]!=null)
		   saveobject[item] = req.body[item]
	})
	TranlateMultiText('normal',saveobject['pageContent'],function(result){
		saveobject['pageContent'] = result

		//console.log(saveobject)
		if(req.body.id==''||req.body.id==null){
			console.log('新增 add')
			async.waterfall([
				function(cb){
					let search = dbobject.findOne({})
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
					saveobject['id'] = id
					let add = new dbobject(saveobject)
					add.save(function(error,doc){
						if(error){
							console.log('add save error',error)
							cb(error)
						}
						console.log('add save success')
						cb(null,doc)
					})
				}
			],function(error,result){
				if(error){
					console.log('add async error',error)
					return res.end(error)
				}
				return res.json({'code':0,'data':result})//返回跳转到该新增的项目
			})
		}else{
			console.log('add',req.body)
			//return false
			async.waterfall([
				function(cb){
					dbobject.updateOne({id:req.body.id},saveobject,function(error){
						if(error){
							console.log(' update error',error)
							cb(error)
						}
						console.log(' update success')
						cb(null)
					})
				},
			],function(error,result){
				if(error){
					console.log(' async error',error)
					return res.end(error)
				}
				console.log('',result)
				return res.json({'code':0,'data':result})//返回跳转到该新增的项目
			})
		}
				
	})
 }
 exports.TranlateWordString = TranlateWordString//年份
 exports.TranlateMultiText = TranlateMultiText//转换富文本的图片（下载）
 exports.TranlateRevertMultiText = TranlateRevertMultiText//转换富文本的图片（上传）
 exports.DataSearch = DataSearch//列表搜索
 exports.DataUpdate = DataUpdate//列表搜索
 exports.UploadImg = UploadImg//列表搜索
 exports.PostData = PostData