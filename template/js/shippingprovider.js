(function($) {
    "use strict";
    
    // Store the default _initialize method.
    Afosto.checkout.Checkout.prototype._defaultInitialize = Afosto.checkout.Checkout.prototype._initialize;
    
    /**
     * Initialize the default functionality and properties of the checkout.
     * 
     * @method _initialize
     * @private
     */
    Afosto.checkout.Checkout.prototype._initialize = function() {
        this._defaultInitialize();
        this._initializeShippingProviders();
    };
    
    /**
     * Initialize the shipping providers.
     * 
     * @method _initializeShippingProviders
     * @private
     */ 
    Afosto.checkout.Checkout.prototype._initializeShippingProviders = function() {
        var providers = this.options.providers || this.$element.data('providers');
        this.setShippingProviders(providers);
    };
    
    /** Set the shipping providers used by the checkout.
     * 
     * @method setShippingProviders
     * @param {array|string} shippingProviderTypes
     * @param {Object} providerSettings
     * @public
     */ 
    Afosto.checkout.Checkout.prototype.setShippingProviders = function(shippingProviderTypes, providerSettings) {
        var providerTypes = shippingProviderTypes;
        var providerOptions = providerSettings || {
            shippingMethodContainerIdentifier: this.options.shippingMethodContainerIdentifier,
            shippingMethodIdentifier: this.options.shippingMethodIdentifier
        };
        
        if (typeof providerTypes !== 'string' && !Array.isArray(providerTypes)) {
            throw new Error('The provided shipping provider types must be a String or an Array!');
        }
        
        this._shippingProviders = [];
        
        if (typeof providerTypes === 'string') {
            providerTypes = providerTypes.split(',');
        }
        
        if (providerTypes && providerTypes.length > 0) {
            providerTypes.forEach(function(type) {
                this._shippingProviders[type] = new Afosto.checkout.ShippingProvider(type, this, (providerOptions[type] || providerOptions));
            }.bind(this));
        }
    };
        
    /**
     * Return the shipping providers used by the checkout.
     * 
     * @method getShippingProviders
     * @return {array}
     * @public
     */ 
    Afosto.checkout.Checkout.prototype.getShippingProviders = function() {
        return this._shippingProviders;
    };
        
    /**
     * Return the shipping provider for the provided shipping provider type.
     * 
     * @method getShippingProvider
     * @param {String} providerType
     * @return {Object|undefined}
     * @public
     */ 
    Afosto.checkout.Checkout.prototype.getShippingProvider = function(providerType) {
        return this.getShippingProviders()[providerType];
    };

    var ShippingProvider = this.checkout.ShippingProvider = function(type, checkout, options) {
        this.type = type;
        this.checkout = checkout;
        this.$checkout = null;
        this._timeOptionRequest = null;
        this._timeOptions = [];
        this._pickupPointRequest = null;
        this._pickupPoints = [];
        this.options = $.extend({}, this.defaults, options);
        
        this._initialize();
        this._registerEventListeners();
    }
    
    ShippingProvider.prototype = {
        constructor: ShippingProvider,
        
        /**
         * The default values.
         * @type {Object}
         * @public
         */ 
        defaults: {
          fieldContainerId: 'shipping-provider-fields',
          shippingMethodListContainerIdentifier: '#step-2 .panel',
          shippingMethodContainerIdentifier: '.shipping-method',
          shippingMethodIdentifier: ':input',
          pickupPointUriTemplate: '/{type}/points/{postcode}/{houseNumber}',
          pickupPointElementName: 'sale[shipping][method][{shippingMethodId}][point]',
          timeOptionUriTemplate:'/{type}/time/{postcode}/{houseNumber}/{timestamp}',
          timeOptionElementName: 'sale[shipping][method][{shippingMethodId}][time]',
          timeOptionClassNames: ['form-control'],
          optionsContainerElementTag: '<div/>',
          optionsContainerClassNames: ['shipping-method-sub-options'],
          maxPickupPoints: 5,
          maxTimeOptions: null,
          moreOptionsElementTag: '<a/>',
          moreOptionsClassNames: ['shipping-method-more'],
          moreOptionsLabel: 'Show more options',
          hideShippingMethodOnEmpty: true,
          showOptionsOnMethodSelect: true,
          autoRenderOptions: true,
          autoSelectFirstOption: true,
          netherlandsOnly: false,
          loadingOverlayClassName: 'loading-ajax',
        },
        
        /**
         * Initialize the base options and functionality.
         * 
         * @method _intialize
         * @private
         */ 
        _initialize: function() {
          if (this.checkout) {
              // set a reference to the checkout element.
              this.$checkout = this.checkout.getElement();
          }  
        },
        
        /**
         * Register the event listeners for the shipping provider.
         * 
         * @method _registerEventListeners
         * @private
         */ 
        _registerEventListeners: function() {
            if (this.checkout) {
                if (this.checkout.options.stepped) {
                    this.$checkout.on('stepchange.Checkout', function(e, stepType) {
                        if (stepType === 'shipping') {
                            this._fetchHandler();
                        }
                    }.bind(this));
                } else {
                    this.$checkout.on('shippingaddresschange.Checkout', function(e) {
                        this._fetchHandler();
                    }.bind(this));
                }
                
                this.$checkout.on('shippingmethodchange.Checkout', function(e, method) {
                    this._clearShippingProviderFields();
                    
                    if (this.options.showOptionsOnMethodSelect) {
                        this._showOptionsHandler($(method).attr('value'));
                    }
                    
                    if (this.options.autoSelectFirstOption) {
                        this._selectProviderOption($(method).attr('value'));
                    }
                }.bind(this));
                
                this.$checkout.on('provideroptionchange.ShippingProvider', function(e, providerOption) {
                    this._providerOptionChangeHandler(providerOption);
                }.bind(this));
            }
        },
        
        /**
         * Handler for fetching the pickup points and time options.
         * 
         * @method _fetchHandler
         * @private
         */ 
        _fetchHandler: function() {
            var address = this.checkout.getShippingAddressData();
            var timestamp = this.checkout.getBestDeliveryTime();
            
            if (timestamp) {
                timestamp = moment.unix(timestamp);
                timestamp = timestamp.startOf('day').unix();
            }
            
            if (!this.options.netherlandsOnly || (this.options.netherlandsOnly && parseInt(address.country.id, 10) === 1)) {
                if (address.postalCode && address.houseNumber) { 
                    this.fetchPickupPoints(address.postalCode, address.houseNumber);
                    this.fetchTimeOptions(address.postalCode, address.houseNumber, timestamp);
                } else if (this.options.autoRenderOptions === true) {
                    this.renderPickupPoints();
                    this.renderTimeOptions();
                }
            }
        },
        
        /**
         * Handler for the visibility of the provider options.
         * 
         * @method _showOptionsHandler
         * @param {Number} shippingMethodId
         * @private
         */ 
        _showOptionsHandler: function(shippingMethodId) {
            var hiddenClassName = Afosto.defaults.settings.hiddenClassName;
            var points = this.getPickupPointsForMethod(shippingMethodId) || [];
            var times = this.getTimeOptionsForMethod(shippingMethodId) || [];
            var $targetContainer;
            var $optionsContainer;
            
            this.$checkout.find('.' + this.options.optionsContainerClassNames.join(' .') + '[data-type="' + this.type + '"]').addClass(hiddenClassName);
            
            if (points.length > 0 || times.length > 0) {
                $targetContainer = $(this.options.shippingMethodContainerIdentifier + '[data-id="' + shippingMethodId + '"]');
                $optionsContainer = $targetContainer.find('> .' + this.options.optionsContainerClassNames.join(' .'));
                
                if ($targetContainer.find(this.options.shippingMethodIdentifier).is(':checked')) {
                    $optionsContainer.removeClass(hiddenClassName);
                } else {
                    $optionsContainer.addClass(hiddenClassName);
                }
            }
        },
        
        /**
         * Handler for setting the shipping provider fields when a provider option is selected.
         * 
         * @method _providerOptionChangeHandler
         * @param {PickupPoint|TimeOption} providerOption
         * @private
         */ 
        _providerOptionChangeHandler: function(providerOption) {
            if (providerOption.provider.type === this.type) {
                var $container = this.$checkout.find('#' + this.options.fieldContainerId);
            
                if ($container.length === 0) {
                    $container = $('<div>', { id: this.options.fieldContainerId }).appendTo(this.$checkout);
                } else {
                    $container.html('');
                }
                
                $container.html(providerOption.getFieldElements());
            }
        },
        
        /**
         * Clear the input fields of the current shipping provider.
         * 
         * @method _clearShippingProviderFields
         * @private
         */ 
        _clearShippingProviderFields: function() {
            if (this.type) {
                this.$checkout.find('input[name^="plugin[' + this.type + '"]').val('');
            }
        },
        
        /**
         * Select the first provider option if no provider option is selected.
         * 
         * @method _selectProviderOption
         * @param {Number} shippingMethodId
         * @private
         */ 
        _selectProviderOption: function(shippingMethodId) {
            var $input;
            var $checkedInput;
            var $optionsContainer;
            var points = this.getPickupPointsForMethod(shippingMethodId) || [];
            var times = this.getTimeOptionsForMethod(shippingMethodId) || [];
            var $targetContainer = $(this.options.shippingMethodContainerIdentifier + '[data-id="' + shippingMethodId + '"]');
                
            if ($targetContainer.find(this.options.shippingMethodIdentifier).is(':checked') && (points.length > 0 || times.length > 0)) {
                $optionsContainer = $targetContainer.find('> .' + this.options.optionsContainerClassNames.join(' .'));
                $input = $optionsContainer.find(':input:first');
                
                if ($input.is('input:radio')) {
                    $checkedInput = $optionsContainer.find('input:radio:checked'); 
                    
                    if ($checkedInput.length === 0) {
                        $input.prop('checked', true).change();
                    } else {
                        $checkedInput.change();
                    }
                } else if ($input.is('select')) {
                    $input.change();
                }
            }
        },
        
        /**
         * Return the pickup point url based on the pickup point url template.
         *
         * @method getPickupPointUri
         * @param {String} postcode
         * @param {String} houseNumber
         * @return {String}
         * @public
         */ 
        getPickupPointUri: function(postcode, houseNumber) {
            return Afosto.helpers.StringHelper.replaceValues(this.options.pickupPointUriTemplate, {
                '{type}': this.type,
                '{postcode}': postcode,
                '{houseNumber}': houseNumber
            });
        },
        
        /**
         * Fetch the pickup points of the provider for the provided postcode and house number.
         * 
         * @method fetchPickupPoints
         * @param {String} postcode
         * @param {String} houseNumber
         * @public
         */ 
        fetchPickupPoints: function(postcode, houseNumber) {
            var $targetPanel;
            var $overlayClassName;
            
            $targetPanel = $(this.options.shippingMethodListContainerIdentifier);
            $overlayClassName = this.options.loadingOverlayClassName;
            
            if ((!postcode || postcode.length === 0) || (!houseNumber || houseNumber.length === 0)) {
                return;
            }
            
            this._pickupPointRequest = $.ajax({
                url: this.getPickupPointUri(postcode, houseNumber),
                type: 'GET',
                beforeSend: function () {
                    $targetPanel.addClass($overlayClassName);
                    if (this._pickupPointRequest) {
                        this._pickupPointRequest.abort();
                    }
                }.bind(this),
                success: function(results) {
                    this.setPickupPoints(results);
                    
                    if (this.options.autoRenderOptions === true) {
                        this.renderPickupPoints();
                    }
                    $targetPanel.removeClass($overlayClassName);
                }.bind(this),
                error: function(error) {
                    $targetPanel.removeClass($overlayClassName);
                }.bind(this),
            });
        },
        
        /**
         * Render the pickup point elements.
         * 
         * @method renderPickupPoints
         * @public
         */ 
        renderPickupPoints: function() {
            var shippingMethodId;
            var hiddenClassName = Afosto.defaults.settings.hiddenClassName;
            var iso = this.checkout.getShippingCountryIso();
            
            for (shippingMethodId in this.getPickupPoints()) {
                var pickupPoints;
                var $targetContainer;
                var $containerEl;
                
                pickupPoints = this.getPickupPointsForMethod(shippingMethodId);
                pickupPoints = this.filterPickupPoints(pickupPoints);
                
                if (this.options.maxPickupPoints && (pickupPoints.length > this.options.maxPickupPoints)) {
                    pickupPoints = pickupPoints.slice(0, this.options.maxPickupPoints);
                }
                
                $targetContainer = $(this.options.shippingMethodContainerIdentifier + '[data-id="' + shippingMethodId + '"][data-country="NL"]');
                $targetContainer.find('.' + this.options.optionsContainerClassNames.join(' .')).remove();
                
                $containerEl = $(this.options.optionsContainerElementTag, {
                    'class': this.options.optionsContainerClassNames.join(' '),
                    'html': this._getPickupPointElements(pickupPoints)
                }).attr('data-type', this.type);
                
                if ((this.options.hideShippingMethodOnEmpty && pickupPoints.length === 0) || $targetContainer.data('country') !== iso) {
                    $targetContainer.addClass(hiddenClassName);
                    $targetContainer.find(this.options.shippingMethodIdentifier + '[value="' + shippingMethodId + '"]').prop('checked', false);
                } else {
                    $targetContainer.removeClass(hiddenClassName);
                }
                
                if (this.options.showOptionsOnMethodSelect && !$targetContainer.find(this.options.shippingMethodIdentifier).is(':checked')) {
                    $containerEl.addClass(hiddenClassName);
                }
                
                $containerEl
                    .append(this._getMoreOptionsElement(shippingMethodId))
                    .appendTo($targetContainer);
                    
                this._selectProviderOption(shippingMethodId);
            }
        },
        
        /**
         * Function that could be used for filtering the pickup points that should be rendered, based on certain conditions.
         * 
         * @method filterPickupPoints
         * @param {Array} pickupPoints
         * @return {Array}
         * @public
         */ 
        filterPickupPoints: function(pickupPoints) {
            return pickupPoints;
        },
        
        /**
         * Show the rest of the pickup points after the maxPickupPoints option.
         * 
         * @method _showMorePickupPoints
         * @param {String} shippingMethodId
         * @param {HtmlObject} $showMoreEl
         * @private
         */ 
        _showMorePickupPoints: function(shippingMethodId, $showMoreEl) {
            var pickupPoints = this.getPickupPointsForMethod(shippingMethodId);
            
            pickupPoints = this.filterPickupPoints(pickupPoints);
            pickupPoints = pickupPoints.slice(this.options.maxPickupPoints, pickupPoints.length);
            
            $showMoreEl
                .addClass(Afosto.defaults.settings.hiddenClassName)
                .before(this._getPickupPointElements(pickupPoints));
        },
        
        /**
         * Return the show more element.
         * 
         * @method _getMoreOptionsElement
         * @param {Number} shippingMethodId
         * @return {HtmlObject}
         * @private
         */ 
        _getMoreOptionsElement: function(shippingMethodId) {
            return $(this.options.moreOptionsElementTag, { 
                'class': this.options.moreOptionsClassNames.join(' '),
                'html': this.options.moreOptionsLabel 
            }).on('click', function(e) {
                this._showMorePickupPoints(shippingMethodId, $(e.target));
            }.bind(this));  
        },
        
        /**
         * Return the elements of the pickup points.
         * 
         * @method _getPickupPointElements
         * @param {array} pickupPoints
         * @return {array}
         * @private
         */ 
        _getPickupPointElements: function(pickupPoints) {
            return pickupPoints.map(function(pickupPoint) {
                return pickupPoint.getElement();
            });
        },
        
        /**
         * Set the pickup points of the provider.
         * 
         * @method setPickupPoints
         * @param {array} pickupPoints The pickup point data.
         * @public
         */ 
        setPickupPoints: function(pickupPoints) {
            this._pickupPoints = [];
            
            if (pickupPoints && pickupPoints.points) {
                this._pickupPoints[pickupPoints.id] = [];
                
                pickupPoints.points.forEach(function(pickupPoint) {
                    var prop = $.extend({}, pickupPoint, {
                        provider: this
                    });
                    
                    var options = {
                        inputName: Afosto.helpers.StringHelper.replaceValues(this.options.pickupPointElementName, {
                            '{shippingMethodId}': pickupPoints.id  
                        })
                    };
                    
                    var Point = Afosto.checkout[Afosto.helpers.StringHelper.capitalize(this.type) + 'PickupPoint'] || PickupPoint;
                    this._pickupPoints[pickupPoints.id].push(new Point(prop, options)); 
                }.bind(this));
            }
        },
        
        /**
         * Return the pickup points of the provider.
         * 
         * @method getPickupPoints
         * @return {Array}
         * @public
         */ 
        getPickupPoints: function() {
          return this._pickupPoints;  
        },
        
        /**
         * Return the pickup points for a provided shipping method id.
         * 
         * @method getPickupPointsForMethod
         * @param {Number} id
         * @return {Array}
         * @public
         */ 
        getPickupPointsForMethod: function(id) {
            return this.getPickupPoints()[id];
        },
        
        /**
         * Return the time option url based on the time option url template.
         *
         * @method getTimeOptionUri
         * @param {String} postcode
         * @param {String} houseNumber
         * @param {Number} timestamp
         * @return {String}
         * @public
         */ 
        getTimeOptionUri: function(postcode, houseNumber, timestamp) {
            return Afosto.helpers.StringHelper.replaceValues(this.options.timeOptionUriTemplate, {
                '{type}': this.type,
                '{postcode}': postcode,
                '{houseNumber}': houseNumber,
                '{timestamp}': (timestamp || '')
            });
        },
        
        /**
         * Fetch the time options of the provider for the provided postcode and house number.
         * 
         * @method fetchTimeOptions
         * @param {String} postcode
         * @param {String} houseNumber
         * @param {Number} timestamp
         * @public
         */ 
        fetchTimeOptions: function(postcode, houseNumber, timestamp) {
            if ((!postcode || postcode.length === 0) || (!houseNumber || houseNumber.length === 0)) {
                return;
            }
            
            this._timeOptionRequest = $.ajax({
                url: this.getTimeOptionUri(postcode, houseNumber, timestamp),
                type: 'GET',
                beforeSend: function () {
                    if (this._timeOptionRequest) {
                        this._timeOptionRequest.abort();
                    }
                },
                success: function(results) {
                    this.setTimeOptions(results.methods);
                    
                    if (this.options.autoRenderOptions === true) {
                        this.renderTimeOptions();
                    }
                }.bind(this)
            });
        },
        
        /**
         * Set the time options of the provider.
         * 
         * @method setTimeOptions
         * @param {array} timeOptions The time option data.
         * @public
         */
        setTimeOptions: function(timeOptions) {
            if (!Array.isArray(timeOptions)) {
                throw new Error('The provided time options must be an array!');
            }
            
            this._timeOptions = [];
            
            if (timeOptions && timeOptions.length > 0) {
                timeOptions.forEach(function(timeOption) {
                   this._timeOptions[timeOption.id] = [];
                   
                   timeOption.options.forEach(function(option) {
                       var prop = $.extend({}, option, {
                           provider: this
                       });
                       
                       var Time = Afosto.checkout[Afosto.helpers.StringHelper.capitalize(this.type) + 'TimeOption'] || TimeOption;
                       this._timeOptions[timeOption.id].push(new Time(prop));
                   }.bind(this));
                }.bind(this));
            }
        },
        
        /**
         * Return the time options of the provider.
         * 
         * @method getTimeOptions
         * @return {Array}
         * @public
         */ 
        getTimeOptions: function() {
            return this._timeOptions;
        },
        
        /**
         * Get time option for the provided shipping method id.
         * 
         * @method getTimeOptionsForMethod
         * @param {Number} id
         * @return {Array}
         * @public
         */ 
        getTimeOptionsForMethod: function(id) {
            return this.getTimeOptions()[id];
        },
        
        /**
         * Render the time option elements.
         * 
         * @method renderTimeOptions
         * @public
         */ 
        renderTimeOptions: function() {
            var hiddenClassName = Afosto.defaults.settings.hiddenClassName;
            var iso = this.checkout.getShippingCountryIso();
            
            for (var shippingMethodId in this.getTimeOptions()) {
                var timeOptions;
                var $targetContainer;
                var $containerEl;
                
                timeOptions = this.getTimeOptionsForMethod(shippingMethodId);
                timeOptions = this.filterTimeOptions(timeOptions);
                
                if (this.options.maxTimeOptions && (timeOptions.length > this.options.maxTimeOptions)) {
                    timeOptions = timeOptions.slice(0, this.options.maxTimeOptions);
                }
                
                $targetContainer = $(this.options.shippingMethodContainerIdentifier + '[data-id="' + shippingMethodId + '"]');
                $targetContainer.find('.' + this.options.optionsContainerClassNames.join(' .')).remove();
                
                $containerEl = $(this.options.optionsContainerElementTag, {
                    'class': this.options.optionsContainerClassNames.join(' '),
                    'html': this._getTimeOptionsContainerElement(shippingMethodId, timeOptions),
                })
                .attr('data-type', this.type);
                
                if ((this.options.hideShippingMethodOnEmpty && timeOptions.length === 0) || $targetContainer.data('country') !== iso) {
                    $targetContainer.addClass(hiddenClassName);
                } else {
                    $targetContainer.removeClass(hiddenClassName);
                }
                
                if (this.options.showOptionsOnMethodSelect && !$targetContainer.find(this.options.shippingMethodIdentifier).is(':checked')) {
                    $containerEl.addClass(hiddenClassName);
                }
                
                $containerEl.appendTo($targetContainer);
                
                this._selectProviderOption(shippingMethodId);
            }
        },
        
        /**
         * Function that could be used for filtering the time options that should be rendered, based on certain conditions.
         * 
         * @method filterTimeOptions
         * @param {Array} timeOptions
         * @return {Array}
         * @public
         */  
        filterTimeOptions: function(timeOptions) {
            return timeOptions;
        },
        
        /**
         * Return the elements of the provided time options.
         * 
         * @method _getTimeOptionElements
         * @param {array} timeOptions
         * @return {array}
         * @private
         */ 
        _getTimeOptionElements: function(timeOptions) {
            return $.map(timeOptions, function(timeOption) {
                return timeOption.getElement();
            });
        },
        
        /**
         * Return the container element for the time options.
         * 
         * @method _getTimeOptionsContainerElement
         * @param {Number} shippingMethodId
         * @param {Array} timeOptions
         * @private
         */ 
        _getTimeOptionsContainerElement: function(shippingMethodId, timeOptions) {
            return $('<select/>', { 
                'class': this.options.timeOptionClassNames.join(' '),
                'html': this._getTimeOptionElements(timeOptions),
                'name': Afosto.helpers.StringHelper.replaceValues(this.options.timeOptionElementName, {
                    '{shippingMethodId}': shippingMethodId 
                })
            })
            .on('change', function(e) {
                this.$checkout.trigger('provideroptionchange.ShippingProvider', $(e.target).find('option:selected').data('time-option'));
            }.bind(this));
        }
    }
    
    var TimeOption = this.checkout.TimeOption = function(props, options) {
        this.fieldType = 'time';
        this.from = null;
        this.to = null;
        this.provider = null;
        this.options = $.extend({}, this._defaults, options);
        
        // initialize the properties.
        Afosto.helpers.ObjectHelper.initializeProperties(this, props);
    }
    
    TimeOption.prototype = {
        constructor: TimeOption,
        
        /**
         * The default values.
         * @type {Object}
         * @private
         */ 
        _defaults: {
            contentTemplate: '{day} {from} - {to}',
            formats: {
                day: 'dddd DD MMMM',
                from: 'HH:mm',
                to: 'HH:mm',
            },
            requiredFields: ['from']
        },
        
        /**
         * Return the content for the time option element based on the template for the content.
         * 
         * @method getContent
         * @return {String}
         * @public
         */ 
        getContent: function() {
            var formats = this.options.formats;
            return Afosto.helpers.StringHelper.replaceValues(this.options.contentTemplate, {
                '{day}': moment.unix(this.from).format(formats.day),
                '{from}': moment.unix(this.from).format(formats.from),
                '{to}': moment.unix(this.to).format(formats.to),
            });
        },
        
        /**
         * Return the value form the time option element.
         * 
         * @method getValue
         * @return {Number}
         * @public
         */ 
        getValue: function() {
            return this.from;
        },
        
        /**
         * Return the element of the time option.
         * 
         * @method getElement
         * @return {HTMLObject}
         * @public
         */ 
        getElement: function() {
            return $('<option/>', { 
                'html': this.getContent(),
                'value': this.getValue() 
            }).data('time-option', this);
        },
        
        /**
         * Return the field elements for the time option element.
         * 
         * @method getFieldElements
         * @return {Array}
         * @public
         */ 
        getFieldElements: function() {
            var elements = [];
            var fields = this.options.requiredFields || [];
            
            fields.forEach(function(field) {
                var fieldProperty = Afosto.helpers.StringHelper.camelize(field);
                
                if (this.hasOwnProperty(fieldProperty)) {
                    elements.push($('<input/>', {
                        type: 'hidden',
                        name: 'plugin[' + this.provider.type + '_time_' + field + ']',
                        value: this[fieldProperty]
                    }));
                }
            }.bind(this));
            
            return elements;
        }
    }
    
    var PickupPoint = this.checkout.PickupPoint = function(props, options) {
        this.fieldType = 'pickup';
        this.address = null;
        this.city = null;
        this.name = null;
        this.openings = [];
        this.postalCode = null;
        this.spid = null;
        this.provider = null;
        this.options = $.extend({}, this._defaults, options);
        
        // initialize the properties.
        Afosto.helpers.ObjectHelper.initializeProperties(this, props);
    }
    
    PickupPoint.prototype = {
        constructor: PickupPoint,
        
        /**
         * The default values.
         * @type {Object}
         * @private
         */ 
        _defaults: {
          classNames: ['radio', 'af'],
          contentClassNames: ['checked-circle-text'],
          contentTemplate: '{name}<br/>{address} ,{postalcode} {city}',
          inputName: 'sale[shipping][method][point]',
          requiredFields: ['spid', 'name', 'address', 'postal_code', 'city']
        },
        
        /**
         * Return the content for pickup point element based on the template for the content.
         * 
         * @method getContent
         * @return {String}
         * @public
         */ 
        getContent: function() {
            return Afosto.helpers.StringHelper.replaceValues(this.options.contentTemplate, {
                '{name}': this.name,
                '{address}': this.address,
                '{city}': this.city,
                '{postalcode}': this.postalCode
            });
        },
        
        /**
         * Return the value for the pickup point element.
         * 
         * @method getValue
         * @return {String}
         * @public
         */ 
        getValue: function() {
            return this.spid;
        },
        
        /**
         * Return the element of the pickup point.
         * 
         * @method getElement
         * @return {HTMLObject}
         * @public
         */ 
        getElement: function() {
            return $('<div/>', { 'class': this.options.classNames.join(' ') })
                .append(
                    $('<label/>').append([
                        this._getInputElement(),
                        $('<div/>', { 'class': 'radio-button' }),
                        $('<div/>', {
                            'class': this.options.contentClassNames.join(' '),
                            'html': this.getContent() 
                        })
                    ])
                );
        },
        
        /**
         * Return the input element of the pickup point element.
         * 
         * @method _getInputElement
         * @return {HtmlObject}
         * @private
         */ 
        _getInputElement: function() {
            return $('<input/>', {
                'type': 'radio',
                'name': this.options.inputName,
                'value': this.getValue()
            })
            .on('change', function(e) {
                this.provider.$checkout.trigger('provideroptionchange.ShippingProvider', this);
            }.bind(this));
        },
        
        /**
         * Return the field elements for the pickup point element.
         * 
         * @method getFieldElements
         * @return {Array}
         * @public
         */ 
        getFieldElements: function() {
            var elements = [];
            var fields = this.options.requiredFields || [];
            
            fields.forEach(function(field) {
                var fieldProperty = Afosto.helpers.StringHelper.camelize(field);
                
                if (this.hasOwnProperty(fieldProperty)) {
                    elements.push($('<input/>', {
                        type: 'hidden',
                        name: 'plugin[' + this.provider.type + '_pickup_' + field + ']',
                        value: this[fieldProperty]
                    }));
                }
            }.bind(this));
            
            return elements;
        }
    }
    
    var PostnlPickupPoint = this.checkout.PostnlPickupPoint = function() {
        this.street = null;
        this.housenumber = null;
        this.housenumberSuffix = null;
        
        Afosto.checkout.PickupPoint.apply(this, arguments);
    };
    
    PostnlPickupPoint.prototype = $.extend({}, PickupPoint.prototype, {
        constructor: PostnlPickupPoint,
        
        /**
         * The default values.
         * @type {Object}
         * @private
         */ 
        _defaults: $.extend({}, PickupPoint.prototype._defaults, {
          contentTemplate: '{name}<br/>{street} {housenumber}{housenumberSuffix} ,{postalcode} {city}',
          requiredFields: ['spid', 'name', 'street', 'housenumber', 'housenumber_suffix', 'postal_code', 'city']
        }),
        
         /**
         * Return the content for pickup point element based on the template for the content.
         * 
         * @method getContent
         * @return {String}
         * @public
         */ 
        getContent: function() {
            return Afosto.helpers.StringHelper.replaceValues(this.options.contentTemplate, {
                '{name}': this.name,
                '{street}': this.street,
                '{housenumber}': this.housenumber,
                '{housenumberSuffix}': this.housenumberSuffix,
                '{city}': this.city,
                '{postalcode}': this.postalCode
            });
        }
    });
}).apply(Afosto, [jQuery]);