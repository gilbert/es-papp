
if ( ! Function.prototype.papp ) {

  Function.prototype.papp = function () {
    var slice = Array.prototype.slice;
    var fn = this;
    var args = slice.call(arguments);
    return function () {
      return fn.apply(this, args.concat(slice.call(arguments)));
    };
  };
}
