(function($) {
    "use strict";
    
    var InputHelper = function() {}

    InputHelper.prototype = {
        constructor: InputHelper,
        
        /**
         * Return the value for the provided input element based on the input type.
         * 
         * @method getValue
         * @param {HtmlObject} $input
         * @public
         */ 
        getValue: function($input) {
            var value;
            var type;
            
            if (!$input || $input.length === 0) {
                throw new Error('Invalid input element provided');
            }
            
            type = $input.attr('type');
            
            if (type === 'radio') {
                value = $input.prop('selected');
            } else if (type === 'checkbox') {
                value = $input.prop('checked');
            } else {
                value = $input.val();
            }
            
            return value;
        },
        
        /**
         * Convert the values of the inputs to an object based on the input name.
         * 
         * @method convertToObject
         * @param {HtmlObject} $inputs
         * @return {Object}
         * @public
         */ 
        convertToObject: function($inputs) {
            var obj = {};
            
            if (!$inputs) {
                throw new Error('Invalid input elements provided');
            }
            
            $inputs.each(function(idx, input) {
                var $input = $(input);
                var name = $input.attr('name').replace(/\w+\[/g, '[').replace(/\]\[/g, '.').replace(/(\[|\])/g, '');
                var parts = name.split('.');
                var value = this.getValue($input);
                var i = 0;
                
                parts.reduce(function(o, s) {
                    var key = Afosto.helpers.StringHelper.camelize(s);

                    i++;
                    
                    if (!o[key]) {
                        if (i < parts.length) {
                            o[key] = {};
                        } else {
                            o[key] = value;
                        }
                    }
                    
                    return o[key];
                }, obj);
            }.bind(this));
            
            return obj;
        }
    }
    
    if (!this.helpers.InputHelper) {   
        this.helpers.InputHelper = new InputHelper();
    }
}).apply(Afosto, [jQuery]);