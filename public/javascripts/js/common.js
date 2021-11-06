
$(document).ready(function() {
    // $('#head').load('components/head.html');
    // $('#footer').load('components/footer.html');
    $('.lazy_img, .lazy_bg').lazyload({
      threshold: 100,
      effect: "fadeIn"
    });
    $('.mobile-con .nav-btn').on('click', function(){
      $('.mobile-nav').toggle();
    });
    $('.mobile-nav .mobile_navs i').on('click', function(e){
      var _d = $('.mobile-nav .mobile_navs ol:visible')
      var now = $(e.target).siblings('ol')[0]
      if(_d.length>0){
        _d[0].style="display:none"
        if(now!=_d[0]){
          now.style="display:block"
        }
      }else{
        now.style="display:block"
      }
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