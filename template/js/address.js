function getAddress(form, type) {
    //Api url
    
    
    var url = $('#' + form + '-form').data('postal-code-url');
    
    //Number
    var numberField     = $('#' + form + '-form #' + type + '_address_house_number');
    var suffixField     = $('#' + form + '-form #' + type + '_address_house_number_suffix');
    var postcodeField   = $('#' + form + '-form #' + type + '_address_postal_code1');
    var streetField     = $('#' + form + '-form #' + type + '_address_street');
    var cityField       = $('#' + form + '-form #' + type + '_address_city');
    
    numberField.on( 'keydown', function(e){
        if((e.keyCode >= 65 && e.keyCode <= 90) || (e.keyCode >= 188 && e.keyCode <= 190) || (e.keycode >= 106 && e.keyCode <= 111) ){
            suffixField.val('').focus();
        } else {
        }
    });
    
    
    $('.address-check-field[data-type=' + type + ']').focusout(function() {
        
        var isNL            = $('#address-shipping-is-nl1').is(':checked');
        var postcode        = postcodeField.val();
        
        var number          = numberField.val() + suffixField.val();

        if(postcode && number && isNL){
            $.getJSON(url, { postcode: postcode, number: number } )
            .done(function( json ) {
                $(streetField).val(json.clean.street);
                $(cityField).val(json.clean.city);
                if( type == 'shipping' && $('#same-billing-address').is(':checked')) {
                    $('#' + form + '-form #billing_address_postal_code1').val(postcode);
                    $('#' + form + '-form #billing_address_house_number').val(numberField.val());
                    $('#' + form + '-form #billing_address_house_number_suffix').val(suffixField.val());
                    $('#' + form + '-form #billing_address_street').val(json.clean.street);
                    $('#' + form + '-form #billing_address_city').val(json.clean.city);
                }
                if(postcode && number) {
                    $('.address-validation-message').html("");
                }
            })
            .fail(function( jqxhr, textStatus, error ) {
                var err = textStatus + ", " + error;
                $(streetField).val("");
                $(cityField).val("");
                if( type == 'shipping' && $('#same-billing-address').is(':checked')) {
                    $('#' + form + '-form #billing_address_postal_code1').val("");
                    $('#' + form + '-form #billing_address_house_number').val("");
                    $('#' + form + '-form #billing_address_house_number_suffix').val("");
                    $('#' + form + '-form #billing_address_street').val("");
                    $('#' + form + '-form #billing_address_city').val("");
                }
                if(postcode && number && isNL) {
                    $('.address-validation-message').html("").append('<i class="fa fa-times-circle text-danger"> </i> Dit adres klopt niet, controleer de velden.');
                }
            });
        }
    });
    
}

