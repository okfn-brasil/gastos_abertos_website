// Start loading the main app file. Put all of
// your application logic in there.

$(document).ready(function(){
  $('.owl-carousel').owlCarousel({
    slideSpeed: 300,
    paginationSpeed: 600,
    rewindSpeed: 600,
    singleItem: true,
    autoPlay: true,
    stopOnHover: true
  });

  var owl = $(".owl-carousel").data('owlCarousel')

  // fix the stopOnHover issue
  $('.owl-carousel .slide').hover(
    function() { owl.stop(); },
    function() { owl.play(); }
  )
});
