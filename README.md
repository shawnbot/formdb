# formdb
A simple HTML form data API with zero dependencies.

## What is this?
Have you ever wanted to treat an HTML form as a data store? Well, I have, and everything else that I came across had big dependencies like jQuery. formdb provides a simple API for getting and setting data in a plain old HTML form using plain old DOM JavaScript.

### An Example
```html
<form>
  <p><label>Name: <input type="text" name="name"></label></p>
  <p><label>Age:
    <select name="age">
      <option>young</option>
      <option>old</option>
      <option value="">prefer not to say</option>
    </select></label>
  </p>
  <p>Skills:
    <label><input name="skills" value="js"> JavaScript</label>
    <label><input name="skills" value="python"> Python</label>
    <label><input name="skills" value="ruby"> Ruby</label>
  </p>
</form>
<script src="formdb.js"></script>
<script>

// create a Form instance bound to the CSS selector 'form'
var form = formdb.Form('form');

// set some properties
form.set('name', 'Alf');
form.set('age', 'old');
form.set('skills', ['js', 'python']);
form.set('xxx', 'blah blah blah');

// the values of the properties will come directly from the form
form.get('name') === 'Joe';
form.get('xxx') === null;

// or set multiple properties
form.setData({
  name: 'E.T.',
  age: 'young',
  skills: ['ruby']
});

// get all of the input values
var data = form.getData();

// listen for changes to any property
form.on('change', function(data, e) {
});

// or listen for changes to a specific one a la Backbone
form.on('change:name', function(name, e) {
});

</script>
```

## Form objects
Form objects created with the `formdb.Form()` constructor can get and set data in their respective HTML form.

### `formdb.Form(selector)`
Create a new Form object bound to the HTML form identified by CSS `selector`. This works with or without the `new` keyword:

```js
var form = formdb.Form(selector);
// or
var form = new formdb.Form(selector);
```

#### <a name="form-get"></a> `form.get(key)`
Get the value of one or more fields with the name attribute equal to `key`. The returned value may differ depending on the type of the inputs:

* `checkbox` inputs (`<input type="checkbox" name>`):
  * if there's only one checked, the value will be the input's value **iff** it is checked (`true` if it has no value)
  * if there are more than one checkbox checked, the value will be an array of the the checked inputs' values
* `radio` inputs (`<input type="radio" name>`):
  * like checkboxes, the value will be undefined if the input is not checked; otherwise, the value will be the inputs value or `true` if it has none
* `select-one` inputs (`<select name>`):
  * Because select inputs without the `multiple` attribute cannot be unset, the value will always be the value of the input's selected option.
* `select-multiple` inputs (`<select multiple name>`):
  * Multi-select inputs will always be expressed as an array of option values. If no options are selected, the value will be an empty array.
* all other inputs are assumed to have a `value` property which is returned as-is.

#### <a name="form-set"></a> `form.set(key, value)`
Set the value of one or more fields with the name attribute equal to `key`. The rules for [form.get()](#form-get) apply here, with one notable exception:

* `checkbox` inputs (`<input type="checkbox" name>`):
  * If there are multiple checkboxes with the same name and only one is checked, the return value will be a string literal (the value of the checked box).


#### <a name="form-getData"></a> `form.getData()`
Returns an object with key/value pairs for each of the uniquely named inputs in the form.

#### <a name="form-setData"></a> `form.setData(data)`
Sets input values for each key in the object `data` according to the rules described in [form.set()](#form-set).


## Contributing
Wanna help make this better? Awesome! Here's how:

1. Fork this repo
2. Run `npm install --dev` to install the development dependencies
3. Run `npm test` to run the tests
4. Issue a pull request
5. Profit?
