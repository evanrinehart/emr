function compileDebugInfo(){
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
    browser: browser,
    isMobile: isMobile,
    viewport: {
      width: $(window).width(),
      height: $(window).height()
    },
    checkoutFormData: checkoutFormData,
    state: state,
    dialogText: getCurrentDialogText()
  };
}

function postDebugInfoNow(){
  var data = compileDebugInfo();
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
