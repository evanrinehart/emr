

var modalStack = [];
var level = 10;

function probeHeight(content){
  var probe = $('<div class="custom-dialog modal-probe" style="visibility: hidden"></div>');
  probe.append(content);
  $('body').append(probe);
  var contentW = probe.width();
  var contentH = probe.height();
  probe.remove();
  return {
    width: contentW,
    height: contentH
  };
}

function summonDialog(content){
  $('body').addClass('custom-modal-open');
  var screenH = $(window).height(); 
  var contentH = probeHeight(content).height;
  var overlay = $('<div class="modal-overlay"></div>');
  var panel = $('<div class="custom-dialog"></div>');
  var offset = contentH > screenH ? 0 : Math.floor(screenH/2 - contentH/2);
  modalStack.push(overlay);
  panel.append(content);
  level++;
  overlay.css('z-index', level);
  level++;
  panel.css('z-index', level);
  panel.css('margin-top', offset+'px');
  overlay.append(panel);
  $('body').append(overlay);
}

function summonFullScreenModal(gui){
  $('body').addClass('custom-modal-open');
  var screenW = $(window).width(); 
  var screenH = $(window).height(); 
  var overlay = $('<div class="modal-overlay"></div>');
  var panel = $('<div class="custom-fullscreen"></div>');
  modalStack.push(overlay);
  panel.append(gui(screenW, screenH));
  level++;
  overlay.css('z-index', level);
  level++;
  panel.css('z-index', level);
  panel.css('width', screenW+'px');
  //panel.css('height', screenH+'px');
  overlay.append(panel);
  $('body').append(overlay);
}

function summonTallModal(content){
  $('body').addClass('custom-modal-open');
  var overlay = $('<div class="modal-overlay overlay-scroll"></div>');
  var panel = $('<div class="custom-modal-tall"></div>');
  panel.append(content);
  overlay.append(panel);
  modalStack.push(overlay);
  level++;
  overlay.css('z-index', level);
  level++;
  panel.css('z-index', level);
  $('body').append(overlay);
}

function dismissModalPanel(){
//  var panel = modalStack.pop();
  var overlay = modalStack.pop();
//  panel.remove();
  overlay.remove();
  level--;
  level--;
  if(modalStack.length == 0){
    $('body').removeClass('custom-modal-open');
  }
}

function dismissAllModals(){
  while(modalStack.length > 0){
    dismissModalPanel();
  }
}
