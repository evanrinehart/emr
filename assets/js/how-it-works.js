$(document).on('click', '#how-it-works table td', function(e){
  var which = $(this).data('i');
  console.log(which);
  var target = $('.how-tab').eq(parseInt(which));
  $('.how-tab').addClass('hidden');
  target.removeClass('hidden');
});
