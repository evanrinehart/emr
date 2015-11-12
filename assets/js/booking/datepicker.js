
function calendarForMonth(year, month){
  
}

function datepicker(config){

  var currentMonth = config.currentMonth;
  var today = config.today;
  var selectedDate = config.selectedDate;
  var selectedMonth = firstOfMonth(selectedDate);

  var monthOptions = range(0,7).map(function(i){
    return monthAdd(currentMonth, i);
  });

  function pad(n){
    if(n >= 10){
      return String(n);
    }
    else{
      return '0'+n;
    }
  }

  function monthLabel(month){
    return monthNames[month.getMonth()]+" \'"+pad(month.getFullYear()%100);
  }

  function monthButton(month){
    var sel = dateEq(month,selectedMonth) ? ' selected' : '';
    with(HTML){
      return a({
        'data-month': encodeDate(month),
        class: 'month-button'+sel
      }, monthLabel(month));
    }
  }

  function calendar(month, selected){
    var offset = month.getDay();
    var numDays = monthLength(month);
    var u = undefined;
    var grid = [ // 7x6
      [u,u,u,u,u,u,u],
      [u,u,u,u,u,u,u],
      [u,u,u,u,u,u,u],
      [u,u,u,u,u,u,u],
      [u,u,u,u,u,u,u],
      [u,u,u,u,u,u,u]
    ];
    var i, j, c;

    c=1;
    i=offset;
    for(j=0; j<6; j++){
      for(; i<7; i++){
        if(c > numDays) break;
        grid[j][i] = c;
        c++;
      }
      i=0;
    }

    with(HTML){
      return div({class: 'calendar'},
        h4(longMonthNames[month.getMonth()]," ",month.getFullYear()),
        table(
          tr(th('S'),th('M'),th('T'),th('W'),th('T'),th('F'),th('S')),
          tr({class: 'space-row'},td(''),td(''),td(''),td(''),td(''),td(''),td('')),
          grid.map(function(row){
            return tr(row.map(function(n){
              if(!n) return td('');
              var d = new Date(month.getFullYear(), month.getMonth(), n);
              var sel = selected && dateEq(selected,d) ? ' selected' : '';
              if(d >= today){
                return td(
                  {
                    'data-date': encodeDate(d),
                    class: 'date-button'+sel
                  },
                  n ? n : ''
                );
              }
              else{
                return td({class: 'disabled-date'}, n);
              }
            }));
          })
        )
      );
    }
  }

  var gui;
  with(HTML){
    gui = element(
      div({class: 'dialog-panel emr-datepicker'},
        div({class: 'title'},
          h1({class: 'inline-block'}, 'SELECT DATE'),
          a({class: 'modal-dismiss close-button'}, i({class: 'fa fa-close'}))
        ),
        div({class: 'dialog-body'},
          calendar(selectedMonth, selectedDate),
          div({class: 'divider'}, '...'),
          div({class: 'month-menu'},
            table(
              tr(monthOptions.slice(0,4).map(function(m){ return td(monthButton(m)); })),
              tr(monthOptions.slice(4,8).map(function(m){ return td(monthButton(m)); }))
            )
          )
        )
      )
    );
  }

  gui.setMonth = function(month, selected){
    var cal = $(gui).find('.calendar');
    var newContent = HTML.element(calendar(month, selected));
    cal.replaceWith(newContent)
  };

  gui.confirmCb = config.ok;

  return gui;
}

$(document).on('click', '.emr-datepicker .dialog-confirm', function(){
  // step0 gather result of form
  // step1 dismiss panel
  // step2 execute cb with result of form
  var dialog = $(this).closest('.emr-datepicker')[0];
  var value = dialog.gatherResult();
  var cb = dialog.confirmCb;
  dismissModalPanel();
  cb(value);
});


$(document).on('click', '.emr-datepicker .month-button', function(e){
  e.preventDefault();
  var dialog = $(this).closest('.emr-datepicker');
  dialog.find('.month-button').removeClass('selected');
  $(this).addClass('selected');
  var selection = state.baseDate;
  var newMonth = readDate($(this).data('month'));
  dialog[0].setMonth(newMonth, selection);
});

$(document).on('click', '.emr-datepicker .date-button', function(e){
  e.preventDefault();
  var d = readDate($(this).data('date'));
  var dialog = $(this).closest('.emr-datepicker');
  dialog.find('.month-button').removeClass('selected');
  var cb = dialog[0].confirmCb;
  dismissModalPanel();
  cb(d);
});
