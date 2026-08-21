function giftWrapAjaxAdd(form) {
    form = $(form);
    form.on('submit', function (e) {
        var url = $(this).attr('action');
        var formid = "#" + $(this).attr('id');
        form = $(formid);
        $.ajax({
            type: "POST",
            url: url,
            data: form.serialize(),
            beforeSend: function () {
                $(".content").addClass('loading-ajax');
            }, 
            success: function (event, request, settings) {
                var source  = form.data('cart-url');
                var element = form.data('cart-ajax-element');
                var input   = form.data('cart-ajax-input');
                $(element).load(source + ' ' + input , function(){
                    $(".content").removeClass('loading-ajax');
                    initCartPage();
                    
                    $('.alert-row').html('<div class="col-xs-12"><div class="alert alert-success alert-dismissable" role="alert">' + event.message + '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div></div>');
                    
                });
            },
            error: function (error) {
                $(".content").removeClass('loading-ajax');
            }
        });
        e.preventDefault();
    });
}

function giftWrapAjaxDel() {
    
    $('.delete-gift-wrap').on('click', function(e) {
        var el = $(this);
        $.ajax({
            url : $(this).data('cart-href'),
            beforeSend: function () {
                $(".content").addClass('loading-ajax');
            }, 
            success: function (event, request, settings) {
                var source  = el.data('cart-url');
                var element = el.data('cart-ajax-element');
                var input   = el.data('cart-ajax-input');
                $(element).load(source + ' ' + input , function(){
                    $(".content").removeClass('loading-ajax');
                    initCartPage();
                    
                    $('.alert-row').html('<div class="col-xs-12"><div class="alert alert-success alert-dismissable" role="alert">' + event.message + '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div></div>');
                    
                });
            },
            error: function (error) {
                $(".content").removeClass('loading-ajax');
            }
        });
        e.preventDefault();
    });
}

