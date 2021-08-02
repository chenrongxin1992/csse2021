var DEFAULT_VERSION = 8.0;  
var ua = navigator.userAgent.toLowerCase();  
var isIE = ua.indexOf("msie")>-1;  
var safariVersion;  
if(isIE){  
safariVersion =  ua.match(/msie ([\d.]+)/)[1];  
}
var alertDome = '<div style="position:fixed; left:0; top:0; width:100%; z-index:99999; background:#FFCC66; color:#555; font-size:16px; line-height:20px; padding:15px 10px; text-align:center;">本站不再支持您的浏览器，360、sogou等浏览器请切换到急速模式，或升级您的浏览器到 <a href="http://browsehappy.osfipin.com/" style="TEXT-DECORATION: underline">更高的版本</a>！以获得更好的观看效果。<a href="javascript:;" id="alertClose" style="position:absolute; right:20px; top:15px;">X</a></div>'
if(safariVersion <= DEFAULT_VERSION ){ 
	var dom =  $(alertDome);
	dom.find('#alertClose').click(function(){
		dom.remove();
	})
  	dom.appendTo('body');
}; 