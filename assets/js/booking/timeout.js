var BookingTimeout = {};

(function(){

  var timeoutId = null;

  function cancel(){
    if(timeoutId){
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  BookingTimeout.start = function(counterMax, countCb, endCb){
    cancel();
    var i = counterMax;
    timeoutId = setInterval(function(){
      if(i == 0){
        cancel();
        endCb();
      }
      else{
        i--;
        countCb(i);
      }
    }, 1000);
  }

  BookingTimeout.cancel = cancel;

})();
