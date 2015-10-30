var currentlySelected = 0;

function setHighlight(i){
  var highlight = '#4F5496';
  $('#how-it-works table .title').eq(i).css('color',highlight);
  var icon = $('#how-it-works table .icon').eq(i);
  icon.find('img').attr('src', icon.data('highlight'));
}

function clearHighlight(i){
  $('#how-it-works table .title').eq(i).css('color', 'black');
  var icon = $('#how-it-works table .icon').eq(i);
  icon.find('img').attr('src', icon.data('normal'));
}

function clearAllHighlights(){
  clearHighlight(0);
  clearHighlight(1);
  clearHighlight(2);
  clearHighlight(3);
  clearHighlight(4);
}

$(document).on('click', '#how-it-works table td', function(e){
  var which = $(this).data('i');
  var target = $('.how-tab').eq(parseInt(which));
  $('.how-tab').addClass('hidden');
  target.removeClass('hidden');
  clearAllHighlights();
  setHighlight(which);
  currentlySelected = which;
});

$('#how-it-works table td').on('mouseenter', function(e){
  var which = parseInt($(this).data('i'));
  clearAllHighlights();
  setHighlight(currentlySelected);
  setHighlight(which);
});
