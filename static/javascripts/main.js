// Start loading the main app file. Put all of
// your application logic in there.

// fix carrousel clickable buttons position

function setCarrouselDims(){
    var carouselImgHeight = $('.h-slider-img-wrap:first-child img').height();
    $('.slider').css('height', carouselImgHeight + 'px');
    var owlCliblesHeight = $('.owl-next').height();
    var owlControlsmarginTop = (carouselImgHeight + owlCliblesHeight) / 2;
    $('.owl-controls').css('margin-top', '-' + owlControlsmarginTop + 'px');
}

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

	$( window ).resize(function() {
		setCarrouselDims();
	});

	$(window).bind('scroll', function() {
        var navHeight = $(window).height() - 500;
        if ($(window).scrollTop() > 80) {
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

   /* $('body').scrollspy({
        target: '.site-header',
        offset: 80
    });*/

    /* Pagina Sobre
    --------------------------------------------------------------------------*/
    if(($('.head-sobre').length) > 0 ){
      var windowWidth = $(window).width() / parseFloat($("body").css("font-size"));//window with in 'em' units
	    var authorsCount = $('.team-member-icon').length;
	    var i = 0;
	     $('.team-photos > div').each(function(){
		     i++;
		     var authorsID = 'author-'+ i;
		     $(this).attr('id', authorsID);
	     });
	     var j = 0;
	     $('.team-info .team-member').each(function(){
		     j++;
		     var authorsID = 'author-'+ j;
		     $(this).attr('id', authorsID);
	     });

	     $('.team-photos div:first-child .team-member-icon').addClass('selected');
	     $('.team-info .team-member:not(:first-child)').hide();
       $('.team-info .team-member:first-child').addClass('shown');

       if(windowWidth < 67.35714285714286){
         $('.team-photos div .team-member-icon').each(function(){
           var id= $(this).parent().attr("id");
           $('.team-info #' + id).show().insertAfter(this);
         });
         $('.team-info .team-member.shown').insertAfter('.selected');

         $('.team-photos div .team-member-icon').click(function() {
           var id = $(this).parent().attr("id");
           var author = $('.team-photos div .team-member-icon');
           author.each(function(){
             $(this).removeClass('selected');
             //$(this).parent().find('.team-member').removeClass('shown').hide();
           });
           $(this).addClass('selected');
           //$(this).parent().find('.team-member').addClass('shown').show();
         });
       }else{
         $('.team-photos div .team-member-icon').click(function() {
    		     var id = $(this).parent().attr("id");
    		     var author = $('.team-photos div .team-member-icon');
    		     author.each(function(){
    			     $(this).removeClass('selected');
    		     });
    		     $('.team-info .team-member').each(function(){
    			     $(this).removeClass('shown').hide();
    			   });
      			 $(this).addClass('selected');
      			 $('.team-info #' + id).addClass('shown').show();
  		   });
       }
    }
});

$(window).on("load", function() {
    setCarrouselDims();
});
