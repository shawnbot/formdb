var jsdom = require('jsdom'),
    formdb = require('../formdb'),
    assert = require('assert');

describe('formdb.Form', function() {

  var window,
      document,
      root,
      form,
      createForm = function(done) {
        jsdom.env('<form></form>', [], function(errors, win) {
          window = win;
          document = win.document;
          root = document.querySelector('form');
          form = new formdb.Form(root);
          done();
        });
      },
      destroyInputs = function() {
        form.innerHTML = '';
      };

  beforeEach(createForm);
  beforeEach(destroyInputs);

  it('creates Form objects', function() {
    var f = new formdb.Form(root);
    assert.ok(f);

    f = formdb.Form(root);
    assert.ok(f instanceof formdb.Form, 'formdb.Form() w/out constructor does not return a Form instance');
  });

  describe('form.get()', function() {

    it('reads text inputs', function() {
      var input = append('input', {type: 'text', name: 'foo', value: 'FOO'});
      assert.equal(form.get('foo'), 'FOO');
    });

    it('reads select inputs', function() {
      var select = append('select', {name: 'thing'}, ['a', 'b', 'c'].map(function(value) {
        return create('option', {value: value});
      }));
      assert.equal(form.get('thing'), 'a');
    });

    it('reads select-multiple inputs', function() {
      var select = append('select', {
            name: 'things',
            multiple: 'multiple'
          }, ['a', 'b', 'c'].map(function(value) {
            return create('option', {
              value: value,
              selected: 'selected'
            });
          }));
      assert.deepEqual(form.get('things'), ['a', 'b', 'c']);
    });

    it('reads single checkboxes', function() {
      var basic = append('input', {type: 'checkbox', name: 'foo', value: '123'});
      assert.equal(form.get('foo'), null);
      basic.checked = true;
      assert.equal(form.get('foo'), '123');
    });

    it('reads grouped checkboxes', function() {
      var boxes = [1, 2, 3].map(function(value) {
        return append('input', {name: 'foo', type: 'checkbox', value: value});
      });
      assert.equal(form.get('foo'), null);
      boxes[0].checked = true;
      assert.deepEqual(form.get('foo'), 1);
      boxes[1].checked = true;
      assert.deepEqual(form.get('foo'), [1, 2]);
      boxes[2].checked = true;
      assert.deepEqual(form.get('foo'), [1, 2, 3]);
      boxes[0].checked = false;
      assert.deepEqual(form.get('foo'), [2, 3]);
    });

    it('reads checkboxes without a value as true', function() {
      append('input', {name: 'blah', type: 'checkbox', checked: true});
      assert.strictEqual(form.get('blah'), true);
    });

    it('reads grouped checkboxes with no value as true', function() {
      append('input', {name: 'blah', type: 'checkbox', value: 'a', checked: true});
      append('input', {name: 'blah', type: 'checkbox', checked: true});
      assert.deepEqual(form.get('blah'), ['a', true]);
    });

    it('reads radio buttons', function() {
      var radios = ['x', 'y', 'z'].map(function(value, i) {
        return append('input', {
          name: 'dim',
          type: 'radio',
          value: value
        });
      });
      assert.equal(form.get('dim'), null);
      radios[0].checked = true;
      assert.equal(form.get('dim'), 'x');
      radios[1].checked = true;
      assert.equal(form.get('dim'), 'y');
      radios[1].checked = false;
      assert.equal(form.get('dim'), null);
    });

    it('reads textareas', function() {
      var area = append('textarea', {name: 'foo'}, 'hello');
      assert.equal(form.get('foo'), 'hello');
    });

  });

  describe('form.set()', function() {

    it('writes text inputs', function() {
      var input = append('input', {type: 'text', name: 'foo'});
      form.set('foo', 'bar');
      assert.equal(form.get('foo'), 'bar');
    })

    it('writes select inputs', function() {
      var select = append('select', {name: 'thing'}, ['a', 'b', 'c'].map(function(value) {
        return create('option', {value: value});
      }));
      form.set('thing', 'b');
      assert.equal(form.get('thing'), 'b');
      form.set('thing', 'd');
      assert.equal(form.get('thing'), 'a');
    });

    it('writes select-multiple inputs', function() {
      var select = append('select', {
            name: 'things',
            multiple: 'multiple'
          }, ['a', 'b', 'c'].map(function(value) {
            return create('option', {value: value});
          }));
      form.set('things', ['b']);
      assert.deepEqual(form.get('things'), ['b']);
      form.set('things', []);
      assert.deepEqual(form.get('things'), []);
      form.set('things', 'c');
      assert.deepEqual(form.get('things'), ['c']);
      form.set('things', 'd');
      assert.deepEqual(form.get('things'), []);
    });

    it('writes single checkboxes', function() {
      var basic = append('input', {type: 'checkbox', name: 'foo', value: '123'});
      // setting a non-existent value will revert to null
      form.set('foo', 'bar');
      assert.equal(form.get('foo'), null);
      form.set('foo', '123');
      assert.equal(form.get('foo'), '123');
    });

    it('writes grouped checkboxes', function() {
      var boxes = [1, 2, 3].map(function(value) {
        return append('input', {name: 'foo', type: 'checkbox', value: value});
      });
      form.set('foo', [2]);
      assert.ok(boxes[1].checked, 'boxes[1] is not checked');
      form.set('foo', [1, 3]);
      assert.equal(boxes[0].checked, true, 'boxes[0] is not checked');
      assert.equal(boxes[1].checked, false, 'boxes[1] is checked');
      assert.equal(boxes[2].checked, true, 'boxes[2] is not checked');
      form.set('foo', null);
      assert.deepEqual(boxes.map(function(box) { return box.checked; }), [false, false, false]);
      form.set('foo', []);
      assert.deepEqual(boxes.map(function(box) { return box.checked; }), [false, false, false]);
    });

    it('writes checkboxes without a value', function() {
      var box = append('input', {name: 'blah', type: 'checkbox'});
      form.set('blah', true);
      assert.equal(box.checked, true, 'box not checked');
    });

    it('writes grouped checkboxes with no value', function() {
      var boxes = [
        append('input', {name: 'blah', type: 'checkbox', value: 'a'}),
        append('input', {name: 'blah', type: 'checkbox'})
      ];
      form.set('blah', ['a', true]);
      assert.equal(boxes[0].checked, true, 'boxes[0] not checked');
      assert.equal(boxes[1].checked, true, 'boxes[1] not checked');
    });

    it('writes radio buttons', function() {
      var radios = ['x', 'y', 'z'].map(function(value, i) {
        return append('input', {
          name: 'dim',
          type: 'radio',
          value: value
        });
      });
      form.set('dim', 'y');
      assert.ok(radios[1].checked, 'radios[1] is not checked');
    });

    it('writes textareas', function() {
      var area = append('textarea', {name: 'foo'});
      form.set('foo', 'hi');
      assert.equal(area.value, 'hi');
    });

  });

  describe('form.getData()', function() {
    it('reads all sorts of data', function() {
      append('input', {name: 'first_name', type: 'text', value: 'Shawn'});
      append('input', {name: 'last_name', type: 'text', value: 'Allen'});
      append('input', {name: 'gender', type: 'radio', value: 'female'});
      append('input', {name: 'gender', type: 'radio', value: 'male', checked: 'checked'});
      var languages = ['javascript', 'python'];
      append('select', {name: 'languages', multiple: 'multiple'},
        ['javascript', 'python', 'ruby'].map(function(lang) {
          return create('option', {
            value: lang,
            selected: languages.indexOf(lang) > -1
          }, lang);
        }));
      var skills = ['frontend', 'backend'];
      ['frontend', 'backend', 'devops'].forEach(function(skill) {
        append('input', {
          type: 'checkbox',
          name: 'skills',
          value: skill,
          checked: skills.indexOf(skill) > -1
        }, skill);
      });
      assert.deepEqual(form.getData(), {
        first_name: 'Shawn',
        last_name: 'Allen',
        gender: 'male',
        languages: languages,
        skills: skills
      });
    });
  });

  describe('form.setData()', function() {
    it('does not write null/undefined', function() {
      var input = append('input', {name: 'foo', type: 'text'});
      form.setData({});
      assert.strictEqual(input.value, '');
      form.setData({foo: undefined});
      assert.strictEqual(input.value, '');
    });

    it('only writes the data you pass it', function() {
      var a = append('input', {name: 'foo', value: 'foo'}),
          b = append('input', {name: 'bar'});
      form.setData({bar: 'bar'});
      assert.equal(a.value, 'foo');
    });

    it('writes all sorts of data', function() {
      append('input', {name: 'first_name', type: 'text', value: 'Shawn'});
      append('input', {name: 'last_name', type: 'text', value: 'Allen'});
      append('input', {name: 'gender', type: 'radio', value: 'female'});
      append('input', {name: 'gender', type: 'radio', value: 'male', checked: 'checked'});
      var languages = ['javascript', 'python'];
      append('select', {name: 'languages', multiple: 'multiple'},
        ['javascript', 'python', 'ruby'].map(function(lang) {
          return create('option', {
            value: lang,
            selected: languages.indexOf(lang) > -1
          }, lang);
        }));
      var skills = ['frontend', 'backend'];
      ['frontend', 'backend', 'devops'].forEach(function(skill) {
        append('input', {
          type: 'checkbox',
          name: 'skills',
          value: skill,
          checked: skills.indexOf(skill) > -1
        }, skill);
      });

      var data = {
        first_name: 'Jane',
        last_name: 'Doe',
        gender: 'female',
        languages: ['ruby'],
        skills: 'devops'
      };

      form.setData(data);
      assert.deepEqual(form.getData(), data);
    });

    it('can reset a form', function() {
      append('input', {name: 'first_name', type: 'text', value: 'Shawn'});
      append('input', {name: 'last_name', type: 'text', value: 'Allen'});
      append('input', {name: 'gender', type: 'radio', value: 'female'});
      append('input', {name: 'gender', type: 'radio', value: 'male', checked: 'checked'});
      var languages = ['javascript', 'python'];
      append('select', {name: 'languages', multiple: 'multiple'},
        ['javascript', 'python', 'ruby'].map(function(lang) {
          return create('option', {
            value: lang,
            selected: languages.indexOf(lang) > -1
          }, lang);
        }));
      var skills = ['frontend', 'backend'];
      ['frontend', 'backend', 'devops'].forEach(function(skill) {
        append('input', {
          type: 'checkbox',
          name: 'skills',
          value: skill,
          checked: skills.indexOf(skill) > -1
        }, skill);
      });

      var original = form.getData();
      form.setData({
        first_name: 'Jane',
        last_name: 'Doe',
        gender: 'female',
        languages: ['ruby'],
        skills: 'devops'
      });

      form.reset();
      assert.deepEqual(form.getData(), original);
    });
  });

  describe('form events', function() {

    it('dispatches "change" events', function(done) {
      form.on('change', function(data, e) {
        assert.deepEqual(data, {foo: 'bar'});
        done();
      });
      var input = append('input', {type: 'checkbox', name: 'foo', value: 'bar'});
      input.click();
      assert.ok(input.checked);
      dispatch(input, 'change');
    });

    it('removes "change" handlers', function(done) {
      var change = function() { throw new Error('changed!'); };
      form.on('change', change);
      form.off('change', change);
      var input = append('input', {type: 'checkbox', name: 'foo', value: 'bar'});
      input.click();
      assert.ok(input.checked);
      dispatch(input, 'change');
      done();
    });

    it('dispatches "change:name" events', function(done) {
      form.on('change:foo', function(foo, e) {
        assert.equal(foo, 'bar');
        done();
      });
      var input = append('input', {type: 'checkbox', name: 'foo', value: 'bar'});
      input.click();
      assert.ok(input.checked);
      dispatch(input, 'change');
    });

    it('removes "change:name" handlers', function(done) {
      var change = function() { throw new Error('changed!'); };
      form.on('change:foo', change);
      form.off('change:foo', change);
      var input = append('input', {type: 'checkbox', name: 'foo', value: 'bar'});
      input.click();
      assert.ok(input.checked);
      dispatch(input, 'change');
      done();
    });

    xit('dispatches "submit" events', function(done) {
      form.on('submit', function(data, e) {
        assert.deepEqual(data, {foo: 'bar', submit: 'go'});
        done();
      });
      var input = append('input', {type: 'checkbox', name: 'foo', value: 'bar'}),
          submit = append('input', {type: 'submit', name: 'submit', value: 'go'});
      dispatch(root, 'submit');
    });

  });

  function append(name, attrs, children) {
    return root.appendChild(create(name, attrs, children));
  }

  function create(name, attrs, children) {
    var el = document.createElement(name);
    if (attrs) {
      for (var attr in attrs) {
        if (attrs[attr] === false) continue;
        el.setAttribute(attr, attrs[attr] === true ? attr : attrs[attr]);
      }
    }
    if (children) {
      if (!Array.isArray(children)) children = [children];
      children.forEach(function(child) {
        if (typeof child === 'string') {
          child = document.createTextNode(child);
        }
        el.appendChild(child);
      });
    }
    return el;
  }

  function remove(el) {
    el.parentNode && el.parentNode.removeChild(el);
  }

  function dispatch(el, type) {
    var e = document.createEvent('HTMLEvents');
    e.initEvent(type, true, false);
    setImmediate(function() {
      el.dispatchEvent(e);
    });
    return e;
  }

});
