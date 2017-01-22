var AnalyticsEcommerce = new (function(){

  function genericTrackPurchase(itemName, params){
    var name = params.name;
    var datetime = params.datetime;
    var quantity = params.quantity;
    var total = params.total;

    if(!name)      throw new Error('name missing');
    if(!datetime)  throw new Error('datetime missing');
    if(!quantity && quantity !== 0)  throw new Error('quantity missing');
    if(!total)     throw new Error('total missing');

    var unitPrice = String(parseFloat(total) / quantity);

    var transactionId = Sha1.hash(itemName+' '+name+' '+String(datetime));
    
    ga('ecommerce:addTransaction', {
      'id': transactionId,
      'affiliation': 'Escape My Room',
      'revenue': total
    });

    ga('ecommerce:addItem', {
      'id': transactionId,
      'name': itemName,
      'price': unitPrice,
      'quantity': quantity
    });

    ga('ecommerce:send');
  }

  this.trackTicketPurchase = function(params){ return genericTrackPurchase('Tickets', params); }
  this.trackGiftCardPurchase = function(params){ return genericTrackPurchase('Gift Card', params); }

});

