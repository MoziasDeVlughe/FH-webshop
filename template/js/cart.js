$('body').on('cart:updated', function(event, data) {
    if (!!data) {
        var count = ((data && data.items) || []).reduce(function(acc, item) {
            return acc + item.quantity;
        }, 0);
        
        $('.cart-toggle').find('.badge').text(count);
    }
});
