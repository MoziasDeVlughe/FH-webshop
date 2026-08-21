(function($) {
    "use strict";
    
    var ObjectHelper = function() {}
    
    ObjectHelper.prototype = {
        constructor: ObjectHelper,
        
        /**
         * Initialize the properties on the provided object.
         * 
         * @method initializeProperties
         * @param {Object} obj
         * @param {Object} props
         * @private
         */ 
        initializeProperties: function(obj, props) {
            if (typeof obj !== 'object') {
                throw new Error('Expected first parameter to be an object!');
            }
            
            for(var key in (props || {})) {
                var camelizedKey = Afosto.helpers.StringHelper.camelize(key);
                
                if (obj.hasOwnProperty(camelizedKey)) {
                    obj[camelizedKey] = props[key];
                }
            }
        },
    }
    
    if (!this.helpers.ObjectHelper) {
        this.helpers.ObjectHelper = new ObjectHelper();
    }
}).apply(Afosto, [jQuery]);