# ECMAScript Proposal: Function.prototype.papp

This proposal introduces `papp` and `pappRight` – concise ways of using partial application for functions that require no immediate `this` parameter. It is backwards-compatible, and is immediately useful with most any JavaScript function today.

## Try it out!

    npm install --save papp-polyfill

Then require it once (in your code, as early as possible):

    require('papp-polyfill')

## Introduction

Partial application is possible in JavaScript via `Function.prototype.bind`:

```js
function add (x, y) { return x + y; }

var addTen = add.bind(null, 10);
addTen(20) //=> 30
```

However, `bind` is undesirable for three reasons:

1. Sometimes you don't care about the value of `this`, yet you still must provide `bind`'s first argument
2. Sometimes you **do** care about the value of `this`, but don't want to commit to a specific value yet.
3. ~~[Using `bind` is significantly slower than using a plain closure](http://stackoverflow.com/questions/17638305/why-is-bind-slower-than-a-closure) (!)~~ (this [has been fixed](http://v8project.blogspot.co.uk/2016/06/release-52.html) in V8, and wasn't an issue in other engines for quite a while)

`Function.prototype.papp` solves both these issues in a simple, elegant, and noise-free manner. Here is an illustrative example:

```js
function add (x, y, z) { return x + y + z; }

var addTen = add.papp(3, 7);
addTen(5) //=> 15

// AS OPPOSED TO:
// var addTen = add.bind(null, 3, 7)
// OR:
// var addTen = (x) => add(3, 7, x)

var addThenIncrement = add.papp(1);
addThenIncrement(10, 6) //=> 17

// AS OPPOSED TO:
// var addThenIncrement = add.bind(null, 1)
// OR:
// var addThenIncrement = (a, b) => add(1, a, b)
```

Accepting `papp` into the ES standard will allow JS runtimes to implement a more performant version of `bind` that is dedicated to partial application.

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
greetNewcomer.call({ name: 'Alice' }) //=> 'Alice greets the newcomer'
```


## Practical Examples

These examples are pulled from real-world use cases of partial application.

### HTTP API Output Whitelisting

```js
Player.whitelist = {
  basic: pluck.papp(['name', 'score']),
  admin: pluck.papp(['name', 'score', 'email']),
};

function pluck (attrs, obj) {
  var result = {};
  attrs.forEach( name => result[name] = obj[name] );
  return result;
}

// Example use (in practice, alice would come from a database):
var alice = { name: 'Alice', score: 100, email: 'alice@example.com', password_hash: '...' };

Player.whitelist.basic(alice) //=> { name: 'Alice', score: 100 }

Player.whitelist.admin(alice) //=> { name: 'Alice', score: 100, email: 'alice@example.com' }
```

### Constructing User-friendly APIs

```js
function createClient (host) {
  return {
    get:  makeRequest.papp(host, 'GET'),
    post: makeRequest.papp(host, 'POST'),
    put:  makeRequest.papp(host, 'PUT'),
    del:  makeRequest.papp(host, 'DELETE'),
  };
}

var client = createClient('https://api.example.com');
client.get('/users');
client.post('/comments', { content: "papp is great!" });

function makeRequest (host, method, url, data, options) {
  // ... Make request, return a promise ...
}

// AS OPPOSED TO:
// function createClient (host) {
//   return {
//     get:  (url, data, options) => makeRequest(host, 'GET', url, data, options),
//     post: (url, data, options) => makeRequest(host, 'POST', url, data, options),
//     put:  (url, data, options) => makeRequest(host, 'PUT', url, data, options),
//     del:  (url, data, options) => makeRequest(host, 'DELETE', url, data, options),
//   }
// }
```

## Other Examples

These examples illustrate concepts you can use in your own applications.

### Mapping with Arrays

```js
var chapters = ["The Beginning", "Climax", "Resolution"];

var numberedChapters = chapters.map( toListItem.papp('My Book') )
//=> ["My Book / 1. The Beginning", "My Book / 2. Climax", "My Book / 3. Resolution"]

// AS OPPOSED TO:
// var numberedChapters = chapters.map( (chapter, i) => toListItem('My Book', chapter, i) )

function toListItem (prefix, item, i) {
  return `${prefix} / ${i + 1}. ${item}`
}
```

## Polyfill

ES6:

```js
Function.prototype.papp = function (...args) {
  var fn = this;
  return function (...moreArgs) {
    return fn.apply(this, [...args, ...moreArgs]);
  };
};
```

ES5:

```js
Function.prototype.papp = function () {
  var slice = Array.prototype.slice;
  var fn = this;
  var args = slice.call(arguments);
  return function () {
    return fn.apply(this, args.concat(slice.call(arguments)));
  };
};
```
