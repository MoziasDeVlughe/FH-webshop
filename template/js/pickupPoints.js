$(function () {
    var locale = $('#checkout-header').data('af-locale');
    moment.locale(locale);
    
    $('.shipping-method-option').on('change', showShippingMethodOptions);
    $('.shipping-method-sub-options').on('renderOptions', initializeShippingOptionListeners);
});

/**
 * Store the current requests.
 * 
 * @property requests
 * @type Object
 */ 
var requests = {
    'time': [],
    'point': []
};

/**
 * Initialize the listeners for the pickup points and times, on the available options.
 * 
 * @method initializeShippingOptionListeners
 */ 
function initializeShippingOptionListeners() {
    $('.shipping-method-time').off('change', setPickupTimeFields).on('change', setPickupTimeFields);
    $('.shipping-method-point').off('change', setPickupPointFields).on('change', setPickupPointFields);
    $('.btn-more-pickup-points').off('click', showMorePickupPoints).on('click', showMorePickupPoints);
}

/**
 * Show all pickup points.
 * 
 * @method showMorePickupPoints
 * @param {Object}      e       The event data object.
 */ 
function showMorePickupPoints(e) {
    var el = $(e.target);
    
    if (el && el.length > 0) {
        el.parent('.shipping-method-sub-options').find('.radio.hide').removeClass('hide');
        el.addClass('hide');
    }
}

/**
 * Show the sub options of the shipping method based on whether the shipping option is checked.
 * 
 * @method showShippingMethodOptions
 */ 
function showShippingMethodOptions() {
    var shippingOption = $('.shipping-method-option:checked');
    
    $('.shipping-method-sub-options').addClass('hide');
    $('.shipping-method-sub-options').find('input').prop('checked', false);
    $('.shipping-option-field').val('');
    
    if (shippingOption) {
        shippingOption.closest('label').parent().find('.shipping-method-sub-options').removeClass('hide');
        
        var options = shippingOption.closest('label').parent().find('.shipping-method-sub-options input:first');
        
        if (options.length > 0) {
            options.prop('checked', true).trigger('change');
        } else {
            shippingOption.closest('label').parent().find('.shipping-method-sub-options select').change();
        }
    }
}

/**
 * Load the shipping options for every provider type (dhl/postnl).
 * 
 * @method loadShippingOptions
 */
function loadShippingOptions() {
    var types = [$('#checkout-form').data('provider')];
    
    $.each(types, function (i, type) {
       loadPickupTimes(type);
       loadPickupPoints(type);
    });
}

/**
 * Fill the time option input fields with the data of the selected time option.
 * 
 * @method setPickupTimeFields
 */ 
function setPickupTimeFields() {
    var el = $(this);
    var selectedOption = el.find('option:selected');
    var type = el.data('type');
    var time = selectedOption.data('time');
    
    $('.shipping-option-field').val('');
    
    for (var key in time) {
        var input = $('input[name="plugin[' + type + '_time_' + key + ']"]');

        if (input.length > 0) {
            input.val(time[key]);
        }
    }
}

/**
 * Load the time options for the provided type.
 * 
 * @method loadPickupTimes
 * @param {String}      type        The type of provider (dhl/postnl).
 */
function loadPickupTimes(type) {
    var postalCode = $('#checkout-form #shipping_address_postal_code1').val().replace(/\s/g, '');
    var iso = $('#checkout-form #shipping_address_country_id option:selected').data('country-iso');
    var houseNumber = $('#shipping_address_house_number').val().replace(/\s/g, '');
    
    if (postalCode !== '' && iso !== '' && houseNumber !== '') {
        requests['time'][type] = $.ajax({
           url: '/' + type + '/time/' + postalCode + '/' + houseNumber,
           type: 'GET',
           beforeSend: function () {
               if (requests['time'][type]) {
                   requests['time'][type].abort();
               }
           },
           success: function (data) {
                var options = [];
               
                if (data && data.methods) {
                    $.each(data.methods, function (i, time) {
                        options[time.id] = _formatTimeOptions(time);
                    });
                }
                
                _renderTimeOptions(options, type);
           }
       });
    }
}

/**
 * Format the options data for the received time object.
 * 
 * @method _formatTimeOptions
 * @param {Object}      time        The time data object.
 * @return {Array}
 * @private
 */ 
function _formatTimeOptions(time) {
    var formattedTimes = [];
    var hour = parseInt($('#checkout-form').data('hour')) || 0;
    
    // var DNL = $("#checkout-form").data("dnl");
    // var end_time = (DNL ? 21 : 11);
    
    
    if (time.options) {
        // var rules = _getTimeRules();
        // var activeRule = rules[moment().isoWeekday()];
        // var rulestamp = hour < end_time ? activeRule['before'] : activeRule['after'];
        
        $.each(time.options, function (index, option) {
            var timestamp = moment(option.from).valueOf();
            
            moment.unix(option.from).format('dddd DD MMMM ');
            
            // if (timestamp > rulestamp) {
                var day = moment.unix(option.from).format('dddd DD MMMM ');
           
                if (!formattedTimes[day]) {
                   formattedTimes[day] = [];
                }
           
               formattedTimes[day].push({
                   'id': time.id,
                   'from_readable': moment.unix(option.from).format('HH:mm'),
                   'from': option.from,
                   'to_readable': moment.unix(option.to).format('HH:mm'),
                   'to': option.to,
                   'type': time.type
               });
            // }
        });
    }
    
    return formattedTimes;
}

/**
 * Get the rules for the time options for each day.
 * 
 * @method _getTimeRules
 * @return {Object}
 */ 
function _getTimeRules() {
    return {
        1: {
            'before': moment().isoWeekday(1).add(1, 'd').hours(1).minutes(0).seconds(0).unix(),
            'after': moment().isoWeekday(1).add(2, 'd').hours(1).minutes(0).seconds(0).unix(),
        },
         2: {
            'before': moment().isoWeekday(2).add(1, 'd').hours(1).minutes(0).seconds(0).unix(),
            'after': moment().isoWeekday(2).add(2, 'd').hours(1).minutes(0).seconds(0).unix(),
        },
         3: {
           'before': moment().isoWeekday(3).add(1, 'd').hours(1).minutes(0).seconds(0).unix(),
            'after': moment().isoWeekday(3).add(2, 'd').hours(1).minutes(0).seconds(0).unix(),
        },
         4: {
            'before': moment().isoWeekday(4).add(1, 'd').hours(1).minutes(0).seconds(0).unix(),
            'after': moment().isoWeekday(4).add(2, 'd').hours(1).minutes(0).seconds(0).unix(),
        },
         5: {
           'before': moment().isoWeekday(5).add(3, 'd').hours(1).minutes(0).seconds(0).unix(),
            'after': moment().isoWeekday(5).add(4, 'd').hours(1).minutes(0).seconds(0).unix(),
        },
         6: {
           'before': moment().isoWeekday(6).add(3, 'd').hours(1).minutes(0).seconds(0).unix(),
            'after': moment().isoWeekday(6).add(3, 'd').hours(1).minutes(0).seconds(0).unix(),
        },
         7: {
            'before': moment().isoWeekday(6).add(2, 'd').hours(1).minutes(0).seconds(0).unix(),
            'after': moment().isoWeekday(6).add(2, 'd').hours(1).minutes(0).seconds(0).unix(),
        },
        
    };
}

/**
 * Render the time options for the provided type and options data.
 * 
 * @method _renderTimeOptions
 * @param {Array}       options         The time options data.
 * @param {String}      type            The type of provider (dhl/postnl).
 * @private
 */
function _renderTimeOptions(options, type) {
    for (var id in options) {
        var timeElements = [];
        var option = options[id];

        if (Object.keys(option).length > 0) {    
            selectElement = $('<select name="sale[shipping][method][time]" class="form-control shipping-method-time" data-type="' + type + '"></select>');
            
            for (var day in option) {
                var time = option[day][0];
                
                optionElement = $('<option value="' + id + '"></option>');
                optionElement.html('<span>' + day + '</span> ' + time.from_readable + ' - ' + time.to_readable);
                optionElement.data('time', time);
                optionElement.data('day', day);
                selectElement.append(optionElement);
            }
            
            timeElements.push(selectElement);
        }

        var container = $('#sale_shipping_method_id_' + id).closest('label').parent().find('.shipping-method-sub-options');
        
        if (!$('#sale_shipping_method_id_' + id).is(':checked')) {
            container.addClass('hide');
        }
        
        container.html('').append(timeElements);
        container.trigger('renderOptions');
    }
}

/**
 * Fill the pickup point input fields with the selected pickup point data.
 * 
 * @method setPickupPointFields
 */ 
function setPickupPointFields() {
    var el = $(this);
    var type = el.data('type');
    
    $('.shipping-option-field').val('');
    
    if (el.is(':checked')) {
        var point = el.data('point');
        
        for (var key in point) {
            var input = $('input[name="plugin[' + type + '_pickup_' + key + ']"]');
            
            if (input.length > 0) {
                input.val(point[key]);
            }
        }
    }
}

/**
 * Load the pickup point data for the provided type.
 * 
 * @method loadPickupPoints
 * @param {String}      type        The type (dhl/postnl).
 */ 
function loadPickupPoints(type) {
    var postalCode = $('#checkout-form #shipping_address_postal_code1').val().replace(/\s/g, '');
    var iso = $('#checkout-form #shipping_address_country_id option:selected').data('country-iso');
    var houseNumber = $('#shipping_address_house_number').val().replace(/\s/g, '');
    
    if (postalCode !== '' && iso !== '' && houseNumber !== '') {
         requests['point'][type] = $.ajax({
            url: '/' + type + '/points/' + postalCode + '/' + houseNumber,
            type: 'GET',
            beforeSend: function () {
                if (requests['point'][type]) {
                    requests['point'][type].abort();
                }
            },
            success: function (data) {
                var points = [];
                var method_id = null;
               
                if (data && data.points && data.id) {
                    method_id = data.id
                    points = data.points;
                }
                
                _renderPickupPoints(method_id, points, type);
            }
        });
    }
}

/**
 * Render the pickup points for the provided shipping method id.
 * 
 * @method _renderPickupPoints
 * @param {Number}      method_id       The shipping method id.
 * @param {Array}       points          The pickup point data.
 * @param {String}      type            The type of provider (dhl/postnl).
 * @private
 */
function _renderPickupPoints(method_id, points, type) {
    var pointElements = [];
    
    $.each(points, function (i, point) {
        var pointElement = $('<div class="radio af">');
        var pointsHtml = '';
        
        if (i >= 5) {
            pointElement.addClass('hide');
        }
        
        pointsHtml += '<label>'
        pointsHtml += '<input type="radio" class="shipping-method-point" name="sale[shipping][method][point]" value="' + point.spid + '" data-type="' + type + '" />';
        pointsHtml += '<div class="radio-button"></div>';
        pointsHtml += '<div class="checked-circle-text">';
        pointsHtml += point.name + '<br />' + point.address + " ," + point.postal_code + " " + point.city;
        pointsHtml += '</div>';
        pointsHtml += '</label><br/>';

        pointElement.html(pointsHtml);
        pointElement.find('input').data('point', point);
        pointElements.push(pointElement);
    });
    
    var container = $('#sale_shipping_method_id_' + method_id).closest('label').parent().find('.shipping-method-sub-options');
    
    if (!$('#sale_shipping_method_id_' + method_id).is(':checked')) {
        container.addClass('hide');
    }
    
    container.html('').append(pointElements);
    var locale = $('.checkout-header').data('af-locale');
    if (pointElements.length > 5 && (locale == 'nl' || locale == 'be' )) {
        container.append('<button class="btn btn-secondary btn-more-pickup-points">Toon alle afhaalpunten</button>');
    } else if(pointElements.length > 5 && locale == 'en') {
        container.append('<button class="btn btn-secondary btn-more-pickup-points">Show all Pickup Points</button>');
    }
    
    if (points.length < 1) {
        $('#sale_shipping_method_id_' + method_id).closest('label').parent().addClass('hide');
    } else {
        $('#sale_shipping_method_id_' + method_id).closest('label').parent().removeClass('hide');
    }
    
    
    container.trigger('renderOptions');
}