function shareModal() {
    $('[data-share-product]').off('click').on('click',function(e){
        var el      = $(this);
        var url     = el.data('share-product');
        var element = el.data('share-ajax-element');
        var input   = el.data('share-ajax-input');
        $(element).parent().addClass('loading-ajax');
        
        $('#share-modal').removeClass('text-center');
        if(element !== undefined && input !== undefined) {
            $(element).load(url + ' ' + input , function(response, status, xhr){
                shareModal();
                initAjax();
                $(element).parent().removeClass('loading-ajax');
                $('.social-share').off('click').on('click', function() {
                    window.open($(this).data('af-href'));
                });
                shareCopy();
                if(status == "error") {
                    $('#share-modal .modal-content').html('<div class="modal-header text-center"><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button><h4>' + $('#quick-view-modal').data('error-title') + '</h4></div><div class="modal-body text-center"><span class="fa-stack fa-4x text-warning"><i class="fa fa-circle-o fa-stack-2x"></i><i class="fa fa-exclamation fa-stack-1x"></i></span><p class="lead">' + $('#quick-view-modal').data('error-message') + '</p></div>');
                }
            });
        } else {
            console.log("missing elements to load and placeholder to load into");
        }
    });
}
function shareCopy() {
        
    $(function () {
      $('[data-toggle="tooltip"]').tooltip();
    });
    $('.copy-to-clipboard').tooltip({
        container: '.input-group-btn',
        trigger: 'click'
    }).on('mouseout', function(){
        $(this).tooltip('hide');
    });
    
    new Clipboard('.copy-to-clipboard');
    // new Clipboard('#copy-field');
    
    $('#copy-field').on('click, focus', function() {
        $('#copy-field').select();
    });
}