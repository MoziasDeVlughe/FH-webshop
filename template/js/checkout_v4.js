var SECRET_KEY = '';
// var BASE_URL = "http://localhost:8082/";
// var SESSION_API = BASE_URL + "sessions/";
var BASE_URL = "https://api.afosto.io/";
var SESSION_API = BASE_URL + "odr/sessions/";
var TASK_API = BASE_URL + "mes/tasks/";

var parsleySettings = {
	trigger: "focusout",
	errorsWrapper: "<ul class='list-unstyled text-danger'></ul>",
};
	

var checkoutState = {
	sessionState: {},
	addresses: {
		billing: {
			active: {},
		},
		shipping: {
			active: {},
		},
	},
	user: {
		id: "",
		version: "",
		email: "",
		tags: [],
		given_name: "",
		additional_name: "",
		family_name: "",
		created_at: "",
		updated_at: "",
	},
	loggedIn: false,
	paymentMethods: {},
	shippingMethods: {},
	hasPaymentMethod: false,
	hasShippingMethod: false,
	initialised: false,
	organisation: {},
	phonenumber: {},
	calculation: {},
	
	//  settings
	prefillAddress: true,
	excludedShippingMethods: [],
	enableSplitShipmentOption: $('body').data('shop-type') === 'b2b',
	enableDesiredDeliveryDate: $('body').data('shop-type') === 'b2b',
	autoLinkOrganisation: false,
	excludedPaymentMethodsPerCountry: [],
	accountManagersDomains: [],
};

var LOGGEDIN_EVENT = 'checkout:loggedIn';
var LOGGEDOUT_EVENT = 'checkout:loggedOut';
var REFILL_DATA_EVENT = 'checkout:prefillData';
var BILLINGADDRESSESCHANGE_EVENT = 'checkout:billingAddressesChange';
var SHIPPINGADDRESSESCHANGE_EVENT = 'checkout:shippingAddressesChange';
var CHECKOUTSESSIONCHANGE = 'checkout:sessionChange';
var CHECKOUTSTATECHANGED_EVENT = 'checkout:stateChanged';
var PAYMENTMETHODSLOADED_EVENT = 'checkout:paymentMethodsLoaded';
var SHIPPINGMETHODSLOADED_EVENT = 'checkout:shippingMethodsLoaded';
var SHIPPINGMETHODSELECTED_EVENT = 'checkout:shippingMethodSelected';
var USERDATAFETCHED_EVENT = 'checkout:userDataFetched';
var SHIPPINGCOUNTRYCHANGED_EVENT = 'checkout:shippingCountryChanged';
var SHIPPINGPOSTALCODECHANGED_EVENT = 'checkout:shippingPostalCodeChanged';
var ORGANISATION_SELECTED_EVENT = 'checkout:organisationSelected';
var USERIDENTIFY_EVENT = 'checkout:userIdentify';
var FINISHCHECKOUT_EVENT = 'checkout:finish';
var PHONENUMBERCHANGE_EVENT = 'checkout:phonenumberChanged';

var checkoutContainer = $('#checkout-v4');
var identifyRequest;
var indentifyTimeout;

function upperCasePipe(value) {
    return value.toUpperCase();
}

$(function() {
	if (checkoutContainer.data('session-id')) {
	    
		SECRET_KEY = checkoutContainer.data('session-id');
		
		initCheckout();
	}
	
	if (!checkoutState.enableDesiredDeliveryDate) {
	    $('.desired-delivery-container').addClass('hidden');
	}
	
	if ($('#checkout-v4').length > 0) {
        vanillaTextMask.maskInput({
            inputElement: document.getElementById('organisation-vat-number'),
            mask: createVatIdMask(),
            pipe: upperCasePipe
        });
        vanillaTextMask.maskInput({
            inputElement: document.getElementById('new-organisation-vat-number'),
            mask: createVatIdMask(),
            pipe: upperCasePipe
        });
    }
	
	$('#checkout-v4 #account-form').on('submit', function(e) {
		e.preventDefault();
		var email = $('#account-email').val();
		var password = $('#account-password').val();
		
		handleUserLogin(email, password);
	});
	
	$('#checkout-v4 #edit-account-form').on('submit', handleEditContact);
	$('#checkout-v4 .create-address-form').on('submit', handleCreateAddress);
	$('#checkout-v4 .create-organisation-form').on('submit', handleCreateOrganisation);
	$('#checkout-v4 .create-phonenumber-form').on('submit', handleCreatePhonenumber);
	
	$('body').on('click', '[data-action="logout"]', handleUserLogout);
	
	$('body').on('click', '[data-action="select-address"]', function() {
		var el = $(this);
		var type = el.data('address-type');
		var id = el.data('address-id');
		
		selectAddress(id, type, function() {
			$('#' + type + '-addresses').modal('hide');
		});
	});
	
	$('body').on('click', '[data-action="select-phonenumber"]', function() {
		var el = $(this);
		var id = el.data('phonenumber-id');
		
		selectPhonenumber({ phone_number_id: id }).then(function() {
			handleFetchPhoneNumber();
			$('#change-phonenumber').modal('hide');
		});
	});
	
	$('body').on('click', '[data-action="remove-organisation"]', function() {
	    removeOrganisation();
	    $('.remove-organisation').attr('disabled', true);
	});
	$('body').on('click', '[data-action="select-organisation"]', function() {
		var el = $(this);
		var id = el.data('organisation-id');
		
		selectOrganisation(id, function() {
			$('#organisation-select').modal('hide');
			$('.remove-organisation').attr('disabled', false);
		});
	});
	
	$('#change-phonenumber').on('hidden.bs.modal', function() {
		$(this).find('form').trigger('reset');
		$(this).find('form').parsley().reset();
	});
	
	$('body').on('click', '[data-action="toggle-new-address-form"]', function() {
		toggleNewAddressForm($(this).closest('.modal-content'), $(this).data('toggle-to'));
	});
	
	$('body').on('click', '[data-action="toggle-new-phonenumber-form"]', function() {
		toggleNewPhonenumberForm($(this).closest('.modal-content'), $(this).data('toggle-to'));
	});
	
	$('body').on('click', '[data-action="toggle-new-organisation-form"]', function() {
		toggleNewOrganisationForm($(this).closest('.modal-content'), $(this).data('toggle-to'));
	});
	
	$('body').on('change', '.address-container[data-address-type="shipping"] select[name="country_code"]', function() {
		checkoutContainer.trigger(SHIPPINGCOUNTRYCHANGED_EVENT);
	});
	
	$('body').on('change', '.address-container[data-address-type="shipping"] input[name="postal_code"]', function() {
		checkoutContainer.trigger(SHIPPINGPOSTALCODECHANGED_EVENT);
	});
	
	$('#billing-addresses, #shipping-addresses').on('hidden.bs.modal', function() {
		toggleNewAddressForm($(this).find('.modal-content'), 'hidden');
	});
	$('#change-phonenumber').on('hidden.bs.modal', function() {
		toggleNewPhonenumberForm($(this).find('.modal-content'), 'hidden');
	});
	$('#organisation-select').on('hidden.bs.modal', function() {
		toggleNewOrganisationForm($(this).find('.modal-content'), 'hidden');
	});
	
	$('body').on('click', '[data-action="select-shipping-method"]', handleSelectShippingMethod);
	$('body').on('click', '[data-action="select-shipping-method-servicepoint"]', handleSelectShippingServicePoint);
	$('body').on('click', '[data-action="select-payment-method"]', handleSelectPaymentMethod);
	$('body').on('click', '[data-action="select-payment-method-issuer"]', handleSelectPaymentMethodIssuer);
	
	$('body').on('change', '.toggle-on-check', toggleOnCheck);
	$('body').on('change', '[data-action="toggle-split-shipment"]', handleToggleSplitShipmentOption);
	$('body').on('change', '[data-clear-form-on-uncheck]', clearFormOnUncheck);
	$('body').on('change', '#desired-delivery-date', handleChangeDesiredDeliveryDate);
	$('body').on('change', '#order-reference', handleChangeReference);
	$('body').on('change', '#organisation-contact', handleOrganisationContactChange);
	$('body').on('change', '#new-organisation-country-code, #organisation-country-code', toggleOrganisationFields);
	$('body').on('change', '.account-create-field', function() {
	    var allValuesEntered = true;
	    $('.account-create-field').each(function(idx, field) {
	        if (field.value === '' && $(field).attr('name') !== 'account_additional_name') {
	            allValuesEntered = false;
	        }
	    });
	    if (allValuesEntered) {
	        handleCreateGuestContact('#account-form');
	    }
    });
	
	$('body').on('change', '[data-copy-to]', function() {
	    var el = $(this);
	    var value = el.val();
	    var fieldToCopyTo = el.data('copy-to');
	    
	    $(fieldToCopyTo).val(value);
    });
    
    $('#edit-contact').on('show.bs.modal', function() {
       $('#edit-account-email').val(checkoutState.user.email); 
       $('#edit-account-given-name').val(checkoutState.user.given_name); 
       $('#edit-account-additional-name').val(checkoutState.user.additional_name); 
       $('#edit-account-family-name').val(checkoutState.user.family_name); 
    });
    
// 	$('body').on('click', '#submit-contact', handleCreateGuestContact);
// 	$('body').on('change', '#contact-phonenumber, #contact-phonenumber-country', handleCreateGuestPhonenumber);

	$('#checkout-v4 #account-email').on('keyup', handleCheckIdentity);
	$('[data-action="collapse"]').on('change', toggleCollapseOnCheck);
	
	$('#shipping-address-collapse').on('hide.bs.collapse', function() {
		$('.address-container[data-address-type="billing"] input, .address-container[data-address-type="billing"] select').change();
	});
	$('.address-form input, .address-form select').on('change', handleAddressInput);
	
	$('#checkout-v4 button[data-next-step]').on('click.af', handleNextStep);
	$('#checkout-v4 button[data-prev-step]').on('click.af', handlePreviousStep);
	
	$('body').on('click', '[data-action="finish-checkout"]', function() {
		checkoutContainer.trigger(FINISHCHECKOUT_EVENT);
	});
	
	$('body').on('keydown', '#checkout-v4 input[name="premise_number"]', function(e){
        var el = $(this);
        var type = el.data('type');
        
        if((e.keyCode >= 65 && e.keyCode <= 90) || (e.keyCode >= 188 && e.keyCode <= 190) || (e.keycode >= 106 && e.keyCode <= 111) ){
            el.closest('form').find('[name="premise_number_suffix"]').val('').focus();
        } 
    });
    
	
	checkoutContainer.on(LOGGEDIN_EVENT, function () {
		checkoutState.loggedIn = true;
		
		fetchAddresses();
		toggleAddressInput('existing-user');
		togglePhonenumberInput('existing-user');
		toggleOrganisationInput('existing-user');
		toggleUserDisplay('loggedin-display');
		toggleAccountManagersInputs('show');
	});
	
	checkoutContainer.on(REFILL_DATA_EVENT, function () {
		handleRefillNewUserFields();
	});
	
	checkoutContainer.on(USERDATAFETCHED_EVENT, function() {
		$('#user-email').text(checkoutState.user.email);
		$('#created-user-email').text(checkoutState.user.email);
		$('#created-user-fullname').text(checkoutState.user.given_name + ' ' + (checkoutState.user.additional_name ? (checkoutState.user.additional_name + ' ') : '') + checkoutState.user.family_name);
		handleFetchPhoneNumber();
		handleFetchOrganisations();
		prefillAddressForm('#new-billing-address-form', checkoutState.user);
		prefillAddressForm('#new-shipping-address-form', checkoutState.user);
	});
	
	checkoutContainer.on(LOGGEDOUT_EVENT, function () {
		toggleAddressInput('new-user');
		togglePhonenumberInput('new-user');
		toggleOrganisationInput('new-user');
		toggleUserDisplay('loggedout-display');
	});
	checkoutContainer.on(BILLINGADDRESSESCHANGE_EVENT, function() {
		renderAddressOptions('.address-options[data-options-type="billing"]', checkoutState.addresses.billing, 'billing');
		if (checkoutState.addresses.billing.active !== null) {
			filterPaymentMethods(checkoutState.addresses.billing.active.country_code);
		}
	});
	checkoutContainer.on(SHIPPINGADDRESSESCHANGE_EVENT, function() {
		handleFetchShippingMethods();
		renderAddressOptions('.address-options[data-options-type="shipping"]', checkoutState.addresses.shipping, 'shipping');
		
	});
	checkoutContainer.on(PAYMENTMETHODSLOADED_EVENT, function () {
		renderPaymentMethods('.checkout-payment-methods', checkoutState.paymentMethods);
	});
	checkoutContainer.on(SHIPPINGMETHODSLOADED_EVENT, function () {
		renderShippingMethods('.checkout-shipping-methods', checkoutState.shippingMethods, checkoutState.excludedShippingMethods);
	});
	checkoutContainer.on(SHIPPINGMETHODSELECTED_EVENT, function() {
		toggleShippingMethodInfo();
	});
	checkoutContainer.on(ORGANISATION_SELECTED_EVENT, function() {
		fetchAddresses(true, checkoutState.loggedIn);
		allowSaveAddressAsOption();
	});
	checkoutContainer.on(FINISHCHECKOUT_EVENT, function() {
		handleFinishCheckout();
	});
	checkoutContainer.on(SHIPPINGCOUNTRYCHANGED_EVENT, function () {
		handleFetchShippingMethods();
	});
	checkoutContainer.on(CHECKOUTSTATECHANGED_EVENT, function () {
// 		handleShouldRenderProjection();
	});
	
	
	$('#new-organisation-country-code, #organisation-country-code').trigger('change');
});

function startPromiseChain() {
    return new Promise(function(resolve, reject) {
        resolve();
    });
}

// API call utils
function ajaxRequest(ajaxOptions) {
	return new Promise(function(resolve, reject) {
		$.ajax({
			method: ajaxOptions.method,
			url: ajaxOptions.url,
			contentType: ajaxOptions.contentType,
			data: ajaxOptions.data || {},
			dataType: ajaxOptions.dataType,
			success: function(data, msg, xhr) {
			    var responseData = (typeof data === 'string' ? JSON.parse(data) : data) || {};
			    responseData.xhr = xhr || {};
				resolve(responseData);
			},
			error: function(error, status, string) {
				console.log(error, status, string);
				reject(error);
			},
			complete: ajaxOptions.complete || undefined,
		});
	});
}

/**
 * Do an ajax request to the odr session api
 * @param {String} endpoint
 * @param {Object} options
 * public
 **/
function sessionApi(endpoint, options) {
	if (SECRET_KEY === null) {return console.error(new Error('No secret provided'));}
	var requestSettings = $.extend({}, { 
		url: SESSION_API + SECRET_KEY + (endpoint !== '' ? '/' + endpoint : ''),
	}, options);
	return ajaxRequest(requestSettings);
}

/**
 * Do an ajax request to the mes api
 * @param {String} endpoint
 * @param {Object} options
 * public
 **/
function taskApi(endpoint, options) {
	var requestSettings = $.extend({}, { 
		url: TASK_API + (endpoint !== '' ? endpoint : ''),
	}, options);
	return ajaxRequest(requestSettings);
}

/**
 * Authenticate a user and receive a contact id
 * @param {String} email
 * @param {String} password
 * public
 **/
function authenticateUser(email, password) {
	return sessionApi('authenticate', {
		method: "POST",
		contentType: 'application/json',
		data: JSON.stringify({
			"email": email,
			"password": password,
		}),
	});
}

/**
 * Authorize session to get payment redirect
 * @param {String} calculation_id
 * public
 **/
function authorizeSession(calculation_id) {
	return sessionApi('authorize', {
		method: "POST",
		contentType: 'application/json',
		data: JSON.stringify({
			"calculation_id": calculation_id,
		}),
	});
}

/**
 * Identify a user by it's email address
 * @param {String} email
 * public
 **/
function identifyUser(email) {
	return sessionApi('identity', {
		method: "POST",
		contentType: 'application/json',
		data: JSON.stringify({
			"email": email,
		}),
	});
}

/**
 * Set the address id for the billing address
 * @param {String} contact_id
 * public
 **/
function setBillingAddress(address_id, options) {
	var data = {
		"address_id": address_id,
	};
	
	if (options && typeof options === 'object') {
		data = Object.assign(data, options);
	}
	
	return sessionApi('billing', {
		method: "PUT",
		contentType: 'application/json',
		data: JSON.stringify(data),
	});
}

/**
 * Set the order reference
 * @param {String} reference
 * public
 **/
function setOrderReference(reference) {
	return sessionApi('reference', {
		method: "PUT",
		contentType: 'application/json',
		data: JSON.stringify({
			"reference": reference,
		}),
	});
}

/**
 * Set the options for the shipping window
 * @param {Object} shippingWindow
 * public
 **/
function setShippingWindow(shippingWindow) {
	return sessionApi('shipping/window', {
		method: "PUT",
		contentType: 'application/json',
		data: JSON.stringify(shippingWindow),
	});
}

/**
 * Set the address id for the shipping address
 * @param {String} contact_id
 * public
 **/
function setShippingAddress(address_id, options) {
	var data = {
		"address_id": address_id,
	};
	
	if (options && typeof options === 'object') {
		data = Object.assign(data, options);
	}
	
	return sessionApi('shipping', {
		method: "PUT",
		contentType: 'application/json',
		data: JSON.stringify(data),
	});
}

/**
 * Set the organisation id
 * @param {String} contact_id
 * public
 **/
function deleteOrganisation() {
	return sessionApi('organisations', {
		method: "delete",
		contentType: 'application/json',
	});
}

/**
 * Set the organisation id
 * @param {String} contact_id
 * public
 **/
function setOrganisation(organisation_id) {
	return sessionApi('organisations', {
		method: "PUT",
		contentType: 'application/json',
		data: JSON.stringify({
			"organisation_id": organisation_id,
		}),
	});
}

/**
 * Set the phonenumber of the contact
 * @param {String} country_code
 * @param {String} number
 * public
 **/
function setPhonenumber(country_code, number) {
	return sessionApi('phonenumbers', {
		method: "POST",
		contentType: 'application/json',
		data: JSON.stringify({
			"country_code": country_code,
			"number": number,
		}),
	});
}

/**
 * Create a new address
 * @param {object} data
 * public
 **/
function createAddress(data) {
	return sessionApi('address', {
		method: "POST",
		contentType: 'application/json',
		data: JSON.stringify(data),
	});
}

/**
 * Create a new contact
 * @param {object} data
 * public
 **/
function createContact(data) {
	return sessionApi('contact', {
		method: "POST",
		contentType: 'application/json',
		data: JSON.stringify(data),
	});
}

/**
 * Create a new organisation
 * @param {object} data
 * public
 **/
function createOrganisation(data) {
	return sessionApi('organisations', {
		method: "POST",
		contentType: 'application/json',
		data: JSON.stringify(data),
	});
}

/**
 * Select a payment option
 * @param {object} data
 * public
 **/
function selectPaymentMethod(data) {
	return sessionApi('billing/methods', {
		method: "PUT",
		contentType: 'application/json',
		dataType: 'text',
		data: JSON.stringify(data),
	});
}

/**
 * Select a shipping option
 * @param {object} data
 * public
 **/
function selectShippingMethod(data) {
	return sessionApi('shipping/methods', {
		method: "PUT",
		contentType: 'application/json',
		dataType: 'text',
		data: JSON.stringify(data),
	});
}

/**
 * Select a shipping servicepoint option
 * @param {object} data
 * public
 **/
function selectShippingMethodServicePoint(data) {
	return sessionApi('shipping/point', {
		method: "PUT",
		contentType: 'application/json',
		dataType: 'text',
		data: JSON.stringify(data),
	});
}

/**
 * Get task
 * @param {string} taskID
 * public
 **/
 var maxRetries = 10;
function pollTask(id, attempt) {
    var attemptCount = attempt ? attempt : 1;
    return new Promise(function(resolve, reject) {
	    taskApi(id, {
    		method: "GET",
    		contentType: 'application/json',
    		dataType: 'text',
    		complete: function(data) {
                var response = JSON.parse(data.responseText);
    		    if (!response.is_success && attemptCount < maxRetries) {
    		        setTimeout(function() {
    		            pollTask(id, attemptCount + 1).then(function(data) {
    		                resolve(data);
    		            });
    		        }, 500);
    		    } else {
    		        console.log(response);
    		        resolve(response);
    		    }
    		}
    	}).catch(function() {
    	    if (attemptCount < maxRetries) {
        	    setTimeout(function() {
                    pollTask(id, attemptCount + 1).then(function(data) {
                        resolve(data);
                    }).catch(function() {
                        reject(new Error('could not verify vat-number'));
                    });
                }, 500);
    	    } else {
    	        reject(new Error('could not verify vat-number'))
    	    }
    	});
    });
}

/**
 * Fetch information about the linked contact
 * public
 **/
function fetchContactInfo() {return sessionApi('contact')};

/**
 * Fetch users saved shipping addresses
 * public
 **/
function fetchShippingAddresses() {return sessionApi('shipping') }

/**
 * Fetch users saved billing addresses
 * public
 **/
function fetchBillingAddresses() { return sessionApi('billing') }

/**
 * Fetch cart items summary
 * public
 **/
function fetchItemSummary() { return sessionApi('items') }

/**
 * Fetch projection of the session
 * public
 **/
function fetchProjection() { return sessionApi('projection') }

/**
 * Fetch calculation of the session
 * public
 **/
function fetchCalculation() { return sessionApi('calculation') }

/**
 * Fetch projection of the cart and all the items
 * public
 **/
function fetchCheckoutExpiry() { return sessionApi('') }

/**
 * Fetch the order reference added to the order
 * public
 **/
function fetchOrderReference() { return sessionApi('reference') }

/**
 * Fetch all available shipping methods
 * public
 **/
function fetchAvailableShippingMethods(country_code) {
	return sessionApi('shipping/methods', {
		method: 'GET',
		contentType: 'application/json',
		data: {
			country_code: country_code,
		}
	});
}

function fetchAvailableShippingMethodWindows(zipcode, carrier, from) {
	return sessionApi('shipping', {
		method: "GET",
		contentType: 'application/json',
		dataType: 'text',
		data: {
			zipcode: zipcode,
			carrier: carrier,
			from: from,
		},
	});
}

/**
 * Fetch all available pickup points
 * @param {String} zipcode
 * public
 **/
function fetchAvailablePickupPoints(method_id, country_code, zipcode) {
	return sessionApi('shipping/point', {
		method: "GET",
		data: {
			"method_id": method_id,
			"country_code": country_code,
			"postal_code": zipcode,
		},
	});
}

/**
 * Fetch all available payment methods
 * public
 **/
function fetchPaymentMethods() { return sessionApi('billing/methods') }

/**
 * Fetch billing contact information
 * public
 **/
function fetchBillingContactInformation() { return sessionApi('billing/contact') }

/**
 * Fetch primary phonenumber
 * public
 **/
function fetchPhonenumber() { return sessionApi('phonenumbers') }

/**
 * Fetch primary phonenumber
 * public
 **/
function createPhonenumber(id, options) { 
    var data = {
		"phone_number_id": id,
	};
	
	if (options && typeof options === 'object') {
		data = Object.assign(data, options);
	}
    
    return sessionApi('phonenumbers', {
		method: "POST",
		contentType: 'application/json',
		data: JSON.stringify(data),
	});
}

/**
 * Fetch primary phonenumber
 * public
 **/
function selectPhonenumber(data) { 
    return sessionApi('phonenumbers', {
		method: "PUT",
		contentType: 'application/json',
		data: JSON.stringify(data),
	});
}



/**
 * Fetch primary phonenumber
 * public
 **/
function fetchOrganisations() { return sessionApi('organisations') }

/**
 * Fetch shipping window
 * public
 **/
function fetchShippingWindow() { return sessionApi('shipping/window') }

/**
 * Fetch shipping window
 * public
 **/
function AddCoupon(code) { return ajaxRequest({
    url: location.origin + "/cart/coupon/",
    method: 'POST',
    data: {
        coupon: code,
    }
})};



// Checkout functions
function initCheckout() {
	checkoutContainer.addClass('loading-ajax');

	fetchContactInfo().then(function(data) {
		if(data.id !== '') {
			checkoutState.user = data;
			checkoutContainer.trigger(USERDATAFETCHED_EVENT);
			
			identifyUser(data.email).then(function() {
				checkoutContainer.trigger(LOGGEDIN_EVENT);
			}).catch(function() {
			    checkoutState.loggedIn = true;
			    toggleUserDisplay('created-display');
			    toggleAddressInput('existing-user');
        		togglePhonenumberInput('existing-user');
        		toggleOrganisationInput('existing-user');
			    fetchOrganisations(data).then(function(orgData) {
                    checkoutState.organisation = orgData;
            		renderOrganisationOptions('.organisation-options', orgData);
            		prefillAddressForm('#new-billing-address-form', checkoutState.user, orgData.active);
            		prefillAddressForm('#new-shipping-address-form', checkoutState.user, orgData.active);
    			    fetchAddresses().then(function() {
    			        fetchPhonenumber().then(function() {
    				        checkoutContainer.trigger(REFILL_DATA_EVENT);
    	                }).catch();
			        }).catch();
			    }).catch();
			    
			// 	checkoutState.addresses.shipping.active.country_code = 'NL';
			// 	checkoutContainer.trigger(SHIPPINGCOUNTRYCHANGED_EVENT);
			// 	$('[data-parsley-group]').parsley(parsleySettings);
			}).finally(function() {
				checkoutContainer.removeClass('loading-ajax');
			});
		} else {
    		fetchOrganisations(data).then(function(orgData) {
                checkoutState.organisation = orgData;
        		renderOrganisationOptions('.organisation-options', orgData);
        		prefillAddressForm('#new-billing-address-form', checkoutState.user, orgData.active);
        		prefillAddressForm('#new-shipping-address-form', checkoutState.user, orgData.active);
			    fetchAddresses().then(function() {
			        fetchPhonenumber().then(function() {
				        checkoutContainer.trigger(REFILL_DATA_EVENT);
	                }).catch();
		        }).catch();
		    }).catch();
    // 		toggleUserDisplay('loggedin-display');
    // 		toggleAccountManagersInputs('show');
			checkoutState.addresses.billing.active.country_code = $('#billing-address-field #billing-country-code').val() || 'NL';
			checkoutState.addresses.shipping.active.country_code = $('#shipping-address-field #shipping-country-code').val() || 'NL';
// 			$('.address-form input, .address-form select').change();
			checkoutContainer.trigger(SHIPPINGCOUNTRYCHANGED_EVENT);
			$('[data-parsley-group]').parsley(parsleySettings);
			checkoutContainer.removeClass('loading-ajax');
		}
	});
	
	handleFetchPaymentMethods();
	handleFetchShippingWindow('#desired-delivery-date');
	handleFetchReference('#order-reference');
}

/**
 * Fetch the new checkout session data
 * public
 **/
function updateCheckoutSession() {
	return new Promise(function (resolve, reject) {
		fetchCheckoutStatus().then(function(data) { 
			checkoutState.sessionState = data;
			resolve(data);
			checkoutContainer.trigger(CHECKOUTSESSIONCHANGE);
		}).catch(function(error) {
			reject(error);
		});
	});
}

/**
 * Add a users contact_id to the session
 * @param {String} email
 * @param {String} password
 * public
 **/
function handleUserLogin(email, password) {
	checkoutContainer.addClass('loading-ajax');
	authenticateUser(email, password)
		.then(function(data) {
			checkoutState.user = data;
			checkoutContainer.trigger(LOGGEDIN_EVENT);
			checkoutContainer.trigger(USERDATAFETCHED_EVENT);
			checkoutContainer.removeClass('loading-ajax');
		})
		.catch(function(error) {
			checkoutContainer.removeClass('loading-ajax');
		});
}

/**
 * prefill the form fields with the fetched data
 * @param {String} email
 * @param {String} password
 * public
 **/
function handleRefillNewUserFields() {
	var hasBillingAddress = checkoutState.addresses && checkoutState.addresses.billing && checkoutState.addresses.billing.active && checkoutState.addresses.billing.active.id;
	var hasShippingAddress = checkoutState.addresses && checkoutState.addresses.shipping && checkoutState.addresses.shipping.active && checkoutState.addresses.shipping.active.id;
	
	if (hasBillingAddress) {
    	refillFullAddress('billing', checkoutState.addresses.billing.active);
	}
	if (hasShippingAddress) {
	    refillFullAddress('shipping', checkoutState.addresses.shipping.active);
	}
	
	if (!hasShippingAddress && hasBillingAddress) {
	    refillFullAddress('shipping', checkoutState.addresses.billing.active);
	}
	

	if (hasBillingAddress && hasShippingAddress) {
    	if (checkoutState.addresses.billing.active.id === checkoutState.addresses.shipping.active.id) {
    	    $('#shipping-same-as-billing').prop('checked', false).change();
    	} else {
    	    $('#shipping-same-as-billing').prop('checked', true).change();
    	}
	}
	
	refillContact(checkoutState.user);
	refillPhonenumber(checkoutState.phonenumber);
	refillOrganisation(checkoutState.organisation.active);
}

function refillFullAddress(type, address) {
    if (address) {
        checkoutState.addresses[type].active = address;
        
        if (address.given_name) {
            $('#' + type + '-given-name').val(address.given_name);
            // $('#' + type + '-given-name').change();
        }
        if (address.additional_name) {
            $('#' + type + '-additional-name').val(address.additional_name);
            // $('#' + type + '-additional-name').change();
        }
        if (address.family_name) {
            $('#' + type + '-family-name').val(address.family_name);
            // $('#' + type + '-family-name').change();
        }
        if (address.country_code) {
            $('#' + type + '-country-code').val(address.country_code);
            // $('#' + type + '-country-code').change();
        }
        if (address.postal_code) {
            $('#' + type + '-postal-code').val(address.postal_code);
            // $('#' + type + '-postal-code').change();
        }
        if (address.premise_number) {
            $('#' + type + '-premise-number').val(address.premise_number);
            // $('#' + type + '-premise-number').change();
        }
        if (address.premise_number_suffix) {
            $('#' + type + '-premise-number-suffix').val(address.premise_number_suffix);
            // $('#' + type + '-premise-number-suffix').change();
        }
        if (address.thoroughfare) {
            $('#' + type + '-thoroughfare').val(address.thoroughfare);
            // $('#' + type + '-thoroughfare').change();
        }
        if (address.locality) {
            $('#' + type + '-locality').val(address.locality);
            // $('#' + type + '-locality').change();
        }
        
        if (type === 'shipping') {
            checkoutContainer.trigger(SHIPPINGCOUNTRYCHANGED_EVENT);
        }
    }
}

function refillContact(contact) {
    $('#account-email').val(contact.email);
    $('#account-given-name').val(contact.given_name);
	$('#account-additional-name').val(contact.additional_name);
	$('#account-family-name').val(contact.family_name);
}

function refillPhonenumber(phonenumber) {
    if (phonenumber && phonenumber.number) {
        $('#contact-phonenumber-country').val(phonenumber.country_code);
        $('#contact-phonenumber').val(phonenumber.number);
    }
}

function refillOrganisation(organisation) {
    if (organisation && organisation.name) {
        $('#organisation-name').val(organisation.name);
        $('#organisation-coc-number').val(organisation.coc_number);
    }
    
    if (organisation && organisation.registrations && organisation.registrations.length > 0) {
        $('#organisation-country-code').val(organisation.registrations[0].country_code);
        $('#organisation-vat-number').val(organisation.registrations[0].number);
    }
}

/**
 * Add a users contact_id to the session
 * @param {String} email
 * @param {String} password
 * public
 **/
function handleFetchUserData() {
	fetchBillingContactInformation()
		.then(function(data) {
			checkoutState.user = data;
			checkoutContainer.trigger(USERDATAFETCHED_EVENT);
		});
}

/**
 * remove a users contact_id from the session
 * public
 **/
function handleUserLogout() {
	removeShippingContact().then(function() {
		removeBillingContact().then(function() {
			updateCheckoutSession().then(function() {
				// setTimeout(function() {
				checkoutState.loggedIn = false;
					checkoutContainer.trigger(LOGGEDOUT_EVENT);
				// }, 1000);
			});
		});
	});
}

/**
 * Check if a user exists with given email and togle the option to login
 * @param {String} email
 * public
 **/
function handleCheckIdentity() {
	var field = $(this);
	var email = field.val();
	var extraFields = $('#login-extra-fields');
	
// 	if (!checkoutState.loggedIn) {
		// extraFields.addClass('hidden');
		
		if (field.parsley(parsleySettings).isValid()) {
			clearTimeout(indentifyTimeout);
			indentifyTimeout = setTimeout(function() {
				identifyUser(email).then(function(data) {
					extraFields.removeClass('hidden');
				}).catch(function() {
					extraFields.addClass('hidden');
				});
			}, 500);
		}
// 	}
}

/**
 * Fetch the linked contacts adresses
 * @param {String} useOrganisationAsActive
 * public
 **/
function fetchAddresses(useOrganisationAsActive, validateStep) {
	return fetchBillingAddresses()
		.then(function(data) {
			checkoutState.addresses.billing = data;
			
			if (validateStep) {
				isStepValid('1');
			}
			
			if ((!data.active || useOrganisationAsActive) && data.options.organisation.primary && data.options.organisation.primary !== null) {
				selectAddress(data.options.organisation.primary.id, 'billing');
				console.log('contact');
			} else if ((!data.active || useOrganisationAsActive) && data.options.contact.primary !== null) {
				console.log('org');
				selectAddress(data.options.contact.primary.id, 'billing');
			} else {
				console.log('session');
			}
			
			checkoutContainer.trigger(BILLINGADDRESSESCHANGE_EVENT);
		}).then(function() {
			return fetchShippingAddresses();
		}).then(function(data) {
			checkoutState.addresses.shipping = data;
			
			if (validateStep) {
				isStepValid('2');
			}
			
			if ((!data.active || useOrganisationAsActive) && data.options.organisation.primary && data.options.organisation.primary !== null) {
				selectAddress(data.options.organisation.primary.id, 'shipping');
			} else if ((!data.active || useOrganisationAsActive) && data.options.contact.primary !== null) {
				selectAddress(data.options.contact.primary.id, 'shipping');
			}
			
			checkoutContainer.trigger(SHIPPINGADDRESSESCHANGE_EVENT);
		});
	
}


/**
 * Render the given address in the given container
 * @param {Object} container
 * @param {Object} address
 * public
 **/
function renderActiveAddress(container, address) {
	var addressHTML = '';
	
	if(address !== null) {
		addressHTML += '<div class="d-flex flex-column panel panel-default panel-body">';
			addressHTML += address.organisation && address.organisation !== '' ? '<span>' + address.organisation + '</span>' : '';
			addressHTML += '<span>' + address.given_name + ' ' + (address.additional_name && address.additional_name !== '' ? address.additional_name + ' ' : '') + address.family_name + '</span>';
			addressHTML += '<span>' + address.thoroughfare + ' ' + address.premise_number + (address.premise_number_suffix ? address.premise_number_suffix : '') + '</span>';
			addressHTML += '<span>' + address.postal_code + ' ' + address.locality + ', ' + address.country_code + '</span>';
			if (address.administrative_area) {
				addressHTML += '<span>' + address.administrative_area + '</span>';
			}
		addressHTML += '</div>';
	}
	
	$(container).html(addressHTML);
}

/**
 * Render the given addresses in the given container for the given type
 * @param {Object} container
 * @param {Object} address
 * @param {String} type
 * public
 **/
function renderAddressOptions(container, addresses, type) {
	var optionsHTML = '';
	var activeAddress = addresses.active || {};
	var activeAddressId = activeAddress.id;
	var contactAddresses = addresses.options.contact;
	var organisationAddresses = addresses.options.organisation;
	var sessionAddresses = addresses.options.session;
	
	if (addresses.active !== null) {
		renderActiveAddress('.address-container[data-address-type="' + type + '"] .active-address', activeAddress);
		renderActiveAddress('#summary-active-' + type + '-address', checkoutState.addresses[type].active);
	}
	
	optionsHTML += getAddressOptionsHTML(contactAddresses.primary, contactAddresses.secondary, activeAddressId, type);
	optionsHTML += getAddressOptionsHTML(sessionAddresses.primary, sessionAddresses.secondary, activeAddressId, type);
	
	if (organisationAddresses && (organisationAddresses.primary || organisationAddresses.secondary.length > 0)) {
		optionsHTML += '<small class="d-block mt-30 mb-10">Organisatie adressen</small>';
		optionsHTML += getAddressOptionsHTML(organisationAddresses.primary, organisationAddresses.secondary, activeAddressId, type);
	}
	
	$(container).html(optionsHTML);
}

function renderPhonenumberOptions(container, phonenumbers) {
	var optionsHTML = '';
	var activePhonenumber = phonenumbers.active || {};
	var activePhonenumberId = activePhonenumber.id;
	var contactPhonenumbers = phonenumbers.options.contact;
	var organisationPhonenumbers = phonenumbers.options.organisation;
	var sessionPhonenumbers = phonenumbers.options.session;
	
	optionsHTML += getPhonenumbersOptionsHTML(contactPhonenumbers.primary, contactPhonenumbers.secondary, activePhonenumberId);
	optionsHTML += getPhonenumbersOptionsHTML(sessionPhonenumbers.primary, sessionPhonenumbers.secondary, activePhonenumberId);
	
	if (organisationPhonenumbers && (organisationPhonenumbers.primary || (organisationPhonenumbers.secondary && organisationPhonenumbers.secondary.length > 0))) {
		optionsHTML += '<small class="d-block mt-30 mb-10">Organisatie adressen</small>';
		optionsHTML += getPhonenumbersOptionsHTML(organisationPhonenumbers.primary, organisationPhonenumbe.secondary, activePhonenumberId);
	}
	
	$(container).html(optionsHTML);
}

function getPhonenumbersOptionsHTML(primary, secondary, activePhonenumberId) {
	var optionsHTML = '';
	
	if (primary) {
		optionsHTML += '<div'; 
			optionsHTML += ' class="d-flex flex-column panel panel-default panel-radio panel-body mb-10';
			if (activePhonenumberId && activePhonenumberId === primary.id) {
				optionsHTML += ' active';
			}
			optionsHTML += '"';
			optionsHTML += ' data-phonenumber-id="' + primary.id + '"';
			optionsHTML += ' data-action="select-phonenumber"';
		optionsHTML +='>';
			optionsHTML += '<span>' + primary.number + '</span>';
			optionsHTML += '<span class="text-success">Standaard telefoonnummer</span>';
		optionsHTML += '</div>';
	}
	if (secondary) {
		$.each(secondary, function(idx, phonenumber) {
			optionsHTML += '<div'; 
				optionsHTML += ' class="d-flex flex-column panel panel-default panel-radio panel-body mb-10';
				if (activePhonenumberId && activePhonenumberId === phonenumber.id) {
					optionsHTML += ' active';
				}
				optionsHTML += '"';
				optionsHTML += ' data-phonenumber-id="' + phonenumber.id + '"';
				optionsHTML += ' data-action="select-phonenumber"';
			optionsHTML +='>';
				optionsHTML += '<span>' + phonenumber.number + '</span>';
			optionsHTML += '</div>';
		})
	}
	
	return optionsHTML;
}


/**
 * Render the given addresses in the given container for the given type
 * @param {Object} primary
 * @param {Array} secondary
 * @param {String} activeAddressId
 * @param {String} type
 * public
 **/
function getAddressOptionsHTML(primary, secondary, activeAddressId, type) {
	var optionsHTML = '';
	
	if (primary) {
		optionsHTML += '<div'; 
			optionsHTML += ' class="d-flex flex-column panel panel-default panel-radio panel-body mb-10';
			if (activeAddressId && activeAddressId === primary.id) {
				optionsHTML += ' active';
			}
			optionsHTML += '"';
			optionsHTML += ' data-address-id="' + primary.id + '"';
			optionsHTML += ' data-action="select-address"';
			optionsHTML += ' data-address-type="' + type + '"';
		optionsHTML +='>';
			optionsHTML += '<span>' + primary.organisation + '</span>';
			optionsHTML += '<span>' + primary.given_name + ' ' + (primary.additional_name !== '' ? primary.additional_name + ' ' : '') + primary.family_name + '</span>';
			optionsHTML += '<span>' + primary.thoroughfare + ' ' + primary.premise_number + (primary.premise_number_suffix ? primary.premise_number_suffix : '') + '</span>';
			optionsHTML += '<span>' + primary.postal_code + ' ' + primary.locality + ', ' + primary.country_code + '</span>';
			if (primary.administrative_area) {
				optionsHTML += '<span>' + primary.administrative_area + '</span>';
			}
			optionsHTML += '<span class="text-success">Standaard adres</span>';
		optionsHTML += '</div>';
	}
	if (secondary) {
		$.each(secondary, function(idx, address) {
			optionsHTML += '<div'; 
				optionsHTML += ' class="d-flex flex-column panel panel-default panel-radio panel-body mb-10';
				if (activeAddressId && activeAddressId === address.id) {
					optionsHTML += ' active';
				}
				optionsHTML += '"';
				optionsHTML += ' data-address-id="' + address.id + '"';
				optionsHTML += ' data-action="select-address"';
				optionsHTML += ' data-address-type="' + type + '"';
			optionsHTML +='>';
				optionsHTML += '<span>' + address.organisation + '</span>';
				optionsHTML += '<span>' + address.given_name + ' ' + (address.additional_name !== '' ? address.additional_name + ' ' : '') + address.family_name + '</span>';
				optionsHTML += '<span>' + address.thoroughfare + ' ' + address.premise_number + (address.premise_number_suffix ? address.premise_number_suffix : '') + '</span>';
				optionsHTML += '<span>' + address.postal_code + ' ' + address.locality + ', ' + address.country_code + '</span>';
				if (address.administrative_area) {
					optionsHTML += '<span>' + address.administrative_area + '</span>';
				}
			optionsHTML += '</div>';
		})
	}
	
	return optionsHTML;
}

/**
 * Set the given addres id into the checkout sessoin for the given type
 * @param {String} id
 * @param {String} type
 * @param {Function} callback
 * public
 **/
function selectAddress(id, type, callback, options, validateStep) {
	if (type === 'billing') {
		setBillingAddress(id, options).then(function(data) {
			if(callback) {
				callback();
			}
			fetchAddresses(false, true);
			return data;
		});
	}
	
	if (type === 'shipping') {
		setShippingAddress(id, options).then(function(data) {
			if(callback) {
				callback();
			}
			fetchAddresses(false, true);
			return data;
		});
	}
}

/**
 * Toggle the address input manner
 * @param {String} option
 * public
 **/
function toggleAddressInput(option) {
	if(option === 'existing-user') {
		$('.address-container .address-form').addClass('hidden');
		$('.address-container .active-address').removeClass('hidden');
		$('.address-container .show-addresses').removeClass('hidden');
	}
	if(option === 'new-user') {
		$('.address-container .address-form').removeClass('hidden');
		$('.address-container .active-address').addClass('hidden');
		$('.address-container .show-addresses').addClass('hidden');
	}
}

function toggleNewPhonenumberForm(container, newState) {
	if (newState === 'visible') {
		$(container).find('.phonenumber-options-container').addClass('hidden');
		$(container).find('.new-phonenumber-container').removeClass('hidden');
	}
	if (newState === 'hidden') {
		$(container).find('.phonenumber-options-container').removeClass('hidden');
		$(container).find('.new-phonenumber-container').addClass('hidden');
		$(container).find('.new-phonenumber-container').trigger('reset');
		$(container).find('.new-phonenumber-container').parsley().reset();
	}
}


/**
 * Toggle the new address form inside the given container to the given newState
 * @param {Object} container
 * @param {String} newState
 * public
 **/
function toggleNewAddressForm(container, newState) {
	if (newState === 'visible') {
		$(container).find('.address-options-container').addClass('hidden');
		$(container).find('.new-address-container').removeClass('hidden');
	}
	if (newState === 'hidden') {
		$(container).find('.address-options-container').removeClass('hidden');
		$(container).find('.new-address-container').addClass('hidden');
		$(container).find('.new-address-container').trigger('reset');
		$(container).find('.new-address-container').parsley().reset();
	}
}

function hasAddressOptions(addresses) {
	var hasAddresses = false;
	
	if (addresses && addresses.primary) {
		hasAddresses = true;
	}
	if (addresses && addresses.secondary && addresses.secondary.length > 0) {
		hasAddresses = true;
	}
	
	return hasAddresses;
}

/**
 * Create a new address and add it to the checkoutState
 * @param {Object} event
 * public
 **/
function handleCreateAddress(event) {
	var form = $(this);
	var address_type = form.data('address-type');
	var formData = serializeObject(form);
	var options = undefined;
	
	formData.premise_number = Number(formData.premise_number);
	formData.address_line_1 = formData.thoroughfare + ' ' + formData.premise_number + (formData.premiseNumber !== '' ? ' ' + formData.premise_number_suffix : '');
	
// 	if (formData.save_address === "on") {
		if (formData.save_address_as === 'contact') {
			options = { contact: {}};
			
			if (formData.save_address_as_primary === "on") {
				options.contact = { primary: true};
			} else {
				options.contact = { secondary: true};
			}
		} else if (formData.save_address_as === 'organisation') {
			options = { organisation: {}};
			
			if (formData.save_address_as_primary === "on") {
				options.organisation = { primary: true};
			} else {
				options.organisation = { secondary: true};
			}
		}
// 	}
	
	createAddress(formData).then(function(data) {
		selectAddress(data.id, address_type, function() {
			$('#' + address_type + '-addresses').modal('hide');
			toggleNewAddressForm(form.closest('.modal-content'), 'hidden');
			
			if (address_type === 'billing' && !hasAddressOptions(checkoutState.addresses.shipping)) {
				selectAddress(data.id, 'shipping', undefined, options);
			}
			
		}, options);
	});
	
	event.preventDefault();
}


/**
 * Serialize data from the given form into an object
 * @param {Object} form
 * public
 **/
function serializeObject(form){
	var unindexed_array = form.serializeArray();
	var indexed_array = {};

	$.map(unindexed_array, function(n, i){
		indexed_array[n['name']] = n['value'];
	});

	return indexed_array;
}

/**
 * Fetch the available shipping methods and save them in checkoutState
 * public
 **/
function handleFetchShippingMethods() {
	fetchAvailableShippingMethods((checkoutState.addresses.shipping.active && checkoutState.addresses.shipping.active.country_code) || '').then(function(data) {
		checkoutState.shippingMethods = data;
		
		checkoutContainer.trigger(SHIPPINGMETHODSLOADED_EVENT);
	}).catch(function(error) {
		console.log(error);
	})
}

/**
 * Render available shipping methods into the given container
 * @param {String} container
 * @param {Array} methods
 * public
 **/
function renderShippingMethods(container, methods, excludedMethods) {
	var shippingMethodsHTML = '';
	var activeShippingMethod = methods.active && methods.active.method_id;
	var activeMethod = null;
	
	checkoutState.hasShippingMethod = !!activeShippingMethod;
	checkoutContainer.trigger(CHECKOUTSTATECHANGED_EVENT);
	
	$.each(methods.options, function(idx, method) {
		if (isInArray(method.id, excludedMethods)) {
			return;
		}
		
		if (activeShippingMethod === method.id) {
			activeMethod = method;
		}
		
		var methodHTML = '';

		methodHTML += '<div class="panel panel-default panel-radio mb-10' + (activeShippingMethod === method.id ? ' active' : '') + '">';
			methodHTML += '<button';
				methodHTML += ' type="button"';
				methodHTML += ' class="panel-body panel-radio-label d-flex align-items-center"';
				methodHTML += ' data-action="select-shipping-method"';
				methodHTML += ' data-carrier="' + method.carrier + '"';
				methodHTML += ' data-id="' + method.id + '"';
				methodHTML += ' data-is-carrier-location="' + method.is_carrier_location + '"';
			methodHTML += '>';
				var carrierLogo = getCarrierBadge(method.carrier);
				
				if (carrierLogo !== null) {
					methodHTML += '<img class="icon-w-40 mr-20 method-icon" src="' + carrierLogo + '" />';
				}
				
				methodHTML += method.name;
				// methodHTML += '<small class="ml-auto text-light">';
				// 	methodHTML += intToPrice(method.price / 100);
				// methodHTML += '</small>';
			methodHTML += '</button>';
			if (method.is_carrier_location) {
				methodHTML += '<div class="shipping-method-extra" data-method-id="' + method.id + '" data-carrier="' + method.carrier + '">';
					methodHTML += '<div class="collapse shipping-method-extra-container' + (activeShippingMethod === method.id ? ' in' : '') + '">';
					methodHTML += '</div>';
				methodHTML += '</div>';
			}
		methodHTML += '</div>';

		shippingMethodsHTML += methodHTML;
	});

	$(container).html(shippingMethodsHTML);
	
	if (activeMethod) {
		var activeMethodHTML = '';
		
		activeMethodHTML += '<div class="panel panel-default mt-5 mb-10">';
			activeMethodHTML += '<div class="panel-body">';
				activeMethodHTML += '<div class="d-flex flex-column">';
					activeMethodHTML += '<div class="d-flex align-items-center">';
						var carrierLogo = getCarrierBadge(activeMethod.carrier);
						if (carrierLogo !== null) {
							activeMethodHTML += '<img class="icon-w-40 mr-20 method-icon" src="' + carrierLogo + '" />';
						}
						activeMethodHTML += activeMethod.name;
				// 		activeMethodHTML += '<small class="ml-auto text-light">';
				// 			activeMethodHTML += intToPrice(activeMethod.price / 100);
				// 		activeMethodHTML += '</small>';
					activeMethodHTML += '</div>';
					activeMethodHTML += '<div class="split-shipments-allowed-display text-light mt-10' + (methods.active && methods.active.is_split_allowed ? '': ' hidden') + '">';
						activeMethodHTML += '<small>';
							activeMethodHTML += $('.summary-shipping-method').data('split-allowed-message');
						activeMethodHTML += '</small>';
					activeMethodHTML += '</div>';
				activeMethodHTML += '</div>';
			activeMethodHTML += '</div>';
		activeMethodHTML += '</div>';
		
		$('.summary-shipping-method').html(activeMethodHTML);
	}
	
	handleRenderShippingMethodPickUpPoints();
	
	if (checkoutState.enableSplitShipmentOption) {
		renderSplitShipmentOption('.split-shipment-option-container');
	}
}

/**
 * Set the selected shipping method for the session
 * public
 **/
function handleSelectShippingMethod() {
	var trigger = $(this);
	var triggerButton = trigger.find('button');
	var carrier = trigger.data('carrier');
	var id = trigger.data('id');
	var issuer = '';
	
	var postData = {
		is_split_allowed: checkoutState.shippingMethods.active && checkoutState.shippingMethods.active.is_split_allowed,
		method_id: id,
	}
	
	triggerButton.attr('disabled', true);
	
	if (checkoutState && checkoutState.shippingMethods && (checkoutState.shippingMethods.active && JSON.stringify(checkoutState.shippingMethods.active) !== JSON.stringify(postData)) || !checkoutState.shippingMethods.active) {
    	selectShippingMethod(postData).then(function(data) {
    		checkoutState.hasShippingMethod = true;
    		var parentPanel = trigger.closest('.panel');
    		$('.shipping-method-extra .collapse').collapse('hide');
    		delete data['xhr'];
    		checkoutState.shippingMethods.active = data;
    		
    		var activeMethodHTML = '';
    		
    		activeMethodHTML += '<div class="panel panel-default mt-5 mb-10">';
    			activeMethodHTML += '<div class="panel-body">';
    				activeMethodHTML += '<div class="d-flex flex-column">';
    					activeMethodHTML += '<div class="d-flex align-items-center">';
    						activeMethodHTML += trigger.html();
    					activeMethodHTML += '</div>';
    					activeMethodHTML += '<div class="split-shipments-allowed-display text-light mt-10' + (!postData.is_split_allowed ? ' hidden' : '') + '">';
    						activeMethodHTML += '<small>';
    							activeMethodHTML += $('.summary-shipping-method').data('split-allowed-message');
    						activeMethodHTML += '</small>';
    					activeMethodHTML += '</div>';
    				activeMethodHTML += '</div>';
    			activeMethodHTML += '</div>';
    		activeMethodHTML += '</div>';
    		
    		$('.summary-shipping-method').html(activeMethodHTML);
    		
    		checkoutContainer.trigger(SHIPPINGMETHODSELECTED_EVENT);
    // 		fetchAvailableShippingMethods((checkoutState.addresses.shipping.active && checkoutState.addresses.shipping.active.country_code) || '').then(function(data) {
    // 			checkoutState.shippingMethods = data;
    // 		}).catch(function(error) {
    // 			console.log(error);
    // 		})
    		
    		parentPanel.find('.shipping-method-extra .collapse').collapse('show');
    		parentPanel.siblings().removeClass('active');
    		parentPanel.addClass('active');
    		$('[data-action="select-shipping-method-servicepoint"]').removeClass('active');
    		
    		isStepValid('2');
    	}).finally(function() {
    	    triggerButton.attr('disabled', false);
    	});
	}
}

/**
 * Set the selected servicepoint of the shipping method for the session
 * public
 **/
function handleSelectShippingServicePoint() {
	var trigger = $(this);
	var pointID = trigger.data('servicepoint');
	
	selectShippingMethodServicePoint({ spid: pointID.toString(), country_code: checkoutState.addresses.shipping.active.country_code }).then(function(data) {
		trigger.siblings().removeClass('active');
		trigger.addClass('active');
	});
}

/**
 * Render available shipping method windows into the given container
 * @param {String} container
 * @param {Array} data
 * public
 **/
function renderShippingMethodWindows(container, data) {
	fetchAvailableShippingMethodWindows(data).then(function(data) {
	}).catch(function(error) {
		console.log(error);
	})
}

/**
 * Render available shipping method pickup points into the given container
 * @param {String} container
 * @param {Array} data
 * public
 **/
function renderShippingMethodPickupPoints(method_id, country_code, zipcode, container) {
	$(container).addClass('loading-ajax position-relative');
	
	fetchAvailablePickupPoints(method_id, country_code, zipcode).then(function(data) {
		var pickupPointsHTML = '';
		if (data.options.length > 0) {
				pickupPointsHTML += '<div class="panel-body pt-0 pl-40">';
					$.each(data.options, function(idx, servicepoint) {
						pickupPointsHTML += '<div class="panel panel-default panel-radio mb-5"';
							pickupPointsHTML += ' data-action="select-shipping-method-servicepoint"';
							pickupPointsHTML += ' data-method="' + method_id + '"';
							pickupPointsHTML += ' data-servicepoint="' + servicepoint.point.id + '"';
						pickupPointsHTML += '>';
							pickupPointsHTML += '<div class="panel-body panel-radio-label py-8">';
								pickupPointsHTML += '<div>';
									pickupPointsHTML += servicepoint.point.name;
								pickupPointsHTML += '</div>';
								pickupPointsHTML += '<small class="text-muted">';
									pickupPointsHTML += servicepoint.point.address.address_line_1 + ', ' + servicepoint.point.address.postal_code + '  ' + servicepoint.point.address.locality;
								pickupPointsHTML += '</small>';
							pickupPointsHTML += '</div>';
						pickupPointsHTML += '</div>';
					});
				pickupPointsHTML += '</div>';
			pickupPointsHTML += '</div>';
		}
		
		$(container).html(pickupPointsHTML);
	}).catch(function(error) {
		console.log(error);
		return '';
	}).finally(function() {
	  $(container).removeClass('loading-ajax position-relative');  
	})
}

function handleRenderShippingMethodPickUpPoints() {
	if (checkoutState.addresses.shipping.active !== null && checkoutState.addresses.shipping.active.country_code && checkoutState.addresses.shipping.active.postal_code) {
		$.each($('.shipping-method-extra'), function(idx, container) {
			var method_id = $(container).data('method-id');
			renderShippingMethodPickupPoints(method_id, checkoutState.addresses.shipping.active.country_code, checkoutState.addresses.shipping.active.postal_code, '.shipping-method-extra[data-method-id="' + method_id + '"] .collapse')
		});
	}
}

function renderSplitShipmentOption(container) {
	var containerEl = $(container);
	var label = containerEl.data('option-label');
	var optionHTML = '';
	
	optionHTML += '<hr />';
	optionHTML += '<div class="checkbox af">';
		optionHTML += '<label for="split-shipment-option">';
			optionHTML += '<input type="checkbox" id="split-shipment-option" data-action="toggle-split-shipment"' + (( checkoutState.shippingMethods.active && checkoutState.shippingMethods.active.is_split_allowed || false ) && "checked") + ' />';
			optionHTML += '<div class="checkbox-button"></div>';
			optionHTML += label;
		optionHTML += '</label>';
	optionHTML += '</div>';
	
	containerEl.html(optionHTML);
}

function handleToggleSplitShipmentOption() {
	var el = $(this);
	
	var postData = {
		is_split_allowed: el.is(':checked'),
		method_id: checkoutState.shippingMethods.active.method_id,
	};
	
	selectShippingMethod(postData).then(function(data) {
		if (postData.is_split_allowed) {
			$('.summary-shipping-method .split-shipments-allowed-display').removeClass('hidden');
		} else {
			$('.summary-shipping-method .split-shipments-allowed-display').addClass('hidden');
		}
		
		fetchAvailableShippingMethods((checkoutState.addresses.shipping.active && checkoutState.addresses.shipping.active.country_code) || '').then(function(data) {
			checkoutState.shippingMethods = data;
		}).catch(function(error) {
			console.log(error);
		});
	});
}

/**
 * Get the url to the carriers badge if we have it
 * @param {String} carrier
 **/
function getCarrierBadge(carrier) {
	switch (carrier) {
		case 'dhl':
			return 'https://content.afosto.io/5719193282412544/checkout/resources/icons/shipping-methods/DHL-badgeat4x.png';
			break;
		case 'postnl':
			return 'https://content.afosto.io/5719193282412544/checkout/resources/icons/shipping-methods/postnl-badgeat4x.png';
			break;
		case 'dpd':
			return 'https://content.afosto.io/5719193282412544/checkout/resources/icons/shipping-methods/dpd-badgeat4x.png';
			break;
		case 'bpost':
			return 'https://content.afosto.io/5719193282412544/checkout/resources/icons/shipping-methods/bpost-badgeat4x.png';
			break;
// 		case 'sendcloud':
// 			return 'https://content.afosto.io/5719193282412544/checkout/resources/icons/shipping-methods/sendcloud-badgeat4x.png';
// 			break;
		default:
			return null;
	}
}

/**
 * Fetch the available payment methods and save them in checkoutState
 * public
 **/
function handleFetchPaymentMethods(disableEvent) {
	fetchPaymentMethods().then(function(data) {
		checkoutState.paymentMethods = data;
		
		if (!disableEvent) {
    		checkoutContainer.trigger(PAYMENTMETHODSLOADED_EVENT);
		}
	}).catch(function(error) {
		console.log(error);
	})
}

/**
 * Render available payment methods for the given providers into the given container
 * @param {String} container
 * @param {Array} providers
 * public
 **/
function renderPaymentMethods(container, methods) {
	var paymentMethodsHTML = '';
	var activeMethod = null;
	var language = $('html').attr('lang');
	
	checkoutState.hasPaymentMethod = !!(methods.active && methods.active.method_id);
	checkoutContainer.trigger(CHECKOUTSTATECHANGED_EVENT);
	
	$.each(methods.options, function(idx, method) {
		if (methods.active && method.id === methods.active.method_id) {
			activeMethod = method;
		}
		
		var methodHTML = '';
		
		methodHTML += '<div class="panel panel-default panel-radio mb-10' + (methods.active && method.id === methods.active.method_id ? ' active' : '') + '">';
			methodHTML += '<button type="button" class="panel-body panel-radio-label"';
    			methodHTML += ' data-action="select-payment-method"';
    			methodHTML += ' data-method="' + method.id + '"';
			methodHTML += '>';
			    methodHTML += '<div class="d-flex align-items-center text-gray-900">';
			
    				if (Number.isNaN(Number(method.id)) && !['on_account', 'cod', 'bank_transfer'].includes(method.id)) {
    					methodHTML += '<img class="icon-w-40 mr-20 method-icon" src="https://mollie.com/external/icons/payment-methods/' + method.id.toLowerCase() + '.svg" />';
    				}
    				
    				if (!Number.isNaN(Number(method.id)) && !['on_account', 'cod', 'bank_transfer'].includes(method.id)) {
    					methodHTML += '<img class="icon-w-40 mr-20 method-icon" src="https://static.pay.nl/payment_profiles/50x32/' + method.id.toLowerCase() + '.png" />';
    				}
    				
    				if (method.id === 'on_account') {
    					methodHTML += '<svg viewBox="0 0 88 68" class="icon-w-40 mr-20 method-icon" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 .5h64C82.4.5 87.5 5.6 87.5 12v44c0 6.4-5.1 11.5-11.5 11.5H12C5.6 67.5.5 62.4.5 56V12C.5 5.6 5.6.5 12 .5z" fill="#fff" stroke="#E5E5E5"/><path d="M57 42h3.3a1.3 1.3 0 001.2-1.3v-3.3a2.5 2.5 0 00-.7-1.7L42.7 17.6 37 23.2l18 18a2.5 2.5 0 001.8.8zM35.2 21.4l5.6-5.6-3.2-3.3a1.9 1.9 0 00-2.7 0l-3 3a1.9 1.9 0 000 2.6l3.3 3.3zm-5.7 23.7H31a.6.6 0 00.6-.6v-1.3c1.8 0 3.3-1.6 3.3-3.5 0-1.5-1-3-2.4-3.4l-3.5-1c-.5-.1-.7-.6-.7-1 0-.6.4-1 .9-1h2.2c.3 0 .7 0 1 .2l.4.1.4-.1.9-.9a.6.6 0 000-1c-.8-.5-1.6-.8-2.5-.8v-1.3a.6.6 0 00-.6-.6h-1.3a.6.6 0 00-.6.6v1.3a3.5 3.5 0 00-3.3 3.5c0 1.5 1 3 2.4 3.4l3.5 1c.5.1.7.6.7 1 0 .6-.4 1-.9 1h-2.2c-.3 0-.7 0-1-.2a.7.7 0 00-.4-.2l-.4.2-.9.9a.6.6 0 000 1c.8.5 1.6.8 2.5.8v1.3a.6.6 0 00.6.6zm9.4-9.4h7.1L42.4 32H39a1.3 1.3 0 00-1.3 1.2v1.3a1.3 1.3 0 001.3 1.2zm-1.3 5A1.3 1.3 0 0039 42h13.4l-3.8-3.8H39a1.3 1.3 0 00-1.3 1.3v1.2zM66.5 22H50.6l3.8 3.7h10.9v22.5H22.8V25.7H36l-.8-.7-1.7-1.8-1.2-1.2H21.5a2.5 2.5 0 00-2.5 2.5v25a2.5 2.5 0 002.5 2.5h45a2.5 2.5 0 002.5-2.5v-25a2.5 2.5 0 00-2.5-2.5z" fill="#444"/></svg>';
    				}
    			
    				if (method.id === 'bank_transfer') {
    					methodHTML += '<img class="icon-w-40 mr-20 method-icon" src="https://mollie.com/external/icons/payment-methods/banktransfer.svg" />';
    				}
    				
    				if (method.id === 'cod') {
    					methodHTML += '<svg class="icon-w-40 mr-20 method-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 88 68"><path fill="#fff" stroke="#E5E5E5" d="M12 .5h64C82.4.5 87.5 5.6 87.5 12v44c0 6.4-5.1 11.5-11.5 11.5H12C5.6 67.5.5 62.4.5 56V12C.5 5.6 5.6.5 12 .5z"/><path fill="#444" d="M75.8 39.6a6.4 6.4 0 00-4.2-1.7c-1.6 0-3 .6-4.2 1.5l-7.5 6-.8.2h-5c.5-1.1.7-2.5.5-3.9-.5-3.3-3.6-5.7-7-5.7H30c-2.5 0-5 .8-7 2.3l-4.6 3.5H9a1 1 0 00-1 1v1.8c0 .6.4 1 1 1h10.7l5.7-4.2c1.3-1 3-1.6 4.6-1.6H48c1.6 0 2.9 1.3 2.9 3 0 1.5-1.3 2.8-3 2.8H37.3c-1.1 0-2 .9-2 2 0 1 .9 1.9 2 1.9H59c1.1 0 2.3-.4 3.2-1.2l7.5-5.9c.5-.4 1.1-.6 1.8-.6.6 0 1.2.2 1.6.6 1.3 1.1 1.2 3 0 4L60.8 56c-1 .8-2 1.2-3.3 1.2H9a1 1 0 00-1 1V60c0 .6.4 1 1 1h48.6c2.1 0 4.1-.7 5.7-2l12.3-9.7a6.4 6.4 0 00.2-9.7zM51 8c-9.4 0-17 4.2-17 9.4v7.3c0 4.6 7.6 8.3 17 8.3s17-3.7 17-8.3v-7.3C68 12.2 60.4 8 51 8zM38.2 27.7c-1.3-1-2-2-2-3v-2.8l2 1.7v4.1zm5.4 2.3c-1.1-.3-2.2-.6-3.2-1.1v-4.2c1 .4 2 .8 3.2 1V30zm6.3.9c-1.4 0-2.8-.2-4.2-.4v-4.2c1.4.2 2.8.4 4.2.4v4.2zm6.4-.4l-4.2.4v-4.2a30 30 0 004.2-.4v4.2zm5.3-1.6c-1 .5-2 .8-3.2 1.1v-4.2l3.2-1.1v4.2zm4.3-4.2c0 1-.8 2-2.2 3v-4.1c.8-.5 1.5-1 2.2-1.7v2.8zm-14.9 0c-8.8 0-14.9-3.9-14.9-7.3 0-3.5 6.1-7.3 14.9-7.3s14.9 3.8 14.9 7.3c0 3.4-6.1 7.3-14.9 7.3z"/></svg>';
    				}
    				
    				if (method.id === 'on_account') {
    					methodHTML += $(container).data('on-account-label');
    				} else {
    					methodHTML += method.name;
    				}
			    methodHTML += '</div>';
			methodHTML += '</button>';
		  //  if (paymentMethodsTranslations && paymentMethodsTranslations[method.id]) {
			 //   methodHTML += '<div class="panel-body pl-80 ml-20 pt-0 mt-n10 text-gray-700 text-body-s">';
			 //       methodHTML += paymentMethodsTranslations[method.id][language].description;
			 //   methodHTML += '</div>';
		  //  }
			if (method.issuers.length > 0) {
				methodHTML += '<div class="collapse payment-method-issuers-container' + (methods.active && method.id === methods.active.method_id ? ' in' : '') + '" id="">';
					methodHTML += '<div class="panel-body pt-0 pl-40">';
						$.each(method.issuers, function(idx, issuer) {
							methodHTML += '<div class="panel panel-default panel-radio mb-5' + (methods.active && issuer.id === methods.active.issuer_id ? ' active' : '') + '"';
								methodHTML += ' data-action="select-payment-method-issuer"';
								methodHTML += ' data-method="' + method.id + '"';
								methodHTML += ' data-issuer="' + issuer.id + '"';
							methodHTML += '>';
								methodHTML += '<button type="button" class="panel-body panel-radio-label py-8">';
    								if (Number.isNaN(Number(method.id)) && method.id !== 'on_account') {
                                        methodHTML += '<img src="https://www.mollie.com/images/checkout/v2/' + method.name.toLowerCase() + '-issuer-icons/' + issuer.id.replace(method.name.toLowerCase() + "_", "") + '.png" class="icon-w-40 mr-20 method-icon"/>';
    								}
    				
    				                if (!Number.isNaN(Number(method.id)) && method.id !== 'on_account') {
                                        methodHTML += '<img src="https://static.pay.nl/ideal/banks/logo/' + issuer.id.toLowerCase() + '.png" class="icon-w-40 mr-20 method-icon"/>';
                                    }
									methodHTML += issuer.name;
								methodHTML += '</button>';
							methodHTML += '</div>';
						});
					methodHTML += '</div>';
				methodHTML += '</div>';
			}
		methodHTML += '</div>';
		
		paymentMethodsHTML += methodHTML;
	});
	
	$(container).html(paymentMethodsHTML);
	
	if (activeMethod) {
		var activeMethodHTML = '';
		
		activeMethodHTML += '<div class="panel panel-default mt-5 mb-10">';
			activeMethodHTML += '<div class="panel-body d-flex align-items-center">';
				if (Number.isNaN(Number(activeMethod.id)) && !['on_account', 'cod', 'bank_transfer'].includes(activeMethod.id)) {
					activeMethodHTML += '<img class="icon-w-40 my-n5 mr-20 method-icon" src="https://mollie.com/external/icons/payment-methods/' + activeMethod.id.toLowerCase() + '.svg" />';
				}
				
				if (!Number.isNaN(Number(activeMethod.id)) && !['on_account', 'cod', 'bank_transfer'].includes(activeMethod.id)) {
					activeMethodHTML += '<img class="icon-w-40 my-n5 mr-20 method-icon" src="https://static.pay.nl/payment_profiles/50x32/' + activeMethod.id.toLowerCase() + '.png" />';
				}
				
				if (activeMethod.id === 'on_account') {
					activeMethodHTML += '<svg viewBox="0 0 88 68" class="icon-w-40 my-n5 mr-20 method-icon" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 .5h64C82.4.5 87.5 5.6 87.5 12v44c0 6.4-5.1 11.5-11.5 11.5H12C5.6 67.5.5 62.4.5 56V12C.5 5.6 5.6.5 12 .5z" fill="#fff" stroke="#E5E5E5"/><path d="M57 42h3.3a1.3 1.3 0 001.2-1.3v-3.3a2.5 2.5 0 00-.7-1.7L42.7 17.6 37 23.2l18 18a2.5 2.5 0 001.8.8zM35.2 21.4l5.6-5.6-3.2-3.3a1.9 1.9 0 00-2.7 0l-3 3a1.9 1.9 0 000 2.6l3.3 3.3zm-5.7 23.7H31a.6.6 0 00.6-.6v-1.3c1.8 0 3.3-1.6 3.3-3.5 0-1.5-1-3-2.4-3.4l-3.5-1c-.5-.1-.7-.6-.7-1 0-.6.4-1 .9-1h2.2c.3 0 .7 0 1 .2l.4.1.4-.1.9-.9a.6.6 0 000-1c-.8-.5-1.6-.8-2.5-.8v-1.3a.6.6 0 00-.6-.6h-1.3a.6.6 0 00-.6.6v1.3a3.5 3.5 0 00-3.3 3.5c0 1.5 1 3 2.4 3.4l3.5 1c.5.1.7.6.7 1 0 .6-.4 1-.9 1h-2.2c-.3 0-.7 0-1-.2a.7.7 0 00-.4-.2l-.4.2-.9.9a.6.6 0 000 1c.8.5 1.6.8 2.5.8v1.3a.6.6 0 00.6.6zm9.4-9.4h7.1L42.4 32H39a1.3 1.3 0 00-1.3 1.2v1.3a1.3 1.3 0 001.3 1.2zm-1.3 5A1.3 1.3 0 0039 42h13.4l-3.8-3.8H39a1.3 1.3 0 00-1.3 1.3v1.2zM66.5 22H50.6l3.8 3.7h10.9v22.5H22.8V25.7H36l-.8-.7-1.7-1.8-1.2-1.2H21.5a2.5 2.5 0 00-2.5 2.5v25a2.5 2.5 0 002.5 2.5h45a2.5 2.5 0 002.5-2.5v-25a2.5 2.5 0 00-2.5-2.5z" fill="#444"/></svg>';
				}
				if (activeMethod.id === 'bank_transfer') {
					activeMethodHTML += '<img class="icon-w-40 my-n5 mr-20 method-icon" src="https://mollie.com/external/icons/payment-methods/banktransfer.svg" />';
				}
				
				if (activeMethod.id === 'cod') {
					activeMethodHTML += '<svg class="icon-w-40 my-n5 mr-20 method-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 88 68"><path fill="#fff" stroke="#E5E5E5" d="M12 .5h64C82.4.5 87.5 5.6 87.5 12v44c0 6.4-5.1 11.5-11.5 11.5H12C5.6 67.5.5 62.4.5 56V12C.5 5.6 5.6.5 12 .5z"/><path fill="#444" d="M75.8 39.6a6.4 6.4 0 00-4.2-1.7c-1.6 0-3 .6-4.2 1.5l-7.5 6-.8.2h-5c.5-1.1.7-2.5.5-3.9-.5-3.3-3.6-5.7-7-5.7H30c-2.5 0-5 .8-7 2.3l-4.6 3.5H9a1 1 0 00-1 1v1.8c0 .6.4 1 1 1h10.7l5.7-4.2c1.3-1 3-1.6 4.6-1.6H48c1.6 0 2.9 1.3 2.9 3 0 1.5-1.3 2.8-3 2.8H37.3c-1.1 0-2 .9-2 2 0 1 .9 1.9 2 1.9H59c1.1 0 2.3-.4 3.2-1.2l7.5-5.9c.5-.4 1.1-.6 1.8-.6.6 0 1.2.2 1.6.6 1.3 1.1 1.2 3 0 4L60.8 56c-1 .8-2 1.2-3.3 1.2H9a1 1 0 00-1 1V60c0 .6.4 1 1 1h48.6c2.1 0 4.1-.7 5.7-2l12.3-9.7a6.4 6.4 0 00.2-9.7zM51 8c-9.4 0-17 4.2-17 9.4v7.3c0 4.6 7.6 8.3 17 8.3s17-3.7 17-8.3v-7.3C68 12.2 60.4 8 51 8zM38.2 27.7c-1.3-1-2-2-2-3v-2.8l2 1.7v4.1zm5.4 2.3c-1.1-.3-2.2-.6-3.2-1.1v-4.2c1 .4 2 .8 3.2 1V30zm6.3.9c-1.4 0-2.8-.2-4.2-.4v-4.2c1.4.2 2.8.4 4.2.4v4.2zm6.4-.4l-4.2.4v-4.2a30 30 0 004.2-.4v4.2zm5.3-1.6c-1 .5-2 .8-3.2 1.1v-4.2l3.2-1.1v4.2zm4.3-4.2c0 1-.8 2-2.2 3v-4.1c.8-.5 1.5-1 2.2-1.7v2.8zm-14.9 0c-8.8 0-14.9-3.9-14.9-7.3 0-3.5 6.1-7.3 14.9-7.3s14.9 3.8 14.9 7.3c0 3.4-6.1 7.3-14.9 7.3z"/></svg>';
				}
				
				if (activeMethod.id === 'on_account') {
					activeMethodHTML += $(container).data('on-account-label');
				} else {
					activeMethodHTML += activeMethod.name;
				}

				if (checkoutState.paymentMethods.active && checkoutState.paymentMethods.active.issuer_id !== '') {
					var activeIssuer = activeMethod.issuers.filter(function(issuer) { return issuer.id === checkoutState.paymentMethods.active.issuer_id })[0];
					if (activeIssuer) {
						activeMethodHTML += '<small class="text-light">';
							activeMethodHTML += '&nbsp;(' + activeIssuer.name + ')';
						activeMethodHTML += '</small>';
					}
				}
			activeMethodHTML += '</div>';
		activeMethodHTML += '</div>';
		
		$('.summary-payment-method').html(activeMethodHTML);
	
	}
	if (checkoutState.addresses.shipping.active && checkoutState.addresses.shipping.active.country_code) {
		filterPaymentMethods(checkoutState.addresses.shipping.active.country_code);
	}
}

/**
 * filter payment methods by country iso
 * @param {String} countryCode
 * public
 **/
function filterPaymentMethods(countryCode) {
	var methods = $('[data-action="select-payment-method"]');
	var saveCountryCode = countryCode.toLowerCase().trim();
	
	if (checkoutState.excludedPaymentMethodsPerCountry[saveCountryCode]) {
		$.each(methods, function(idx, el) {
			var method = $(el);
			var method_id = method.data('method').toString();
			if (checkoutState.excludedPaymentMethodsPerCountry[saveCountryCode].indexOf(method_id) === -1) {
				method.closest('.panel-radio').removeClass('hidden');
			} else {
				method.closest('.panel-radio').addClass('hidden');
			}
		})
	} else {
		methods.closest('.panel-radio').removeClass('hidden');
	}
}

/**
 * Store the selected payment method to the session
 * public
 **/
function handleSelectPaymentMethod() {
	var trigger = $(this);
	var triggerButton = trigger.find('button');
	var method = trigger.data('method');
	
	var postData = {
		method_id: method.toString(),
		issuer_id: '',
	}
	
	triggerButton.attr('disabled', true);
	
	if (checkoutState && checkoutState.paymentMethods && (checkoutState.paymentMethods.active && JSON.stringify(checkoutState.paymentMethods.active) !== JSON.stringify(postData)) || !checkoutState.paymentMethods.active) {
    	selectPaymentMethod(postData).then(function(data) {
    		checkoutState.hasPaymentMethod = true;
    		checkoutContainer.trigger(CHECKOUTSTATECHANGED_EVENT);
    		delete data['xhr'];
    		checkoutState.paymentMethods.active = data;
    		
    		$('.payment-method-issuers-container [data-action="select-payment-method-issuer"]').removeClass('active');
    		
    		var activeMethodHTML = '';
    		
    		activeMethodHTML += '<div class="panel panel-default mt-5 mb-10">';
    			activeMethodHTML += '<div class="panel-body d-flex align-items-center">';
    				activeMethodHTML += trigger.html();
    			activeMethodHTML += '</div>';
    		activeMethodHTML += '</div>';
    		
    		$('.summary-payment-method').html(activeMethodHTML);
    		
    		var parentPanel = trigger.closest('.panel');
    		parentPanel.siblings().removeClass('active');
    		parentPanel.addClass('active');
    		$('.payment-method-issuers-container').collapse('hide');
    		
    		parentPanel.find('.collapse').collapse('show');
    		isStepValid('3');
    // 		handleFetchPaymentMethods(true);
    	}).finally(function() {
    	    $('[data-action="select-payment-method"] button').attr('disabled', false);
    	});
	}
}

/**
 * Store the selected payment method issuer to the session
 * public
 **/
function handleSelectPaymentMethodIssuer() {
	var trigger = $(this);
	var triggerButton = trigger.find('button');
	var method = trigger.data('method');
	var issuer = trigger.data('issuer');
	var activeMethodEl = $('.summary-payment-method .panel-body');
	var activeMethodHTML = $('.summary-payment-method .panel-body').html();
	
	var postData = {
		method_id: method.toString(),
		issuer_id: issuer.toString(),
	}
	
	triggerButton.attr('disabled', true);
	if (checkoutState && checkoutState.paymentMethods && (checkoutState.paymentMethods.active && JSON.stringify(checkoutState.paymentMethods.active) !== JSON.stringify(postData)) || !checkoutState.paymentMethods.active) {
    	selectPaymentMethod(postData).then(function(data) {
    	    delete data['xhr'];
    	    checkoutState.paymentMethods.active = data;
    		trigger.siblings().removeClass('active');
    		trigger.addClass('active');
    		var issuerRegex = /\(([^)]+)\)/;
    		
    		 activeMethodHTML.match(issuerRegex) && activeMethodHTML.match(issuerRegex).length > 0 ?
    			activeMethodEl.html(activeMethodHTML.replace(issuerRegex, '(' + trigger.text() + ')'))
    			:
    			activeMethodEl.append('&nbsp;<small class="text-light">(' + trigger.text() + ')</small>')
    			
    	   // handleFetchPaymentMethods(true);
    	}).finally(function() {
    	    $('[data-action="select-payment-method-issuer"] button').attr('disabled', false);
    	});
	}
}

/**
 * Show or hide the login form or the logged in user display
 * @param {String} displayType
 * public
 **/
function toggleUserDisplay(displayType) {
	if (displayType === 'created-display') {
		$('#created-display').removeClass('hidden');
		$('.address-save-options').addClass('hidden');
		$('#account-form').addClass('hidden');
		$('#user-display').addClass('hidden');
		$('.contact-extra-fields').addClass('hidden');
		
		return 'created-display';
	}
	
	if (displayType === 'loggedin-display') {
		$('#user-display').removeClass('hidden');
		$('.address-save-options').removeClass('hidden');
		$('#created-display').addClass('hidden');
		$('#account-form').addClass('hidden');
		$('.contact-extra-fields').addClass('hidden');
		
		return 'loggedin-display';
	}
	
	$('#user-display').addClass('hidden');
	$('.address-save-options').addClass('hidden');
	$('#created-display').addClass('hidden');
	$('#account-form').removeClass('hidden');
	$('.contact-extra-fields').removeClass('hidden');
	return 'loggedout-display';
}

/**
 * Fetch the projection of the session
 * public
 **/
function handleFetchProjection() {
	fetchProjection().then(function(data) {
		checkoutState.calculation_id = data.id;
		renderSummary(data);
	})
}

	/**
 * Fetch the calculation of the session
 * public
 **/
function handleFetchCalculation() {
	fetchCalculation().then(function(data) {
		checkoutState.calculation_id = data.id;
		renderSummary(data);
	})
}


function handleCreateGuestContact(formID) {
	var email = $(formID + ' [name="account_email"]').val();
	var firstName = $('.contact-extra-fields-container[data-linked-form="' + formID + '"] [name="account_given_name"]').val();
	var additionalName = $('.contact-extra-fields-container[data-linked-form="' + formID + '"] [name="account_additional_name"]').val();
	var lastName = $('.contact-extra-fields-container[data-linked-form="' + formID + '"] [name="account_family_name"]').val();
	
	console.log(email, firstName, additionalName, lastName);
	
	var body = {
		email: email,
	};
	
	if (firstName !== '') {
	    body.given_name = firstName;
	}
	
	if (additionalName !== '') {
	    body.additional_name = additionalName;
	}
	
	if (lastName !== '') {
	    body.family_name = lastName;
	}
	
// 	if (checkoutState.user.email !== email) {
    	return createContact(body).then(function(data) {
    	    checkoutState.user = data;
    	    toggleUserDisplay('created-display');
    	    $('#created-user-fullname').text(data.given_name + ' ' + (data.additional_name ? (data.additional_name + ' ') : '') + data.family_name);
    	    $('#created-user-email').text(data.email);
    	   // checkoutContainer.trigger(USERDATAFETCHED_EVENT);
    	});
// 	}
// 	return Promise.resolve();
}

function handleEditContact(e) {
    e.preventDefault();
    
    var formID = '#edit-account-form';
    
    $(formID + ' .modal-content').addClass('loading-ajax');
    
    handleCreateGuestContact(formID).then(function() {
        $(formID + ' .modal-content').removeClass('loading-ajax');
        $('#edit-contact').modal('hide');
    });
}

function handleCreateGuestPhonenumber() {
    var country_code = $('#contact-phonenumber-country').val();
	var number = $('#contact-phonenumber').val();
	
    $('#contact-phonenumber').data('is-bad-number', false);
	$('#contact-phonenumber').parsley(parsleySettings).validate();
	$('#contact-phonenumber').parsley().removeError('invalidPhoneNumber');
	
	if (number !== '' && (checkoutState.user && checkoutState.user.email !== '')) {
        return setPhonenumber(country_code, number).then(function() {
            handleFetchPhoneNumber();
        }).catch(function(error) {
            console.log('errors', error);
            if (error.responseJSON.message === 'Bad phone number or country code') {
                $('#contact-phonenumber').data('is-bad-number', true);
	            $('#contact-phonenumber').parsley(parsleySettings).validate();
            }
            return Promise.reject();
        });
	}
	
	return Promise.resolve();
}

function handleCreateGuestAddress(formId, type) {
	var form = $(formId);
	var formData = serializeObject(form);
	
	formData.premise_number = Number(formData.premise_number);
	formData.postal_code = formData.postal_code.toUpperCase();
	formData.address_line_1 = formData.thoroughfare + ' ' + formData.premise_number + (formData.premiseNumber !== '' ? ' ' + formData.premise_number_suffix : '');
	
	return createAddress(formData);
}

function toggleCollapseOnCheck() {
	var el = $(this);
	var target = $(el.data('target'));
	
	if (target.length > 0) {
		target.collapse(el.is(':checked') ? 'show' : 'hide');
	}
}

function toggleShippingMethodInfo() {
	// var selectedOption = checkoutState.sessionState.shipping.shipment;
	// $('.shipping-method-info').addClass('hidden');
}

function handleFetchPhoneNumber() {
	return fetchPhonenumber().then(function(data) {
	    if (data.active) {
	        checkoutState.phonenumber = data.active;
	        if (data.active.number) {
		        renderPhonenumberDisplay(data.active.number, $('.phonenumber-container .active-phonenumber'));
	        } else {
                renderPhonenumberDisplay('Geen nummer geselecteerd', $('.phonenumber-container .active-phonenumber'));
	        }
	    } else {
	        checkoutState.phonenumber = data;
	        if (data.number) {
		        renderPhonenumberDisplay(data.number, $('.phonenumber-container .active-phonenumber'));
	        } else {
                renderPhonenumberDisplay('Geen nummer geselecteerd', $('.phonenumber-container .active-phonenumber'));
	        }
	    }
	    
	    if (!data.active && data.options && data.options.contact && data.options.contact.primary !== null) {
	        selectPhonenumber({ "phone_number_id": data.options.contact.primary.id }).then(function() {
	            handleFetchPhoneNumber();
	        });
	    }
	    
	    renderPhonenumberOptions('.phonenumber-options', data);
	});
}

function renderPhonenumberDisplay(number, container) {
	var phonenumberHTML = '';
	
	phonenumberHTML += '<div class="panel panel-default panel-body">';
		phonenumberHTML += '<p class="mb-0">' + number + '</p>';
	phonenumberHTML += '</div>';
	
	container.html(phonenumberHTML);
}

/**
 * Toggle the phonenumber input manner
 * @param {String} option
 * public
 **/
function togglePhonenumberInput(option) {
	if(option === 'existing-user') {
		$('.phonenumber-container #contact-phonenumber-form').addClass('hidden');
		$('.phonenumber-container .active-phonenumber').removeClass('hidden');
		$('.phonenumber-container .show-phonenumber-form').removeClass('hidden');
	}
	if(option === 'new-user') {
		$('.phonenumber-container #contact-phonenumber-form').removeClass('hidden');
		$('.phonenumber-container .active-phonenumber').addClass('hidden');
		$('.phonenumber-container .show-phonenumber-form').addClass('hidden');
	}
}


function handleFetchOrganisations() {
	fetchOrganisations().then(function(data) {
	    checkoutState.organisation = data;
		renderOrganisationOptions('.organisation-options', data);
		prefillAddressForm('#new-billing-address-form', checkoutState.user, data.active);
		prefillAddressForm('#new-shipping-address-form', checkoutState.user, data.active);
		
		if (checkoutState.autoLinkOrganisation && !data.active && data.options.primary) {
			selectOrganisation(data.options.primary.id);
		}
	});
}

/**
 * Render the given organisation in the given container
 * @param {Object} container
 * @param {Object} address
 * public
 **/
function renderActiveOrganisation(container, organisation) {
	var organisationHTML = '';
	
	if(organisation) {
		organisationHTML += '<div class="d-flex flex-column panel panel-default panel-body">';
			organisationHTML += '<strong>' + organisation.name + '</strong>';
			if (organisation.coc_number !== 'null') {
			    organisationHTML += '<span>' + organisation.coc_number + '</span>';
			}
			if (organisation.registrations.length > 0) {
				organisationHTML += '<span>' + organisation.registrations[0].number + '</span>';
			}
		organisationHTML += '</div>';
		
		$('#organisation-info').collapse('show');
	}
	
	$(container).html(organisationHTML);
}


function renderOrganisationOptions(container, organisations) {
	var optionsHTML = '';
	var activeOrganisation = organisations.active;
	var activeOrganisationId = activeOrganisation && activeOrganisation.id;
	var primary = organisations && organisations.options && organisations.options.primary;
	
	renderActiveOrganisation('.organisation-container .active-organisation', organisations.active);
	if (organisations.active) {
		allowSaveAddressAsOption();
	}

	if (primary) {
		optionsHTML += '<div'; 
			optionsHTML += ' class="d-flex flex-column panel panel-default panel-radio panel-body';
			if (activeOrganisationId && activeOrganisationId === primary.id) {
				optionsHTML += ' active';
			}
			optionsHTML += '"';
			optionsHTML += ' data-organisation-id="' + primary.id + '"';
			optionsHTML += ' data-action="select-organisation"';
		optionsHTML +='>';
			optionsHTML += '<strong>' + primary.name + '</strong>';
			optionsHTML += '<span>' + primary.coc_number + '</span>';
			if (primary.registrations.length > 0) {
				optionsHTML += '<span>' + primary.registrations[0].number + '</span>';
			}
			optionsHTML += '<span class="text-success">Standaard organisatie</span>';
		optionsHTML += '</div>';
	}
	
	if (organisations && organisations.options && organisations.options.secondary) {
		$.each(organisations.options.secondary, function(idx, organisation) {
			optionsHTML += '<div'; 
				optionsHTML += ' class="d-flex flex-column panel panel-default panel-radio panel-body';
				if (activeOrganisationId && activeOrganisationId === organisation.id) {
					optionsHTML += ' active';
				}
				optionsHTML += '"';
				optionsHTML += ' data-organisation-id="' + organisation.id + '"';
				optionsHTML += ' data-action="select-organisation"';
			optionsHTML +='>';
				optionsHTML += '<strong>' + organisation.name + '</strong>';
				optionsHTML += '<span>' + organisation.coc_number + '</span>';
				if (organisation.registrations.length > 0) {
					optionsHTML += '<span>' + organisation.registrations[0].number + '</span>';
				}
			optionsHTML += '</div>';
		})	
	}
	
	$(container).html(optionsHTML);
}

/**
 * Toggle the organisation input manner
 * @param {String} option
 * public
 **/
function toggleOrganisationInput(option) {
	if(option === 'existing-user') {
		$('.organisation-container .organisation-form').addClass('hidden');
		$('.organisation-container .active-organisation').removeClass('hidden');
		$('.organisation-container .show-organisations').removeClass('hidden');
		$('.organisation-container .remove-organisation').removeClass('hidden');
		$('#organisation-heading-button').addClass('hidden');
		$('#organisation-heading-static').removeClass('hidden');
	}
	if(option === 'new-user') {
		$('.organisation-container .organisation-form').removeClass('hidden');
		$('.organisation-container .active-organisation').addClass('hidden');
		$('.organisation-container .show-organisations').addClass('hidden');
		$('#organisation-heading-static').addClass('hidden');
		$('#organisation-heading-button').removeClass('hidden');
	}
}

/**
 * Toggle the new organisation form inside the given container to the given newState
 * @param {Object} container
 * @param {String} newState
 * public
 **/
function toggleNewOrganisationForm(container, newState) {
	if (newState === 'visible') {
		$(container).find('.organisation-options-container').addClass('hidden');
		$(container).find('.new-organisation-container').removeClass('hidden');
	}
	if (newState === 'hidden') {
		$(container).find('.organisation-options-container').removeClass('hidden');
		$(container).find('.new-organisation-container').addClass('hidden');
		$(container).find('.new-organisation-container').trigger('reset');
		$(container).find('.new-organisation-container').parsley().reset();
	}
}

/**
 * Set the given addres id into the checkout sessoin for the given type
 * @param {String} id
 * @param {String} type
 * @param {Function} callback
 * public
 **/
function selectOrganisation(id, callback) {
	setOrganisation(id).then(function(data) {
		if(callback) {
			callback();
		}
		checkoutState.organisation = data;
		handleFetchOrganisations();
		checkoutContainer.trigger(ORGANISATION_SELECTED_EVENT);
	});
}

/**
 * remove the current organisation
 * public
 **/
function removeOrganisation(callback) {
	deleteOrganisation().then(function() {
	    if (callback) {
	        callback();
	    }
		checkoutState.organisation = {};
		handleFetchOrganisations();
		checkoutContainer.trigger(ORGANISATION_SELECTED_EVENT);
	});
}

/**
 * Create a new organisation and close the form
 * @param {Object} event
 * public
 **/
function handleCreateOrganisation(event) {
	// cleanup manual errors
	$('#new-organisation-vat-number').parsley().removeError('invalidNumber');
	
	var form = $(this);
	var formData = serializeObject(form);
	var number = formData.number.replace(/[^a-z0-9\s]/gi, "").replace(/[ ]/g, '');
	
	form.addClass('loading-ajax');
	
	var formattedFormData = {
		"name": formData.name,
		"coc_number": formData.coc_number,
		"registrations": [
			{
				"country_code": formData.country_code,
				"number": number,
			}
		],
	}
	var responseData = null;
	createOrganisation(formattedFormData).then(function(data, xhr) {
	    responseData = data;
	    var taskID = responseData.xhr.getResponseHeader('x-task-id');
	    $('.validating-organisation').addClass('validating');
	    return pollTask(taskID);
	}).then(function(data) {
	    
	    if (isVatValid(number, JSON.parse(atob(data.result)))) {
    		selectOrganisation(responseData.id, function() {
    			$('#organisation-select').modal('hide');
    			toggleNewOrganisationForm(form.closest('.modal-content'), 'hidden');
    		});
	    } else {
			$('#new-organisation-vat-number').parsley(parsleySettings).addError('invalidNumber', { message: $('#new-organisation-vat-number').data('invalid-number-message') });
	    }
	    $('.validating-organisation').removeClass('validating');
	    form.removeClass('loading-ajax');
	    
	}).catch(function(error) {
	    $('.validating-organisation').removeClass('validating');
	    form.removeClass('loading-ajax');
// 		add manual erors on the fields that fail
		$.each(error.responseJSON.errors.invalid, function (idx, errorField) {
			switch(errorField) {
				case 'Registrations.0.Number':
					$('#new-organisation-vat-number').parsley(parsleySettings).addError('invalidNumber', { message: $('#new-organisation-vat-number').data('invalid-number-message') });
					break;
				caseeak;
				default:
					return;
			}
		});
	});
	
	event.preventDefault();
}


function isVatValid(number, array) {
    var result = array.find(function(vat) {
        return vat.number === number;
    });
    
    console.log(result);
    if (result) {
        return result.verification.is_valid;
    }
    
    return false;
}

/**
 * Create a new phonenumber and close the form
 * @param {Object} event
 * public
 **/
function handleCreatePhonenumber(event) {
	$('#contact-new-phonenumber').parsley(parsleySettings).removeError('invalidNumber');
	var form = $(this);
	var formData = serializeObject(form);
	
	form.addClass('loading-ajax');
	
	setPhonenumber(formData.country_code, formData.number).then(function(data) {
		handleFetchPhoneNumber();

		$('#change-phonenumber').modal('hide');
		toggleNewPhonenumberForm(form.closest('.modal-content'), 'hidden');
		setTimeout(function() {
			form.trigger('reset');
			form.removeClass('loading-ajax');
		}, 300);
	}).catch(function(error) {
		form.removeClass('loading-ajax');
		if (error.responseJSON.message === 'Bad phone number or country code') {
			$('#contact-new-phonenumber').parsley(parsleySettings).addError('invalidNumber', { message: $('#contact-new-phonenumber').data('invalid-number-message') });
		}
	});
	
	event.preventDefault();
}

function handleCreateNewPhonenumber(event) {
    var form = $(this);
	var formData = serializeObject(form);
	var options = undefined;
    
    if (formData.save_number_as === 'contact') {
		options = { contact: {}};
		
		if (formData.save_number_as_primary === "on") {
			options.contact = { primary: true};
		} else {
			options.contact = { secondary: true};
		}
	} else if (formData.save_number_as === 'organisation') {
		options = { organisation: {}};
		
		if (formData.save_number_as_primary === "on") {
			options.organisation = { primary: true};
		} else {
			options.organisation = { secondary: true};
		}
	}
    
    createPhonenumber(formData).then(function(data) {
        return selectPhonenumber({ phone_number_id: data.id }, options);
    }).then(function() {
        handleFetchPhoneNumber();
    }).then(function() {
        checkoutContainer.trigger(PHONENUMBERCHANGE_EVENT);
    });
}

function handleSelectPhonenumber(id) {
    selectPhonenumber({
        "phone_number_id": id,
        
    }).then(function() {
        fetchPhonenumbers();
    })
}

/**
 * Render the order summarries
 * @param {Object} calculation
 * @param {String} container
 * public
 **/
function renderSummary(calculation, container) {
	var itemSummaryContainer = '.checkout-summary-items';
	var costSummaryContainer = '.checkout-summary-totals';
	
	renderItemSummary(calculation.items, itemSummaryContainer);
	renderCostSummary(calculation, costSummaryContainer);
	
}

/**
 * Render the summary of items on the order
 * @param {Array} items
 * @param {string} container
 * public
 **/
function renderItemSummary(items, container) {
	var summaryHTML = '';
	
	$.each(items, function(idx, item) {
		summaryHTML += '<div class="d-flex justify-content-between align-items-end mb-15">';
			summaryHTML += '<div class="flex-fill d-flex flex-wrap justify-content-between">';
				summaryHTML += '<div class="flex-100">';
					summaryHTML += '<strong>';
						summaryHTML += item.description;
					summaryHTML += '</strong>';
				summaryHTML += '</div>';
				summaryHTML += '<div class="flex-100">';
					summaryHTML += item.quantity + ' x ' + intToPrice(item.amount / 100);
				summaryHTML += '</div>';
				if (item.adjustments !== null) {
					$.each(item.adjustments, function(idx, adjustment) {
						summaryHTML += '<div class="flex-66 text-muted">';
							summaryHTML += adjustment.description;
						summaryHTML += '</div>';
						summaryHTML += '<div class="flex-33 text-right pr-20">';
							summaryHTML += '<small class="text-muted">';
								summaryHTML += intToPrice((adjustment.is_discount ? adjustment.result.output * -1 : adjustment.result.output) / 100);
							summaryHTML += '</small>';
						summaryHTML += '</div>';
						summaryHTML += '<div class="flex-100"></div>';
					});
				}
			summaryHTML += '</div>';
			summaryHTML += '<div class="flex-20 text-right">';
				summaryHTML += intToPrice(item.total / 100);
			summaryHTML += '</div>';
		summaryHTML += '</div>';
	});
	
	$(container).html(summaryHTML);
}

/**
 * Render the summary of costs for the order
 * @param {Object} calculation
 * @param {string} container
 * public
 **/
function renderCostSummary(calculation, container) {
	var summaryHTML = '';
	var totalDiscount = 0;
	
	var shouldShowVatBelowTotal = (calculation.is_including_vat && !calculation.is_vat_shifted) || (!calculation.is_including_vat && calculation.is_vat_shifted);
	var shouldShowVatAsNegative = calculation.is_vat_shifted && calculation.is_including_vat;
	
	if (calculation.services && calculation.services.length > 0) {
	    summaryHTML += '<hr class="mt-10 mb-20" />';
        $.each(calculation.services, function(idx, service) {
    		summaryHTML += '<div class="d-flex justify-content-between">';
    			summaryHTML += '<div class="flex-70 fw-bold">';
    				summaryHTML += service.description;
    			summaryHTML += '</div>';
    			summaryHTML += '<div class="flex-30 fw-bold">'
    				summaryHTML += intToPrice(service.total / 100);
    			summaryHTML += '</div>';
    		summaryHTML += '</div>';
        });
		summaryHTML += '<div class="mb-20"></div>';
	}
	
	if (calculation.total !== calculation.subtotal) {
		summaryHTML += '<hr class="mt-10 mb-20" />';
		summaryHTML += '<div class="d-flex justify-content-between">';
			summaryHTML += '<div class="flex-70 fw-bold">';
				summaryHTML += $(container).data('subtotal-label');
			summaryHTML += '</div>';
			summaryHTML += '<div class="flex-30 fw-bold">'
				summaryHTML += intToPrice(calculation.subtotal / 100);
			summaryHTML += '</div>';
		summaryHTML += '</div>';
	}
	
	if (calculation.adjustments.length > 0) {
		$.each(calculation.adjustments, function(idx, adjustment) {
			totalDiscount += (adjustment.is_discount ? adjustment.result.output * -1 : adjustment.result.output);
			
			summaryHTML += '<hr class="my-10" />';
			summaryHTML += '<div class="d-flex justify-content-between">';
				summaryHTML += '<div class="flex-70">';
					summaryHTML += adjustment.description;
				summaryHTML += '</div>';
				summaryHTML += '<div class="flex-30">'
					summaryHTML += intToPrice((adjustment.is_discount ? adjustment.result.output * -1 : adjustment.result.output) / 100);
				summaryHTML += '</div>';
			summaryHTML += '</div>';
		});
	}
	
	if (totalDiscount > 0) {
		summaryHTML += '<hr class="my-10" />';
		summaryHTML += '<div class="d-flex justify-content-between">';
			summaryHTML += '<div class="flex-70 fw-bold">';
				summaryHTML += $(container).data('total-discount-label');
			summaryHTML += '</div>';
			summaryHTML += '<div class="flex-30 fw-bold">'
				summaryHTML += intToPrice(totalDiscount / 100);
			summaryHTML += '</div>';
		summaryHTML += '</div>';
	}
	
	if (shouldShowVatBelowTotal) {
		summaryHTML += '<hr class="mt-10 mb-20" />';
		summaryHTML += '<div class="d-flex justify-content-between">';
			summaryHTML += '<div class="flex-70 fw-bold">';
				summaryHTML += $(container).data('total-label');
			summaryHTML += '</div>';
			summaryHTML += '<div class="flex-30 fw-bold">'
				summaryHTML += intToPrice(calculation.total / 100);
			summaryHTML += '</div>';
		summaryHTML += '</div>';
	}
	
	if (shouldShowVatBelowTotal && calculation.is_vat_shifted) {
		summaryHTML += '<hr class="mt-20 mb-10" />';
			summaryHTML += '<div class="d-flex justify-content-between">';
				summaryHTML += $(container).data('vat-shifted-no-rate-label');
			summaryHTML += '</div>';
		summaryHTML += '</div>';
	} else {
	    if (calculation.vat && calculation.vat.length > 0) {
    		$.each(calculation.vat, function(idx, vat) {
    			summaryHTML += '<hr class="mt-' + (idx === 0 ? "20" : "10") + ' mb-10" />';
    			summaryHTML += '<div class="d-flex justify-content-between">';
    				summaryHTML += '<div class="flex-70">';
    					if (shouldShowVatBelowTotal) {
    						if (calculation.is_vat_shifted) {
    							summaryHTML += $(container).data('vat-shifted-no-rate-label');
    						} else {
    							summaryHTML += $(container).data('of-which-vat-label').replace('{rate}', vat.rate + '%');
    						}
    					} else {
    						if (calculation.is_vat_shifted) {
    							summaryHTML += $(container).data('vat-shifted-label').replace('{rate}', vat.rate + '%');
    						} else {
    							summaryHTML += $(container).data('vat-label').replace('{rate}', vat.rate + '%');
    						}
    					}
    				summaryHTML += '</div>';
    				summaryHTML += '<div class="flex-30">';
    				// 	if (!shouldShowVatBelowTotal && !projection.is_vat_shifted) {
    						summaryHTML += intToPrice((shouldShowVatAsNegative ? vat.amount * -1 : vat.amount) / 100);
    				// 	}
    				summaryHTML += '</div>';
    			summaryHTML += '</div>';
    		})
	    }
	}
	
	
	if (!shouldShowVatBelowTotal) {
		summaryHTML += '<hr class="mt-10 mb-20" />';
		summaryHTML += '<div class="d-flex justify-content-between">';
			summaryHTML += '<div class="flex-70 fw-bold">';
				summaryHTML += 'Totaal';
			summaryHTML += '</div>';
			summaryHTML += '<div class="flex-30 fw-bold">'
				summaryHTML += intToPrice(calculation.total / 100);
			summaryHTML += '</div>';
		summaryHTML += '</div>';
	}
	
	$(container).html(summaryHTML);
}

/**
 * Copy input of the invoice address to the shipping address form when no user detected
 * @param {Objet} e
 * public
 **/
function handleAddressInput(e) {
	var el = $(this);
	var type = el.closest('.address-container').data('address-type');
	var fieldName = el.attr('name');
	
	if (!checkoutState.addresses[type].active) {
	    checkoutState.addresses[type].active = {};
	}
	
	checkoutState.addresses[type].active[fieldName] = e.target.value;
	
	renderActiveAddress('#summary-active-billing-address', checkoutState.addresses.billing.active);
	renderActiveAddress('#summary-active-shipping-address', checkoutState.addresses.shipping.active);
	
	if(fieldName === 'country_code' && type === 'billing') {
		filterPaymentMethods(e.target.value);
	}
	
	if (fieldName === 'country_code' || (fieldName === 'postal_code' && e.target.value.length > 3)) {
		handleRenderShippingMethodPickUpPoints();
	}
	
	if (!$('#shipping-same-as-billing').is(':checked') && type === 'billing') {
		if (el.is('select')) {
			$('select[id="' + el.attr('id').replace('billing', 'shipping') + '"]').val(el.val()).change();
		} else if (el.attr('type') == 'checkbox' || el.attr('type') == 'radio') {
			$('input[id="' + el.attr('id').replace('billing', 'shipping') + '"][value="' + el.attr('value') + '"]')
			    .prop('checked', el.is(':checked'))
		        .change();
		} else {
			$('input[id="' + el.attr('id').replace('billing', 'shipping') + '"]').val(el.val()).change();
		}
	}
}

/**
 * Use the information of the contact and organisation to prefill the address forms
 * @param {String} form
 * @param {Object} contact
 * @param {Object} organisation
 * public
 **/
function prefillAddressForm(form, contact, organisation) {
	if (checkoutState.prefillAddress) {
		var formEl = $(form);
		
		if (contact) {
			formEl.find('[name="given_name"]').attr('value', contact.given_name);
			formEl.find('[name="additional_name"]').attr('value', contact.additional_name);
			formEl.find('[name="family_name"]').attr('value', contact.family_name);
		}
		
		if (organisation) {
			formEl.find('[name="organisation"]').attr('value', organisation.name);
		}
	}
}

function allowSaveAddressAsOption() {
	$('.create-address-form select[name="save_address_as"] option[value="organisation"]')
	    .removeAttr('disabled')
	    .attr('selected', true);
}

/**
 * Decide if the projetion should be rendered
 * public
 **/
function handleShouldRenderProjection() {
	if (checkoutState.hasPaymentMethod && checkoutState.hasShippingMethod) {
		handleFetchProjection();
	}
}

/**
 * Create an organisation when no contact is signed on
 * @param {string} formId
 * public
 **/
function handleCreateGuestOrganisation(formId) {
	var form = $(formId);
	var formData = serializeObject(form);
	var number = formData.number.replace(/[^a-z0-9\s]/gi, "").replace(/[ ]/g, '');
	
	var formattedFormData = {
		"name": formData.name,
		"coc_number": formData.coc_number,
		"registrations": [
			{
				"country_code": formData.country_code,
				"number": number,
			}
		],
	}
	
	var responseData = null;
	
	$('#organisation-vat-number').parsley().removeError('invalidNumber');
	
	return createOrganisation(formattedFormData).then(function(data, xhr) {
	    responseData = data;
	    var taskID = responseData.xhr.getResponseHeader('x-task-id');
	    $('.validating-organisation').addClass('validating');
	    return pollTask(taskID);
	   return true;
	}).then(function(data) {
	    $('.validating-organisation').removeClass('validating');
	    if (isVatValid(number, JSON.parse(atob(data.result)))) {
    		return selectOrganisation(responseData.id, function() {
    		    return responseData;
    		});
	    } else {
			$('#organisation-vat-number').parsley(parsleySettings).addError('invalidNumber', { message: $('#organisation-vat-number').data('invalid-number-message') });
			$('#organisation-vat-number').focus();
	        checkoutContainer.removeClass('loading-ajax');
	        return Promise.reject(new Error('invalid vat-number'));
	    }
	}).catch(function(error) {
	    $('.validating-organisation').removeClass('validating');
	    checkoutContainer.removeClass('loading-ajax');
// 		add manual erors on the fields that fail
        if (error && error.responseJSON && error.responseJSON.errors) {
        
    		$.each(error.responseJSON.errors.invalid, function (idx, errorField) {
    			switch(errorField) {
    				case 'Registrations.0.Number':
    					$('#organisation-vat-number').parsley(parsleySettings).addError('invalidNumber', { message: $('#organisation-vat-number').data('invalid-number-message') });
			            $('#organisation-vat-number').focus();
    					break;
    				caseeak;
    				default:
    					return;
    			}
    		});
    		return Promise.reject(new Error('organisation errors'))
        }
        
        if (error) {
	        return Promise.reject(error);
        }
	});
	
// 	return createOrganisation(formattedFormData).then(function(data) {
// 	    var taskID = data.xhr.getResponseHeader('x-task-id');
// 	    return pollTask(taskID).then(function(response) {
// 	        console.log(response);
// 	        selectOrganisation(data.id);
// 	        return data;
// 	    });
// 	});
}

function handleChangeDesiredDeliveryDate(e) {
	var atDate = moment(e.target.value, "DD-MM-YYYY");
	if (atDate.isValid()) {
		setShippingWindow({
			from: null,
			to: null,
			at: atDate.format("YYYY-MM-DD"),
		})
	}
}

function handleChangeReference(e) {
	setOrderReference(e.target.value).then(function() {
	    fetchCalculation().then(function(data) {
            checkoutState.calculation = data;
            renderSummary(data);
	    });
	});
}

function handleFetchShippingWindow(field) {
	fetchShippingWindow().then(function(data) {
		if (data && data.active && data.active.at) {
			$(field).val(moment(data.active.at).format('DD-MM-YYYY'));
		}
	});
};

function handleFetchReference(field) {
	fetchOrderReference().then(function(data) {
		if (data && data.reference) {
			$(field).val(data.reference);
		}
	});
};

function toggleAccountManagersInputs(newState) {
    var allowedDomains = checkoutState.accountManagersDomains;
    var userDomain = '@' + checkoutState.user.email.split('@')[1];
    
    if (allowedDomains.indexOf(userDomain) >= 0) {
        if (newState === 'show') {
            $('.account-managers-input').removeClass('hidden').attr('required', true);
        } else {
            $('.account-managers-input').addClass('hidden').removeAttr('required');
        }
    }
}

function handleOrganisationContactChange(event) {
    checkoutState.organisationContact = event.target.value;
}

/**
 * Finish the checkout
 * public
 **/
function handleFinishCheckout() {
	if (!isStepValid(checkoutContainer.attr('data-active-step'))) {
	    return;
	}
	checkoutContainer.addClass('loading-ajax');
	
	authorizeSession(checkoutState.calculation.id).then(function(data) {
	    console.log(data);
		window.location.href = data.forward_uri;
	}).catch(function(error) {
		if (error.responseJSON && error.responseJSON.message === 'insufficient balance' ) {
			$('#insufficient-balance-error').modal('show');
		}
		checkoutContainer.removeClass('loading-ajax');
	});
}

// #### stepped checkout functionalilty
function handleGoToStep(stepNumber, disableValidation, event) {
	if (disableValidation || isStepValid(checkoutContainer.attr('data-active-step'))) {
	    
		if (typeof ga !== 'undefined') {
		    if (Number(checkoutContainer.attr('data-active-step')) < Number(stepNumber)) {
                if (typeof gaceCheckout !== 'undefined') {
                    $('#checkout-v4').trigger('next.Checkout', 'step-' + stepNumber, event);
                } else {
                    ga('send', 'pageview', getSendData('step-' + stepNumber));
                }
		    } else if (Number(checkoutContainer.attr('data-active-step')) > Number(stepNumber)) {
		        if (typeof ga !== 'undefined') {
                    if (typeof gaceCheckout !== 'undefined') {
                        $('#checkout-v4').trigger('prev.Checkout', 'step-' + stepNumber, event);
                    } else {
                        ga('send', 'pageview', getSendData('step-' + stepNumber));
                    }
                }
		    }
        }
        
        $('#step-' + (stepNumber - 1) + '.checkout-step').addClass('loading-ajax');
        $('#step-' + (stepNumber - 1) + '.checkout-step [data-action="go-to-checkout-step"]').attr('disabled', true);
        
        if (stepNumber === 2) {
            if (!checkoutState.loggedIn && !disableValidation) {
                startPromiseChain().then(function() {
        			if($('#organisation-fields #organisation-name').val() !== '') {
        		        return handleCreateGuestOrganisation('#organisation-fields');
        			} else if(checkoutState.organisation.active && checkoutState.organisation.active.id) {
        			    return removeOrganisation();
        			}
        		}).then(function(response) {
        		    console.log(response);
                    return handleCreateGuestPhonenumber();
        		}).then(function() {
                    return handleFetchPhoneNumber();
        //         handleCreateGuestContact('#account-form').then(function() {
        //             return handleCreateGuestPhonenumber();
        		}).then(function() {
                    return handleCreateGuestAddress('#billing-address-field', 'billing');
                }).then(function(data) {
            		setBillingAddress(data.id).then(function() {
            			return data;
            		}).then(function(data) {
            			if (!hasAddressOptions(checkoutState.addresses.shipping)) {
            				return setShippingAddress(data.id);
            			}
            		}).then(function() {
            		    fetchAddresses(false, false);
            		});
                	
                    
        //         }).then(function(data) {
        // 			return setBillingAddress(data.id, {contact: { primary: true } });
        		}).then(function() {
                    doGoToStep();
                    toggleAddressInput('existing-user');
            		togglePhonenumberInput('existing-user');
            		toggleOrganisationInput('existing-user');
            		checkoutState.loggedIn = true;
        		}).catch(function(err) {
        		    console.log(err);
        		    $('#step-' + (stepNumber - 1) + '.checkout-step').removeClass('loading-ajax');
    		        $('#step-' + (stepNumber - 1) + '.checkout-step [data-action="go-to-checkout-step"]').attr('disabled', false);
        		});
            } else {
                doGoToStep();
            }
        } else if (stepNumber === 3) {
            if (!checkoutState.loggedIn && !disableValidation) {
        //         handleCreateGuestAddress('#shipping-address-field', 'shipping').then(function(data) {
        // 			return setShippingAddress(data.id, {contact: { primary: true } });
        // 		}).then(function() {
                    doGoToStep();
        // 		}).catch(function(err) {
        // 		    $('#step-' + (stepNumber - 1) + '.checkout-step').removeClass('loading-ajax');
    		  //      $('#step-' + (stepNumber - 1) + '.checkout-step [data-action="go-to-checkout-step"]').attr('disabled', false);
        // 		});;
            } else {
                doGoToStep();
            }
        } else if (stepNumber === 4) {
            handleRenderGuestOrganisation();
            
            fetchCalculation().then(function(data) {
                checkoutState.calculation = data;
                renderSummary(data);
                doGoToStep();
            }).catch(function(err) {
                console.log(err);
    		    $('#step-' + (stepNumber - 1) + '.checkout-step').removeClass('loading-ajax');
		        $('#step-' + (stepNumber - 1) + '.checkout-step [data-action="go-to-checkout-step"]').attr('disabled', false);
    		});;
        } else {
            doGoToStep();
        }
        
        
        function doGoToStep() {
    		$('#step-' + (stepNumber - 1) + '.checkout-step').removeClass('loading-ajax');
    		$('#step-' + (stepNumber - 1) + '.checkout-step [data-action="go-to-checkout-step"]').attr('disabled', false);
            if ($(window).scrollTop() > 100) {
    			$('body, html').animate({
    				scrollTop: 0
    			}, 500, stepper(stepNumber));
    		} else {
    			stepper(stepNumber);
    		}
    		
    		$('#checkout-progress').removeAttr('class').addClass('step-' + stepNumber);
		    checkoutContainer.attr('data-active-step', stepNumber);
        }

		function stepper(stepNum) {
			$('.checkout-progress-bar .step.step-' + (stepNum - 1)).removeClass('active').addClass('valid');
			$('.checkout-progress-bar .step.step-' + (stepNum + 1)).removeClass('active');
			$('.checkout-progress-bar .step.step-' + (stepNum)).addClass('active').removeClass('valid');
		}
	}
}

$('[data-action="go-to-checkout-step"]').on('click', function(event) {
	handleGoToStep($(this).data('step'), $(this).data('disable-validation') !== undefined, event);
})


function isStepValid(step) {
	var stepIsValid = true;
	var currentStep = checkoutContainer.attr('data-active-step');
	
	if (step === '1') {
		var billingAddressErrorContainer = $('.billing-address-error');
		if (checkoutState.addresses.billing.active === null) {
			if (step === currentStep) {
				billingAddressErrorContainer.text(billingAddressErrorContainer.data('no-option-selected-message'));
			}

			$('html, body').animate({
				scrollTop: billingAddressErrorContainer.offset().top - 200,
			}, 0);
			
			stepIsValid = false;
		} else {
			billingAddressErrorContainer.text('');
		}
	}
	
	if (step === '2') {
		var shippingAddressErrorContainer = $('.shipping-address-error');
		if (checkoutState.addresses.shipping.active === null) {
			if (step === currentStep) {
				shippingAddressErrorContainer.text(shippingAddressErrorContainer.data('no-option-selected-message'));
			}

			$('html, body').animate({
				scrollTop: shippingAddressErrorContainer.offset().top - 200,
			}, 0);
			
			stepIsValid = false;
		} else {
			shippingAddressErrorContainer.text('');
		}
		
		var errorContainer = $('.shipping-method-error');
		if (!checkoutState.hasShippingMethod) {
			if (step === currentStep) {
				errorContainer.text(errorContainer.data('no-option-selected-message'));
			}

			$('html, body').animate({
				scrollTop: errorContainer.offset().top - 200,
			}, 0);
		} else {
			errorContainer.text('');
		}
		
		if (stepIsValid) {
		   stepIsValid = checkoutState.hasShippingMethod;
		}
	}
	
	if (step === '3') {
		var errorContainer = $('.payment-method-error');
		if (!checkoutState.hasPaymentMethod) {
			if (step === currentStep) {
				errorContainer.text(errorContainer.data('no-option-selected-message'));
			}

			$('html, body').animate({
				scrollTop: errorContainer.offset().top - 200,
			}, 0);
		} else {
			errorContainer.text('');
		}
		stepIsValid = checkoutState.hasPaymentMethod;
	}
	
	var firstErrorField = null;
	
	if (!checkoutState.loggedIn && (step !== '1' || step !== '2') || (checkoutState.loggedIn && step === '4')) {
		$('[data-parsley-group="step-' + step + '"]').each( function() {
			if ($(this).parsley(parsleySettings).validate() !== true) {
				stepIsValid = false;
				if(firstErrorField === null) {
					firstErrorField = this;
				}
			}
		});
		
		if (firstErrorField !== null) {
			$(firstErrorField).focus();
		}
	}
	
	return stepIsValid;
}

function handleRenderGuestOrganisation() {
    if ($('#organisation-name').val() !== '') {
        renderActiveOrganisation('#checkout-summary-organisation-row .summary-active-organisation', {
            id: 'newguestorg',
            name: $('#organisation-name').val(),
            coc_number: $('#organisation-coc-number').val(),
            registrations: [
              {
                country_code: $('#organisation-country-code').val(),
                number: $('#organisation-vat-number').val(),
              }
            ]
        });
        
        $('#checkout-summary-organisation-row').removeClass('hidden');
    } else {
        $('#checkout-summary-organisation-row').addClass('hidden');
    }
}

function clearFormOnUncheck() {
    var el = $(this);
    var target = $(el.data('clear-form-on-uncheck'));
    var isChecked = el.is(':checked');
    
    if (!isChecked) {
        target.trigger('reset');
    }
}


function toggleOnCheck() {
    var el = $(this);
    var target = $(el.data('target'));
    var isFlipped = el.data('is-flipped');
    var isChecked = el.is(':checked');
    
    if (isChecked) {
        target.collapse(isFlipped ? 'hide' : 'show');
    } else {
        target.collapse(isFlipped ? 'show' : 'hide');
    }
}

function toggleOrganisationFields() {
    var el = $(this);
    var value = el.val();
    var form = el.closest('form');
    var cocFieldContainer = form.find('.coc-number-container');
    var cocField = cocFieldContainer.find('input');
    
    if (value.toLowerCase() === 'be' || value.toLowerCase() === 'lu') {
        cocFieldContainer.addClass('hidden');
    }
    if (value.toLowerCase() === 'nl') {
        cocFieldContainer.removeClass('hidden');
    }
}


// utils
function isInArray(value, array) {
  return array.indexOf(value) > -1;
}

