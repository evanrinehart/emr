function jstype(x){
  var raw = ({}).toString.call(x)
  var results = raw.match(/\[object (\w+)\]/)
  if(results){
    return results[1];
  }
  else {
    throw new Error("unknown jstype ("+raw+")");
  };
}

function range(a, b){
  var r = [];
  var i;
  for(i=a; i<=b; i++){
    r.push(i);
  }
  return r;
}

function replicate(x, n){
  var r = [];
  var i;
  for(i=0; i<n; i++){
    r.push(x);
  }
  return r;
}

function zipWith(as, bs, f){
  var i;
  var L = as.length;
  var r = [];
  for(i=0; i<L; i++){
    r.push(f(as[i], bs[i]));
  }
  return r;
}

var dayNames = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
var lowercaseDayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
var monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
var longMonthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

function dateToday(){
  var now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function dateAdd(d, n){
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()+n);
}

function firstOfMonth(d){
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function monthAdd(d, n){
  return new Date(d.getFullYear(), d.getMonth()+n, 1);
}

function readDate(text){
  var parts = text.split('-');
  var year = parseInt(parts[0]);
  var month = parseInt(parts[1]);
  var day = parseInt(parts[2]);
  return new Date(year, month-1, day);
}

function encodeDate(d){
  function pad(x){
    if(x.length < 2) return '0'+x;
    else return x;
  }

  return [
    d.getFullYear(),
    pad((d.getMonth()+1).toString()),
    pad(d.getDate().toString())
  ].join('-');
}

function money(amount){
  var neg = amount < 0 ? '-' : '';
  return neg+'$'+Math.abs(amount).toFixed(2);
}


function flip(){
  if(Math.random() < 0.5) return true;
  else return false;
}


function monthLength(month){
  return new Date(month.getFullYear(), month.getMonth()+1, 0).getDate();
}

function dateEq(d1,d2){
  return d1.getFullYear()==d2.getFullYear() &&
    d1.getMonth() == d2.getMonth() &&
    d1.getDate() == d2.getDate();
}

function isDefined(name){
  try{
    eval(name);
    return true;
  }
  catch(x){ 
    return false;
  }
}
