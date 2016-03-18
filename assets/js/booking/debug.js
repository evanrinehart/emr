var _clientActionHistory = [];
function logClientActionHistory(action, value){
  row = {action: action, actionTime: String(new Date())};
  for(var k in (value||{})){
    row[k] = value[k];
  }
  _clientActionHistory.push(row);
}

function compileDebugInfo(reason){
  var form = $('.checkout-panel');
  if(form.length > 0){
    var checkoutFormData = getCheckoutFormData(form);
  }
  else{
    var checkoutFormData = null;
  }
  try {
    var state = getClientStateVariables();
  }
  catch(e){
    var state = {error: e.message};
  }

  try {
    var browser = saysWho();
  }
  catch(e){
    var browser = {error: e.message};
  }
  
  return {
    reason: reason,
    browser: browser,
    isMobile: isMobile,
    viewport: {
      width: $(window).width(),
      height: $(window).height()
    },
    checkoutFormData: checkoutFormData,
    state: state,
    dialogText: getCurrentDialogText(),
    actionHistory: _clientActionHistory
  };
}

function postDebugInfoNow(reason){
  var data = compileDebugInfo(reason);
  $.ajax({
    method: 'post',
    url: "https://booking.escapemyroom.com/api/debug",
    contentType: 'application/json',
    data: JSON.stringify(data),
    success: function(resp){
    },
    error: function(xhr){
      throw new Error('failed to post debug log: '+xhr.responseText);
    }
  });
}
