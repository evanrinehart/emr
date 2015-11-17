var maxTicketCount = 7;
var targetColumnWidth = 160;

var old_ticket_quantity_kludge = 2;

//developer test account
//var stripePubkey = 'pk_test_lPTj3zvBP0Kl2DgWKguSzrmS';

//emr test account
var stripePubkey = 'pk_test_fU4QhTgnzPSFcdiKofY0z65J';

//emr live account
//var stripePubkey = 'pk_live_8dhr179Vis0HpJkvhB4LPyZd';
Stripe.setPublishableKey(stripePubkey);

var state = {
  baseDate: dateToday(),
  room: undefined,
  ticketCount: 2
};

function computeDynamicColumnCount(width){
  return Math.floor(width / targetColumnWidth);
}

var monthOptions = range(1, 12).map(function(n){
  return {
    value: n,
    label: monthNames[n-1]
  };
});

/*
function filterWidget(fieldLabel, valueLabel, containerClass, buttonClass, icon){
  with(HTML){
    return span({class: 'filter-widget-group '+containerClass},
      (fieldLabel ? label(fieldLabel) : ''),
      span({class: 'filter-widget '+buttonClass},
        valueLabel,' ',
        span("▼")
      )
    );
  }
}
*/

function dialog(header, message, onClose){
  return function(mode, w, h){
    with(HTML){
      var e = element(
        div({class: 'dialog-panel', style: mode=='small'?'width: 400px':''},
          div({class: 'title'}, h1({class: 'inline-block'}, header)),
          div({class: 'dialog-body'}, message),
          div({class: 'dialog-footer'},
            a({class: 'dialog-button dialog-dismiss'}, 'OK')
          )
        )
      );
      e.onClose = onClose;
      return e;
    }
  };
}

function roomSelect(roomId, rooms){
  with(HTML){
    return selectWithConfig({
      options: [].concat(
        [{value: 'any-room', label: 'Any Room'}],
        rooms.map(function(r){ return {value: r.room_id, label: r.name}; })
      ),
      selected: roomId,
      attributes: { name: 'select-room' }
    });
  }
}

function ticketSelect(ticketCount){
  with(HTML){
    return selectWithConfig({
      options: [].concat(
        range(1,7).map(function(n){ return {value: n, label: n}; }),
        [{value: 'too-many', label: '8+'}]
      ),
      selected: ticketCount,
      attributes: {name: 'select-ticket-count'}
    });
  }
}

// generate or regenerate the widget from surrounding dimensions and state data
function bookingWidget(width, height, room, ticketCount, baseDate, rooms, availabilities, loading){
  var widget;
  var columnCount = computeDynamicColumnCount(width);
  var columnWidth = Math.floor((width - 50 - 50) / columnCount);
  var arrowWidth = (width - columnWidth*columnCount) / 2;
  var staticTitleHeight = 28;
  var staticFiltersHeight = 62;
  var staticHeadersHeight = 27;
  var listHeight = height - (staticTitleHeight + staticFiltersHeight + staticHeadersHeight + 10);

  with(HTML){
    return element(
      div({class: 'booking-widget'},
        div({class: 'title'},
          h1({class: 'inline-block'}, "BUY TICKETS"),
          a({class: 'modal-dismiss close-button'}, i({class: 'fa fa-close'}))
        ),
        div({class: 'filter-section'},
          input({type: 'hidden', name: 'previous-hold-id', value: ''}),
          div({class: 'some-space-below'},
            span(roomSelect(room, rooms||[])),' ',
            span(label('Tickets'), nbsp, ticketSelect(ticketCount)),' ',
            span({class: 'select-date-section'},
              i({class: 'fa fa-calendar'}),nbsp,
              a({class: "stylized-link summon-datepicker"},
                "Select&nbspDate"
              )
            )
          )
/*
,
          div({class: 'select-date-section'},
            i({class: 'fa fa-calendar'}),nbsp,
            a({class: "stylized-link summon-datepicker"},
              "Select Date ..."
            )
          )
*/
        ),
        div({class: 'clearfix'}),
        table({class: 'lower-section'},
          loading ?
            tr({class: 'loading'}, td(), td(i({class: 'fa fa-spinner fa-pulse'}), " LOADING"), td()) :
            tr(
              td({class: "left-arrow"}, a({class: 'left-arrow arrow'}, '&lang;')),
              td(
                div({class: 'list-heading'},
                  table(tr(range(0, columnCount-1).map(function(i){
                    var d = dateAdd(baseDate, i);
                    var text = formatHeaderDate(d);
                    return th({style: 'width: '+columnWidth+'px'}, text);
                  })))
                ),
                div({class: 'inner-container', style: 'height: '+listHeight+'px'},
                  table({class: 'inner-table'}, tr(range(0, columnCount-1).map(function(i){
                    var d = dateAdd(baseDate, i);
                    var slots = availabilities[encodeDate(d)].filter(function(av){
                      if(room && av.room_id != room) return false;
                      if(av.tickets_remaining < ticketCount) return false;
                      return true;
                    });
                    var contents;

                    function compare(s1, s2){
                      var t1 = s1.time;
                      var t2 = s2.time;
                      return t1 > t2 ? 1 : (t1 < t2 ? -1 : 0);
                    }

                    if(slots.length > 0){
                      contents = slots.sort(compare).map(function(slot){
                        return div(
                          {
                            'class': 'result slot '+roomColor(slot.room_name),
                            'data-room-id': slot.room_id,
                            'data-event-id': slot.event_id,
                            'data-room-name': slot.room_name,
                            'data-date': encodeDate(d),
                            'data-time': slot.time,
                            'data-remaining-tickets': slot.tickets_remaining
                          },
                          formatSlot(slot)
                        )
                      });
                    }
                    else{
                      contents = div({class: 'result'}, "No matches for this date.");
                    }
                    return td({style: 'width: '+columnWidth+'px'}, contents);
                  })))
                )
              ),
              td({class: "right-arrow"}, a({class: 'right-arrow arrow'}, '&rang;'))
            )
        )
      )
    );
  }
}

function checkoutPanel(data){

  with(HTML){
    function row(lab, name, value, readonly, card){
      with(HTML){
        var cc_field = card ? {class:'cc_field'} : {};
        var attrs = {name: name, value: value||'', class: 'wide'};
        if(readonly) attrs.readonly = 'readonly';
        return tr(
          cc_field,
          td({class: 'sized-column'}, label(lab)),
          td({class: 'right'}, input(attrs))
        );
      }
    }

    function usedCode(code, charge){
      with(HTML){
        return tr(
          td(
            code, ' ',
            '(', a({href:'#', class: 'ui-link remove-code'}, 'remove'), ')'
          ),
          td({class: 'right'}, money(charge))
        );
      }
    }

    var horizontal_rule = [
      tr({class: 'space-row'}, td(), td()),
      tr({class: 'rule-row'}, td(), td()),
      tr({class: 'space-row'}, td(), td())
    ];

    return element(div({class: 'checkout-panel',},
      div({class: 'title'},
        h1({class: 'inline-block'}, "CHECKOUT"),
        a({class: 'modal-dismiss close-button'}, i({class: 'fa fa-close'}))
      ),
      div({class: 'checkout-body'},
        input({type: 'hidden', name: 'room_id', value: data.room_id}),
        input({type: 'hidden', name: 'event_id', value: data.event_id}),
        input({type: 'hidden', name: 'total', value: ''}),
        form({class: 'stripe-form'},
          input({type: 'hidden', 'data-stripe': 'number'}),
          input({type: 'hidden', 'data-stripe': 'cvc'}),
          input({type: 'hidden', 'data-stripe': 'exp-month'}),
          input({type: 'hidden', 'data-stripe': 'exp-year'})
        ),
        table({class: 'checkout-form'},
          tr(td(label('Room')), td({class: 'right'}, data.room_name)),
          tr(td(label('Date')), td({class: 'right'}, formatHeaderDate(data.date))),
          tr(td(label('Time')), td({class: 'right'}, formatTime(data.time))),
          horizontal_rule,
          tr(
            td(label('Tickets')),
            td({class: 'right'}, selectWithConfig({
              selected: data.desired_ticket_count,
              options: range(1, data.remaining_tickets).map(function(n){ return {value: n, label: n}; }),
              attributes: {name: 'ticket_count', style: 'width:100%'}
            }))
          ),
          row('First Name', 'first_name'),
          row('Last Name', 'last_name'),
          row('Email', 'email'),
          row('Phone', 'phone'),
          tr(
            td({class: 'sized-column'},
              label('Gift Code'),' ',
              a({
                class: 'my-tooltip',
                title: "Gift codes are generated when gift cards are purchased. We don't offer any discounts or promotions at this time."
              }, '?')
            ),
            td({class: 'right'}, input({class: 'wide', name:'promo_code'}))
          ),
          horizontal_rule,
/*
          tr(td('Price'), td({class: 'right'}, span({class: 'total'}, '$'+data.price.toFixed(2)))),
          usedCode('ABC123', -9),
          usedCode('XYZ000', -3),
          tr(
            td(""),
            td({class: 'right'},
              input({class: 'half', name: 'promo-code'})
            )
          ),
          tr(
            td(""),
            td({class: 'right'},
              a({href:'#', class: 'float-right ui-link small add-code'}, 'Use gift/promo code')
            )
          ),
          tr({class: 'space-row'}, td(), td()),
*/
          tr(
            td('TOTAL'),
            td({class: 'right'},
              span({class: 'calculating-indicator'},
                i({class: 'fa fa-spinner fa-spin'}), ' Calculating ...'
              ),
              span({class: 'total'}, '')
            )
          ),
          row('Card Number', 'card_number', undefined, undefined, true),
          row('Card CVC', 'card_cvc', undefined, undefined, true),
          tr({class: 'cc_field'},
            td(label('Card Expiration')),
            td({class: 'right'},
              selectWithConfig({
                placeholder: 'Month',
                attributes: {name: 'card_month'},
                options: monthOptions
              }),' ',
              input({class: 'narrow', name: 'card_year', placeholder: 'YYYY'})
            )
          ),
          tr(
            td('Time Left'),
            td({class: 'right'},
              span({class: 'booking-timeout'}, '')
            )
          )
        )
      ),
      div({class: 'complete-purchase'},
        span({class: 'processing-indicator'}, i({class: 'fa fa-spinner fa-spin'}), ' Processing ...'),
        a({class: 'checkout-button', tabindex:'0'}, 'Complete Purchase'))
    ));
  }
}

function roomColor(room){
  switch(room){
    case 'Mardi Gras Study': return 'mardi-gras-study';
    case 'Jazz Parlor': return 'jazz-parlor';
    default: return 'color4';
  }
}

function formatHeaderDate(d){
  return [dayNames[d.getDay()], ' ', d.getMonth()+1, '/', d.getDate()];
}

function formatTime(text){
  var parts = text.split(':');
  var minutes = parts[1];
  var hours = parts[0];
  var hoursInt = parseInt(hours);
  var ampm = hoursInt >= 12 ? 'PM' : 'AM';
  if(hoursInt > 12) hoursInt %= 12;
  return [hoursInt.toString(), ':', minutes, ' ', ampm];
}

function formatDateForButton(d){
  return monthNames[d.getMonth()+1] + ' ' + d.getDate();
}

function formatSlot(slot){
  var span = HTML.span;
  var color = roomColor(slot.room_name);
  return [
    span({class: 'time'}, formatTime(slot.time)), '<br>',
    slot.room_name,' ',
    span({class: 'remaining bg-'+color}, slot.tickets_remaining, ' tickets')
  ];
}

function validateCheckoutForm(form){
  function field(f){ return form.find('[name="'+f+'"]').val(); }
  function blank(x){ return x.trim() == ''; }
  if(blank(field('first_name'))) return 'First name is required.';
  if(blank(field('last_name'))) return 'Last name is required.';
  if(blank(field('email'))) return 'Email is required.';
  if(!field('email').match(/^\w+@\w+\.\w+$/)) return 'The email address looks invalid.';
  if(blank(field('phone'))) return 'A phone number is required.';
  if(!field('phone').match(/^([0-9]|\(|\)|\s|-)+$/)) return 'The phone number looks invalid.';
  var total = parseFloat(field('total'));
  if(total == 0) return null;
  if(blank(field('card_number'))) return 'Please enter a valid credit card number.'; 
  if(blank(field('card_cvc'))) return "Please enter the card's CVC security code.";
  if(blank(field('card_month'))) return 'Please select an expiration month.';
  if(blank(field('card_year'))) return "Please enter the card's expiration year.";
  if(!field('card_year').match(/^\d+$/)) return "Invalid expiration year.";
  return null;
}

$(document).on('click', '.activate-booking', function(e){
  e.preventDefault(); 
  reloadBookingUI();
});

$(document).on('click', '.my-tooltip', function(e){
  e.preventDefault(); 
  var msg = $(this).attr('title');
  summonDialog(dialog('Gift Codes', msg));
});

//ww2
$(document).on('click', '.booking-widget .summon-datepicker', function(e){
  e.preventDefault();
  if(booking_loading_flag) return;
  summonDialog(datepicker({
    today: dateToday(),
    selectedDate: state.baseDate,
    currentMonth: firstOfMonth(dateToday()),
    ok: function(date){
      state.baseDate = date;
      reloadBookingUI();
    }
  }));
});

$(document).on('click', '.modal-dismiss', function(e){
  e.preventDefault();
  dismissModalPanel();
});

$(document).on('click', '.modal-overlay', function(e){
  var overlay = $(this).closest('.modal-overlay')[0];
  if(e.target == overlay || $(e.target).hasClass('darkness')){
    dismissModalPanel();
  }
});

$(document).on('click', '.booking-widget a.left-arrow', function(e){
  e.preventDefault();
  var today = dateToday();
  if(state.baseDate > today){
    state.baseDate = dateAdd(state.baseDate, -1);
    reloadBookingUI();
  }
});

$(document).on('click', '.booking-widget a.right-arrow', function(e){
  e.preventDefault();
  state.baseDate = dateAdd(state.baseDate, 1);
  reloadBookingUI();
});

$(window).on('resize', function(e){
  var main = $('.booking-widget');
  if(main.length > 0){
    var screenW = $(window).width();
    var screenH = $(window).height();
    var width = computeDynamicLargePanelWidth(screenW);
    main.parent().css('width', width+'px');
//    main.parent().css('height', screenH+'px');
    if(main.find('.loading').length == 0){
      reloadBookingUI();
    }
  }
});

$(document).on('click', '.booking-widget .slot', function(e){
  e.preventDefault();
  var previous_hold_id = $('[name="previous-hold-id"]').val();
  var desired_ticket_count = $('[name="select-ticket-count"]').val();
  var ele = $(this);
  function data(name){ return ele.attr('data-'+name); }
  var room_id = data('room-id');
  var event_id = data('event-id');
  summonTallModal(checkoutPanel({
    room_id: data('room-id'),
    event_id: data('event-id'),
    room_name: data('room-name'),
    desired_ticket_count: desired_ticket_count,
    remaining_tickets: data('remaining-tickets'),
    date: readDate(data('date')),
    time: data('time')
  }));

  fetchPrice({
    room_id: room_id,
    event_id: event_id,
    ticket_quantity: desired_ticket_count,
    previous_hold_id: previous_hold_id,
    callbacks: {
      ok: function(result){
        var total = result.total;
        old_ticket_quantity_kludge = desired_ticket_count;
        $('[name="previous-hold-id"]').val(result.hold_id);
        var panel = $('.checkout-panel');
        panel.find('.calculating-indicator').hide();
        panel.find('[name="total"]').val(total);
        panel.find('.total').text(money(total));
        panel.find('.total').show();

        updateCardDisable();

        resetBookingTimeout();
      },
      error: function(problem){
        summonDialog(dialog('ERROR', problem, function(){
          dismissModalPanel();
        }));
      }
    }
  });
});

$(document).on('change', '.booking-widget [name="select-room"]', function(e){
  e.preventDefault();
  var roomId = $(this).val();
  if(roomId == 'any-room'){
    delete state.room;
  }
  else{
    state.room = roomId;
  }
  reloadBookingUI();
});

$(document).on('change', '.booking-widget [name="select-ticket-count"]', function(e){
  e.preventDefault();
  var n = $(this).val();
  if(n == 'too-many'){
    this.value = state.ticketCount;
    summonDialog(dialog(
      '8+ TICKETS',
      'Please call for more information on booking 8 or more tickets at a time.'
    ));
  }
  else{
    state.ticketCount = parseInt(n);
    reloadBookingUI();
  }
});

// To reset the box in case they choose 8+ on iOS which does not allow
// updating the value during the change handler. iOS happens to execute
// the blur event immediately after change.
$(document).on('blur', '.booking-widget [name="select-ticket-count"]', function(e){
  this.value = state.ticketCount;
});

$(document).on('click', '.checkout-panel .checkout-button', function(e){
  e.preventDefault();
  var button = $(this);
  var form = $(this).closest('.checkout-panel');
  var problem = validateCheckoutForm(form);
  if(problem){
    summonDialog(dialog('ERROR', problem));
    return;
  }
  var loading = form.find('.processing-indicator');
  var field = function(name){ return form.find('[name="'+name+'"]').val(); };
  var ticket_count = parseInt(field('ticket_count'));

  function book(token){ 
    var data = {
      event_id: field('event_id'),
      room_id: field('room_id'),
      hold_id: $('[name="previous-hold-id"]').val(),
      ticket_quantity: ticket_count,
      first_name: field('first_name'),
      last_name: field('last_name'),
      email: field('email'),
      phone: field('phone'),
      expecting_to_pay: field('total'),
      promo_code: field('promo_code'),
      stripe_token: token
    };

    $.ajax({
      method: 'post',
      url: 'https://booking.escapemyroom.com/api/book',
      data: data,
      success: function(response){
        if(response.ok){
          summonDialog(dialog(
            'COMPLETE',
            "Checkout Complete! Check your email for tickets and the receipt.",
            function(){ dismissAllModals(); }
          ));
        }
        else {
          summonDialog(dialog(
            'ERROR',
            'Sorry, a problem occurred with your purchase. Try again later.',
            function(){ 
              button.show();
              loading.hide();
            }
          ));
        }
      },
      error: function(xhr){
        console.log(xhr);
        summonDialog(dialog(
          'ERROR',
          'Sorry, a problem occurred with your purchase. Try again later.',
          function(){ 
            button.show();
            loading.hide();
          }
        ));
      }
    });
  }

  if(parseFloat(field('total')) > 0){
    var stripe_form = form.find('.stripe-form');
    stripe_form.find('[data-stripe="number"]').val(field('card_number'));
    stripe_form.find('[data-stripe="cvc"]').val(field('card_cvc'));
    stripe_form.find('[data-stripe="exp-month"]').val(field('card_month'));
    stripe_form.find('[data-stripe="exp-year"]').val(field('card_year'));
    Stripe.card.createToken(stripe_form, function(status, response){
      if (response.error) {
        summonDialog(dialog(
          'ERROR',
          response.error.message,
          function(){ 
            button.show();
            loading.hide();
          }
        ));
      }
      else {
        var token = response.id;
        book(token);
      }
    });
  }
  else{
    book(null);
  }

  button.hide();
  loading.show();
});

$(document).on('change', '.checkout-panel [name="promo_code"]', function(e){
  var code = $(this).val();
  $(this).val(code.toUpperCase());
  recalculatePrice();
});

/*
function summonSelectoPanel(options, action){
  
}

$(document).on('click', '.booking-widget .select-room', function(e){
  e.preventDefault();
  withRooms(function(rooms){
    var options = rooms.map(function(room){
      return {label: room.name, value: room.id};
    });
    summonSelectoPanel(options, function(room){
      if(room == ''){
        delete state.room;
      }
      else{
        state.room = room;
      }
      reloadBookingUI();
    });
  });
});

$(document).on('click', '.booking-widget .select-ticket-count', function(e){
  e.preventDefault();
});
*/

function calendarWidget(d){
  return function(panelW, panelH){
    with(HTML){
      return element(div({class: 'calendar-widget'},
        div({class: 'title'},
          h1({class: 'inline-block'}, "SELECT DATE"),
          a({class: 'modal-dismiss close-button'}, i({class: 'fa fa-close'}))
        ),
        div([div(d.toString()), div(1, 2, 3, 4, 5)])
      ));
    }
  }
}

$(document).on('click', '.booking-widget .select-date', function(e){
  e.preventDefault();
//  summonModalPanel(calendarWidget(state.baseDate));
});

function reloadMainModalPanel(ctor){
  var panel = $('.booking-widget').parent();
  if(panel.length > 0){
    var width = computeDynamicLargePanelWidth($(window).width());
    var content = ctor(width, $(window).height());
    panel.empty();
    panel.append(content);
  }
  else{
    summonFullScreenModal(ctor);
  }
}

/* use this to open the panel or reload it after something has changed */
function reloadBookingUI(){
  var baseDate = state.baseDate;
  var width = computeDynamicLargePanelWidth($(window).width());
  var columns = computeDynamicColumnCount(width);
  var tickets = state.ticketCount;
  var room = state.room;
  withAvailabilities(baseDate, dateAdd(baseDate, columns), {
    now: function(rooms, availabilities){
      reloadMainModalPanel(function(w, h){
        return bookingWidget(w, h, room, tickets, baseDate, rooms, availabilities);
      });
    },
    fetching: function(){
      reloadMainModalPanel(function(w, h){
        return bookingWidget(w, h, room, tickets, baseDate, rooms, {}, 'loading');
      });
    },
    fetchDone: function(){
      reloadBookingUI();
    },
    error: function(message){
      state.baseDate = dateToday();
      state.tickets = 1;
      clearData();
      dismissAllModals();
      console.log(message);
      with(HTML){
        summonDialog(dialog('ERROR', message));
      }
    }
  });
}


$(document).on('click', '.dialog-dismiss', function(e){
  e.preventDefault();
  var onClose = $(this).closest('.dialog-panel')[0].onClose;
  dismissModalPanel();
  if(onClose) onClose();
});

function recalculatePrice(){
  var previous_hold_id = $('[name="previous-hold-id"]').val();
  var form = $('.checkout-panel');
  var loading = form.find('.calculating-indicator');
  var button = form.find('.checkout-button');
  var room_id = form.find('[name="room_id"]').val();
  var event_id = form.find('[name="event_id"]').val();
  var promo_code = form.find('[name="promo_code"]').val();
  var ticket_count = form.find('[name="ticket_count"]').val();
  var total_span = form.find('span.total');
  var total_input = form.find('[name="total"]');
  fetchPrice({
    room_id: room_id,
    event_id: event_id,
    ticket_quantity: ticket_count,
    previous_hold_id: previous_hold_id,
    promo_code: promo_code,
    callbacks: {
      ok: function(result){
        console.log(result);
        $('[name="previous-hold-id"]').val(result.hold_id);
        var total = result.total;
        old_ticket_quantity_kludge = ticket_count;
        loading.hide();
        button.show();
        total_span.text('$'+total.toFixed(2));
        total_span.show();
        total_input.val(total);

        updateCardDisable();
        resetBookingTimeout();
      },
      error: function(problem){
        loading.hide();
        total_span.show();
        form.find('[name="ticket_count"]').val(old_ticket_quantity_kludge);
        summonDialog(dialog('ERROR', problem));
      }
    }
  });
  loading.show();
  total_span.hide();
}


$(document).on('change', 'select[name="ticket_count"]', function(){
  var previous_hold_id = $('[name="previous-hold-id"]').val();
  var form = $(this).closest('.checkout-panel');
  var loading = form.find('.calculating-indicator');
  var button = form.find('.checkout-button');
  var room_id = form.find('[name="room_id"]').val();
  var event_id = form.find('[name="event_id"]').val();
  var promo_code = form.find('[name="promo_code"]').val();
  var ticket_count = $(this).val();
  var total_span = form.find('span.total');
  var total_input = form.find('[name="total"]');
  fetchPrice({
    room_id: room_id,
    event_id: event_id,
    ticket_quantity: ticket_count,
    previous_hold_id: previous_hold_id,
    promo_code: promo_code,
    callbacks: {
      ok: function(result){
        console.log(result);
        $('[name="previous-hold-id"]').val(result.hold_id);
        var total = result.total;
        old_ticket_quantity_kludge = ticket_count;
        loading.hide();
        button.show();
        total_span.text('$'+total.toFixed(2));
        total_span.show();
        total_input.val(total);

        resetBookingTimeout();
        updateCardDisable();
      },
      error: function(problem){
        loading.hide();
        total_span.show();
        form.find('[name="ticket_count"]').val(old_ticket_quantity_kludge);
        summonDialog(dialog('ERROR', problem));
      }
    }
  });
  loading.show();
  total_span.hide();
});


function updateCardDisable(){
  var total = parseFloat($('.checkout-panel [name="total"]').val());
  console.log(total);
  if(total == 0){
    $('.checkout-panel .cc_field input').attr('disabled', 'disabled');
    $('.checkout-panel .cc_field input').val('');
    $('.checkout-panel .cc_field select').attr('disabled', 'disabled');
    $('.checkout-panel .cc_field select').val('');
  }
  else{
    $('.checkout-panel .cc_field input').attr('disabled', null);
    $('.checkout-panel .cc_field select').attr('disabled', null);
  }
}


function resetBookingTimeout(){
  function pad(x){
    if(x < 10){ return '0'+x; }
    else return String(x);
  }

  BookingTimeout.start(
    300,
    function(i){
      if($('.checkout-panel').length == 0){
        BookingTimeout.cancel();
      }
      else{
        var mins = Math.floor(i / 60);
        var secs = i % 60;
        var msg = mins + ':' + pad(secs);
        $('.booking-timeout').text(msg);
      }
    },
    function(){
      dismissAllModals();
      var msg = "Sorry, your temporary ticket reservation has expired."
      summonDialog(dialog("TIME'S UP", msg));
    }
  );
}
