/**
 * Unobtrusive form validation
 *      (c) vectoroc at gmail.com
 *
 * Apply these class names to form elements:
 *
 * required (not blank)
 * validate-number (a valid number)
 * validate-digits (digits only, spaces allowed.)
 * validate-alpha (letters only)
 * validate-alphanum (only letters and numbers)
 * validate-date (a valid date value)
 * validate-email (a valid email address)
 * validate-url (a valid URL)
 * validate-regexp (validate by regexp specified in attribute "pattern")
 *
 * Also, you can specify this attribute for text, passwird and textarea elements:
 * minlength="x" (where x is the minimum number of characters)
 *
 * @param {Boolean} mark if true elements wich fails validation will be marked 
 * with class 'validation-failed' or 'validation-passed'
 **/
 
Form.Methods.validate = function(form, mark){
    form = $(form);
    
    function filter(element){
        var tagName = element.tagName.toLowerCase();
        if (tagName == 'input' && ['button','submit'].include(element.type)) 
            return true;
        if (tagName == 'button') 
            return true;
    }
    
    var isValid = true;
    form.getElements().reject(filter).each(function(input){
        var res = input.validate();
        if (res) {
            if (mark) 
                input.removeClassName('validation-failed').addClassName('validation-passed');
        }
        else {
            if (mark) 
                input.removeClassName('validation-passed').addClassName('validation-failed');
            isValid = false;
        }
    });
    return isValid;
}

Form.Element.Methods.validate = function(){
    var validators = {
        "required": function(input){
            input = $(input);
            var value = input.getValue();
            var minlen = input.readAttribute('minlength');
            
            if (minlen) {
                return value.length ? value.length >= Math.abs(minlen) : false;
            }
            else 
                return !!value;
        },
        "validate-number": function(input){
            return $(input).getValue().toString().match(/^\d*$/);
        },
        "validate-digits": function(input){
            return $(input).getValue().toString().strip().match(/^\d*$/);
        },
        "validate-email": function(input){
            input = $(input)
            var value = input.getValue().toString();
            var isValid = value.match(/^\w{1,}[@][\w\-\.]{1,}([.]([\w\-]{1,})){1,3}$/);
            if (!input.hasClassName("required") && value.length == 0) {
                isValid = true;
            }
            return isValid;
        },
        "validate-url": function(input){
            var value = $(input).getValue().toString();
            var isValid = value.length == 0 || !!value.match(/^(http|https|ftp):\/\/(([A-Z0-9][A-Z0-9_-]*)(\.[A-Z0-9][A-Z0-9_-]*)+)(:(\d+))?\/?/i);
            return isValid;
        },
        "validate-alpha": function(input){
            return !!$(input).getValue().toString().match(/^[a-zA-Z]+$/);
        },
        "validate-alphanum": function(input){
            return !$(input).getValue().toString().match(/\W/);
        },
        "validate-date": function(input){
            return !!$(input).getValue().toString().match(/^\d{1,2}\.\d{2}\.\d{4}$/);
//            var d = new date($(input).getValue());
//            return !isNaN(d);
        },
        "validate-regexp": function(input){
            input = $(input);
            
            var value = input.getValue().toString();
            var re = new RegExp(input.readAttribute('pattern'));
            var isValid = re.test(value);
            
            if (!input.hasClassName("required") && value.length == 0) {
                isValid = true;
            }
            return isValid;
        }
    }
    
    
    var result = function(element, className){
        element = $(element);
        var isValid = true;
        
        element.addClassName(className || "").classNames().each(function(name){
            var validator = validators[name.toString().toLowerCase()];
            
            if (validator && !validator(element)) {
                isValid = false;
                throw $break;
            }
        });
        
        return isValid;
    };
    return result;
}
();

Element.addMethods();
