var express = require('express');
var request = require('request');
const async = require('async');
const path = require('path')
const download = require('download')
const fs = require('fs')

const commonfunc = require('./commonfunc');
const cmsContent = require('../../../db/db_struct').cmsContent//内容
const attachmentuploaddir = path.resolve(__dirname, '../..')//G:\spatial_lab\public\attachment
const moment  = require('moment')
const basedir = '/csse/'
const GetAccessToken = function(userreq,appid,appkey,callback){
   var app = express()
    let url = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid='+appid+'&secret='+appkey
    //console.log(url)
    request(url, function (error, response, body) {
      //console.log('error:', error); // Print the error if one occurred
     // console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
     // console.log('body:', body); // Print the HTML for the Google homepage.
      // 获取query请求参数  
      console.log("微信公众号获得accesstoke")
      body = JSON.parse(body)
      if(body.access_token){
         userreq.session.accesstoken = body.access_token
         userreq.session.expires_in = body.expires_in
      }else{
         console.log("微信公众号获得accesstoke失败,错误代码:"+body.errcode+",错误描述："+body.errmsg)
      }
      callback(body)
  });
 }
 const GetMarterial = function(userreq,type="publish",media_id = null,page = 1,pagesize=20,callback){
   var app = express()
   let url = "",
       form={}
   if(media_id==null){
      if(type=="publish"){
         form =  {
            "offset": pagesize*(page-1),
            "count": pagesize
         }
         url = "https://api.weixin.qq.com/cgi-bin/freepublish/batchget?access_token="+userreq.session.accesstoken
      }else if(type=="material"){
         form =  {
            "offset": pagesize*(page-1),
            "count": pagesize,
            "type": "news"
         }
         url = "https://api.weixin.qq.com/cgi-bin/material/batchget_material?access_token="+userreq.session.accesstoken
      }else if(type=="draft"){
         url = "https://api.weixin.qq.com/cgi-bin/draft/batchget?access_token="+userreq.session.accesstoken
         form =  {
            "offset": pagesize*(page-1),
            "count": pagesize,
            "type": "news"
         }
      }
      //console.log(url)
   }else{
      let url = "https://api.weixin.qq.com/cgi-bin/material/get_material?access_token="+userreq.session.accesstoken
      form['media_id'] = media_id
   }
   //console.log(form)
   request.post({url:url, body:form,json:true}, function(error, response, body) {
      if(response && response.statusCode==200){
         //console.log(body)
         console.log(error)
         SaveMarterial(userreq,type,body.item,function(){
            console.log("total_count"+body.total_count)
            if(pagesize*page<body.total_count){
               GetMarterial(userreq,type,media_id,page+1,pagesize,callback)
            }else{
               callback(body)
            }
         })
         
      }else{
         console.log("微信公众号获得素材失败,错误代码:"+body.errcode+",错误描述："+body.errmsg)
          callback([])
      }
   })
 }
 const SaveMarterial = async function(userreq,type="publish",list,callback){
    console.log(list)
    if(!list){
      callback()
      return
    }
    let i =1 ;
    let key = 'article_id'
    if(type=="material"||type=="draft")
       key = 'media_id'
    let savedcount =0
    let search = cmsContent.find({fromwx:'1'})
      search.exec(function(error,docs){
         if(error){
            console.log('DataSearch error',error)
         }
         let existid = []
         docs.map(d=>{
            existid.push(d.articleid)
            return d
         })
         list.forEach(element => {
            if(existid.indexOf(element[key]) ==-1){
               element.content.news_item.forEach(elementson=>{
                  i++
                  //console.log(elementson.thumb_url)
                  let saveitem =  JSON.parse(JSON.stringify(elementson))
                  saveitem['articleid'] = element[key]
                  //console.log(saveitem.content)
                  commonfunc.TranlateMultiText("wx",saveitem.content,function(result){
                     saveitem.content = result
                     if(saveitem.thumb_url){
                        let relativepath =  '/attachment/wx/'+moment().format('YYYYMMDD')+'/'; 
                        fs.existsSync(attachmentuploaddir+relativepath) || fs.mkdirSync(attachmentuploaddir+relativepath) 
                        let newfilename =   relativepath+'wximg'+'_'+moment().unix()+'_'+ Math.round(Math.random()*100000000000) + '_' + '.jpg'
                        let actualnewfilename =attachmentuploaddir + newfilename
                        //console.log("thumb_url",saveitem.thumb_url)
                        download(saveitem.thumb_url).pipe(fs.createWriteStream(actualnewfilename));
                        newfilename = basedir + newfilename
                        saveitem['fujianPath'] = newfilename
                     }
                     SavecmsContent(saveitem,i)
                     savedcount++
                     //if(savedcount==list.length)
                        
         
                     /*GetSingleMaterial(userreq,saveitem.thumb_media_id,function(res){
                       
                     });*/
                  })
               })
            }
         })
         callback()
     /* async.eachSeries(element.content.news_item, function (elementson, next) {
         console.log(elementson)*/
        /* let saveitem =  elementson
         saveitem['media_id'] = element.media_id
         SavecmsContent(saveitem)
         */
        /* commonfunc.TranlateMultiText(saveitem.content,function(result){
            saveitem.content = result
            SavecmsContent(saveitem)
         })*/
     /* });*/
    });
   
 }
 const UploadMaterial = async function(userreq, type='news',data={},callback){
    let url = ""
    if(type=='news'){
      url = "https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token="+userreq.session.accesstoken
      console.log("开始转换富文本图片")
      commonfunc.TranlateRevertMultiText(data.pageContent,url,function(res){
         console.log("富文本图片转换完成")
         data.content = res
         //console.log(data.content)
         url = "https://api.weixin.qq.com/cgi-bin/material/add_material?access_token="+userreq.session.accesstoken
         console.log("开始上传封面图片素材")
         data.fujianPath = data.fujianPath.replace(basedir,'') //临时使用
         commonfunc.UploadImg(url,path.resolve(__dirname, '../../'+data.fujianPath),function(status,res2){
            console.log(__dirname)
            console.log(path.resolve(__dirname, '../../'+data.fujianPath))
            console.log("封面图片素材上传完成")
           // console.log(res2)
            if(status==1)
               data.thumb_media_id = res2.media_id
            else
              data.thumb_media_id = res2.media_id = ''
            url = "https://api.weixin.qq.com/cgi-bin/draft/add?access_token="+userreq.session.accesstoken
            let postdata =  {
                  "articles": [{
                     "title": data.title,
                     "thumb_media_id": data.thumb_media_id,
                     "author": 'CSSE',
                     "digest": data.title,
                     "show_cover_pic": 0,
                     "content": data.content,
                     "content_source_url": 'csse.shubiao.store',
                     "need_open_comment":0,
                     "only_fans_can_comment":0
                     
                  }
               //若新增的是多图文素材，则此处应还有几段articles结构
               ]
            }
            console.log("开始上传整个素材")
            commonfunc.PostData(url,postdata,function (error, response, body){
                //console.log(body)
                console.log("整个素材上传完成")
                callback(error, response, body)
            });
         })
         
      })
    }else if(type='image'){
      url = "https://api.weixin.qq.com/cgi-bin/material/add_material?access_token="+userreq.session.accesstoken
    }else if(type='imglist'){
      url = "https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token="+userreq.session.accesstoken
    }
  
}

const  GetSingleMaterial =  async function(userreq,media_id,callback){
   let url = "https://api.weixin.qq.com/cgi-bin/material/get_material?access_token="+userreq.session.accesstoken
   let form={}
   form['media_id'] = media_id
   request.post({url:url, body:form,json:true}, function(error, response, body) {
      let newfilename =  '\\attachment\\wx\\'+'wximg'+'_'+moment().unix()+'_'+ media_id + '_' + '.jpg'
      let actualnewfilename =attachmentuploaddir + newfilename
      //download(body.down_url).pipe(fs.createWriteStream(actualnewfilename));
      callback(newfilename)
   });
}

 const SavecmsContent = async function(item,i){
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
            console.log("docid:"+docid)
				let id = 1
				if(docid){
					id = parseInt(docid) + i
				}
				let cmsContentadd = new cmsContent({
					id:id,
					title:item.title,//加入权限后需要更新
					titleEN:'',
               digest:item.digest,
               url:item.url,
               fujianPath:item.fujianPath,
               content_source_url:item.content_source_url,
					pageContent:item.content,
					pageContentEN:'',
					isTop:'',
               articleid:item.articleid,
					timeAdd:item.update_time,
					timeEdit:item.update_time,
					//tag2:'计软新闻',
               //trees:'179-181-',
               fromwx:1,
               isDisplay:0
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
				return 1
			}
			return -1//返回跳转到该新增的项目
		})
   }
   
 exports.SavecmsContent = SavecmsContent//保存文章
 exports.SaveMarterial = SaveMarterial//保存素材
 exports.GetAccessToken = GetAccessToken//获取accesstoken
 exports.GetMarterial = GetMarterial//获取素材
 exports.UploadMaterial = UploadMaterial//获取素材
 
