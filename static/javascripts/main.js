// Start loading the main app file. Put all of
// your application logic in there.

$(document).ready(function(){
  $('.owl-carousel').owlCarousel({
    slideSpeed: 300,
    paginationSpeed: 600,
    rewindSpeed: 600,
    singleItem: true,
    autoPlay: true,
    stopOnHover: true,
    pagination: false,
    navigation: true,
    navigationText: ["<img src=\"/static/img/seta-esquer.png\" class=\"slider-seta-esquer\" >","<img src=\"/static/img/seta-dir.png\" class=\"slider-seta-dir\" >"]
  });

  var owl = $(".owl-carousel").data('owlCarousel')

  // fix the stopOnHover issue
  $('.owl-carousel .slide').hover(
    function() { owl.stop(); },
    function() { owl.play(); }
  )
  // fix carrousel clickable buttons position
	function setCarrouselDims(){
		  var carouselImgHeight = $('.h-slider-img-wrap:first-child img').height();
		  $('.slider').css('height', carouselImgHeight + 'px');
		  var owlCliblesHeight = $('.owl-next').height();
		  var owlControlsmarginTop = (carouselImgHeight + owlCliblesHeight) / 2;
		  $('.owl-controls').css('margin-top', '-' + owlControlsmarginTop + 'px');
	}
	setCarrouselDims();
	
	$( window ).resize(function() {
		setCarrouselDims();
	});
	
	$(window).bind('scroll', function() {
        var navHeight = $(window).height() - 100;
        if ($(window).scrollTop() > navHeight) {
            $('.site-header').addClass('colored-nav');
        } else {
            $('.site-header').removeClass('colored-nav');
        }
    });
    
    //fix for the slider overlapin the menu when in small scree size
    /*$('.toggle-topbar ').toggle(
	    function(){
		    $('.top-features').css('margin-top', '15rem');
	    },
	    function(){
		    $('.top-features').css('margin-top', '');
	    }
    );*/
    
    $('body').scrollspy({ 
        target: '.site-header',
        offset: 80
    });
    
});
