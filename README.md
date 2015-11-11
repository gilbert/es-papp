# ES7 Proposal: Function.prototype.papp

Partial application is possible in JavaScript via `Function.prototype.bind`:

```js
function add (x, y) { return x + y; }

var addTen = add.bind(null, 10);
addTen(20) //=> 30
```

However, `bind` is a hinderance in two cases:

1. Sometimes you don't care about the value of `this`, yet you still must provide `bind`'s first argument
2. Sometimes you **do** care about the value of `this`, but don't want to commit to a specific value yet.

`Function.prototype.papp` solves both these issues in a simple, elegant manner.

### Ignoring `this`

For functions that don't use the keyword `this`, `papp` helps with brevity:

```js
function add (x, y) { return x + y; }

var addTen = add.papp(10);
addTen(20) //=> 30
```

### Deferring Function Binding

If a function *does* use the keyword `this`, `papp` allows you to partially apply arguments without committing to a `this` value:

```js
function greet (target) {
  return `${this.name} greets ${target}`;
}

var greetNewcomer = greet.papp('the newcomer');
greetNewcomer.call({ name: 'Alice' }); //=> 'Alice greets the newcomer'
```

## Motivating Examples

Any programmer in the functional programming world will tell you that partial application is immensely useful. Here are some examples:

### HTTP Library

```js
// lib/http.js
exports.get = request.papp('GET');
exports.post = request.papp('POST');
exports.put = request.papp('PUT');
exports.del = request.papp('DELETE');

function request(method, url, options) {
  return requestLibrary({
    method: method,
    url: url,
    data: options && options.data
  });
}

// Elsewhere...
import { get, post } from './lib/http.js';

get('/blog-posts').then(...);
post('/blog-posts', { data: ... }).then(...);
```


### DOM Callbacks

```js
document.querySelector('.tab-1').onclick = setTab.papp('tab1');
document.querySelector('.tab-2').onclick = setTab.papp('tab2');
document.querySelector('.tab-3').onclick = setTab.papp('tab3');

var state = 'tab1';
function setTab (tabName) {
  state = tabName;
}
```


### Database Model

```js
exports.create = save.papp('create');
exports.update = save.papp('update');

function save (type, attrs) {
  if (type === 'create') {
    beforeCreate(attrs);
  }

  validate(attrs);

  if (type === 'create') {
    attrs.created_at = Date.now();
    db.insert(attrs);
  }
  else if (type === 'update') {
    attrs.updated_at = Date.now();
    db.update(attrs.id, attrs);
  }
}
```

## ES6 Polyfill

```js
Function.prototype.papp = function (...args) {
  var fn = this;
  return function () {
    return fn.call(this, ...args, ...arguments);
  }
}
```

## ES5 Polyfill

```js
Function.prototype.papp = function () {
  var slice = Array.prototype.slice;
  var args = slice.call(arguments);
  var fn = this;
  return function () {
    var moreArgs = slice.call(arguments);
    return fn.apply(this, args.concat(moreArgs));
  }
}
```
