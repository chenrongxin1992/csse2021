
$(document).ready(function() {
    // $('#head').load('components/head.html');
    // $('#footer').load('components/footer.html');
    $('.lazy_img, .lazy_bg').lazyload({
      threshold: 100,
      effect: "fadeIn"
    });
    $('.mobile-con .nav-btn').on('click', function(){
      $('.mobile-nav').addClass('opened');
    });
    $('.nav_site .close').on('click', function(){
      $('.mobile-nav').removeClass('opened');
    });
    $('.mobile-nav .mobile_navs i').on('click', function(e){
      if($(e.target).next().is(':visible')){
        $(e.target).next().hide()
        $('.menu-content').height('auto')
      }else{
        $(e.target).parent().siblings().find('.sub-menu').hide()
        $(e.target).next().show()

        let h = 509 + $(e.target).next().height()
        if(h > window.innerHeight - 60){
          $('.menu-content').height(window.innerHeight - 60)
        }else{
          $('.menu-content').height('auto')
        }
      }
      // var _d = $('.mobile-nav .mobile_navs .sub-menu:visible')
      // var now = $(e.target).siblings('.sub-menu')[0]
      // if(_d.length>0){
      //   _d[0].style="display:none"
      //   if(now!=_d[0]){
      //     now.style="display:block"
      //   }
      // }else{
      //   now.style="display:block"
      // }
    })
    $(window).scroll(function() {
      var _2 = $(window).scrollTop();
      if (_2 > 0) {
        $('#head').addClass('fixed')
      } else {
        $('#head').removeClass('fixed')
      }
    });

    $('.to_top').on('click', function() {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      })
    })
})

window.onresize = function() {
  if(window.innerWidth >= 1200){
    $('.mobile-nav').hide()
  }
}