(function($) {
    "use strict";
    
    var StringHelper = function() {}

    StringHelper.prototype = {
        constructor: StringHelper,
        
        /**
         * Replace multiple values in a string.
         * Example: str: "Hello {name}", values: { "{name}" : "Afosto" } becomes "Hello Afosto".
         * 
         * @method replaceValues
         * @param {String} str
         * @param {array} values
         * @return {String}
         * @public
         */ 
        replaceValues: function(str, values) {
            var reg;
            
            if (typeof str !== 'string') {
                throw new Error('Expected first parameter to be of type String!');
            }
            
            if (typeof values !== 'object' || Object.keys(values).length <= 0) {
                throw new Error('The provided values parameter must be of type object and can\'t be an empty object');
            }
            
            reg = new RegExp(Object.keys(values).join("|"),"gi");
    
            return str.replace(reg, function(match) {
                return values[match] || '';
            });
        },
        
        /**
         * Camelize the provided string by replacing all hyphens and underscores and uppercase the first letter behind it.
         * Example: "hello_world" becomes "helloWorld"
         * 
         * @method camelize
         * @param {String} str
         * @return {String}
         * @public
         */ 
        camelize: function(str) {
            if (typeof str !== 'string') {
                throw new Error('Expected first parameter to be of type String!');
            }
            
            return str.replace(/(-|_)(.)/g, function(match) { 
                return match[1].toUpperCase(); 
            });
        },
        
        /**
         * First character of the provided string to uppercase.
         * 
         * @method capitalize
         * @param {String} str
         * @return {String}
         * @public
         */ 
        capitalize: function(str) {
            return str.substr(0, 1).toUpperCase() + str.substr(1);
        }
    }
    
    if (!this.helpers.StringHelper) {   
        this.helpers.StringHelper = new StringHelper();
    }
}).apply(Afosto, [jQuery]);