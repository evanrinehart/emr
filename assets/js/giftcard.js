var globalQuoteTask = null;
var globalQuote = null;

//emr test account
var stripePubkey = 'pk_test_ersJ7dsklDhpa4dOW6Wtw1Ky';

//emr live account
//var stripePubkey = 'pk_live_JTkZUM3uXH07zDBY5DYOaFtW';
Stripe.setPublishableKey(stripePubkey);

function clearDisplayQuote(){
  $('#quoted-price-section img').hide();
  $('#quoted-price-section .quoted-price').hide();
}

function updateDisplayQuote(quote){
  $('#quoted-price-section img').hide();
  $('#quoted-price-section .quoted-price').show();
  $('#quoted-price-section .quoted-price').text('$' + quote);
}

function showQuoteSpinny(){
  $('#quoted-price-section img').show();
  $('#quoted-price-section .quoted-price').hide();
}

function enableSubmitButton(){
  $('#javascripted-submit-button input').prop('disabled', null);
  $('#javascripted-submit-button input').show();
  $('#javascripted-submit-button img').hide();
}

function disableSubmitButton(){
  $('#javascripted-submit-button input').prop('disabled', 'disabled');
}

function makeSubmitButtonSpinny(){
  $('#javascripted-submit-button input').hide();
  $('#javascripted-submit-button img').show();
}

function readFormField(fieldName){
  return $('form').find('[name="'+fieldName+'"]').val().trim();
}

function nicePopup(message){
  alert(message); //redo this
}

function submitCardInfoToStripe(callbacks){
  var field = readFormField;
  var stripe_form = $('#stripe-form');
  stripe_form.find('[data-stripe="number"]').val(field('card_number'));
  stripe_form.find('[data-stripe="cvc"]').val(field('card_cvc'));
  stripe_form.find('[data-stripe="exp-month"]').val(field('card_month'));
  stripe_form.find('[data-stripe="exp-year"]').val(field('card_year'));
  var first_name = field('purchaser_first_name');
  var last_name = field('purchaser_last_name');
  stripe_form.find('[data-stripe="name"]').val(first_name+' '+last_name);
  Stripe.card.createToken(stripe_form, function(status, response){
    if (response.error) {
      callbacks.error(response.error.message);
    }
    else {
      var token = response.id;
      callbacks.success(token);
    }
  });
}

function initiateGetQuote(ticketQuantity){
  globalQuote = null;
  disableSubmitButton();
  showQuoteSpinny();
  if(globalQuoteTask){
    globalQuoteTask.abort();
  }
  globalQuoteTask = $.ajax({
    url: 'https://booking.escapemyroom.com/gift_codes/quote',
    method: 'get',
    data: {ticket_quantity: ticketQuantity},
    success: function(data, textStatus, jqXHR){
      globalQuoteTask = null;
      globalQuote = data.total;
      updateDisplayQuote(data.total);
      enableSubmitButton();
      //console.log(data, textStatus, jqXHR);
    },
    error: function(jqXHR, textStatus, errorThrown){
      clearDisplayQuote();
      nicePopup("Sorry, gift card purchase is unavailable right now. Please try again later.");
      //console.log(jqXHR, textStatus, errorThrown);
    }
  });
}

// check the form fields and return an error message if there is a problem.
// else return "falsy"
function validateForm(){
  var field = readFormField;
  function notBlank(field, str){ if(str.trim() == '') return field + " required."; }
  var emailPattern = /^[\w+\-\.]+@\w+\.\w+$/;
  var pr = undefined;
  pr = pr || notBlank('Purchaser first name', field('purchaser_first_name'));
  pr = pr || notBlank('Purchaser last name', field('purchaser_last_name'));
  pr = pr || notBlank('Purchaser email', field('purchaser_email'));
  if(!field('purchaser_email').match(emailPattern)) return 'The purchaser email address looks invalid.';
  if(field('recipient_email').trim() != ''){
    if(!field('recipient_email').match(emailPattern)) return 'The recipient email address looks invalid.';
  }
  pr = pr || notBlank('Card number', field('card_number'));
  pr = pr || notBlank('Card CVC', field('card_cvc'));
  pr = pr || notBlank('Card expiration month', field('card_month'));
  pr = pr || notBlank('Card expiration year', field('card_year'));
  return pr;
}

$(document).on('ready', function(){
  var ticketQuantity = $('[name="ticket_quantity"]').val();
  $('#javascripted-submit-button').show();
  initiateGetQuote(ticketQuantity);
});

$(document).on('change', '[name="ticket_quantity"]', function(e){
  var ticketQuantity = $(this).val();
  initiateGetQuote(ticketQuantity);
});

$(document).on('click', '#javascripted-submit-button input', function(e){
  e.preventDefault();
  if(globalQuote === null || globalQuote === undefined){
    throw new Error('bug, trying to submit without a quote');
  }

  var problem = validateForm();
  if(problem){
    nicePopup(problem);
    return;
  }

  var field = readFormField;
  makeSubmitButtonSpinny();
  submitCardInfoToStripe({
    success: function(stripeToken){
      $.ajax({
        url: 'https://booking.escapemyroom.com/gift_codes/purchase',
        method: 'post',
        data: {
          purchaser_first_name: field('purchaser_first_name'),
          purchaser_last_name:  field('purchaser_last_name'),
          purchaser_email:      field('purchaser_email'),
          recipient_first_name: field('recipient_first_name'),
          recipient_last_name:  field('recipient_last_name'),
          recipient_email:      field('recipient_email'),
          ticket_quantity:      field('ticket_quantity'),
          expected_total:       globalQuote,
          stripe_token:         stripeToken
        },
        success: function(data, textStatus, jqXHR){
          window.location = data.location;
        },
        error: function(jqXHR, textStatus, errorThrown){
          console.log(jqXHR, textStatus, errorThrown);
          enableSubmitButton();
          nicePopup("Sorry, the purchase failed. Please try again later.");
        }
      });
    },
    error: function(problem){
      enableSubmitButton();
      nicePopup(problem);
    }
  });
});
