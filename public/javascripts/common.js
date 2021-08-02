$(function(){
	


	//搜索输入框滑出前总宽度
	$("body,html").click(function(){
			$(".search-window").animate({"width":"28px"});
			$(".searchbtn").stop(true,true).fadeIn();
			$(".navlist").slideUp();
	});
	
	
	//搜索输入框滑出效果及滑出后总宽度
	$(".searchbtn").click(function(){
			$(this).stop(true,true).fadeOut();
			$(".search-window").stop(true,true).animate({"width":"110px"});
			return false;
	});	
	$(".search-title").click(function(){
			return false;
	});
	
	
	
	
});