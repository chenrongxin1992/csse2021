/**
 *  @Author:    chenrongxin
 *  @Create Date:   2021-7-30
 *  @Description:   题目类别表
 */


const years = [{
        title:2022
    },{
    title:2021
    },{
    title:2020
    },{
    title:2019
    },{
    title:2018
    },{
    title:2017
    },{
    title:2016
    },{
    title:2015
    },{
    title:2014
    },{
    title:2013
    },{
    title:2012
    },{
    title:2011
    },{
    title:2010
    },{
    title:2009
    },{
    title:2008
    },{
    title:2007
    },{
    title:2006
    },{
    title:2005
    },{
    title:2004
    },{
    title:2003
    },{
    title:2002
    },{
    title:2001
    },{
    title:2000
    }
]
const search_param = {
  cglr:[
    {field: 'title', title: '名称',type:'input'},
    {field: 'year', title: '年份', type:'url_select',url:'./year',keyField:'title',showField:'title',default:''},
    {field: 'kanwu', title: '刊物',type:'url_input',url:'./kanwu',keyField:'title',showField:'title',default:''},
    {field: 'zuozhe', title: '作者',type:'input'},
    {field: 'pageContent', title: '详情',type:'input'},
    {field: 'pageContentEN', title: '详情(EN)',type:'input'},
    {field: 'belongsto', title: '研究所',type:'select',list:[{title:'其它',value:'其它'},{title:'教学系',value:'教学系'},{title:'高性能计算研究所',value:'高性能计算研究所'},{title:'大数据技术与应用研究所',value:'大数据技术与应用研究所'},{title:'未来媒体技术与计算研究所',value:'未来媒体技术与计算研究所'},{title:'网络与信息安全研究所',value:'网络与信息安全研究所'},{title:'计算机视觉研究所',value:'计算机视觉研究所'},{title:'智能技术与系统集成研究所',value:'智能技术与系统集成研究所'},{title:'物联网研究中心',value:'物联网研究中心'},{title:'可视计算研究中心',value:'可视计算研究中心'}]}
  ],
   xrld:[
    {field: 'name', title: '姓名',type:'input'},
    {field: 'title', title: '职务',type:'input'},
    {field: 'work', title: '分管工作',type:'input'}
   ],
   yjs:[
    {field: 'title', title: '所名称',type:'input'},
    {field: 'pageContent', title: '简介',type:'input'}
   ],
   jxx:[
    {field: 'title', title: '系名称',type:'input'},
    {field: 'zhur', title: '主任',type:'input'},
    {field: 'fuzhur', title: '副主任',type:'input'},
    {field: 'pageContent', title: '简介',type:'input'}
   ],
   bkzs:[
    {field: 'zhuanye', title: '专业',type:'input'},
    {field: 'neirong', title: '内容',type:'input'}
   ],
   sszs:[
    {field: 'title', title: '标题',type:'input'},
    {field: 'neirong', title: '内容',type:'input'}
   ],
   rczp:[
    {field: 'title', title: '标题',type:'input'},
    {field: 'zplx', title: '招聘类型',type:'input'},
    {field: 'pageContent', title: '内容',type:'input'}
   ],
   hzhb:[
    {field: 'title', title: '伙伴名称',type:'input'}
   ],
   lhpy:[
    {field: 'title', title: '名称',type:'input'},
    {field: 'pageContent', title: '简介',type:'input'}
   ],
   lhpy:[
    {field: 'title', title: '名称',type:'input'},
    {field: 'pageContent', title: '简介',type:'input'}
   ],
   kyhz:[
    {field: 'title', title: '名称',type:'input'},
    {field: 'pageContent', title: '简介',type:'input'}
   ],
   gzzd:[
    {field: 'title', title: '标题',type:'input'},
    {field: 'pageContent', title: '内容',type:'input'}
   ],
   tzgg:[
    {field: 'title', title: '标题',type:'input'},
    {field: 'pageContent', title: '内容',type:'input'}
   ],
   djhd:[
    {field: 'title', title: '标题',type:'input'},
    {field: 'pageContent', title: '内容',type:'input'}
   ],
   xxyd:[
    {field: 'title', title: '标题',type:'input'},
    {field: 'pageContent', title: '内容',type:'input'}
   ],
   slider:[
    {field: 'title', title: '标题',type:'input'},
    {field: 'title1', title: '标题(EN)',type:'input'}
   ],
   jrfc:[
    {field: 'title', title: '标题',type:'input'},
    {field: 'pageContent', title: '详情',type:'input'},
    {field: 'pageContentEN', title: '详情(EN)',type:'input'}
   ],
   jrxw:[
    {field: 'title', title: '标题',type:'input'},
    {field: 'leixing', title: '类别',type:'input'},
    {field: 'pageContent', title: '详情',type:'input'},
     {field: 'pageContentEN', title: '详情(EN)',type:'input'}
   ],
   notice:[
    {field: 'title', title: '标题',type:'input'},
    {field: 'notice1', title: '类型',type:'input'},
    {field: 'pageContent', title: '详情',type:'input'},
     {field: 'pageContentEN', title: '详情(EN)',type:'input'}
   ],
   material:[
    {field: 'title', title: '标题',type:'input'},
    {field: 'leixing', title: '类别',type:'input'},
    {field: 'pageContent', title: '详情',type:'input'},
    {field: 'pageContentEN', title: '详情(EN)',type:'input'}
   ],
   
}
const wx = {
  appid:"wxd7f3f5b1f5aba346",
  appkey:"018793f0c74a889afa0f2906a9e1aa5b"
}
exports.years = years//年份
exports.search_param = search_param//年份
exports.wx = wx//年份