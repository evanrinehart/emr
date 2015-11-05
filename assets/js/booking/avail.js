/* local caching of availability data */

/*
schema for the global variable `db'
'date' => [{
  event_id: 'ZXCZCZXCZXCZXC',
  room_id: 'ABCDEF',
  room_name: 'ABC Room',
  tickets_remaining: 7,
  time: '12:00:00'
}]
*/
var db = {};

/*
schema for global variable `rooms'
[{
  room_id: 'ABCDEF',
  name: 'ABC Room',
  price: 28
}]
*/
var rooms = null;


/* the users current hold, if any */
var my_hold_id = null;

function dataPresentForDate(d){
  return db.hasOwnProperty(encodeDate(d));
}

function clearData(){
  db = {};
  rooms = null;
}

function withRooms(callback){
  if(rooms === null){
    $.ajax({
      url: "https://booking.escapemyroom.com/api/rooms",
      success: function(data){
        rooms = data;
        callback(rooms);
      },
      error: function(xhr){
        console.log(xhr);
        callback([]);
      }
    });
  }
  else{
    callback(rooms);
  }
}

function fetchData(startDate, endDate, okCb, errorCb){
  var crashMsg = 'Sorry, there was a problem fetching availability data. Please try again later.';
  $.ajax({
    method: 'get',
    url: "https://booking.escapemyroom.com/api/availability",
    data: {
      start_date: encodeDate(startDate),
      end_date: encodeDate(endDate)
    },
    success: function(results){
      if(jstype(results) != 'Object'){
        errorCb(crashMsg);
        return;
      }

/*
      function replicate(a, n){
        var i, j, L;
        var result = [];
        L = a.length;
        for(i=0; i<n; i++){
          for(j=0; j<L; j++){
            result.push(a[j]);
          }
        }
        return result;
      }
*/

      for(var k in results){
        db[k] = results[k];
      }

      for(var d=startDate; d<=endDate; d=dateAdd(d,1)){
        if(!results.hasOwnProperty(encodeDate(d))){
          console.log('result is missing one of the days requested');
          errorCb(crashMsg);
          return;
        }
      }

      okCb(db);
    },
    error: function(xhr){
      console.log(xhr);
      errorCb(crashMsg);
    }
  });
}

function withAvailabilities(startDate, endDate, callbacks){
  var d;
  var needFetch = false;
  for(d=startDate; d<=endDate; d=dateAdd(d,1)){
    if(!dataPresentForDate(d)){
      needFetch = true;
      break;
    }
  }

  if(needFetch || rooms==null){
    callbacks.fetching();
  }

  withRooms(function(rooms){
    if(needFetch){
      fetchData(
        dateAdd(startDate,-10),
        dateAdd(endDate,10),
        function(results){ callbacks.fetchDone(rooms, results); },
        callbacks.error
      );
    }
    else{
      callbacks.now(rooms, db);
    }
  });
}

/*
{
  room_id:
  event_id:
  ticket_quantity:
  promo_code:
  previous_hold_id:
  callbacks: { ok: error: }
}
*/
function fetchPrice(params){
  var priceError = 'There was a problem fetching pricing data. Please try again later.';

  $.ajax({
    method: 'post',
    url: "https://booking.escapemyroom.com/api/quote",
    data: {
      details: {
        event_id: params.event_id,
        room_id: params.room_id,
        ticket_quantity: params.ticket_quantity,
        promo_code: params.promo_code
      },
      previous_hold_id: params.previous_hold_id
    },
    success: function(data){
      if(data.ok){
        params.callbacks.ok(data.ok);
      }
      else{
console.log(data);
        params.callbacks.error(priceError);
      }
    },
    error: function(xhr){
      if(xhr.status == 400){
        params.callbacks.error(xhr.responseText);
      }
      else{
        params.callbacks.error(priceError);
      }
    }
  });
}
