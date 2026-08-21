
var accountRequests = [];

$(function() {
    $('.address-check-field').on('focusout', searchValidAddress);
});

/**
 * Retrieve a possible adress from the postcode database.
 *
 * @method retrieveAddressAccount
 * @param {Object}          e       The event data object.
 */
function searchValidAddress() {
    var autocompleteUrl = 'https://app.afosto.com/address/_suggest';
    var addressDetailsUrl = 'https://app.afosto.com/address/_detail';
    var supportedCountries = ['NLD', 'BEL'];
    var el = $(this);
    var formID = '#' + el.closest('form, fieldset.address-form').attr('id');
    
    var REQUIRED_PRECISION = 'Address';

    if (el.length > 0) {
        var type = el.data('type');

        if (type) {
            var countryCodeField = $(formID + ' .address-check-field[data-type="' + type + '"][name*="country_code"], ' + formID + ' .address-check-field[data-type="' + type + '"][name*="country_id"], ' + formID + ' .address-check-field[data-type="' + type + '"][name*="[country][id]"]');
            var postcodeField = $(formID + '  .address-check-field[data-type="' + type + '"][name*="postal_code"]');
            var houseNumberField = $(formID + ' .address-check-field[data-type="' + type + '"][name*="premise_number"], ' + formID + ' .address-check-field[data-type="' + type + '"][name*="house_number"]');
            var houseNumberSuffixField = $(formID + ' .address-check-field[data-type="' + type + '"][name*="premise_number_suffix"], ' + formID + ' .address-check-field[data-type="' + type + '"][name*="house_number_suffix"]');
            var streetNameField = $(formID + ' .address-check-field[data-type="' + type + '"][name*="thoroughfare"], ' + formID + ' .address-check-field[data-type="' + type + '"][name*="street"]');
            var cityField = $(formID + ' .address-check-field[data-type="' + type + '"][name*="locality"], ' + formID + ' .address-check-field[data-type="' + type + '"][name*="city"]');
            var validationMessageEl = $(formID + ' .address-validation-message[data-type="' + type + '"]');
            
            var countryCode = countryCodeField.val().replace(/^\s*?(\w+\,\s\w+\!)\s*?$/, '').trim();
            var postcode = postcodeField.val().replace(/^\s*?(\w+\,\s\w+\!)\s*?$/, '').trim();
            var houseNumber = houseNumberField.val().replace(/^\s*?(\w+\,\s\w+\!)\s*?$/, '').trim();
            var houseNumberSuffix = houseNumberSuffixField.val().replace(/^\s*?(\w+\,\s\w+\!)\s*?$/, '').trim();
            var streetName = streetNameField.val().replace(/^\s*?(\w+\,\s\w+\!)\s*?$/, '').trim();
            var city = cityField.val().replace(/^\s*?(\w+\,\s\w+\!)\s*?$/, '').trim();
            
            if (countryCode === 'NL' || countryCode === '1') {
                countryCode = 'NLD';
            } else if(countryCode === 'BE' || countryCode === '272') {
                countryCode = 'BEL';
            } else if(countryCode === 'LU' || countryCode === '380') {
                countryCode = 'LUX';
            }

            validationMessageEl.html('<i class="fas fa-sync fa-spin text-info"> </i> ' + validationMessageEl.data('loading-message'));

            getSuggestions(countryCode, {
                countryCode: countryCode,
                postcode: postcode,
                city: city,
                houseNumber: houseNumber,
                houseNumberSuffix: houseNumberSuffix,
                streetName: streetName,
            });
            
            function getSuggestions(context, data, query) {
                if (data.countryCode && supportedCountries.indexOf(data.countryCode) !== -1 && data.postcode !== '' && data.houseNumber !== '') {
                    var keys = ['street', 'city'];
                    
                    var searchUrl = autocompleteUrl + '/' + encodeURIComponent(context) + '/' + encodeURIComponent(data.postcode + ' ' + data.city + ' ' + data.streetName + ' ' + data.houseNumber  + data.houseNumberSuffix);
                    if (query !== undefined) {
                        searchUrl = autocompleteUrl + '/' + encodeURIComponent(context) + '/' + encodeURIComponent(query);
                    }
    
                    $.ajax({
                        url: searchUrl,
                        beforeSend: function () {
                            if (accountRequests[type]) {
                                accountRequests[type].abort();
                            }
                        },
                        success: function (responseData) {
                            var matches = responseData.matches.filter(function(match) {
                                return match.description.toLowerCase().indexOf('unknown') === -1;
                            });
                            
                            var matchesAreSameAddress = function() {
                                if (responseData && matches && matches.length < 1) {
                                    return false;
                                }
                                
                                var firstResult = matches[0].label;
                                
                                return matches.every(function(address) {
                                    return address.label.indexOf(firstResult) > -1;
                                });
                            };
                            
                            var firstResultMatchesQuery = function() {
                                if (responseData && matches && matches.length < 1) {
                                    return false;
                                }
                                
                                var firstResult = matches[0].label.toLowerCase();
                                
                                if (firstResult.indexOf(postcode.toLowerCase()) === -1) {
                                    return false;
                                }
                                if (firstResult.indexOf(houseNumber.toLowerCase()) === -1) {
                                    return false;
                                }
                                if (firstResult.indexOf(houseNumberSuffix.toLowerCase()) === -1) {
                                    return false;
                                }
                                if (countryCode === 'NLD' && matchesAreSameAddress()) {
                                    return true;
                                }
                                
                                if (firstResult.indexOf(city.toLowerCase()) === -1) {
                                    return false;
                                }
                                if (firstResult.indexOf(streetName.toLowerCase()) === -1) {
                                    return false;
                                }
                                
                                return true;
                            };
                            
                            if (firstResultMatchesQuery()) {
                                var firstResult = matches[0];
                                var addressContext = firstResult.context;
                                
                                if (firstResult.precision !== REQUIRED_PRECISION) {
                                    return getSuggestions(addressContext, data, firstResult.value);
                                }
                                
                                $.ajax({
                                    url: addressDetailsUrl + '/' + encodeURIComponent(addressContext),
                                    success: function(data) {
                                        if (typeof streetNameField.parsley === 'function') {
                                            
                                        }
                                        streetNameField.val(data.address.street);
                                        streetNameField.parsley().validate();
                                        streetNameField.change();
                                        cityField.val(data.address.locality);
                                        cityField.parsley().validate();
                                        cityField.change();
                                        validationMessageEl.html('<i class="fas fa-check text-success"> </i> ' + validationMessageEl.data('success-message') );
                                    },
                                    error: function(error) {
                                        console.log(error);
                                        validationMessageEl.html('<i class="fas fa-times-circle text-danger"> </i> ' + validationMessageEl.data('error-message') );
                                    }
                                });
                            } else {
                                validationMessageEl.html('<i class="fas fa-times-circle text-danger"> </i> ' + validationMessageEl.data('error-message') );
                            }
                            
                        },
                        error: function (error) {
                            console.log(error);
    
                            validationMessageEl.html('<i class="fas fa-times-circle text-danger"> </i> Dit adres klopt niet, controleer de velden.');
                        }
                    });
                } else {
                    validationMessageEl.html('');
                }
            }
        }
    }
}
