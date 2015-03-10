(function(formdb) {
  'use strict';

  formdb.version = '0.1.0';

  var Form = function(element) {
    if (!(this instanceof formdb.Form)) return new formdb.Form(element);
    this._form = (typeof element === 'object')
      ? element
      : document.querySelector(element || 'form');
    this._inputs = '[name]';
    this._form.addEventListener('click', this._onClick.bind(this));
  };

  // where to stash a reference to the actual event listener
  var LISTENER_PROPERTY = '__formdb_listener';

  Form.prototype = {

    on: function(type, callback) {
      var self = this;
      if (type.match(/^change:/)) {
        var name = type.split(':').pop(),
            listener = callback[LISTENER_PROPERTY] = function listener(e) {
              if (e.target.name === name) {
                callback.call(self, e.target.value, e);
              }
            };
        this._form.addEventListener('change', listener);
      } else if (type === 'change') {
        var listener = callback[LISTENER_PROPERTY] = function listener(e) {
          callback.call(self, self.getData(), e);
        };
        this._form.addEventListener('change', listener);
      } else {
        this._form.addEventListener(type, callback);
      }
      return this;
    },

    off: function(type, callback) {
      if (type.match(/^change:/)) {
        type = 'change';
      }
      this._form.removeEventListener(type, callback[LISTENER_PROPERTY] || callback);
      return this;
    },

    // set the form data as an object
    getData: function() {
      var data = {};
      this.getInputs().forEach(function(input) {
        formdb.readInput(input, data);
      });
      return data;
    },

    // set the form data using an object
    setData: function(data) {
      this.getInputs().forEach(function(input) {
        formdb.writeInput(input, data);
      });
      return this;
    },

    // set a specific key from the form
    get: function(key) {
      var data = {};
      this.getInputs().forEach(function(input) {
        formdb.readInput(input, data);
      });
      return data[key];
    },

    // set a specific key/value
    set: function(name, value) {
      var data = {};
      data[name] = value;
      this.getInputs().forEach(function(input) {
        formdb.writeInput(input, data);
      });
      return this;
    },

    // get the inputs as an array
    getInputs: function(filter) {
      var inputs = slice(this._form.querySelectorAll(this._inputs));
      return filter ? inputs.filter(filter) : inputs;
    },

    getInputsByName: function(name) {
      return this.getInputs(function(input) {
        return input.name == name;
      });
    },

    _onClick: function(e) {
      var target = e.target;
      // if a submit button was pressed...
      if (target.type === 'submit') {
        // toggle the pressed flag of all submit inputs accordingly
        this.getInputs(function(input) {
          return input.type === 'submit';
        })
        .forEach(function(input) {
          input.pressed = (input === target);
        });
      }
    }

  }; // Form.prototype

  formdb.Form = Form;

  formdb.validInput = function(input) {
    return input.name && !input.disabled;
  };

  formdb.readInput = function(input, data) {
    if (!formdb.validInput(input)) return false;

    var value;

    switch (input.type) {
      case 'select-one':
        value = input.options[input.selectedIndex].value;
        break;

      case 'select-multiple':
        value = filter(input.querySelectorAll('option'), function(option) {
            return option.selected;
          })
          .map(function(option) {
            return option.value;
          });
        break;

      case 'checkbox':
        if (!input.checked) break;
        value = data[input.name];
        if (Array.isArray(value)) {
          value.push(input.value);
        } else if (typeof value !== 'undefined') {
          value = [value, input.value || true];
        } else {
          value = input.value || true;
        }
        break;

      case 'radio':
        if (input.checked) value = input.value;
        break;

      case 'submit':
        if (input.pressed) value = input.value;
        break;

      default:
        value = input.value;
    }

    if (typeof value !== 'undefined' && value !== '') {
      data[input.name] = value;
      return true;
    }

    return false;
  }; // formdb.readInput

  formdb.writeInput = function(input, data) {
    if (!formdb.validInput(input)) return false;

    var multiple = false,
        value = data[input.name],
        list = Array.isArray(value) ? value : [value];

    // coerce all values to strings for indexOf()
    list = list.map(String);

    switch (input.type) {
      case 'select-one':
        forEach(input.options, function(option) {
          // TODO lint flag
          option.selected = (option.value == value);
        });
        return true;

      case 'select-multiple':
        forEach(input.options, function(option) {
          option.selected = list.indexOf(option.value) > -1;
        });
        return true;

      case 'checkbox':
        input.checked = input.value
          ? list.indexOf(input.value) > -1
          : !!value;
        return true;

      case 'radio':
        input.checked = (value == input.value);
        return true;
    }

    input.value = value;
    return true;
  }; // formdb.writeInput

  /*
   * private utility functions
   */

  var ARRAY = [];
  // iterate over any array-like object
  function forEach(list, fn, that) {
    return ARRAY.forEach.call(list, fn, that || list);
  }

  // map any array-like object
  function map(list, fn, that) {
    return ARRAY.map.call(list, fn, that || list);
  }

  function filter(list, fn, that) {
    return ARRAY.filter.call(list, fn, that || list);
  }

  // slice any array-like object
  function slice(list, start, len) {
    return ARRAY.slice.call(list, start, len);
  }

  // extend an object
  function extend(a, b) {
    for (var i = 1; i < arguments.length; i += 1) {
      var o = arguments[i];
      if (!o || typeof o !== 'object') return;
      for (var k in o) a[k] = o[k];
    }
    return a;
  }

})(typeof module === 'object' ? module.exports : this.formdb = {});
