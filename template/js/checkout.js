(function() {
    var Checkout = this.checkout.Checkout = function($element, options) {
        this.$element = $element;
        this.options = $.extend({}, this._defaults, options);
        
        this._initialize();
        this._registerEventListeners();
    }
    
    Checkout.prototype = {
        constructor: Checkout,
        
        /**
         * The default values.
         * @type {Object}
         * @private
         */ 
        _defaults: {
            stepped: false,
            btnStepIdentifier: '.btn-checkout-step',
            shippingMethodContainerIdentifier: '.shipping-method',
            shippingMethodIdentifier: ':input',
            shippingAddressIdentifier: ':input[name^="shipping[address]"]'
        },
        
        /**
         * Initialize the (default) properties of the checkout.
         * 
         * @method initialize
         * @private
         */ 
        _initialize: function() {},
        
        /**
         * Register the event listeners on the checkout element.
         * 
         * @method _registerEventListeners
         * @private
         */ 
        _registerEventListeners: function() {
            this._registerSteppedEventListeners();
            this._registerShippingAddressEventListeners();
            this._registerShippingMethodEventListeners();
        },
        
        /**
         * Register the event listeners for a stepped checkout.
         * 
         * @method _registerSteppedEventListeners
         * @private
         */ 
        _registerSteppedEventListeners: function() {
            if (this.options.stepped) {
                this.$element.find(this.options.btnStepIdentifier).on('click', function(e) {
                    this.$element.trigger('stepchange.Checkout', $(e.target).data('step-type'));
                }.bind(this));
            }
        },
        
        /**
         * Register the event listeners for the shipping address of the checkout.
         * 
         * @method _registerShippingAddressEventListeners
         * @private
         */ 
        _registerShippingAddressEventListeners: function() {
            this.$element.find(this.options.shippingAddressIdentifier).on('change', function() {
                this.$element.trigger('shippingaddresschange.Checkout');
            }.bind(this));
        },
        
        /**
         * Register the shipping method event listeners.
         * 
         * @method _registerShippingMethodEventListeners
         * @private
         */ 
        _registerShippingMethodEventListeners: function() {
            this.$element.find('input[name="sale[shipping][method][id]"]').on('change', function(e) {
                var $target = $(e.target);
                this.$element.trigger('shippingmethodchange.Checkout', $target, $target.attr('value'));
            }.bind(this));
        },
        
        /**
         * Return the checkout element.
         * 
         * @method getElement
         * @return {HtmlObject}
         * @public
         */ 
        getElement: function() {
            return this.$element;
        },
        
        /**
         * Return the shipping address input data as an object.
         * 
         * @method getShippingAddressData
         * @return {Object}
         * @public
         */ 
        getShippingAddressData: function() {
            var shippingAddressData = Afosto.helpers.InputHelper.convertToObject(this.$element.find(this.options.shippingAddressIdentifier));
            return shippingAddressData.address || {};
        },
        
        /**
         * Return the iso of the selected shipping country.
         * 
         * @method getShippingCountryIso
         * @return {String}
         * @public
         */ 
        getShippingCountryIso: function() {
            return this.$element.find(':input[name="shipping[address][country][id]"] option:selected').data('country-iso');
        },
        
        /**
         * Return the best delivery time.
         * 
         * @method getBestDeliveryTime
         * @return {Number}
         * @public
         */ 
        getBestDeliveryTime: function() {
            return this.$element.data('best-delivery-time');
        }
    }
    
    $.fn.checkout = function(options) {
        this.each(function() {
            if (!$.data(this, 'Checkout')) {
                $.data(this, 'Checkout', new Checkout($(this), options));
            }
        });

        return this;
    }
}).apply(Afosto, [jQuery]);