// /* type: js */

/**
 * Store the coupon request.
 * 
 * @property couponRequest
 * @type {Object}
 */ 
var couponRequest, stateTimeout, stateRequest;

/**
 * Store the address requests.
 * 
 * @property addressRequests
 * @type {Array}
 */ 
var addressRequests = [];

// document ready
$(function () {
    moment.locale($('html').attr('lang'));
    $('#checkout-form').checkout({
        stepped: true
    });
    
    
    
    checkRegistration();
    finishCheckout();
    $('.issuer-list').collapse();
    // field listeners.
    // $('#checkout-form #customer_email').on('keyup', checkCoupon); 
    $('#checkout-modal #coupon-submit-btn').on('click', setRepost);
    $('#checkout-form input[name^="shipping"], #checkout-form select[name^="shipping"], #checkout-form input[name^="shipping[isNL]"]').on('change focusout', handleShippingInput);
    $('#checkout-form #shipping_address_country_id').on('change', showShippingMethodsForCountry);
    $('#checkout-form .payment-method-row .radio label input[name*="sale[payment][method][id]"]').on('change', activatePaymentMethod);
    $('#checkout-form .payment-method-row .radio label input[name*="sale[payment][method][id]"]').on('change', setPaymentMethodSummary);
    $('#checkout-form .issuer-list .radio label input[name*="sale[payment][issuer][id]"]').on('change', setPaymentMethodSummary);
    $('#checkout-form .shipping-method').on('change', setShippingAddressSummary);
    $('#checkout-form #same-billing-address').on('change', showBillingContainer);
    $('#checkout-form button[data-next-step]').on('click.af', handleNextStep);
    $('#checkout-form button.btn-prev-step').on('click.af', handlePreviousStep);
    $('#checkout-form .address-country-select').on('change', toggleAddressContainer);
    $('#checkout-form .address-check-field').on('keyup', retrieveAddress);
    $('#checkout-form .redeem-credits-box label input').on('change', toggleRedeemCredits);
    $('#checkout-form input[name*="[address][house_number]"]').on('keydown', function(e){
        var el = $(this);
        var type = el.data('type');
        
        if((e.keyCode >= 65 && e.keyCode <= 90) || (e.keyCode >= 188 && e.keyCode <= 190) || (e.keycode >= 106 && e.keyCode <= 111) ){
            $('#checkout-form input[name="' + type + '[address][house_number_suffix]"]').val('').focus();
        } 
    });
    $('.datepicker').on('changeDate', function (ev) {
        $(this).focus();
    });
    
    
    
    // window listeners.
    window.addEventListener('popstate', function(event) {
        if($('#checkout-form.stepped').length > 0 && ga){
            if (event.state && event.state.step) {
                openStep(event.state.step);
                if (typeof ga !== 'undefined') {
                    if (typeof gaceCheckout !== 'undefined') {
                        $('#checkout-form.stepped').trigger('prev.Checkout', event.state.step, event);
                    } else {
                        ga('send', 'pageview', getSendData(event.state.step));
                    }
                }
            } else {
                openStep('step-1');
                if (typeof ga !== 'undefined') {
                    if (typeof gaceCheckout !== 'undefined') {
                        $('#checkout-form.stepped').trigger('prev.Checkout', 'step-1', event);
                    } else {
                        ga('send', 'pageview', getSendData('step-1'));
                    }
                }
            }
        }
    });
   
    // initialize functionality / events on ready.
    initializeLoginCheck();
    initializeLoginButtonListener ();
    initializeEmailListener();
    initializeForgotLinkListener();
    enablePhoenix();
    checkRepost();
    $('#checkout-form #shipping_address_country_id').change();
    $('#checkout-form #same-billing-address').change();
    $('#checkout-form .address-country-select').change();
    $('#checkout-form input[name^="shipping[address]"], #checkout-form select[name^="shipping[address]"], #checkout-form input[name^="shipping[isNL]"]').change();
    $('#checkout-form #customer_email').trigger('keyup');
    $('#checkout-form .shipping-method').change();
    $('#checkout-form .payment-method-row .radio label input[name*="sale[payment][method][id]"]').change();
    $('#checkout-form .redeem-credits-box label input').change();
    switchDateField();
    if($('#checkout-form').length > 0){
        catchEnter();
    }
});

/**
 * Enable JQuery phoenix for saving form states.
 * 
 * @method enablePhoenix
 */ 
function enablePhoenix() {
    var is_logged_in = $('#checkout-form').data('account');
    
    if (!is_logged_in) {
        try {
            $('#checkout-form .phoenix-input').phoenix({
                keyAttributes: ['tagName', 'id', 'name'],
                webStorage: 'sessionStorage',
            });
        } catch (e) {}
    }
}

/**
 * Prevent the checkout form from submitting when enter has been pressed.
 * 
 * @method preventEnter
 */ 
function catchEnter() {
    $(document).ready(function() {
        $(window).keydown(function(event){
            if(event.keyCode == 13) {
                event.preventDefault();
                return false;
            }
        });
    });
}
 

/**
 * Retrieve a possible adress from the postcode database.
 * 
 * @method retrieveAddress
 * @param {Object}          e       The event data object.
 */ 
function retrieveAddress(e) {
    var el = $(e.target);
    
    if (el.length > 0) {
        var type = el.data('type');
        
        if (type) {
            var isNL                = $('#checkout-form .address-country-select[data-type="' + type + '"][value="1"]').is(':checked');
            var postcode            = $('#checkout-form .address-check-field[data-type="' + type + '"][name*="postal_code"]').val().replace(/\s/g, '');
            var houseNumber         = $('#checkout-form .address-check-field[data-type="' + type + '"][name*="house_number"]').val().replace(/\s/g, '');
            var validationMessageEl = $('#checkout-form .address-validation-message[data-type="' + type + '"]');
            var successMessage      = validationMessageEl.data('success-message');
            var errorMessage        = validationMessageEl.data('error-message');
            var loadingMessage      = validationMessageEl.data('loading-message');
            
            validationMessageEl.html('');
            
            if (isNL && postcode !== '' && houseNumber !== '') {
                var keys = ['street', 'city'];
                
                addressRequests[type] = $.ajax({
                   url: el.closest('form').data('postal-code-url'),
                   data: {
                     postcode: postcode, 
                     number: houseNumber
                   },
                   beforeSend: function () {
                       if (addressRequests[type]) {
                           addressRequests[type].abort();
                       }
                       validationMessageEl.html('<i class="fa fa-refresh fa-spin text-info"> </i> ' + loadingMessage);
                   },
                   success: function (data) {
                       addressTimeout = setTimeout(function() {
                           if (data && data.clean) {
                               for (var key in keys) {
                                   $('#checkout-form input[name="' + type + '[address][' + keys[key] + ']"]').val(data.clean[keys[key]]).change();
                               }
                               validationMessageEl.html('<i class="fa fa-check-circle text-success"> </i> ' + successMessage);
                           } else {
                                for (var key2 in keys) {
                                   $('#checkout-form input[name="' + type + '[address][' + keys[key2] + ']"]').val('').change();
                                }
                                
                           }
                       }, 300);
                   },
                   error: function () {
                        for (var key in keys) {
                          $('#checkout-form input[name="' + type + '[address][' + keys[key] + ']"]').val('').change();
                        }
                        
                        validationMessageEl.html('').append('<i class="fa fa-times-circle text-danger"> </i> ' + errorMessage);
                   }
                });
            }
        }
    }
} 



/**
 * Handle the input of the shipping address fields.
 * 
 * @method handleShippingInput
 * @param {Object}      e       The event data object.
 */ 
function handleShippingInput(e) {
    var el = $(e.target);
    
    if (el.length > 0) {
        if ($('#same-billing-address').is(':checked')) {
            if (el.is('select')) {
                $('select[name="' + el.attr('name').replace('shipping', 'billing') + '"]').val(el.val());
            } else {
                if (el.attr('type') == 'checkbox' || el.attr('type') == 'radio') {
                     $('input[name="' + el.attr('name').replace('shipping', 'billing') + '"][value="' + el.attr('value') + '"]').prop('checked', el.is(':checked')).change();
                } else {
                    $('input[name="' + el.attr('name').replace('shipping', 'billing') + '"]').val(el.val());
                }
            }
        }
    }
}

/**
 * Show the available shipping methods based on the selected shipping country.
 * 
 * @method showShippingMethodsForCountry
 * @param {Object}      e       The event data object.
 */
function showShippingMethodsForCountry(e) {
    var el = $(e.target);
    var selectedOption = el.find('option:selected');
    var iso = selectedOption.data('country-iso');
    var methods = $('.shipping-method[data-country!="ALL"]');
    
    // $('.iso-available').removeClass('hidden');
    methods.parents('.shipping-method-row').addClass('hidden');
    methods.find('input').prop('checked', false).data('parsley-excluded', true);
    
    if (iso) {
        $('.shipping-method[data-country="' + iso + '"]').parents('.shipping-method-row').removeClass('hidden').find('input').data('parsley-excluded', false);
        if(iso !== "NL") {
            $('.iso-available').parents('.shipping-method-row').addClass('hidden');
        }
    }
    setMethodCost('shipping');
}



/**
 * Toggle the full or short address container based on whether the country is "The Netherlands".
 * 
 * @method toggleAddressContainer
 * @param {Object}      e       The event data object.
 */ 
function toggleAddressContainer(e) {
    var el = $(e.target);
    
    if (el.length > 0 && el.is(':checked')) {
        
        var type        = el.data('type');
        
        var container   = $("#checkout-form #" + type + "_address_country_id").parent().parent(".country-collapsable");
        var countryEl   = $("#checkout-form #" + type + "_address_country_id");
        var streetEl    = $('#checkout-form #' + type + '_address_street');
        var cityEl      = $('#checkout-form #' + type + '_address_city');
        var postcodeEl  = $('#checkout-form #' + type + '_address_postal_code1');
        
        if (parseInt(el.attr('value'), 10) === 1) {
            container.collapse('hide');
            countryEl.val('1').change();
            postcodeEl.mask('0000SS', {reverse: false, selectOnFocus: true, onKeyPress: function(value, event){event.currentTarget.value = value.toUpperCase();}}).attr('data-parsley-pattern', /^[0-9]{4}[A-z]{2}$/);
        } else {
            container.collapse('show');
            postcodeEl.unmask().removeAttr('data-parsley-pattern');
        }
    }
}

/**
 * Send Google Analytics data.
 * 
 * @method getSendData
 * @param {string}      step       The current step.
 */ 
function getSendData(step){
    var stages = {
        'step-1' : 'info',
        'step-2' : 'shipping',
        'step-3' : 'payment',
        'step-4' : 'overview'
    };
    var data =  { 
            'page': (step == 'step-1' ? '/checkout' : '/checkout/' +    stages[step]), 
            'title': 'Checkout Stap ' +  stages[step].charAt(0).toUpperCase() + stages[step].substr(1),
            'location' : step == 'step-1' ?  [location.protocol, '//', location.host, location.pathname].join('')  : [location.protocol, '//', location.host, location.pathname,'/',stages[step]].join('') 
            };
            return data;
}



/**
 * Go to the next step of the checkout.
 * 
 * @method handleNextStep
 * @param {Object}      e       The event data object.
 */ 
function handleNextStep(e) {
    var el = $(e.target);
    var nextStep = el.data('next-step');
    var currentStep = el.closest('fieldset').attr('id');
    
    if ($('#checkout-form.stepped').parsley().validate({ group: 'group-' + currentStep })) {
        history.pushState({ step: nextStep }, 'Checkout Stap ' + nextStep, '/checkout?step=' + nextStep);
        if (typeof ga !== 'undefined') {
            if (typeof gaceCheckout !== 'undefined') {
                $('#checkout-form.stepped').trigger('next.Checkout', nextStep, e);
            } else {
                ga('send', 'pageview', getSendData(nextStep));
            }
        }
        openStep(nextStep);
    }
}


/**
 * Go back to the previous step.
 * 
 * @method handlePreviousStep
 * @param {Object}      e       The event data object.
 */ 
function handlePreviousStep(e) {
    var el = $(e.target);
    var previousStep = el.data('previous-step');
    var cartUrl = $('#checkout-form.stepped').data('cart-url');
    if (previousStep) {
        history.pushState({ step: previousStep }, 'Checkout Stap ' + previousStep, '/checkout?step=' + previousStep);
        if (typeof ga !== 'undefined') {
            if (typeof gaceCheckout !== 'undefined') {
                $('#checkout-form.stepped').trigger('prev.Checkout', previousStep, e);
            } else {
                ga('send', 'pageview', getSendData(previousStep));
            }
        }
        openStep(previousStep);
    } else {
        window.location.href = cartUrl; 
    }
}

/**
 * Set the shipping and billing address summary on step 4 of the checkout page.
 * 
 * @method setAddressSummary
 */
/**
 * Set the shipping and billing address summary on step 4 of the checkout page.
 * 
 * @method setAddressSummary
 */
function setAddressSummary() {
    var types = ['shipping', 'billing'];
    
    $.each(types, function (i, type) {
        var list                = '.' + type + '-info-sum';
        var summaryField        = $(list + ' .address-summary-label');
        var numberField         = $(list + ' .address-house-number');
        var suffixField         = $(list + ' .address-house-number-suffix');
        var postcodeField       = $(list + ' .address-postal-code');
        var streetField         = $(list + ' .address-street');
        var cityField           = $(list + ' .address-city');
        var countryField        = $(list + ' .address-country');
        
        var summaryFieldVal     = summaryField.html();
        var postalCodeVal       = $('#' + type + '_address_postal_code1').val();
        var houseNumberVal      = $('#' + type + '_address_house_number').val();
        var houseNumberSuffixVal= $('#' + type + '_address_house_number_suffix').val();
        var streetVal           = $('#' + type + '_address_street').val();
        var cityVal             = $('#' + type + '_address_city').val();
        var countrySelect       = $('#' + type + '_address_country_id');
        var countryVal          = $(countrySelect).find('option[value="' + countrySelect.val() + '"]').html();
        
        if (type === 'shipping') {
            var data = {};
            
            $('#shipping-provider-fields input[name*="pickup"]').each(function() {
                var el = $(this);
                data[el.attr('name')] = el.val(); 
            });
            
            if (Object.keys(data).length > 0) {
                var hasValue = false;
                houseNumberVal = '';
                houseNumberSuffixVal = '';
                
                Object.keys(data).forEach(function(name) {
                  if (name.indexOf('address') > -1 && data[name]) {
                      streetVal = data[name];
                      hasValue = true;
                  } else if (name.indexOf('street') > -1 && data[name]) {
                      streetVal = data[name];
                       hasValue = true;
                  } else if (name.indexOf('housenumber_suffix') > -1 && data[name]) {
                      houseNumberSuffixVal = data[name];
                       hasValue = true;
                  } else if (name.indexOf('housenumber') > -1 && data[name]) {
                      houseNumberVal = data[name];
                       hasValue = true;
                  } else if (name.indexOf('city') > -1 && data[name]) {
                      cityVal = data[name];
                       hasValue = true;
                  } else if (name.indexOf('postal_code') > -1 && data[name]) {
                      postalCodeVal = data[name];
                       hasValue = true;
                  }
                });
                
                if (hasValue) {
                    summaryFieldVal = 'Afhaalpunt';
                } else {
                    summaryFieldVal = 'Bezorgadres';
                }
            } else {
                summaryFieldVal = 'Bezorgadres';
            }
        }

        summaryField.html(summaryFieldVal);
        numberField.html(houseNumberVal);
        suffixField.html(houseNumberSuffixVal);
        postcodeField.html(postalCodeVal);
        streetField.html(streetVal);
        cityField.html(cityVal);
        countryField.html(countryVal);
    });
}


/**
 * Switch the date field on mobile devices.
 * 
 * @method switchDateField
 */ 
function switchDateField() {
    var isMobile = false; //initiate as false
    var el = $('.datepicker');
    var mobEl = $('.datefield');
    // device detection
    if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) 
        || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) isMobile = true;
        
        
    if(isMobile === true) {
        mobEl.removeClass('hidden');
    } else {
        el.removeClass('hidden').datepicker({language: "nl", orientation: 'bottom', immediateUpdates: true, startView: 'decade', autoclose: true});
        mobEl.removeAttr('data-parsley-nofuturedates').removeAttr('data-parsley-group');
    }
}


/**
 * Open the step for the provided step.
 * 
 * @method openStep
 * @param {String}     step       The step.
 */ 
function openStep(step) {
    var stepnum = parseInt(step.replace('step-',''));
    if ($(window).scrollTop() > 100) {
        $('body,html').animate({
            scrollTop: 0
        }, 500, stepper(stepnum));
    } else {
        stepper(stepnum);
    }
    
    function stepper(stepnum) { 
        $('.checkout-progress-bar .step.step-' + (stepnum - 1)).removeClass('active').addClass('valid');
        $('.checkout-progress-bar .step.step-' + (stepnum + 1)).removeClass('active');
        $('.checkout-progress-bar .step.step-' + (stepnum)).addClass('active').removeClass('valid');
    }
    $('#checkout-progress').removeAttr('class').addClass(step);
    $('.progress-' + step).addClass('active');
    $('fieldset').css('display', 'none').removeClass('active');
    $('#' + step).css('display', 'block').addClass('active');
    // if (step == 'step-2') {
    //     loadShippingOptions();
    // }
    
    if (step == 'step-3') {
        checkKlarnaAvailability();
    }
    if (step == 'step-4') {
        setAddressSummary();
        setShippingAddressSummary();
        setMethodCost('shipping');
        setPaymentMethodSummary();
        setMethodCost('payment');
        setCredits();
        setTax();
        setTotal();
    }
}

/**
 * Show the full billing address container based on whether the "billing same as shipping" checkbox has been set.
 * 
 * @method showBillingContainer
 * @param {Object}     e       The event data object.
 */ 
function showBillingContainer(e) {
    var el = $(e.target);
    var container = $('#billing-complete-container');
    if (container.length > 0) {
        if (el.is(':checked')) {
            container.collapse('hide');
            $('input[name^="shipping"], select[name^="shipping"], input[name*="shipping[isNL]"]').change();
        } else {
            container.collapse('show');
            $('input[name^="shipping"], select[name^="shipping"], input[name*="shipping[isNL]"]').change();
        }
    }
}

/**
 * Check the repost field whether the form has been posted before validation. If posted, show no errors.
 * 
 * @method checkRepost
 */ 
function checkRepost () {
    var value = $('#repost-field').val();
    
    if (typeof value === 'string' && value === "1") {
        $('.alert-danger').css('display', 'none');
        $('#repost-field').val(0);
    }
}

/**
 * Set the field that indicates that the form will be re-posted, and reloads the page.
 * 
 * @method setRepost
 */ 
function setRepost () {
    $('#repost-field').val(1);
    location.reload();
}

/**
 * Check if the value of the email field counts as a valid coupon code, if valid show modal with discount activation button.
 * 
 * @method checkCoupon
 * @param {Object}         e           The event data object.
 */ 
// function checkCoupon (e) {
//     var el = $(e.target);
    
//     couponRequest = $.ajax({
//         beforeSend: function () {
//           if (couponRequest) {
//               couponRequest.abort();
//           }
//         },
//         method: "POST",
//         url: el.data('url'),
//         data: { coupon: el.val() },
//         success: function(data, textStatus, xhr) {
//             if (xhr.status == 200) {
//                 $('#checkout-modal').modal().on('show.bs.modal', function (e) {
//                     $('#coupon-submit-btn').focus();
//                 });       
//             }
//         }
//     });
// }

/**
 * Set the address and time summary of the selected shipping option, on step 4 of the checkout page.
 * 
 * @method setShippingAddressSummary
 */
function setShippingAddressSummary() {
    var shippingAddressSummary = $('.shipping-method-sum');
    var expectedShippingSummaryHtml = '-';
    
    if (shippingAddressSummary.length > 0) {
        var method = $('.shipping-method-option:checked');
        var timeOption = method.closest('label').parent().find('.shipping-method-time option:selected');
        var pointOption = method.closest('label').parent().find('.shipping-method-point:checked');
        
        shippingAddressSummary.find('.shipping-method-name').html(method.data('name'));
        
        if (timeOption && timeOption.length > 0) {
            var day = timeOption.data('day');
            var time = timeOption.data('time');
            var timeString = '';
            
            if (time) {
                timeString += day + ' ' + time.from_readable + ' - ' + time.to_readable;
            }
            
            shippingAddressSummary.find('.shipping-method-details').html(timeString);
            expectedShippingSummaryHtml = timeString;
        }
        
        if (pointOption && pointOption.length > 0) {
            var point = pointOption.data('point');
            var pointString = '';
            
            if (point) {
                pointString += point.name + '<br />' + point.address + "<br />" + point.postal_code + " " + point.city;
            }
            
            shippingAddressSummary.find('.shipping-method-details').html(pointString);
        }
        
        if (method.attr('value') == 2075) {
            expectedShippingSummaryHtml = moment().add(1, 'days').format('dddd DD MMMM');
        }
        
    }
    
    $('.checkout-expected-shipping-date .expected-shipping-date').html(expectedShippingSummaryHtml);
    setMethodCost('shipping');
    // setTax();
    // setTotal();
}

/**
 * Set the costs for the method (with the provided type), on step 4 of the checkout page.
 * 
 * @method setMethodCost
 * @param {String}      type        The type of method (shipping/payment).
 */ 
function setMethodCost(type) {
    var method = $('.' + type + '-method-option:checked');
    var currencySymbol = $('body').data('af-currency');
    
    if (method && method.length > 0) {
        var cost = method.data('cost');
        if (!cost) {
            cost = 0;
        }
        
        $('#checkout-table-' + type + '-cost .' + type + '-method-name').html('' + method.data('name') + '');
        $('#checkout-table-' + type + '-cost .' + type + '-cost-total').html(currencySymbol + ' ' + parseFloat(cost).toFixed(2).replace('.',','))
    }
}

/**
 * Reset the total tax amount on step 4 of the checkout page to the original amount (without payment and shipping cost calculations).
 * 
 * @method resetTax
 */ 
function resetTax() {
    $('.checkout-table .checkout-tax-row:not(.original-tax-row)').remove();
    var currencySymbol = $('body').data('af-currency');
    
    $.each($('.checkout-table .original-tax-row'), function () {
        var row = $(this);
        var currentAmount = row.data('tax-amount') || 0;
        
        row.find('.vat-amount').html(currencySymbol + ' ' + parseFloat(currentAmount).toFixed(2).replace('.', ','));
    });
}

/**
 * Toggle and set the total amount of credit balance used on step 4 of the checkout page.
 * 
 * @method setCredits
 */ 
function setCredits() {
    var useCredits = $('input[name="use_loyalty"]:checked').val();
    var redeemType = $('input[name="loyalty[charge_type]"]:checked').val();
    var redeemAmount = $('input[name="loyalty[charge_points]"]').val();
    var redeemRate = $('input[name="loyalty[charge_type]"]:checked').data('rate');
    var credits = parseFloat($('input[name="loyalty[charge_type]"]:checked').data('balance')) || 0;
    var currentTotal = $('.checkout-table-total').data('total-amount') || 0;
    var currencySymbol = $('body').data('af-currency');
    
    if (credits > currentTotal) {
        credits = currentTotal;
    }
    
    if(useCredits == 1) {
        $('#checkout-table-credits').removeClass('hidden');
        
        if(redeemType == 2) {
            $('#checkout-table-credits').find('.credit-total-amount').html(currencySymbol + ' ' + parseFloat(credits).toFixed(2).replace('.', ',')).data('credits-discount', credits);
        } else if(redeemType == 1) {
            $('#checkout-table-credits').find('.credit-total-amount').html(currencySymbol + ' ' + parseFloat((redeemAmount * redeemRate)).toFixed(2).replace('.', ',')).data('credits-discount', (redeemAmount * redeemRate));
        }
    } else {
        $('#checkout-table-credits').addClass('hidden');
        $('#checkout-table-credits').find('.credit-total-amount').html('').data('credits-discount', '0');
    }
    
    // if (useCredits && credits > 0) {
    //     $('#checkout-table-credits').removeClass('hidden');
    //     $('#checkout-table-credits').find('.credit-total-amount').html(currencySymbol + ' ' + parseFloat(credits).toFixed(2).replace('.', ','));
    // } else {
    //     $('#checkout-table-credits').addClass('hidden');
    //     $('#checkout-table-credits').find('.credit-total-amount').html('');
    // }
}

/**
 * Correct the total tax amount on step 4 of the checkout page, based on the taxrates and costs of the selected shipping and payment method.
 * 
 * @method setTax
 */ 
function setTax() {
    var methods = $('.shipping-method-option:checked, .payment-method-option:checked');
    var taxes = {};
    var discountRates = getDiscountRate(true);
    var discountRate = discountRates.creditDiscountPercentage || 0;
    var currencySymbol = $('body').data('af-currency');
    
    resetTax();
    
    $.each($('.checkout-table .original-tax-row'), function () {
        var row = $(this);
        var currentAmount = row.data('tax-amount') || 0;
        var rate = row.data('tax-rate') || 21;
        
        if (!taxes[rate]) {
            taxes[rate] = 0;
        }
        
        taxes[rate] += parseFloat(currentAmount);
    });
    
    $.each(methods, function(i, method) {
        var el = $(method);
        var cost = el.data('cost') || 0;
        var tax_rate = el.data('tax-rate');
        
        if (!taxes[tax_rate]) {
            taxes[tax_rate] = 0;
        }
        
        cost = parseFloat(cost);
        
        if (cost && tax_rate && parseInt(tax_rate, 10) > 0) {
            taxes[tax_rate] += cost - (cost / ((parseInt(tax_rate, 10) + 100) / 100));
        }
    });
    
    for (var rate in taxes) {
        var amount = taxes[rate];
        var row = $('.checkout-table .checkout-tax-row-' + rate);
        
        if (row && row.length > 0) {
            var newAmount = parseFloat(amount); 
            
            if (discountRate > 0) {
                newAmount = (newAmount * ((100 - discountRate) / 100));
            }
            
            newAmount = newAmount.toFixed(2);
            
            row.find('.vat-amount').html(currencySymbol + ' ' + newAmount.replace('.', ','));
        } else {
            if (discountRate > 0) {
                amount = (amount * ((100 - discountRate) / 100));
            }
            
            amount = amount.toFixed(2);
            
            var rowElement = $('<div class="row rowcheckout-tax-row checkout-tax-row-' + rate + '"></div>');
            
            var rowHtml = '<div class="col-sm-6"><span class="tax-name">BTW (' + rate + '%)</span></div>';
            rowHtml += '<div class="col-sm-6 text-right"><span class="vat-amount">' + parseFloat(amount).toFixed(2) + '</span></div>';
            
            rowElement.html(rowHtml);
            
            if ($('#checkout-table-coupon').length > 0) {
                rowElement.insertBefore($('#checkout-table-coupon'));
            } else {
                var lastTaxRow = $('.rowcheckout-tax-row:last');
                
                if (lastTaxRow.length > 0) {
                    rowElement.insertAfter(lastTaxRow);
                } else {
                    rowElement.insertBefore($('.checkout-table-total'));
                }
            }
        }
    }
}

/**
 * Correct the total amount on step 4 of the checkout page, based on the total payment and shipping costs of the selected methods.
 * 
 * @method setTotal
 */ 
function setTotal() {
    var methods = $('.shipping-method-option:checked, .payment-method-option:checked');
    var currentTotal = $('.checkout-table-total').data('total-amount') || 0;
    var discount = $('.cart-summary-order-info').data('discount') || 0;
    var totalCost = 0;
    var discountRate = getDiscountRate();
    var currencySymbol = $('body').data('af-currency');
    
    if (discount !== 0) {
        discount = parseFloat(discount) * -1;
    }
    
    currentTotal = currentTotal + discount;
    
    $.each(methods, function(i, method) {
        var el = $(method);
        var cost = el.data('cost');
        
        if (cost) {
            totalCost += parseFloat(cost);
        }
    });
    
    if (discountRate > 0) {
        currentTotal = (currentTotal * ((100 - discountRate) / 100));
    }
    
    var newTotal = parseFloat(currentTotal) + totalCost;
    
    $('.checkout-table-total').find('.total-amount').html(currencySymbol + ' ' + parseFloat(newTotal).toFixed(2).replace('.', ','));
}

/**
 * Retreive the discount rate based on whether credits are used.
 * 
 * @method getDiscountRate
 * @param {boolean} asObject    Whether to return the discounts seperately.
 * @return {float}
 */ 
function getDiscountRate(asObject) {
    var splitReturnValue = !!asObject;
    var redeemCredits = $('input[name="loyalty[charge_type]"]:checked');
    var total = $('.checkout-table-total').data('total-amount') || 0;
    var creditDiscount = 0;
    var creditDiscountPercentage = 0;
    var discountPercentage = 0;
    var couponDiscount = $('.cart-summary-order-info').data('discount') || 0;
    
    if (couponDiscount !== 0) {
        couponDiscount = parseFloat(couponDiscount) * -1;
    }
    
    var loyaltyDiscount = 0;
    var totalDiscount = couponDiscount;
    
    total = total + couponDiscount;
    
    var totalDiscountPercentage = (totalDiscount / total) * 100;
    var couponDiscountPercentage = totalDiscountPercentage;
    
    if (redeemCredits.length && totalDiscountPercentage < 100) {
        creditDiscount = parseFloat($('#checkout-table-credits').find('.credit-total-amount').data('credits-discount')) || 0;
        totalDiscount = (totalDiscount + creditDiscount);
        totalDiscountPercentage = (totalDiscount / total) * 100;
        
        if (totalDiscountPercentage < 100) {
            creditDiscountPercentage = 100 - ((100 - totalDiscountPercentage) / (100 - couponDiscountPercentage) * 100);
            couponDiscountPercentage = 100 - ((100 - totalDiscountPercentage) / (100 - creditDiscountPercentage) * 100);
        }
    }

    if (totalDiscountPercentage < 100) {
        discountPercentage = 100 - (((100 - creditDiscountPercentage) * (100 - couponDiscountPercentage))) / 100;
    } else {
        discountPercentage = 100;
    }
    
    if (discountPercentage > 100) {
        discountPercentage = 100;
    }
    
    if (splitReturnValue) {
        return {
            'creditDiscountPercentage': creditDiscountPercentage,
            'couponDiscountPercentage': couponDiscountPercentage,
            'totalDiscountPercentage': totalDiscountPercentage,
            'discountPercentage': discountPercentage,
        };
    }
        
    return discountPercentage;
}

/**
 * Set the summary for the selected payment method on step 4 of the checkout page.
 * 
 * @method setPaymentMethodSummary
 */ 
function setPaymentMethodSummary() {
    var paymentMethodSummary = $('.payment-method-sum');
    
    if (paymentMethodSummary.length > 0) {
        var method = $('.payment-method-option:checked');
        if (method) {
            var issuer = $('.' + method.data('code') + '-list input:checked');
            
            paymentMethodSummary.find('.payment-method-name').html(method.data('name'));
            if (issuer.length > 0) {
                paymentMethodSummary.find('.payment-method-issuer').html(" (" + issuer.data('name') + ")");
            } else {
                paymentMethodSummary.find('.payment-method-issuer').html('');
            }
        }
    }
    setMethodCost('payment');
    // setTax();
    // setTotal();
}

/**
 * Activate the payment method when clicking on the label of the payment method.
 * 
 * @method activatePaymentMethod
 * @param {Object}      e       The event object.
 */ 
function activatePaymentMethod(e) {
    var el = $(e.target);
    
    if (el && el.length > 0) {
        var name = el.data('code');
        
        $('.issuer-list').collapse('hide');
        $('.issuer-list').find('input').prop('checked', false);
        
        el.find('input[type="radio"]').prop('checked', true);
        
        
        var issuerList = $('.' + name + '-list.issuer-list');
        if (issuerList.length > 0) {
            issuerList.collapse('show');
            issuerList.find('input:first').prop('checked', true);
        } 
    }
    
}

/**
 * Toggle the text for the redeem credits based on whether the checkbox is checked.
 * 
 * @method toggleRedeemCredits
 * @param {Object}      e       The event data object.
 */ 
function toggleRedeemCredits(e) {
    var el = $(e.target);
    var redeem = $('.redeem-credits .credits-tag .redeem');
    var noRedeem = $('.redeem-credits .credits-tag .no-redeem');
    if(el.is(':checked')) {
        $(redeem).removeClass('hidden');
        $(noRedeem).addClass('hidden');
    } else {
        $(redeem).addClass('hidden');
        $(noRedeem).removeClass('hidden');
    }
    setCredits();
}

/**
 * check if the user is logged in.
 * 
 * @method initializeLoginCheck
 */ 
function initializeLoginCheck() {
   $('.login-check').on('change', function() {
      var value = $(this).val();
      
      if (parseInt(value) === 0) {
          $('#checkout-form .password-group').css('display', 'none');
          $('#checkout-form input[name="account_password"]').removeAttr('data-parsley-required').removeAttr('data-parsley-group');
      } else {
          $('#checkout-form .password-group').css('display', 'block');
          $('#checkout-form input[name="account_password"]').attr('data-parsley-required', 'true').attr('data-parsley-group', 'info');
      }
   });
}


/**
 * On keyup make an ajax call to check if the emailaddress is registered in Afosto.
 * 
 * @method initializeEmailListener
 */ 
function initializeEmailListener () {
   $('#checkout-form.stepped #customer_email').on('keyup', function () {
        var el            = $(this),
            email         = el.val(),
            url           = el.data('path'),
            passwordGroup = $('.password-group'),
            passwordCheckGroup = $('.password-check-group'),
            stateGroup    = $('#checkout-form .state'),
            emailButton   = $('#checkout-form .btn-email'),
            logged_in = $('#checkout-form').data('log');
            
        if(!logged_in) {
            passwordGroup.fadeOut('fast');
            passwordCheckGroup.fadeOut('fast');
            stateGroup.fadeOut('fast');
            emailButton.fadeOut('fast');
            $('.login-check[value="0"]').prop('checked', true).change();
            
            if (email.length > 0) {
                                
                stateRequest = $.ajax({
                    url: url,
                    type: 'POST',
                    data: {
                        'account[email]' : email
                    },
                    beforeSend : function () { 
                        if (stateRequest) {
                            stateRequest.abort();
                        }
                        
                        if (stateTimeout) {
                            clearTimeout(stateTimeout);
                        }
                    },
                    success: function (data) {
                        stateTimeout = setTimeout(function () {
                            $('#checkout-form .email-' + data.status).fadeIn();
                            $(el).parsley().validate();
                            if (data && data.status === 'validated') {
                                $('#checkout-form .password-group .form-group:last').css('display', 'block');
                                passwordCheckGroup.fadeIn();
                                passwordGroup.fadeIn();
                                $('#checkout-form .choose-password-group').css('display', 'none');
                                $('.login-check[value="0"]').prop('checked', true).change();
                            } else if (data && data.status === 'pending') {
                                $('#checkout-form .choose-password-group').css('display', 'none');
                            } else {
                                $('#checkout-form .choose-password-group').css('display', 'block');
                            }
                        }, 500);
                    }
                });
            } else {
                emailButton.fadeIn('fast');
            }
        }    
   });
}


 /**
 * Initialize the click event listener on the login button which triggers the login functionality.
 *
 * @method initializeLoginButtonListener
 */ 
function initializeLoginButtonListener () {
    $('#checkout-form input[type="password"]').keypress(function (e) {
        if (e.which == 13) {
            $('.btn-login').focus().click();
            return false;    //<---- Add this line
            stopPropagation();
        }
    });
    $('#checkout-form .btn-login').on('click', function () {
        var el       = $(this),
            email    = $('#checkout-form #customer_email').val(),
            password = $('#checkout-form input[type="password"]').val();
            pass_field = $('#checkout-form input[type="password"]');
        
        $('.password-group .state').fadeOut();
        
        $('#checkout-form').addClass('loading-ajax');
        if (email.length > 0 && password.length > 0) {
            $.post(el.data('path'), { 'account[email]' : email, 'account[password]' : password }).done(function (data, status, xhr) {
                var checkoutUrl = $('#checkout-form').data('path');
                window.location.reload();
            }).fail(function () {
                $('#checkout-form').removeClass('loading-ajax');
                $(pass_field).parent().addClass('form-val-error');
                $(pass_field).parent().next().removeClass('hidden');
            });
        } else {
            $('#checkout-form').removeClass('loading-ajax');
            
        }
    });
}



 /**
 * Initialize the click event listener on the password forgot link, which sends an email via an ajax post and displays a modal with a message.
 * 
 * @method initializeForgotListener
 */ 
function initializeForgotLinkListener () {
    $('#checkout-form .forgot-link').unbind('click').bind('click', function () {
        var email = $('#checkout-form input[name="customer[email]"]').val();
        $('#checkout-form').addClass('loading-ajax');
        
        $.post($(this).data('path'), { 'account[email]' : email }).done(function (data) {
            $('#checkout-form').removeClass('loading-ajax');
            $('#forgotPassModal').modal({show: true});
        });
    });
}


/**
 * Toggle the text for the redeem credits based on whether the checkbox is checked.
 * 
 * @method checkRegistration
 */ 
function checkRegistration () {
    var email = $('#checkout-form input[name="customer[email]"]').val() || '',
        password = $('#checkout-form input[name="account_password"]').val() || '',
        name = $('#checkout-form input[name="customer[name]"]').val() || '',
        choosePassword = $('#checkout-form input[name="choose_password"]');
    
    if (choosePassword.is(':checked')) {
        $.post('/login/signup', { 'account[email]': email, 'account[password]': password, 'account[name]': name }).done(function (data) {
            if (data && data.is_logged_in) {
                var checkoutForm = $('#checkout-form');
                
                checkoutForm.data('log', 1);
                
                $('#checkout-form .email-group').css('display', 'none');
                $('#checkout-form .password-group').css('display', 'none');
                $('#checkout-form .choose-password-group').css('display', 'none');
            }
        });
    }
}

/**
 * Add loading animation when form is submitted.
 * 
 * @method finishCheckout
 */ 

// Keeps track of whether or not the form has been submitted.
// This prevents the form from being submitted twice in cases
// where `hitCallback` fires normally.
var formSubmitted = false;

function submitForm(form) {
    if (!formSubmitted) {
        formSubmitted = true;
        form.submit();
    }
}

function finishCheckout() {
    $('.finish-checkout').on('click', function(e){
        // Creates a timeout to call `submitForm` after one second.
        
        
        $('#checkout-form').addClass('loading-ajax');
        
        if (typeof gaceCheckout !== 'undefined') {
            setTimeout(submitForm($('#checkout-form')), 3000);
            
            $('#checkout-form.stepped').trigger('next.Checkout', 'step-5', e);
            
            ga('send', 'event', 'Checkout', 'submit', {
                hitCallback: function() {
                   submitForm($('#checkout-form'));
                }
            });
            
        } else {
            $('#checkout-form').submit();
        }
        
        e.preventDefault();
        return false;
    });
}


$('input[name="use_loyalty"]').on('change', function(){
    toggleLoyaltyField();
});

function toggleLoyaltyField() {
    var type_field = $('#loyalty-type-field'),
        val = $('input[name="use_loyalty"]:checked').val();
        
    if(val == '1') {
        type_field.collapse('show');
        $('input[name="loyalty[charge_type]"][value="2"]').prop('checked', true).trigger('change');
    } else {
        type_field.collapse('hide');
        $('input[name="loyalty[charge_type]"]').each(function() {
            $(this).prop('checked', false).trigger('change');
        });
    }
}
$('input[name="loyalty[charge_type]"]').on('change', function(){
    toggleCreditsField();
});

function toggleCreditsField() {
    var amount_field = $('#loyalty-amount-field'),
        val = $('input[name="loyalty[charge_type]"]:checked').val();
        
    if(val == '1') {
        amount_field.collapse('show');
    } else {
        amount_field.collapse('hide');
    }
}

// $('#success-signup-form').on('submit', function(e) {
//     e.preventDefault();
//     SignupFormAjax('#success-signup-form');
// });
// ;

// function SignupFormAjax(selector) {
//     var el = $(selector),
//         data = el.serializeArray(),
//         url = el.attr('action'),
//         method = el.attr('method');
    
//     $.ajax({
//         url: url,
//         method: method,
//         data: data,
        
//         beforeSend: function() {
//             console.log('started');
//         },
//         success: function() {
//             console.log('success');
//         },
//         error: function() {
//             console.log('error');
//         },
//     })
// }


/**
 * Check whether klarna should be available.
 * 
 * @method checkKlarnaAvailability
 */ 
function checkKlarnaAvailability() {
    var allowedCountries = ['DE', 'NL', 'AT'];
    var klarnaMethodId = parseInt($('#checkout-form').data('klarna-method-id'));
    
    var klarnaMethod = $('.payment-method-option[value="' + klarnaMethodId + '"]');
    var klarnaContainer = klarnaMethod.closest('.payment-method-row');
    var selectedMethod = $('#checkout-form .shipping-method-option:checked');
    var selectedMethodId = selectedMethod.val();
    var selectedMethodType = selectedMethod.data('method-code');
    var selectedCountryCode = $('#checkout-form #shipping_address_country_id option:selected').data('country-iso');
    var billingPostcodePart = $.trim($('#checkout-form input[name="billing[address][postal_code]"]').val()).substring(0, 2);
    var minimumAmount = parseFloat(klarnaMethod.data('minimum-amount'));
    var maximumAmount = parseFloat(klarnaMethod.data('maximum-amount'));
    var paymentMethodCost = $('#checkout-form .payment-method-option:checked').data('cost') || 0;
    var klarnaMethodCost = klarnaMethod.data('cost') || 0;
    var total = (getTotal() - parseFloat(paymentMethodCost)) + parseFloat(klarnaMethodCost);
    var sameBillingAddress = $('#same-billing-address').is(':checked');
    var birthday = $('#customer_birth_date').val();
    
    if (
        !sameBillingAddress ||
        allowedCountries.indexOf(selectedCountryCode) < 0 || 
        (selectedMethodType === 'pick' && (!birthday || birthday === '')) ||
        (!isNaN(minimumAmount) && !isNaN(maximumAmount) && (total < minimumAmount || total > maximumAmount))
    ) {
        klarnaContainer.addClass('hidden');
        
        if (klarnaMethod.is(':checked')) {
            klarnaMethod.prop('checked', false);
        }
    } else {
        klarnaContainer.removeClass('hidden');
    }
}

/**
 * Return the total amount of the order.
 * 
 * @method getTotal
 * @return {float}
 */ 
function getTotal() {
    var methods = $('.shipping-method-option:checked, .payment-method-option:checked');
    var currentTotal = $('.checkout-table-total').data('total-amount') || 0;
    var totalCost = 0;
    var discountRate = getDiscountRate();
    
    $.each(methods, function(i, method) {
        var el = $(method);
        var cost = el.data('cost');
        
        if (cost) {
            totalCost += parseFloat(cost);
        }
    });
    
    if (discountRate > 0) {
        currentTotal = (currentTotal * ((100 - discountRate) / 100));
    }
    
    return parseFloat(currentTotal) + totalCost;
}

$('body').on('click', '[data-action="add-checkout-coupon"]', function() {
    $('#checkout-coupon-code').trigger($.Event( "keyup", { keyCode: 13 } ));
});

$('#checkout-coupon-code').on('keyup', function(e) {
    if (e.keyCode === 13) {
        checkoutAddCouponCode(this);
    }
});
$('body').on('click', '[data-action="remove-checkout-coupon"]', checkoutRemoveCouponCode);


function checkoutAddCouponCode(input) {
    var el = $(input);
    var button = $(el.siblings('.input-group-btn').find('button'));
    var value = el.val();
    var action = el.data('add-url');
    var checkoutUrl = el.data('checkout-url');
    
    var errorContainer = $('.coupon-error-container');
    
    $.ajax({
        type: "POST",
        url : action,
        data: {
            coupon: value,
        },
        beforeSend: function() {
            $('#checkout-form').addClass('loading-ajax');
        }, 
        success: function(event, request, settings) {
            $.ajax({
                type: "GET",
                url: checkoutUrl,
                contentType: 'application/json',
                success: function (event) {
                    $('.checkout-table-total').data('total-amount', event.cart.total);
                    
                    $.each(event.cart.vat, function(idx, vat) {
                        $('.rowcheckout-tax-row.checkout-tax-row-' + vat.rate).data('tax-amount', vat.amount);
                    });
                    
                    var couponContainer = $('#checkout-table-coupon');
                    var couponLabel = couponContainer.data('label');
                    var currencySymbol = $('body').data('af-currency');
                    var couponHTML = '';
                    
                    couponHTML += '<div class="col-sm-6">';
                        couponHTML += '<span>' + couponLabel.replace("{code}", event.cart.coupon.code).replace("{rate}", event.cart.coupon.discount_rate.toFixed(12)) + '</span>';
                    couponHTML += '</div>';
                    couponHTML += '<div class="col-sm-6 text-right">';
                        couponHTML += '<span>' + currencySymbol + ' ' + parseFloat(event.cart.discount).toFixed(2).replace('.', ',').replace(',00', ',-') + '</span>';
                    couponHTML += '</div>';
                    
                    couponContainer.html(couponHTML);
                    
                    el.attr('disabled', true);
                    el.val(event.cart.coupon.label + ' - ' + event.cart.coupon.code);
                    
                    button.text(button.data('remove-label'));
                    button.data('action', 'remove-checkout-coupon').attr('data-action', 'remove-checkout-coupon');
                    
                    setTax();
                    setTotal();
                    
                    $('#checkout-form').removeClass('loading-ajax');
                    errorContainer.html('');
                },
                error: function() {
                    $('#checkout-form').removeClass('loading-ajax');
                }
            });
        },
        error: function(error) {
            errorContainer.html('<p class="text-danger">' + error.responseJSON.message + '</p>');
            $('#checkout-form').removeClass('loading-ajax');
        }
    });
}

function checkoutRemoveCouponCode() {
    var button = $(this);
    var input = $(button.data('input-id'));
    var action = input.data('remove-url');
    var checkoutUrl = input.data('checkout-url');
    
    var errorContainer = $('.coupon-error-container');
    
    $.ajax({
        type: "GET",
        url : action,
        beforeSend: function() {
            $('#checkout-form').addClass('loading-ajax');
        }, 
        success: function(event, request, settings) {
            $('#checkout-form').removeClass('loading-ajax');
        },
        error: function(error) {
            if (error.status === 404) {
                $.ajax({
                    type: "GET",
                    url: checkoutUrl,
                    contentType: 'application/json',
                    success: function (event) {
                        $('.checkout-table-total').data('total-amount', event.cart.total);
                        
                        $.each(event.cart.vat, function(idx, vat) {
                            $('.rowcheckout-tax-row.checkout-tax-row-' + vat.rate).data('tax-amount', vat.amount);
                        });
                        
                        var couponContainer = $('#checkout-table-coupon');
                        couponContainer.html('');
                        
                        input.attr('disabled', false);
                        input.val('');
                        
                        button.text(button.data('add-label'));
                        button.data('action', 'add-checkout-coupon').attr('data-action', 'add-checkout-coupon');
                        
                        setTax();
                        setTotal();
                        
                        $('#checkout-form').removeClass('loading-ajax');
                    },
                    error: function(event) {
                        $('#checkout-form').removeClass('loading-ajax');
                    }
                });
            } else {
                errorContainer.html('<p class="text-danger">' + error.responseJSON.message + '</p>');
            }
        }
    });
}






