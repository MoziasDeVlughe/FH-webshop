function quickViewModal() {
    $('body').off('click', '[data-qv-product]').on('click', '[data-qv-product]', function(e){
        var el          = $(this);
        var url         = el.data('qv-product');
        var element     = el.data('qv-ajax-element');
        var input       = el.data('qv-ajax-input');
        var skipDrawer  = el.data('skip-drawer');
        $(element).parent().addClass('loading-ajax');
        
        $('#add-response-modal').modal('hide');
        $('#quick-view-modal').modal('show');
        $('#add-response-modal').on('hidden.bs.modal', function (e) {
            $('body').addClass('modal-open');
        });
        
        if(element !== undefined && input !== undefined) {
            $.get(url, function(html, status, xhr) {
                var content = $('<div>' + html.replace(/>[\n\t ]+</g, "><") + '</div>');
                $(element).html(content.find(input));
                quickViewModal();
                $(element).parent().removeClass('loading-ajax');
                initAjax();
                if (skipDrawer) {
                    $('[data-qv-product]').data('skip-drawer', true);
                    $('#quick-view-form').data('skip-drawer', true);
                }
                AddToCartAjax('#quick-view-form', '#quick-view-modal');
                if(status == "error") {
                    $('#quick-view-modal .modal-content').html('<div class="modal-header text-center"><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button><h4>' + $('#quick-view-modal').data('error-title') + '</h4></div><div class="modal-body text-center"><span class="fa-stack fa-4x text-warning"><i class="fa fa-circle-o fa-stack-2x"></i><i class="fa fa-exclamation fa-stack-1x"></i></span><p class="lead">' + $('#quick-view-modal').data('error-message') + '</p></div>');
                }
            });
        } else {
            console.log("missing elements to load and placeholder to load into");
        }
    });
}
