var _clientActionHistory = [];
function logClientActionHistory(action, data){
  row = {action: action, actionTime: String(new Date())};
  for(var k in data || {}){
    row[k] = data[k];
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
    actionHistory: _clientActionHistory,
    holdIdHistory: HoldIdManager.holdIdHistory()
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



var HoldIdManager = new (function(){
  // stack of {hold_id: 'aaaa', valid: true, event: 'quote succeeded'}
  var stack = [];
  function HoldId(hold_id, event, valid){
    if(valid !== true && valid !== false) throw new Error("bool required");
    this.hold_id = hold_id;
    this.event = event;
    this.valid = valid;
  }

  this.currentHoldId = function(){
    if(stack.length > 0){
      var h = stack[stack.length - 1];
      if(h.valid) return h.hold_id;
      else return '';
    }
    else{
      return '';
    }
  }

  this.pushHoldId = function(hold_id, event){
    if(!event) throw new Error("reason required");
    stack.push(new HoldId(hold_id, event, true));
  }

  this.invalidateHoldId = function(event){
    if(!event) throw new Error("reason required");
    if(stack.length > 0){
      stack.push(new HoldId(this.currentHoldId(), event, false));
    }
    else{
      stack.push(new HoldId(null, event, false));
    }
  }

  this.holdIdHistory = function(){
    return stack;
  }
});
