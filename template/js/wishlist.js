$(function() {
    wishlistModal();
    handleNotify();
    handleWishlistToCart();
});


function wishlistModal() {
    $('[data-wl-product]').off('click').on('click',function(e){
        var el      = $(this);
        var url     = el.data('wl-product');
        var element = el.data('wl-ajax-element');
        var input   = el.data('wl-ajax-input');
        
        $(element).parent().addClass('loading-ajax');
        
        if(element !== undefined && input !== undefined) {
            $.get(url, function(html) {
                var content = $('<div>' + html.replace(/>[\n\t ]+</g, "><") + '</div>');
                $(element).html(content.find(input));
                wishlistModal();
                $(element).parent().removeClass('loading-ajax');
                initAjax();
                event.preventDefault();
            });
        } else {
            console.log("missing elements to load and placeholder to load into");
        }
    });
}

function handleNotify() {
    $('#notify').on('change', function() {
        $('.page-wrap').addClass('loading-ajax');
        $('#toggle-notify').submit();
    });
}
function handleWishlistToCart() {
    $('#wishlist-to-cart').on('click', function() {
        $('.page-wrap').addClass('loading-ajax');
        $('#wishlist-cart').submit();
    });
}