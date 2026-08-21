 
//  /**
//  * Store the account address requests.
//  * 
//  * @property accountRequests
//  * @type {Array}
//  */ 
var accountRequests = [];

// // document ready.
$(function() {
    if ($('#account-form').length > 0) {
        $('#account-form input[name^="shipping"], #account-form select[name^="shipping"], #account-form input[name^="shipping[isNL]"]').on('change focusout', handleAccountShippingInput);
        $('#account-form #same-billing-address').on('change', showAccountBillingContainer);
        $('#account-form .address-country-select').on('change', toggleAddressAccountContainer);
        $('#account-form .address-check-field').on('focusout', retrieveAddressAccount);
    //     $('#customer_birthday .datepicker').on('changeDate', function (ev) {
    //         $(this).focus();
    //     });
    //     $('#customer_birthday input').on('change focusout', toggleValidation);
        
        // initialize functionality / events on ready.
        $('#account-form .address-country-select').change();
        $('#account-form #same-billing-address').change();
        $('#account-form input[name^="shipping"], #account-form select[name^="shipping"], #account-form input[name^="shipping[isNL]"]').change();
    //     $('#customer_birthday input').change();
        $('#account-form input[name*="[house_number]"]').on('keydown', function(e){
            var el = $(this);
            var type = el.data('type');
            console.log(e.keyCode);
            if((e.keyCode >= 65 && e.keyCode <= 90) || (e.keyCode >= 188 && e.keyCode <= 190) || (e.keycode >= 106 && e.keyCode <= 111) ){
                $('#account-form input[name="' + type + '[house_number_suffix]"]').val('').focus();
            } 
        });
    }
    
    if ($('#account-billing-address-form, #account-shipping-address-form, #organisation-billing-address-form, #organisation-shipping-address-form').length > 0) {
        $('body').on('submit', '#account-billing-address-form, #account-shipping-address-form, #organisation-billing-address-form, #organisation-shipping-address-form', saveAccountAddress);
    }
});

/**
 * Handle the input of the shipping address fields.
 * 
 * @method handleAccountShippingInput
 * @param {Object}      e       The event data object.
 */ 
function handleAccountShippingInput(e) {
    var el = $(e.target);
    
    if (el.length > 0) {
        if ($('#account-form #same-billing-address').is(':checked')) {
            if (el.is('select')) {
                $('#account-form select[name="' + el.attr('name').replace('shipping', 'billing') + '"]').val(el.val());
            } else {
                if (el.attr('type') == 'checkbox' || el.attr('type') == 'radio') {
                     $('#account-form input[name="' + el.attr('name').replace('shipping', 'billing') + '"][value="' + el.attr('value') + '"]').prop('checked', el.is(':checked')).change();
                } else {
                    $('#account-form input[name="' + el.attr('name').replace('shipping', 'billing') + '"]').val(el.val());
                }
            }
        }
    }
}

/**
 * Show the full billing address container based on whether the "billing same as shipping" checkbox has been set.
 * 
 * @method showAccountBillingContainer
 * @param {Object}     e       The event data object.
 */ 
function showAccountBillingContainer(e) {
    var el = $(e.target);
    var container = $('#account-form #billing-complete-container');
    
    if (container.length > 0) {
        if (el.is(':checked')) {
            container.collapse('hide');
            $('#account-form input[name^="shipping"], #account-form select[name^="shipping"], #account-form input[name="shipping[isNL]"]').change();
        } else {
            container.collapse('show');
        }
    }
}

/**
 * Retrieve a possible adress from the postcode database.
 * 
 * @method retrieveAddressAccount
 * @param {Object}          e       The event data object.
 */ 
function retrieveAddressAccount(e) {
    var el = $(e.target);
    
    if (el.length > 0) {
        var type = el.data('type');
        
        if (type) {
            var isNL = $('#account-form .address-country-select[data-type="' + type + '"][value="1"]').is(':checked');
            var postcode = $('#account-form .address-check-field[data-type="' + type + '"][name*="postal_code"]').val().replace(/\s/g, '');
            var houseNumber = $('#account-form .address-check-field[data-type="' + type + '"][name*="house_number"]').val().replace(/\s/g, '');
            var houseNumberSuffix = $('#account-form .address-check-field[data-type="' + type + '"][name*="house_number_suffix"]').val().replace(/\s/g, '');
            var validationMessageEl = $('#account-form .address-validation-message[data-type="' + type + '"]');
            
            validationMessageEl.html('');
            
            if (isNL && postcode !== '' && houseNumber !== '') {
                var keys = ['street', 'city'];
                
              accountRequests[type] = $.ajax({
                  url: el.closest('form').data('postal-code-url'),
                  data: {
                     postcode: postcode, 
                     number: houseNumber + '' + houseNumberSuffix
                  },
                  beforeSend: function () {
                      if (accountRequests[type]) {
                          accountRequests[type].abort();
                      }
                  },
                  success: function (data) {
                      if (data && data.clean) {
                          for (var key in keys) {
                              $('#account-form input[name="' + type + '[' + keys[key] + ']"]').val(data.clean[keys[key]]).change();
                          }
                      } else {
                            for (var key2 in keys) {
                              $('#account-form input[name="' + type + '[' + keys[key2] + ']"]').val('').change();
                            }
                            
                            validationMessageEl.html('').append('<i class="fa fa-times-circle text-danger"> </i> Dit adres klopt niet, controleer de velden.');
                      }
                  },
                  error: function () {
                        for (var key in keys) {
                          $('#account-form input[name="' + type + '[' + keys[key] + ']"]').val('').change();
                        }
                        
                        validationMessageEl.html('').append('<i class="fa fa-times-circle text-danger"> </i> Dit adres klopt niet, controleer de velden.');
                  }
                });
            }
        }
    }
}

/**
 * Toggle the full or short address container based on whether the country is "The Netherlands".
 * 
 * @method toggleAddressAccountContainer
 * @param {Object}      e       The event data object.
 */ 
function toggleAddressAccountContainer(e) {
    var el = $(e.target);
    
    if (el.length > 0 && el.is(':checked')) {
        var type            = el.data('type');
        var countryEl       = $("#" + type + "_address_country_id");
        var container       = countryEl.parent().parent(".country-collapsable");
        var streetEl        = $('#account-form #' + type + '_address_street');
        var cityEl          = $('#account-form #' + type + '_address_city');
        var postcodeEl      = $('#account-form #' + type + '_address_postal_code1');
        
        if (parseInt(el.attr('value'), 10) === 1) {
            container.collapse('hide');
            countryEl.val('1');
            postcodeEl.mask('0000SS', {reverse: false, selectOnFocus: true, onKeyPress: function(value, event){event.currentTarget.value = value.toUpperCase();}}).attr('data-parsley-pattern', /^[0-9]{4}[A-z]{2}$/);
        } else {
            container.collapse('show');
            postcodeEl.unmask().removeAttr('data-parsley-pattern');
        }
    }
}

/**
 * Handle the input of the shipping address fields.
 * 
 * @method handleAccountShippingInput
 * @param {Object}      e       The event data object.
 */ 
function handleAccountShippingInput(e) {
    var el = $(e.target);
    
    if (el.length > 0) {
        if ($('#account-form #same-billing-address').is(':checked')) {
            if (el.is('select')) {
                $('#account-form select[name="' + el.attr('name').replace('shipping', 'billing') + '"]').val(el.val());
            } else {
                if (el.attr('type') == 'checkbox' || el.attr('type') == 'radio') {
                     $('#account-form input[name="' + el.attr('name').replace('shipping', 'billing') + '"][value="' + el.attr('value') + '"]').prop('checked', el.is(':checked')).change();
                } else {
                    $('#account-form input[name="' + el.attr('name').replace('shipping', 'billing') + '"]').val(el.val());
                }
            }
        }
    }
}

/**
 * Toggle the full or short address container based on whether the country is "The Netherlands".
 * 
 * @method toggleAddressContainer
 * @param {Object}      e       The event data object.
 */ 

function toggleValidation() {
    var el = $(this);
    var field = $('input[data-parsley-group="' + el.attr('data-parsley-group') + '"]');
    var allEmpty = true;
    var values = field.map(function () {
        return $(this).val();
    });
    
    $.each(values, function(i, value) {
        if ($.trim(value) !== '') {
            allEmpty = false;
        }
    });

    if (!allEmpty) {
        field.attr('data-parsley-required', true);
    } else {
        field.attr('data-parsley-required', false);
    }
}


function saveAccountAddress(e) {
	e.preventDefault();
    var form = $(this);
	var address_type = form.data('address-type');
	var formData = serializeObject(form);
	var options = {};
	var action = form.attr('action');
	var element = '.account-addresses-container';
    var input = '.account-addresses-container > *';
    form.addClass('loading-ajax');
	
	formData.premise_number = Number(formData.premise_number);
	formData.address_line_1 = formData.thoroughfare + ' ' + formData.premise_number + (formData.premiseNumber !== '' ? ' ' + formData.premise_number_suffix : '');
	
    if (formData.save_address_as === 'contact') {
        options = { contact: {} };
        options.contact[address_type] = {};
        
        if (formData.save_address_as_primary === "on") {
            options.contact[address_type] = { primary: 1};
        } else {
            options.contact[address_type] = { secondary: 1};
        }
    } else if (formData.save_address_as === 'organisation') {
        options = { organisation: {}};
        
        if (formData.save_address_as_primary === "on") {
            options.organisation[address_type] = { primary: 1};
        } else {
            options.organisation[address_type] = { secondary: 1};
        }
    }
	
	var postData = Object.assign({ address: formData }, options);
	
	$.ajax({
        method: "post",
        url: action,
        data: postData,
        success: function(data) {
            $.get(window.location.origin + window.location.pathname, function (html) {
                var content = $('<div>' + html.replace(/>[\n\t ]+</g, "><") + '</div>');
                $(element).html(content.find(input));
                form.closest('.modal').modal('hide');
                form.removeClass('loading-ajax');
                form.trigger('reset');
            });
        },
        error: function(error, status, string) {
			console.log(error, status, string);
        },
    });
}
