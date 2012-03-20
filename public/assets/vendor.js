//     Underscore.js 1.3.1
//     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore is freely distributable under the MIT license.
//     Portions of Underscore are inspired or borrowed from Prototype,
//     Oliver Steele's Functional, and John Resig's Micro-Templating.
//     For all details and documentation:
//     http://documentcloud.github.com/underscore

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var slice            = ArrayProto.slice,
      unshift          = ArrayProto.unshift,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) { return new wrapper(obj); };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root['_'] = _;
  }

  // Current version.
  _.VERSION = '1.3.1';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    if (obj.length === +obj.length) results.length = obj.length;
    return results;
  };

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError('Reduce of empty array with no initial value');
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var reversed = _.toArray(obj).reverse();
    if (context && !initial) iterator = _.bind(iterator, context);
    return initial ? _.reduce(reversed, iterator, memo, context) : _.reduce(reversed, iterator);
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    each(obj, function(value, index, list) {
      if (!iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if a given value is included in the array or object using `===`.
  // Aliased as `contains`.
  _.include = _.contains = function(obj, target) {
    var found = false;
    if (obj == null) return found;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    found = any(obj, function(value) {
      return value === target;
    });
    return found;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    return _.map(obj, function(value) {
      return (_.isFunction(method) ? method || value : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Return the maximum element or (element-based computation).
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0]) return Math.max.apply(Math, obj);
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0]) return Math.min.apply(Math, obj);
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var shuffled = [], rand;
    each(obj, function(value, index, list) {
      if (index == 0) {
        shuffled[0] = value;
      } else {
        rand = Math.floor(Math.random() * (index + 1));
        shuffled[index] = shuffled[rand];
        shuffled[rand] = value;
      }
    });
    return shuffled;
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    }), 'value');
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, val) {
    var result = {};
    var iterator = _.isFunction(val) ? val : function(obj) { return obj[val]; };
    each(obj, function(value, index) {
      var key = iterator(value, index);
      (result[key] || (result[key] = [])).push(value);
    });
    return result;
  };

  // Use a comparator function to figure out at what index an object should
  // be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator) {
    iterator || (iterator = _.identity);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >> 1;
      iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(iterable) {
    if (!iterable)                return [];
    if (iterable.toArray)         return iterable.toArray();
    if (_.isArray(iterable))      return slice.call(iterable);
    if (_.isArguments(iterable))  return slice.call(iterable);
    return _.values(iterable);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    return _.toArray(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head`. The **guard** check allows it to work
  // with `_.map`.
  _.first = _.head = function(array, n, guard) {
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especcialy useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail`.
  // Especially useful on the arguments object. Passing an **index** will return
  // the rest of the values in the array from that index onward. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = function(array, index, guard) {
    return slice.call(array, (index == null) || guard ? 1 : index);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, function(value){ return !!value; });
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return _.reduce(array, function(memo, value) {
      if (_.isArray(value)) return memo.concat(shallow ? value : _.flatten(value));
      memo[memo.length] = value;
      return memo;
    }, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator) {
    var initial = iterator ? _.map(array, iterator) : array;
    var results = [];
    // The `isSorted` flag is irrelevant if the array only contains two elements.
    if (array.length < 3) isSorted = true;
    _.reduce(initial, function (memo, value, index) {
      if (isSorted ? _.last(memo) !== value || !memo.length : !_.include(memo, value)) {
        memo.push(value);
        results.push(array[index]);
      }
      return memo;
    }, []);
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays. (Aliased as "intersect" for back-compat.)
  _.intersection = _.intersect = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = _.flatten(slice.call(arguments, 1), true);
    return _.filter(array, function(value){ return !_.include(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) results[i] = _.pluck(args, "" + i);
    return results;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i, l;
    if (isSorted) {
      i = _.sortedIndex(array, item);
      return array[i] === item ? i : -1;
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
    for (i = 0, l = array.length; i < l; i++) if (i in array && array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item) {
    if (array == null) return -1;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) return array.lastIndexOf(item);
    var i = array.length;
    while (i--) if (i in array && array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Binding with arguments is also known as `curry`.
  // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
  // We check for `func.bind` first, to fail fast when `func` is undefined.
  _.bind = function bind(func, context) {
    var bound, args;
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length == 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(func, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, throttling, more;
    var whenDone = _.debounce(function(){ more = throttling = false; }, wait);
    return function() {
      context = this; args = arguments;
      var later = function() {
        timeout = null;
        if (more) func.apply(context, args);
        whenDone();
      };
      if (!timeout) timeout = setTimeout(later, wait);
      if (throttling) {
        more = true;
      } else {
        func.apply(context, args);
      }
      whenDone();
      throttling = true;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      if (immediate && !timeout) func.apply(context, args);
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      return memo = func.apply(this, arguments);
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func].concat(slice.call(arguments, 0));
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) { return func.apply(this, arguments); }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    return _.map(obj, _.identity);
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (obj[prop] == null) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function.
  function eq(a, b, stack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a._chain) a = a._wrapped;
    if (b._chain) b = b._wrapped;
    // Invoke a custom `isEqual` method if one is provided.
    if (a.isEqual && _.isFunction(a.isEqual)) return a.isEqual(b);
    if (b.isEqual && _.isFunction(b.isEqual)) return b.isEqual(a);
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = stack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (stack[length] == a) return true;
    }
    // Add the first object to the stack of traversed objects.
    stack.push(a);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          // Ensure commutative equality for sparse arrays.
          if (!(result = size in a == size in b && eq(a[size], b[size], stack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent.
      if ('constructor' in a != 'constructor' in b || a.constructor != b.constructor) return false;
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], stack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    stack.pop();
    return result;
  }

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType == 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Is a given variable an arguments object?
  _.isArguments = function(obj) {
    return toString.call(obj) == '[object Arguments]';
  };
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Is a given value a function?
  _.isFunction = function(obj) {
    return toString.call(obj) == '[object Function]';
  };

  // Is a given value a string?
  _.isString = function(obj) {
    return toString.call(obj) == '[object String]';
  };

  // Is a given value a number?
  _.isNumber = function(obj) {
    return toString.call(obj) == '[object Number]';
  };

  // Is the given value `NaN`?
  _.isNaN = function(obj) {
    // `NaN` is the only value for which `===` is not reflexive.
    return obj !== obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value a date?
  _.isDate = function(obj) {
    return toString.call(obj) == '[object Date]';
  };

  // Is the given value a regular expression?
  _.isRegExp = function(obj) {
    return toString.call(obj) == '[object RegExp]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Has own property?
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function (n, iterator, context) {
    for (var i = 0; i < n; i++) iterator.call(context, i);
  };

  // Escape a string for HTML interpolation.
  _.escape = function(string) {
    return (''+string).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g,'&#x2F;');
  };

  // Add your own custom functions to the Underscore object, ensuring that
  // they're correctly added to the OOP wrapper as well.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      addToWrapper(name, _[name] = obj[name]);
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = idCounter++;
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /.^/;

  // Within an interpolation, evaluation, or escaping, remove HTML escaping
  // that had been previously added.
  var unescape = function(code) {
    return code.replace(/\\(\\|'|r|n|t|u2028|u2029)/g, function(match, char) {
      switch (char) {
        case '\\': return '\\';
        case "'": return "'";
        case 'r': return '\r';
        case 'n': return '\n';
        case 't': return '\t';
        case 'u2028': return '\u2028';
        case 'u2029': return '\u2029';
      }
    });
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(str, data) {
    var c  = _.templateSettings;
    var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' +
      'with(obj||{}){__p.push(\'' +
      str.replace(/\\/g, '\\\\')
         .replace(/'/g, "\\'")
         .replace(/\r/g, '\\r')
         .replace(/\n/g, '\\n')
         .replace(/\t/g, '\\t')
         .replace(/\u2028/g, '\\u2028')
         .replace(/\u2029/g, '\\u2029')
         .replace(c.escape || noMatch, function(match, code) {
           return "',_.escape(" + unescape(code) + "),\n'";
         })
         .replace(c.interpolate || noMatch, function(match, code) {
           return "'," + unescape(code) + ",\n'";
         })
         .replace(c.evaluate || noMatch, function(match, code) {
           return "');" + unescape(code) + ";\n__p.push('";
         })
         + "');}return __p.join('');";
    var func = new Function('obj', '_', tmpl);
    if (data) return func(data, _);
    return function(data) {
      return func.call(this, data, _);
    };
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // The OOP Wrapper
  // ---------------

  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.
  var wrapper = function(obj) { this._wrapped = obj; };

  // Expose `wrapper.prototype` as `_.prototype`
  _.prototype = wrapper.prototype;

  // Helper function to continue chaining intermediate results.
  var result = function(obj, chain) {
    return chain ? _(obj).chain() : obj;
  };

  // A method to easily add functions to the OOP wrapper.
  var addToWrapper = function(name, func) {
    wrapper.prototype[name] = function() {
      var args = slice.call(arguments);
      unshift.call(args, this._wrapped);
      return result(func.apply(_, args), this._chain);
    };
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      var wrapped = this._wrapped;
      method.apply(wrapped, arguments);
      var length = wrapped.length;
      if ((name == 'shift' || name == 'splice') && length === 0) delete wrapped[0];
      return result(wrapped, this._chain);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      return result(method.apply(this._wrapped, arguments), this._chain);
    };
  });

  // Start chaining a wrapped Underscore object.
  wrapper.prototype.chain = function() {
    this._chain = true;
    return this;
  };

  // Extracts the result from a wrapped and chained object.
  wrapper.prototype.value = function() {
    return this._wrapped;
  };

}).call(this);


// Underscore.string
// (c) 2010 Esa-Matti Suuronen <esa-matti aet suuronen dot org>
// Underscore.strings is freely distributable under the terms of the MIT license.
// Documentation: https://github.com/epeli/underscore.string
// Some code is borrowed from MooTools and Alexandru Marasteanu.

// Version 2.0.0

(function(root){
  'use strict';

  // Defining helper functions.

  var nativeTrim = String.prototype.trim;
  var nativeTrimRight = String.prototype.trimRight;
  var nativeTrimLeft = String.prototype.trimLeft;

  var parseNumber = function(source) { return source * 1 || 0; };
  
  var strRepeat = function(str, qty, separator){
    // ~~var — is the fastest available way to convert anything to Integer in javascript.
    // We'll use it extensively in this lib.
    str = ''+str; qty = ~~qty;
    for (var repeat = []; qty > 0; repeat[--qty] = str) {}
    return repeat.join(separator == null ? '' : separator);
  };

  var slice = function(a){
    return Array.prototype.slice.call(a);
  };

  var defaultToWhiteSpace = function(characters){
    if (characters != null) {
      return '[' + _s.escapeRegExp(''+characters) + ']';
    }
    return '\\s';
  };

  // sprintf() for JavaScript 0.7-beta1
  // http://www.diveintojavascript.com/projects/javascript-sprintf
  //
  // Copyright (c) Alexandru Marasteanu <alexaholic [at) gmail (dot] com>
  // All rights reserved.

  var sprintf = (function() {
    function get_type(variable) {
      return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase();
    }

    var str_repeat = strRepeat;

    var str_format = function() {
      if (!str_format.cache.hasOwnProperty(arguments[0])) {
        str_format.cache[arguments[0]] = str_format.parse(arguments[0]);
      }
      return str_format.format.call(null, str_format.cache[arguments[0]], arguments);
    };

    str_format.format = function(parse_tree, argv) {
      var cursor = 1, tree_length = parse_tree.length, node_type = '', arg, output = [], i, k, match, pad, pad_character, pad_length;
      for (i = 0; i < tree_length; i++) {
        node_type = get_type(parse_tree[i]);
        if (node_type === 'string') {
          output.push(parse_tree[i]);
        }
        else if (node_type === 'array') {
          match = parse_tree[i]; // convenience purposes only
          if (match[2]) { // keyword argument
            arg = argv[cursor];
            for (k = 0; k < match[2].length; k++) {
              if (!arg.hasOwnProperty(match[2][k])) {
                throw new Error(sprintf('[_.sprintf] property "%s" does not exist', match[2][k]));
              }
              arg = arg[match[2][k]];
            }
          } else if (match[1]) { // positional argument (explicit)
            arg = argv[match[1]];
          }
          else { // positional argument (implicit)
            arg = argv[cursor++];
          }

          if (/[^s]/.test(match[8]) && (get_type(arg) != 'number')) {
            throw new Error(sprintf('[_.sprintf] expecting number but found %s', get_type(arg)));
          }
          switch (match[8]) {
            case 'b': arg = arg.toString(2); break;
            case 'c': arg = String.fromCharCode(arg); break;
            case 'd': arg = parseInt(arg, 10); break;
            case 'e': arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential(); break;
            case 'f': arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg); break;
            case 'o': arg = arg.toString(8); break;
            case 's': arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg); break;
            case 'u': arg = Math.abs(arg); break;
            case 'x': arg = arg.toString(16); break;
            case 'X': arg = arg.toString(16).toUpperCase(); break;
          }
          arg = (/[def]/.test(match[8]) && match[3] && arg >= 0 ? '+'+ arg : arg);
          pad_character = match[4] ? match[4] == '0' ? '0' : match[4].charAt(1) : ' ';
          pad_length = match[6] - String(arg).length;
          pad = match[6] ? str_repeat(pad_character, pad_length) : '';
          output.push(match[5] ? arg + pad : pad + arg);
        }
      }
      return output.join('');
    };

    str_format.cache = {};

    str_format.parse = function(fmt) {
      var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
      while (_fmt) {
        if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
          parse_tree.push(match[0]);
        }
        else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
          parse_tree.push('%');
        }
        else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt)) !== null) {
          if (match[2]) {
            arg_names |= 1;
            var field_list = [], replacement_field = match[2], field_match = [];
            if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
              field_list.push(field_match[1]);
              while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
                if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
                  field_list.push(field_match[1]);
                }
                else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
                  field_list.push(field_match[1]);
                }
                else {
                  throw new Error('[_.sprintf] huh?');
                }
              }
            }
            else {
              throw new Error('[_.sprintf] huh?');
            }
            match[2] = field_list;
          }
          else {
            arg_names |= 2;
          }
          if (arg_names === 3) {
            throw new Error('[_.sprintf] mixing positional and named placeholders is not (yet) supported');
          }
          parse_tree.push(match);
        }
        else {
          throw new Error('[_.sprintf] huh?');
        }
        _fmt = _fmt.substring(match[0].length);
      }
      return parse_tree;
    };

    return str_format;
  })();



  // Defining underscore.string

  var _s = {

    VERSION: '2.0.0',

    isBlank: function(str){
      return (/^\s*$/).test(str);
    },

    stripTags: function(str){
      return (''+str).replace(/<\/?[^>]+>/ig, '');
    },

    capitalize : function(str) {
      str = ''+str;
      return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
    },

    chop: function(str, step){
      str = str+'';
      step = ~~step || str.length;
      var arr = [];
      for (var i = 0; i < str.length;) {
        arr.push(str.slice(i,i + step));
        i = i + step;
      }
      return arr;
    },

    clean: function(str){
      return _s.strip((''+str).replace(/\s+/g, ' '));
    },

    count: function(str, substr){
      str = ''+str; substr = ''+substr;
      var count = 0, index;
      for (var i=0; i < str.length;) {
        index = str.indexOf(substr, i);
        index >= 0 && count++;
        i = i + (index >= 0 ? index : 0) + substr.length;
      }
      return count;
    },

    chars: function(str) {
      return (''+str).split('');
    },

    escapeHTML: function(str) {
      return (''+str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                            .replace(/"/g, '&quot;').replace(/'/g, "&apos;");
    },

    unescapeHTML: function(str) {
      return (''+str).replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                            .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
    },

    escapeRegExp: function(str){
      // From MooTools core 1.2.4
      return str.replace(/([-.*+?^${}()|[\]\/\\])/g, '\\$1');
    },

    insert: function(str, i, substr){
      var arr = (''+str).split('');
      arr.splice(~~i, 0, ''+substr);
      return arr.join('');
    },

    include: function(str, needle){
      return (''+str).indexOf(needle) !== -1;
    },

    join: function(sep) {
      var args = slice(arguments);
      return args.join(args.shift());
    },

    lines: function(str) {
      return (''+str).split("\n");
    },

    reverse: function(str){
        return Array.prototype.reverse.apply(String(str).split('')).join('');
    },

    splice: function(str, i, howmany, substr){
      var arr = (''+str).split('');
      arr.splice(~~i, ~~howmany, substr);
      return arr.join('');
    },

    startsWith: function(str, starts){
      str = ''+str; starts = ''+starts;
      return str.length >= starts.length && str.substring(0, starts.length) === starts;
    },

    endsWith: function(str, ends){
      str = ''+str; ends = ''+ends;
      return str.length >= ends.length && str.substring(str.length - ends.length) === ends;
    },

    succ: function(str){
      str = ''+str;
      var arr = str.split('');
      arr.splice(str.length-1, 1, String.fromCharCode(str.charCodeAt(str.length-1) + 1));
      return arr.join('');
    },

    titleize: function(str){
      return (''+str).replace(/\b./g, function(ch){ return ch.toUpperCase(); });
    },

    camelize: function(str){
      return _s.trim(str).replace(/(\-|_|\s)+(.)?/g, function(match, separator, chr) {
        return chr ? chr.toUpperCase() : '';
      });
    },

    underscored: function(str){
      return _s.trim(str).replace(/([a-z\d])([A-Z]+)/g, '$1_$2').replace(/[-\s]+/g, '_').toLowerCase();
    },

    dasherize: function(str){
      return _s.trim(str).replace(/[_\s]+/g, '-').replace(/([A-Z])/g, '-$1').replace(/-+/g, '-').toLowerCase();
    },

    humanize: function(str){
      return _s.capitalize(this.underscored(str).replace(/_id$/,'').replace(/_/g, ' '));
    },

    trim: function(str, characters){
      str = ''+str;
      if (!characters && nativeTrim) {
        return nativeTrim.call(str);
      }
      characters = defaultToWhiteSpace(characters);
      return str.replace(new RegExp('\^' + characters + '+|' + characters + '+$', 'g'), '');
    },

    ltrim: function(str, characters){
      if (!characters && nativeTrimLeft) {
        return nativeTrimLeft.call(str);
      }
      characters = defaultToWhiteSpace(characters);
      return (''+str).replace(new RegExp('\^' + characters + '+', 'g'), '');
    },

    rtrim: function(str, characters){
      if (!characters && nativeTrimRight) {
        return nativeTrimRight.call(str);
      }
      characters = defaultToWhiteSpace(characters);
      return (''+str).replace(new RegExp(characters + '+$', 'g'), '');
    },

    truncate: function(str, length, truncateStr){
      str = ''+str; truncateStr = truncateStr || '...';
      length = ~~length;
      return str.length > length ? str.slice(0, length) + truncateStr : str;
    },

    /**
     * _s.prune: a more elegant version of truncate
     * prune extra chars, never leaving a half-chopped word.
     * @author github.com/sergiokas
     */
    prune: function(str, length, pruneStr){
      str = ''+str; length = ~~length;
      pruneStr = pruneStr != null ? ''+pruneStr : '...';
      
      var pruned, borderChar, template = str.replace(/\W/g, function(ch){
        return (ch.toUpperCase() !== ch.toLowerCase()) ? 'A' : ' ';
      });
      
      borderChar = template[length];
      
      pruned = template.slice(0, length);
      
      // Check if we're in the middle of a word
      if (borderChar && borderChar.match(/\S/))
        pruned = pruned.replace(/\s\S+$/, '');
        
      pruned = _s.rtrim(pruned);
      
      return (pruned+pruneStr).length > str.length ? str : str.substring(0, pruned.length)+pruneStr;
    },

    words: function(str, delimiter) {
      return (''+str).split(delimiter || " ");
    },

    pad: function(str, length, padStr, type) {
      str = ''+str;
      
      var padding = '', padlen  = 0;

      length = ~~length;
      
      if (!padStr) {
        padStr = ' ';
      } else if (padStr.length > 1) {
        padStr = padStr.charAt(0);
      }
      
      switch(type) {
        case 'right':
          padlen = (length - str.length);
          padding = strRepeat(padStr, padlen);
          str = str+padding;
          break;
        case 'both':
          padlen = (length - str.length);
          padding = {
            'left' : strRepeat(padStr, Math.ceil(padlen/2)),
            'right': strRepeat(padStr, Math.floor(padlen/2))
          };
          str = padding.left+str+padding.right;
          break;
        default: // 'left'
          padlen = (length - str.length);
          padding = strRepeat(padStr, padlen);;
          str = padding+str;
        }
      return str;
    },

    lpad: function(str, length, padStr) {
      return _s.pad(str, length, padStr);
    },

    rpad: function(str, length, padStr) {
      return _s.pad(str, length, padStr, 'right');
    },

    lrpad: function(str, length, padStr) {
      return _s.pad(str, length, padStr, 'both');
    },

    sprintf: sprintf,

    vsprintf: function(fmt, argv){
      argv.unshift(fmt);
      return sprintf.apply(null, argv);
    },

    toNumber: function(str, decimals) {
      var num = parseNumber(parseNumber(str).toFixed(~~decimals));
      return num === 0 && ''+str !== '0' ? Number.NaN : num;
    },

    strRight: function(str, sep){
      str = ''+str; sep = sep != null ? ''+sep : sep;
      var pos =  (!sep) ? -1 : str.indexOf(sep);
      return (pos != -1) ? str.slice(pos+sep.length, str.length) : str;
    },

    strRightBack: function(str, sep){
      str = ''+str; sep = sep != null ? ''+sep : sep;
      var pos =  (!sep) ? -1 : str.lastIndexOf(sep);
      return (pos != -1) ? str.slice(pos+sep.length, str.length) : str;
    },

    strLeft: function(str, sep){
      str = ''+str; sep = sep != null ? ''+sep : sep;
      var pos = (!sep) ? -1 : str.indexOf(sep);
      return (pos != -1) ? str.slice(0, pos) : str;
    },

    strLeftBack: function(str, sep){
      str = ''+str; sep = sep != null ? ''+sep : sep;
      var pos = str.lastIndexOf(sep);
      return (pos != -1) ? str.slice(0, pos) : str;
    },

    toSentence: function(array, separator, lastSeparator) {
        separator || (separator = ', ');
        lastSeparator || (lastSeparator = ' and ');
        var length = array.length, str = '';

        for (var i = 0; i < length; i++) {
            str += array[i];
            if (i === (length - 2)) { str += lastSeparator; }
            else if (i < (length - 1)) { str += separator; }
        }

        return str;
    },

    slugify: function(str) {
      var from  = "ąàáäâãćęèéëêìíïîłńòóöôõùúüûñçżź·/_:;",
          to    = "aaaaaaceeeeeiiiilnooooouuuunczz",
          regex = new RegExp(defaultToWhiteSpace(from), 'g');

      str = (''+str).toLowerCase();

      str = str.replace(regex, function(ch){ return to[from.indexOf(ch)] || '-'; });

      return _s.trim(str.replace(/[^\w\s-]/g, '').replace(/[-\s]+/g, '-'), '-');
    },

    exports: function() {
      var result = {};

      for (var prop in this) {
        if (!this.hasOwnProperty(prop) || prop == 'include' || prop == 'contains' || prop == 'reverse') continue;
        result[prop] = this[prop];
      }

      return result;
    },
    
    repeat: strRepeat

  };

  // Aliases

  _s.strip    = _s.trim;
  _s.lstrip   = _s.ltrim;
  _s.rstrip   = _s.rtrim;
  _s.center   = _s.lrpad;
  _s.rjust    = _s.lpad;
  _s.ljust    = _s.rpad;
  _s.contains = _s.include;

  // CommonJS module is defined
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      // Export module
      module.exports = _s;
    }
    exports._s = _s;

  } else if (typeof define === 'function' && define.amd) {
    // Register as a named module with AMD.
    define('underscore.string', function() {
      return _s;
    });

  // Integrate with Underscore.js
  } else if (typeof root._ !== 'undefined') {
    // root._.mixin(_s);
    root._.string = _s;
    root._.str = root._.string;

  // Or define it
  } else {
    root._ = {
      string: _s,
      str: _s
    };
  }

}(this || window));


var q=null;window.PR_SHOULD_USE_CONTINUATION=!0;
(function(){function L(a){function m(a){var f=a.charCodeAt(0);if(f!==92)return f;var b=a.charAt(1);return(f=r[b])?f:"0"<=b&&b<="7"?parseInt(a.substring(1),8):b==="u"||b==="x"?parseInt(a.substring(2),16):a.charCodeAt(1)}function e(a){if(a<32)return(a<16?"\\x0":"\\x")+a.toString(16);a=String.fromCharCode(a);if(a==="\\"||a==="-"||a==="["||a==="]")a="\\"+a;return a}function h(a){for(var f=a.substring(1,a.length-1).match(/\\u[\dA-Fa-f]{4}|\\x[\dA-Fa-f]{2}|\\[0-3][0-7]{0,2}|\\[0-7]{1,2}|\\[\S\s]|[^\\]/g),a=
[],b=[],o=f[0]==="^",c=o?1:0,i=f.length;c<i;++c){var j=f[c];if(/\\[bdsw]/i.test(j))a.push(j);else{var j=m(j),d;c+2<i&&"-"===f[c+1]?(d=m(f[c+2]),c+=2):d=j;b.push([j,d]);d<65||j>122||(d<65||j>90||b.push([Math.max(65,j)|32,Math.min(d,90)|32]),d<97||j>122||b.push([Math.max(97,j)&-33,Math.min(d,122)&-33]))}}b.sort(function(a,f){return a[0]-f[0]||f[1]-a[1]});f=[];j=[NaN,NaN];for(c=0;c<b.length;++c)i=b[c],i[0]<=j[1]+1?j[1]=Math.max(j[1],i[1]):f.push(j=i);b=["["];o&&b.push("^");b.push.apply(b,a);for(c=0;c<
f.length;++c)i=f[c],b.push(e(i[0])),i[1]>i[0]&&(i[1]+1>i[0]&&b.push("-"),b.push(e(i[1])));b.push("]");return b.join("")}function y(a){for(var f=a.source.match(/\[(?:[^\\\]]|\\[\S\s])*]|\\u[\dA-Fa-f]{4}|\\x[\dA-Fa-f]{2}|\\\d+|\\[^\dux]|\(\?[!:=]|[()^]|[^()[\\^]+/g),b=f.length,d=[],c=0,i=0;c<b;++c){var j=f[c];j==="("?++i:"\\"===j.charAt(0)&&(j=+j.substring(1))&&j<=i&&(d[j]=-1)}for(c=1;c<d.length;++c)-1===d[c]&&(d[c]=++t);for(i=c=0;c<b;++c)j=f[c],j==="("?(++i,d[i]===void 0&&(f[c]="(?:")):"\\"===j.charAt(0)&&
(j=+j.substring(1))&&j<=i&&(f[c]="\\"+d[i]);for(i=c=0;c<b;++c)"^"===f[c]&&"^"!==f[c+1]&&(f[c]="");if(a.ignoreCase&&s)for(c=0;c<b;++c)j=f[c],a=j.charAt(0),j.length>=2&&a==="["?f[c]=h(j):a!=="\\"&&(f[c]=j.replace(/[A-Za-z]/g,function(a){a=a.charCodeAt(0);return"["+String.fromCharCode(a&-33,a|32)+"]"}));return f.join("")}for(var t=0,s=!1,l=!1,p=0,d=a.length;p<d;++p){var g=a[p];if(g.ignoreCase)l=!0;else if(/[a-z]/i.test(g.source.replace(/\\u[\da-f]{4}|\\x[\da-f]{2}|\\[^UXux]/gi,""))){s=!0;l=!1;break}}for(var r=
{b:8,t:9,n:10,v:11,f:12,r:13},n=[],p=0,d=a.length;p<d;++p){g=a[p];if(g.global||g.multiline)throw Error(""+g);n.push("(?:"+y(g)+")")}return RegExp(n.join("|"),l?"gi":"g")}function M(a){function m(a){switch(a.nodeType){case 1:if(e.test(a.className))break;for(var g=a.firstChild;g;g=g.nextSibling)m(g);g=a.nodeName;if("BR"===g||"LI"===g)h[s]="\n",t[s<<1]=y++,t[s++<<1|1]=a;break;case 3:case 4:g=a.nodeValue,g.length&&(g=p?g.replace(/\r\n?/g,"\n"):g.replace(/[\t\n\r ]+/g," "),h[s]=g,t[s<<1]=y,y+=g.length,
t[s++<<1|1]=a)}}var e=/(?:^|\s)nocode(?:\s|$)/,h=[],y=0,t=[],s=0,l;a.currentStyle?l=a.currentStyle.whiteSpace:window.getComputedStyle&&(l=document.defaultView.getComputedStyle(a,q).getPropertyValue("white-space"));var p=l&&"pre"===l.substring(0,3);m(a);return{a:h.join("").replace(/\n$/,""),c:t}}function B(a,m,e,h){m&&(a={a:m,d:a},e(a),h.push.apply(h,a.e))}function x(a,m){function e(a){for(var l=a.d,p=[l,"pln"],d=0,g=a.a.match(y)||[],r={},n=0,z=g.length;n<z;++n){var f=g[n],b=r[f],o=void 0,c;if(typeof b===
"string")c=!1;else{var i=h[f.charAt(0)];if(i)o=f.match(i[1]),b=i[0];else{for(c=0;c<t;++c)if(i=m[c],o=f.match(i[1])){b=i[0];break}o||(b="pln")}if((c=b.length>=5&&"lang-"===b.substring(0,5))&&!(o&&typeof o[1]==="string"))c=!1,b="src";c||(r[f]=b)}i=d;d+=f.length;if(c){c=o[1];var j=f.indexOf(c),k=j+c.length;o[2]&&(k=f.length-o[2].length,j=k-c.length);b=b.substring(5);B(l+i,f.substring(0,j),e,p);B(l+i+j,c,C(b,c),p);B(l+i+k,f.substring(k),e,p)}else p.push(l+i,b)}a.e=p}var h={},y;(function(){for(var e=a.concat(m),
l=[],p={},d=0,g=e.length;d<g;++d){var r=e[d],n=r[3];if(n)for(var k=n.length;--k>=0;)h[n.charAt(k)]=r;r=r[1];n=""+r;p.hasOwnProperty(n)||(l.push(r),p[n]=q)}l.push(/[\S\s]/);y=L(l)})();var t=m.length;return e}function u(a){var m=[],e=[];a.tripleQuotedStrings?m.push(["str",/^(?:'''(?:[^'\\]|\\[\S\s]|''?(?=[^']))*(?:'''|$)|"""(?:[^"\\]|\\[\S\s]|""?(?=[^"]))*(?:"""|$)|'(?:[^'\\]|\\[\S\s])*(?:'|$)|"(?:[^"\\]|\\[\S\s])*(?:"|$))/,q,"'\""]):a.multiLineStrings?m.push(["str",/^(?:'(?:[^'\\]|\\[\S\s])*(?:'|$)|"(?:[^"\\]|\\[\S\s])*(?:"|$)|`(?:[^\\`]|\\[\S\s])*(?:`|$))/,
q,"'\"`"]):m.push(["str",/^(?:'(?:[^\n\r'\\]|\\.)*(?:'|$)|"(?:[^\n\r"\\]|\\.)*(?:"|$))/,q,"\"'"]);a.verbatimStrings&&e.push(["str",/^@"(?:[^"]|"")*(?:"|$)/,q]);var h=a.hashComments;h&&(a.cStyleComments?(h>1?m.push(["com",/^#(?:##(?:[^#]|#(?!##))*(?:###|$)|.*)/,q,"#"]):m.push(["com",/^#(?:(?:define|elif|else|endif|error|ifdef|include|ifndef|line|pragma|undef|warning)\b|[^\n\r]*)/,q,"#"]),e.push(["str",/^<(?:(?:(?:\.\.\/)*|\/?)(?:[\w-]+(?:\/[\w-]+)+)?[\w-]+\.h|[a-z]\w*)>/,q])):m.push(["com",/^#[^\n\r]*/,
q,"#"]));a.cStyleComments&&(e.push(["com",/^\/\/[^\n\r]*/,q]),e.push(["com",/^\/\*[\S\s]*?(?:\*\/|$)/,q]));a.regexLiterals&&e.push(["lang-regex",/^(?:^^\.?|[!+-]|!=|!==|#|%|%=|&|&&|&&=|&=|\(|\*|\*=|\+=|,|-=|->|\/|\/=|:|::|;|<|<<|<<=|<=|=|==|===|>|>=|>>|>>=|>>>|>>>=|[?@[^]|\^=|\^\^|\^\^=|{|\||\|=|\|\||\|\|=|~|break|case|continue|delete|do|else|finally|instanceof|return|throw|try|typeof)\s*(\/(?=[^*/])(?:[^/[\\]|\\[\S\s]|\[(?:[^\\\]]|\\[\S\s])*(?:]|$))+\/)/]);(h=a.types)&&e.push(["typ",h]);a=(""+a.keywords).replace(/^ | $/g,
"");a.length&&e.push(["kwd",RegExp("^(?:"+a.replace(/[\s,]+/g,"|")+")\\b"),q]);m.push(["pln",/^\s+/,q," \r\n\t\xa0"]);e.push(["lit",/^@[$_a-z][\w$@]*/i,q],["typ",/^(?:[@_]?[A-Z]+[a-z][\w$@]*|\w+_t\b)/,q],["pln",/^[$_a-z][\w$@]*/i,q],["lit",/^(?:0x[\da-f]+|(?:\d(?:_\d+)*\d*(?:\.\d*)?|\.\d\+)(?:e[+-]?\d+)?)[a-z]*/i,q,"0123456789"],["pln",/^\\[\S\s]?/,q],["pun",/^.[^\s\w"-$'./@\\`]*/,q]);return x(m,e)}function D(a,m){function e(a){switch(a.nodeType){case 1:if(k.test(a.className))break;if("BR"===a.nodeName)h(a),
a.parentNode&&a.parentNode.removeChild(a);else for(a=a.firstChild;a;a=a.nextSibling)e(a);break;case 3:case 4:if(p){var b=a.nodeValue,d=b.match(t);if(d){var c=b.substring(0,d.index);a.nodeValue=c;(b=b.substring(d.index+d[0].length))&&a.parentNode.insertBefore(s.createTextNode(b),a.nextSibling);h(a);c||a.parentNode.removeChild(a)}}}}function h(a){function b(a,d){var e=d?a.cloneNode(!1):a,f=a.parentNode;if(f){var f=b(f,1),g=a.nextSibling;f.appendChild(e);for(var h=g;h;h=g)g=h.nextSibling,f.appendChild(h)}return e}
for(;!a.nextSibling;)if(a=a.parentNode,!a)return;for(var a=b(a.nextSibling,0),e;(e=a.parentNode)&&e.nodeType===1;)a=e;d.push(a)}var k=/(?:^|\s)nocode(?:\s|$)/,t=/\r\n?|\n/,s=a.ownerDocument,l;a.currentStyle?l=a.currentStyle.whiteSpace:window.getComputedStyle&&(l=s.defaultView.getComputedStyle(a,q).getPropertyValue("white-space"));var p=l&&"pre"===l.substring(0,3);for(l=s.createElement("LI");a.firstChild;)l.appendChild(a.firstChild);for(var d=[l],g=0;g<d.length;++g)e(d[g]);m===(m|0)&&d[0].setAttribute("value",
m);var r=s.createElement("OL");r.className="linenums";for(var n=Math.max(0,m-1|0)||0,g=0,z=d.length;g<z;++g)l=d[g],l.className="L"+(g+n)%10,l.firstChild||l.appendChild(s.createTextNode("\xa0")),r.appendChild(l);a.appendChild(r)}function k(a,m){for(var e=m.length;--e>=0;){var h=m[e];A.hasOwnProperty(h)?window.console&&console.warn("cannot override language handler %s",h):A[h]=a}}function C(a,m){if(!a||!A.hasOwnProperty(a))a=/^\s*</.test(m)?"default-markup":"default-code";return A[a]}function E(a){var m=
a.g;try{var e=M(a.h),h=e.a;a.a=h;a.c=e.c;a.d=0;C(m,h)(a);var k=/\bMSIE\b/.test(navigator.userAgent),m=/\n/g,t=a.a,s=t.length,e=0,l=a.c,p=l.length,h=0,d=a.e,g=d.length,a=0;d[g]=s;var r,n;for(n=r=0;n<g;)d[n]!==d[n+2]?(d[r++]=d[n++],d[r++]=d[n++]):n+=2;g=r;for(n=r=0;n<g;){for(var z=d[n],f=d[n+1],b=n+2;b+2<=g&&d[b+1]===f;)b+=2;d[r++]=z;d[r++]=f;n=b}for(d.length=r;h<p;){var o=l[h+2]||s,c=d[a+2]||s,b=Math.min(o,c),i=l[h+1],j;if(i.nodeType!==1&&(j=t.substring(e,b))){k&&(j=j.replace(m,"\r"));i.nodeValue=
j;var u=i.ownerDocument,v=u.createElement("SPAN");v.className=d[a+1];var x=i.parentNode;x.replaceChild(v,i);v.appendChild(i);e<o&&(l[h+1]=i=u.createTextNode(t.substring(b,o)),x.insertBefore(i,v.nextSibling))}e=b;e>=o&&(h+=2);e>=c&&(a+=2)}}catch(w){"console"in window&&console.log(w&&w.stack?w.stack:w)}}var v=["break,continue,do,else,for,if,return,while"],w=[[v,"auto,case,char,const,default,double,enum,extern,float,goto,int,long,register,short,signed,sizeof,static,struct,switch,typedef,union,unsigned,void,volatile"],
"catch,class,delete,false,import,new,operator,private,protected,public,this,throw,true,try,typeof"],F=[w,"alignof,align_union,asm,axiom,bool,concept,concept_map,const_cast,constexpr,decltype,dynamic_cast,explicit,export,friend,inline,late_check,mutable,namespace,nullptr,reinterpret_cast,static_assert,static_cast,template,typeid,typename,using,virtual,where"],G=[w,"abstract,boolean,byte,extends,final,finally,implements,import,instanceof,null,native,package,strictfp,super,synchronized,throws,transient"],
H=[G,"as,base,by,checked,decimal,delegate,descending,dynamic,event,fixed,foreach,from,group,implicit,in,interface,internal,into,is,lock,object,out,override,orderby,params,partial,readonly,ref,sbyte,sealed,stackalloc,string,select,uint,ulong,unchecked,unsafe,ushort,var"],w=[w,"debugger,eval,export,function,get,null,set,undefined,var,with,Infinity,NaN"],I=[v,"and,as,assert,class,def,del,elif,except,exec,finally,from,global,import,in,is,lambda,nonlocal,not,or,pass,print,raise,try,with,yield,False,True,None"],
J=[v,"alias,and,begin,case,class,def,defined,elsif,end,ensure,false,in,module,next,nil,not,or,redo,rescue,retry,self,super,then,true,undef,unless,until,when,yield,BEGIN,END"],v=[v,"case,done,elif,esac,eval,fi,function,in,local,set,then,until"],K=/^(DIR|FILE|vector|(de|priority_)?queue|list|stack|(const_)?iterator|(multi)?(set|map)|bitset|u?(int|float)\d*)/,N=/\S/,O=u({keywords:[F,H,w,"caller,delete,die,do,dump,elsif,eval,exit,foreach,for,goto,if,import,last,local,my,next,no,our,print,package,redo,require,sub,undef,unless,until,use,wantarray,while,BEGIN,END"+
I,J,v],hashComments:!0,cStyleComments:!0,multiLineStrings:!0,regexLiterals:!0}),A={};k(O,["default-code"]);k(x([],[["pln",/^[^<?]+/],["dec",/^<!\w[^>]*(?:>|$)/],["com",/^<\!--[\S\s]*?(?:--\>|$)/],["lang-",/^<\?([\S\s]+?)(?:\?>|$)/],["lang-",/^<%([\S\s]+?)(?:%>|$)/],["pun",/^(?:<[%?]|[%?]>)/],["lang-",/^<xmp\b[^>]*>([\S\s]+?)<\/xmp\b[^>]*>/i],["lang-js",/^<script\b[^>]*>([\S\s]*?)(<\/script\b[^>]*>)/i],["lang-css",/^<style\b[^>]*>([\S\s]*?)(<\/style\b[^>]*>)/i],["lang-in.tag",/^(<\/?[a-z][^<>]*>)/i]]),
["default-markup","htm","html","mxml","xhtml","xml","xsl"]);k(x([["pln",/^\s+/,q," \t\r\n"],["atv",/^(?:"[^"]*"?|'[^']*'?)/,q,"\"'"]],[["tag",/^^<\/?[a-z](?:[\w-.:]*\w)?|\/?>$/i],["atn",/^(?!style[\s=]|on)[a-z](?:[\w:-]*\w)?/i],["lang-uq.val",/^=\s*([^\s"'>]*(?:[^\s"'/>]|\/(?=\s)))/],["pun",/^[/<->]+/],["lang-js",/^on\w+\s*=\s*"([^"]+)"/i],["lang-js",/^on\w+\s*=\s*'([^']+)'/i],["lang-js",/^on\w+\s*=\s*([^\s"'>]+)/i],["lang-css",/^style\s*=\s*"([^"]+)"/i],["lang-css",/^style\s*=\s*'([^']+)'/i],["lang-css",
/^style\s*=\s*([^\s"'>]+)/i]]),["in.tag"]);k(x([],[["atv",/^[\S\s]+/]]),["uq.val"]);k(u({keywords:F,hashComments:!0,cStyleComments:!0,types:K}),["c","cc","cpp","cxx","cyc","m"]);k(u({keywords:"null,true,false"}),["json"]);k(u({keywords:H,hashComments:!0,cStyleComments:!0,verbatimStrings:!0,types:K}),["cs"]);k(u({keywords:G,cStyleComments:!0}),["java"]);k(u({keywords:v,hashComments:!0,multiLineStrings:!0}),["bsh","csh","sh"]);k(u({keywords:I,hashComments:!0,multiLineStrings:!0,tripleQuotedStrings:!0}),
["cv","py"]);k(u({keywords:"caller,delete,die,do,dump,elsif,eval,exit,foreach,for,goto,if,import,last,local,my,next,no,our,print,package,redo,require,sub,undef,unless,until,use,wantarray,while,BEGIN,END",hashComments:!0,multiLineStrings:!0,regexLiterals:!0}),["perl","pl","pm"]);k(u({keywords:J,hashComments:!0,multiLineStrings:!0,regexLiterals:!0}),["rb"]);k(u({keywords:w,cStyleComments:!0,regexLiterals:!0}),["js"]);k(u({keywords:"all,and,by,catch,class,else,extends,false,finally,for,if,in,is,isnt,loop,new,no,not,null,of,off,on,or,return,super,then,true,try,unless,until,when,while,yes",
hashComments:3,cStyleComments:!0,multilineStrings:!0,tripleQuotedStrings:!0,regexLiterals:!0}),["coffee"]);k(x([],[["str",/^[\S\s]+/]]),["regex"]);window.prettyPrintOne=function(a,m,e){var h=document.createElement("PRE");h.innerHTML=a;e&&D(h,e);E({g:m,i:e,h:h});return h.innerHTML};window.prettyPrint=function(a){function m(){for(var e=window.PR_SHOULD_USE_CONTINUATION?l.now()+250:Infinity;p<h.length&&l.now()<e;p++){var n=h[p],k=n.className;if(k.indexOf("prettyprint")>=0){var k=k.match(g),f,b;if(b=
!k){b=n;for(var o=void 0,c=b.firstChild;c;c=c.nextSibling)var i=c.nodeType,o=i===1?o?b:c:i===3?N.test(c.nodeValue)?b:o:o;b=(f=o===b?void 0:o)&&"CODE"===f.tagName}b&&(k=f.className.match(g));k&&(k=k[1]);b=!1;for(o=n.parentNode;o;o=o.parentNode)if((o.tagName==="pre"||o.tagName==="code"||o.tagName==="xmp")&&o.className&&o.className.indexOf("prettyprint")>=0){b=!0;break}b||((b=(b=n.className.match(/\blinenums\b(?::(\d+))?/))?b[1]&&b[1].length?+b[1]:!0:!1)&&D(n,b),d={g:k,h:n,i:b},E(d))}}p<h.length?setTimeout(m,
250):a&&a()}for(var e=[document.getElementsByTagName("pre"),document.getElementsByTagName("code"),document.getElementsByTagName("xmp")],h=[],k=0;k<e.length;++k)for(var t=0,s=e[k].length;t<s;++t)h.push(e[k][t]);var e=q,l=Date;l.now||(l={now:function(){return+new Date}});var p=0,d,g=/\blang(?:uage)?-([\w.]+)(?!\S)/;m()};window.PR={createSimpleLexer:x,registerLangHandler:k,sourceDecorator:u,PR_ATTRIB_NAME:"atn",PR_ATTRIB_VALUE:"atv",PR_COMMENT:"com",PR_DECLARATION:"dec",PR_KEYWORD:"kwd",PR_LITERAL:"lit",
PR_NOCODE:"nocode",PR_PLAIN:"pln",PR_PUNCTUATION:"pun",PR_SOURCE:"src",PR_STRING:"str",PR_TAG:"tag",PR_TYPE:"typ"}})();


/*! Socket.IO.js build:0.9.2, development. Copyright(c) 2011 LearnBoost <dev@learnboost.com> MIT Licensed */

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, global) {

  /**
   * IO namespace.
   *
   * @namespace
   */

  var io = exports;

  /**
   * Socket.IO version
   *
   * @api public
   */

  io.version = '0.9.2';

  /**
   * Protocol implemented.
   *
   * @api public
   */

  io.protocol = 1;

  /**
   * Available transports, these will be populated with the available transports
   *
   * @api public
   */

  io.transports = [];

  /**
   * Keep track of jsonp callbacks.
   *
   * @api private
   */

  io.j = [];

  /**
   * Keep track of our io.Sockets
   *
   * @api private
   */
  io.sockets = {};


  /**
   * Manages connections to hosts.
   *
   * @param {String} uri
   * @Param {Boolean} force creation of new socket (defaults to false)
   * @api public
   */

  io.connect = function (host, details) {
    var uri = io.util.parseUri(host)
      , uuri
      , socket;

    if (global && global.location) {
      uri.protocol = uri.protocol || global.location.protocol.slice(0, -1);
      uri.host = uri.host || (global.document
        ? global.document.domain : global.location.hostname);
      uri.port = uri.port || global.location.port;
    }

    uuri = io.util.uniqueUri(uri);

    var options = {
        host: uri.host
      , secure: 'https' == uri.protocol
      , port: uri.port || ('https' == uri.protocol ? 443 : 80)
      , query: uri.query || ''
    };

    io.util.merge(options, details);

    if (options['force new connection'] || !io.sockets[uuri]) {
      socket = new io.Socket(options);
    }

    if (!options['force new connection'] && socket) {
      io.sockets[uuri] = socket;
    }

    socket = socket || io.sockets[uuri];

    // if path is different from '' or /
    return socket.of(uri.path.length > 1 ? uri.path : '');
  };

})('object' === typeof module ? module.exports : (this.io = {}), this);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, global) {

  /**
   * Utilities namespace.
   *
   * @namespace
   */

  var util = exports.util = {};

  /**
   * Parses an URI
   *
   * @author Steven Levithan <stevenlevithan.com> (MIT license)
   * @api public
   */

  var re = /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

  var parts = ['source', 'protocol', 'authority', 'userInfo', 'user', 'password',
               'host', 'port', 'relative', 'path', 'directory', 'file', 'query',
               'anchor'];

  util.parseUri = function (str) {
    var m = re.exec(str || '')
      , uri = {}
      , i = 14;

    while (i--) {
      uri[parts[i]] = m[i] || '';
    }

    return uri;
  };

  /**
   * Produces a unique url that identifies a Socket.IO connection.
   *
   * @param {Object} uri
   * @api public
   */

  util.uniqueUri = function (uri) {
    var protocol = uri.protocol
      , host = uri.host
      , port = uri.port;

    if ('document' in global) {
      host = host || document.domain;
      port = port || (protocol == 'https'
        && document.location.protocol !== 'https:' ? 443 : document.location.port);
    } else {
      host = host || 'localhost';

      if (!port && protocol == 'https') {
        port = 443;
      }
    }

    return (protocol || 'http') + '://' + host + ':' + (port || 80);
  };

  /**
   * Mergest 2 query strings in to once unique query string
   *
   * @param {String} base
   * @param {String} addition
   * @api public
   */

  util.query = function (base, addition) {
    var query = util.chunkQuery(base || '')
      , components = [];

    util.merge(query, util.chunkQuery(addition || ''));
    for (var part in query) {
      if (query.hasOwnProperty(part)) {
        components.push(part + '=' + query[part]);
      }
    }

    return components.length ? '?' + components.join('&') : '';
  };

  /**
   * Transforms a querystring in to an object
   *
   * @param {String} qs
   * @api public
   */

  util.chunkQuery = function (qs) {
    var query = {}
      , params = qs.split('&')
      , i = 0
      , l = params.length
      , kv;

    for (; i < l; ++i) {
      kv = params[i].split('=');
      if (kv[0]) {
        query[kv[0]] = kv[1];
      }
    }

    return query;
  };

  /**
   * Executes the given function when the page is loaded.
   *
   *     io.util.load(function () { console.log('page loaded'); });
   *
   * @param {Function} fn
   * @api public
   */

  var pageLoaded = false;

  util.load = function (fn) {
    if ('document' in global && document.readyState === 'complete' || pageLoaded) {
      return fn();
    }

    util.on(global, 'load', fn, false);
  };

  /**
   * Adds an event.
   *
   * @api private
   */

  util.on = function (element, event, fn, capture) {
    if (element.attachEvent) {
      element.attachEvent('on' + event, fn);
    } else if (element.addEventListener) {
      element.addEventListener(event, fn, capture);
    }
  };

  /**
   * Generates the correct `XMLHttpRequest` for regular and cross domain requests.
   *
   * @param {Boolean} [xdomain] Create a request that can be used cross domain.
   * @returns {XMLHttpRequest|false} If we can create a XMLHttpRequest.
   * @api private
   */

  util.request = function (xdomain) {

    if (xdomain && 'undefined' != typeof XDomainRequest) {
      return new XDomainRequest();
    }

    if ('undefined' != typeof XMLHttpRequest && (!xdomain || util.ua.hasCORS)) {
      return new XMLHttpRequest();
    }

    if (!xdomain) {
      try {
        return new window[(['Active'].concat('Object').join('X'))]('Microsoft.XMLHTTP');
      } catch(e) { }
    }

    return null;
  };

  /**
   * XHR based transport constructor.
   *
   * @constructor
   * @api public
   */

  /**
   * Change the internal pageLoaded value.
   */

  if ('undefined' != typeof window) {
    util.load(function () {
      pageLoaded = true;
    });
  }

  /**
   * Defers a function to ensure a spinner is not displayed by the browser
   *
   * @param {Function} fn
   * @api public
   */

  util.defer = function (fn) {
    if (!util.ua.webkit || 'undefined' != typeof importScripts) {
      return fn();
    }

    util.load(function () {
      setTimeout(fn, 100);
    });
  };

  /**
   * Merges two objects.
   *
   * @api public
   */
  
  util.merge = function merge (target, additional, deep, lastseen) {
    var seen = lastseen || []
      , depth = typeof deep == 'undefined' ? 2 : deep
      , prop;

    for (prop in additional) {
      if (additional.hasOwnProperty(prop) && util.indexOf(seen, prop) < 0) {
        if (typeof target[prop] !== 'object' || !depth) {
          target[prop] = additional[prop];
          seen.push(additional[prop]);
        } else {
          util.merge(target[prop], additional[prop], depth - 1, seen);
        }
      }
    }

    return target;
  };

  /**
   * Merges prototypes from objects
   *
   * @api public
   */
  
  util.mixin = function (ctor, ctor2) {
    util.merge(ctor.prototype, ctor2.prototype);
  };

  /**
   * Shortcut for prototypical and static inheritance.
   *
   * @api private
   */

  util.inherit = function (ctor, ctor2) {
    function f() {};
    f.prototype = ctor2.prototype;
    ctor.prototype = new f;
  };

  /**
   * Checks if the given object is an Array.
   *
   *     io.util.isArray([]); // true
   *     io.util.isArray({}); // false
   *
   * @param Object obj
   * @api public
   */

  util.isArray = Array.isArray || function (obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  };

  /**
   * Intersects values of two arrays into a third
   *
   * @api public
   */

  util.intersect = function (arr, arr2) {
    var ret = []
      , longest = arr.length > arr2.length ? arr : arr2
      , shortest = arr.length > arr2.length ? arr2 : arr;

    for (var i = 0, l = shortest.length; i < l; i++) {
      if (~util.indexOf(longest, shortest[i]))
        ret.push(shortest[i]);
    }

    return ret;
  }

  /**
   * Array indexOf compatibility.
   *
   * @see bit.ly/a5Dxa2
   * @api public
   */

  util.indexOf = function (arr, o, i) {
    
    for (var j = arr.length, i = i < 0 ? i + j < 0 ? 0 : i + j : i || 0; 
         i < j && arr[i] !== o; i++) {}

    return j <= i ? -1 : i;
  };

  /**
   * Converts enumerables to array.
   *
   * @api public
   */

  util.toArray = function (enu) {
    var arr = [];

    for (var i = 0, l = enu.length; i < l; i++)
      arr.push(enu[i]);

    return arr;
  };

  /**
   * UA / engines detection namespace.
   *
   * @namespace
   */

  util.ua = {};

  /**
   * Whether the UA supports CORS for XHR.
   *
   * @api public
   */

  util.ua.hasCORS = 'undefined' != typeof XMLHttpRequest && (function () {
    try {
      var a = new XMLHttpRequest();
    } catch (e) {
      return false;
    }

    return a.withCredentials != undefined;
  })();

  /**
   * Detect webkit.
   *
   * @api public
   */

  util.ua.webkit = 'undefined' != typeof navigator
    && /webkit/i.test(navigator.userAgent);

})('undefined' != typeof io ? io : module.exports, this);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Expose constructor.
   */

  exports.EventEmitter = EventEmitter;

  /**
   * Event emitter constructor.
   *
   * @api public.
   */

  function EventEmitter () {};

  /**
   * Adds a listener
   *
   * @api public
   */

  EventEmitter.prototype.on = function (name, fn) {
    if (!this.$events) {
      this.$events = {};
    }

    if (!this.$events[name]) {
      this.$events[name] = fn;
    } else if (io.util.isArray(this.$events[name])) {
      this.$events[name].push(fn);
    } else {
      this.$events[name] = [this.$events[name], fn];
    }

    return this;
  };

  EventEmitter.prototype.addListener = EventEmitter.prototype.on;

  /**
   * Adds a volatile listener.
   *
   * @api public
   */

  EventEmitter.prototype.once = function (name, fn) {
    var self = this;

    function on () {
      self.removeListener(name, on);
      fn.apply(this, arguments);
    };

    on.listener = fn;
    this.on(name, on);

    return this;
  };

  /**
   * Removes a listener.
   *
   * @api public
   */

  EventEmitter.prototype.removeListener = function (name, fn) {
    if (this.$events && this.$events[name]) {
      var list = this.$events[name];

      if (io.util.isArray(list)) {
        var pos = -1;

        for (var i = 0, l = list.length; i < l; i++) {
          if (list[i] === fn || (list[i].listener && list[i].listener === fn)) {
            pos = i;
            break;
          }
        }

        if (pos < 0) {
          return this;
        }

        list.splice(pos, 1);

        if (!list.length) {
          delete this.$events[name];
        }
      } else if (list === fn || (list.listener && list.listener === fn)) {
        delete this.$events[name];
      }
    }

    return this;
  };

  /**
   * Removes all listeners for an event.
   *
   * @api public
   */

  EventEmitter.prototype.removeAllListeners = function (name) {
    // TODO: enable this when node 0.5 is stable
    //if (name === undefined) {
      //this.$events = {};
      //return this;
    //}

    if (this.$events && this.$events[name]) {
      this.$events[name] = null;
    }

    return this;
  };

  /**
   * Gets all listeners for a certain event.
   *
   * @api publci
   */

  EventEmitter.prototype.listeners = function (name) {
    if (!this.$events) {
      this.$events = {};
    }

    if (!this.$events[name]) {
      this.$events[name] = [];
    }

    if (!io.util.isArray(this.$events[name])) {
      this.$events[name] = [this.$events[name]];
    }

    return this.$events[name];
  };

  /**
   * Emits an event.
   *
   * @api public
   */

  EventEmitter.prototype.emit = function (name) {
    if (!this.$events) {
      return false;
    }

    var handler = this.$events[name];

    if (!handler) {
      return false;
    }

    var args = Array.prototype.slice.call(arguments, 1);

    if ('function' == typeof handler) {
      handler.apply(this, args);
    } else if (io.util.isArray(handler)) {
      var listeners = handler.slice();

      for (var i = 0, l = listeners.length; i < l; i++) {
        listeners[i].apply(this, args);
      }
    } else {
      return false;
    }

    return true;
  };

})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Based on JSON2 (http://www.JSON.org/js.html).
 */

(function (exports, nativeJSON) {
  "use strict";

  // use native JSON if it's available
  if (nativeJSON && nativeJSON.parse){
    return exports.JSON = {
      parse: nativeJSON.parse
    , stringify: nativeJSON.stringify
    }
  }

  var JSON = exports.JSON = {};

  function f(n) {
      // Format integers to have at least two digits.
      return n < 10 ? '0' + n : n;
  }

  function date(d, key) {
    return isFinite(d.valueOf()) ?
        d.getUTCFullYear()     + '-' +
        f(d.getUTCMonth() + 1) + '-' +
        f(d.getUTCDate())      + 'T' +
        f(d.getUTCHours())     + ':' +
        f(d.getUTCMinutes())   + ':' +
        f(d.getUTCSeconds())   + 'Z' : null;
  };

  var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
      escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
      gap,
      indent,
      meta = {    // table of character substitutions
          '\b': '\\b',
          '\t': '\\t',
          '\n': '\\n',
          '\f': '\\f',
          '\r': '\\r',
          '"' : '\\"',
          '\\': '\\\\'
      },
      rep;


  function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

      escapable.lastIndex = 0;
      return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
          var c = meta[a];
          return typeof c === 'string' ? c :
              '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
      }) + '"' : '"' + string + '"';
  }


  function str(key, holder) {

// Produce a string from holder[key].

      var i,          // The loop counter.
          k,          // The member key.
          v,          // The member value.
          length,
          mind = gap,
          partial,
          value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

      if (value instanceof Date) {
          value = date(key);
      }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

      if (typeof rep === 'function') {
          value = rep.call(holder, key, value);
      }

// What happens next depends on the value's type.

      switch (typeof value) {
      case 'string':
          return quote(value);

      case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

          return isFinite(value) ? String(value) : 'null';

      case 'boolean':
      case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

          return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

      case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

          if (!value) {
              return 'null';
          }

// Make an array to hold the partial results of stringifying this object value.

          gap += indent;
          partial = [];

// Is the value an array?

          if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

              length = value.length;
              for (i = 0; i < length; i += 1) {
                  partial[i] = str(i, value) || 'null';
              }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

              v = partial.length === 0 ? '[]' : gap ?
                  '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
                  '[' + partial.join(',') + ']';
              gap = mind;
              return v;
          }

// If the replacer is an array, use it to select the members to be stringified.

          if (rep && typeof rep === 'object') {
              length = rep.length;
              for (i = 0; i < length; i += 1) {
                  if (typeof rep[i] === 'string') {
                      k = rep[i];
                      v = str(k, value);
                      if (v) {
                          partial.push(quote(k) + (gap ? ': ' : ':') + v);
                      }
                  }
              }
          } else {

// Otherwise, iterate through all of the keys in the object.

              for (k in value) {
                  if (Object.prototype.hasOwnProperty.call(value, k)) {
                      v = str(k, value);
                      if (v) {
                          partial.push(quote(k) + (gap ? ': ' : ':') + v);
                      }
                  }
              }
          }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

          v = partial.length === 0 ? '{}' : gap ?
              '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
              '{' + partial.join(',') + '}';
          gap = mind;
          return v;
      }
  }

// If the JSON object does not yet have a stringify method, give it one.

  JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

      var i;
      gap = '';
      indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

      if (typeof space === 'number') {
          for (i = 0; i < space; i += 1) {
              indent += ' ';
          }

// If the space parameter is a string, it will be used as the indent string.

      } else if (typeof space === 'string') {
          indent = space;
      }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

      rep = replacer;
      if (replacer && typeof replacer !== 'function' &&
              (typeof replacer !== 'object' ||
              typeof replacer.length !== 'number')) {
          throw new Error('JSON.stringify');
      }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

      return str('', {'': value});
  };

// If the JSON object does not yet have a parse method, give it one.

  JSON.parse = function (text, reviver) {
  // The parse method takes a text and an optional reviver function, and returns
  // a JavaScript value if the text is a valid JSON text.

      var j;

      function walk(holder, key) {

  // The walk method is used to recursively walk the resulting structure so
  // that modifications can be made.

          var k, v, value = holder[key];
          if (value && typeof value === 'object') {
              for (k in value) {
                  if (Object.prototype.hasOwnProperty.call(value, k)) {
                      v = walk(value, k);
                      if (v !== undefined) {
                          value[k] = v;
                      } else {
                          delete value[k];
                      }
                  }
              }
          }
          return reviver.call(holder, key, value);
      }


  // Parsing happens in four stages. In the first stage, we replace certain
  // Unicode characters with escape sequences. JavaScript handles many characters
  // incorrectly, either silently deleting them, or treating them as line endings.

      text = String(text);
      cx.lastIndex = 0;
      if (cx.test(text)) {
          text = text.replace(cx, function (a) {
              return '\\u' +
                  ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
          });
      }

  // In the second stage, we run the text against regular expressions that look
  // for non-JSON patterns. We are especially concerned with '()' and 'new'
  // because they can cause invocation, and '=' because it can cause mutation.
  // But just to be safe, we want to reject all unexpected forms.

  // We split the second stage into 4 regexp operations in order to work around
  // crippling inefficiencies in IE's and Safari's regexp engines. First we
  // replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
  // replace all simple value tokens with ']' characters. Third, we delete all
  // open brackets that follow a colon or comma or that begin the text. Finally,
  // we look to see that the remaining characters are only whitespace or ']' or
  // ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

      if (/^[\],:{}\s]*$/
              .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                  .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                  .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

  // In the third stage we use the eval function to compile the text into a
  // JavaScript structure. The '{' operator is subject to a syntactic ambiguity
  // in JavaScript: it can begin a block or an object literal. We wrap the text
  // in parens to eliminate the ambiguity.

          j = eval('(' + text + ')');

  // In the optional fourth stage, we recursively walk the new structure, passing
  // each name/value pair to a reviver function for possible transformation.

          return typeof reviver === 'function' ?
              walk({'': j}, '') : j;
      }

  // If the text is not JSON parseable, then a SyntaxError is thrown.

      throw new SyntaxError('JSON.parse');
  };

})(
    'undefined' != typeof io ? io : module.exports
  , typeof JSON !== 'undefined' ? JSON : undefined
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Parser namespace.
   *
   * @namespace
   */

  var parser = exports.parser = {};

  /**
   * Packet types.
   */

  var packets = parser.packets = [
      'disconnect'
    , 'connect'
    , 'heartbeat'
    , 'message'
    , 'json'
    , 'event'
    , 'ack'
    , 'error'
    , 'noop'
  ];

  /**
   * Errors reasons.
   */

  var reasons = parser.reasons = [
      'transport not supported'
    , 'client not handshaken'
    , 'unauthorized'
  ];

  /**
   * Errors advice.
   */

  var advice = parser.advice = [
      'reconnect'
  ];

  /**
   * Shortcuts.
   */

  var JSON = io.JSON
    , indexOf = io.util.indexOf;

  /**
   * Encodes a packet.
   *
   * @api private
   */

  parser.encodePacket = function (packet) {
    var type = indexOf(packets, packet.type)
      , id = packet.id || ''
      , endpoint = packet.endpoint || ''
      , ack = packet.ack
      , data = null;

    switch (packet.type) {
      case 'error':
        var reason = packet.reason ? indexOf(reasons, packet.reason) : ''
          , adv = packet.advice ? indexOf(advice, packet.advice) : '';

        if (reason !== '' || adv !== '')
          data = reason + (adv !== '' ? ('+' + adv) : '');

        break;

      case 'message':
        if (packet.data !== '')
          data = packet.data;
        break;

      case 'event':
        var ev = { name: packet.name };

        if (packet.args && packet.args.length) {
          ev.args = packet.args;
        }

        data = JSON.stringify(ev);
        break;

      case 'json':
        data = JSON.stringify(packet.data);
        break;

      case 'connect':
        if (packet.qs)
          data = packet.qs;
        break;

      case 'ack':
        data = packet.ackId
          + (packet.args && packet.args.length
              ? '+' + JSON.stringify(packet.args) : '');
        break;
    }

    // construct packet with required fragments
    var encoded = [
        type
      , id + (ack == 'data' ? '+' : '')
      , endpoint
    ];

    // data fragment is optional
    if (data !== null && data !== undefined)
      encoded.push(data);

    return encoded.join(':');
  };

  /**
   * Encodes multiple messages (payload).
   *
   * @param {Array} messages
   * @api private
   */

  parser.encodePayload = function (packets) {
    var decoded = '';

    if (packets.length == 1)
      return packets[0];

    for (var i = 0, l = packets.length; i < l; i++) {
      var packet = packets[i];
      decoded += '\ufffd' + packet.length + '\ufffd' + packets[i];
    }

    return decoded;
  };

  /**
   * Decodes a packet
   *
   * @api private
   */

  var regexp = /([^:]+):([0-9]+)?(\+)?:([^:]+)?:?([\s\S]*)?/;

  parser.decodePacket = function (data) {
    var pieces = data.match(regexp);

    if (!pieces) return {};

    var id = pieces[2] || ''
      , data = pieces[5] || ''
      , packet = {
            type: packets[pieces[1]]
          , endpoint: pieces[4] || ''
        };

    // whether we need to acknowledge the packet
    if (id) {
      packet.id = id;
      if (pieces[3])
        packet.ack = 'data';
      else
        packet.ack = true;
    }

    // handle different packet types
    switch (packet.type) {
      case 'error':
        var pieces = data.split('+');
        packet.reason = reasons[pieces[0]] || '';
        packet.advice = advice[pieces[1]] || '';
        break;

      case 'message':
        packet.data = data || '';
        break;

      case 'event':
        try {
          var opts = JSON.parse(data);
          packet.name = opts.name;
          packet.args = opts.args;
        } catch (e) { }

        packet.args = packet.args || [];
        break;

      case 'json':
        try {
          packet.data = JSON.parse(data);
        } catch (e) { }
        break;

      case 'connect':
        packet.qs = data || '';
        break;

      case 'ack':
        var pieces = data.match(/^([0-9]+)(\+)?(.*)/);
        if (pieces) {
          packet.ackId = pieces[1];
          packet.args = [];

          if (pieces[3]) {
            try {
              packet.args = pieces[3] ? JSON.parse(pieces[3]) : [];
            } catch (e) { }
          }
        }
        break;

      case 'disconnect':
      case 'heartbeat':
        break;
    };

    return packet;
  };

  /**
   * Decodes data payload. Detects multiple messages
   *
   * @return {Array} messages
   * @api public
   */

  parser.decodePayload = function (data) {
    // IE doesn't like data[i] for unicode chars, charAt works fine
    if (data.charAt(0) == '\ufffd') {
      var ret = [];

      for (var i = 1, length = ''; i < data.length; i++) {
        if (data.charAt(i) == '\ufffd') {
          ret.push(parser.decodePacket(data.substr(i + 1).substr(0, length)));
          i += Number(length) + 1;
          length = '';
        } else {
          length += data.charAt(i);
        }
      }

      return ret;
    } else {
      return [parser.decodePacket(data)];
    }
  };

})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Expose constructor.
   */

  exports.Transport = Transport;

  /**
   * This is the transport template for all supported transport methods.
   *
   * @constructor
   * @api public
   */

  function Transport (socket, sessid) {
    this.socket = socket;
    this.sessid = sessid;
  };

  /**
   * Apply EventEmitter mixin.
   */

  io.util.mixin(Transport, io.EventEmitter);

  /**
   * Handles the response from the server. When a new response is received
   * it will automatically update the timeout, decode the message and
   * forwards the response to the onMessage function for further processing.
   *
   * @param {String} data Response from the server.
   * @api private
   */

  Transport.prototype.onData = function (data) {
    this.clearCloseTimeout();
    
    // If the connection in currently open (or in a reopening state) reset the close 
    // timeout since we have just received data. This check is necessary so
    // that we don't reset the timeout on an explicitly disconnected connection.
    if (this.socket.connected || this.socket.connecting || this.socket.reconnecting) {
      this.setCloseTimeout();
    }

    if (data !== '') {
      // todo: we should only do decodePayload for xhr transports
      var msgs = io.parser.decodePayload(data);

      if (msgs && msgs.length) {
        for (var i = 0, l = msgs.length; i < l; i++) {
          this.onPacket(msgs[i]);
        }
      }
    }

    return this;
  };

  /**
   * Handles packets.
   *
   * @api private
   */

  Transport.prototype.onPacket = function (packet) {
    this.socket.setHeartbeatTimeout();

    if (packet.type == 'heartbeat') {
      return this.onHeartbeat();
    }

    if (packet.type == 'connect' && packet.endpoint == '') {
      this.onConnect();
    }

    this.socket.onPacket(packet);

    return this;
  };

  /**
   * Sets close timeout
   *
   * @api private
   */
  
  Transport.prototype.setCloseTimeout = function () {
    if (!this.closeTimeout) {
      var self = this;

      this.closeTimeout = setTimeout(function () {
        self.onDisconnect();
      }, this.socket.closeTimeout);
    }
  };

  /**
   * Called when transport disconnects.
   *
   * @api private
   */

  Transport.prototype.onDisconnect = function () {
    if (this.close && this.open) this.close();
    this.clearTimeouts();
    this.socket.onDisconnect();
    return this;
  };

  /**
   * Called when transport connects
   *
   * @api private
   */

  Transport.prototype.onConnect = function () {
    this.socket.onConnect();
    return this;
  }

  /**
   * Clears close timeout
   *
   * @api private
   */

  Transport.prototype.clearCloseTimeout = function () {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
  };

  /**
   * Clear timeouts
   *
   * @api private
   */

  Transport.prototype.clearTimeouts = function () {
    this.clearCloseTimeout();

    if (this.reopenTimeout) {
      clearTimeout(this.reopenTimeout);
    }
  };

  /**
   * Sends a packet
   *
   * @param {Object} packet object.
   * @api private
   */

  Transport.prototype.packet = function (packet) {
    this.send(io.parser.encodePacket(packet));
  };

  /**
   * Send the received heartbeat message back to server. So the server
   * knows we are still connected.
   *
   * @param {String} heartbeat Heartbeat response from the server.
   * @api private
   */

  Transport.prototype.onHeartbeat = function (heartbeat) {
    this.packet({ type: 'heartbeat' });
  };
 
  /**
   * Called when the transport opens.
   *
   * @api private
   */

  Transport.prototype.onOpen = function () {
    this.open = true;
    this.clearCloseTimeout();
    this.socket.onOpen();
  };

  /**
   * Notifies the base when the connection with the Socket.IO server
   * has been disconnected.
   *
   * @api private
   */

  Transport.prototype.onClose = function () {
    var self = this;

    /* FIXME: reopen delay causing a infinit loop
    this.reopenTimeout = setTimeout(function () {
      self.open();
    }, this.socket.options['reopen delay']);*/

    this.open = false;
    this.socket.onClose();
    this.onDisconnect();
  };

  /**
   * Generates a connection url based on the Socket.IO URL Protocol.
   * See <https://github.com/learnboost/socket.io-node/> for more details.
   *
   * @returns {String} Connection url
   * @api private
   */

  Transport.prototype.prepareUrl = function () {
    var options = this.socket.options;

    return this.scheme() + '://'
      + options.host + ':' + options.port + '/'
      + options.resource + '/' + io.protocol
      + '/' + this.name + '/' + this.sessid;
  };

  /**
   * Checks if the transport is ready to start a connection.
   *
   * @param {Socket} socket The socket instance that needs a transport
   * @param {Function} fn The callback
   * @api private
   */

  Transport.prototype.ready = function (socket, fn) {
    fn.call(this);
  };
})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {

  /**
   * Expose constructor.
   */

  exports.Socket = Socket;

  /**
   * Create a new `Socket.IO client` which can establish a persistent
   * connection with a Socket.IO enabled server.
   *
   * @api public
   */

  function Socket (options) {
    this.options = {
        port: 80
      , secure: false
      , document: 'document' in global ? document : false
      , resource: 'socket.io'
      , transports: io.transports
      , 'connect timeout': 10000
      , 'try multiple transports': true
      , 'reconnect': true
      , 'reconnection delay': 500
      , 'reconnection limit': Infinity
      , 'reopen delay': 3000
      , 'max reconnection attempts': 10
      , 'sync disconnect on unload': true
      , 'auto connect': true
      , 'flash policy port': 10843
    };

    io.util.merge(this.options, options);

    this.connected = false;
    this.open = false;
    this.connecting = false;
    this.reconnecting = false;
    this.namespaces = {};
    this.buffer = [];
    this.doBuffer = false;

    if (this.options['sync disconnect on unload'] &&
        (!this.isXDomain() || io.util.ua.hasCORS)) {
      var self = this;

      io.util.on(global, 'beforeunload', function () {
        self.disconnectSync();
      }, false);
    }

    if (this.options['auto connect']) {
      this.connect();
    }
};

  /**
   * Apply EventEmitter mixin.
   */

  io.util.mixin(Socket, io.EventEmitter);

  /**
   * Returns a namespace listener/emitter for this socket
   *
   * @api public
   */

  Socket.prototype.of = function (name) {
    if (!this.namespaces[name]) {
      this.namespaces[name] = new io.SocketNamespace(this, name);

      if (name !== '') {
        this.namespaces[name].packet({ type: 'connect' });
      }
    }

    return this.namespaces[name];
  };

  /**
   * Emits the given event to the Socket and all namespaces
   *
   * @api private
   */

  Socket.prototype.publish = function () {
    this.emit.apply(this, arguments);

    var nsp;

    for (var i in this.namespaces) {
      if (this.namespaces.hasOwnProperty(i)) {
        nsp = this.of(i);
        nsp.$emit.apply(nsp, arguments);
      }
    }
  };

  /**
   * Performs the handshake
   *
   * @api private
   */

  function empty () { };

  Socket.prototype.handshake = function (fn) {
    var self = this
      , options = this.options;

    function complete (data) {
      if (data instanceof Error) {
        self.onError(data.message);
      } else {
        fn.apply(null, data.split(':'));
      }
    };

    var url = [
          'http' + (options.secure ? 's' : '') + ':/'
        , options.host + ':' + options.port
        , options.resource
        , io.protocol
        , io.util.query(this.options.query, 't=' + +new Date)
      ].join('/');

    if (this.isXDomain() && !io.util.ua.hasCORS) {
      var insertAt = document.getElementsByTagName('script')[0]
        , script = document.createElement('script');

      script.src = url + '&jsonp=' + io.j.length;
      insertAt.parentNode.insertBefore(script, insertAt);

      io.j.push(function (data) {
        complete(data);
        script.parentNode.removeChild(script);
      });
    } else {
      var xhr = io.util.request();

      xhr.open('GET', url, true);
      xhr.withCredentials = true;
      xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
          xhr.onreadystatechange = empty;

          if (xhr.status == 200) {
            complete(xhr.responseText);
          } else {
            !self.reconnecting && self.onError(xhr.responseText);
          }
        }
      };
      xhr.send(null);
    }
  };

  /**
   * Find an available transport based on the options supplied in the constructor.
   *
   * @api private
   */

  Socket.prototype.getTransport = function (override) {
    var transports = override || this.transports, match;

    for (var i = 0, transport; transport = transports[i]; i++) {
      if (io.Transport[transport]
        && io.Transport[transport].check(this)
        && (!this.isXDomain() || io.Transport[transport].xdomainCheck())) {
        return new io.Transport[transport](this, this.sessionid);
      }
    }

    return null;
  };

  /**
   * Connects to the server.
   *
   * @param {Function} [fn] Callback.
   * @returns {io.Socket}
   * @api public
   */

  Socket.prototype.connect = function (fn) {
    if (this.connecting) {
      return this;
    }

    var self = this;

    this.handshake(function (sid, heartbeat, close, transports) {
      self.sessionid = sid;
      self.closeTimeout = close * 1000;
      self.heartbeatTimeout = heartbeat * 1000;
      self.transports = io.util.intersect(
          transports.split(',')
        , self.options.transports
      );

      self.setHeartbeatTimeout();

      function connect (transports){
        if (self.transport) self.transport.clearTimeouts();

        self.transport = self.getTransport(transports);
        if (!self.transport) return self.publish('connect_failed');

        // once the transport is ready
        self.transport.ready(self, function () {
          self.connecting = true;
          self.publish('connecting', self.transport.name);
          self.transport.open();

          if (self.options['connect timeout']) {
            self.connectTimeoutTimer = setTimeout(function () {
              if (!self.connected) {
                self.connecting = false;

                if (self.options['try multiple transports']) {
                  if (!self.remainingTransports) {
                    self.remainingTransports = self.transports.slice(0);
                  }

                  var remaining = self.remainingTransports;

                  while (remaining.length > 0 && remaining.splice(0,1)[0] !=
                         self.transport.name) {}

                    if (remaining.length){
                      connect(remaining);
                    } else {
                      self.publish('connect_failed');
                    }
                }
              }
            }, self.options['connect timeout']);
          }
        });
      }

      connect(self.options.transports);

      self.once('connect', function (){
        clearTimeout(self.connectTimeoutTimer);

        fn && typeof fn == 'function' && fn();
      });
    });

    return this;
  };

  /**
   * Clears and sets a new heartbeat timeout using the value given by the
   * server during the handshake.
   *
   * @api private
   */

  Socket.prototype.setHeartbeatTimeout = function () {
    clearTimeout(this.heartbeatTimeoutTimer);

    var self = this;
    this.heartbeatTimeoutTimer = setTimeout(function () {
      self.transport.onClose();
    }, this.heartbeatTimeout);
  };

  /**
   * Sends a message.
   *
   * @param {Object} data packet.
   * @returns {io.Socket}
   * @api public
   */

  Socket.prototype.packet = function (data) {
    if (this.connected && !this.doBuffer) {
      this.transport.packet(data);
    } else {
      this.buffer.push(data);
    }

    return this;
  };

  /**
   * Sets buffer state
   *
   * @api private
   */

  Socket.prototype.setBuffer = function (v) {
    this.doBuffer = v;

    if (!v && this.connected && this.buffer.length) {
      this.transport.payload(this.buffer);
      this.buffer = [];
    }
  };

  /**
   * Disconnect the established connect.
   *
   * @returns {io.Socket}
   * @api public
   */

  Socket.prototype.disconnect = function () {
    if (this.connected || this.connecting) {
      if (this.open) {
        this.of('').packet({ type: 'disconnect' });
      }

      // handle disconnection immediately
      this.onDisconnect('booted');
    }

    return this;
  };

  /**
   * Disconnects the socket with a sync XHR.
   *
   * @api private
   */

  Socket.prototype.disconnectSync = function () {
    // ensure disconnection
    var xhr = io.util.request()
      , uri = this.resource + '/' + io.protocol + '/' + this.sessionid;

    xhr.open('GET', uri, true);

    // handle disconnection immediately
    this.onDisconnect('booted');
  };

  /**
   * Check if we need to use cross domain enabled transports. Cross domain would
   * be a different port or different domain name.
   *
   * @returns {Boolean}
   * @api private
   */

  Socket.prototype.isXDomain = function () {

    var port = global.location.port ||
      ('https:' == global.location.protocol ? 443 : 80);

    return this.options.host !== global.location.hostname 
      || this.options.port != port;
  };

  /**
   * Called upon handshake.
   *
   * @api private
   */

  Socket.prototype.onConnect = function () {
    if (!this.connected) {
      this.connected = true;
      this.connecting = false;
      if (!this.doBuffer) {
        // make sure to flush the buffer
        this.setBuffer(false);
      }
      this.emit('connect');
    }
  };

  /**
   * Called when the transport opens
   *
   * @api private
   */

  Socket.prototype.onOpen = function () {
    this.open = true;
  };

  /**
   * Called when the transport closes.
   *
   * @api private
   */

  Socket.prototype.onClose = function () {
    this.open = false;
    clearTimeout(this.heartbeatTimeoutTimer);
  };

  /**
   * Called when the transport first opens a connection
   *
   * @param text
   */

  Socket.prototype.onPacket = function (packet) {
    this.of(packet.endpoint).onPacket(packet);
  };

  /**
   * Handles an error.
   *
   * @api private
   */

  Socket.prototype.onError = function (err) {
    if (err && err.advice) {
      if (err.advice === 'reconnect' && (this.connected || this.connecting)) {
        this.disconnect();
        if (this.options.reconnect) {
          this.reconnect();
        }
      }
    }

    this.publish('error', err && err.reason ? err.reason : err);
  };

  /**
   * Called when the transport disconnects.
   *
   * @api private
   */

  Socket.prototype.onDisconnect = function (reason) {
    var wasConnected = this.connected
      , wasConnecting = this.connecting;

    this.connected = false;
    this.connecting = false;
    this.open = false;

    if (wasConnected || wasConnecting) {
      this.transport.close();
      this.transport.clearTimeouts();
      if (wasConnected) {
        this.publish('disconnect', reason);

        if ('booted' != reason && this.options.reconnect && !this.reconnecting) {
          this.reconnect();
        }
      }
    }
  };

  /**
   * Called upon reconnection.
   *
   * @api private
   */

  Socket.prototype.reconnect = function () {
    this.reconnecting = true;
    this.reconnectionAttempts = 0;
    this.reconnectionDelay = this.options['reconnection delay'];

    var self = this
      , maxAttempts = this.options['max reconnection attempts']
      , tryMultiple = this.options['try multiple transports']
      , limit = this.options['reconnection limit'];

    function reset () {
      if (self.connected) {
        for (var i in self.namespaces) {
          if (self.namespaces.hasOwnProperty(i) && '' !== i) {
              self.namespaces[i].packet({ type: 'connect' });
          }
        }
        self.publish('reconnect', self.transport.name, self.reconnectionAttempts);
      }

      clearTimeout(self.reconnectionTimer);

      self.removeListener('connect_failed', maybeReconnect);
      self.removeListener('connect', maybeReconnect);

      self.reconnecting = false;

      delete self.reconnectionAttempts;
      delete self.reconnectionDelay;
      delete self.reconnectionTimer;
      delete self.redoTransports;

      self.options['try multiple transports'] = tryMultiple;
    };

    function maybeReconnect () {
      if (!self.reconnecting) {
        return;
      }

      if (self.connected) {
        return reset();
      };

      if (self.connecting && self.reconnecting) {
        return self.reconnectionTimer = setTimeout(maybeReconnect, 1000);
      }

      if (self.reconnectionAttempts++ >= maxAttempts) {
        if (!self.redoTransports) {
          self.on('connect_failed', maybeReconnect);
          self.options['try multiple transports'] = true;
          self.transport = self.getTransport();
          self.redoTransports = true;
          self.connect();
        } else {
          self.publish('reconnect_failed');
          reset();
        }
      } else {
        if (self.reconnectionDelay < limit) {
          self.reconnectionDelay *= 2; // exponential back off
        }

        self.connect();
        self.publish('reconnecting', self.reconnectionDelay, self.reconnectionAttempts);
        self.reconnectionTimer = setTimeout(maybeReconnect, self.reconnectionDelay);
      }
    };

    this.options['try multiple transports'] = false;
    this.reconnectionTimer = setTimeout(maybeReconnect, this.reconnectionDelay);

    this.on('connect', maybeReconnect);
  };

})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Expose constructor.
   */

  exports.SocketNamespace = SocketNamespace;

  /**
   * Socket namespace constructor.
   *
   * @constructor
   * @api public
   */

  function SocketNamespace (socket, name) {
    this.socket = socket;
    this.name = name || '';
    this.flags = {};
    this.json = new Flag(this, 'json');
    this.ackPackets = 0;
    this.acks = {};
  };

  /**
   * Apply EventEmitter mixin.
   */

  io.util.mixin(SocketNamespace, io.EventEmitter);

  /**
   * Copies emit since we override it
   *
   * @api private
   */

  SocketNamespace.prototype.$emit = io.EventEmitter.prototype.emit;

  /**
   * Creates a new namespace, by proxying the request to the socket. This
   * allows us to use the synax as we do on the server.
   *
   * @api public
   */

  SocketNamespace.prototype.of = function () {
    return this.socket.of.apply(this.socket, arguments);
  };

  /**
   * Sends a packet.
   *
   * @api private
   */

  SocketNamespace.prototype.packet = function (packet) {
    packet.endpoint = this.name;
    this.socket.packet(packet);
    this.flags = {};
    return this;
  };

  /**
   * Sends a message
   *
   * @api public
   */

  SocketNamespace.prototype.send = function (data, fn) {
    var packet = {
        type: this.flags.json ? 'json' : 'message'
      , data: data
    };

    if ('function' == typeof fn) {
      packet.id = ++this.ackPackets;
      packet.ack = true;
      this.acks[packet.id] = fn;
    }

    return this.packet(packet);
  };

  /**
   * Emits an event
   *
   * @api public
   */
  
  SocketNamespace.prototype.emit = function (name) {
    var args = Array.prototype.slice.call(arguments, 1)
      , lastArg = args[args.length - 1]
      , packet = {
            type: 'event'
          , name: name
        };

    if ('function' == typeof lastArg) {
      packet.id = ++this.ackPackets;
      packet.ack = 'data';
      this.acks[packet.id] = lastArg;
      args = args.slice(0, args.length - 1);
    }

    packet.args = args;

    return this.packet(packet);
  };

  /**
   * Disconnects the namespace
   *
   * @api private
   */

  SocketNamespace.prototype.disconnect = function () {
    if (this.name === '') {
      this.socket.disconnect();
    } else {
      this.packet({ type: 'disconnect' });
      this.$emit('disconnect');
    }

    return this;
  };

  /**
   * Handles a packet
   *
   * @api private
   */

  SocketNamespace.prototype.onPacket = function (packet) {
    var self = this;

    function ack () {
      self.packet({
          type: 'ack'
        , args: io.util.toArray(arguments)
        , ackId: packet.id
      });
    };

    switch (packet.type) {
      case 'connect':
        this.$emit('connect');
        break;

      case 'disconnect':
        if (this.name === '') {
          this.socket.onDisconnect(packet.reason || 'booted');
        } else {
          this.$emit('disconnect', packet.reason);
        }
        break;

      case 'message':
      case 'json':
        var params = ['message', packet.data];

        if (packet.ack == 'data') {
          params.push(ack);
        } else if (packet.ack) {
          this.packet({ type: 'ack', ackId: packet.id });
        }

        this.$emit.apply(this, params);
        break;

      case 'event':
        var params = [packet.name].concat(packet.args);

        if (packet.ack == 'data')
          params.push(ack);

        this.$emit.apply(this, params);
        break;

      case 'ack':
        if (this.acks[packet.ackId]) {
          this.acks[packet.ackId].apply(this, packet.args);
          delete this.acks[packet.ackId];
        }
        break;

      case 'error':
        if (packet.advice){
          this.socket.onError(packet);
        } else {
          if (packet.reason == 'unauthorized') {
            this.$emit('connect_failed', packet.reason);
          } else {
            this.$emit('error', packet.reason);
          }
        }
        break;
    }
  };

  /**
   * Flag interface.
   *
   * @api private
   */

  function Flag (nsp, name) {
    this.namespace = nsp;
    this.name = name;
  };

  /**
   * Send a message
   *
   * @api public
   */

  Flag.prototype.send = function () {
    this.namespace.flags[this.name] = true;
    this.namespace.send.apply(this.namespace, arguments);
  };

  /**
   * Emit an event
   *
   * @api public
   */

  Flag.prototype.emit = function () {
    this.namespace.flags[this.name] = true;
    this.namespace.emit.apply(this.namespace, arguments);
  };

})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {

  /**
   * Expose constructor.
   */

  exports.websocket = WS;

  /**
   * The WebSocket transport uses the HTML5 WebSocket API to establish an
   * persistent connection with the Socket.IO server. This transport will also
   * be inherited by the FlashSocket fallback as it provides a API compatible
   * polyfill for the WebSockets.
   *
   * @constructor
   * @extends {io.Transport}
   * @api public
   */

  function WS (socket) {
    io.Transport.apply(this, arguments);
  };

  /**
   * Inherits from Transport.
   */

  io.util.inherit(WS, io.Transport);

  /**
   * Transport name
   *
   * @api public
   */

  WS.prototype.name = 'websocket';

  /**
   * Initializes a new `WebSocket` connection with the Socket.IO server. We attach
   * all the appropriate listeners to handle the responses from the server.
   *
   * @returns {Transport}
   * @api public
   */

  WS.prototype.open = function () {
    var query = io.util.query(this.socket.options.query)
      , self = this
      , Socket


    if (!Socket) {
      Socket = global.MozWebSocket || global.WebSocket;
    }

    this.websocket = new Socket(this.prepareUrl() + query);

    this.websocket.onopen = function () {
      self.onOpen();
      self.socket.setBuffer(false);
    };
    this.websocket.onmessage = function (ev) {
      self.onData(ev.data);
    };
    this.websocket.onclose = function () {
      self.onClose();
      self.socket.setBuffer(true);
    };
    this.websocket.onerror = function (e) {
      self.onError(e);
    };

    return this;
  };

  /**
   * Send a message to the Socket.IO server. The message will automatically be
   * encoded in the correct message format.
   *
   * @returns {Transport}
   * @api public
   */

  WS.prototype.send = function (data) {
    this.websocket.send(data);
    return this;
  };

  /**
   * Payload
   *
   * @api private
   */

  WS.prototype.payload = function (arr) {
    for (var i = 0, l = arr.length; i < l; i++) {
      this.packet(arr[i]);
    }
    return this;
  };

  /**
   * Disconnect the established `WebSocket` connection.
   *
   * @returns {Transport}
   * @api public
   */

  WS.prototype.close = function () {
    this.websocket.close();
    return this;
  };

  /**
   * Handle the errors that `WebSocket` might be giving when we
   * are attempting to connect or send messages.
   *
   * @param {Error} e The error.
   * @api private
   */

  WS.prototype.onError = function (e) {
    this.socket.onError(e);
  };

  /**
   * Returns the appropriate scheme for the URI generation.
   *
   * @api private
   */
  WS.prototype.scheme = function () {
    return this.socket.options.secure ? 'wss' : 'ws';
  };

  /**
   * Checks if the browser has support for native `WebSockets` and that
   * it's not the polyfill created for the FlashSocket transport.
   *
   * @return {Boolean}
   * @api public
   */

  WS.check = function () {
    return ('WebSocket' in global && !('__addTask' in WebSocket))
          || 'MozWebSocket' in global;
  };

  /**
   * Check if the `WebSocket` transport support cross domain communications.
   *
   * @returns {Boolean}
   * @api public
   */

  WS.xdomainCheck = function () {
    return true;
  };

  /**
   * Add the transport to your public io.transports array.
   *
   * @api private
   */

  io.transports.push('websocket');

})(
    'undefined' != typeof io ? io.Transport : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Expose constructor.
   */

  exports.flashsocket = Flashsocket;

  /**
   * The FlashSocket transport. This is a API wrapper for the HTML5 WebSocket
   * specification. It uses a .swf file to communicate with the server. If you want
   * to serve the .swf file from a other server than where the Socket.IO script is
   * coming from you need to use the insecure version of the .swf. More information
   * about this can be found on the github page.
   *
   * @constructor
   * @extends {io.Transport.websocket}
   * @api public
   */

  function Flashsocket () {
    io.Transport.websocket.apply(this, arguments);
  };

  /**
   * Inherits from Transport.
   */

  io.util.inherit(Flashsocket, io.Transport.websocket);

  /**
   * Transport name
   *
   * @api public
   */

  Flashsocket.prototype.name = 'flashsocket';

  /**
   * Disconnect the established `FlashSocket` connection. This is done by adding a 
   * new task to the FlashSocket. The rest will be handled off by the `WebSocket` 
   * transport.
   *
   * @returns {Transport}
   * @api public
   */

  Flashsocket.prototype.open = function () {
    var self = this
      , args = arguments;

    WebSocket.__addTask(function () {
      io.Transport.websocket.prototype.open.apply(self, args);
    });
    return this;
  };
  
  /**
   * Sends a message to the Socket.IO server. This is done by adding a new
   * task to the FlashSocket. The rest will be handled off by the `WebSocket` 
   * transport.
   *
   * @returns {Transport}
   * @api public
   */

  Flashsocket.prototype.send = function () {
    var self = this, args = arguments;
    WebSocket.__addTask(function () {
      io.Transport.websocket.prototype.send.apply(self, args);
    });
    return this;
  };

  /**
   * Disconnects the established `FlashSocket` connection.
   *
   * @returns {Transport}
   * @api public
   */

  Flashsocket.prototype.close = function () {
    WebSocket.__tasks.length = 0;
    io.Transport.websocket.prototype.close.call(this);
    return this;
  };

  /**
   * The WebSocket fall back needs to append the flash container to the body
   * element, so we need to make sure we have access to it. Or defer the call
   * until we are sure there is a body element.
   *
   * @param {Socket} socket The socket instance that needs a transport
   * @param {Function} fn The callback
   * @api private
   */

  Flashsocket.prototype.ready = function (socket, fn) {
    function init () {
      var options = socket.options
        , port = options['flash policy port']
        , path = [
              'http' + (options.secure ? 's' : '') + ':/'
            , options.host + ':' + options.port
            , options.resource
            , 'static/flashsocket'
            , 'WebSocketMain' + (socket.isXDomain() ? 'Insecure' : '') + '.swf'
          ];

      // Only start downloading the swf file when the checked that this browser
      // actually supports it
      if (!Flashsocket.loaded) {
        if (typeof WEB_SOCKET_SWF_LOCATION === 'undefined') {
          // Set the correct file based on the XDomain settings
          WEB_SOCKET_SWF_LOCATION = path.join('/');
        }

        if (port !== 843) {
          WebSocket.loadFlashPolicyFile('xmlsocket://' + options.host + ':' + port);
        }

        WebSocket.__initialize();
        Flashsocket.loaded = true;
      }

      fn.call(self);
    }

    var self = this;
    if (document.body) return init();

    io.util.load(init);
  };

  /**
   * Check if the FlashSocket transport is supported as it requires that the Adobe
   * Flash Player plug-in version `10.0.0` or greater is installed. And also check if
   * the polyfill is correctly loaded.
   *
   * @returns {Boolean}
   * @api public
   */

  Flashsocket.check = function () {
    if (
        typeof WebSocket == 'undefined'
      || !('__initialize' in WebSocket) || !swfobject
    ) return false;

    return swfobject.getFlashPlayerVersion().major >= 10;
  };

  /**
   * Check if the FlashSocket transport can be used as cross domain / cross origin 
   * transport. Because we can't see which type (secure or insecure) of .swf is used
   * we will just return true.
   *
   * @returns {Boolean}
   * @api public
   */

  Flashsocket.xdomainCheck = function () {
    return true;
  };

  /**
   * Disable AUTO_INITIALIZATION
   */

  if (typeof window != 'undefined') {
    WEB_SOCKET_DISABLE_AUTO_INITIALIZATION = true;
  }

  /**
   * Add the transport to your public io.transports array.
   *
   * @api private
   */

  io.transports.push('flashsocket');
})(
    'undefined' != typeof io ? io.Transport : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);
/*	SWFObject v2.2 <http://code.google.com/p/swfobject/> 
	is released under the MIT License <http://www.opensource.org/licenses/mit-license.php> 
*/
if ('undefined' != typeof window) {
var swfobject=function(){var D="undefined",r="object",S="Shockwave Flash",W="ShockwaveFlash.ShockwaveFlash",q="application/x-shockwave-flash",R="SWFObjectExprInst",x="onreadystatechange",O=window,j=document,t=navigator,T=false,U=[h],o=[],N=[],I=[],l,Q,E,B,J=false,a=false,n,G,m=true,M=function(){var aa=typeof j.getElementById!=D&&typeof j.getElementsByTagName!=D&&typeof j.createElement!=D,ah=t.userAgent.toLowerCase(),Y=t.platform.toLowerCase(),ae=Y?/win/.test(Y):/win/.test(ah),ac=Y?/mac/.test(Y):/mac/.test(ah),af=/webkit/.test(ah)?parseFloat(ah.replace(/^.*webkit\/(\d+(\.\d+)?).*$/,"$1")):false,X=!+"\v1",ag=[0,0,0],ab=null;if(typeof t.plugins!=D&&typeof t.plugins[S]==r){ab=t.plugins[S].description;if(ab&&!(typeof t.mimeTypes!=D&&t.mimeTypes[q]&&!t.mimeTypes[q].enabledPlugin)){T=true;X=false;ab=ab.replace(/^.*\s+(\S+\s+\S+$)/,"$1");ag[0]=parseInt(ab.replace(/^(.*)\..*$/,"$1"),10);ag[1]=parseInt(ab.replace(/^.*\.(.*)\s.*$/,"$1"),10);ag[2]=/[a-zA-Z]/.test(ab)?parseInt(ab.replace(/^.*[a-zA-Z]+(.*)$/,"$1"),10):0}}else{if(typeof O[(['Active'].concat('Object').join('X'))]!=D){try{var ad=new window[(['Active'].concat('Object').join('X'))](W);if(ad){ab=ad.GetVariable("$version");if(ab){X=true;ab=ab.split(" ")[1].split(",");ag=[parseInt(ab[0],10),parseInt(ab[1],10),parseInt(ab[2],10)]}}}catch(Z){}}}return{w3:aa,pv:ag,wk:af,ie:X,win:ae,mac:ac}}(),k=function(){if(!M.w3){return}if((typeof j.readyState!=D&&j.readyState=="complete")||(typeof j.readyState==D&&(j.getElementsByTagName("body")[0]||j.body))){f()}if(!J){if(typeof j.addEventListener!=D){j.addEventListener("DOMContentLoaded",f,false)}if(M.ie&&M.win){j.attachEvent(x,function(){if(j.readyState=="complete"){j.detachEvent(x,arguments.callee);f()}});if(O==top){(function(){if(J){return}try{j.documentElement.doScroll("left")}catch(X){setTimeout(arguments.callee,0);return}f()})()}}if(M.wk){(function(){if(J){return}if(!/loaded|complete/.test(j.readyState)){setTimeout(arguments.callee,0);return}f()})()}s(f)}}();function f(){if(J){return}try{var Z=j.getElementsByTagName("body")[0].appendChild(C("span"));Z.parentNode.removeChild(Z)}catch(aa){return}J=true;var X=U.length;for(var Y=0;Y<X;Y++){U[Y]()}}function K(X){if(J){X()}else{U[U.length]=X}}function s(Y){if(typeof O.addEventListener!=D){O.addEventListener("load",Y,false)}else{if(typeof j.addEventListener!=D){j.addEventListener("load",Y,false)}else{if(typeof O.attachEvent!=D){i(O,"onload",Y)}else{if(typeof O.onload=="function"){var X=O.onload;O.onload=function(){X();Y()}}else{O.onload=Y}}}}}function h(){if(T){V()}else{H()}}function V(){var X=j.getElementsByTagName("body")[0];var aa=C(r);aa.setAttribute("type",q);var Z=X.appendChild(aa);if(Z){var Y=0;(function(){if(typeof Z.GetVariable!=D){var ab=Z.GetVariable("$version");if(ab){ab=ab.split(" ")[1].split(",");M.pv=[parseInt(ab[0],10),parseInt(ab[1],10),parseInt(ab[2],10)]}}else{if(Y<10){Y++;setTimeout(arguments.callee,10);return}}X.removeChild(aa);Z=null;H()})()}else{H()}}function H(){var ag=o.length;if(ag>0){for(var af=0;af<ag;af++){var Y=o[af].id;var ab=o[af].callbackFn;var aa={success:false,id:Y};if(M.pv[0]>0){var ae=c(Y);if(ae){if(F(o[af].swfVersion)&&!(M.wk&&M.wk<312)){w(Y,true);if(ab){aa.success=true;aa.ref=z(Y);ab(aa)}}else{if(o[af].expressInstall&&A()){var ai={};ai.data=o[af].expressInstall;ai.width=ae.getAttribute("width")||"0";ai.height=ae.getAttribute("height")||"0";if(ae.getAttribute("class")){ai.styleclass=ae.getAttribute("class")}if(ae.getAttribute("align")){ai.align=ae.getAttribute("align")}var ah={};var X=ae.getElementsByTagName("param");var ac=X.length;for(var ad=0;ad<ac;ad++){if(X[ad].getAttribute("name").toLowerCase()!="movie"){ah[X[ad].getAttribute("name")]=X[ad].getAttribute("value")}}P(ai,ah,Y,ab)}else{p(ae);if(ab){ab(aa)}}}}}else{w(Y,true);if(ab){var Z=z(Y);if(Z&&typeof Z.SetVariable!=D){aa.success=true;aa.ref=Z}ab(aa)}}}}}function z(aa){var X=null;var Y=c(aa);if(Y&&Y.nodeName=="OBJECT"){if(typeof Y.SetVariable!=D){X=Y}else{var Z=Y.getElementsByTagName(r)[0];if(Z){X=Z}}}return X}function A(){return !a&&F("6.0.65")&&(M.win||M.mac)&&!(M.wk&&M.wk<312)}function P(aa,ab,X,Z){a=true;E=Z||null;B={success:false,id:X};var ae=c(X);if(ae){if(ae.nodeName=="OBJECT"){l=g(ae);Q=null}else{l=ae;Q=X}aa.id=R;if(typeof aa.width==D||(!/%$/.test(aa.width)&&parseInt(aa.width,10)<310)){aa.width="310"}if(typeof aa.height==D||(!/%$/.test(aa.height)&&parseInt(aa.height,10)<137)){aa.height="137"}j.title=j.title.slice(0,47)+" - Flash Player Installation";var ad=M.ie&&M.win?(['Active'].concat('').join('X')):"PlugIn",ac="MMredirectURL="+O.location.toString().replace(/&/g,"%26")+"&MMplayerType="+ad+"&MMdoctitle="+j.title;if(typeof ab.flashvars!=D){ab.flashvars+="&"+ac}else{ab.flashvars=ac}if(M.ie&&M.win&&ae.readyState!=4){var Y=C("div");X+="SWFObjectNew";Y.setAttribute("id",X);ae.parentNode.insertBefore(Y,ae);ae.style.display="none";(function(){if(ae.readyState==4){ae.parentNode.removeChild(ae)}else{setTimeout(arguments.callee,10)}})()}u(aa,ab,X)}}function p(Y){if(M.ie&&M.win&&Y.readyState!=4){var X=C("div");Y.parentNode.insertBefore(X,Y);X.parentNode.replaceChild(g(Y),X);Y.style.display="none";(function(){if(Y.readyState==4){Y.parentNode.removeChild(Y)}else{setTimeout(arguments.callee,10)}})()}else{Y.parentNode.replaceChild(g(Y),Y)}}function g(ab){var aa=C("div");if(M.win&&M.ie){aa.innerHTML=ab.innerHTML}else{var Y=ab.getElementsByTagName(r)[0];if(Y){var ad=Y.childNodes;if(ad){var X=ad.length;for(var Z=0;Z<X;Z++){if(!(ad[Z].nodeType==1&&ad[Z].nodeName=="PARAM")&&!(ad[Z].nodeType==8)){aa.appendChild(ad[Z].cloneNode(true))}}}}}return aa}function u(ai,ag,Y){var X,aa=c(Y);if(M.wk&&M.wk<312){return X}if(aa){if(typeof ai.id==D){ai.id=Y}if(M.ie&&M.win){var ah="";for(var ae in ai){if(ai[ae]!=Object.prototype[ae]){if(ae.toLowerCase()=="data"){ag.movie=ai[ae]}else{if(ae.toLowerCase()=="styleclass"){ah+=' class="'+ai[ae]+'"'}else{if(ae.toLowerCase()!="classid"){ah+=" "+ae+'="'+ai[ae]+'"'}}}}}var af="";for(var ad in ag){if(ag[ad]!=Object.prototype[ad]){af+='<param name="'+ad+'" value="'+ag[ad]+'" />'}}aa.outerHTML='<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"'+ah+">"+af+"</object>";N[N.length]=ai.id;X=c(ai.id)}else{var Z=C(r);Z.setAttribute("type",q);for(var ac in ai){if(ai[ac]!=Object.prototype[ac]){if(ac.toLowerCase()=="styleclass"){Z.setAttribute("class",ai[ac])}else{if(ac.toLowerCase()!="classid"){Z.setAttribute(ac,ai[ac])}}}}for(var ab in ag){if(ag[ab]!=Object.prototype[ab]&&ab.toLowerCase()!="movie"){e(Z,ab,ag[ab])}}aa.parentNode.replaceChild(Z,aa);X=Z}}return X}function e(Z,X,Y){var aa=C("param");aa.setAttribute("name",X);aa.setAttribute("value",Y);Z.appendChild(aa)}function y(Y){var X=c(Y);if(X&&X.nodeName=="OBJECT"){if(M.ie&&M.win){X.style.display="none";(function(){if(X.readyState==4){b(Y)}else{setTimeout(arguments.callee,10)}})()}else{X.parentNode.removeChild(X)}}}function b(Z){var Y=c(Z);if(Y){for(var X in Y){if(typeof Y[X]=="function"){Y[X]=null}}Y.parentNode.removeChild(Y)}}function c(Z){var X=null;try{X=j.getElementById(Z)}catch(Y){}return X}function C(X){return j.createElement(X)}function i(Z,X,Y){Z.attachEvent(X,Y);I[I.length]=[Z,X,Y]}function F(Z){var Y=M.pv,X=Z.split(".");X[0]=parseInt(X[0],10);X[1]=parseInt(X[1],10)||0;X[2]=parseInt(X[2],10)||0;return(Y[0]>X[0]||(Y[0]==X[0]&&Y[1]>X[1])||(Y[0]==X[0]&&Y[1]==X[1]&&Y[2]>=X[2]))?true:false}function v(ac,Y,ad,ab){if(M.ie&&M.mac){return}var aa=j.getElementsByTagName("head")[0];if(!aa){return}var X=(ad&&typeof ad=="string")?ad:"screen";if(ab){n=null;G=null}if(!n||G!=X){var Z=C("style");Z.setAttribute("type","text/css");Z.setAttribute("media",X);n=aa.appendChild(Z);if(M.ie&&M.win&&typeof j.styleSheets!=D&&j.styleSheets.length>0){n=j.styleSheets[j.styleSheets.length-1]}G=X}if(M.ie&&M.win){if(n&&typeof n.addRule==r){n.addRule(ac,Y)}}else{if(n&&typeof j.createTextNode!=D){n.appendChild(j.createTextNode(ac+" {"+Y+"}"))}}}function w(Z,X){if(!m){return}var Y=X?"visible":"hidden";if(J&&c(Z)){c(Z).style.visibility=Y}else{v("#"+Z,"visibility:"+Y)}}function L(Y){var Z=/[\\\"<>\.;]/;var X=Z.exec(Y)!=null;return X&&typeof encodeURIComponent!=D?encodeURIComponent(Y):Y}var d=function(){if(M.ie&&M.win){window.attachEvent("onunload",function(){var ac=I.length;for(var ab=0;ab<ac;ab++){I[ab][0].detachEvent(I[ab][1],I[ab][2])}var Z=N.length;for(var aa=0;aa<Z;aa++){y(N[aa])}for(var Y in M){M[Y]=null}M=null;for(var X in swfobject){swfobject[X]=null}swfobject=null})}}();return{registerObject:function(ab,X,aa,Z){if(M.w3&&ab&&X){var Y={};Y.id=ab;Y.swfVersion=X;Y.expressInstall=aa;Y.callbackFn=Z;o[o.length]=Y;w(ab,false)}else{if(Z){Z({success:false,id:ab})}}},getObjectById:function(X){if(M.w3){return z(X)}},embedSWF:function(ab,ah,ae,ag,Y,aa,Z,ad,af,ac){var X={success:false,id:ah};if(M.w3&&!(M.wk&&M.wk<312)&&ab&&ah&&ae&&ag&&Y){w(ah,false);K(function(){ae+="";ag+="";var aj={};if(af&&typeof af===r){for(var al in af){aj[al]=af[al]}}aj.data=ab;aj.width=ae;aj.height=ag;var am={};if(ad&&typeof ad===r){for(var ak in ad){am[ak]=ad[ak]}}if(Z&&typeof Z===r){for(var ai in Z){if(typeof am.flashvars!=D){am.flashvars+="&"+ai+"="+Z[ai]}else{am.flashvars=ai+"="+Z[ai]}}}if(F(Y)){var an=u(aj,am,ah);if(aj.id==ah){w(ah,true)}X.success=true;X.ref=an}else{if(aa&&A()){aj.data=aa;P(aj,am,ah,ac);return}else{w(ah,true)}}if(ac){ac(X)}})}else{if(ac){ac(X)}}},switchOffAutoHideShow:function(){m=false},ua:M,getFlashPlayerVersion:function(){return{major:M.pv[0],minor:M.pv[1],release:M.pv[2]}},hasFlashPlayerVersion:F,createSWF:function(Z,Y,X){if(M.w3){return u(Z,Y,X)}else{return undefined}},showExpressInstall:function(Z,aa,X,Y){if(M.w3&&A()){P(Z,aa,X,Y)}},removeSWF:function(X){if(M.w3){y(X)}},createCSS:function(aa,Z,Y,X){if(M.w3){v(aa,Z,Y,X)}},addDomLoadEvent:K,addLoadEvent:s,getQueryParamValue:function(aa){var Z=j.location.search||j.location.hash;if(Z){if(/\?/.test(Z)){Z=Z.split("?")[1]}if(aa==null){return L(Z)}var Y=Z.split("&");for(var X=0;X<Y.length;X++){if(Y[X].substring(0,Y[X].indexOf("="))==aa){return L(Y[X].substring((Y[X].indexOf("=")+1)))}}}return""},expressInstallCallback:function(){if(a){var X=c(R);if(X&&l){X.parentNode.replaceChild(l,X);if(Q){w(Q,true);if(M.ie&&M.win){l.style.display="block"}}if(E){E(B)}}a=false}}}}();
}
// Copyright: Hiroshi Ichikawa <http://gimite.net/en/>
// License: New BSD License
// Reference: http://dev.w3.org/html5/websockets/
// Reference: http://tools.ietf.org/html/draft-hixie-thewebsocketprotocol

(function() {
  
  if ('undefined' == typeof window || window.WebSocket) return;

  var console = window.console;
  if (!console || !console.log || !console.error) {
    console = {log: function(){ }, error: function(){ }};
  }
  
  if (!swfobject.hasFlashPlayerVersion("10.0.0")) {
    console.error("Flash Player >= 10.0.0 is required.");
    return;
  }
  if (location.protocol == "file:") {
    console.error(
      "WARNING: web-socket-js doesn't work in file:///... URL " +
      "unless you set Flash Security Settings properly. " +
      "Open the page via Web server i.e. http://...");
  }

  /**
   * This class represents a faux web socket.
   * @param {string} url
   * @param {array or string} protocols
   * @param {string} proxyHost
   * @param {int} proxyPort
   * @param {string} headers
   */
  WebSocket = function(url, protocols, proxyHost, proxyPort, headers) {
    var self = this;
    self.__id = WebSocket.__nextId++;
    WebSocket.__instances[self.__id] = self;
    self.readyState = WebSocket.CONNECTING;
    self.bufferedAmount = 0;
    self.__events = {};
    if (!protocols) {
      protocols = [];
    } else if (typeof protocols == "string") {
      protocols = [protocols];
    }
    // Uses setTimeout() to make sure __createFlash() runs after the caller sets ws.onopen etc.
    // Otherwise, when onopen fires immediately, onopen is called before it is set.
    setTimeout(function() {
      WebSocket.__addTask(function() {
        WebSocket.__flash.create(
            self.__id, url, protocols, proxyHost || null, proxyPort || 0, headers || null);
      });
    }, 0);
  };

  /**
   * Send data to the web socket.
   * @param {string} data  The data to send to the socket.
   * @return {boolean}  True for success, false for failure.
   */
  WebSocket.prototype.send = function(data) {
    if (this.readyState == WebSocket.CONNECTING) {
      throw "INVALID_STATE_ERR: Web Socket connection has not been established";
    }
    // We use encodeURIComponent() here, because FABridge doesn't work if
    // the argument includes some characters. We don't use escape() here
    // because of this:
    // https://developer.mozilla.org/en/Core_JavaScript_1.5_Guide/Functions#escape_and_unescape_Functions
    // But it looks decodeURIComponent(encodeURIComponent(s)) doesn't
    // preserve all Unicode characters either e.g. "\uffff" in Firefox.
    // Note by wtritch: Hopefully this will not be necessary using ExternalInterface.  Will require
    // additional testing.
    var result = WebSocket.__flash.send(this.__id, encodeURIComponent(data));
    if (result < 0) { // success
      return true;
    } else {
      this.bufferedAmount += result;
      return false;
    }
  };

  /**
   * Close this web socket gracefully.
   */
  WebSocket.prototype.close = function() {
    if (this.readyState == WebSocket.CLOSED || this.readyState == WebSocket.CLOSING) {
      return;
    }
    this.readyState = WebSocket.CLOSING;
    WebSocket.__flash.close(this.__id);
  };

  /**
   * Implementation of {@link <a href="http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-registration">DOM 2 EventTarget Interface</a>}
   *
   * @param {string} type
   * @param {function} listener
   * @param {boolean} useCapture
   * @return void
   */
  WebSocket.prototype.addEventListener = function(type, listener, useCapture) {
    if (!(type in this.__events)) {
      this.__events[type] = [];
    }
    this.__events[type].push(listener);
  };

  /**
   * Implementation of {@link <a href="http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-registration">DOM 2 EventTarget Interface</a>}
   *
   * @param {string} type
   * @param {function} listener
   * @param {boolean} useCapture
   * @return void
   */
  WebSocket.prototype.removeEventListener = function(type, listener, useCapture) {
    if (!(type in this.__events)) return;
    var events = this.__events[type];
    for (var i = events.length - 1; i >= 0; --i) {
      if (events[i] === listener) {
        events.splice(i, 1);
        break;
      }
    }
  };

  /**
   * Implementation of {@link <a href="http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-registration">DOM 2 EventTarget Interface</a>}
   *
   * @param {Event} event
   * @return void
   */
  WebSocket.prototype.dispatchEvent = function(event) {
    var events = this.__events[event.type] || [];
    for (var i = 0; i < events.length; ++i) {
      events[i](event);
    }
    var handler = this["on" + event.type];
    if (handler) handler(event);
  };

  /**
   * Handles an event from Flash.
   * @param {Object} flashEvent
   */
  WebSocket.prototype.__handleEvent = function(flashEvent) {
    if ("readyState" in flashEvent) {
      this.readyState = flashEvent.readyState;
    }
    if ("protocol" in flashEvent) {
      this.protocol = flashEvent.protocol;
    }
    
    var jsEvent;
    if (flashEvent.type == "open" || flashEvent.type == "error") {
      jsEvent = this.__createSimpleEvent(flashEvent.type);
    } else if (flashEvent.type == "close") {
      // TODO implement jsEvent.wasClean
      jsEvent = this.__createSimpleEvent("close");
    } else if (flashEvent.type == "message") {
      var data = decodeURIComponent(flashEvent.message);
      jsEvent = this.__createMessageEvent("message", data);
    } else {
      throw "unknown event type: " + flashEvent.type;
    }
    
    this.dispatchEvent(jsEvent);
  };
  
  WebSocket.prototype.__createSimpleEvent = function(type) {
    if (document.createEvent && window.Event) {
      var event = document.createEvent("Event");
      event.initEvent(type, false, false);
      return event;
    } else {
      return {type: type, bubbles: false, cancelable: false};
    }
  };
  
  WebSocket.prototype.__createMessageEvent = function(type, data) {
    if (document.createEvent && window.MessageEvent && !window.opera) {
      var event = document.createEvent("MessageEvent");
      event.initMessageEvent("message", false, false, data, null, null, window, null);
      return event;
    } else {
      // IE and Opera, the latter one truncates the data parameter after any 0x00 bytes.
      return {type: type, data: data, bubbles: false, cancelable: false};
    }
  };
  
  /**
   * Define the WebSocket readyState enumeration.
   */
  WebSocket.CONNECTING = 0;
  WebSocket.OPEN = 1;
  WebSocket.CLOSING = 2;
  WebSocket.CLOSED = 3;

  WebSocket.__flash = null;
  WebSocket.__instances = {};
  WebSocket.__tasks = [];
  WebSocket.__nextId = 0;
  
  /**
   * Load a new flash security policy file.
   * @param {string} url
   */
  WebSocket.loadFlashPolicyFile = function(url){
    WebSocket.__addTask(function() {
      WebSocket.__flash.loadManualPolicyFile(url);
    });
  };

  /**
   * Loads WebSocketMain.swf and creates WebSocketMain object in Flash.
   */
  WebSocket.__initialize = function() {
    if (WebSocket.__flash) return;
    
    if (WebSocket.__swfLocation) {
      // For backword compatibility.
      window.WEB_SOCKET_SWF_LOCATION = WebSocket.__swfLocation;
    }
    if (!window.WEB_SOCKET_SWF_LOCATION) {
      console.error("[WebSocket] set WEB_SOCKET_SWF_LOCATION to location of WebSocketMain.swf");
      return;
    }
    var container = document.createElement("div");
    container.id = "webSocketContainer";
    // Hides Flash box. We cannot use display: none or visibility: hidden because it prevents
    // Flash from loading at least in IE. So we move it out of the screen at (-100, -100).
    // But this even doesn't work with Flash Lite (e.g. in Droid Incredible). So with Flash
    // Lite, we put it at (0, 0). This shows 1x1 box visible at left-top corner but this is
    // the best we can do as far as we know now.
    container.style.position = "absolute";
    if (WebSocket.__isFlashLite()) {
      container.style.left = "0px";
      container.style.top = "0px";
    } else {
      container.style.left = "-100px";
      container.style.top = "-100px";
    }
    var holder = document.createElement("div");
    holder.id = "webSocketFlash";
    container.appendChild(holder);
    document.body.appendChild(container);
    // See this article for hasPriority:
    // http://help.adobe.com/en_US/as3/mobile/WS4bebcd66a74275c36cfb8137124318eebc6-7ffd.html
    swfobject.embedSWF(
      WEB_SOCKET_SWF_LOCATION,
      "webSocketFlash",
      "1" /* width */,
      "1" /* height */,
      "10.0.0" /* SWF version */,
      null,
      null,
      {hasPriority: true, swliveconnect : true, allowScriptAccess: "always"},
      null,
      function(e) {
        if (!e.success) {
          console.error("[WebSocket] swfobject.embedSWF failed");
        }
      });
  };
  
  /**
   * Called by Flash to notify JS that it's fully loaded and ready
   * for communication.
   */
  WebSocket.__onFlashInitialized = function() {
    // We need to set a timeout here to avoid round-trip calls
    // to flash during the initialization process.
    setTimeout(function() {
      WebSocket.__flash = document.getElementById("webSocketFlash");
      WebSocket.__flash.setCallerUrl(location.href);
      WebSocket.__flash.setDebug(!!window.WEB_SOCKET_DEBUG);
      for (var i = 0; i < WebSocket.__tasks.length; ++i) {
        WebSocket.__tasks[i]();
      }
      WebSocket.__tasks = [];
    }, 0);
  };
  
  /**
   * Called by Flash to notify WebSockets events are fired.
   */
  WebSocket.__onFlashEvent = function() {
    setTimeout(function() {
      try {
        // Gets events using receiveEvents() instead of getting it from event object
        // of Flash event. This is to make sure to keep message order.
        // It seems sometimes Flash events don't arrive in the same order as they are sent.
        var events = WebSocket.__flash.receiveEvents();
        for (var i = 0; i < events.length; ++i) {
          WebSocket.__instances[events[i].webSocketId].__handleEvent(events[i]);
        }
      } catch (e) {
        console.error(e);
      }
    }, 0);
    return true;
  };
  
  // Called by Flash.
  WebSocket.__log = function(message) {
    console.log(decodeURIComponent(message));
  };
  
  // Called by Flash.
  WebSocket.__error = function(message) {
    console.error(decodeURIComponent(message));
  };
  
  WebSocket.__addTask = function(task) {
    if (WebSocket.__flash) {
      task();
    } else {
      WebSocket.__tasks.push(task);
    }
  };
  
  /**
   * Test if the browser is running flash lite.
   * @return {boolean} True if flash lite is running, false otherwise.
   */
  WebSocket.__isFlashLite = function() {
    if (!window.navigator || !window.navigator.mimeTypes) {
      return false;
    }
    var mimeType = window.navigator.mimeTypes["application/x-shockwave-flash"];
    if (!mimeType || !mimeType.enabledPlugin || !mimeType.enabledPlugin.filename) {
      return false;
    }
    return mimeType.enabledPlugin.filename.match(/flashlite/i) ? true : false;
  };
  
  if (!window.WEB_SOCKET_DISABLE_AUTO_INITIALIZATION) {
    if (window.addEventListener) {
      window.addEventListener("load", function(){
        WebSocket.__initialize();
      }, false);
    } else {
      window.attachEvent("onload", function(){
        WebSocket.__initialize();
      });
    }
  }
  
})();

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {

  /**
   * Expose constructor.
   *
   * @api public
   */
  
  exports.XHR = XHR;

  /**
   * XHR constructor
   *
   * @costructor
   * @api public
   */

  function XHR (socket) {
    if (!socket) return;

    io.Transport.apply(this, arguments);
    this.sendBuffer = [];
  };

  /**
   * Inherits from Transport.
   */

  io.util.inherit(XHR, io.Transport);

  /**
   * Establish a connection
   *
   * @returns {Transport}
   * @api public
   */

  XHR.prototype.open = function () {
    this.socket.setBuffer(false);
    this.onOpen();
    this.get();

    // we need to make sure the request succeeds since we have no indication
    // whether the request opened or not until it succeeded.
    this.setCloseTimeout();

    return this;
  };

  /**
   * Check if we need to send data to the Socket.IO server, if we have data in our
   * buffer we encode it and forward it to the `post` method.
   *
   * @api private
   */

  XHR.prototype.payload = function (payload) {
    var msgs = [];

    for (var i = 0, l = payload.length; i < l; i++) {
      msgs.push(io.parser.encodePacket(payload[i]));
    }

    this.send(io.parser.encodePayload(msgs));
  };

  /**
   * Send data to the Socket.IO server.
   *
   * @param data The message
   * @returns {Transport}
   * @api public
   */

  XHR.prototype.send = function (data) {
    this.post(data);
    return this;
  };

  /**
   * Posts a encoded message to the Socket.IO server.
   *
   * @param {String} data A encoded message.
   * @api private
   */

  function empty () { };

  XHR.prototype.post = function (data) {
    var self = this;
    this.socket.setBuffer(true);

    function stateChange () {
      if (this.readyState == 4) {
        this.onreadystatechange = empty;
        self.posting = false;

        if (this.status == 200){
          self.socket.setBuffer(false);
        } else {
          self.onClose();
        }
      }
    }

    function onload () {
      this.onload = empty;
      self.socket.setBuffer(false);
    };

    this.sendXHR = this.request('POST');

    if (global.XDomainRequest && this.sendXHR instanceof XDomainRequest) {
      this.sendXHR.onload = this.sendXHR.onerror = onload;
    } else {
      this.sendXHR.onreadystatechange = stateChange;
    }

    this.sendXHR.send(data);
  };

  /**
   * Disconnects the established `XHR` connection.
   *
   * @returns {Transport} 
   * @api public
   */

  XHR.prototype.close = function () {
    this.onClose();
    return this;
  };

  /**
   * Generates a configured XHR request
   *
   * @param {String} url The url that needs to be requested.
   * @param {String} method The method the request should use.
   * @returns {XMLHttpRequest}
   * @api private
   */

  XHR.prototype.request = function (method) {
    var req = io.util.request(this.socket.isXDomain())
      , query = io.util.query(this.socket.options.query, 't=' + +new Date);

    req.open(method || 'GET', this.prepareUrl() + query, true);

    if (method == 'POST') {
      try {
        if (req.setRequestHeader) {
          req.setRequestHeader('Content-type', 'text/plain;charset=UTF-8');
        } else {
          // XDomainRequest
          req.contentType = 'text/plain';
        }
      } catch (e) {}
    }

    return req;
  };

  /**
   * Returns the scheme to use for the transport URLs.
   *
   * @api private
   */

  XHR.prototype.scheme = function () {
    return this.socket.options.secure ? 'https' : 'http';
  };

  /**
   * Check if the XHR transports are supported
   *
   * @param {Boolean} xdomain Check if we support cross domain requests.
   * @returns {Boolean}
   * @api public
   */

  XHR.check = function (socket, xdomain) {
    try {
      if (io.util.request(xdomain)) {
        return true;
      }
    } catch(e) {}

    return false;
  };

  /**
   * Check if the XHR transport supports corss domain requests.
   * 
   * @returns {Boolean}
   * @api public
   */

  XHR.xdomainCheck = function () {
    return XHR.check(null, true);
  };

})(
    'undefined' != typeof io ? io.Transport : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Expose constructor.
   */

  exports.htmlfile = HTMLFile;

  /**
   * The HTMLFile transport creates a `forever iframe` based transport
   * for Internet Explorer. Regular forever iframe implementations will 
   * continuously trigger the browsers buzy indicators. If the forever iframe
   * is created inside a `htmlfile` these indicators will not be trigged.
   *
   * @constructor
   * @extends {io.Transport.XHR}
   * @api public
   */

  function HTMLFile (socket) {
    io.Transport.XHR.apply(this, arguments);
  };

  /**
   * Inherits from XHR transport.
   */

  io.util.inherit(HTMLFile, io.Transport.XHR);

  /**
   * Transport name
   *
   * @api public
   */

  HTMLFile.prototype.name = 'htmlfile';

  /**
   * Creates a new Ac...eX `htmlfile` with a forever loading iframe
   * that can be used to listen to messages. Inside the generated
   * `htmlfile` a reference will be made to the HTMLFile transport.
   *
   * @api private
   */

  HTMLFile.prototype.get = function () {
    this.doc = new window[(['Active'].concat('Object').join('X'))]('htmlfile');
    this.doc.open();
    this.doc.write('<html></html>');
    this.doc.close();
    this.doc.parentWindow.s = this;

    var iframeC = this.doc.createElement('div');
    iframeC.className = 'socketio';

    this.doc.body.appendChild(iframeC);
    this.iframe = this.doc.createElement('iframe');

    iframeC.appendChild(this.iframe);

    var self = this
      , query = io.util.query(this.socket.options.query, 't='+ +new Date);

    this.iframe.src = this.prepareUrl() + query;

    io.util.on(window, 'unload', function () {
      self.destroy();
    });
  };

  /**
   * The Socket.IO server will write script tags inside the forever
   * iframe, this function will be used as callback for the incoming
   * information.
   *
   * @param {String} data The message
   * @param {document} doc Reference to the context
   * @api private
   */

  HTMLFile.prototype._ = function (data, doc) {
    this.onData(data);
    try {
      var script = doc.getElementsByTagName('script')[0];
      script.parentNode.removeChild(script);
    } catch (e) { }
  };

  /**
   * Destroy the established connection, iframe and `htmlfile`.
   * And calls the `CollectGarbage` function of Internet Explorer
   * to release the memory.
   *
   * @api private
   */

  HTMLFile.prototype.destroy = function () {
    if (this.iframe){
      try {
        this.iframe.src = 'about:blank';
      } catch(e){}

      this.doc = null;
      this.iframe.parentNode.removeChild(this.iframe);
      this.iframe = null;

      CollectGarbage();
    }
  };

  /**
   * Disconnects the established connection.
   *
   * @returns {Transport} Chaining.
   * @api public
   */

  HTMLFile.prototype.close = function () {
    this.destroy();
    return io.Transport.XHR.prototype.close.call(this);
  };

  /**
   * Checks if the browser supports this transport. The browser
   * must have an `Ac...eXObject` implementation.
   *
   * @return {Boolean}
   * @api public
   */

  HTMLFile.check = function () {
    if (typeof window != "undefined" && (['Active'].concat('Object').join('X')) in window){
      try {
        var a = new window[(['Active'].concat('Object').join('X'))]('htmlfile');
        return a && io.Transport.XHR.check();
      } catch(e){}
    }
    return false;
  };

  /**
   * Check if cross domain requests are supported.
   *
   * @returns {Boolean}
   * @api public
   */

  HTMLFile.xdomainCheck = function () {
    // we can probably do handling for sub-domains, we should
    // test that it's cross domain but a subdomain here
    return false;
  };

  /**
   * Add the transport to your public io.transports array.
   *
   * @api private
   */

  io.transports.push('htmlfile');

})(
    'undefined' != typeof io ? io.Transport : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {

  /**
   * Expose constructor.
   */

  exports['xhr-polling'] = XHRPolling;

  /**
   * The XHR-polling transport uses long polling XHR requests to create a
   * "persistent" connection with the server.
   *
   * @constructor
   * @api public
   */

  function XHRPolling () {
    io.Transport.XHR.apply(this, arguments);
  };

  /**
   * Inherits from XHR transport.
   */

  io.util.inherit(XHRPolling, io.Transport.XHR);

  /**
   * Merge the properties from XHR transport
   */

  io.util.merge(XHRPolling, io.Transport.XHR);

  /**
   * Transport name
   *
   * @api public
   */

  XHRPolling.prototype.name = 'xhr-polling';

  /** 
   * Establish a connection, for iPhone and Android this will be done once the page
   * is loaded.
   *
   * @returns {Transport} Chaining.
   * @api public
   */

  XHRPolling.prototype.open = function () {
    var self = this;

    io.Transport.XHR.prototype.open.call(self);
    return false;
  };

  /**
   * Starts a XHR request to wait for incoming messages.
   *
   * @api private
   */

  function empty () {};

  XHRPolling.prototype.get = function () {
    if (!this.open) return;

    var self = this;

    function stateChange () {
      if (this.readyState == 4) {
        this.onreadystatechange = empty;

        if (this.status == 200) {
          self.onData(this.responseText);
          self.get();
        } else {
          self.onClose();
        }
      }
    };

    function onload () {
      this.onload = empty;
      this.onerror = empty;
      self.onData(this.responseText);
      self.get();
    };

    function onerror () {
      self.onClose();
    };

    this.xhr = this.request();

    if (global.XDomainRequest && this.xhr instanceof XDomainRequest) {
      this.xhr.onload = onload;
      this.xhr.onerror = onerror;
    } else {
      this.xhr.onreadystatechange = stateChange;
    }

    this.xhr.send(null);
  };

  /**
   * Handle the unclean close behavior.
   *
   * @api private
   */

  XHRPolling.prototype.onClose = function () {
    io.Transport.XHR.prototype.onClose.call(this);

    if (this.xhr) {
      this.xhr.onreadystatechange = this.xhr.onload = this.xhr.onerror = empty;
      try {
        this.xhr.abort();
      } catch(e){}
      this.xhr = null;
    }
  };

  /**
   * Webkit based browsers show a infinit spinner when you start a XHR request
   * before the browsers onload event is called so we need to defer opening of
   * the transport until the onload event is called. Wrapping the cb in our
   * defer method solve this.
   *
   * @param {Socket} socket The socket instance that needs a transport
   * @param {Function} fn The callback
   * @api private
   */

  XHRPolling.prototype.ready = function (socket, fn) {
    var self = this;

    io.util.defer(function () {
      fn.call(self);
    });
  };

  /**
   * Add the transport to your public io.transports array.
   *
   * @api private
   */

  io.transports.push('xhr-polling');

})(
    'undefined' != typeof io ? io.Transport : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {
  /**
   * There is a way to hide the loading indicator in Firefox. If you create and
   * remove a iframe it will stop showing the current loading indicator.
   * Unfortunately we can't feature detect that and UA sniffing is evil.
   *
   * @api private
   */

  var indicator = global.document && "MozAppearance" in
    global.document.documentElement.style;

  /**
   * Expose constructor.
   */

  exports['jsonp-polling'] = JSONPPolling;

  /**
   * The JSONP transport creates an persistent connection by dynamically
   * inserting a script tag in the page. This script tag will receive the
   * information of the Socket.IO server. When new information is received
   * it creates a new script tag for the new data stream.
   *
   * @constructor
   * @extends {io.Transport.xhr-polling}
   * @api public
   */

  function JSONPPolling (socket) {
    io.Transport['xhr-polling'].apply(this, arguments);

    this.index = io.j.length;

    var self = this;

    io.j.push(function (msg) {
      self._(msg);
    });
  };

  /**
   * Inherits from XHR polling transport.
   */

  io.util.inherit(JSONPPolling, io.Transport['xhr-polling']);

  /**
   * Transport name
   *
   * @api public
   */

  JSONPPolling.prototype.name = 'jsonp-polling';

  /**
   * Posts a encoded message to the Socket.IO server using an iframe.
   * The iframe is used because script tags can create POST based requests.
   * The iframe is positioned outside of the view so the user does not
   * notice it's existence.
   *
   * @param {String} data A encoded message.
   * @api private
   */

  JSONPPolling.prototype.post = function (data) {
    var self = this
      , query = io.util.query(
             this.socket.options.query
          , 't='+ (+new Date) + '&i=' + this.index
        );

    if (!this.form) {
      var form = document.createElement('form')
        , area = document.createElement('textarea')
        , id = this.iframeId = 'socketio_iframe_' + this.index
        , iframe;

      form.className = 'socketio';
      form.style.position = 'absolute';
      form.style.top = '-1000px';
      form.style.left = '-1000px';
      form.target = id;
      form.method = 'POST';
      form.setAttribute('accept-charset', 'utf-8');
      area.name = 'd';
      form.appendChild(area);
      document.body.appendChild(form);

      this.form = form;
      this.area = area;
    }

    this.form.action = this.prepareUrl() + query;

    function complete () {
      initIframe();
      self.socket.setBuffer(false);
    };

    function initIframe () {
      if (self.iframe) {
        self.form.removeChild(self.iframe);
      }

      try {
        // ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
        iframe = document.createElement('<iframe name="'+ self.iframeId +'">');
      } catch (e) {
        iframe = document.createElement('iframe');
        iframe.name = self.iframeId;
      }

      iframe.id = self.iframeId;

      self.form.appendChild(iframe);
      self.iframe = iframe;
    };

    initIframe();

    // we temporarily stringify until we figure out how to prevent
    // browsers from turning `\n` into `\r\n` in form inputs
    this.area.value = io.JSON.stringify(data);

    try {
      this.form.submit();
    } catch(e) {}

    if (this.iframe.attachEvent) {
      iframe.onreadystatechange = function () {
        if (self.iframe.readyState == 'complete') {
          complete();
        }
      };
    } else {
      this.iframe.onload = complete;
    }

    this.socket.setBuffer(true);
  };
  
  /**
   * Creates a new JSONP poll that can be used to listen
   * for messages from the Socket.IO server.
   *
   * @api private
   */

  JSONPPolling.prototype.get = function () {
    var self = this
      , script = document.createElement('script')
      , query = io.util.query(
             this.socket.options.query
          , 't='+ (+new Date) + '&i=' + this.index
        );

    if (this.script) {
      this.script.parentNode.removeChild(this.script);
      this.script = null;
    }

    script.async = true;
    script.src = this.prepareUrl() + query;
    script.onerror = function () {
      self.onClose();
    };

    var insertAt = document.getElementsByTagName('script')[0]
    insertAt.parentNode.insertBefore(script, insertAt);
    this.script = script;

    if (indicator) {
      setTimeout(function () {
        var iframe = document.createElement('iframe');
        document.body.appendChild(iframe);
        document.body.removeChild(iframe);
      }, 100);
    }
  };

  /**
   * Callback function for the incoming message stream from the Socket.IO server.
   *
   * @param {String} data The message
   * @api private
   */

  JSONPPolling.prototype._ = function (msg) {
    this.onData(msg);
    if (this.open) {
      this.get();
    }
    return this;
  };

  /**
   * The indicator hack only works after onload
   *
   * @param {Socket} socket The socket instance that needs a transport
   * @param {Function} fn The callback
   * @api private
   */

  JSONPPolling.prototype.ready = function (socket, fn) {
    var self = this;
    if (!indicator) return fn.call(this);

    io.util.load(function () {
      fn.call(self);
    });
  };

  /**
   * Checks if browser supports this transport.
   *
   * @return {Boolean}
   * @api public
   */

  JSONPPolling.check = function () {
    return 'document' in global;
  };

  /**
   * Check if cross domain requests are supported
   *
   * @returns {Boolean}
   * @api public
   */

  JSONPPolling.xdomainCheck = function () {
    return true;
  };

  /**
   * Add the transport to your public io.transports array.
   *
   * @api private
   */

  io.transports.push('jsonp-polling');

})(
    'undefined' != typeof io ? io.Transport : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);


/**
 * History.js Core
 * @author Benjamin Arthur Lupton <contact@balupton.com>
 * @copyright 2010-2011 Benjamin Arthur Lupton <contact@balupton.com>
 * @license New BSD License <http://creativecommons.org/licenses/BSD/>
 */

(function(window,undefined){
	"use strict";

	// ========================================================================
	// Initialise

	// Localise Globals
	var
		console = window.console||undefined, // Prevent a JSLint complain
		document = window.document, // Make sure we are using the correct document
		navigator = window.navigator, // Make sure we are using the correct navigator
		sessionStorage = window.sessionStorage||false, // sessionStorage
		setTimeout = window.setTimeout,
		clearTimeout = window.clearTimeout,
		setInterval = window.setInterval,
		clearInterval = window.clearInterval,
		JSON = window.JSON,
		alert = window.alert,
		History = window.History = window.History||{}, // Public History Object
		history = window.history; // Old History Object

	// MooTools Compatibility
	JSON.stringify = JSON.stringify||JSON.encode;
	JSON.parse = JSON.parse||JSON.decode;

	// Check Existence
	if ( typeof History.init !== 'undefined' ) {
		throw new Error('History.js Core has already been loaded...');
	}

	// Initialise History
	History.init = function(){
		// Check Load Status of Adapter
		if ( typeof History.Adapter === 'undefined' ) {
			return false;
		}

		// Check Load Status of Core
		if ( typeof History.initCore !== 'undefined' ) {
			History.initCore();
		}

		// Check Load Status of HTML4 Support
		if ( typeof History.initHtml4 !== 'undefined' ) {
			History.initHtml4();
		}

		// Return true
		return true;
	};


	// ========================================================================
	// Initialise Core

	// Initialise Core
	History.initCore = function(){
		// Initialise
		if ( typeof History.initCore.initialized !== 'undefined' ) {
			// Already Loaded
			return false;
		}
		else {
			History.initCore.initialized = true;
		}


		// ====================================================================
		// Options

		/**
		 * History.options
		 * Configurable options
		 */
		History.options = History.options||{};

		/**
		 * History.options.hashChangeInterval
		 * How long should the interval be before hashchange checks
		 */
		History.options.hashChangeInterval = History.options.hashChangeInterval || 100;

		/**
		 * History.options.safariPollInterval
		 * How long should the interval be before safari poll checks
		 */
		History.options.safariPollInterval = History.options.safariPollInterval || 500;

		/**
		 * History.options.doubleCheckInterval
		 * How long should the interval be before we perform a double check
		 */
		History.options.doubleCheckInterval = History.options.doubleCheckInterval || 500;

		/**
		 * History.options.storeInterval
		 * How long should we wait between store calls
		 */
		History.options.storeInterval = History.options.storeInterval || 1000;

		/**
		 * History.options.busyDelay
		 * How long should we wait between busy events
		 */
		History.options.busyDelay = History.options.busyDelay || 250;

		/**
		 * History.options.debug
		 * If true will enable debug messages to be logged
		 */
		History.options.debug = History.options.debug || false;

		/**
		 * History.options.initialTitle
		 * What is the title of the initial state
		 */
		History.options.initialTitle = History.options.initialTitle || document.title;


		// ====================================================================
		// Interval record

		/**
		 * History.intervalList
		 * List of intervals set, to be cleared when document is unloaded.
		 */
		History.intervalList = [];

		/**
		 * History.clearAllIntervals
		 * Clears all setInterval instances.
		 */
		History.clearAllIntervals = function(){
			var i, il = History.intervalList;
			if (typeof il !== "undefined" && il !== null) {
				for (i = 0; i < il.length; i++) {
					clearInterval(il[i]);
				}
				History.intervalList = null;
			}
		};


		// ====================================================================
		// Debug

		/**
		 * History.debug(message,...)
		 * Logs the passed arguments if debug enabled
		 */
		History.debug = function(){
			if ( (History.options.debug||false) ) {
				History.log.apply(History,arguments);
			}
		};

		/**
		 * History.log(message,...)
		 * Logs the passed arguments
		 */
		History.log = function(){
			// Prepare
			var
				consoleExists = !(typeof console === 'undefined' || typeof console.log === 'undefined' || typeof console.log.apply === 'undefined'),
				textarea = document.getElementById('log'),
				message,
				i,n,
				args,arg
				;

			// Write to Console
			if ( consoleExists ) {
				args = Array.prototype.slice.call(arguments);
				message = args.shift();
				if ( typeof console.debug !== 'undefined' ) {
					console.debug.apply(console,[message,args]);
				}
				else {
					console.log.apply(console,[message,args]);
				}
			}
			else {
				message = ("\n"+arguments[0]+"\n");
			}

			// Write to log
			for ( i=1,n=arguments.length; i<n; ++i ) {
				arg = arguments[i];
				if ( typeof arg === 'object' && typeof JSON !== 'undefined' ) {
					try {
						arg = JSON.stringify(arg);
					}
					catch ( Exception ) {
						// Recursive Object
					}
				}
				message += "\n"+arg+"\n";
			}

			// Textarea
			if ( textarea ) {
				textarea.value += message+"\n-----\n";
				textarea.scrollTop = textarea.scrollHeight - textarea.clientHeight;
			}
			// No Textarea, No Console
			else if ( !consoleExists ) {
				alert(message);
			}

			// Return true
			return true;
		};


		// ====================================================================
		// Emulated Status

		/**
		 * History.getInternetExplorerMajorVersion()
		 * Get's the major version of Internet Explorer
		 * @return {integer}
		 * @license Public Domain
		 * @author Benjamin Arthur Lupton <contact@balupton.com>
		 * @author James Padolsey <https://gist.github.com/527683>
		 */
		History.getInternetExplorerMajorVersion = function(){
			var result = History.getInternetExplorerMajorVersion.cached =
					(typeof History.getInternetExplorerMajorVersion.cached !== 'undefined')
				?	History.getInternetExplorerMajorVersion.cached
				:	(function(){
						var v = 3,
								div = document.createElement('div'),
								all = div.getElementsByTagName('i');
						while ( (div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->') && all[0] ) {}
						return (v > 4) ? v : false;
					})()
				;
			return result;
		};

		/**
		 * History.isInternetExplorer()
		 * Are we using Internet Explorer?
		 * @return {boolean}
		 * @license Public Domain
		 * @author Benjamin Arthur Lupton <contact@balupton.com>
		 */
		History.isInternetExplorer = function(){
			var result =
				History.isInternetExplorer.cached =
				(typeof History.isInternetExplorer.cached !== 'undefined')
					?	History.isInternetExplorer.cached
					:	Boolean(History.getInternetExplorerMajorVersion())
				;
			return result;
		};

		/**
		 * History.emulated
		 * Which features require emulating?
		 */
		History.emulated = {
			pushState: !Boolean(
				window.history && window.history.pushState && window.history.replaceState
				&& !(
					(/ Mobile\/([1-7][a-z]|(8([abcde]|f(1[0-8]))))/i).test(navigator.userAgent) /* disable for versions of iOS before version 4.3 (8F190) */
					|| (/AppleWebKit\/5([0-2]|3[0-2])/i).test(navigator.userAgent) /* disable for the mercury iOS browser, or at least older versions of the webkit engine */
				)
			),
			hashChange: Boolean(
				!(('onhashchange' in window) || ('onhashchange' in document))
				||
				(History.isInternetExplorer() && History.getInternetExplorerMajorVersion() < 8)
			)
		};

		/**
		 * History.enabled
		 * Is History enabled?
		 */
		History.enabled = !History.emulated.pushState;

		/**
		 * History.bugs
		 * Which bugs are present
		 */
		History.bugs = {
			/**
			 * Safari 5 and Safari iOS 4 fail to return to the correct state once a hash is replaced by a `replaceState` call
			 * https://bugs.webkit.org/show_bug.cgi?id=56249
			 */
			setHash: Boolean(!History.emulated.pushState && navigator.vendor === 'Apple Computer, Inc.' && /AppleWebKit\/5([0-2]|3[0-3])/.test(navigator.userAgent)),

			/**
			 * Safari 5 and Safari iOS 4 sometimes fail to apply the state change under busy conditions
			 * https://bugs.webkit.org/show_bug.cgi?id=42940
			 */
			safariPoll: Boolean(!History.emulated.pushState && navigator.vendor === 'Apple Computer, Inc.' && /AppleWebKit\/5([0-2]|3[0-3])/.test(navigator.userAgent)),

			/**
			 * MSIE 6 and 7 sometimes do not apply a hash even it was told to (requiring a second call to the apply function)
			 */
			ieDoubleCheck: Boolean(History.isInternetExplorer() && History.getInternetExplorerMajorVersion() < 8),

			/**
			 * MSIE 6 requires the entire hash to be encoded for the hashes to trigger the onHashChange event
			 */
			hashEscape: Boolean(History.isInternetExplorer() && History.getInternetExplorerMajorVersion() < 7)
		};

		/**
		 * History.isEmptyObject(obj)
		 * Checks to see if the Object is Empty
		 * @param {Object} obj
		 * @return {boolean}
		 */
		History.isEmptyObject = function(obj) {
			for ( var name in obj ) {
				return false;
			}
			return true;
		};

		/**
		 * History.cloneObject(obj)
		 * Clones a object and eliminate all references to the original contexts
		 * @param {Object} obj
		 * @return {Object}
		 */
		History.cloneObject = function(obj) {
			var hash,newObj;
			if ( obj ) {
				hash = JSON.stringify(obj);
				newObj = JSON.parse(hash);
			}
			else {
				newObj = {};
			}
			return newObj;
		};


		// ====================================================================
		// URL Helpers

		/**
		 * History.getRootUrl()
		 * Turns "http://mysite.com/dir/page.html?asd" into "http://mysite.com"
		 * @return {String} rootUrl
		 */
		History.getRootUrl = function(){
			// Create
			var rootUrl = document.location.protocol+'//'+(document.location.hostname||document.location.host);
			if ( document.location.port||false ) {
				rootUrl += ':'+document.location.port;
			}
			rootUrl += '/';

			// Return
			return rootUrl;
		};

		/**
		 * History.getBaseHref()
		 * Fetches the `href` attribute of the `<base href="...">` element if it exists
		 * @return {String} baseHref
		 */
		History.getBaseHref = function(){
			// Create
			var
				baseElements = document.getElementsByTagName('base'),
				baseElement = null,
				baseHref = '';

			// Test for Base Element
			if ( baseElements.length === 1 ) {
				// Prepare for Base Element
				baseElement = baseElements[0];
				baseHref = baseElement.href.replace(/[^\/]+$/,'');
			}

			// Adjust trailing slash
			baseHref = baseHref.replace(/\/+$/,'');
			if ( baseHref ) baseHref += '/';

			// Return
			return baseHref;
		};

		/**
		 * History.getBaseUrl()
		 * Fetches the baseHref or basePageUrl or rootUrl (whichever one exists first)
		 * @return {String} baseUrl
		 */
		History.getBaseUrl = function(){
			// Create
			var baseUrl = History.getBaseHref()||History.getBasePageUrl()||History.getRootUrl();

			// Return
			return baseUrl;
		};

		/**
		 * History.getPageUrl()
		 * Fetches the URL of the current page
		 * @return {String} pageUrl
		 */
		History.getPageUrl = function(){
			// Fetch
			var
				State = History.getState(false,false),
				stateUrl = (State||{}).url||document.location.href,
				pageUrl;

			// Create
			pageUrl = stateUrl.replace(/\/+$/,'').replace(/[^\/]+$/,function(part,index,string){
				return (/\./).test(part) ? part : part+'/';
			});

			// Return
			return pageUrl;
		};

		/**
		 * History.getBasePageUrl()
		 * Fetches the Url of the directory of the current page
		 * @return {String} basePageUrl
		 */
		History.getBasePageUrl = function(){
			// Create
			var basePageUrl = document.location.href.replace(/[#\?].*/,'').replace(/[^\/]+$/,function(part,index,string){
				return (/[^\/]$/).test(part) ? '' : part;
			}).replace(/\/+$/,'')+'/';

			// Return
			return basePageUrl;
		};

		/**
		 * History.getFullUrl(url)
		 * Ensures that we have an absolute URL and not a relative URL
		 * @param {string} url
		 * @param {Boolean} allowBaseHref
		 * @return {string} fullUrl
		 */
		History.getFullUrl = function(url,allowBaseHref){
			// Prepare
			var fullUrl = url, firstChar = url.substring(0,1);
			allowBaseHref = (typeof allowBaseHref === 'undefined') ? true : allowBaseHref;

			// Check
			if ( /[a-z]+\:\/\//.test(url) ) {
				// Full URL
			}
			else if ( firstChar === '/' ) {
				// Root URL
				fullUrl = History.getRootUrl()+url.replace(/^\/+/,'');
			}
			else if ( firstChar === '#' ) {
				// Anchor URL
				fullUrl = History.getPageUrl().replace(/#.*/,'')+url;
			}
			else if ( firstChar === '?' ) {
				// Query URL
				fullUrl = History.getPageUrl().replace(/[\?#].*/,'')+url;
			}
			else {
				// Relative URL
				if ( allowBaseHref ) {
					fullUrl = History.getBaseUrl()+url.replace(/^(\.\/)+/,'');
				} else {
					fullUrl = History.getBasePageUrl()+url.replace(/^(\.\/)+/,'');
				}
				// We have an if condition above as we do not want hashes
				// which are relative to the baseHref in our URLs
				// as if the baseHref changes, then all our bookmarks
				// would now point to different locations
				// whereas the basePageUrl will always stay the same
			}

			// Return
			return fullUrl.replace(/\#$/,'');
		};

		/**
		 * History.getShortUrl(url)
		 * Ensures that we have a relative URL and not a absolute URL
		 * @param {string} url
		 * @return {string} url
		 */
		History.getShortUrl = function(url){
			// Prepare
			var shortUrl = url, baseUrl = History.getBaseUrl(), rootUrl = History.getRootUrl();

			// Trim baseUrl
			if ( History.emulated.pushState ) {
				// We are in a if statement as when pushState is not emulated
				// The actual url these short urls are relative to can change
				// So within the same session, we the url may end up somewhere different
				shortUrl = shortUrl.replace(baseUrl,'');
			}

			// Trim rootUrl
			shortUrl = shortUrl.replace(rootUrl,'/');

			// Ensure we can still detect it as a state
			if ( History.isTraditionalAnchor(shortUrl) ) {
				shortUrl = './'+shortUrl;
			}

			// Clean It
			shortUrl = shortUrl.replace(/^(\.\/)+/g,'./').replace(/\#$/,'');

			// Return
			return shortUrl;
		};


		// ====================================================================
		// State Storage

		/**
		 * History.store
		 * The store for all session specific data
		 */
		History.store = {};

		/**
		 * History.idToState
		 * 1-1: State ID to State Object
		 */
		History.idToState = History.idToState||{};

		/**
		 * History.stateToId
		 * 1-1: State String to State ID
		 */
		History.stateToId = History.stateToId||{};

		/**
		 * History.urlToId
		 * 1-1: State URL to State ID
		 */
		History.urlToId = History.urlToId||{};

		/**
		 * History.storedStates
		 * Store the states in an array
		 */
		History.storedStates = History.storedStates||[];

		/**
		 * History.savedStates
		 * Saved the states in an array
		 */
		History.savedStates = History.savedStates||[];

		/**
		 * History.noramlizeStore()
		 * Noramlize the store by adding necessary values
		 */
		History.normalizeStore = function(){
			History.store.idToState = History.store.idToState||{};
			History.store.urlToId = History.store.urlToId||{};
			History.store.stateToId = History.store.stateToId||{};
		};

		/**
		 * History.getState()
		 * Get an object containing the data, title and url of the current state
		 * @param {Boolean} friendly
		 * @param {Boolean} create
		 * @return {Object} State
		 */
		History.getState = function(friendly,create){
			// Prepare
			if ( typeof friendly === 'undefined' ) { friendly = true; }
			if ( typeof create === 'undefined' ) { create = true; }

			// Fetch
			var State = History.getLastSavedState();

			// Create
			if ( !State && create ) {
				State = History.createStateObject();
			}

			// Adjust
			if ( friendly ) {
				State = History.cloneObject(State);
				State.url = State.cleanUrl||State.url;
			}

			// Return
			return State;
		};

		/**
		 * History.getIdByState(State)
		 * Gets a ID for a State
		 * @param {State} newState
		 * @return {String} id
		 */
		History.getIdByState = function(newState){

			// Fetch ID
			var id = History.extractId(newState.url),
				str;
			
			if ( !id ) {
				// Find ID via State String
				str = History.getStateString(newState);
				if ( typeof History.stateToId[str] !== 'undefined' ) {
					id = History.stateToId[str];
				}
				else if ( typeof History.store.stateToId[str] !== 'undefined' ) {
					id = History.store.stateToId[str];
				}
				else {
					// Generate a new ID
					while ( true ) {
						id = (new Date()).getTime() + String(Math.random()).replace(/\D/g,'');
						if ( typeof History.idToState[id] === 'undefined' && typeof History.store.idToState[id] === 'undefined' ) {
							break;
						}
					}

					// Apply the new State to the ID
					History.stateToId[str] = id;
					History.idToState[id] = newState;
				}
			}

			// Return ID
			return id;
		};

		/**
		 * History.normalizeState(State)
		 * Expands a State Object
		 * @param {object} State
		 * @return {object}
		 */
		History.normalizeState = function(oldState){
			// Variables
			var newState, dataNotEmpty;

			// Prepare
			if ( !oldState || (typeof oldState !== 'object') ) {
				oldState = {};
			}

			// Check
			if ( typeof oldState.normalized !== 'undefined' ) {
				return oldState;
			}

			// Adjust
			if ( !oldState.data || (typeof oldState.data !== 'object') ) {
				oldState.data = {};
			}

			// ----------------------------------------------------------------

			// Create
			newState = {};
			newState.normalized = true;
			newState.title = oldState.title||'';
			newState.url = History.getFullUrl(History.unescapeString(oldState.url||document.location.href));
			newState.hash = History.getShortUrl(newState.url);
			newState.data = History.cloneObject(oldState.data);

			// Fetch ID
			newState.id = History.getIdByState(newState);

			// ----------------------------------------------------------------

			// Clean the URL
			newState.cleanUrl = newState.url.replace(/\??\&_suid.*/,'');
			newState.url = newState.cleanUrl;

			// Check to see if we have more than just a url
			dataNotEmpty = !History.isEmptyObject(newState.data);

			// Apply
			if ( newState.title || dataNotEmpty ) {
				// Add ID to Hash
				newState.hash = History.getShortUrl(newState.url).replace(/\??\&_suid.*/,'');
				if ( !/\?/.test(newState.hash) ) {
					newState.hash += '?';
				}
				newState.hash += '&_suid='+newState.id;
			}

			// Create the Hashed URL
			newState.hashedUrl = History.getFullUrl(newState.hash);

			// ----------------------------------------------------------------

			// Update the URL if we have a duplicate
			if ( (History.emulated.pushState || History.bugs.safariPoll) && History.hasUrlDuplicate(newState) ) {
				newState.url = newState.hashedUrl;
			}

			// ----------------------------------------------------------------

			// Return
			return newState;
		};

		/**
		 * History.createStateObject(data,title,url)
		 * Creates a object based on the data, title and url state params
		 * @param {object} data
		 * @param {string} title
		 * @param {string} url
		 * @return {object}
		 */
		History.createStateObject = function(data,title,url){
			// Hashify
			var State = {
				'data': data,
				'title': title,
				'url': url
			};

			// Expand the State
			State = History.normalizeState(State);

			// Return object
			return State;
		};

		/**
		 * History.getStateById(id)
		 * Get a state by it's UID
		 * @param {String} id
		 */
		History.getStateById = function(id){
			// Prepare
			id = String(id);

			// Retrieve
			var State = History.idToState[id] || History.store.idToState[id] || undefined;

			// Return State
			return State;
		};

		/**
		 * Get a State's String
		 * @param {State} passedState
		 */
		History.getStateString = function(passedState){
			// Prepare
			var State, cleanedState, str;

			// Fetch
			State = History.normalizeState(passedState);

			// Clean
			cleanedState = {
				data: State.data,
				title: passedState.title,
				url: passedState.url
			};

			// Fetch
			str = JSON.stringify(cleanedState);

			// Return
			return str;
		};

		/**
		 * Get a State's ID
		 * @param {State} passedState
		 * @return {String} id
		 */
		History.getStateId = function(passedState){
			// Prepare
			var State, id;
			
			// Fetch
			State = History.normalizeState(passedState);

			// Fetch
			id = State.id;

			// Return
			return id;
		};

		/**
		 * History.getHashByState(State)
		 * Creates a Hash for the State Object
		 * @param {State} passedState
		 * @return {String} hash
		 */
		History.getHashByState = function(passedState){
			// Prepare
			var State, hash;
			
			// Fetch
			State = History.normalizeState(passedState);

			// Hash
			hash = State.hash;

			// Return
			return hash;
		};

		/**
		 * History.extractId(url_or_hash)
		 * Get a State ID by it's URL or Hash
		 * @param {string} url_or_hash
		 * @return {string} id
		 */
		History.extractId = function ( url_or_hash ) {
			// Prepare
			var id,parts,url;

			// Extract
			parts = /(.*)\&_suid=([0-9]+)$/.exec(url_or_hash);
			url = parts ? (parts[1]||url_or_hash) : url_or_hash;
			id = parts ? String(parts[2]||'') : '';

			// Return
			return id||false;
		};

		/**
		 * History.isTraditionalAnchor
		 * Checks to see if the url is a traditional anchor or not
		 * @param {String} url_or_hash
		 * @return {Boolean}
		 */
		History.isTraditionalAnchor = function(url_or_hash){
			// Check
			var isTraditional = !(/[\/\?\.]/.test(url_or_hash));

			// Return
			return isTraditional;
		};

		/**
		 * History.extractState
		 * Get a State by it's URL or Hash
		 * @param {String} url_or_hash
		 * @return {State|null}
		 */
		History.extractState = function(url_or_hash,create){
			// Prepare
			var State = null, id, url;
			create = create||false;

			// Fetch SUID
			id = History.extractId(url_or_hash);
			if ( id ) {
				State = History.getStateById(id);
			}

			// Fetch SUID returned no State
			if ( !State ) {
				// Fetch URL
				url = History.getFullUrl(url_or_hash);

				// Check URL
				id = History.getIdByUrl(url)||false;
				if ( id ) {
					State = History.getStateById(id);
				}

				// Create State
				if ( !State && create && !History.isTraditionalAnchor(url_or_hash) ) {
					State = History.createStateObject(null,null,url);
				}
			}

			// Return
			return State;
		};

		/**
		 * History.getIdByUrl()
		 * Get a State ID by a State URL
		 */
		History.getIdByUrl = function(url){
			// Fetch
			var id = History.urlToId[url] || History.store.urlToId[url] || undefined;

			// Return
			return id;
		};

		/**
		 * History.getLastSavedState()
		 * Get an object containing the data, title and url of the current state
		 * @return {Object} State
		 */
		History.getLastSavedState = function(){
			return History.savedStates[History.savedStates.length-1]||undefined;
		};

		/**
		 * History.getLastStoredState()
		 * Get an object containing the data, title and url of the current state
		 * @return {Object} State
		 */
		History.getLastStoredState = function(){
			return History.storedStates[History.storedStates.length-1]||undefined;
		};

		/**
		 * History.hasUrlDuplicate
		 * Checks if a Url will have a url conflict
		 * @param {Object} newState
		 * @return {Boolean} hasDuplicate
		 */
		History.hasUrlDuplicate = function(newState) {
			// Prepare
			var hasDuplicate = false,
				oldState;

			// Fetch
			oldState = History.extractState(newState.url);

			// Check
			hasDuplicate = oldState && oldState.id !== newState.id;

			// Return
			return hasDuplicate;
		};

		/**
		 * History.storeState
		 * Store a State
		 * @param {Object} newState
		 * @return {Object} newState
		 */
		History.storeState = function(newState){
			// Store the State
			History.urlToId[newState.url] = newState.id;

			// Push the State
			History.storedStates.push(History.cloneObject(newState));

			// Return newState
			return newState;
		};

		/**
		 * History.isLastSavedState(newState)
		 * Tests to see if the state is the last state
		 * @param {Object} newState
		 * @return {boolean} isLast
		 */
		History.isLastSavedState = function(newState){
			// Prepare
			var isLast = false,
				newId, oldState, oldId;

			// Check
			if ( History.savedStates.length ) {
				newId = newState.id;
				oldState = History.getLastSavedState();
				oldId = oldState.id;

				// Check
				isLast = (newId === oldId);
			}

			// Return
			return isLast;
		};

		/**
		 * History.saveState
		 * Push a State
		 * @param {Object} newState
		 * @return {boolean} changed
		 */
		History.saveState = function(newState){
			// Check Hash
			if ( History.isLastSavedState(newState) ) {
				return false;
			}

			// Push the State
			History.savedStates.push(History.cloneObject(newState));

			// Return true
			return true;
		};

		/**
		 * History.getStateByIndex()
		 * Gets a state by the index
		 * @param {integer} index
		 * @return {Object}
		 */
		History.getStateByIndex = function(index){
			// Prepare
			var State = null;

			// Handle
			if ( typeof index === 'undefined' ) {
				// Get the last inserted
				State = History.savedStates[History.savedStates.length-1];
			}
			else if ( index < 0 ) {
				// Get from the end
				State = History.savedStates[History.savedStates.length+index];
			}
			else {
				// Get from the beginning
				State = History.savedStates[index];
			}

			// Return State
			return State;
		};


		// ====================================================================
		// Hash Helpers

		/**
		 * History.getHash()
		 * Gets the current document hash
		 * @return {string}
		 */
		History.getHash = function(){
			var hash = History.unescapeHash(document.location.hash);
			return hash;
		};

		/**
		 * History.unescapeString()
		 * Unescape a string
		 * @param {String} str
		 * @return {string}
		 */
		History.unescapeString = function(str){
			// Prepare
			var result = str,
				tmp;

			// Unescape hash
			while ( true ) {
				tmp = window.unescape(result);
				if ( tmp === result ) {
					break;
				}
				result = tmp;
			}

			// Return result
			return result;
		};

		/**
		 * History.unescapeHash()
		 * normalize and Unescape a Hash
		 * @param {String} hash
		 * @return {string}
		 */
		History.unescapeHash = function(hash){
			// Prepare
			var result = History.normalizeHash(hash);

			// Unescape hash
			result = History.unescapeString(result);

			// Return result
			return result;
		};

		/**
		 * History.normalizeHash()
		 * normalize a hash across browsers
		 * @return {string}
		 */
		History.normalizeHash = function(hash){
			// Prepare
			var result = hash.replace(/[^#]*#/,'').replace(/#.*/, '');

			// Return result
			return result;
		};

		/**
		 * History.setHash(hash)
		 * Sets the document hash
		 * @param {string} hash
		 * @return {History}
		 */
		History.setHash = function(hash,queue){
			// Prepare
			var adjustedHash, State, pageUrl;

			// Handle Queueing
			if ( queue !== false && History.busy() ) {
				// Wait + Push to Queue
				//History.debug('History.setHash: we must wait', arguments);
				History.pushQueue({
					scope: History,
					callback: History.setHash,
					args: arguments,
					queue: queue
				});
				return false;
			}

			// Log
			//History.debug('History.setHash: called',hash);

			// Prepare
			adjustedHash = History.escapeHash(hash);

			// Make Busy + Continue
			History.busy(true);

			// Check if hash is a state
			State = History.extractState(hash,true);
			if ( State && !History.emulated.pushState ) {
				// Hash is a state so skip the setHash
				//History.debug('History.setHash: Hash is a state so skipping the hash set with a direct pushState call',arguments);

				// PushState
				History.pushState(State.data,State.title,State.url,false);
			}
			else if ( document.location.hash !== adjustedHash ) {
				// Hash is a proper hash, so apply it

				// Handle browser bugs
				if ( History.bugs.setHash ) {
					// Fix Safari Bug https://bugs.webkit.org/show_bug.cgi?id=56249

					// Fetch the base page
					pageUrl = History.getPageUrl();

					// Safari hash apply
					History.pushState(null,null,pageUrl+'#'+adjustedHash,false);
				}
				else {
					// Normal hash apply
					document.location.hash = adjustedHash;
				}
			}

			// Chain
			return History;
		};

		/**
		 * History.escape()
		 * normalize and Escape a Hash
		 * @return {string}
		 */
		History.escapeHash = function(hash){
			// Prepare
			var result = History.normalizeHash(hash);

			// Escape hash
			result = window.escape(result);

			// IE6 Escape Bug
			if ( !History.bugs.hashEscape ) {
				// Restore common parts
				result = result
					.replace(/\%21/g,'!')
					.replace(/\%26/g,'&')
					.replace(/\%3D/g,'=')
					.replace(/\%3F/g,'?');
			}

			// Return result
			return result;
		};

		/**
		 * History.getHashByUrl(url)
		 * Extracts the Hash from a URL
		 * @param {string} url
		 * @return {string} url
		 */
		History.getHashByUrl = function(url){
			// Extract the hash
			var hash = String(url)
				.replace(/([^#]*)#?([^#]*)#?(.*)/, '$2')
				;

			// Unescape hash
			hash = History.unescapeHash(hash);

			// Return hash
			return hash;
		};

		/**
		 * History.setTitle(title)
		 * Applies the title to the document
		 * @param {State} newState
		 * @return {Boolean}
		 */
		History.setTitle = function(newState){
			// Prepare
			var title = newState.title,
				firstState;

			// Initial
			if ( !title ) {
				firstState = History.getStateByIndex(0);
				if ( firstState && firstState.url === newState.url ) {
					title = firstState.title||History.options.initialTitle;
				}
			}

			// Apply
			try {
				document.getElementsByTagName('title')[0].innerHTML = title.replace('<','&lt;').replace('>','&gt;').replace(' & ',' &amp; ');
			}
			catch ( Exception ) { }
			document.title = title;

			// Chain
			return History;
		};


		// ====================================================================
		// Queueing

		/**
		 * History.queues
		 * The list of queues to use
		 * First In, First Out
		 */
		History.queues = [];

		/**
		 * History.busy(value)
		 * @param {boolean} value [optional]
		 * @return {boolean} busy
		 */
		History.busy = function(value){
			// Apply
			if ( typeof value !== 'undefined' ) {
				//History.debug('History.busy: changing ['+(History.busy.flag||false)+'] to ['+(value||false)+']', History.queues.length);
				History.busy.flag = value;
			}
			// Default
			else if ( typeof History.busy.flag === 'undefined' ) {
				History.busy.flag = false;
			}

			// Queue
			if ( !History.busy.flag ) {
				// Execute the next item in the queue
				clearTimeout(History.busy.timeout);
				var fireNext = function(){
					var i, queue, item;
					if ( History.busy.flag ) return;
					for ( i=History.queues.length-1; i >= 0; --i ) {
						queue = History.queues[i];
						if ( queue.length === 0 ) continue;
						item = queue.shift();
						History.fireQueueItem(item);
						History.busy.timeout = setTimeout(fireNext,History.options.busyDelay);
					}
				};
				History.busy.timeout = setTimeout(fireNext,History.options.busyDelay);
			}

			// Return
			return History.busy.flag;
		};

		/**
		 * History.busy.flag
		 */
		History.busy.flag = false;

		/**
		 * History.fireQueueItem(item)
		 * Fire a Queue Item
		 * @param {Object} item
		 * @return {Mixed} result
		 */
		History.fireQueueItem = function(item){
			return item.callback.apply(item.scope||History,item.args||[]);
		};

		/**
		 * History.pushQueue(callback,args)
		 * Add an item to the queue
		 * @param {Object} item [scope,callback,args,queue]
		 */
		History.pushQueue = function(item){
			// Prepare the queue
			History.queues[item.queue||0] = History.queues[item.queue||0]||[];

			// Add to the queue
			History.queues[item.queue||0].push(item);

			// Chain
			return History;
		};

		/**
		 * History.queue (item,queue), (func,queue), (func), (item)
		 * Either firs the item now if not busy, or adds it to the queue
		 */
		History.queue = function(item,queue){
			// Prepare
			if ( typeof item === 'function' ) {
				item = {
					callback: item
				};
			}
			if ( typeof queue !== 'undefined' ) {
				item.queue = queue;
			}

			// Handle
			if ( History.busy() ) {
				History.pushQueue(item);
			} else {
				History.fireQueueItem(item);
			}

			// Chain
			return History;
		};

		/**
		 * History.clearQueue()
		 * Clears the Queue
		 */
		History.clearQueue = function(){
			History.busy.flag = false;
			History.queues = [];
			return History;
		};


		// ====================================================================
		// IE Bug Fix

		/**
		 * History.stateChanged
		 * States whether or not the state has changed since the last double check was initialised
		 */
		History.stateChanged = false;

		/**
		 * History.doubleChecker
		 * Contains the timeout used for the double checks
		 */
		History.doubleChecker = false;

		/**
		 * History.doubleCheckComplete()
		 * Complete a double check
		 * @return {History}
		 */
		History.doubleCheckComplete = function(){
			// Update
			History.stateChanged = true;

			// Clear
			History.doubleCheckClear();

			// Chain
			return History;
		};

		/**
		 * History.doubleCheckClear()
		 * Clear a double check
		 * @return {History}
		 */
		History.doubleCheckClear = function(){
			// Clear
			if ( History.doubleChecker ) {
				clearTimeout(History.doubleChecker);
				History.doubleChecker = false;
			}

			// Chain
			return History;
		};

		/**
		 * History.doubleCheck()
		 * Create a double check
		 * @return {History}
		 */
		History.doubleCheck = function(tryAgain){
			// Reset
			History.stateChanged = false;
			History.doubleCheckClear();

			// Fix IE6,IE7 bug where calling history.back or history.forward does not actually change the hash (whereas doing it manually does)
			// Fix Safari 5 bug where sometimes the state does not change: https://bugs.webkit.org/show_bug.cgi?id=42940
			if ( History.bugs.ieDoubleCheck ) {
				// Apply Check
				History.doubleChecker = setTimeout(
					function(){
						History.doubleCheckClear();
						if ( !History.stateChanged ) {
							//History.debug('History.doubleCheck: State has not yet changed, trying again', arguments);
							// Re-Attempt
							tryAgain();
						}
						return true;
					},
					History.options.doubleCheckInterval
				);
			}

			// Chain
			return History;
		};


		// ====================================================================
		// Safari Bug Fix

		/**
		 * History.safariStatePoll()
		 * Poll the current state
		 * @return {History}
		 */
		History.safariStatePoll = function(){
			// Poll the URL

			// Get the Last State which has the new URL
			var
				urlState = History.extractState(document.location.href),
				newState;

			// Check for a difference
			if ( !History.isLastSavedState(urlState) ) {
				newState = urlState;
			}
			else {
				return;
			}

			// Check if we have a state with that url
			// If not create it
			if ( !newState ) {
				//History.debug('History.safariStatePoll: new');
				newState = History.createStateObject();
			}

			// Apply the New State
			//History.debug('History.safariStatePoll: trigger');
			History.Adapter.trigger(window,'popstate');

			// Chain
			return History;
		};


		// ====================================================================
		// State Aliases

		/**
		 * History.back(queue)
		 * Send the browser history back one item
		 * @param {Integer} queue [optional]
		 */
		History.back = function(queue){
			//History.debug('History.back: called', arguments);

			// Handle Queueing
			if ( queue !== false && History.busy() ) {
				// Wait + Push to Queue
				//History.debug('History.back: we must wait', arguments);
				History.pushQueue({
					scope: History,
					callback: History.back,
					args: arguments,
					queue: queue
				});
				return false;
			}

			// Make Busy + Continue
			History.busy(true);

			// Fix certain browser bugs that prevent the state from changing
			History.doubleCheck(function(){
				History.back(false);
			});

			// Go back
			history.go(-1);

			// End back closure
			return true;
		};

		/**
		 * History.forward(queue)
		 * Send the browser history forward one item
		 * @param {Integer} queue [optional]
		 */
		History.forward = function(queue){
			//History.debug('History.forward: called', arguments);

			// Handle Queueing
			if ( queue !== false && History.busy() ) {
				// Wait + Push to Queue
				//History.debug('History.forward: we must wait', arguments);
				History.pushQueue({
					scope: History,
					callback: History.forward,
					args: arguments,
					queue: queue
				});
				return false;
			}

			// Make Busy + Continue
			History.busy(true);

			// Fix certain browser bugs that prevent the state from changing
			History.doubleCheck(function(){
				History.forward(false);
			});

			// Go forward
			history.go(1);

			// End forward closure
			return true;
		};

		/**
		 * History.go(index,queue)
		 * Send the browser history back or forward index times
		 * @param {Integer} queue [optional]
		 */
		History.go = function(index,queue){
			//History.debug('History.go: called', arguments);

			// Prepare
			var i;

			// Handle
			if ( index > 0 ) {
				// Forward
				for ( i=1; i<=index; ++i ) {
					History.forward(queue);
				}
			}
			else if ( index < 0 ) {
				// Backward
				for ( i=-1; i>=index; --i ) {
					History.back(queue);
				}
			}
			else {
				throw new Error('History.go: History.go requires a positive or negative integer passed.');
			}

			// Chain
			return History;
		};


		// ====================================================================
		// HTML5 State Support

		// Non-Native pushState Implementation
		if ( History.emulated.pushState ) {
			/*
			 * Provide Skeleton for HTML4 Browsers
			 */

			// Prepare
			var emptyFunction = function(){};
			History.pushState = History.pushState||emptyFunction;
			History.replaceState = History.replaceState||emptyFunction;
		} // History.emulated.pushState

		// Native pushState Implementation
		else {
			/*
			 * Use native HTML5 History API Implementation
			 */

			/**
			 * History.onPopState(event,extra)
			 * Refresh the Current State
			 */
			History.onPopState = function(event,extra){
				// Prepare
				var stateId = false, newState = false, currentHash, currentState;

				// Reset the double check
				History.doubleCheckComplete();

				// Check for a Hash, and handle apporiatly
				currentHash	= History.getHash();
				if ( currentHash ) {
					// Expand Hash
					currentState = History.extractState(currentHash||document.location.href,true);
					if ( currentState ) {
						// We were able to parse it, it must be a State!
						// Let's forward to replaceState
						//History.debug('History.onPopState: state anchor', currentHash, currentState);
						History.replaceState(currentState.data, currentState.title, currentState.url, false);
					}
					else {
						// Traditional Anchor
						//History.debug('History.onPopState: traditional anchor', currentHash);
						History.Adapter.trigger(window,'anchorchange');
						History.busy(false);
					}

					// We don't care for hashes
					History.expectedStateId = false;
					return false;
				}

				// Ensure
				stateId = History.Adapter.extractEventData('state',event,extra) || false;

				// Fetch State
				if ( stateId ) {
					// Vanilla: Back/forward button was used
					newState = History.getStateById(stateId);
				}
				else if ( History.expectedStateId ) {
					// Vanilla: A new state was pushed, and popstate was called manually
					newState = History.getStateById(History.expectedStateId);
				}
				else {
					// Initial State
					newState = History.extractState(document.location.href);
				}

				// The State did not exist in our store
				if ( !newState ) {
					// Regenerate the State
					newState = History.createStateObject(null,null,document.location.href);
				}

				// Clean
				History.expectedStateId = false;

				// Check if we are the same state
				if ( History.isLastSavedState(newState) ) {
					// There has been no change (just the page's hash has finally propagated)
					//History.debug('History.onPopState: no change', newState, History.savedStates);
					History.busy(false);
					return false;
				}

				// Store the State
				History.storeState(newState);
				History.saveState(newState);

				// Force update of the title
				History.setTitle(newState);

				// Fire Our Event
				History.Adapter.trigger(window,'statechange');
				History.busy(false);

				// Return true
				return true;
			};
			History.Adapter.bind(window,'popstate',History.onPopState);

			/**
			 * History.pushState(data,title,url)
			 * Add a new State to the history object, become it, and trigger onpopstate
			 * We have to trigger for HTML4 compatibility
			 * @param {object} data
			 * @param {string} title
			 * @param {string} url
			 * @return {true}
			 */
			History.pushState = function(data,title,url,queue){
				//History.debug('History.pushState: called', arguments);

				// Check the State
				if ( History.getHashByUrl(url) && History.emulated.pushState ) {
					throw new Error('History.js does not support states with fragement-identifiers (hashes/anchors).');
				}

				// Handle Queueing
				if ( queue !== false && History.busy() ) {
					// Wait + Push to Queue
					//History.debug('History.pushState: we must wait', arguments);
					History.pushQueue({
						scope: History,
						callback: History.pushState,
						args: arguments,
						queue: queue
					});
					return false;
				}

				// Make Busy + Continue
				History.busy(true);

				// Create the newState
				var newState = History.createStateObject(data,title,url);

				// Check it
				if ( History.isLastSavedState(newState) ) {
					// Won't be a change
					History.busy(false);
				}
				else {
					// Store the newState
					History.storeState(newState);
					History.expectedStateId = newState.id;

					// Push the newState
					history.pushState(newState.id,newState.title,newState.url);

					// Fire HTML5 Event
					History.Adapter.trigger(window,'popstate');
				}

				// End pushState closure
				return true;
			};

			/**
			 * History.replaceState(data,title,url)
			 * Replace the State and trigger onpopstate
			 * We have to trigger for HTML4 compatibility
			 * @param {object} data
			 * @param {string} title
			 * @param {string} url
			 * @return {true}
			 */
			History.replaceState = function(data,title,url,queue){
				//History.debug('History.replaceState: called', arguments);

				// Check the State
				if ( History.getHashByUrl(url) && History.emulated.pushState ) {
					throw new Error('History.js does not support states with fragement-identifiers (hashes/anchors).');
				}

				// Handle Queueing
				if ( queue !== false && History.busy() ) {
					// Wait + Push to Queue
					//History.debug('History.replaceState: we must wait', arguments);
					History.pushQueue({
						scope: History,
						callback: History.replaceState,
						args: arguments,
						queue: queue
					});
					return false;
				}

				// Make Busy + Continue
				History.busy(true);

				// Create the newState
				var newState = History.createStateObject(data,title,url);

				// Check it
				if ( History.isLastSavedState(newState) ) {
					// Won't be a change
					History.busy(false);
				}
				else {
					// Store the newState
					History.storeState(newState);
					History.expectedStateId = newState.id;

					// Push the newState
					history.replaceState(newState.id,newState.title,newState.url);

					// Fire HTML5 Event
					History.Adapter.trigger(window,'popstate');
				}

				// End replaceState closure
				return true;
			};

		} // !History.emulated.pushState


		// ====================================================================
		// Initialise

		/**
		 * Load the Store
		 */
		if ( sessionStorage ) {
			// Fetch
			try {
				History.store = JSON.parse(sessionStorage.getItem('History.store'))||{};
			}
			catch ( err ) {
				History.store = {};
			}

			// Normalize
			History.normalizeStore();
		}
		else {
			// Default Load
			History.store = {};
			History.normalizeStore();
		}

		/**
		 * Clear Intervals on exit to prevent memory leaks
		 */
		History.Adapter.bind(window,"beforeunload",History.clearAllIntervals);
		History.Adapter.bind(window,"unload",History.clearAllIntervals);

		/**
		 * Create the initial State
		 */
		History.saveState(History.storeState(History.extractState(document.location.href,true)));

		/**
		 * Bind for Saving Store
		 */
		if ( sessionStorage ) {
			// When the page is closed
			History.onUnload = function(){
				// Prepare
				var	currentStore, item;

				// Fetch
				try {
					currentStore = JSON.parse(sessionStorage.getItem('History.store'))||{};
				}
				catch ( err ) {
					currentStore = {};
				}

				// Ensure
				currentStore.idToState = currentStore.idToState || {};
				currentStore.urlToId = currentStore.urlToId || {};
				currentStore.stateToId = currentStore.stateToId || {};

				// Sync
				for ( item in History.idToState ) {
					if ( !History.idToState.hasOwnProperty(item) ) {
						continue;
					}
					currentStore.idToState[item] = History.idToState[item];
				}
				for ( item in History.urlToId ) {
					if ( !History.urlToId.hasOwnProperty(item) ) {
						continue;
					}
					currentStore.urlToId[item] = History.urlToId[item];
				}
				for ( item in History.stateToId ) {
					if ( !History.stateToId.hasOwnProperty(item) ) {
						continue;
					}
					currentStore.stateToId[item] = History.stateToId[item];
				}

				// Update
				History.store = currentStore;
				History.normalizeStore();

				// Store
				sessionStorage.setItem('History.store',JSON.stringify(currentStore));
			};

			// For Internet Explorer
			History.intervalList.push(setInterval(History.onUnload,History.options.storeInterval));
			
			// For Other Browsers
			History.Adapter.bind(window,'beforeunload',History.onUnload);
			History.Adapter.bind(window,'unload',History.onUnload);
			
			// Both are enabled for consistency
		}

		// Non-Native pushState Implementation
		if ( !History.emulated.pushState ) {
			// Be aware, the following is only for native pushState implementations
			// If you are wanting to include something for all browsers
			// Then include it above this if block

			/**
			 * Setup Safari Fix
			 */
			if ( History.bugs.safariPoll ) {
				History.intervalList.push(setInterval(History.safariStatePoll, History.options.safariPollInterval));
			}

			/**
			 * Ensure Cross Browser Compatibility
			 */
			if ( navigator.vendor === 'Apple Computer, Inc.' || (navigator.appCodeName||'') === 'Mozilla' ) {
				/**
				 * Fix Safari HashChange Issue
				 */

				// Setup Alias
				History.Adapter.bind(window,'hashchange',function(){
					History.Adapter.trigger(window,'popstate');
				});

				// Initialise Alias
				if ( History.getHash() ) {
					History.Adapter.onDomLoad(function(){
						History.Adapter.trigger(window,'hashchange');
					});
				}
			}

		} // !History.emulated.pushState


	}; // History.initCore

	// Try and Initialise History
	History.init();

})(window);


/**
 * History.js jQuery Adapter
 * @author Benjamin Arthur Lupton <contact@balupton.com>
 * @copyright 2010-2011 Benjamin Arthur Lupton <contact@balupton.com>
 * @license New BSD License <http://creativecommons.org/licenses/BSD/>
 */

// Closure
(function(window,undefined){
	"use strict";

	// Localise Globals
	var
		History = window.History = window.History||{},
		jQuery = window.jQuery;

	// Check Existence
	if ( typeof History.Adapter !== 'undefined' ) {
		throw new Error('History.js Adapter has already been loaded...');
	}

	// Add the Adapter
	History.Adapter = {
		/**
		 * History.Adapter.bind(el,event,callback)
		 * @param {Element|string} el
		 * @param {string} event - custom and standard events
		 * @param {function} callback
		 * @return {void}
		 */
		bind: function(el,event,callback){
			jQuery(el).bind(event,callback);
		},

		/**
		 * History.Adapter.trigger(el,event)
		 * @param {Element|string} el
		 * @param {string} event - custom and standard events
		 * @param {Object=} extra - a object of extra event data (optional)
		 * @return {void}
		 */
		trigger: function(el,event,extra){
			jQuery(el).trigger(event,extra);
		},

		/**
		 * History.Adapter.extractEventData(key,event,extra)
		 * @param {string} key - key for the event data to extract
		 * @param {string} event - custom and standard events
		 * @param {Object=} extra - a object of extra event data (optional)
		 * @return {mixed}
		 */
		extractEventData: function(key,event,extra){
			// jQuery Native then jQuery Custom
			var result = (event && event.originalEvent && event.originalEvent[key]) || (extra && extra[key]) || undefined;

			// Return
			return result;
		},

		/**
		 * History.Adapter.onDomLoad(callback)
		 * @param {function} callback
		 * @return {void}
		 */
		onDomLoad: function(callback) {
			jQuery(callback);
		}
	};

	// Try and Initialise History
	if ( typeof History.init !== 'undefined' ) {
		History.init();
	}

})(window);



// moment.js
// version : 1.4.0
// author : Tim Wood
// license : MIT
// momentjs.com

(function (Date, undefined) {

    var moment,
        round = Math.round,
        languages = {},
        hasModule = (typeof module !== 'undefined'),
        paramsToParse = 'months|monthsShort|monthsParse|weekdays|weekdaysShort|longDateFormat|calendar|relativeTime|ordinal|meridiem'.split('|'),
        i,
        jsonRegex = /^\/?Date\((\-?\d+)/i,
        charactersToReplace = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|dddd?|do?|w[o|w]?|YYYY|YY|a|A|hh?|HH?|mm?|ss?|zz?|ZZ?|LT|LL?L?L?)/g,
        nonuppercaseLetters = /[^A-Z]/g,
        timezoneRegex = /\([A-Za-z ]+\)|:[0-9]{2} [A-Z]{3} /g,
        tokenCharacters = /(\\)?(MM?M?M?|dd?d?d|DD?D?D?|YYYY|YY|a|A|hh?|HH?|mm?|ss?|ZZ?|T)/g,
        inputCharacters = /(\\)?([0-9]+|([a-zA-Z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+|([\+\-]\d\d:?\d\d))/gi,
        isoRegex = /\d{4}.\d\d.\d\d(T(\d\d(.\d\d(.\d\d)?)?)?([\+\-]\d\d:?\d\d)?)?/,
        isoFormat = 'YYYY-MM-DDTHH:mm:ssZ',
        isoTimes = [
            ['HH:mm:ss', /T\d\d:\d\d:\d\d/],
            ['HH:mm', /T\d\d:\d\d/],
            ['HH', /T\d\d/]
        ],
        timezoneParseRegex = /([\+\-]|\d\d)/gi,
        VERSION = "1.4.0",
        shortcuts = 'Month|Date|Hours|Minutes|Seconds|Milliseconds'.split('|');

    // Moment prototype object
    function Moment(date, isUTC) {
        this._d = date;
        this._isUTC = !!isUTC;
    }

    // left zero fill a number
    // see http://jsperf.com/left-zero-filling for performance comparison
    function leftZeroFill(number, targetLength) {
        var output = number + '';
        while (output.length < targetLength) {
            output = '0' + output;
        }
        return output;
    }

    // helper function for _.addTime and _.subtractTime
    function dateAddRemove(date, _input, adding, val) {
        var isString = (typeof _input === 'string'),
            input = isString ? {} : _input,
            ms, d, M, currentDate;
        if (isString && val) {
            input[_input] = +val;
        }
        ms = (input.ms || input.milliseconds || 0) +
            (input.s || input.seconds || 0) * 1e3 + // 1000
            (input.m || input.minutes || 0) * 6e4 + // 1000 * 60
            (input.h || input.hours || 0) * 36e5; // 1000 * 60 * 60
        d = (input.d || input.days || 0) +
            (input.w || input.weeks || 0) * 7;
        M = (input.M || input.months || 0) +
            (input.y || input.years || 0) * 12;
        if (ms) {
            date.setTime(+date + ms * adding);
        }
        if (d) {
            date.setDate(date.getDate() + d * adding);
        }
        if (M) {
            currentDate = date.getDate();
            date.setDate(1);
            date.setMonth(date.getMonth() + M * adding);
            date.setDate(Math.min(new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(), currentDate));
        }
        return date;
    }

    // check if is an array
    function isArray(input) {
        return Object.prototype.toString.call(input) === '[object Array]';
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function dateFromArray(input) {
        return new Date(input[0], input[1] || 0, input[2] || 1, input[3] || 0, input[4] || 0, input[5] || 0, input[6] || 0);
    }

    // format date using native date object
    function formatMoment(m, inputString) {
        var currentMonth = m.month(),
            currentDate = m.date(),
            currentYear = m.year(),
            currentDay = m.day(),
            currentHours = m.hours(),
            currentMinutes = m.minutes(),
            currentSeconds = m.seconds(),
            currentZone = -m.zone(),
            ordinal = moment.ordinal,
            meridiem = moment.meridiem;
        // check if the character is a format
        // return formatted string or non string.
        //
        // uses switch/case instead of an object of named functions (like http://phpjs.org/functions/date:380)
        // for minification and performance
        // see http://jsperf.com/object-of-functions-vs-switch for performance comparison
        function replaceFunction(input) {
            // create a couple variables to be used later inside one of the cases.
            var a, b;
            switch (input) {
                // MONTH
            case 'M' :
                return currentMonth + 1;
            case 'Mo' :
                return (currentMonth + 1) + ordinal(currentMonth + 1);
            case 'MM' :
                return leftZeroFill(currentMonth + 1, 2);
            case 'MMM' :
                return moment.monthsShort[currentMonth];
            case 'MMMM' :
                return moment.months[currentMonth];
            // DAY OF MONTH
            case 'D' :
                return currentDate;
            case 'Do' :
                return currentDate + ordinal(currentDate);
            case 'DD' :
                return leftZeroFill(currentDate, 2);
            // DAY OF YEAR
            case 'DDD' :
                a = new Date(currentYear, currentMonth, currentDate);
                b = new Date(currentYear, 0, 1);
                return ~~ (((a - b) / 864e5) + 1.5);
            case 'DDDo' :
                a = replaceFunction('DDD');
                return a + ordinal(a);
            case 'DDDD' :
                return leftZeroFill(replaceFunction('DDD'), 3);
            // WEEKDAY
            case 'd' :
                return currentDay;
            case 'do' :
                return currentDay + ordinal(currentDay);
            case 'ddd' :
                return moment.weekdaysShort[currentDay];
            case 'dddd' :
                return moment.weekdays[currentDay];
            // WEEK OF YEAR
            case 'w' :
                a = new Date(currentYear, currentMonth, currentDate - currentDay + 5);
                b = new Date(a.getFullYear(), 0, 4);
                return ~~ ((a - b) / 864e5 / 7 + 1.5);
            case 'wo' :
                a = replaceFunction('w');
                return a + ordinal(a);
            case 'ww' :
                return leftZeroFill(replaceFunction('w'), 2);
            // YEAR
            case 'YY' :
                return leftZeroFill(currentYear % 100, 2);
            case 'YYYY' :
                return currentYear;
            // AM / PM
            case 'a' :
                return currentHours > 11 ? meridiem.pm : meridiem.am;
            case 'A' :
                return currentHours > 11 ? meridiem.PM : meridiem.AM;
            // 24 HOUR
            case 'H' :
                return currentHours;
            case 'HH' :
                return leftZeroFill(currentHours, 2);
            // 12 HOUR
            case 'h' :
                return currentHours % 12 || 12;
            case 'hh' :
                return leftZeroFill(currentHours % 12 || 12, 2);
            // MINUTE
            case 'm' :
                return currentMinutes;
            case 'mm' :
                return leftZeroFill(currentMinutes, 2);
            // SECOND
            case 's' :
                return currentSeconds;
            case 'ss' :
                return leftZeroFill(currentSeconds, 2);
            // TIMEZONE
            case 'zz' :
                // depreciating 'zz' fall through to 'z'
            case 'z' :
                return (m._d.toString().match(timezoneRegex) || [''])[0].replace(nonuppercaseLetters, '');
            case 'Z' :
                return (currentZone < 0 ? '-' : '+') + leftZeroFill(~~(Math.abs(currentZone) / 60), 2) + ':' + leftZeroFill(~~(Math.abs(currentZone) % 60), 2);
            case 'ZZ' :
                return (currentZone < 0 ? '-' : '+') + leftZeroFill(~~(10 * Math.abs(currentZone) / 6), 4);
            // LONG DATES
            case 'L' :
            case 'LL' :
            case 'LLL' :
            case 'LLLL' :
            case 'LT' :
                return formatMoment(m, moment.longDateFormat[input]);
            // DEFAULT
            default :
                return input.replace(/(^\[)|(\\)|\]$/g, "");
            }
        }
        return inputString.replace(charactersToReplace, replaceFunction);
    }

    // date from string and format string
    function makeDateFromStringAndFormat(string, format) {
        var inArray = [0, 0, 1, 0, 0, 0, 0],
            timezoneHours = 0,
            timezoneMinutes = 0,
            isUsingUTC = false,
            inputParts = string.match(inputCharacters),
            formatParts = format.match(tokenCharacters),
            len = Math.min(inputParts.length, formatParts.length),
            i,
            isPm;

        // function to convert string input to date
        function addTime(format, input) {
            var a;
            switch (format) {
            // MONTH
            case 'M' :
                // fall through to MM
            case 'MM' :
                inArray[1] = ~~input - 1;
                break;
            case 'MMM' :
                // fall through to MMMM
            case 'MMMM' :
                for (a = 0; a < 12; a++) {
                    if (moment.monthsParse[a].test(input)) {
                        inArray[1] = a;
                        break;
                    }
                }
                break;
            // DAY OF MONTH
            case 'D' :
                // fall through to DDDD
            case 'DD' :
                // fall through to DDDD
            case 'DDD' :
                // fall through to DDDD
            case 'DDDD' :
                inArray[2] = ~~input;
                break;
            // YEAR
            case 'YY' :
                input = ~~input;
                inArray[0] = input + (input > 70 ? 1900 : 2000);
                break;
            case 'YYYY' :
                inArray[0] = ~~Math.abs(input);
                break;
            // AM / PM
            case 'a' :
                // fall through to A
            case 'A' :
                isPm = (input.toLowerCase() === 'pm');
                break;
            // 24 HOUR
            case 'H' :
                // fall through to hh
            case 'HH' :
                // fall through to hh
            case 'h' :
                // fall through to hh
            case 'hh' :
                inArray[3] = ~~input;
                break;
            // MINUTE
            case 'm' :
                // fall through to mm
            case 'mm' :
                inArray[4] = ~~input;
                break;
            // SECOND
            case 's' :
                // fall through to ss
            case 'ss' :
                inArray[5] = ~~input;
                break;
            // TIMEZONE
            case 'Z' :
                // fall through to ZZ
            case 'ZZ' :
                isUsingUTC = true;
                a = (input || '').match(timezoneParseRegex);
                if (a && a[1]) {
                    timezoneHours = ~~a[1];
                }
                if (a && a[2]) {
                    timezoneMinutes = ~~a[2];
                }
                // reverse offsets
                if (a && a[0] === '+') {
                    timezoneHours = -timezoneHours;
                    timezoneMinutes = -timezoneMinutes;
                }
                break;
            }
        }
        for (i = 0; i < len; i++) {
            addTime(formatParts[i], inputParts[i]);
        }
        // handle am pm
        if (isPm && inArray[3] < 12) {
            inArray[3] += 12;
        }
        // if is 12 am, change hours to 0
        if (isPm === false && inArray[3] === 12) {
            inArray[3] = 0;
        }
        // handle timezone
        inArray[3] += timezoneHours;
        inArray[4] += timezoneMinutes;
        // return
        return isUsingUTC ? new Date(Date.UTC.apply({}, inArray)) : dateFromArray(inArray);
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if (~~array1[i] !== ~~array2[i]) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    // date from string and array of format strings
    function makeDateFromStringAndArray(string, formats) {
        var output,
            inputParts = string.match(inputCharacters),
            scores = [],
            scoreToBeat = 99,
            i,
            curDate,
            curScore;
        for (i = 0; i < formats.length; i++) {
            curDate = makeDateFromStringAndFormat(string, formats[i]);
            curScore = compareArrays(inputParts, formatMoment(new Moment(curDate), formats[i]).match(inputCharacters));
            if (curScore < scoreToBeat) {
                scoreToBeat = curScore;
                output = curDate;
            }
        }
        return output;
    }

    // date from iso format
    function makeDateFromString(string) {
        var format = 'YYYY-MM-DDT',
            i;
        if (isoRegex.exec(string)) {
            for (i = 0; i < 3; i++) {
                if (isoTimes[i][1].exec(string)) {
                    format += isoTimes[i][0];
                    break;
                }
            }
            return makeDateFromStringAndFormat(string, format + 'Z');
        }
        return new Date(string);
    }

    // helper function for _date.from() and _date.fromNow()
    function substituteTimeAgo(string, number, withoutSuffix) {
        var rt = moment.relativeTime[string];
        return (typeof rt === 'function') ?
            rt(number || 1, !!withoutSuffix, string) :
            rt.replace(/%d/i, number || 1);
    }

    function relativeTime(milliseconds, withoutSuffix) {
        var seconds = round(Math.abs(milliseconds) / 1000),
            minutes = round(seconds / 60),
            hours = round(minutes / 60),
            days = round(hours / 24),
            years = round(days / 365),
            args = seconds < 45 && ['s', seconds] ||
                minutes === 1 && ['m'] ||
                minutes < 45 && ['mm', minutes] ||
                hours === 1 && ['h'] ||
                hours < 22 && ['hh', hours] ||
                days === 1 && ['d'] ||
                days <= 25 && ['dd', days] ||
                days <= 45 && ['M'] ||
                days < 345 && ['MM', round(days / 30)] ||
                years === 1 && ['y'] || ['yy', years];
        args[2] = withoutSuffix;
        return substituteTimeAgo.apply({}, args);
    }

    moment = function (input, format) {
        if (input === null || input === '') {
            return null;
        }
        var date,
            matched;
        // parse Moment object
        if (input && input._d instanceof Date) {
            date = new Date(+input._d);
        // parse string and format
        } else if (format) {
            if (isArray(format)) {
                date = makeDateFromStringAndArray(input, format);
            } else {
                date = makeDateFromStringAndFormat(input, format);
            }
        // evaluate it as a JSON-encoded date
        } else {
            matched = jsonRegex.exec(input);
            date = input === undefined ? new Date() :
                matched ? new Date(+matched[1]) :
                input instanceof Date ? input :
                isArray(input) ? dateFromArray(input) :
                typeof input === 'string' ? makeDateFromString(input) :
                new Date(input);
        }
        return new Moment(date);
    };

    // creating with utc
    moment.utc = function (input, format) {
        if (isArray(input)) {
            return new Moment(new Date(Date.UTC.apply({}, input)), true);
        }
        return (format && input) ? moment(input + ' 0', format + ' Z').utc() : moment(input).utc();
    };

    // humanizeDuration
    moment.humanizeDuration = function (num, type, withSuffix) {
        var difference = +num,
            rel = moment.relativeTime,
            output;
        switch (type) {
        case "seconds" :
            difference *= 1000; // 1000
            break;
        case "minutes" :
            difference *= 60000; // 60 * 1000
            break;
        case "hours" :
            difference *= 3600000; // 60 * 60 * 1000
            break;
        case "days" :
            difference *= 86400000; // 24 * 60 * 60 * 1000
            break;
        case "weeks" :
            difference *= 604800000; // 7 * 24 * 60 * 60 * 1000
            break;
        case "months" :
            difference *= 2592000000; // 30 * 24 * 60 * 60 * 1000
            break;
        case "years" :
            difference *= 31536000000; // 365 * 24 * 60 * 60 * 1000
            break;
        default :
            withSuffix = !!type;
            break;
        }
        output = relativeTime(difference, !withSuffix);
        return withSuffix ? (difference <= 0 ? rel.past : rel.future).replace(/%s/i, output) : output;
    };

    // version number
    moment.version = VERSION;

    // default format
    moment.defaultFormat = isoFormat;

    // language switching and caching
    moment.lang = function (key, values) {
        var i,
            param,
            req,
            parse = [];
        if (values) {
            for (i = 0; i < 12; i++) {
                parse[i] = new RegExp('^' + values.months[i] + '|^' + values.monthsShort[i].replace('.', ''), 'i');
            }
            values.monthsParse = values.monthsParse || parse;
            languages[key] = values;
        }
        if (languages[key]) {
            for (i = 0; i < paramsToParse.length; i++) {
                param = paramsToParse[i];
                moment[param] = languages[key][param] || moment[param];
            }
        } else {
            if (hasModule) {
                req = require('./lang/' + key);
                moment.lang(key, req);
            }
        }
    };

    // set default language
    moment.lang('en', {
        months : "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
        monthsShort : "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
        weekdays : "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
        weekdaysShort : "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
        longDateFormat : {
            LT : "h:mm A",
            L : "MM/DD/YYYY",
            LL : "MMMM D YYYY",
            LLL : "MMMM D YYYY LT",
            LLLL : "dddd, MMMM D YYYY LT"
        },
        meridiem : {
            AM : 'AM',
            am : 'am',
            PM : 'PM',
            pm : 'pm'
        },
        calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[last] dddd [at] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : "in %s",
            past : "%s ago",
            s : "a few seconds",
            m : "a minute",
            mm : "%d minutes",
            h : "an hour",
            hh : "%d hours",
            d : "a day",
            dd : "%d days",
            M : "a month",
            MM : "%d months",
            y : "a year",
            yy : "%d years"
        },
        ordinal : function (number) {
            var b = number % 10;
            return (~~ (number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
        }
    });

    // shortcut for prototype
    moment.fn = Moment.prototype = {

        clone : function () {
            return moment(this);
        },

        valueOf : function () {
            return +this._d;
        },

        'native' : function () {
            return this._d;
        },

        toString : function () {
            return this._d.toString();
        },

        toDate : function () {
            return this._d;
        },

        utc : function () {
            this._isUTC = true;
            return this;
        },

        local : function () {
            this._isUTC = false;
            return this;
        },

        format : function (inputString) {
            return formatMoment(this, inputString ? inputString : moment.defaultFormat);
        },

        add : function (input, val) {
            this._d = dateAddRemove(this._d, input, 1, val);
            return this;
        },

        subtract : function (input, val) {
            this._d = dateAddRemove(this._d, input, -1, val);
            return this;
        },

        diff : function (input, val, asFloat) {
            var inputMoment = moment(input),
                zoneDiff = (this.zone() - inputMoment.zone()) * 6e4,
                diff = this._d - inputMoment._d - zoneDiff,
                year = this.year() - inputMoment.year(),
                month = this.month() - inputMoment.month(),
                date = this.date() - inputMoment.date(),
                output;
            if (val === 'months') {
                output = year * 12 + month + date / 30;
            } else if (val === 'years') {
                output = year + month / 12;
            } else {
                output = val === 'seconds' ? diff / 1e3 : // 1000
                    val === 'minutes' ? diff / 6e4 : // 1000 * 60
                    val === 'hours' ? diff / 36e5 : // 1000 * 60 * 60
                    val === 'days' ? diff / 864e5 : // 1000 * 60 * 60 * 24
                    val === 'weeks' ? diff / 6048e5 : // 1000 * 60 * 60 * 24 * 7
                    diff;
            }
            return asFloat ? output : round(output);
        },

        from : function (time, withoutSuffix) {
            return moment.humanizeDuration(this.diff(time), !withoutSuffix);
        },

        fromNow : function (withoutSuffix) {
            return this.from(moment(), withoutSuffix);
        },

        calendar : function () {
            var diff = this.diff(moment().sod(), 'days', true),
                calendar = moment.calendar,
                allElse = calendar.sameElse,
                format = diff < -6 ? allElse :
                diff < -1 ? calendar.lastWeek :
                diff < 0 ? calendar.lastDay :
                diff < 1 ? calendar.sameDay :
                diff < 2 ? calendar.nextDay :
                diff < 7 ? calendar.nextWeek : allElse;
            return this.format(typeof format === 'function' ? format.apply(this) : format);
        },

        isLeapYear : function () {
            var year = this.year();
            return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
        },

        isDST : function () {
            return (this.zone() < moment([this.year()]).zone() || 
                this.zone() < moment([this.year(), 5]).zone());
        },

        day : function (input) {
            var day = this._d.getDay();
            return input == null ? day :
                this.add({ d : input - day });
        },

        sod: function () {
            return this.clone()
                .hours(0)
                .minutes(0)
                .seconds(0)
                .milliseconds(0);
        },

        eod: function () {
            // end of day = start of day plus 1 day, minus 1 millisecond
            return this.sod().add({
                d : 1,
                ms : -1
            });
        },

        zone : function () {
            return this._isUTC ? 0 : this._d.getTimezoneOffset();
        },

        daysInMonth : function () {
            return this.clone().month(this.month() + 1).date(0).date();
        }
    };

    // helper for adding shortcuts
    function makeShortcut(name, key) {
        moment.fn[name] = function (input) {
            var utc = this._isUTC ? 'UTC' : '';
            if (input != null) {
                this._d['set' + utc + key](input);
                return this;
            } else {
                return this._d['get' + utc + key]();
            }
        };
    }

    // loop through and add shortcuts (Month, Date, Hours, Minutes, Seconds, Milliseconds)
    for (i = 0; i < shortcuts.length; i ++) {
        makeShortcut(shortcuts[i].toLowerCase(), shortcuts[i]);
    }

    // add shortcut for year (uses different syntax than the getter/setter 'year' == 'FullYear')
    makeShortcut('year', 'FullYear');

    // CommonJS module is defined
    if (hasModule) {
        module.exports = moment;
    }
    if (typeof window !== 'undefined') {
        window.moment = moment;
    }
    /*global define:false */
    if (typeof define === "function" && define.amd) {
        define("moment", [], function () {
            return moment;
        });
    }
})(Date);


(function() {
  var cache, coffee, coffeekup, coffeescript_helpers, elements, merge_elements, skeleton;
  var __slice = Array.prototype.slice, __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  if (typeof window !== "undefined" && window !== null) {
    coffeekup = window.CoffeeKup = {};
    coffee = typeof CoffeeScript !== "undefined" && CoffeeScript !== null ? CoffeeScript : null;
  } else {
    coffeekup = exports;
    coffee = require('coffee-script');
  }
  coffeekup.version = '0.3.1';
  coffeekup.doctypes = {
    'default': '<!DOCTYPE html>',
    '5': '<!DOCTYPE html>',
    'xml': '<?xml version="1.0" encoding="utf-8" ?>',
    'transitional': '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">',
    'strict': '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">',
    'frameset': '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Frameset//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-frameset.dtd">',
    '1.1': '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">',
    'basic': '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML Basic 1.1//EN" "http://www.w3.org/TR/xhtml-basic/xhtml-basic11.dtd">',
    'mobile': '<!DOCTYPE html PUBLIC "-//WAPFORUM//DTD XHTML Mobile 1.2//EN" "http://www.openmobilealliance.org/tech/DTD/xhtml-mobile12.dtd">',
    'ce': '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "ce-html-1.0-transitional.dtd">'
  };
  coffeescript_helpers = "var __slice = Array.prototype.slice;\nvar __hasProp = Object.prototype.hasOwnProperty;\nvar __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };\nvar __extends = function(child, parent) {\n  for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }\n  function ctor() { this.constructor = child; }\n  ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype;\n  return child; };\nvar __indexOf = Array.prototype.indexOf || function(item) {\n  for (var i = 0, l = this.length; i < l; i++) {\n    if (this[i] === item) return i;\n  } return -1; };".replace(/\n/g, '');
  elements = {
    regular: 'a abbr address article aside audio b bdi bdo blockquote body button\
 canvas caption cite code colgroup datalist dd del details dfn div dl dt em\
 fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup\
 html i iframe ins kbd label legend li map mark menu meter nav noscript object\
 ol optgroup option output p pre progress q rp rt ruby s samp script section\
 select small span strong style sub summary sup table tbody td textarea tfoot\
 th thead time title tr u ul video',
    "void": 'area base br col command embed hr img input keygen link meta param\
 source track wbr',
    obsolete: 'applet acronym bgsound dir frameset noframes isindex listing\
 nextid noembed plaintext rb strike xmp big blink center font marquee multicol\
 nobr spacer tt',
    obsolete_void: 'basefont frame'
  };
  merge_elements = function() {
    var a, args, element, result, _i, _j, _len, _len2, _ref;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    result = [];
    for (_i = 0, _len = args.length; _i < _len; _i++) {
      a = args[_i];
      _ref = elements[a].split(' ');
      for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
        element = _ref[_j];
        if (__indexOf.call(result, element) < 0) {
          result.push(element);
        }
      }
    }
    return result;
  };
  coffeekup.tags = merge_elements('regular', 'obsolete', 'void', 'obsolete_void');
  coffeekup.self_closing = merge_elements('void', 'obsolete_void');
  skeleton = function(data) {
    var coffeescript, comment, doctype, h, ie, tag, text, yield, __ck, _ref, _ref2;
    if (data == null) {
      data = {};
    }
    if ((_ref = data.format) == null) {
      data.format = false;
    }
    if ((_ref2 = data.autoescape) == null) {
      data.autoescape = false;
    }
    __ck = {
      buffer: [],
      esc: function(txt) {
        if (data.autoescape) {
          return h(txt);
        } else {
          return String(txt);
        }
      },
      tabs: 0,
      repeat: function(string, count) {
        return Array(count + 1).join(string);
      },
      indent: function() {
        if (data.format) {
          return text(this.repeat('  ', this.tabs));
        }
      },
      tag: function(name, args) {
        var combo, i, _i, _len;
        combo = [name];
        for (_i = 0, _len = args.length; _i < _len; _i++) {
          i = args[_i];
          combo.push(i);
        }
        return tag.apply(data, combo);
      },
      render_idclass: function(str) {
        var c, classes, i, id, _i, _j, _len, _len2, _ref3;
        classes = [];
        _ref3 = str.split('.');
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          i = _ref3[_i];
          if (__indexOf.call(i, '#') >= 0) {
            id = i.replace('#', '');
          } else {
            if (i !== '') {
              classes.push(i);
            }
          }
        }
        if (id) {
          text(" id=\"" + id + "\"");
        }
        if (classes.length > 0) {
          text(" class=\"");
          for (_j = 0, _len2 = classes.length; _j < _len2; _j++) {
            c = classes[_j];
            if (c !== classes[0]) {
              text(' ');
            }
            text(c);
          }
          return text('"');
        }
      },
      render_attrs: function(obj, prefix) {
        var k, v, _results;
        if (prefix == null) {
          prefix = '';
        }
        _results = [];
        for (k in obj) {
          v = obj[k];
          if (typeof v === 'boolean' && v) {
            v = k;
          }
          if (typeof v === 'function') {
            v = "(" + v + ").call(this);";
          }
          _results.push(typeof v === 'object' && !(v instanceof Array) ? this.render_attrs(v, prefix + k + '-') : v ? text(" " + (prefix + k) + "=\"" + (this.esc(v)) + "\"") : void 0);
        }
        return _results;
      },
      render_contents: function(contents) {
        var result;
        switch (typeof contents) {
          case 'string':
          case 'number':
          case 'boolean':
            return text(this.esc(contents));
          case 'function':
            if (data.format) {
              text('\n');
            }
            this.tabs++;
            result = contents.call(data);
            if (typeof result === 'string') {
              this.indent();
              text(this.esc(result));
              if (data.format) {
                text('\n');
              }
            }
            this.tabs--;
            return this.indent();
        }
      },
      render_tag: function(name, idclass, attrs, contents) {
        this.indent();
        text("<" + name);
        if (idclass) {
          this.render_idclass(idclass);
        }
        if (attrs) {
          this.render_attrs(attrs);
        }
        if (__indexOf.call(this.self_closing, name) >= 0) {
          text(' />');
          if (data.format) {
            text('\n');
          }
        } else {
          text('>');
          this.render_contents(contents);
          text("</" + name + ">");
          if (data.format) {
            text('\n');
          }
        }
        return null;
      }
    };
    tag = function() {
      var a, args, attrs, contents, idclass, name, _i, _len;
      name = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      for (_i = 0, _len = args.length; _i < _len; _i++) {
        a = args[_i];
        switch (typeof a) {
          case 'function':
            contents = a;
            break;
          case 'object':
            attrs = a;
            break;
          case 'number':
          case 'boolean':
            contents = a;
            break;
          case 'string':
            if (args.length === 1) {
              contents = a;
            } else {
              if (a === args[0]) {
                idclass = a;
              } else {
                contents = a;
              }
            }
        }
      }
      return __ck.render_tag(name, idclass, attrs, contents);
    };
    yield = function(f) {
      var old_buffer, temp_buffer;
      temp_buffer = [];
      old_buffer = __ck.buffer;
      __ck.buffer = temp_buffer;
      f();
      __ck.buffer = old_buffer;
      return temp_buffer.join('');
    };
    h = function(txt) {
      return String(txt).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    };
    doctype = function(type) {
      if (type == null) {
        type = 'default';
      }
      text(__ck.doctypes[type]);
      if (data.format) {
        return text('\n');
      }
    };
    text = function(txt) {
      __ck.buffer.push(String(txt));
      return null;
    };
    comment = function(cmt) {
      text("<!--" + cmt + "-->");
      if (data.format) {
        return text('\n');
      }
    };
    coffeescript = function(param) {
      switch (typeof param) {
        case 'function':
          return script("" + __ck.coffeescript_helpers + "(" + param + ").call(this);");
        case 'string':
          return script({
            type: 'text/coffeescript'
          }, function() {
            return param;
          });
        case 'object':
          param.type = 'text/coffeescript';
          return script(param);
      }
    };
    ie = function(condition, contents) {
      __ck.indent();
      text("<!--[if " + condition + "]>");
      __ck.render_contents(contents);
      text("<![endif]-->");
      if (data.format) {
        return text('\n');
      }
    };
    return null;
  };
  skeleton = String(skeleton).replace(/function\s*\(.*\)\s*\{/, '').replace(/return null;\s*\}$/, '');
  skeleton = coffeescript_helpers + skeleton;
  coffeekup.compile = function(template, options) {
    var code, hardcoded_locals, k, t, tag_functions, tags_used, v, _i, _j, _len, _len2, _ref, _ref2;
    if (options == null) {
      options = {};
    }
    if (typeof template === 'function') {
      template = String(template);
    } else if (typeof template === 'string' && (coffee != null)) {
      template = coffee.compile(template, {
        bare: true
      });
      template = "function(){" + template + "}";
    }
    hardcoded_locals = '';
    if (options.hardcode) {
      _ref = options.hardcode;
      for (k in _ref) {
        v = _ref[k];
        if (typeof v === 'function') {
          hardcoded_locals += "var " + k + " = function(){return (" + v + ").apply(data, arguments);};";
        } else {
          hardcoded_locals += "var " + k + " = " + (JSON.stringify(v)) + ";";
        }
      }
    }
    tag_functions = '';
    tags_used = [];
    _ref2 = coffeekup.tags;
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      t = _ref2[_i];
      if (template.indexOf(t) > -1 || hardcoded_locals.indexOf(t) > -1) {
        tags_used.push(t);
      }
    }
    tag_functions += "var " + (tags_used.join(',')) + ";";
    for (_j = 0, _len2 = tags_used.length; _j < _len2; _j++) {
      t = tags_used[_j];
      tag_functions += "" + t + " = function(){return __ck.tag('" + t + "', arguments);};";
    }
    code = tag_functions + hardcoded_locals + skeleton;
    code += "__ck.doctypes = " + (JSON.stringify(coffeekup.doctypes)) + ";";
    code += "__ck.coffeescript_helpers = " + (JSON.stringify(coffeescript_helpers)) + ";";
    code += "__ck.self_closing = " + (JSON.stringify(coffeekup.self_closing)) + ";";
    if (options.locals) {
      code += 'with(data.locals){';
    }
    code += "(" + template + ").call(data);";
    if (options.locals) {
      code += '}';
    }
    code += "return __ck.buffer.join('');";
    return new Function('data', code);
  };
  cache = {};
  coffeekup.render = function(template, data, options) {
    var k, tpl, v, _ref;
    if (data == null) {
      data = {};
    }
    if (options == null) {
      options = {};
    }
    for (k in options) {
      v = options[k];
      data[k] = v;
    }
    if ((_ref = data.cache) == null) {
      data.cache = false;
    }
    if (data.cache && (cache[template] != null)) {
      tpl = cache[template];
    } else if (data.cache) {
      tpl = cache[template] = coffeekup.compile(template, data);
    } else {
      tpl = coffeekup.compile(template, data);
    }
    return tpl(data);
  };
  if (typeof window === "undefined" || window === null) {
    coffeekup.adapters = {
      simple: coffeekup.render,
      meryl: coffeekup.render,
      express: {
        TemplateError: (function() {
          __extends(_Class, Error);
          function _Class(message) {
            this.message = message;
            Error.call(this, this.message);
            Error.captureStackTrace(this, arguments.callee);
          }
          _Class.prototype.name = 'TemplateError';
          return _Class;
        })(),
        compile: function(template, data) {
          var TemplateError, tpl, _ref;
          if ((_ref = data.hardcode) == null) {
            data.hardcode = {};
          }
          data.hardcode.partial = function() {
            return text(this.partial.apply(this, arguments));
          };
          TemplateError = this.TemplateError;
          try {
            tpl = coffeekup.compile(template, data);
          } catch (e) {
            throw new TemplateError("Error compiling " + data.filename + ": " + e.message);
          }
          return function() {
            try {
              return tpl.apply(null, arguments);
            } catch (e) {
              throw new TemplateError("Error rendering " + data.filename + ": " + e.message);
            }
          };
        }
      }
    };
  }
}).call(this);


(function() {
  var Tower, key, module, specialProperties, _fn, _fn2, _fn3, _fn4, _i, _j, _k, _l, _len, _len2, _len3, _len4, _ref, _ref2, _ref3, _ref4,
    __slice = Array.prototype.slice,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
    _this = this;

  window.global || (window.global = window);

  module = global.module || {};

  global.Tower = Tower = {};

  Tower.version = "0.3.9-11";

  Tower.logger = console;

  Tower.Support = {};

  Tower.Support.Array = {
    extractOptions: function(args) {
      if (typeof args[args.length - 1] === "object") {
        return args.pop();
      } else {
        return {};
      }
    },
    extractBlock: function(args) {
      if (typeof args[args.length - 1] === "function") {
        return args.pop();
      } else {
        return null;
      }
    },
    args: function(args, index, withCallback, withOptions) {
      if (index == null) index = 0;
      if (withCallback == null) withCallback = false;
      if (withOptions == null) withOptions = false;
      args = Array.prototype.slice.call(args, index, args.length);
      if (withCallback && !(args.length >= 2 && typeof args[args.length - 1] === "function")) {
        throw new Error("You must pass a callback to the render method");
      }
      return args;
    },
    sortBy: function(objects) {
      var arrayComparator, callbacks, sortings, valueComparator;
      sortings = this.args(arguments, 1);
      callbacks = sortings[sortings.length - 1] instanceof Array ? {} : sortings.pop();
      valueComparator = function(x, y) {
        if (x > y) {
          return 1;
        } else {
          if (x < y) {
            return -1;
          } else {
            return 0;
          }
        }
      };
      arrayComparator = function(a, b) {
        var x, y;
        x = [];
        y = [];
        sortings.forEach(function(sorting) {
          var aValue, attribute, bValue, direction;
          attribute = sorting[0];
          direction = sorting[1];
          aValue = a[attribute];
          bValue = b[attribute];
          if (typeof callbacks[attribute] !== "undefined") {
            aValue = callbacks[attribute](aValue);
            bValue = callbacks[attribute](bValue);
          }
          x.push(direction * valueComparator(aValue, bValue));
          return y.push(direction * valueComparator(bValue, aValue));
        });
        if (x < y) {
          return -1;
        } else {
          return 1;
        }
      };
      sortings = sortings.map(function(sorting) {
        if (!(sorting instanceof Array)) sorting = [sorting, "asc"];
        if (sorting[1] === "desc") {
          sorting[1] = -1;
        } else {
          sorting[1] = 1;
        }
        return sorting;
      });
      return objects.sort(function(a, b) {
        return arrayComparator(a, b);
      });
    }
  };

  Tower.Support.Callbacks = {
    ClassMethods: {
      before: function() {
        return this.appendCallback.apply(this, ["before"].concat(__slice.call(arguments)));
      },
      after: function() {
        return this.appendCallback.apply(this, ["after"].concat(__slice.call(arguments)));
      },
      callback: function() {
        var args;
        args = Tower.Support.Array.args(arguments);
        if (!args[0].match(/^(?:before|around|after)$/)) {
          args = ["after"].concat(args);
        }
        return this.appendCallback.apply(this, args);
      },
      removeCallback: function(action, phase, run) {
        return this;
      },
      appendCallback: function(phase) {
        var args, callback, callbacks, filter, method, options, _i, _len;
        args = Tower.Support.Array.args(arguments, 1);
        if (typeof args[args.length - 1] !== "object") method = args.pop();
        if (typeof args[args.length - 1] === "object") options = args.pop();
        method || (method = args.pop());
        options || (options = {});
        callbacks = this.callbacks();
        for (_i = 0, _len = args.length; _i < _len; _i++) {
          filter = args[_i];
          callback = callbacks[filter] || (callbacks[filter] = new Tower.Support.Callbacks.Chain);
          callback.push(phase, method, options);
        }
        return this;
      },
      prependCallback: function(action, phase, run, options) {
        if (options == null) options = {};
        return this;
      },
      callbacks: function() {
        return this._callbacks || (this._callbacks = {});
      }
    },
    runCallbacks: function(kind, options, block, complete) {
      var chain;
      if (typeof options === "function") {
        complete = block;
        block = options;
        options = {};
      }
      options || (options = {});
      chain = this.constructor.callbacks()[kind];
      if (chain) {
        return chain.run(this, options, block, complete);
      } else {
        block.call(this);
        if (complete) return complete.call(this);
      }
    },
    _callback: function() {
      var callbacks,
        _this = this;
      callbacks = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return function(error) {
        var callback, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = callbacks.length; _i < _len; _i++) {
          callback = callbacks[_i];
          if (callback) {
            _results.push(callback.call(_this, error));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };
    }
  };

  Tower.Support.Callbacks.Chain = (function() {

    function Chain(options) {
      var key, value;
      if (options == null) options = {};
      for (key in options) {
        value = options[key];
        this[key] = value;
      }
      this.before || (this.before = []);
      this.after || (this.after = []);
    }

    Chain.prototype.run = function(binding, options, block, complete) {
      var runner,
        _this = this;
      runner = function(callback, next) {
        return callback.run(binding, options, next);
      };
      return Tower.async(this.before, runner, function(error) {
        if (!error) {
          if (block) {
            switch (block.length) {
              case 0:
                block.call(binding);
                return Tower.async(_this.after, runner, function(error) {
                  if (complete) complete.call(binding);
                  return binding;
                });
              default:
                return block.call(binding, function(error) {
                  if (!error) {
                    return Tower.async(_this.after, runner, function(error) {
                      if (complete) complete.call(binding);
                      return binding;
                    });
                  }
                });
            }
          } else {
            return Tower.async(_this.after, runner, function(error) {
              if (complete) complete.call(binding);
              return binding;
            });
          }
        }
      });
    };

    Chain.prototype.push = function(phase, method, filters, options) {
      return this[phase].push(new Tower.Support.Callback(method, filters, options));
    };

    return Chain;

  })();

  Tower.Support.Callback = (function() {

    function Callback(method, conditions) {
      if (conditions == null) conditions = {};
      this.method = method;
      this.conditions = conditions;
      if (conditions.hasOwnProperty("only")) {
        conditions.only = Tower.Support.Object.toArray(conditions.only);
      }
      if (conditions.hasOwnProperty("except")) {
        conditions.except = Tower.Support.Object.toArray(conditions.except);
      }
    }

    Callback.prototype.run = function(binding, options, next) {
      var conditions, method, result;
      conditions = this.conditions;
      if (options && options.hasOwnProperty("name")) {
        if (conditions.hasOwnProperty("only")) {
          if (_.indexOf(conditions.only, options.name) === -1) return next();
        } else if (conditions.hasOwnProperty("except")) {
          if (_.indexOf(conditions.except, options.name) !== -1) return next();
        }
      }
      method = this.method;
      if (typeof method === "string") method = binding[method];
      switch (method.length) {
        case 0:
          result = method.call(binding);
          return next(!result ? new Error("Callback did not pass") : null);
        default:
          return method.call(binding, next);
      }
    };

    return Callback;

  })();

  specialProperties = ['included', 'extended', 'prototype', 'ClassMethods', 'InstanceMethods'];

  Tower.Class = (function() {

    Class.global = function(value) {
      if (value !== void 0) this._global = value;
      if (this._global === void 0) this._global = true;
      if (value === true) {
        global[this.name] = this;
      } else if (value === false) {
        delete global[this.name];
      }
      return this._global;
    };

    Class.alias = function(to, from) {
      return Tower.Support.Object.alias(this.prototype, to, from);
    };

    Class.accessor = function(key, callback) {
      Tower.Support.Object.accessor(this.prototype, key, callback);
      return this;
    };

    Class.getter = function(key, callback) {
      Tower.Support.Object.getter(this.prototype, key, callback);
      return this;
    };

    Class.setter = function(key) {
      Tower.Support.Object.setter(this.prototype, key);
      return this;
    };

    Class.classAlias = function(to, from) {
      Tower.Support.Object.alias(this, to, from);
      return this;
    };

    Class.classAccessor = function(key, callback) {
      Tower.Support.Object.accessor(this, key, callback);
      return this;
    };

    Class.classGetter = function(key, callback) {
      Tower.Support.Object.getter(this, key, callback);
      return this;
    };

    Class.classSetter = function(key) {
      Tower.Support.Object.setter(this, key);
      return this;
    };

    Class.classEval = function(block) {
      return block.call(this);
    };

    Class.delegate = function(key, options) {
      if (options == null) options = {};
      Tower.Support.Object.delegate(this.prototype, key, options);
      return this;
    };

    Class.mixin = function(self, object) {
      var key, value;
      for (key in object) {
        value = object[key];
        if (__indexOf.call(specialProperties, key) < 0) self[key] = value;
      }
      return object;
    };

    Class.extend = function(object) {
      var extended;
      this.mixin(this, object);
      extended = object.extended;
      if (extended) extended.apply(object);
      return object;
    };

    Class.self = function(object) {
      return this.extend(object);
    };

    Class.include = function(object) {
      var included;
      if (object.hasOwnProperty("ClassMethods")) this.extend(object.ClassMethods);
      if (object.hasOwnProperty("InstanceMethods")) {
        this.include(object.InstanceMethods);
      }
      this.mixin(this.prototype, object);
      included = object.included;
      if (included) included.apply(object);
      return object;
    };

    Class.className = function() {
      return Tower.Support.Object.functionName(this);
    };

    Class.prototype.className = function() {
      return this.constructor.className();
    };

    function Class() {
      this.initialize();
    }

    Class.prototype.initialize = function() {};

    return Class;

  })();

  Tower.Support.EventEmitter = {
    isEventEmitter: true,
    events: function() {
      return this._events || (this._events = {});
    },
    hasEventListener: function(key) {
      return Tower.Support.Object.isPresent(this.events(), key);
    },
    event: function(key) {
      var _base;
      return (_base = this.events())[key] || (_base[key] = new Tower.Event(this, key));
    },
    on: function() {
      var args, eventMap, eventType, handler, options, _results;
      args = Tower.Support.Array.args(arguments);
      if (typeof args[args.length - 1] === "object") {
        options = args.pop();
        if (args.length === 0) {
          eventMap = options;
          options = {};
        }
      } else {
        options = {};
      }
      if (typeof args[args.length - 1] === "object") {
        eventMap = args.pop();
      } else {
        eventMap = {};
        eventMap[args.shift()] = args.shift();
      }
      _results = [];
      for (eventType in eventMap) {
        handler = eventMap[eventType];
        _results.push(this.addEventHandler(eventType, handler, options));
      }
      return _results;
    },
    addEventHandler: function(type, handler, options) {
      return this.event(type).addHandler(handler);
    },
    mutation: function(wrappedFunction) {
      return function() {
        var result;
        result = wrappedFunction.apply(this, arguments);
        this.event('change').fire(this, this);
        return result;
      };
    },
    prevent: function(key) {
      this.event(key).prevent();
      return this;
    },
    allow: function(key) {
      this.event(key).allow();
      return this;
    },
    isPrevented: function(key) {
      return this.event(key).isPrevented();
    },
    fire: function(key) {
      var event;
      event = this.event(key);
      return event.fire.call(event, Tower.Support.Array.args(arguments, 1));
    },
    allowAndFire: function(key) {
      return this.event(key).allowAndFire(Tower.Support.Array.args(arguments, 1));
    }
  };

  Tower.Support.I18n = {
    PATTERN: /(?:%%|%\{(\w+)\}|%<(\w+)>(.*?\d*\.?\d*[bBdiouxXeEfgGcps]))/g,
    defaultLanguage: "en",
    load: function(pathOrObject, language) {
      var store;
      if (language == null) language = this.defaultLanguage;
      store = this.store();
      language = store[language] || (store[language] = {});
      Tower.Support.Object.deepMerge(language, typeof pathOrObject === "string" ? require(pathOrObject) : pathOrObject);
      return this;
    },
    translate: function(key, options) {
      if (options == null) options = {};
      if (options.hasOwnProperty("tense")) key += "." + options.tense;
      if (options.hasOwnProperty("count")) {
        switch (options.count) {
          case 0:
            key += ".none";
            break;
          case 1:
            key += ".one";
            break;
          default:
            key += ".other";
        }
      }
      return this.interpolate(this.lookup(key, options.language), options);
    },
    localize: function() {
      return this.translate.apply(this, arguments);
    },
    lookup: function(key, language) {
      var part, parts, result, _i, _len;
      if (language == null) language = this.defaultLanguage;
      parts = key.split(".");
      result = this.store()[language];
      try {
        for (_i = 0, _len = parts.length; _i < _len; _i++) {
          part = parts[_i];
          result = result[part];
        }
      } catch (error) {
        result = null;
      }
      if (result == null) {
        throw new Error("Translation doesn't exist for '" + key + "'");
      }
      return result;
    },
    store: function() {
      return this._store || (this._store = {});
    },
    interpolate: function(string, locals) {
      if (locals == null) locals = {};
      return string.replace(this.PATTERN, function(match, $1, $2, $3) {
        var key, value;
        if (match === '%%') {
          return '%';
        } else {
          key = $1 || $2;
          if (locals.hasOwnProperty(key)) {
            value = locals[key];
          } else {
            throw new Error("Missing interpolation argument " + key);
          }
          if (typeof value === 'function') value = value.call(locals);
          if ($3) {
            return sprintf("%" + $3, value);
          } else {
            return value;
          }
        }
      });
    }
  };

  Tower.Support.I18n.t = Tower.Support.I18n.translate;

  Tower.Support.Number = {
    isInt: function(n) {
      return n === +n && n === (n | 0);
    },
    isFloat: function(n) {
      return n === +n && n !== (n | 0);
    }
  };

  specialProperties = ['included', 'extended', 'prototype', 'ClassMethods', 'InstanceMethods'];

  Tower.Support.Object = {
    extend: function(object) {
      var args, key, node, value, _i, _len;
      args = Tower.Support.Array.args(arguments, 1);
      for (_i = 0, _len = args.length; _i < _len; _i++) {
        node = args[_i];
        for (key in node) {
          value = node[key];
          if (__indexOf.call(specialProperties, key) < 0) object[key] = value;
        }
      }
      return object;
    },
    cloneHash: function(options) {
      var key, result, value;
      result = {};
      for (key in options) {
        value = options[key];
        if (this.isArray(value)) {
          result[key] = this.cloneArray(value);
        } else if (this.isHash(value)) {
          result[key] = this.cloneHash(value);
        } else {
          result[key] = value;
        }
      }
      return result;
    },
    cloneArray: function(value) {
      var i, item, result, _len;
      result = value.concat();
      for (i = 0, _len = result.length; i < _len; i++) {
        item = result[i];
        if (this.isArray(item)) {
          result[i] = this.cloneArray(item);
        } else if (this.isHash(item)) {
          result[i] = this.cloneHash(item);
        }
      }
      return result;
    },
    deepMerge: function(object) {
      var args, key, node, value, _i, _len;
      args = Tower.Support.Array.args(arguments, 1);
      for (_i = 0, _len = args.length; _i < _len; _i++) {
        node = args[_i];
        for (key in node) {
          value = node[key];
          if (__indexOf.call(specialProperties, key) < 0) {
            if (object[key] && typeof value === 'object') {
              object[key] = Tower.Support.Object.deepMerge(object[key], value);
            } else {
              object[key] = value;
            }
          }
        }
      }
      return object;
    },
    deepMergeWithArrays: function(object) {
      var args, key, node, oldValue, value, _i, _len;
      args = Tower.Support.Array.args(arguments, 1);
      for (_i = 0, _len = args.length; _i < _len; _i++) {
        node = args[_i];
        for (key in node) {
          value = node[key];
          if (!(__indexOf.call(specialProperties, key) < 0)) continue;
          oldValue = object[key];
          if (oldValue) {
            if (this.isArray(oldValue)) {
              object[key] = oldValue.concat(value);
            } else if (typeof oldValue === "object" && typeof value === "object") {
              object[key] = Tower.Support.Object.deepMergeWithArrays(object[key], value);
            } else {
              object[key] = value;
            }
          } else {
            object[key] = value;
          }
        }
      }
      return object;
    },
    defineProperty: function(object, key, options) {
      if (options == null) options = {};
      return Object.defineProperty(object, key, options);
    },
    functionName: function(fn) {
      var _ref;
      if (fn.__name__) return fn.__name__;
      if (fn.name) return fn.name;
      return (_ref = fn.toString().match(/\W*function\s+([\w\$]+)\(/)) != null ? _ref[1] : void 0;
    },
    alias: function(object, to, from) {
      return object[to] = object[from];
    },
    accessor: function(object, key, callback) {
      object._accessors || (object._accessors = []);
      object._accessors.push(key);
      this.getter(key, object, callback);
      this.setter(key, object);
      return this;
    },
    setter: function(object, key) {
      if (!object.hasOwnProperty("_setAttribute")) {
        this.defineProperty(object, "_setAttribute", {
          enumerable: false,
          configurable: true,
          value: function(key, value) {
            return this["_" + key] = value;
          }
        });
      }
      object._setters || (object._setters = []);
      object._setters.push(key);
      this.defineProperty(object, key, {
        enumerable: true,
        configurable: true,
        set: function(value) {
          return this["_setAttribute"](key, value);
        }
      });
      return this;
    },
    getter: function(object, key, callback) {
      if (!object.hasOwnProperty("_getAttribute")) {
        this.defineProperty(object, "_getAttribute", {
          enumerable: false,
          configurable: true,
          value: function(key) {
            return this["_" + key];
          }
        });
      }
      object._getters || (object._getters = []);
      object._getters.push(key);
      this.defineProperty(object, key, {
        enumerable: true,
        configurable: true,
        get: function() {
          return this["_getAttribute"](key) || (callback ? this["_" + key] = callback.apply(this) : void 0);
        }
      });
      return this;
    },
    variables: function(object) {},
    accessors: function(object) {},
    methods: function(object) {
      var key, result, value;
      result = [];
      for (key in object) {
        value = object[key];
        if (this.isFunction(value)) result.push(key);
      }
      return result;
    },
    delegate: function() {
      var isFunction, key, keys, object, options, to, _i, _j, _len;
      object = arguments[0], keys = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), options = arguments[_i++];
      if (options == null) options = {};
      to = options.to;
      isFunction = this.isFunction(object);
      for (_j = 0, _len = keys.length; _j < _len; _j++) {
        key = keys[_j];
        if (isFunction) {
          object[key] = function() {
            var _ref;
            return (_ref = this[to]())[key].apply(_ref, arguments);
          };
        } else {
          this.defineProperty(object, key, {
            enumerable: true,
            configurable: true,
            get: function() {
              return this[to]()[key];
            }
          });
        }
      }
      return object;
    },
    isFunction: function(object) {
      return !!(object && object.constructor && object.call && object.apply);
    },
    toArray: function(object) {
      if (this.isArray(object)) {
        return object;
      } else {
        return [object];
      }
    },
    keys: function(object) {
      return Object.keys(object);
    },
    isA: function(object, isa) {},
    isRegExp: function(object) {
      return !!(object && object.test && object.exec && (object.ignoreCase || object.ignoreCase === false));
    },
    isHash: function(object) {
      return this.isObject(object) && !(this.isFunction(object) || this.isArray(object) || _.isDate(object) || _.isRegExp(object));
    },
    isBaseObject: function(object) {
      return object && object.constructor && object.constructor.name === "Object";
    },
    isArray: Array.isArray || function(object) {
      return toString.call(object) === '[object Array]';
    },
    kind: function(object) {
      var type;
      type = typeof object;
      switch (type) {
        case "object":
          if (_.isArray(object)) return "array";
          if (_.isArguments(object)) return "arguments";
          if (_.isBoolean(object)) return "boolean";
          if (_.isDate(object)) return "date";
          if (_.isRegExp(object)) return "regex";
          if (_.isNaN(object)) return "NaN";
          if (_.isNull(object)) return "null";
          if (_.isUndefined(object)) return "undefined";
          return "object";
        case "number":
          if (object === +object && object === (object | 0)) return "integer";
          if (object === +object && object !== (object | 0)) return "float";
          return "number";
        case "function":
          if (_.isRegExp(object)) return "regex";
          return "function";
        default:
          return type;
      }
    },
    isObject: function(object) {
      return object === Object(object);
    },
    isPresent: function(object) {
      return !this.isBlank(object);
    },
    isBlank: function(object) {
      var key, value;
      if (typeof object === "string") return object === "";
      for (key in object) {
        value = object[key];
        return false;
      }
      return true;
    },
    has: function(object, key) {
      return object.hasOwnProperty(key);
    }
  };

  Tower.Support.RegExp = {
    regexpEscape: function(string) {
      return string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    }
  };

  Tower.Support.String = {
    camelize_rx: /(?:^|_|\-)(.)/g,
    capitalize_rx: /(^|\s)([a-z])/g,
    underscore_rx1: /([A-Z]+)([A-Z][a-z])/g,
    underscore_rx2: /([a-z\d])([A-Z])/g,
    parameterize: function(string) {
      return Tower.Support.String.underscore(string).replace("_", "-");
    },
    constantize: function(string, scope) {
      if (scope == null) scope = global;
      return scope[this.camelize(string)];
    },
    camelize: function(string, firstLetterLower) {
      string = string.replace(this.camelize_rx, function(str, p1) {
        return p1.toUpperCase();
      });
      if (firstLetterLower) {
        return string.substr(0, 1).toLowerCase() + string.substr(1);
      } else {
        return string;
      }
    },
    underscore: function(string) {
      return string.replace(this.underscore_rx1, '$1_$2').replace(this.underscore_rx2, '$1_$2').replace('-', '_').toLowerCase();
    },
    singularize: function(string) {
      var len;
      len = string.length;
      if (string.substr(len - 3) === 'ies') {
        return string.substr(0, len - 3) + 'y';
      } else if (string.substr(len - 1) === 's') {
        return string.substr(0, len - 1);
      } else {
        return string;
      }
    },
    pluralize: function(count, string) {
      var lastLetter, len;
      if (string) {
        if (count === 1) return string;
      } else {
        string = count;
      }
      len = string.length;
      lastLetter = string.substr(len - 1);
      if (lastLetter === 'y') {
        return "" + (string.substr(0, len - 1)) + "ies";
      } else if (lastLetter === 's') {
        return string;
      } else {
        return "" + string + "s";
      }
    },
    capitalize: function(string) {
      return string.replace(this.capitalize_rx, function(m, p1, p2) {
        return p1 + p2.toUpperCase();
      });
    },
    trim: function(string) {
      if (string) {
        return string.trim();
      } else {
        return "";
      }
    },
    interpolate: function(stringOrObject, keys) {
      var key, string, value;
      if (typeof stringOrObject === 'object') {
        string = stringOrObject[keys.count];
        if (!string) string = stringOrObject['other'];
      } else {
        string = stringOrObject;
      }
      for (key in keys) {
        value = keys[key];
        string = string.replace(new RegExp("%\\{" + key + "\\}", "g"), value);
      }
      return string;
    }
  };

  Tower.Support.String.toQueryValue = function(value, negate) {
    var item, items, result, _i, _len;
    if (negate == null) negate = "";
    if (Tower.Support.Object.isArray(value)) {
      items = [];
      for (_i = 0, _len = value.length; _i < _len; _i++) {
        item = value[_i];
        result = negate;
        result += item;
        items.push(result);
      }
      result = items.join(",");
    } else {
      result = negate;
      result += value.toString();
    }
    result = result.replace(" ", "+").replace(/[#%\"\|<>]/g, function(_) {
      return encodeURIComponent(_);
    });
    return result;
  };

  Tower.Support.String.toQuery = function(object, schema) {
    var data, key, negate, param, range, result, set, type, value;
    if (schema == null) schema = {};
    result = [];
    for (key in object) {
      value = object[key];
      param = "" + key + "=";
      type = schema[key] || "string";
      negate = type === "string" ? "-" : "^";
      if (Tower.Support.Object.isHash(value)) {
        data = {};
        if (value.hasOwnProperty(">=")) data.min = value[">="];
        if (value.hasOwnProperty(">")) data.min = value[">"];
        if (value.hasOwnProperty("<=")) data.max = value["<="];
        if (value.hasOwnProperty("<")) data.max = value["<"];
        if (value.hasOwnProperty("=~")) data.match = value["=~"];
        if (value.hasOwnProperty("!~")) data.notMatch = value["!~"];
        if (value.hasOwnProperty("==")) data.eq = value["=="];
        if (value.hasOwnProperty("!=")) data.neq = value["!="];
        data.range = data.hasOwnProperty("min") || data.hasOwnProperty("max");
        set = [];
        if (data.range && !(data.hasOwnProperty("eq") || data.hasOwnProperty("match"))) {
          range = "";
          if (data.hasOwnProperty("min")) {
            range += Tower.Support.String.toQueryValue(data.min);
          } else {
            range += "n";
          }
          range += "..";
          if (data.hasOwnProperty("max")) {
            range += Tower.Support.String.toQueryValue(data.max);
          } else {
            range += "n";
          }
          set.push(range);
        }
        if (data.hasOwnProperty("eq")) {
          set.push(Tower.Support.String.toQueryValue(data.eq));
        }
        if (data.hasOwnProperty("match")) {
          set.push(Tower.Support.String.toQueryValue(data.match));
        }
        if (data.hasOwnProperty("neq")) {
          set.push(Tower.Support.String.toQueryValue(data.neq, negate));
        }
        if (data.hasOwnProperty("notMatch")) {
          set.push(Tower.Support.String.toQueryValue(data.notMatch, negate));
        }
        param += set.join(",");
      } else {
        param += Tower.Support.String.toQueryValue(value);
      }
      result.push(param);
    }
    return result.sort().join("&");
  };

  Tower.Support.String.extractDomain = function(host, tldLength) {
    var parts;
    if (tldLength == null) tldLength = 1;
    if (!this.namedHost(host)) return null;
    parts = host.split('.');
    return parts.slice(0, (parts.length - 1 - 1 + tldLength) + 1 || 9e9).join(".");
  };

  Tower.Support.String.extractSubdomains = function(host, tldLength) {
    var parts;
    if (tldLength == null) tldLength = 1;
    if (!this.namedHost(host)) return [];
    parts = host.split('.');
    return parts.slice(0, -(tldLength + 2) + 1 || 9e9);
  };

  Tower.Support.String.extractSubdomain = function(host, tldLength) {
    if (tldLength == null) tldLength = 1;
    return this.extractSubdomains(host, tldLength).join('.');
  };

  Tower.Support.String.namedHost = function(host) {
    return !!!(host === null || /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.exec(host));
  };

  Tower.Support.String.rewriteAuthentication = function(options) {
    if (options.user && options.password) {
      return "" + (encodeURI(options.user)) + ":" + (encodeURI(options.password)) + "@";
    } else {
      return "";
    }
  };

  Tower.Support.String.hostOrSubdomainAndDomain = function(options) {
    var host, subdomain, tldLength;
    if (options.subdomain === null && options.domain === null) return options.host;
    tldLength = options.tldLength || 1;
    host = "";
    if (options.subdomain !== false) {
      subdomain = options.subdomain || this.extractSubdomain(options.host, tldLength);
      if (subdomain) host += "" + subdomain + ".";
    }
    host += options.domain || this.extractDomain(options.host, tldLength);
    return host;
  };

  Tower.Support.String.urlFor = function(options) {
    var params, path, port, result, schema;
    if (!(options.host || options.onlyPath)) {
      throw new Error('Missing host to link to! Please provide the :host parameter, set defaultUrlOptions[:host], or set :onlyPath to true');
    }
    result = "";
    params = options.params || {};
    path = (options.path || "").replace(/\/+/, "/");
    schema = options.schema || {};
    delete options.path;
    delete options.schema;
    if (!options.onlyPath) {
      port = options.port;
      delete options.port;
      if (options.protocol !== false) {
        result += options.protocol || "http";
        if (!result.match(Tower.Support.RegExp.regexpEscape(":|//"))) {
          result += ":";
        }
      }
      if (!result.match("//")) result += "//";
      result += this.rewriteAuthentication(options);
      result += this.hostOrSubdomainAndDomain(options);
      if (port) result += ":" + port;
    }
    if (options.trailingSlash) {
      result += path.replace(/\/$/, "/");
    } else {
      result += path;
    }
    if (!Tower.Support.Object.isBlank(params)) {
      result += "?" + (Tower.Support.String.toQuery(params, schema));
    }
    if (options.anchor) {
      result += "#" + (Tower.Support.String.toQuery(options.anchor));
    }
    return result;
  };

  Tower.urlFor = function() {
    var args, item, last, options, result, route, _i, _len;
    args = Tower.Support.Array.args(arguments);
    if (!args[0]) return null;
    if (args[0] instanceof Tower.Model || (typeof args[0]).match(/(string|function)/)) {
      last = args[args.length - 1];
      if (last instanceof Tower.Model || (typeof last).match(/(string|function)/)) {
        options = {};
      } else {
        options = args.pop();
      }
    }
    options || (options = args.pop());
    result = "";
    if (options.controller && options.action) {
      route = Tower.Route.find({
        name: Tower.Support.String.camelize(options.controller).replace(/(Controller)?$/, "Controller"),
        action: options.action
      });
      if (route) {
        result = "/" + Tower.Support.String.parameterize(options.controller);
      }
    } else {
      for (_i = 0, _len = args.length; _i < _len; _i++) {
        item = args[_i];
        result += "/";
        if (typeof item === "string") {
          result += item;
        } else if (item instanceof Tower.Model) {
          result += item.toPath();
        } else if (typeof item === "function") {
          result += item.toParam();
        }
      }
    }
    result += (function() {
      switch (options.action) {
        case "new":
          return "/new";
        case "edit":
          return "/edit";
        default:
          return "";
      }
    })();
    if (!options.hasOwnProperty("onlyPath")) options.onlyPath = true;
    options.path = result;
    return Tower.Support.String.urlFor(options);
  };

  Tower.Support.String.parameterize = function(string) {
    return Tower.Support.String.underscore(string).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "-").replace(/^-+|-+$/g, '');
  };

  Tower.Support.Url = {};

  Tower.Support.I18n.load({
    date: {
      formats: {
        "default": "%Y-%m-%d",
        short: "%b %d",
        long: "%B %d, %Y"
      },
      dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      abbrDayNames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      monthNames: [null, "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      abbrMonthNames: [null, "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      order: ["year", "month", "day"]
    }
  });

  ({
    time: {
      formats: {
        "default": "%a, %d %b %Y %H:%M:%S %z",
        short: "%d %b %H:%M",
        long: "%B %d, %Y %H:%M"
      },
      am: "am",
      pm: "pm"
    },
    support: {
      array: {
        wordsConnector: ", ",
        twoWordsConnector: " and ",
        lastWordConnector: ", and "
      }
    }
  });

  Tower.Hook = (function(_super) {

    __extends(Hook, _super);

    function Hook() {
      Hook.__super__.constructor.apply(this, arguments);
    }

    Hook.include(Tower.Support.Callbacks);

    return Hook;

  })(Tower.Class);

  Tower.Engine = (function(_super) {

    __extends(Engine, _super);

    function Engine() {
      Engine.__super__.constructor.apply(this, arguments);
    }

    return Engine;

  })(Tower.Hook);

  Tower.Support.Object.extend(Tower, {
    env: "development",
    port: 3000,
    client: typeof window !== "undefined",
    root: "/",
    publicPath: "/",
    "case": "camelcase",
    namespace: null,
    accessors: typeof window === "undefined",
    logger: typeof _console !== 'undefined' ? _console : console,
    structure: "standard",
    config: {},
    namespaces: {},
    metadata: {},
    metadataFor: function(name) {
      var _base;
      return (_base = this.metadata)[name] || (_base[name] = {});
    },
    callback: function() {
      var _ref;
      return (_ref = Tower.Application).callback.apply(_ref, arguments);
    },
    runCallbacks: function() {
      var _ref;
      return (_ref = Tower.Application.instance()).runCallbacks.apply(_ref, arguments);
    },
    sync: function(method, records, callback) {
      if (callback) return callback(null, records);
    },
    get: function() {
      return Tower.request.apply(Tower, ["get"].concat(__slice.call(arguments)));
    },
    post: function() {
      return Tower.request.apply(Tower, ["post"].concat(__slice.call(arguments)));
    },
    put: function() {
      return Tower.request.apply(Tower, ["put"].concat(__slice.call(arguments)));
    },
    destroy: function() {
      return Tower.request.apply(Tower, ["delete"].concat(__slice.call(arguments)));
    },
    request: function(method, path, options, callback) {
      var location, request, response, url;
      if (typeof options === "function") {
        callback = options;
        options = {};
      }
      options || (options = {});
      url = path;
      location = new Tower.Dispatch.Url(url);
      request = new Tower.Dispatch.Request({
        url: url,
        location: location,
        method: method
      });
      response = new Tower.Dispatch.Response({
        url: url,
        location: location,
        method: method
      });
      request.query = location.params;
      return Tower.Application.instance().handle(request, response, function() {
        return callback.call(this, this.response);
      });
    },
    raise: function() {
      throw new Error(Tower.t.apply(Tower, arguments));
    },
    t: function() {
      var _ref;
      return (_ref = Tower.Support.I18n).translate.apply(_ref, arguments);
    },
    l: function() {
      var _ref;
      return (_ref = Tower.Support.I18n).localize.apply(_ref, arguments);
    },
    stringify: function() {
      var string;
      string = Tower.Support.Array.args(arguments).join("_");
      switch (Tower["case"]) {
        case "snakecase":
          return Tower.Support.String.underscore(string);
        default:
          return Tower.Support.String.camelcase(string);
      }
    },
    namespace: function() {
      return Tower.Application.instance().constructor.name;
    },
    module: function(namespace) {
      var node, part, parts, _i, _len;
      node = Tower.namespaces[namespace];
      if (node) return node;
      parts = namespace.split(".");
      node = Tower;
      for (_i = 0, _len = parts.length; _i < _len; _i++) {
        part = parts[_i];
        node = node[part] || (node[part] = {});
      }
      return Tower.namespaces[namespace] = node;
    },
    constant: function(string) {
      var namespace, node, part, parts, _i, _len;
      node = global;
      parts = string.split(".");
      try {
        for (_i = 0, _len = parts.length; _i < _len; _i++) {
          part = parts[_i];
          node = node[part];
        }
      } catch (error) {
        node = null;
      }
      if (!node) {
        namespace = Tower.namespace();
        if (namespace && parts[0] !== namespace) {
          node = Tower.constant("" + namespace + "." + string);
        } else {
          throw new Error("Constant '" + string + "' wasn't found");
        }
      }
      return node;
    },
    namespaced: function(string) {
      var namespace;
      namespace = Tower.namespace();
      if (namespace) {
        return "" + namespace + "." + string;
      } else {
        return string;
      }
    },
    async: function(array, iterator, callback) {
      var completed, iterate;
      if (!array.length) return callback();
      completed = 0;
      iterate = function() {
        return iterator(array[completed], function(error) {
          if (error) {
            callback(error);
            return callback = function() {};
          } else {
            completed += 1;
            if (completed === array.length) {
              return callback();
            } else {
              return iterate();
            }
          }
        });
      };
      return iterate();
    }
  });

  if (Tower.client) {
    Tower.request = function(method, path, options, callback) {
      var url;
      if (typeof options === "function") {
        callback = options;
        options = {};
      }
      options || (options = {});
      url = path;
      return History.pushState(null, null, url);
    };
  }

  _.mixin(_.string.exports());

  Tower.Application = (function(_super) {

    __extends(Application, _super);

    Application.configure = function(block) {
      return this.initializers().push(block);
    };

    Application.initializers = function() {
      return this._initializers || (this._initializers = []);
    };

    Application.instance = function() {
      return this._instance;
    };

    Application.defaultStack = function() {
      this.use(Tower.Middleware.Location);
      this.use(Tower.Middleware.Router);
      return this.middleware;
    };

    Application.use = function() {
      this.middleware || (this.middleware = []);
      return this.middleware.push(arguments);
    };

    Application.prototype.use = function() {
      var _ref;
      return (_ref = this.constructor).use.apply(_ref, arguments);
    };

    function Application(middlewares) {
      var middleware, _base, _i, _len;
      if (middlewares == null) middlewares = [];
      if (Tower.Application._instance) {
        throw new Error("Already initialized application");
      }
      Tower.Application._instance = this;
      (_base = Tower.Application).middleware || (_base.middleware = []);
      this.io = global["io"];
      this.History = global["History"];
      this.stack = [];
      for (_i = 0, _len = middlewares.length; _i < _len; _i++) {
        middleware = middlewares[_i];
        this.use(middleware);
      }
    }

    Application.prototype.initialize = function() {
      this.extractAgent();
      this.applyMiddleware();
      return this;
    };

    Application.prototype.applyMiddleware = function() {
      var middleware, middlewares, _i, _len, _results;
      middlewares = this.constructor.middleware;
      if (!(middlewares && middlewares.length > 0)) {
        middlewares = this.constructor.defaultStack();
      }
      _results = [];
      for (_i = 0, _len = middlewares.length; _i < _len; _i++) {
        middleware = middlewares[_i];
        _results.push(this.middleware.apply(this, middleware));
      }
      return _results;
    };

    Application.prototype.middleware = function() {
      var args, handle, route;
      args = Tower.Support.Array.args(arguments);
      route = "/";
      handle = args.pop();
      if (typeof route !== "string") {
        handle = route;
        route = "/";
      }
      if ("/" === route[route.length - 1]) {
        route = route.substr(0, route.length - 1);
      }
      this.stack.push({
        route: route,
        handle: handle
      });
      return this;
    };

    Application.prototype.extractAgent = function() {
      Tower.cookies = Tower.Dispatch.Cookies.parse();
      return Tower.agent = new Tower.Dispatch.Agent(JSON.parse(Tower.cookies["user-agent"] || '{}'));
    };

    Application.prototype.listen = function() {
      var self;
      self = this;
      if (this.listening) return;
      this.listening = true;
      if (this.History && this.History.enabled) {
        this.History.Adapter.bind(global, "statechange", function() {
          var location, request, response, state;
          state = History.getState();
          location = new Tower.Dispatch.Url(state.url);
          request = new Tower.Dispatch.Request({
            url: state.url,
            location: location,
            params: Tower.Support.Object.extend({
              title: state.title
            }, state.data || {})
          });
          response = new Tower.Dispatch.Response({
            url: state.url,
            location: location
          });
          return self.handle(request, response);
        });
        return $(global).trigger("statechange");
      } else {
        return console.warn("History not enabled");
      }
    };

    Application.prototype.run = function() {
      return this.listen();
    };

    Application.prototype.handle = function(request, response, out) {
      var env, index, next, removed, stack, writeHead;
      env = Tower.env;
      next = function(err) {
        var arity, c, layer, msg, path, removed;
        layer = void 0;
        path = void 0;
        c = void 0;
        request.url = removed + request.url;
        request.originalUrl = request.originalUrl || request.url;
        removed = "";
        layer = stack[index++];
        if (!layer || response.headerSent) {
          if (out) return out(err);
          if (err) {
            msg = ("production" === env ? "Internal Server Error" : err.stack || err.toString());
            if ("test" !== env) console.error(err.stack || err.toString());
            if (response.headerSent) return request.socket.destroy();
            response.statusCode = 500;
            response.setHeader("Content-Type", "text/plain");
            response.end(msg);
          } else {
            response.statusCode = 404;
            response.setHeader("Content-Type", "text/plain");
            response.end("Cannot " + request.method + " " + request.url);
          }
          return;
        }
        try {
          path = request.location.path;
          if (undefined === path) path = "/";
          if (0 !== path.indexOf(layer.route)) return next(err);
          c = path[layer.route.length];
          if (c && "/" !== c && "." !== c) return next(err);
          removed = layer.route;
          request.url = request.url.substr(removed.length);
          if ("/" !== request.url[0]) request.url = "/" + request.url;
          arity = layer.handle.length;
          if (err) {
            if (arity === 4) {
              return layer.handle(err, request, response, next);
            } else {
              return next(err);
            }
          } else if (arity < 4) {
            return layer.handle(request, response, next);
          } else {
            return next();
          }
        } catch (e) {
          return next(e);
        }
      };
      writeHead = response.writeHead;
      stack = this.stack;
      removed = "";
      index = 0;
      return next();
    };

    return Application;

  })(Tower.Engine);

  Tower.Store = (function(_super) {

    __extends(Store, _super);

    Store.include(Tower.Support.Callbacks);

    Store.defaultLimit = 100;

    Store.isKeyword = function(key) {
      return this.queryOperators.hasOwnProperty(key) || this.atomicModifiers.hasOwnProperty(key);
    };

    Store.hasKeyword = function(object) {
      var key, value;
      if ((function() {
        var _ref, _results;
        _ref = this.queryOperators;
        _results = [];
        for (key in _ref) {
          value = _ref[key];
          _results.push(object.hasOwnProperty(key));
        }
        return _results;
      }).call(this)) {
        return true;
      }
      if ((function() {
        var _ref, _results;
        _ref = this.atomicModifiers;
        _results = [];
        for (key in _ref) {
          value = _ref[key];
          _results.push(object.hasOwnProperty(key));
        }
        return _results;
      }).call(this)) {
        return true;
      }
      return false;
    };

    Store.atomicModifiers = {
      "$set": "$set",
      "$unset": "$unset",
      "$push": "$push",
      "$pushAll": "$pushAll",
      "$pull": "$pull",
      "$pullAll": "$pullAll",
      "$inc": "$inc",
      "$pop": "$pop"
    };

    Store.queryOperators = {
      ">=": "$gte",
      "$gte": "$gte",
      ">": "$gt",
      "$gt": "$gt",
      "<=": "$lte",
      "$lte": "$lte",
      "<": "$lt",
      "$lt": "$lt",
      "$in": "$in",
      "$any": "$in",
      "$nin": "$nin",
      "$all": "$all",
      "=~": "$regex",
      "$m": "$regex",
      "$regex": "$regex",
      "$match": "$regex",
      "$notMatch": "$notMatch",
      "!~": "$nm",
      "$nm": "$nm",
      "=": "$eq",
      "$eq": "$eq",
      "!=": "$neq",
      "$neq": "$neq",
      "$null": "$null",
      "$notNull": "$notNull"
    };

    Store.booleans = {
      "true": true,
      "true": true,
      "TRUE": true,
      "1": true,
      1: true,
      1.0: true,
      "false": false,
      "false": false,
      "FALSE": false,
      "0": false,
      0: false,
      0.0: false
    };

    Store.prototype.serialize = function(data) {
      var i, item, _len;
      for (i = 0, _len = data.length; i < _len; i++) {
        item = data[i];
        data[i] = this.serializeModel(item);
      }
      return data;
    };

    Store.prototype.deserialize = function(models) {
      var i, model, _len;
      for (i = 0, _len = models.length; i < _len; i++) {
        model = models[i];
        models[i] = this.deserializeModel(model);
      }
      return models;
    };

    Store.prototype.serializeModel = function(attributes) {
      var klass;
      if (attributes instanceof Tower.Model) return attributes;
      klass = Tower.constant(this.className);
      return new klass(attributes);
    };

    Store.prototype.deserializeModel = function(data) {
      if (data instanceof Tower.Model) {
        return data.attributes;
      } else {
        return data;
      }
    };

    function Store(options) {
      if (options == null) options = {};
      this.name = options.name;
      this.className = options.type || Tower.namespaced(Tower.Support.String.camelize(Tower.Support.String.singularize(this.name)));
    }

    Store.prototype._defaultOptions = function(options) {
      return options;
    };

    Store.prototype.load = function(records) {};

    Store.prototype.fetch = function() {};

    Store.prototype.schema = function() {
      return Tower.constant(this.className).fields();
    };

    return Store;

  })(Tower.Class);

  Tower.Store.Memory = (function(_super) {

    __extends(Memory, _super);

    Memory.stores = function() {
      return this._stores || (this._stores = []);
    };

    Memory.clear = function() {
      var store, stores, _i, _len;
      stores = this.stores();
      for (_i = 0, _len = stores.length; _i < _len; _i++) {
        store = stores[_i];
        store.clear();
      }
      this._stores.length = 0;
      return this._stores;
    };

    function Memory(options) {
      Memory.__super__.constructor.call(this, options);
      this.initialize();
    }

    Memory.prototype.initialize = function() {
      this.constructor.stores().push(this);
      this.records = {};
      return this.lastId = 0;
    };

    return Memory;

  })(Tower.Store);

  Tower.Store.Memory.Finders = {
    find: function(conditions, options, callback) {
      var key, limit, record, records, result, sort;
      result = [];
      records = this.records;
      if (Tower.Support.Object.isPresent(conditions)) {
        sort = options.sort;
        limit = options.limit || Tower.Store.defaultLimit;
        for (key in records) {
          record = records[key];
          if (this.matches(record, conditions)) result.push(record);
        }
        if (sort) result = this.sort(result, sort);
        if (limit) result = result.slice(0, (limit - 1) + 1 || 9e9);
      } else {
        for (key in records) {
          record = records[key];
          result.push(record);
        }
      }
      if (callback) callback.call(this, null, result);
      return result;
    },
    findOne: function(conditions, options, callback) {
      var record,
        _this = this;
      record = null;
      options.limit = 1;
      this.find(conditions, options, function(error, records) {
        record = records[0] || null;
        if (callback) return callback.call(_this, error, record);
      });
      return record;
    },
    count: function(conditions, options, callback) {
      var result,
        _this = this;
      result = 0;
      this.find(conditions, options, function(error, records) {
        result = records.length;
        if (callback) return callback.call(_this, error, result);
      });
      return result;
    },
    exists: function(conditions, options, callback) {
      var result,
        _this = this;
      result = false;
      this.count(conditions, options, function(error, record) {
        result = !!record;
        if (callback) return callback.call(_this, error, result);
      });
      return result;
    },
    sort: function(records, sortings) {
      var _ref;
      return (_ref = Tower.Support.Array).sortBy.apply(_ref, [records].concat(__slice.call(sortings)));
    },
    matches: function(record, query) {
      var key, recordValue, schema, self, success, value;
      self = this;
      success = true;
      schema = this.schema();
      for (key in query) {
        value = query[key];
        recordValue = record.get(key);
        if (Tower.Support.Object.isRegExp(value)) {
          success = recordValue.match(value);
        } else if (typeof value === "object") {
          success = self._matchesOperators(record, recordValue, value);
        } else {
          if (typeof value === "function") value = value.call(record);
          success = recordValue === value;
        }
        if (!success) return false;
      }
      return true;
    },
    _matchesOperators: function(record, recordValue, operators) {
      var key, operator, self, success, value;
      success = true;
      self = this;
      for (key in operators) {
        value = operators[key];
        if (operator = Tower.Store.queryOperators[key]) {
          if (_.isFunction(value)) value = value.call(record);
          switch (operator) {
            case "$in":
            case "$any":
              success = self._anyIn(recordValue, value);
              break;
            case "$nin":
              success = self._notIn(recordValue, value);
              break;
            case "$gt":
              success = self._isGreaterThan(recordValue, value);
              break;
            case "$gte":
              success = self._isGreaterThanOrEqualTo(recordValue, value);
              break;
            case "$lt":
              success = self._isLessThan(recordValue, value);
              break;
            case "$lte":
              success = self._isLessThanOrEqualTo(recordValue, value);
              break;
            case "$eq":
              success = self._isEqualTo(recordValue, value);
              break;
            case "$neq":
              success = self._isNotEqualTo(recordValue, value);
              break;
            case "$regex":
            case "$match":
              success = self._isMatchOf(recordValue, value);
              break;
            case "$notMatch":
              success = self._isNotMatchOf(recordValue, value);
              break;
            case "$all":
              success = self._allIn(recordValue, value);
          }
          if (!success) return false;
        } else {
          return recordValue === operators;
        }
      }
      return true;
    },
    _isGreaterThan: function(recordValue, value) {
      return recordValue && recordValue > value;
    },
    _isGreaterThanOrEqualTo: function(recordValue, value) {
      return recordValue && recordValue >= value;
    },
    _isLessThan: function(recordValue, value) {
      return recordValue && recordValue < value;
    },
    _isLessThanOrEqualTo: function(recordValue, value) {
      return recordValue && recordValue <= value;
    },
    _isEqualTo: function(recordValue, value) {
      return recordValue === value;
    },
    _isNotEqualTo: function(recordValue, value) {
      return recordValue !== value;
    },
    _isMatchOf: function(recordValue, value) {
      return !!(typeof recordValue === "string" ? recordValue.match(value) : recordValue.exec(value));
    },
    _isNotMatchOf: function(recordValue, value) {
      return !!!(typeof recordValue === "string" ? recordValue.match(value) : recordValue.exec(value));
    },
    _anyIn: function(recordValue, array) {
      var value, _i, _j, _len, _len2;
      if (_.isArray(recordValue)) {
        for (_i = 0, _len = array.length; _i < _len; _i++) {
          value = array[_i];
          if (recordValue.indexOf(value) > -1) return true;
        }
      } else {
        for (_j = 0, _len2 = array.length; _j < _len2; _j++) {
          value = array[_j];
          if (recordValue === value) return true;
        }
      }
      return false;
    },
    _notIn: function(recordValue, array) {
      var value, _i, _j, _len, _len2;
      if (_.isArray(recordValue)) {
        for (_i = 0, _len = array.length; _i < _len; _i++) {
          value = array[_i];
          if (recordValue.indexOf(value) > -1) return false;
        }
      } else {
        for (_j = 0, _len2 = array.length; _j < _len2; _j++) {
          value = array[_j];
          if (recordValue === value) return false;
        }
      }
      return true;
    },
    _allIn: function(recordValue, array) {
      var value, _i, _j, _len, _len2;
      if (_.isArray(recordValue)) {
        for (_i = 0, _len = array.length; _i < _len; _i++) {
          value = array[_i];
          if (recordValue.indexOf(value) === -1) return false;
        }
      } else {
        for (_j = 0, _len2 = array.length; _j < _len2; _j++) {
          value = array[_j];
          if (recordValue !== value) return false;
        }
      }
      return true;
    }
  };

  Tower.Store.Memory.Persistence = {
    load: function(data) {
      var record, records, _i, _len;
      records = Tower.Support.Object.toArray(data);
      for (_i = 0, _len = records.length; _i < _len; _i++) {
        record = records[_i];
        this.loadOne(this.serializeModel(record));
      }
      return records;
    },
    loadOne: function(record) {
      record.persistent = true;
      return this.records[record.get("id").toString()] = record;
    },
    create: function(data, options, callback) {
      var attributes, result, _i, _len;
      result = null;
      if (Tower.Support.Object.isArray(data)) {
        result = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          attributes = data[_i];
          result.push(this.createOne(attributes));
        }
      } else {
        result = this.createOne(data);
      }
      if (callback) callback.call(this, null, result);
      return result;
    },
    createOne: function(record) {
      var attributes;
      attributes = this.deserializeModel(record);
      if (attributes.id == null) attributes.id = this.generateId().toString();
      return this.loadOne(this.serializeModel(record));
    },
    update: function(updates, query, options, callback) {
      var _this = this;
      return this.find(query, options, function(error, records) {
        var record, _i, _len;
        if (error) return callback(error);
        for (_i = 0, _len = records.length; _i < _len; _i++) {
          record = records[_i];
          _this.updateOne(record, updates);
        }
        callback.call(_this, error, records);
        return records;
      });
    },
    updateOne: function(record, updates) {
      var key, value;
      for (key in updates) {
        value = updates[key];
        this._updateAttribute(record.attributes, key, value);
      }
      return record;
    },
    destroy: function(query, options, callback) {
      return this.find(query, options, function(error, records) {
        var record, _i, _len;
        if (error) return callback(error);
        for (_i = 0, _len = records.length; _i < _len; _i++) {
          record = records[_i];
          this.destroyOne(record);
        }
        if (callback) callback.call(this, error, records);
        return records;
      });
    },
    destroyOne: function(record) {
      return delete this.records[record.get("id").toString()];
    }
  };

  Tower.Store.Memory.Serialization = {
    generateId: function() {
      return this.lastId++;
    },
    _updateAttribute: function(attributes, key, value) {
      var field;
      field = this.schema()[key];
      if (field && field.type === "Array" && !Tower.Support.Object.isArray(value)) {
        attributes[key] || (attributes[key] = []);
        return attributes[key].push(value);
      } else if (this._atomicModifier(key)) {
        return this["_" + (key.replace("$", "")) + "AtomicUpdate"](attributes, value);
      } else {
        return attributes[key] = value;
      }
    },
    _atomicModifier: function(key) {
      return !!this.constructor.atomicModifiers[key];
    },
    _pushAtomicUpdate: function(attributes, value) {
      var _key, _value;
      for (_key in value) {
        _value = value[_key];
        attributes[_key] || (attributes[_key] = []);
        attributes[_key].push(_value);
      }
      return attributes;
    },
    _pullAtomicUpdate: function(attributes, value) {
      var item, _attributeValue, _i, _key, _len, _value;
      for (_key in value) {
        _value = value[_key];
        _attributeValue = attributes[_key];
        if (_attributeValue) {
          for (_i = 0, _len = _value.length; _i < _len; _i++) {
            item = _value[_i];
            _attributeValue.splice(_attributeValue.indexOf(item), 1);
          }
        }
      }
      return attributes;
    },
    _incAtomicUpdate: function(attributes, value) {
      var _key, _value;
      for (_key in value) {
        _value = value[_key];
        attributes[_key] || (attributes[_key] = 0);
        attributes[_key] += _value;
      }
      return attributes;
    }
  };

  Tower.Store.Memory.include(Tower.Store.Memory.Finders);

  Tower.Store.Memory.include(Tower.Store.Memory.Persistence);

  Tower.Store.Memory.include(Tower.Store.Memory.Serialization);

  Tower.Store.Ajax = (function(_super) {
    var sync;

    __extends(Ajax, _super);

    Ajax.requests = [];

    Ajax.enabled = true;

    Ajax.pending = false;

    function Ajax() {
      Ajax.__super__.constructor.apply(this, arguments);
      this.deleted = {};
    }

    Ajax.defaults = {
      contentType: 'application/json',
      dataType: 'json',
      processData: false,
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    };

    Ajax.ajax = function(params, defaults) {
      return $.ajax($.extend({}, this.defaults, defaults, params));
    };

    Ajax.toJSON = function(record, format, method) {
      var data;
      data = {};
      data[Tower.Support.String.camelize(record.constructor.name, true)] = record;
      data.format = format;
      data._method = method;
      return JSON.stringify(data);
    };

    Ajax.disable = function(callback) {
      if (this.enabled) {
        this.enabled = false;
        callback();
        return this.enabled = true;
      } else {
        return callback();
      }
    };

    Ajax.requestNext = function() {
      var next;
      next = this.requests.shift();
      if (next) {
        return this.request(next);
      } else {
        return this.pending = false;
      }
    };

    Ajax.request = function(callback) {
      var _this = this;
      return (callback()).complete(function() {
        return _this.requestNext();
      });
    };

    Ajax.queue = function(callback) {
      if (!this.enabled) return;
      if (this.pending) {
        this.requests.push(callback);
      } else {
        this.pending = true;
        this.request(callback);
      }
      return callback;
    };

    Ajax.prototype.success = function(record, options) {
      var _this = this;
      if (options == null) options = {};
      return function(data, status, xhr) {
        var _ref;
        Ajax.disable(function() {
          if (data && !Tower.Support.Object.isBlank(data)) {
            return record.updateAttributes(data, {
              sync: false
            });
          }
        });
        return (_ref = options.success) != null ? _ref.apply(_this.record) : void 0;
      };
    };

    Ajax.prototype.failure = function(record, options) {
      var _this = this;
      if (options == null) options = {};
      return function(xhr, statusText, error) {
        var _ref;
        return (_ref = options.error) != null ? _ref.apply(record) : void 0;
      };
    };

    Ajax.prototype.queue = function(callback) {
      return this.constructor.queue(callback);
    };

    Ajax.prototype.request = function() {
      var _ref;
      return (_ref = this.constructor).request.apply(_ref, arguments);
    };

    Ajax.prototype.ajax = function() {
      var _ref;
      return (_ref = this.constructor).ajax.apply(_ref, arguments);
    };

    Ajax.prototype.toJSON = function() {
      var _ref;
      return (_ref = this.constructor).toJSON.apply(_ref, arguments);
    };

    Ajax.prototype.create = function(data, options, callback) {
      var _this = this;
      if (options.sync !== false) {
        return Ajax.__super__.create.call(this, data, options, function(error, records) {
          if (callback) callback.call(_this, error, records);
          return _this.createRequest(records, options);
        });
      } else {
        return Ajax.__super__.create.apply(this, arguments);
      }
    };

    Ajax.prototype.update = function(updates, query, options, callback) {
      var _this = this;
      if (options.sync === true) {
        return Ajax.__super__.update.call(this, updates, query, options, function(error, result) {
          if (callback) callback.call(_this, error, result);
          return _this.updateRequest(result, options);
        });
      } else {
        return Ajax.__super__.update.apply(this, arguments);
      }
    };

    Ajax.prototype.destroy = function(query, options, callback) {
      var _this = this;
      if (options.sync !== false) {
        return Ajax.__super__.destroy.call(this, query, options, function(error, result) {
          return _this.destroyRequest(result, options);
        });
      } else {
        return Ajax.__super__.destroy.apply(this, arguments);
      }
    };

    Ajax.prototype.createRequest = function(records, options) {
      var json,
        _this = this;
      if (options == null) options = {};
      json = this.toJSON(records);
      Tower.urlFor(records.constructor);
      return this.queue(function() {
        var params;
        params = {
          url: url,
          type: "POST",
          data: json
        };
        return _this.ajax(options, params).success(_this.createSuccess(records)).error(_this.createFailure(records));
      });
    };

    Ajax.prototype.createSuccess = function(record) {
      var _this = this;
      return function(data, status, xhr) {
        var id;
        id = record.id;
        record = _this.find(id);
        _this.records[data.id] = record;
        delete _this.records[id];
        return record.updateAttributes(data);
      };
    };

    Ajax.prototype.createFailure = function(record) {
      return this.failure(record);
    };

    Ajax.prototype.updateRequest = function(record, options, callback) {
      var _this = this;
      return this.queue(function() {
        var params;
        params = {
          type: "PUT",
          data: _this.toJSON(record)
        };
        return _this.ajax({}, params).success(_this.updateSuccess(record)).error(_this.updateFailure(record));
      });
    };

    Ajax.prototype.updateSuccess = function(record) {
      var _this = this;
      return function(data, status, xhr) {
        record = Tower.constant(_this.className).find(record.id);
        return record.updateAttributes(data);
      };
    };

    Ajax.prototype.updateFailure = function(record) {
      var _this = this;
      return function(xhr, statusText, error) {};
    };

    Ajax.prototype.destroyRequest = function(record, options, callback) {
      var _this = this;
      return this.queue(function() {
        var params;
        params = {
          type: "DELETE",
          data: _this.toJSON(record)
        };
        return _this.ajax({}, params).success(_this.destroySuccess(record)).error(_this.destroyFailure(record));
      });
    };

    Ajax.prototype.destroySuccess = function(data) {
      var _this = this;
      return function(data, status, xhr) {
        return delete _this.deleted[data.id];
      };
    };

    Ajax.prototype.destroyFailure = function(record) {
      var _this = this;
      return function(xhr, statusText, error) {};
    };

    Ajax.prototype.findRequest = function(options) {
      var _this = this;
      return this.queue(function() {
        var params;
        params = {
          type: "GET",
          data: _this.toJSON(record)
        };
        return _this.ajax({}, params).success(_this.findSuccess(options)).error(_this.findFailure(options));
      });
    };

    Ajax.prototype.findSuccess = function(options) {
      var _this = this;
      return function(data, status, xhr) {
        if (Tower.Support.Object.isPresent(data)) return _this.load(data);
      };
    };

    Ajax.prototype.findFailure = function(record) {
      var _this = this;
      return function(xhr, statusText, error) {};
    };

    Ajax.prototype.findOneRequest = function(options, callback) {
      var _this = this;
      return this.queue(function() {
        var params;
        params = {
          type: "GET",
          data: _this.toJSON(record)
        };
        return _this.ajax({}, params).success(_this.findSuccess(options)).error(_this.findFailure(options));
      });
    };

    Ajax.prototype.findOneSuccess = function(options) {
      var _this = this;
      return function(data, status, xhr) {};
    };

    Ajax.prototype.findOneFailure = function(options) {
      var _this = this;
      return function(xhr, statusText, error) {};
    };

    sync = function() {
      var _this = this;
      return this.all(function(error, records) {
        var changes, record, _i, _len;
        changes = {
          create: [],
          update: [],
          destroy: []
        };
        for (_i = 0, _len = records.length; _i < _len; _i++) {
          record = records[_i];
          if (record.syncAction) changes[record.syncAction].push(record);
        }
        if (changes.create != null) _this.createRequest(changes.create);
        if (changes.update != null) _this.updateRequest(changes.update);
        if (changes.destroy != null) _this.destroyRequest(changes.destroy);
        return true;
      });
    };

    Ajax.prototype.refresh = function() {};

    Ajax.prototype.fetch = function() {};

    return Ajax;

  })(Tower.Store.Memory);

  Tower.Store.Local = (function(_super) {

    __extends(Local, _super);

    function Local() {
      Local.__super__.constructor.apply(this, arguments);
    }

    Local.prototype.initialize = function() {
      return this.lastId = 0;
    };

    Local.prototype._setRecord = function(record) {};

    Local.prototype._getRecord = function(key) {
      return this;
    };

    Local.prototype._removeRecord = function(key) {
      return delete this.records[record.id];
    };

    return Local;

  })(Tower.Store.Memory);

  Tower.Model = (function(_super) {

    __extends(Model, _super);

    Model.configure = function(object) {
      this.config || (this.config = {});
      if (typeof object === "function") object = object.call(this);
      _.extend(this.config, object);
      return this;
    };

    Model.defaults = function(object) {
      var key, value;
      for (key in object) {
        value = object[key];
        this["default"](key, value);
      }
      return this._defaults;
    };

    Model["default"] = function(key, value) {
      this._defaults || (this._defaults = {});
      return this._defaults[key] = value;
    };

    function Model(attrs, options) {
      this.initialize(attrs, options);
    }

    Model.prototype.initialize = function(attrs, options) {
      var attributes, definition, definitions, key, name, value, _results;
      if (attrs == null) attrs = {};
      if (options == null) options = {};
      definitions = this.constructor.fields();
      attributes = {};
      for (name in definitions) {
        definition = definitions[name];
        if (!attrs.hasOwnProperty(name)) {
          attributes[name] = definition.defaultValue(this);
        }
      }
      this.attributes = attributes;
      this.changes = {};
      this.errors = {};
      this.readOnly = options.hasOwnProperty("readOnly") ? options.readOnly : false;
      this.persistent = options.hasOwnProperty("persistent") ? options.persisted : false;
      _results = [];
      for (key in attrs) {
        value = attrs[key];
        _results.push(this.attributes[key] = value);
      }
      return _results;
    };

    return Model;

  })(Tower.Class);

  Tower.Model.Scope = (function(_super) {

    __extends(Scope, _super);

    function Scope(options) {
      if (options == null) options = {};
      this.model = options.model;
      this.criteria = options.criteria || new Tower.Model.Criteria;
      this.store = this.model.store();
    }

    Scope.prototype.toQuery = function(sortDirection) {
      return this.toCriteria(sortDirection).toQuery();
    };

    Scope.prototype.toCriteria = function(sortDirection) {
      var criteria, sort;
      criteria = this.criteria.clone();
      if (sortDirection || !criteria._order.length > 0) {
        sort = this.model.defaultSort();
        if (sort) criteria[sortDirection || sort.direction](sort.name);
      }
      return criteria;
    };

    Scope.prototype.toCreate = function() {
      return this.toQuery();
    };

    Scope.prototype.toUpdate = function() {
      return this.toQuery();
    };

    Scope.prototype.toDestroy = function() {};

    Scope.prototype.merge = function(scope) {
      return this.criteria.merge(scope.criteria);
    };

    Scope.prototype.clone = function() {
      return new this.constructor({
        model: this.model,
        criteria: this.criteria.clone()
      });
    };

    Scope.prototype._extractArgs = function(args, opts) {
      var callback, criteria, data, ids, last, options;
      if (opts == null) opts = {};
      args = Tower.Support.Array.args(args);
      callback = Tower.Support.Array.extractBlock(args);
      last = args[args.length - 1];
      if (opts.data && (Tower.Support.Object.isHash(last) || Tower.Support.Object.isArray(last))) {
        data = args.pop();
      }
      if (Tower.Support.Object.isHash(args[args.length - 1])) {
        if (data) {
          options = data;
          data = args.pop();
        } else {
          if (Tower.Support.Object.isBaseObject(args[args.length - 1])) {
            options = args.pop();
          }
        }
      }
      if (!opts.data) data = {};
      data || (data = {});
      criteria = this.criteria.clone();
      options || (options = {});
      if (!options.hasOwnProperty("instantiate")) options.instantiate = true;
      if (opts.ids && args.length > 0) ids = _.flatten(args);
      if (ids && ids.length > 0) {
        ids = _.map(ids, function(idOrRecord) {
          if (idOrRecord instanceof Tower.Model) {
            return idOrRecord.get("id");
          } else {
            return idOrRecord;
          }
        });
        criteria.where({
          id: {
            $in: ids
          }
        });
      }
      return {
        criteria: criteria,
        data: data,
        callback: callback,
        options: options
      };
    };

    return Scope;

  })(Tower.Class);

  Tower.Model.Scope.Finders = {
    ClassMethods: {
      finderMethods: ["find", "all", "first", "last", "count", "exists"]
    },
    find: function() {
      var callback, conditions, criteria, options, _ref, _ref2;
      _ref = this._extractArgs(arguments, {
        ids: true
      }), criteria = _ref.criteria, options = _ref.options, callback = _ref.callback;
      _ref2 = criteria.toQuery(), conditions = _ref2.conditions, options = _ref2.options;
      return this._find(conditions, options, callback);
    },
    first: function(callback) {
      var conditions, options, _ref;
      _ref = this.toQuery("asc"), conditions = _ref.conditions, options = _ref.options;
      return this.store.findOne(conditions, options, callback);
    },
    last: function(callback) {
      var conditions, options, _ref;
      _ref = this.toQuery("desc"), conditions = _ref.conditions, options = _ref.options;
      return this.store.findOne(conditions, options, callback);
    },
    all: function(callback) {
      var conditions, options, _ref;
      _ref = this.toQuery(), conditions = _ref.conditions, options = _ref.options;
      return this.store.find(conditions, options, callback);
    },
    count: function(callback) {
      var conditions, options, _ref;
      _ref = this.toQuery(), conditions = _ref.conditions, options = _ref.options;
      return this.store.count(conditions, options, callback);
    },
    exists: function(callback) {
      var conditions, options, _ref;
      _ref = this.toQuery(), conditions = _ref.conditions, options = _ref.options;
      return this.store.exists(conditions, options, callback);
    },
    batch: function() {},
    fetch: function() {},
    _find: function(conditions, options, callback) {
      if (conditions.id && conditions.id.hasOwnProperty("$in") && conditions.id.$in.length === 1) {
        return this.store.findOne(conditions, options, callback);
      } else if (conditions.id && !conditions.id.hasOwnProperty("$in")) {
        conditions.id = {
          $in: Tower.Support.Object.toArray(conditions.id)
        };
        return this.store.findOne(conditions, options, callback);
      } else {
        return this.store.find(conditions, options, callback);
      }
    }
  };

  Tower.Model.Scope.Persistence = {
    ClassMethods: {
      persistenceMethods: ["create", "update", "destroy"]
    },
    build: function(attributes, options) {
      var conditions, _ref;
      _ref = this.toCreate(), conditions = _ref.conditions, options = _ref.options;
      return this._build(attributes, conditions, options);
    },
    create: function() {
      var callback, criteria, data, options, _ref;
      _ref = this._extractArgs(arguments, {
        data: true
      }), criteria = _ref.criteria, data = _ref.data, options = _ref.options, callback = _ref.callback;
      criteria.mergeOptions(options);
      return this._create(criteria, data, options, callback);
    },
    update: function() {
      var callback, criteria, data, options, _ref;
      _ref = this._extractArgs(arguments, {
        ids: true,
        data: true
      }), criteria = _ref.criteria, data = _ref.data, options = _ref.options, callback = _ref.callback;
      criteria.mergeOptions(options);
      return this._update(criteria, data, options, callback);
    },
    destroy: function() {
      var callback, criteria, options, _ref;
      _ref = this._extractArgs(arguments, {
        ids: true
      }), criteria = _ref.criteria, options = _ref.options, callback = _ref.callback;
      criteria.mergeOptions(options);
      return this._destroy(criteria, options, callback);
    },
    sync: function() {},
    transaction: function() {},
    _build: function(attributes, conditions, options) {
      var object, result, _i, _len;
      if (Tower.Support.Object.isArray(attributes)) {
        result = [];
        for (_i = 0, _len = attributes.length; _i < _len; _i++) {
          object = attributes[_i];
          result.push(this.store.serializeModel(Tower.Support.Object.extend({}, conditions, object)));
        }
        return result;
      } else {
        return this.store.serializeModel(Tower.Support.Object.extend({}, conditions, attributes));
      }
    },
    _create: function(criteria, data, opts, callback) {
      var isArray, iterator, records,
        _this = this;
      if (opts.instantiate) {
        isArray = Tower.Support.Object.isArray(data);
        records = Tower.Support.Object.toArray(this.build(data));
        iterator = function(record, next) {
          if (record) {
            return record.save(next);
          } else {
            return next();
          }
        };
        return Tower.async(records, iterator, function(error) {
          if (!callback) {
            if (error) throw error;
          } else {
            if (error) return callback(error);
            if (isArray) {
              return callback(error, records);
            } else {
              return callback(error, records[0]);
            }
          }
        });
      } else {
        return this.store.create(data, opts, callback);
      }
    },
    _update: function(criteria, data, opts, callback) {
      var conditions, iterator, options, _ref;
      _ref = criteria.toQuery(), conditions = _ref.conditions, options = _ref.options;
      if (opts.instantiate) {
        iterator = function(record, next) {
          return record.updateAttributes(data, next);
        };
        return this._each(conditions, options, iterator, callback);
      } else {
        return this.store.update(data, conditions, options, callback);
      }
    },
    _destroy: function(criteria, opts, callback) {
      var conditions, iterator, options, _ref;
      _ref = criteria.toQuery(), conditions = _ref.conditions, options = _ref.options;
      if (opts.instantiate) {
        iterator = function(record, next) {
          return record.destroy(next);
        };
        return this._each(conditions, options, iterator, callback);
      } else {
        return this.store.destroy(conditions, options, callback);
      }
    },
    _each: function(conditions, options, iterator, callback) {
      var _this = this;
      return this.store.find(conditions, options, function(error, records) {
        if (error) {
          return callback.call(_this, error, records);
        } else {
          return Tower.async(records, iterator, function(error) {
            if (!callback) {
              if (error) throw error;
            } else {
              if (callback) return callback.call(_this, error, records);
            }
          });
        }
      });
    }
  };

  Tower.Model.Scope.Queries = {
    ClassMethods: {
      queryMethods: ["where", "order", "asc", "desc", "limit", "offset", "select", "joins", "includes", "excludes", "paginate", "within", "allIn", "allOf", "alsoIn", "anyIn", "anyOf", "near", "notIn"],
      queryOperators: {
        ">=": "$gte",
        "$gte": "$gte",
        ">": "$gt",
        "$gt": "$gt",
        "<=": "$lte",
        "$lte": "$lte",
        "<": "$lt",
        "$lt": "$lt",
        "$in": "$in",
        "$nin": "$nin",
        "$any": "$any",
        "$all": "$all",
        "=~": "$regex",
        "$m": "$regex",
        "$regex": "$regex",
        "$match": "$match",
        "$notMatch": "$notMatch",
        "!~": "$nm",
        "$nm": "$nm",
        "=": "$eq",
        "$eq": "$eq",
        "!=": "$neq",
        "$neq": "$neq",
        "$null": "$null",
        "$notNull": "$notNull"
      }
    }
  };

  Tower.Model.Scope.include(Tower.Model.Scope.Finders);

  Tower.Model.Scope.include(Tower.Model.Scope.Persistence);

  Tower.Model.Scope.include(Tower.Model.Scope.Queries);

  _ref = Tower.Model.Scope.queryMethods;
  _fn = function(key) {
    return Tower.Model.Scope.prototype[key] = function() {
      var clone, _ref2;
      clone = this.clone();
      (_ref2 = clone.criteria)[key].apply(_ref2, arguments);
      return clone;
    };
  };
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    key = _ref[_i];
    _fn(key);
  }

  Tower.Model.Criteria = (function() {

    function Criteria(args) {
      var key, value;
      if (args == null) args = {};
      for (key in args) {
        value = args[key];
        this[key] = value;
      }
      this._where || (this._where = []);
      this._order || (this._order = []);
    }

    Criteria.prototype.where = function(conditions) {
      if (conditions instanceof Tower.Model.Criteria) {
        return this.merge(conditions);
      } else {
        return this._where.push(conditions);
      }
    };

    Criteria.prototype.order = function(attribute, direction) {
      if (direction == null) direction = "asc";
      this._order || (this._order = []);
      return this._order.push([attribute, direction]);
    };

    Criteria.prototype.asc = function() {
      var attribute, attributes, _j, _len2, _results;
      attributes = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      _results = [];
      for (_j = 0, _len2 = attributes.length; _j < _len2; _j++) {
        attribute = attributes[_j];
        _results.push(this.order(attribute));
      }
      return _results;
    };

    Criteria.prototype.desc = function() {
      var attribute, attributes, _j, _len2, _results;
      attributes = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      _results = [];
      for (_j = 0, _len2 = attributes.length; _j < _len2; _j++) {
        attribute = attributes[_j];
        _results.push(this.order(attribute, "desc"));
      }
      return _results;
    };

    Criteria.prototype.allIn = function(attributes) {
      return this._whereOperator("$all", attributes);
    };

    Criteria.prototype.anyIn = function(attributes) {
      return this._whereOperator("$any", attributes);
    };

    Criteria.prototype.notIn = function(attributes) {
      return this._whereOperator("$nin", attributes);
    };

    Criteria.prototype.offset = function(number) {
      return this._offset = number;
    };

    Criteria.prototype.limit = function(number) {
      this._limit = number;
      return this.mergeOptions({
        limit: number
      });
    };

    Criteria.prototype.select = function() {
      return this._fields = Tower.Support.Array.args(arguments);
    };

    Criteria.prototype.includes = function() {
      return this._includes = Tower.Support.Array.args(arguments);
    };

    Criteria.prototype.page = function(number) {
      return this.offset(number);
    };

    Criteria.prototype.paginate = function(options) {
      var limit, page;
      limit = options.perPage || options.limit;
      page = options.page || 1;
      this.limit(limit);
      return this.offset((page - 1) * limit);
    };

    Criteria.prototype.clone = function() {
      return new this.constructor(this.attributes());
    };

    Criteria.prototype.merge = function(criteria) {
      var attributes;
      attributes = criteria.attributes();
      if (attributes._where.length > 0) {
        this._where = this._where.concat(attributes._where);
      }
      if (attributes._order.length > 0) {
        this._order = this._order.concat(attributes._order);
      }
      if (attributes._offset != null) this._offset = attributes._offset;
      if (attributes._limit != null) this._limit = attributes._limit;
      if (attributes._fields) this._fields = attributes._fields;
      if (attributes._offset != null) this._offset = attributes._offset;
      return this;
    };

    Criteria.prototype.options = function() {
      var options;
      options = {};
      if (this._offset != null) options.offset = this._offset;
      if (this._limit != null) options.limit = this._limit;
      if (this._fields) options.fields = this._fields;
      if (this._order.length > 0) options.sort = this._order;
      return options;
    };

    Criteria.prototype.conditions = function() {
      var conditions, result, _j, _len2, _ref2;
      result = {};
      _ref2 = this._where;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        conditions = _ref2[_j];
        Tower.Support.Object.deepMergeWithArrays(result, conditions);
      }
      return result;
    };

    Criteria.prototype.attributes = function(to) {
      if (to == null) to = {};
      to._where = this._where.concat();
      to._order = this._order.concat();
      if (this._offset != null) to._offset = this._offset;
      if (this._limit != null) to._limit = this._limit;
      if (this._fields) to._fields = this._fields;
      if (this._includes) to._includes = this._includes;
      return to;
    };

    Criteria.prototype.toQuery = function() {
      return {
        conditions: this.conditions(),
        options: this.options()
      };
    };

    Criteria.prototype.toUpdate = function() {
      return this.toQuery();
    };

    Criteria.prototype.toCreate = function() {
      var attributes, conditions, key, options, value, _j, _key, _len2, _ref2, _value;
      attributes = {};
      options = {};
      _ref2 = this._where;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        conditions = _ref2[_j];
        for (key in conditions) {
          value = conditions[key];
          if (Tower.Store.isKeyword(key)) {
            for (_key in value) {
              _value = value[_key];
              attributes[_key] = _value;
            }
          } else if (Tower.Support.Object.isHash(value) && Tower.Store.hasKeyword(value)) {
            for (_key in value) {
              _value = value[_key];
              attributes[key] = _value;
            }
          } else {
            attributes[key] = value;
          }
        }
      }
      for (key in attributes) {
        value = attributes[key];
        if (value === void 0) delete attributes[key];
      }
      return {
        attributes: attributes,
        options: options
      };
    };

    Criteria.prototype.mergeOptions = function(options) {
      return options;
    };

    Criteria.prototype._whereOperator = function(operator, attributes) {
      var key, query, value;
      query = {};
      for (key in attributes) {
        value = attributes[key];
        query[key] = {};
        query[key][operator] = value;
      }
      return this.where(query);
    };

    return Criteria;

  })();

  Tower.Model.Dirty = {
    isDirty: function() {
      return Tower.Support.Object.isPresent(this.changes);
    },
    attributeChanged: function(name) {
      var change;
      change = this.changes[name];
      if (!change) return false;
      return change[0] !== change[1];
    },
    attributeChange: function(name) {
      var change;
      change = this.changes[name];
      if (!change) return;
      return change[1];
    },
    attributeWas: function(name) {
      var change;
      change = this.changes[name];
      if (!change) return;
      return change[0];
    },
    resetAttribute: function(name) {
      var array;
      array = this.changes[name];
      if (array) this.set(name, array[0]);
      return this;
    },
    toUpdates: function() {
      var array, attributes, key, result, _ref2;
      result = {};
      attributes = this.attributes;
      _ref2 = this.changes;
      for (key in _ref2) {
        array = _ref2[key];
        result[key] = attributes[key];
      }
      result.updatedAt || (result.updatedAt = new Date);
      return result;
    },
    _attributeChange: function(attribute, value) {
      var array, beforeValue, _base;
      array = (_base = this.changes)[attribute] || (_base[attribute] = []);
      beforeValue = array[0] || (array[0] = this.attributes[attribute]);
      array[1] = value;
      if (array[0] === array[1]) array = null;
      if (array) {
        this.changes[attribute] = array;
      } else {
        delete this.changes[attribute];
      }
      return beforeValue;
    }
  };

  Tower.Model.Conversion = {
    ClassMethods: {
      baseClass: function() {
        if (this.__super__ && this.__super__.constructor.baseClass && this.__super__.constructor !== Tower.Model) {
          return this.__super__.constructor.baseClass();
        } else {
          return this;
        }
      },
      toParam: function() {
        if (this === Tower.Model) return;
        return this.metadata().paramNamePlural;
      },
      toKey: function() {
        return this.metadata().paramName;
      },
      url: function(options) {
        var url;
        return this._url = (function() {
          switch (typeof options) {
            case "object":
              if (options.parent) {
                return url = "/" + (Tower.Support.String.parameterize(Tower.Support.String.pluralize(options.parent))) + "/:" + (Tower.Support.String.camelize(options.parent, true)) + "/" + (this.toParam());
              }
              break;
            default:
              return options;
          }
        }).call(this);
      },
      collectionName: function() {
        return Tower.Support.String.camelize(Tower.Support.String.pluralize(this.name), true);
      },
      resourceName: function() {
        return Tower.Support.String.camelize(this.name, true);
      },
      metadata: function() {
        var className, classNamePlural, controllerName, metadata, modelName, name, namePlural, namespace, paramName, paramNamePlural;
        className = this.name;
        metadata = this.metadata[className];
        if (metadata) return metadata;
        namespace = Tower.namespace();
        name = Tower.Support.String.camelize(className, true);
        namePlural = Tower.Support.String.pluralize(name);
        classNamePlural = Tower.Support.String.pluralize(className);
        paramName = Tower.Support.String.parameterize(name);
        paramNamePlural = Tower.Support.String.parameterize(namePlural);
        modelName = "" + namespace + "." + className;
        controllerName = "" + namespace + "." + classNamePlural + "Controller";
        return this.metadata[className] = {
          name: name,
          namePlural: namePlural,
          className: className,
          classNamePlural: classNamePlural,
          paramName: paramName,
          paramNamePlural: paramNamePlural,
          modelName: modelName,
          controllerName: controllerName
        };
      }
    },
    toLabel: function() {
      return this.className();
    },
    toPath: function() {
      var param, result;
      result = this.constructor.toParam();
      if (result === void 0) return "/";
      param = this.toParam();
      if (param) result += "/" + param;
      return result;
    },
    toParam: function() {
      var id;
      id = this.get("id");
      if (id != null) {
        return String(id);
      } else {
        return null;
      }
    },
    toKey: function() {
      return this.constructor.tokey();
    },
    toCacheKey: function() {},
    toModel: function() {
      return this;
    },
    metadata: function() {
      return this.constructor.metadata();
    }
  };

  Tower.Model.Inheritance = {
    _computeType: function() {}
  };

  Tower.Model.Relation = (function(_super) {

    __extends(Relation, _super);

    function Relation(owner, name, options, callback) {
      var key, value;
      if (options == null) options = {};
      for (key in options) {
        value = options[key];
        this[key] = value;
      }
      this.owner = owner;
      this.name = name;
      this.type = Tower.namespaced(options.type || Tower.Support.String.camelize(Tower.Support.String.singularize(name)));
      this.ownerType = Tower.namespaced(owner.name);
      this.dependent || (this.dependent = false);
      this.counterCache || (this.counterCache = false);
      if (!this.hasOwnProperty("cache")) this.cache = false;
      if (!this.hasOwnProperty("readOnly")) this.readOnly = false;
      if (!this.hasOwnProperty("validate")) this.validate = false;
      if (!this.hasOwnProperty("autoSave")) this.autoSave = false;
      if (!this.hasOwnProperty("touch")) this.touch = false;
      this.inverseOf || (this.inverseOf = void 0);
      this.polymorphic = options.hasOwnProperty("as") || !!options.polymorphic;
      if (!this.hasOwnProperty("default")) this["default"] = false;
      this.singularName = Tower.Support.String.camelize(owner.name, true);
      this.pluralName = Tower.Support.String.pluralize(owner.name);
      this.singularTargetName = Tower.Support.String.singularize(name);
      this.pluralTargetName = Tower.Support.String.pluralize(name);
      this.targetType = this.type;
      if (!this.foreignKey) {
        if (this.as) {
          this.foreignKey = "" + this.as + "Id";
        } else {
          this.foreignKey = "" + this.singularName + "Id";
        }
      }
      if (this.polymorphic) {
        this.foreignType || (this.foreignType = "" + this.as + "Type");
      }
      if (this.cache) {
        if (typeof this.cache === "string") {
          this.cacheKey = this.cache;
          this.cache = true;
        } else {
          this.cacheKey = this.singularTargetName + "Ids";
        }
        this.owner.field(this.cacheKey, {
          type: "Array",
          "default": []
        });
      }
      if (this.counterCache) {
        if (typeof this.counterCache === "string") {
          this.counterCacheKey = this.counterCache;
          this.counterCache = true;
        } else {
          this.counterCacheKey = "" + this.singularTargetName + "Count";
        }
        this.owner.field(this.counterCacheKey, {
          type: "Integer",
          "default": 0
        });
      }
      this.owner.prototype[name] = function() {
        return this.relation(name);
      };
    }

    Relation.prototype.scoped = function(record) {
      return new this.constructor.Scope({
        model: this.klass(),
        owner: record,
        relation: this
      });
    };

    Relation.prototype.targetKlass = function() {
      return Tower.constant(this.targetType);
    };

    Relation.prototype.klass = function() {
      return Tower.constant(this.type);
    };

    Relation.prototype.inverse = function() {
      var name, relation, relations;
      if (this._inverse) return this._inverse;
      relations = this.targetKlass().relations();
      for (name in relations) {
        relation = relations[name];
        if (relation.inverseOf === this.name) return relation;
        if (relation.targetType === this.ownerType) return relation;
      }
      return null;
    };

    Relation.Scope = (function(_super2) {

      __extends(Scope, _super2);

      Scope.prototype.isConstructable = function() {
        return !!!this.relation.polymorphic;
      };

      function Scope(options) {
        if (options == null) options = {};
        Scope.__super__.constructor.call(this, options);
        this.owner = options.owner;
        this.relation = options.relation;
      }

      Scope.prototype.clone = function() {
        return new this.constructor({
          model: this.model,
          criteria: this.criteria.clone(),
          owner: this.owner,
          relation: this.relation
        });
      };

      Scope.prototype.setInverseInstance = function(record) {
        var inverse;
        if (record && this.invertibleFor(record)) {
          inverse = record.relation(this.inverseReflectionFor(record).name);
          return inverse.target = owner;
        }
      };

      Scope.prototype.invertibleFor = function(record) {
        return true;
      };

      Scope.prototype.inverse = function(record) {};

      return Scope;

    })(Tower.Model.Scope);

    return Relation;

  })(Tower.Class);

  Tower.Model.Relation.BelongsTo = (function(_super) {

    __extends(BelongsTo, _super);

    function BelongsTo(owner, name, options) {
      var self;
      if (options == null) options = {};
      BelongsTo.__super__.constructor.call(this, owner, name, options);
      this.foreignKey = "" + name + "Id";
      owner.field(this.foreignKey, {
        type: "Id"
      });
      if (this.polymorphic) {
        this.foreignType = "" + name + "Type";
        owner.field(this.foreignType, {
          type: "String"
        });
      }
      owner.prototype[name] = function(callback) {
        return this.relation(name).first(callback);
      };
      self = this;
      owner.prototype["build" + (Tower.Support.String.camelize(name))] = function(attributes, callback) {
        return this.buildRelation(name, attributes, callback);
      };
      owner.prototype["create" + (Tower.Support.String.camelize(name))] = function(attributes, callback) {
        return this.createRelation(name, attributes, callback);
      };
    }

    BelongsTo.Scope = (function(_super2) {

      __extends(Scope, _super2);

      function Scope() {
        Scope.__super__.constructor.apply(this, arguments);
      }

      return Scope;

    })(BelongsTo.Scope);

    return BelongsTo;

  })(Tower.Model.Relation);

  Tower.Model.Relation.HasMany = (function(_super) {

    __extends(HasMany, _super);

    function HasMany() {
      HasMany.__super__.constructor.apply(this, arguments);
    }

    HasMany.Scope = (function(_super2) {

      __extends(Scope, _super2);

      function Scope() {
        Scope.__super__.constructor.apply(this, arguments);
      }

      Scope.prototype.create = function() {
        var array, attributes, callback, criteria, data, defaults, id, instantiate, inverseRelation, options, relation, _name, _ref2, _ref3,
          _this = this;
        if (!this.owner.isPersisted()) {
          throw new Error("You cannot call create unless the parent is saved");
        }
        relation = this.relation;
        inverseRelation = relation.inverse();
        _ref2 = this._extractArgs(arguments, {
          data: true
        }), criteria = _ref2.criteria, data = _ref2.data, options = _ref2.options, callback = _ref2.callback;
        id = this.owner.get("id");
        if (inverseRelation && inverseRelation.cache) {
          array = data[inverseRelation.cacheKey] || [];
          if (array.indexOf(id) === -1) array.push(id);
          data[inverseRelation.cacheKey] = array;
        } else if (relation.foreignKey) {
          if (id !== void 0) data[relation.foreignKey] = id;
          if (this.relation.foreignType) {
            data[_name = relation.foreignType] || (data[_name] = this.owner.constructor.name);
          }
        }
        criteria.where(data);
        criteria.mergeOptions(options);
        if (inverseRelation && inverseRelation.counterCacheKey) {
          defaults = {};
          defaults[inverseRelation.counterCacheKey] = 1;
          criteria.where(defaults);
        }
        instantiate = options.instantiate !== false;
        _ref3 = criteria.toCreate(), attributes = _ref3.attributes, options = _ref3.options;
        options.instantiate = true;
        return this._create(criteria, attributes, options, function(error, record) {
          var inc, push, updates;
          if (!error) {
            if (relation && (relation.cache || relation.counterCache)) {
              if (relation.cache) {
                push = {};
                push[relation.cacheKey] = record.get("id");
              }
              if (relation.counterCacheKey) {
                inc = {};
                inc[relation.counterCacheKey] = 1;
              }
              updates = {};
              if (push) updates["$push"] = push;
              if (inc) updates["$inc"] = inc;
              return _this.owner.updateAttributes(updates, function(error) {
                if (callback) return callback.call(_this, error, record);
              });
            } else {
              if (callback) return callback.call(_this, error, record);
            }
          } else {
            if (callback) return callback.call(_this, error, record);
          }
        });
      };

      Scope.prototype.update = function() {};

      Scope.prototype.destroy = function() {};

      Scope.prototype.concat = function() {};

      Scope.prototype._serializeAttributes = function(attributes) {
        var name, relation, target, value, _ref2;
        if (attributes == null) attributes = {};
        target = Tower.constant(this.relation.targetClassName);
        _ref2 = target.relations();
        for (name in _ref2) {
          relation = _ref2[name];
          if (attributes.hasOwnProperty(name)) {
            value = attributes[name];
            delete attributes[name];
            if (relation instanceof Tower.Model.Relation.BelongsTo) {
              attributes[relation.foreignKey] = value.id;
              if (relation.polymorphic) {
                attributes[relation.foreignType] = value.type;
              }
            }
          }
        }
        return attributes;
      };

      Scope.prototype.toCriteria = function() {
        var criteria, defaults, relation;
        criteria = Scope.__super__.toCriteria.apply(this, arguments);
        relation = this.relation;
        if (relation.cache) {
          defaults = {};
          defaults[relation.foreignKey + "s"] = {
            $in: [this.owner.get("id")]
          };
          criteria.where(defaults);
        }
        return criteria;
      };

      return Scope;

    })(HasMany.Scope);

    return HasMany;

  })(Tower.Model.Relation);

  Tower.Model.Relation.HasOne = (function(_super) {

    __extends(HasOne, _super);

    function HasOne() {
      HasOne.__super__.constructor.apply(this, arguments);
    }

    return HasOne;

  })(Tower.Model.Relation);

  Tower.Model.Relations = {
    ClassMethods: {
      hasOne: function(name, options) {
        if (options == null) options = {};
        return this.relations()[name] = new Tower.Model.Relation.HasOne(this, name, options);
      },
      hasMany: function(name, options) {
        if (options == null) options = {};
        return this.relations()[name] = new Tower.Model.Relation.HasMany(this, name, options);
      },
      belongsTo: function(name, options) {
        return this.relations()[name] = new Tower.Model.Relation.BelongsTo(this, name, options);
      },
      relations: function() {
        return this._relations || (this._relations = {});
      },
      relation: function(name) {
        var relation;
        relation = this.relations()[name];
        if (!relation) {
          throw new Error("Relation '" + name + "' does not exist on '" + this.name + "'");
        }
        return relation;
      }
    },
    relation: function(name) {
      return this.constructor.relation(name).scoped(this);
    },
    buildRelation: function(name, attributes, callback) {
      return this.relation(name).build(attributes, callback);
    },
    createRelation: function(name, attributes, callback) {
      return this.relation(name).create(attributes, callback);
    },
    destroyRelations: function() {}
  };

  Tower.Model.Attribute = (function() {

    function Attribute(owner, name, options) {
      if (options == null) options = {};
      this.owner = owner;
      this.name = key = name;
      this.type = options.type || "String";
      if (typeof this.type !== "string") this.type = "Array";
      this._default = options["default"];
      this._encode = options.encode;
      this._decode = options.decode;
      if (Tower.accessors) {
        Object.defineProperty(this.owner.prototype, name, {
          enumerable: true,
          configurable: true,
          get: function() {
            return this.get(key);
          },
          set: function(value) {
            return this.set(key, value);
          }
        });
      }
    }

    Attribute.prototype.defaultValue = function(record) {
      var _default;
      _default = this._default;
      if (Tower.Support.Object.isArray(_default)) {
        return _default.concat();
      } else if (Tower.Support.Object.isHash(_default)) {
        return Tower.Support.Object.extend({}, _default);
      } else if (typeof _default === "function") {
        return _default.call(record);
      } else {
        return _default;
      }
    };

    Attribute.prototype.encode = function(value, binding) {
      return this.code(this._encode, value, binding);
    };

    Attribute.prototype.decode = function(value, binding) {
      return this.code(this._decode, value, binding);
    };

    Attribute.prototype.code = function(type, value, binding) {
      switch (type) {
        case "string":
          return binding[type].call(binding[type], value);
        case "function":
          return type.call(_encode, value);
        default:
          return value;
      }
    };

    return Attribute;

  })();

  Tower.Model.Attributes = {
    ClassMethods: {
      field: function(name, options) {
        return this.fields()[name] = new Tower.Model.Attribute(this, name, options);
      },
      fields: function() {
        return this._fields || (this._fields = {});
      }
    },
    get: function(name) {
      var field;
      if (!this.has(name)) {
        field = this.constructor.fields()[name];
        if (field) this.attributes[name] = field.defaultValue(this);
      }
      return this.attributes[name];
    },
    set: function(key, value) {
      var updates, _results;
      if (typeof key === "object") {
        updates = key;
      } else {
        updates = {};
        updates[key] = value;
      }
      _results = [];
      for (key in updates) {
        value = updates[key];
        _results.push(this._set(key, value));
      }
      return _results;
    },
    _set: function(key, value) {
      this._attributeChange(key, value);
      return this.attributes[key] = value;
    },
    assignAttributes: function(attributes) {
      var key, value;
      for (key in attributes) {
        value = attributes[key];
        delete this.changes[key];
        this.attributes[key] = value;
      }
      return this;
    },
    has: function(key) {
      return this.attributes.hasOwnProperty(key);
    }
  };

  Tower.Model.Persistence = {
    ClassMethods: {
      defaultStore: Tower.client ? Tower.Store.Memory : Tower.Store.MongoDB,
      store: function(value) {
        if (!value && this._store) return this._store;
        if (typeof value === "function") {
          this._store = new value({
            name: this.collectionName(),
            type: Tower.namespaced(this.name)
          });
        } else if (typeof value === "object") {
          this._store || (this._store = new this.defaultStore({
            name: this.collectionName(),
            type: Tower.namespaced(this.name)
          }));
          Tower.Support.Object.extend(this._store, value);
        } else if (value) {
          this._store = value;
        }
        this._store || (this._store = new this.defaultStore({
          name: this.collectionName(),
          type: Tower.namespaced(this.name)
        }));
        return this._store;
      },
      load: function(records) {
        return this.store().load(records);
      }
    },
    InstanceMethods: {
      save: function(options, callback) {
        var _this = this;
        if (this.readOnly) throw new Error("Record is read only");
        if (typeof options === "function") {
          callback = options;
          options = {};
        }
        options || (options = {});
        if (options.validate !== false) {
          this.validate(function(error) {
            if (error) {
              if (callback) return callback.call(_this, null, false);
            } else {
              return _this._save(callback);
            }
          });
        } else {
          this._save(callback);
        }
        return this;
      },
      updateAttributes: function(attributes, callback) {
        this.set(attributes);
        return this._update(attributes, callback);
      },
      destroy: function(callback) {
        if (this.isNew()) {
          if (callback) callback.call(this, null);
        } else {
          this._destroy(callback);
        }
        return this;
      },
      "delete": function(callback) {
        return this.destroy(callback);
      },
      isPersisted: function() {
        return !!this.persistent;
      },
      isNew: function() {
        return !!!this.isPersisted();
      },
      reload: function() {},
      store: function() {
        return this.constructor.store();
      },
      _save: function(callback) {
        var _this = this;
        return this.runCallbacks("save", function(block) {
          var complete;
          complete = _this._callback(block, callback);
          if (_this.isNew()) {
            return _this._create(complete);
          } else {
            return _this._update(_this.toUpdates(), complete);
          }
        });
      },
      _create: function(callback) {
        var _this = this;
        this.runCallbacks("create", function(block) {
          var complete;
          complete = _this._callback(block, callback);
          return _this.constructor.create(_this, {
            instantiate: false
          }, function(error) {
            if (error && !callback) throw error;
            if (!error) {
              _this.changes = {};
              _this.persistent = true;
            }
            return complete.call(_this, error);
          });
        });
        return this;
      },
      _update: function(updates, callback) {
        var _this = this;
        this.runCallbacks("update", function(block) {
          var complete;
          complete = _this._callback(block, callback);
          return _this.constructor.update(_this.get("id"), updates, {
            instantiate: false
          }, function(error) {
            if (error && !callback) throw error;
            if (!error) {
              _this.changes = {};
              _this.persistent = true;
            }
            return complete.call(_this, error);
          });
        });
        return this;
      },
      _destroy: function(callback) {
        var _this = this;
        this.runCallbacks("destroy", function(block) {
          var complete;
          complete = _this._callback(block, callback);
          return _this.constructor.destroy(_this, {
            instantiate: false
          }, function(error) {
            if (error && !callback) throw error;
            if (!error) {
              _this.persistent = false;
              _this.changes = {};
              delete _this.attributes.id;
            }
            return complete.call(_this, error);
          });
        });
        return this;
      }
    }
  };

  Tower.Model.Scopes = {
    ClassMethods: {
      scope: function(name, scope) {
        return this[name] = scope instanceof Tower.Model.Scope ? scope : this.where(scope);
      },
      scoped: function() {
        var scope;
        scope = new Tower.Model.Scope({
          model: this
        });
        if (this.baseClass().name !== this.name) {
          scope.where({
            type: this.name
          });
        }
        return scope;
      },
      defaultSort: function(object) {
        if (object) this._defaultSort = object;
        return this._defaultSort || (this._defaultSort = {
          name: "createdAt",
          direction: "desc"
        });
      }
    }
  };

  _ref2 = Tower.Model.Scope.queryMethods;
  _fn2 = function(key) {
    return Tower.Model.Scopes.ClassMethods[key] = function() {
      var _ref3;
      return (_ref3 = this.scoped())[key].apply(_ref3, arguments);
    };
  };
  for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
    key = _ref2[_j];
    _fn2(key);
  }

  _ref3 = Tower.Model.Scope.finderMethods;
  _fn3 = function(key) {
    return Tower.Model.Scopes.ClassMethods[key] = function() {
      var _ref4;
      return (_ref4 = this.scoped())[key].apply(_ref4, arguments);
    };
  };
  for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
    key = _ref3[_k];
    _fn3(key);
  }

  _ref4 = Tower.Model.Scope.persistenceMethods;
  _fn4 = function(key) {
    return Tower.Model.Scopes.ClassMethods[key] = function() {
      var _ref5;
      return (_ref5 = this.scoped())[key].apply(_ref5, arguments);
    };
  };
  for (_l = 0, _len4 = _ref4.length; _l < _len4; _l++) {
    key = _ref4[_l];
    _fn4(key);
  }

  Tower.Model.Serialization = {
    ClassMethods: {
      fromJSON: function(data) {
        var i, record, records, _len5;
        records = JSON.parse(data);
        if (!(records instanceof Array)) records = [records];
        for (i = 0, _len5 = records.length; i < _len5; i++) {
          record = records[i];
          records[i] = new this(record);
        }
        return records;
      },
      toJSON: function(records, options) {
        var record, result, _len5, _m;
        if (options == null) options = {};
        result = [];
        for (_m = 0, _len5 = records.length; _m < _len5; _m++) {
          record = records[_m];
          result.push(record.toJSON());
        }
        return result;
      }
    },
    toJSON: function(options) {
      return this._serializableHash(options);
    },
    clone: function() {
      return new this.constructor(Tower.Support.Object.clone(this.attributes));
    },
    _serializableHash: function(options) {
      var attributeNames, except, i, include, includes, methodNames, methods, name, only, opts, record, records, result, tmp, _len5, _len6, _len7, _len8, _m, _n, _o;
      if (options == null) options = {};
      result = {};
      attributeNames = Tower.Support.Object.keys(this.attributes);
      if (only = options.only) {
        attributeNames = _.union(Tower.Support.Object.toArray(only), attributeNames);
      } else if (except = options.except) {
        attributeNames = _.difference(Tower.Support.Object.toArray(except), attributeNames);
      }
      for (_m = 0, _len5 = attributeNames.length; _m < _len5; _m++) {
        name = attributeNames[_m];
        result[name] = this._readAttributeForSerialization(name);
      }
      if (methods = options.methods) {
        methodNames = Tower.Support.Object.toArray(methods);
        for (_n = 0, _len6 = methods.length; _n < _len6; _n++) {
          name = methods[_n];
          result[name] = this[name]();
        }
      }
      if (includes = options.include) {
        includes = Tower.Support.Object.toArray(includes);
        for (_o = 0, _len7 = includes.length; _o < _len7; _o++) {
          include = includes[_o];
          if (!Tower.Support.Object.isHash(include)) {
            tmp = {};
            tmp[include] = {};
            include = tmp;
            tmp = void 0;
          }
          for (name in include) {
            opts = include[name];
            records = this[name]().all();
            for (i = 0, _len8 = records.length; i < _len8; i++) {
              record = records[i];
              records[i] = record._serializableHash(opts);
            }
            result[name] = records;
          }
        }
      }
      return result;
    },
    _readAttributeForSerialization: function(name, type) {
      if (type == null) type = "json";
      return this.attributes[name];
    }
  };

  Tower.Model.Validator = (function() {

    Validator.create = function(name, value, attributes) {
      switch (name) {
        case "presence":
          return new this.Presence(name, value, attributes);
        case "count":
        case "length":
        case "min":
        case "max":
          return new this.Length(name, value, attributes);
        case "format":
          return new this.Format(name, value, attributes);
      }
    };

    function Validator(name, value, attributes) {
      this.name = name;
      this.value = value;
      this.attributes = attributes;
    }

    Validator.prototype.validateEach = function(record, errors, callback) {
      var iterator,
        _this = this;
      iterator = function(attribute, next) {
        return _this.validate(record, attribute, errors, function(error) {
          return next();
        });
      };
      return Tower.async(this.attributes, iterator, function(error) {
        if (callback) return callback.call(_this, error);
      });
    };

    Validator.prototype.success = function(callback) {
      if (callback) callback.call(this);
      return true;
    };

    Validator.prototype.failure = function(record, attribute, errors, message, callback) {
      errors[attribute] || (errors[attribute] = []);
      errors[attribute].push(message);
      if (callback) callback.call(this, message);
      return false;
    };

    return Validator;

  })();

  Tower.Model.Validator.Format = (function() {

    function Format(value, attributes) {
      Format.__super__.constructor.call(this, value, attributes);
      this.value = typeof value === 'string' ? new RegExp(value) : value;
    }

    Format.prototype.validate = function(record, attribute, errors, callback) {
      var value;
      value = record.get(attribute);
      if (!this.value.exec(value)) {
        return this.failure(record, attribute, errors, Tower.t("model.errors.format", {
          attribute: attribute,
          value: this.value.toString()
        }), callback);
      } else {
        return this.success(callback);
      }
    };

    return Format;

  })();

  Tower.Model.Validator.Length = (function(_super) {

    __extends(Length, _super);

    function Length(name, value, attributes) {
      Length.__super__.constructor.apply(this, arguments);
      this.validate = (function() {
        switch (name) {
          case "min":
            return this.validateMinimum;
          case "max":
            return this.validateMaximum;
          default:
            return this.validateLength;
        }
      }).call(this);
    }

    Length.prototype.validateMinimum = function(record, attribute, errors, callback) {
      var value;
      value = record.get(attribute);
      if (!(typeof value === 'number' && value >= this.value)) {
        return this.failure(record, attribute, errors, Tower.t("model.errors.minimum", {
          attribute: attribute,
          value: this.value
        }), callback);
      }
      return this.success(callback);
    };

    Length.prototype.validateMaximum = function(record, attribute, errors, callback) {
      var value;
      value = record.get(attribute);
      if (!(typeof value === 'number' && value <= this.value)) {
        return this.failure(record, attribute, errors, Tower.t("model.errors.maximum", {
          attribute: attribute,
          value: this.value
        }), callback);
      }
      return this.success(callback);
    };

    Length.prototype.validateLength = function(record, attribute, errors, callback) {
      var value;
      value = record.get(attribute);
      if (!(typeof value === 'number' && value === this.value)) {
        return this.failure(record, attribute, errors, Tower.t("model.errors.length", {
          attribute: attribute,
          value: this.value
        }), callback);
      }
      return this.success(callback);
    };

    return Length;

  })(Tower.Model.Validator);

  Tower.Model.Validator.Presence = (function(_super) {

    __extends(Presence, _super);

    function Presence() {
      Presence.__super__.constructor.apply(this, arguments);
    }

    Presence.prototype.validate = function(record, attribute, errors, callback) {
      if (!Tower.Support.Object.isPresent(record.get(attribute))) {
        return this.failure(record, attribute, errors, Tower.t("model.errors.presence", {
          attribute: attribute
        }), callback);
      }
      return this.success(callback);
    };

    return Presence;

  })(Tower.Model.Validator);

  Tower.Model.Validator.Uniqueness = (function(_super) {

    __extends(Uniqueness, _super);

    function Uniqueness() {
      Uniqueness.__super__.constructor.apply(this, arguments);
    }

    Uniqueness.prototype.validate = function(record, attribute, errors, callback) {
      var conditions, value,
        _this = this;
      value = record.get(attribute);
      conditions = {};
      conditions[attribute] = value;
      return record.constructor.where(conditions).exists(function(error, result) {
        if (result) {
          return _this.failure(record, attribute, errors, Tower.t("model.errors.uniqueness", {
            attribute: attribute,
            value: value
          }), callback);
        } else {
          return _this.success(callback);
        }
      });
    };

    return Uniqueness;

  })(Tower.Model.Validator);

  Tower.Model.Validations = {
    ClassMethods: {
      validates: function() {
        var attributes, key, options, validators, value, _results;
        attributes = Tower.Support.Array.args(arguments);
        options = attributes.pop();
        validators = this.validators();
        _results = [];
        for (key in options) {
          value = options[key];
          _results.push(validators.push(Tower.Model.Validator.create(key, value, attributes)));
        }
        return _results;
      },
      validators: function() {
        return this._validators || (this._validators = []);
      }
    },
    validate: function(callback) {
      var success,
        _this = this;
      success = false;
      this.runCallbacks("validate", function(block) {
        var complete, errors, iterator, validators;
        complete = _this._callback(block, callback);
        validators = _this.constructor.validators();
        errors = _this.errors = {};
        iterator = function(validator, next) {
          return validator.validateEach(_this, errors, next);
        };
        Tower.async(validators, iterator, function(error) {
          if (!(error || Tower.Support.Object.isPresent(errors))) success = true;
          return complete.call(_this, !success);
        });
        return success;
      });
      return success;
    }
  };

  Tower.Model.Timestamp = {
    ClassMethods: {
      timestamps: function() {
        this.include(Tower.Model.Timestamp.CreatedAt);
        this.include(Tower.Model.Timestamp.UpdatedAt);
        this.field("createdAt", {
          type: "Date"
        });
        this.field("updatedAt", {
          type: "Date"
        });
        this.before("create", "setCreatedAt");
        return this.before("save", "setUpdatedAt");
      }
    },
    CreatedAt: {
      ClassMethods: {},
      setCreatedAt: function() {
        return this.set("createdAt", new Date);
      }
    },
    UpdatedAt: {
      ClassMethods: {},
      setUpdatedAt: function() {
        return this.set("updatedAt", new Date);
      }
    }
  };

  Tower.Support.I18n.load({
    model: {
      errors: {
        presence: "%{attribute} can't be blank",
        minimum: "%{attribute} must be a minimum of %{value}",
        maximum: "%{attribute} must be a maximum of %{value}",
        length: "%{attribute} must be equal to %{value}",
        format: "%{attribute} must be match the format %{value}",
        inclusion: "%{attribute} is not included in the list",
        exclusion: "%{attribute} is reserved",
        invalid: "%{attribute} is invalid",
        confirmation: "%{attribute} doesn't match confirmation",
        accepted: "%{attribute} must be accepted",
        empty: "%{attribute} can't be empty",
        blank: "%{attribute} can't be blank",
        tooLong: "%{attribute} is too long (maximum is %{count} characters)",
        tooShort: "%{attribute} is too short (minimum is %{count} characters)",
        wrongLength: "%{attribute} is the wrong length (should be %{count} characters)",
        taken: "%{attribute} has already been taken",
        notANumber: "%{attribute} is not a number",
        greaterThan: "%{attribute} must be greater than %{count}",
        greaterThanOrEqualTo: "%{attribute} must be greater than or equal to %{count}",
        equalTo: "%{attribute} must be equal to %{count}",
        lessThan: "%{attribute} must be less than %{count}",
        lessThanOrEqualTo: "%{attribute} must be less than or equal to %{count}",
        odd: "%{attribute} must be odd",
        even: "%{attribute} must be even",
        recordInvalid: "Validation failed: %{errors}"
      },
      fullMessages: {
        format: "%{message}"
      }
    }
  });

  Tower.Model.include(Tower.Support.Callbacks);

  Tower.Model.include(Tower.Model.Conversion);

  Tower.Model.include(Tower.Model.Dirty);

  Tower.Model.include(Tower.Model.Criteria);

  Tower.Model.include(Tower.Model.Scopes);

  Tower.Model.include(Tower.Model.Persistence);

  Tower.Model.include(Tower.Model.Inheritance);

  Tower.Model.include(Tower.Model.Serialization);

  Tower.Model.include(Tower.Model.Relations);

  Tower.Model.include(Tower.Model.Validations);

  Tower.Model.include(Tower.Model.Attributes);

  Tower.Model.include(Tower.Model.Timestamp);

  Tower.View = (function(_super) {

    __extends(View, _super);

    View.extend({
      cache: {},
      engine: "coffee",
      prettyPrint: false,
      loadPaths: ["app/views"],
      componentSuffix: "widget",
      hintClass: "hint",
      hintTag: "figure",
      labelClass: "control-label",
      requiredClass: "required",
      requiredAbbr: "*",
      requiredTitle: "Required",
      errorClass: "error",
      errorTag: "output",
      validClass: null,
      optionalClass: "optional",
      optionalAbbr: "",
      optionalTitle: "Optional",
      labelMethod: "humanize",
      labelAttribute: "toLabel",
      validationMaxLimit: 255,
      defaultTextFieldSize: null,
      defaultTextAreaWidth: 300,
      allFieldsRequiredByDefault: true,
      fieldListTag: "ol",
      fieldListClass: "fields",
      fieldTag: "li",
      separator: "-",
      breadcrumb: " - ",
      includeBlankForSelectByDefault: true,
      collectionLabelMethods: ["toLabel", "displayName", "fullName", "name", "title", "toString"],
      i18nLookupsByDefault: true,
      escapeHtmlEntitiesInHintsAndLabels: false,
      renameNestedAttributes: true,
      inlineValidations: true,
      autoIdForm: true,
      fieldsetClass: "fieldset",
      fieldClass: "field control-group",
      validateClass: "validate",
      legendClass: "legend",
      formClass: "form",
      idEnabledOn: ["input", "field"],
      widgetsPath: "shared/widgets",
      navClass: "list-item",
      includeAria: true,
      activeClass: "active",
      navTag: "li",
      termsTag: "dl",
      termClass: "term",
      termKeyClass: "key",
      termValueClass: "value",
      hintIsPopup: false,
      listTag: "ul",
      pageHeaderId: "header",
      pageTitleId: "title",
      autoIdNav: false,
      pageSubtitleId: "subtitle",
      widgetClass: "widget",
      headerClass: "header",
      titleClass: "title",
      subtitleClass: "subtitle",
      contentClass: "content",
      defaultHeaderLevel: 3,
      termSeparator: ":",
      richInput: false,
      submitFieldsetClass: "submit-fieldset",
      addLabel: "+",
      removeLabel: "-",
      cycleFields: false,
      alwaysIncludeHintTag: false,
      alwaysIncludeErrorTag: true,
      requireIfValidatesPresence: true,
      localizeWithNamespace: false,
      localizeWithNestedModel: false,
      localizeWithInheritance: true,
      defaultComponentHeaderLevel: 3,
      helpers: [],
      metaTags: ["description", "keywords", "author", "copyright", "category", "robots"],
      store: function(store) {
        if (store) this._store = store;
        return this._store || (this._store = new Tower.Store.Memory({
          name: "view"
        }));
      },
      renderers: {}
    });

    function View(context) {
      if (context == null) context = {};
      this._context = context;
    }

    return View;

  })(Tower.Class);

  Tower.View.Helpers = {
    titleTag: function(title) {
      return "<title>" + title + "</title>";
    },
    metaTag: function(name, content) {
      return "<meta name=\"" + name + "\" content=\"" + content + "\"/>";
    },
    tag: function(name, options) {},
    linkTag: function(title, path, options) {},
    imageTag: function(path, options) {},
    csrfMetaTag: function() {
      return this.metaTag("csrf-token", this.request.session._csrf);
    },
    contentTypeTag: function(type) {
      if (type == null) type = "UTF-8";
      return "<meta charset=\"" + type + "\" />";
    },
    javascriptTag: function(path) {
      return "<script type=\"text/javascript\" src=\"" + path + "\" ></script>";
    },
    stylesheetTag: function(path) {
      return "<link href=\"" + path + "\" media=\"screen\" rel=\"stylesheet\" type=\"text/css\"/>";
    },
    mobileTags: function() {
      return "<meta content='yes' name='apple-mobile-web-app-capable'>\n<meta content='yes' name='apple-touch-fullscreen'>\n<meta content='initial-scale = 1.0, maximum-scale = 1.0, user-scalable = no, width = device-width' name='viewport'>";
    }
  };

  Tower.View.Rendering = {
    render: function(options, callback) {
      var _this = this;
      options.type || (options.type = this.constructor.engine);
      if (!options.hasOwnProperty("layout") && this._context.layout) {
        options.layout = this._context.layout();
      }
      options.locals = this._renderingContext(options);
      return this._renderBody(options, function(error, body) {
        if (error) return callback(error, body);
        return _this._renderLayout(body, options, callback);
      });
    },
    partial: function(path, options, callback) {
      var prefixes, template;
      if (typeof options === "function") {
        callback = options;
        options = {};
      }
      options || (options = {});
      prefixes = options.prefixes;
      if (this._context) prefixes || (prefixes = [this._context.collectionName]);
      template = this._readTemplate(path, prefixes, options.type || Tower.View.engine);
      return this._renderString(template, options, callback);
    },
    _renderBody: function(options, callback) {
      if (options.text) {
        return callback(null, options.text);
      } else if (options.json) {
        return callback(null, typeof options.json === "string" ? options.json : JSON.stringify(options.json));
      } else {
        if (!options.inline) {
          options.template = this._readTemplate(options.template, options.prefixes, options.type);
        }
        return this._renderString(options.template, options, callback);
      }
    },
    _renderLayout: function(body, options, callback) {
      var layout;
      if (options.layout) {
        layout = this._readTemplate("layouts/" + options.layout, [], options.type);
        options.locals.body = body;
        return this._renderString(layout, options, callback);
      } else {
        return callback(null, body);
      }
    },
    _renderString: function(string, options, callback) {
      var coffeekup, e, engine, hardcode, helper, locals, mint, result, _len5, _m, _ref5;
      if (options == null) options = {};
      if (!!options.type.match(/coffee/)) {
        e = null;
        result = null;
        coffeekup = Tower.client ? global.CoffeeKup : require("coffeekup");
        try {
          locals = options.locals;
          locals.renderWithEngine = this.renderWithEngine;
          locals._readTemplate = this._readTemplate;
          locals.cache = Tower.env !== "development";
          locals.format = true;
          hardcode = {};
          _ref5 = Tower.View.helpers;
          for (_m = 0, _len5 = _ref5.length; _m < _len5; _m++) {
            helper = _ref5[_m];
            hardcode = _.extend(hardcode, helper);
          }
          hardcode = _.extend(hardcode, {
            tags: coffeekup.tags
          });
          locals.hardcode = hardcode;
          locals._ = _;
          result = coffeekup.render(string, locals);
        } catch (error) {
          e = error;
        }
        return callback(e, result);
      } else if (options.type) {
        mint = require("mint");
        engine = require("mint").engine(options.type);
        return mint[engine](string, options.locals, callback);
      } else {
        mint = require("mint");
        engine = require("mint");
        options.locals.string = string;
        return engine.render(options.locals, callback);
      }
    },
    _renderingContext: function(options) {
      var key, locals, value;
      locals = this;
      _ref = this._context;
      for (key in _ref) {
        value = _ref[key];
        if (!key.match(/^(constructor|head)/)) locals[key] = value;
      }
      locals = Tower.Support.Object.extend(locals, options.locals);
      if (this.constructor.prettyPrint) locals.pretty = true;
      return locals;
    },
    _readTemplate: function(template, prefixes, ext) {
      var result, _base, _name;
      if (typeof template !== "string") return template;
      result = (_base = this.constructor.cache)[_name = "app/views/" + template] || (_base[_name] = this.constructor.store().find({
        path: template,
        ext: ext,
        prefixes: prefixes
      }));
      if (!result) throw new Error("Template '" + template + "' was not found.");
      return result;
    },
    renderWithEngine: function(template, engine) {
      var mint;
      if (Tower.client) {
        return "(" + template + ").call(this);";
      } else {
        mint = require("mint");
        return mint[mint.engine(engine || "coffee")](template, {}, function(error, result) {
          if (error) return console.log(error);
        });
      }
    }
  };

  Tower.View.Component = (function() {

    Component.render = function() {
      var args, block, options, template;
      args = Tower.Support.Array.args(arguments);
      template = args.shift();
      block = Tower.Support.Array.extractBlock(args);
      if (!(args[args.length - 1] instanceof Tower.Model || typeof args[args.length - 1] !== "object")) {
        options = args.pop();
      }
      options || (options = {});
      options.template = template;
      return (new this(args, options)).render(block);
    };

    function Component(args, options) {
      var key, value;
      for (key in options) {
        value = options[key];
        this[key] = value;
      }
    }

    Component.prototype.tag = function() {
      var args, key;
      key = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      return this.template.tag(key, args);
    };

    Component.prototype.addClass = function(string, args) {
      var arg, result, _len5, _m;
      result = string ? string.split(/\s+/g) : [];
      for (_m = 0, _len5 = args.length; _m < _len5; _m++) {
        arg = args[_m];
        if (!arg) continue;
        if (!(result.indexOf(arg) > -1)) result.push(arg);
      }
      return result.join(" ");
    };

    return Component;

  })();

  Tower.View.Table = (function(_super) {

    __extends(Table, _super);

    function Table(args, options) {
      var aria, data, recordOrKey;
      Table.__super__.constructor.apply(this, arguments);
      recordOrKey = args.shift();
      this.key = this.recordKey(recordOrKey);
      this.rowIndex = 0;
      this.cellIndex = 0;
      this.scope = "table";
      this.headers = [];
      options.summary || (options.summary = "Table for " + (_.titleize(this.key)));
      options.role = "grid";
      options["class"] = this.addClass(options["class"] || "", ["table"]);
      data = options.data || (options.data = {});
      if (options.hasOwnProperty("total")) data.total = options.total;
      if (options.hasOwnProperty("page")) data.page = options.page;
      if (options.hasOwnProperty("count")) data.count = options.count;
      aria = options.aria || {};
      delete options.aria;
      if (!(aria.hasOwnProperty("aria-multiselectable") || options.multiselect === true)) {
        aria["aria-multiselectable"] = false;
      }
      options.id || (options.id = "" + recordOrKey + "-table");
      this.options = {
        summary: options.summary,
        role: options.role,
        data: options.data,
        "class": options["class"]
      };
    }

    Table.prototype.render = function(block) {
      var _this = this;
      return this.tag("table", this.options, function() {
        if (block) block(_this);
        return null;
      });
    };

    Table.prototype.tableQueryRowClass = function() {
      return ["search-row", queryParams.except("page", "sort").blank != null ? null : "search-results"].compact.join(" ");
    };

    Table.prototype.linkToSort = function(title, attribute, options) {
      var sortParam;
      if (options == null) options = {};
      sortParam = sortValue(attribute, oppositeSortDirection(attribute));
      return linkTo(title, withParams(request.path, {
        sort: sortParam
      }), options);
    };

    Table.prototype.nextPagePath = function(collection) {
      return withParams(request.path, {
        page: collection.nextPage
      });
    };

    Table.prototype.prevPagePath = function(collection) {
      return withParams(request.path, {
        page: collection.prevPage
      });
    };

    Table.prototype.firstPagePath = function(collection) {
      return withParams(request.path, {
        page: 1
      });
    };

    Table.prototype.lastPagePath = function(collection) {
      return withParams(request.path, {
        page: collection.lastPage
      });
    };

    Table.prototype.currentPageNum = function() {
      var page;
      page = params.page ? params.page : 1;
      if (page < 1) page = 1;
      return page;
    };

    Table.prototype.caption = function() {};

    Table.prototype.head = function(attributes, block) {
      if (attributes == null) attributes = {};
      this.hideHeader = attributes.visible === false;
      delete attributes.visible;
      return this._section("head", attributes, block);
    };

    Table.prototype.body = function(attributes, block) {
      if (attributes == null) attributes = {};
      return this._section("body", attributes, block);
    };

    Table.prototype.foot = function(attributes, block) {
      if (attributes == null) attributes = {};
      return this._section("foot", attributes, block);
    };

    Table.prototype._section = function(scope, attributes, block) {
      this.rowIndex = 0;
      this.scope = scope;
      this.tag("t" + scope, attributes, block);
      this.rowIndex = 0;
      return this.scope = "table";
    };

    Table.prototype.row = function() {
      var args, attributes, block, _m;
      args = 2 <= arguments.length ? __slice.call(arguments, 0, _m = arguments.length - 1) : (_m = 0, []), block = arguments[_m++];
      attributes = Tower.Support.Array.extractOptions(args);
      attributes.scope = "row";
      if (this.scope === "body") attributes.role = "row";
      this.rowIndex += 1;
      this.cellIndex = 0;
      this.tag("tr", attributes, block);
      return this.cellIndex = 0;
    };

    Table.prototype.column = function() {
      var args, attributes, block, value, _base, _m;
      args = 2 <= arguments.length ? __slice.call(arguments, 0, _m = arguments.length - 1) : (_m = 0, []), block = arguments[_m++];
      attributes = Tower.Support.Array.extractOptions(args);
      value = args.shift();
      if (typeof (_base = Tower.View.idEnabledOn).include === "function" ? _base.include("table") : void 0) {
        attributes.id || (attributes.id = this.idFor("header", key, value, this.rowIndex, this.cellIndex));
      }
      if (attributes.hasOwnProperty("width")) {
        attributes.width = this.pixelate(attributes.width);
      }
      if (attributes.hasOwnProperty("height")) {
        attributes.height = this.pixelate(attributes.height);
      }
      this.headers.push(attributes.id);
      tag("col", attributes);
      return this.cellIndex += 1;
    };

    Table.prototype.header = function() {
      var args, attributes, block, direction, label, sort, value, _base,
        _this = this;
      args = Tower.Support.Array.args(arguments);
      block = Tower.Support.Array.extractBlock(args);
      attributes = Tower.Support.Array.extractOptions(args);
      value = args.shift();
      attributes.abbr || (attributes.abbr = value);
      attributes.role = "columnheader";
      if (typeof (_base = Tower.View.idEnabledOn).include === "function" ? _base.include("table") : void 0) {
        attributes.id || (attributes.id = this.idFor("header", key, value, this.rowIndex, this.cellIndex));
      }
      attributes.scope = "col";
      if (attributes.hasOwnProperty("for")) {
        attributes.abbr || (attributes.abbr = attributes["for"]);
      }
      attributes.abbr || (attributes.abbr = value);
      delete attributes["for"];
      if (attributes.hasOwnProperty("width")) {
        attributes.width = this.pixelate(attributes.width);
      }
      if (attributes.hasOwnProperty("height")) {
        attributes.height = this.pixelate(attributes.height);
      }
      sort = attributes.sort === true;
      delete attributes.sort;
      if (sort) {
        attributes["class"] = this.addClass(attributes["class"] || "", [attributes.sortClass || "sortable"]);
        attributes.direction || (attributes.direction = "asc");
      }
      delete attributes.sortClass;
      label = attributes.label || _.titleize(value.toString());
      delete attributes.label;
      direction = attributes.direction;
      delete attributes.direction;
      if (direction) {
        attributes["aria-sort"] = direction;
        attributes["class"] = [attributes["class"], direction].join(" ");
        attributes["aria-selected"] = true;
      } else {
        attributes["aria-sort"] = "none";
        attributes["aria-selected"] = false;
      }
      this.headers.push(attributes.id);
      if (block) {
        this.tag("th", attributes, block);
      } else {
        if (sort) {
          this.tag("th", attributes, function() {
            return _this.linkToSort(label, value);
          });
        } else {
          this.tag("th", attributes, function() {
            return _this.tag("span", label);
          });
        }
      }
      return this.cellIndex += 1;
    };

    Table.prototype.linkToSort = function(label, value) {
      var direction,
        _this = this;
      direction = "+";
      return this.tag("a", {
        href: "?sort=" + direction
      }, function() {
        return _this.tag("span", label);
      });
    };

    Table.prototype.cell = function() {
      var args, attributes, block, value, _base, _m;
      args = 2 <= arguments.length ? __slice.call(arguments, 0, _m = arguments.length - 1) : (_m = 0, []), block = arguments[_m++];
      attributes = Tower.Support.Array.extractOptions(args);
      value = args.shift();
      attributes.role = "gridcell";
      if (typeof (_base = Tower.View.idEnabledOn).include === "function" ? _base.include("table") : void 0) {
        attributes.id || (attributes.id = this.idFor("cell", key, value, this.rowIndex, this.cellIndex));
      }
      attributes.headers = this.headers[this.cellIndex];
      if (attributes.hasOwnProperty("width")) {
        attributes.width = this.pixelate(attributes.width);
      }
      if (attributes.hasOwnProperty("height")) {
        attributes.height = this.pixelate(attributes.height);
      }
      if (block) {
        this.tag("td", attributes, block);
      } else {
        this.tag("td", value, attributes);
      }
      return this.cellIndex += 1;
    };

    Table.prototype.recordKey = function(recordOrKey) {
      if (typeof recordOrKey === "string") {
        return recordOrKey;
      } else {
        return recordOrKey.constructor.name;
      }
    };

    Table.prototype.idFor = function(type, key, value, row_index, column_index) {
      if (row_index == null) row_index = this.row_index;
      if (column_index == null) column_index = this.column_index;
      [key, type, row_index, column_index].compact.map(function(node) {
        return node.replace(/[\s_]/, "-");
      });
      return end.join("-");
    };

    Table.prototype.pixelate = function(value) {
      if (typeof value === "string") {
        return value;
      } else {
        return "" + value + "px";
      }
    };

    return Table;

  })(Tower.View.Component);

  Tower.View.Form = (function(_super) {

    __extends(Form, _super);

    function Form(args, options) {
      var klass;
      Form.__super__.constructor.apply(this, arguments);
      this.model = args.shift() || new Tower.Model;
      if (typeof this.model === "string") {
        klass = Tower.constant(Tower.Support.String.camelize(this.model));
        this.model = klass ? new klass : null;
      }
      this.attributes = this._extractAttributes(options);
    }

    Form.prototype.render = function(callback) {
      var _this = this;
      return this.tag("form", this.attributes, function() {
        var builder;
        _this.tag("input", {
          type: "hidden",
          name: "_method",
          value: _this.attributes["data-method"]
        });
        if (callback) {
          builder = new Tower.View.Form.Builder([], {
            template: _this.template,
            tabindex: 1,
            accessKeys: {},
            model: _this.model
          });
          return builder.render(callback);
        }
      });
    };

    Form.prototype._extractAttributes = function(options) {
      var attributes, method;
      if (options == null) options = {};
      attributes = options.html || {};
      attributes.action = options.url || Tower.urlFor(this.model);
      if (options.hasOwnProperty("class")) attributes["class"] = options["class"];
      if (options.hasOwnProperty("id")) attributes.id = options.id;
      attributes.id || (attributes.id = Tower.Support.String.parameterize("" + this.model.constructor.name + "-form"));
      if (options.multipart || attributes.multipart === true) {
        attributes.enctype = "multipart/form-data";
      }
      attributes.role = "form";
      attributes.novalidate = "true";
      if (options.hasOwnProperty("validate")) {
        attributes["data-validate"] = options.validate.toString();
      }
      method = attributes.method || options.method;
      if (!method || method === "") {
        if (this.model && this.model.get("id")) {
          method = "put";
        } else {
          method = "post";
        }
      }
      attributes["data-method"] = method;
      attributes.method = method === "get" ? "get" : "post";
      return attributes;
    };

    return Form;

  })(Tower.View.Component);

  Tower.View.Form.Builder = (function(_super) {

    __extends(Builder, _super);

    function Builder(args, options) {
      if (options == null) options = {};
      this.template = options.template;
      this.model = options.model;
      this.attribute = options.attribute;
      this.parentIndex = options.parentIndex;
      this.index = options.index;
      this.tabindex = options.tabindex;
      this.accessKeys = options.accessKeys;
    }

    Builder.prototype.defaultOptions = function(options) {
      if (options == null) options = {};
      options.model || (options.model = this.model);
      options.index || (options.index = this.index);
      options.attribute || (options.attribute = this.attribute);
      options.template || (options.template = this.template);
      return options;
    };

    Builder.prototype.fieldset = function() {
      var args, block, options;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      block = args.pop();
      options = this.defaultOptions(Tower.Support.Array.extractOptions(args));
      options.label || (options.label = args.shift());
      return new Tower.View.Form.Fieldset([], options).render(block);
    };

    Builder.prototype.fields = function() {
      var args, attribute, block, options,
        _this = this;
      args = Tower.Support.Array.args(arguments);
      block = Tower.Support.Array.extractBlock(args);
      options = Tower.Support.Array.extractOptions(args);
      options.as = "fields";
      options.label || (options.label = false);
      attribute = args.shift() || this.attribute;
      return this.field(attribute, options, function(_field) {
        return _this.fieldset(block);
      });
    };

    Builder.prototype.fieldsFor = function() {
      var attrName, attribute, index, keys, macro, options, subObject, subParent;
      options = args.extractOptions;
      attribute = args.shift;
      macro = model.macroFor(attribute);
      attrName = nil;
      if (options.as === "object") {
        attrName = attribute.toS;
      } else {
        attrName = Tower.View.renameNestedAttributes ? "" + attribute + "_attributes" : attribute.toS;
      }
      subParent = model.object;
      subObject = args.shift;
      index = options["delete"]("index");
      if (!((index.present != null) && typeof index === "string")) {
        if ((subObject.blank != null) && (index.present != null)) {
          subObject = subParent.send(attribute)[index];
        } else if ((index.blank != null) && (subObject.present != null) && macro === "hasMany") {
          index = subParent.send(attribute).index(subObject);
        }
      }
      subObject || (subObject = model["default"](attribute) || model.toS.camelize.constantize["new"]);
      keys = [model.keys, attrName];
      options.merge({
        template: template,
        model: model,
        parentIndex: index,
        accessKeys: accessKeys,
        tabindex: tabindex
      });
      return new Tower.View.Form.Builder(options).render(block);
    };

    Builder.prototype.field = function() {
      var args, attributeName, block, defaults, last, options;
      args = Tower.Support.Array.args(arguments);
      last = args[args.length - 1];
      if (last === null || last === void 0) args.pop();
      block = Tower.Support.Array.extractBlock(args);
      options = Tower.Support.Array.extractOptions(args);
      attributeName = args.shift() || "attribute.name";
      defaults = {
        template: this.template,
        model: this.model,
        attribute: attributeName,
        parentIndex: this.parentIndex,
        index: this.index,
        fieldHTML: options.fieldHTML || {},
        inputHTML: options.inputHTML || {},
        labelHTML: options.labelHTML || {},
        errorHTML: options.errorHTML || {},
        hintHtml: options.hintHtml || {}
      };
      return new Tower.View.Form.Field([], _.extend(defaults, options)).render(block);
    };

    Builder.prototype.button = function() {
      var args, block, options;
      args = Tower.Support.Array.args(arguments);
      block = Tower.Support.Array.extractBlock(args);
      options = Tower.Support.Array.extractOptions(args);
      options.as || (options.as = "submit");
      options.value = args.shift() || "Submit";
      if (options.as === "submit") {
        options["class"] = Tower.View.submitFieldsetClass;
      }
      return this.field(options.value, options, block);
    };

    Builder.prototype.submit = Builder.prototype.button;

    Builder.prototype.partial = function(path, options) {
      if (options == null) options = {};
      return this.template.render({
        partial: path,
        locals: options.merge({
          fields: self
        })
      });
    };

    Builder.prototype.tag = function() {
      var args, key;
      key = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      return this.template.tag(key, args);
    };

    Builder.prototype.render = function(block) {
      return block(this);
    };

    return Builder;

  })(Tower.View.Component);

  Tower.View.Form.Field = (function(_super) {

    __extends(Field, _super);

    Field.prototype.addClass = function(string, args) {
      var arg, result, _len5, _m;
      result = string ? string.split(/\s+/g) : [];
      for (_m = 0, _len5 = args.length; _m < _len5; _m++) {
        arg = args[_m];
        if (!arg) continue;
        if (!(result.indexOf(arg) > -1)) result.push(arg);
      }
      return result.join(" ");
    };

    Field.prototype.toId = function(options) {
      var result;
      if (options == null) options = {};
      result = Tower.Support.String.parameterize(this.model.constructor.name);
      if (options.parentIndex) result += "-" + options.parentIndex;
      result += "-" + (Tower.Support.String.parameterize(this.attribute));
      result += "-" + (options.type || "field");
      if (this.index != null) result += "-" + this.index;
      return result;
    };

    Field.prototype.toParam = function(options) {
      var result;
      if (options == null) options = {};
      result = Tower.Support.String.parameterize(this.model.constructor.name);
      if (options.parentIndex) result += "[" + options.parentIndex + "]";
      result += "[" + this.attribute + "]";
      if (this.index != null) result += "[" + this.index + "]";
      return result;
    };

    function Field(args, options) {
      var classes, field, inputType, pattern, value, _base, _base2, _base3, _base4, _base5;
      this.labelValue = options.label;
      delete options.label;
      Field.__super__.constructor.call(this, args, options);
      this.required || (this.required = false);
      field = this.model.constructor.fields()[this.attribute];
      options.as || (options.as = field ? Tower.Support.String.camelize(field.type, true) : "string");
      this.inputType = inputType = options.as;
      this.required = !!(field && field.required === true);
      classes = [Tower.View.fieldClass, inputType];
      if (!(["submit", "fieldset"].indexOf(inputType) > -1)) {
        classes.push(field.required ? Tower.View.requiredClass : Tower.View.optionalClass);
        classes.push(field.errors ? Tower.View.errorClass : Tower.View.validClass);
        if (options.validate !== false && field.validations) {
          classes.push(Tower.View.validateClass);
        }
      }
      this.fieldHTML["class"] = this.addClass(this.fieldHTML["class"], classes);
      if (!this.fieldHTML.id && Tower.View.idEnabledOn.indexOf("field") > -1) {
        this.fieldHTML.id = this.toId({
          type: "field",
          index: this.index,
          parentIndex: this.parentIndex
        });
      }
      this.inputHTML.id = this.toId({
        type: "input",
        index: this.index,
        parentIndex: this.parentIndex
      });
      if (!(["hidden", "submit"].indexOf(inputType) > -1)) {
        (_base = this.labelHTML)["for"] || (_base["for"] = this.inputHTML.id);
        this.labelHTML["class"] = this.addClass(this.labelHTML["class"], [Tower.View.labelClass]);
        if (this.labelValue !== false) {
          this.labelValue || (this.labelValue = Tower.Support.String.camelize(this.attribute.toString()));
        }
        if (options.hint !== false) {
          this.errorHTML["class"] = this.addClass(this.errorHTML["class"], [Tower.View.errorClass]);
          if (Tower.View.includeAria && Tower.View.hintIsPopup) {
            (_base2 = this.errorHTML).role || (_base2.role = "tooltip");
          }
        }
      }
      this.attributes = this.fieldHTML;
      if (inputType !== "submit") {
        (_base3 = this.inputHTML).name || (_base3.name = this.toParam());
      }
      this.value = options.value;
      this.dynamic = options.dynamic === true;
      this.richInput = options.hasOwnProperty("rich_input") ? !!options.rich_input : Tower.View.richInput;
      this.validate = options.validate !== false;
      classes = [inputType, Tower.Support.String.parameterize(this.attribute), this.inputHTML["class"]];
      if (!(["submit", "fieldset"].indexOf(inputType) > -1)) {
        classes.push(field.required ? Tower.View.requiredClass : Tower.View.optionalClass);
        classes.push(field.errors ? Tower.View.errorClass : Tower.View.validClass);
        classes.push("input");
        if (options.validate !== false && field.validations) {
          classes.push(Tower.View.validateClass);
        }
      }
      this.inputHTML["class"] = this.addClass(this.inputHTML["class"], classes);
      if (options.placeholder) this.inputHTML.placeholder = options.placeholder;
      if (this.inputHTML.value == null) {
        if (options.hasOwnProperty("value")) this.inputHTML.value = options.value;
        if (this.inputHTML.value == null) {
          value = this.model.get(this.attribute);
          if (value) this.inputHTML.value = value;
        }
      }
      if (options.hasOwnProperty("max")) {
        (_base4 = this.inputHTML).maxlength || (_base4.maxlength = options.max);
      }
      pattern = options.match;
      if (_.isRegExp(pattern)) pattern = pattern.toString();
      if (pattern != null) this.inputHTML["data-match"] = pattern;
      this.inputHTML["aria-required"] = this.required.toString();
      if (this.required === true) this.inputHTML.required = "true";
      if (this.disabled) this.inputHTML.disabled = "true";
      if (this.autofocus === true) this.inputHTML.autofocus = "true";
      if (this.dynamic) this.inputHTML["data-dynamic"] = "true";
      if (this.inputHTML.placeholder) {
        (_base5 = this.inputHTML).title || (_base5.title = this.inputHTML.placeholder);
      }
      this.autocomplete = this.inputHTML.autocomplete === true;
      if (this.autocomplete && Tower.View.includeAria) {
        this.inputHTML["aria-autocomplete"] = (function() {
          switch (this.autocomplete) {
            case "inline":
            case "list":
            case "both":
              return this.autocomplete;
            default:
              return "both";
          }
        }).call(this);
      }
    }

    Field.prototype.input = function() {
      var args, options;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      options = _.extend(this.inputHTML, Tower.Support.Array.extractOptions(args));
      key = args.shift() || this.attribute;
      return this["" + this.inputType + "Input"](key, options);
    };

    Field.prototype.checkboxInput = function(key, options) {
      return this.tag("input", _.extend({
        type: "checkbox"
      }, options));
    };

    Field.prototype.stringInput = function(key, options) {
      return this.tag("input", _.extend({
        type: "text"
      }, options));
    };

    Field.prototype.submitInput = function(key, options) {
      var value;
      value = options.value;
      delete options.value;
      return this.tag("button", _.extend({
        type: "submit"
      }, options), value);
    };

    Field.prototype.fileInput = function(key, options) {
      return this.tag("input", _.extend({
        type: "file"
      }, options));
    };

    Field.prototype.textInput = function(key, options) {
      var value;
      value = options.value;
      delete options.value;
      return this.tag("textarea", options, value);
    };

    Field.prototype.passwordInput = function(key, options) {
      return this.tag("input", _.extend({
        type: "password"
      }, options));
    };

    Field.prototype.emailInput = function(key, options) {
      return this.tag("input", _.extend({
        type: "email"
      }, options));
    };

    Field.prototype.urlInput = function(key, options) {
      return this.tag("input", _.extend({
        type: "url"
      }, options));
    };

    Field.prototype.numberInput = function(key, options) {
      return this.tag("input", _.extend({
        type: "string",
        "data-type": "numeric"
      }, options));
    };

    Field.prototype.searchInput = function(key, options) {
      return this.tag("input", _.extend({
        type: "search",
        "data-type": "search"
      }, options));
    };

    Field.prototype.phoneInput = function(key, options) {
      return this.tag("input", _.extend({
        type: "tel",
        "data-type": "phone"
      }, options));
    };

    Field.prototype.arrayInput = function(key, options) {
      if (options.value) {
        options.value = Tower.Support.Object.toArray(options.value).join(", ");
      }
      return this.tag("input", _.extend({
        "data-type": "array"
      }, options));
    };

    Field.prototype.label = function() {
      var _this = this;
      if (!this.labelValue) return;
      return this.tag("label", this.labelHTML, function() {
        _this.tag("span", _this.labelValue);
        if (_this.required) {
          return _this.tag("abbr", {
            title: Tower.View.requiredTitle,
            "class": Tower.View.requiredClass
          }, function() {
            return Tower.View.requiredAbbr;
          });
        } else {
          return _this.tag("abbr", {
            title: Tower.View.optionalTitle,
            "class": Tower.View.optionalClass
          }, function() {
            return Tower.View.optionalAbbr;
          });
        }
      });
    };

    Field.prototype.render = function(block) {
      var _this = this;
      return this.tag(Tower.View.fieldTag, this.attributes, function() {
        if (block) {
          return block.call(_this);
        } else {
          _this.label();
          if (_this.inputType === "submit") {
            return _this.input();
          } else {
            return _this.tag("div", {
              "class": "controls"
            }, function() {
              return _this.input();
            });
          }
        }
      });
    };

    Field.prototype.extractElements = function(options) {
      var elements, _base;
      if (options == null) options = {};
      elements = [];
      if (typeof (_base = ["hidden", "submit"]).include === "function" ? _base.include(inputType) : void 0) {
        elements.push("inputs");
      } else {
        if ((this.label.present != null) && (this.label.value != null)) {
          elements.push("label");
        }
        elements = elements.concat(["inputs", "hints", "errors"]);
      }
      return elements;
    };

    return Field;

  })(Tower.View.Component);

  Tower.View.Form.Fieldset = (function(_super) {

    __extends(Fieldset, _super);

    function Fieldset(args, options) {
      var attributes;
      Fieldset.__super__.constructor.apply(this, arguments);
      this.attributes = attributes = {};
      delete attributes.index;
      delete attributes.parentIndex;
      delete attributes.label;
      this.builder = new Tower.View.Form.Builder([], {
        template: this.template,
        model: this.model,
        attribute: this.attribute,
        index: this.index,
        parentIndex: this.parentIndex
      });
    }

    Fieldset.prototype.render = function(block) {
      var _this = this;
      return this.tag("fieldset", this.attributes, function() {
        if (_this.label) {
          _this.tag("legend", {
            "class": Tower.View.legendClass
          }, function() {
            return _this.tag("span", _this.label);
          });
        }
        return _this.tag(Tower.View.fieldListTag, {
          "class": Tower.View.fieldListClass
        }, function() {
          return _this.builder.render(block);
        });
      });
    };

    return Fieldset;

  })(Tower.View.Component);

  Tower.View.AssetHelper = {
    javascripts: function() {
      var options, path, paths, sources, _len5, _m;
      sources = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      options = Tower.Support.Array.extractOptions(sources);
      options.namespace = "javascripts";
      options.extension = "js";
      paths = _extractAssetPaths(sources, options);
      for (_m = 0, _len5 = paths.length; _m < _len5; _m++) {
        path = paths[_m];
        javascriptTag(path);
      }
      return null;
    },
    javascript: function() {
      return javascript.apply(this, arguments);
    },
    stylesheets: function() {
      var options, path, paths, sources, _len5, _m;
      sources = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      options = Tower.Support.Array.extractOptions(sources);
      options.namespace = "stylesheets";
      options.extension = "css";
      paths = _extractAssetPaths(sources, options);
      for (_m = 0, _len5 = paths.length; _m < _len5; _m++) {
        path = paths[_m];
        stylesheetTag(path);
      }
      return null;
    },
    stylesheet: function() {
      return stylesheets.apply(this, arguments);
    },
    _extractAssetPaths: function(sources, options) {
      var extension, manifest, namespace, path, paths, result, source, _len5, _len6, _len7, _m, _n, _o;
      if (options == null) options = {};
      namespace = options.namespace;
      extension = options.extension;
      result = [];
      if (Tower.env === "production") {
        manifest = Tower.assetManifest;
        for (_m = 0, _len5 = sources.length; _m < _len5; _m++) {
          source = sources[_m];
          if (!source.match(/^(http|\/{2})/)) {
            source = "" + source + "." + extension;
            if (manifest[source]) source = manifest[source];
            source = "/assets/" + source;
            if (Tower.assetHost) source = "" + Tower.assetHost + source;
          }
          result.push(source);
        }
      } else {
        for (_n = 0, _len6 = sources.length; _n < _len6; _n++) {
          source = sources[_n];
          if (!!source.match(/^(http|\/{2})/)) {
            result.push(source);
          } else {
            paths = Tower.config.assets[namespace][source];
            if (paths) {
              for (_o = 0, _len7 = paths.length; _o < _len7; _o++) {
                path = paths[_o];
                result.push("/" + namespace + path + "." + extension);
              }
            }
          }
        }
      }
      return result;
    },
    stylesheetTag: function(source) {
      return link({
        rel: 'stylesheet',
        href: source
      });
    },
    javascriptTag: function(source) {
      return script({
        src: source
      });
    }
  };

  Tower.View.ComponentHelper = {
    formFor: function() {
      var _ref5;
      return (_ref5 = Tower.View.Form).render.apply(_ref5, [__ck].concat(__slice.call(arguments)));
    },
    tableFor: function() {
      var _ref5;
      return (_ref5 = Tower.View.Table).render.apply(_ref5, [__ck].concat(__slice.call(arguments)));
    },
    widget: function() {},
    linkTo: function(title, path, options) {
      if (options == null) options = {};
      return a(_.extend(options, {
        href: path,
        title: title
      }), title.toString());
    },
    navItem: function(title, path, options) {
      if (options == null) options = {};
      return li(function() {
        return linkTo(title, path, options);
      });
    }
  };

  Tower.View.ElementHelper = {
    title: function(value) {
      return document.title = value;
    },
    addClass: function() {
      var classes, part, parts, string, _len5, _m;
      string = arguments[0], parts = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      classes = string.split(/\ +/);
      for (_m = 0, _len5 = parts.length; _m < _len5; _m++) {
        part = parts[_m];
        if (classes.indexOf(part) > -1) classes.push(part);
      }
      return classes.join(" ");
    },
    elementId: function() {
      return "#" + (this.elementKey.apply(this, arguments));
    },
    elementClass: function() {
      return "." + (this.elementKey.apply(this, arguments));
    },
    elementKey: function() {
      return Tower.Support.String.parameterize(this.elementNameComponents.apply(this, arguments).join("-"));
    },
    elementName: function() {
      var i, item, result, _len5;
      result = this.elementNameComponents.apply(this, arguments);
      i = 1;
      for (i = 0, _len5 = result.length; i < _len5; i++) {
        item = result[i];
        result[i] = "[" + item + "]";
      }
      return Tower.Support.String.parameterize(result.join(""));
    },
    elementNameComponents: function() {
      var args, item, result, _len5, _m;
      args = Tower.Support.Array.args(arguments);
      result = [];
      for (_m = 0, _len5 = args.length; _m < _len5; _m++) {
        item = args[_m];
        switch (typeof item) {
          case "function":
            result.push(item.constructor.name);
            break;
          case "string":
            result.push(item);
            break;
          default:
            result.push(item.toString());
        }
      }
      return result;
    }
  };

  Tower.View.HeadHelper = {
    metaTag: function(name, content) {
      return meta({
        name: name,
        content: content
      });
    },
    snapshotLinkTag: function(href) {
      return linkTag({
        rel: "imageSrc",
        href: href
      });
    },
    html4ContentTypeTag: function(charset, type) {
      if (charset == null) charset = "UTF-8";
      if (type == null) type = "text/html";
      return httpMetaTag("Content-Type", "" + type + "; charset=" + charset);
    },
    chromeFrameTag: function() {
      html4ContentTypeTag();
      return meta({
        "http-equiv": "X-UA-Compatible",
        content: "IE=Edge,chrome=1"
      });
    },
    html5ContentTypeTag: function(charset) {
      if (charset == null) charset = "UTF-8";
      return meta({
        charset: charset
      });
    },
    contentTypeTag: function(charset) {
      return html5ContentTypeTag(charset);
    },
    csrfMetaTag: function() {
      return metaTag("csrf-token", this.request.session._csrf);
    },
    searchLinkTag: function(href, title) {
      return linkTag({
        rel: "search",
        type: "application/opensearchdescription+xml",
        href: href,
        title: title
      });
    },
    faviconLinkTag: function(favicon) {
      if (favicon == null) favicon = "/favicon.ico";
      return linkTag({
        rel: "shortcut icon",
        href: favicon,
        type: "image/x-icon"
      });
    },
    linkTag: function(options) {
      if (options == null) options = {};
      return link(options);
    },
    ieApplicationMetaTags: function(title, options) {
      var result;
      if (options == null) options = {};
      result = [];
      result.push(metaTag("application-name", title));
      if (options.hasOwnProperty("tooltip")) {
        result.push(metaTag("msapplication-tooltip", options.tooltip));
      }
      if (options.hasOwnProperty("url")) {
        result.push(metaTag("msapplication-starturl", options.url));
      }
      if (options.hasOwnProperty("width") && options.hasOwnProperty("height")) {
        result.push(metaTag("msapplication-window", "width=" + options.width + ";height=" + options.height));
        if (options.hasOwnProperty("color")) {
          result.push(metaTag("msapplication-navbutton-color", options.color));
        }
      }
      return result.join("\n");
    },
    ieTaskMetaTag: function(name, path, icon) {
      var content;
      if (icon == null) icon = null;
      content = [];
      content.push("name=" + name);
      content.push("uri=" + path);
      if (icon) content.push("icon-uri=" + icon);
      return this.metaTag("msapplication-task", content.join(";"));
    },
    appleMetaTags: function(options) {
      var result;
      if (options == null) options = {};
      result = [];
      result.push(appleViewportMetaTag(options));
      if (options.hasOwnProperty("fullScreen")) {
        result.push(appleFullScreenMetaTag(options.fullScreen));
      }
      if (options.hasOwnProperty("mobile")) {
        result.push(appleMobileCompatibleMetaTag(options.mobile));
      }
      return result.join();
    },
    appleViewportMetaTag: function(options) {
      var viewport;
      if (options == null) options = {};
      viewport = [];
      if (options.hasOwnProperty("width")) viewport.push("width=" + options.width);
      if (options.hasOwnProperty("height")) {
        viewport.push("height=" + options.height);
      }
      viewport.push("initial-scale=" + (options.scale || 1.0));
      if (options.hasOwnProperty("min")) {
        viewport.push("minimum-scale=" + options.min);
      }
      if (options.hasOwnProperty("max")) {
        viewport.push("maximum-scale=" + options.max);
      }
      if (options.hasOwnProperty("scalable")) {
        viewport.push("user-scalable=" + (boolean(options.scalable)));
      }
      return metaTag("viewport", viewport.join(", "));
    },
    appleFullScreenMetaTag: function(value) {
      return metaTag("apple-touch-fullscreen", boolean(value));
    },
    appleMobileCompatibleMetaTag: function(value) {
      return metaTag("apple-mobile-web-app-capable", boolean(value));
    },
    appleTouchIconLinkTag: function(path, options) {
      var rel;
      if (options == null) options = {};
      rel = ["apple-touch-icon"];
      if (options.hasOwnProperty("size")) {
        rel.push("" + options.size + "x" + options.size);
      }
      if (options.precomposed) rel.push("precomposed");
      return linkTag({
        rel: rel.join("-"),
        href: path
      });
    },
    appleTouchIconLinkTags: function() {
      var options, path, result, size, sizes, _len5, _m;
      path = arguments[0], sizes = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (typeof sizes[sizes.length - 1] === "object") {
        options = sizes.pop();
      } else {
        options = {};
      }
      result = [];
      for (_m = 0, _len5 = sizes.length; _m < _len5; _m++) {
        size = sizes[_m];
        result.push(appleTouchIconLinkTag(path, _.extend({
          size: size
        }, options)));
      }
      return result.join();
    },
    openGraphMetaTags: function(options) {
      if (options == null) options = {};
      if (options.title) openGraphMetaTag("og:title", options.title);
      if (options.type) openGraphMetaTag("og:type", options.type);
      if (options.image) openGraphMetaTag("og:image", options.image);
      if (options.site) openGraphMetaTag("og:siteName", options.site);
      if (options.description) {
        openGraphMetaTag("og:description", options.description);
      }
      if (options.email) openGraphMetaTag("og:email", options.email);
      if (options.phone) openGraphMetaTag("og:phoneNumber", options.phone);
      if (options.fax) openGraphMetaTag("og:faxNumber", options.fax);
      if (options.lat) openGraphMetaTag("og:latitude", options.lat);
      if (options.lng) openGraphMetaTag("og:longitude", options.lng);
      if (options.street) openGraphMetaTag("og:street-address", options.street);
      if (options.city) openGraphMetaTag("og:locality", options.city);
      if (options.state) openGraphMetaTag("og:region", options.state);
      if (options.zip) openGraphMetaTag("og:postal-code", options.zip);
      if (options.country) openGraphMetaTag("og:country-name", options.country);
      return null;
    },
    openGraphMetaTag: function(property, content) {
      return meta({
        property: property,
        content: content
      });
    }
  };

  Tower.View.RenderingHelper = {
    partial: function(path, options, callback) {
      var item, locals, name, prefixes, template, tmpl, _len5, _m, _ref5;
      try {
        if (typeof options === "function") {
          callback = options;
          options = {};
        }
        options || (options = {});
        options.locals || (options.locals = {});
        locals = options.locals;
        path = path.split("/");
        path[path.length - 1] = "_" + path[path.length - 1];
        path = path.join("/");
        prefixes = options.prefixes;
        if (this._context) prefixes || (prefixes = [this._context.collectionName]);
        template = this._readTemplate(path, prefixes, options.type || Tower.View.engine);
        template = this.renderWithEngine(String(template));
        if (options.collection) {
          name = options.as || Tower.Support.String.camelize(options.collection[0].constructor.name, true);
          tmpl = eval("(function(data) { with(data) { this." + name + " = " + name + "; " + (String(template)) + " } })");
          _ref5 = options.collection;
          for (_m = 0, _len5 = _ref5.length; _m < _len5; _m++) {
            item = _ref5[_m];
            locals[name] = item;
            tmpl.call(this, locals);
            delete this[name];
          }
        } else {
          tmpl = "(function(data) { with(data) { " + (String(template)) + " } })";
          eval(tmpl).call(this, locals);
        }
      } catch (error) {
        console.log(error.stack || error);
      }
      return null;
    },
    page: function() {
      var args, browserTitle, options;
      args = Tower.Support.Array.args(arguments);
      options = Tower.Support.Array.extractOptions(args);
      browserTitle = args.shift() || options.title;
      return this.contentFor("title", function() {
        return title(browserTitle);
      });
    },
    urlFor: function() {
      return Tower.urlFor.apply(Tower, arguments);
    },
    yields: function(key) {
      var ending, value;
      value = this[key];
      if (typeof value === "function") {
        eval("(" + (String(value)) + ")()");
      } else {
        ending = value.match(/\n$/) ? "\n" : "";
        text(value.replace(/\n$/, "").replace(/^(?!\s+$)/mg, __ck.repeat('  ', __ck.tabs)) + ending);
      }
      return null;
    },
    hasContentFor: function(key) {
      return !!(this.hasOwnProperty(key) && this[key] && this[key] !== "");
    },
    has: function(key) {
      return !!(this.hasOwnProperty(key) && this[key] && this[key] !== "");
    },
    contentFor: function(key, block) {
      this[key] = block;
      return null;
    }
  };

  Tower.View.StringHelper = {
    HTML_ESCAPE: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    },
    preserve: function(text) {
      return text.replace(/\n/g, '&#x000A;').replace(/\r/g, '');
    },
    htmlEscape: function(text) {
      var _this = this;
      return text.replace(/[\"><&]/g, function(_) {
        return _this.HTML_ESCAPE[_];
      });
    },
    t: function(string) {
      return Tower.Support.I18n.translate(string);
    },
    l: function(object) {
      return Tower.Support.I18n.localize(string);
    },
    boolean: function(boolean) {
      if (boolean) {
        return "yes";
      } else {
        return "no";
      }
    }
  };

  Tower.View.include(Tower.View.Rendering);

  Tower.View.include(Tower.View.Helpers);

  Tower.View.include(Tower.View.AssetHelper);

  Tower.View.include(Tower.View.ComponentHelper);

  Tower.View.include(Tower.View.HeadHelper);

  Tower.View.include(Tower.View.RenderingHelper);

  Tower.View.include(Tower.View.StringHelper);

  Tower.View.helpers.push(Tower.View.AssetHelper);

  Tower.View.helpers.push(Tower.View.ComponentHelper);

  Tower.View.helpers.push(Tower.View.HeadHelper);

  Tower.View.helpers.push(Tower.View.RenderingHelper);

  Tower.View.helpers.push(Tower.View.StringHelper);

  $.fn.serializeParams = function(coerce) {
    return $.serializeParams($(this).serialize(), coerce);
  };

  $.serializeParams = function(params, coerce) {
    var array, coerce_types, cur, i, index, item, keys, keys_last, obj, param, val, _len5;
    obj = {};
    coerce_types = {
      "true": !0,
      "false": !1,
      "null": null
    };
    array = params.replace(/\+/g, " ").split("&");
    for (index = 0, _len5 = array.length; index < _len5; index++) {
      item = array[index];
      param = item.split("=");
      key = decodeURIComponent(param[0]);
      val = void 0;
      cur = obj;
      i = 0;
      keys = key.split("][");
      keys_last = keys.length - 1;
      if (/\[/.test(keys[0]) && /\]$/.test(keys[keys_last])) {
        keys[keys_last] = keys[keys_last].replace(/\]$/, "");
        keys = keys.shift().split("[").concat(keys);
        keys_last = keys.length - 1;
      } else {
        keys_last = 0;
      }
      if (param.length === 2) {
        val = decodeURIComponent(param[1]);
        if (coerce) {
          val = (val && !isNaN(val) ? +val : (val === "undefined" ? undefined : (coerce_types[val] !== undefined ? coerce_types[val] : val)));
        }
        if (keys_last) {
          while (i <= keys_last) {
            key = (keys[i] === "" ? cur.length : keys[i]);
            cur = cur[key] = (i < keys_last ? cur[key] || (keys[i + 1] && isNaN(keys[i + 1]) ? {} : []) : val);
            i++;
          }
        } else {
          if ($.isArray(obj[key])) {
            obj[key].push(val);
          } else if (obj[key] !== undefined) {
            obj[key] = [obj[key], val];
          } else {
            obj[key] = val;
          }
        }
      } else {
        if (key) obj[key] = (coerce ? undefined : "");
      }
    }
    return obj;
  };

  Tower.View.MetaHelper = {
    title: function(string) {
      return document.title = string;
    }
  };

  Tower.View.ValidationHelper = {
    success: function() {
      return this.redirectTo("/");
    },
    failure: function(error) {
      if (error) {
        return this.flashError(error);
      } else {
        return this.invalidate();
      }
    },
    invalidate: function() {
      var attribute, element, errors, field, _ref5, _results;
      element = $("#" + this.resourceName + "-" + this.elementName);
      _ref5 = this.resource.errors;
      _results = [];
      for (attribute in _ref5) {
        errors = _ref5[attribute];
        field = $("#" + this.resourceName + "-" + attribute + "-field");
        if (field.length) {
          field.css("background", "yellow");
          _results.push($("input", field).after("<output class='error'>" + (errors.join("\n")) + "</output>"));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    }
  };

  Tower.Controller = (function(_super) {

    __extends(Controller, _super);

    Controller.include(Tower.Support.Callbacks);

    Controller.extend(Tower.Support.EventEmitter);

    Controller.include(Tower.Support.EventEmitter);

    Controller.instance = function() {
      return this._instance || (this._instance = new this);
    };

    Controller.metadata = function() {
      return this._metadata || (this._metadata = {});
    };

    function Controller() {
      this.constructor._instance = this;
      this.headers = {};
      this.status = 200;
      this.request = null;
      this.response = null;
      this.params = {};
      this.query = {};
      this.resourceName = this.constructor.resourceName();
      this.resourceType = this.constructor.resourceType();
      this.collectionName = this.constructor.collectionName();
      this.formats = _.keys(this.constructor.mimes());
      if (this.constructor._belongsTo) {
        this.hasParent = true;
      } else {
        this.hasParent = false;
      }
    }

    return Controller;

  })(Tower.Class);

  Tower.Controller.Callbacks = {
    ClassMethods: {
      beforeAction: function() {
        return this.before.apply(this, ["action"].concat(__slice.call(arguments)));
      },
      afterAction: function() {
        return this.after.apply(this, ["action"].concat(__slice.call(arguments)));
      }
    }
  };

  Tower.Controller.Helpers = {
    ClassMethods: {
      helper: function(object) {
        this._helpers || (this._helpers = []);
        return this._helpers.push(object);
      },
      layout: function(layout) {
        return this._layout = layout;
      }
    },
    layout: function() {
      var layout;
      layout = this.constructor._layout;
      if (typeof layout === "function") {
        return layout.call(this);
      } else {
        return layout;
      }
    }
  };

  Tower.Controller.Instrumentation = {
    call: function(request, response, next) {
      this.request = request;
      this.response = response;
      this.params = this.request.params || {};
      this.cookies = this.request.cookies || {};
      this.query = this.request.query || {};
      this.session = this.request.session || {};
      this.format = this.params.format || "html";
      this.action = this.params.action;
      this.headers = {};
      this.callback = next;
      return this.process();
    },
    process: function() {
      var _this = this;
      this.processQuery();
      if (!Tower.env.match(/(test|production)/)) {
        console.log("  Processing by " + this.constructor.name + "#" + this.action + " as " + (this.format.toUpperCase()));
        console.log("  Parameters:");
        console.log(this.params);
      }
      return this.runCallbacks("action", {
        name: this.action
      }, function(callback) {
        return _this[_this.action].call(_this, callback);
      });
    },
    processQuery: function() {},
    clear: function() {
      this.request = null;
      this.response = null;
      return this.headers = null;
    }
  };

  Tower.Controller.Params = {
    ClassMethods: {
      params: function(options, callback) {
        if (typeof options === 'function') {
          callback = options;
          options = {};
        }
        if (options) {
          this._paramsOptions = Tower.Support.Object.extend(this._paramsOptions || {}, options);
          callback.call(this);
        }
        return this._params || (this._params = {});
      },
      param: function(key, options) {
        if (options == null) options = {};
        this._params || (this._params = {});
        return this._params[key] = Tower.HTTP.Param.create(key, Tower.Support.Object.extend({}, this._paramsOptions || {}, options));
      }
    },
    criteria: function() {
      var criteria, name, params, parser, parsers;
      if (this._criteria) return this._criteria;
      this._criteria = criteria = new Tower.Model.Criteria;
      parsers = this.constructor.params();
      params = this.params;
      for (name in parsers) {
        parser = parsers[name];
        if (params.hasOwnProperty(name)) {
          criteria.where(parser.toCriteria(params[name]));
        }
      }
      return criteria;
    }
  };

  Tower.Controller.Redirecting = {
    redirectTo: function() {
      return this.redirect.apply(this, arguments);
    },
    redirect: function() {
      var args, options, url;
      try {
        args = Tower.Support.Array.args(arguments);
        console.log("redirect");
        console.log(this.resourceType);
        console.log(args);
        options = Tower.Support.Array.extractOptions(args);
        console.log(options);
        url = args.shift();
        if (!url && options.hasOwnProperty("action")) {
          url = (function() {
            switch (options.action) {
              case "index":
              case "new":
                return Tower.urlFor(this.resourceType, {
                  action: options.action
                });
              case "edit":
              case "show":
                return Tower.urlFor(this.resource, {
                  action: options.action
                });
            }
          }).call(this);
        }
        url || (url = "/");
        console.log(url);
        this.response.redirect(url);
      } catch (error) {
        console.log(error);
      }
      if (this.callback) return this.callback();
    }
  };

  Tower.Controller.Rendering = {
    ClassMethods: {
      addRenderer: function(key, block) {
        return this.renderers()[key] = block;
      },
      addRenderers: function(renderers) {
        var block, key;
        if (renderers == null) renderers = {};
        for (key in renderers) {
          block = renderers[key];
          this.addRenderer(key, block);
        }
        return this;
      },
      renderers: function() {
        return this._renderers || (this._renderers = {});
      }
    },
    render: function() {
      return this.renderToBody(this._normalizeRender.apply(this, arguments));
    },
    renderToBody: function(options) {
      this._processRenderOptions(options);
      return this._renderTemplate(options);
    },
    renderToString: function() {
      return this.renderToBody(this._normalizeRender.apply(this, arguments));
    },
    sendFile: function(path, options) {
      if (options == null) options = {};
    },
    sendData: function(data, options) {
      if (options == null) options = {};
    },
    _renderTemplate: function(options) {
      var callback, view, _base, _callback,
        _this = this;
      _callback = options.callback;
      callback = function(error, body) {
        if (error) {
          _this.status || (_this.status = 404);
          _this.body = error.stack;
        } else {
          _this.status || (_this.status = 200);
          _this.body = body;
        }
        if (_callback) _callback.apply(_this, arguments);
        if (_this.callback) return _this.callback();
      };
      if (this._handleRenderers(options, callback)) return;
      (_base = this.headers)["Content-Type"] || (_base["Content-Type"] = "text/html");
      view = new Tower.View(this);
      try {
        return view.render.call(view, options, callback);
      } catch (error) {
        return callback(error);
      }
    },
    _handleRenderers: function(options, callback) {
      var name, renderer, _ref5;
      _ref5 = Tower.Controller.renderers();
      for (name in _ref5) {
        renderer = _ref5[name];
        if (options.hasOwnProperty(name)) {
          renderer.call(this, options[name], options, callback);
          return true;
        }
      }
      return false;
    },
    _processRenderOptions: function(options) {
      if (options == null) options = {};
      if (options.status) this.status = options.status;
      if (options.contentType) this.headers["Content-Type"] = options.contentType;
      if (options.location) {
        this.headers["Location"] = this.urlFor(options.location);
      }
      return this;
    },
    _normalizeRender: function() {
      return this._normalizeOptions(this._normalizeArgs.apply(this, arguments));
    },
    _normalizeArgs: function() {
      var action, args, callback, options;
      args = Tower.Support.Array.args(arguments);
      if (typeof args[0] === "string") action = args.shift();
      if (typeof args[0] === "object") options = args.shift();
      if (typeof args[0] === "function") callback = args.shift();
      options || (options = {});
      if (action) {
        key = !!action.match(/\//) ? "file" : "action";
        options[key] = action;
      }
      if (callback) options.callback = callback;
      return options;
    },
    _normalizeOptions: function(options) {
      if (options == null) options = {};
      if (options.partial === true) options.partial = this.action;
      options.prefixes || (options.prefixes = []);
      options.prefixes.push(this.collectionName);
      options.template || (options.template = options.file || (options.action || this.action));
      return options;
    }
  };

  Tower.Controller.Resourceful = {
    ClassMethods: {
      resource: function(options) {
        if (options.hasOwnProperty("name")) this._resourceName = options.name;
        if (options.hasOwnProperty("type")) this._resourceType = options.type;
        if (options.hasOwnProperty("collectionName")) {
          this._collectionName = options.collectionName;
        }
        return this;
      },
      resourceType: function() {
        return this._resourceType || (this._resourceType = Tower.Support.String.singularize(this.name.replace(/(Controller)$/, "")));
      },
      resourceName: function() {
        var parts;
        if (this._resourceName) return this._resourceName;
        parts = this.resourceType().split(".");
        return this._resourceName = Tower.Support.String.camelize(parts[parts.length - 1], true);
      },
      collectionName: function() {
        return this._collectionName || (this._collectionName = Tower.Support.String.camelize(this.name.replace(/(Controller)$/, ""), true));
      },
      belongsTo: function(key, options) {
        if (options == null) options = {};
        options.key = key;
        options.type || (options.type = Tower.Support.String.camelize(options.key));
        return this._belongsTo = options;
      },
      actions: function() {
        var action, actions, actionsToRemove, args, options, _len5, _m;
        args = Tower.Support.Array.args(arguments);
        if (typeof args[args.length - 1] === "object") {
          options = args.pop();
        } else {
          options = {};
        }
        actions = ["index", "new", "create", "show", "edit", "update", "destroy"];
        actionsToRemove = _.difference(actions, args, options.except || []);
        for (_m = 0, _len5 = actionsToRemove.length; _m < _len5; _m++) {
          action = actionsToRemove[_m];
          this[action] = null;
          delete this[action];
        }
        return this;
      }
    },
    index: function() {
      var _this = this;
      return this._index(function(format) {
        format.html(function() {
          return _this.render("index");
        });
        return format.json(function() {
          return _this.render({
            json: _this.collection,
            status: 200
          });
        });
      });
    },
    "new": function() {
      var _this = this;
      return this._new(function(format) {
        format.html(function() {
          return _this.render("new");
        });
        return format.json(function() {
          return _this.render({
            json: _this.resource,
            status: 200
          });
        });
      });
    },
    create: function(callback) {
      var _this = this;
      return this._create(function(format) {
        format.html(function() {
          return _this.redirectTo({
            action: "show"
          });
        });
        return format.json(function() {
          return _this.render({
            json: _this.resource,
            status: 200
          });
        });
      });
    },
    show: function() {
      var _this = this;
      return this._show(function(format) {
        format.html(function() {
          return _this.render("show");
        });
        return format.json(function() {
          return _this.render({
            json: _this.resource,
            status: 200
          });
        });
      });
    },
    edit: function() {
      var _this = this;
      return this._edit(function(format) {
        format.html(function() {
          return _this.render("edit");
        });
        return format.json(function() {
          return _this.render({
            json: _this.resource,
            status: 200
          });
        });
      });
    },
    update: function() {
      var _this = this;
      return this._update(function(format) {
        format.html(function() {
          return _this.redirectTo({
            action: "show"
          });
        });
        return format.json(function() {
          return _this.render({
            json: _this.resource,
            status: 200
          });
        });
      });
    },
    destroy: function() {
      var _this = this;
      return this._destroy(function(format) {
        format.html(function() {
          return _this.redirectTo({
            action: "index"
          });
        });
        return format.json(function() {
          return _this.render({
            json: _this.resource,
            status: 200
          });
        });
      });
    },
    _index: function(callback) {
      var _this = this;
      return this.findCollection(function(error, collection) {
        return _this.respondWith(collection, callback);
      });
    },
    _new: function(callback) {
      var _this = this;
      return this.buildResource(function(error, resource) {
        if (!resource) return _this.failure(error);
        return _this.respondWith(resource, callback);
      });
    },
    _create: function(callback) {
      var _this = this;
      return this.buildResource(function(error, resource) {
        if (!resource) return _this.failure(error, callback);
        return resource.save(function(error) {
          return _this.respondWithStatus(Tower.Support.Object.isBlank(resource.errors), callback);
        });
      });
    },
    _show: function(callback) {
      var _this = this;
      return this.findResource(function(error, resource) {
        return _this.respondWith(resource, callback);
      });
    },
    _edit: function(callback) {
      var _this = this;
      return this.findResource(function(error, resource) {
        return _this.respondWith(resource, callback);
      });
    },
    _update: function(callback) {
      var _this = this;
      return this.findResource(function(error, resource) {
        if (error) return _this.failure(error, callback);
        return resource.updateAttributes(_this.params[_this.resourceName], function(error) {
          return _this.respondWithStatus(!!!error && Tower.Support.Object.isBlank(resource.errors), callback);
        });
      });
    },
    _destroy: function(callback) {
      var _this = this;
      return this.findResource(function(error, resource) {
        if (error) return _this.failure(error, callback);
        return resource.destroy(function(error) {
          return _this.respondWithStatus(!!!error, callback);
        });
      });
    },
    respondWithScoped: function(callback) {
      var _this = this;
      return this.scoped(function(error, scope) {
        if (error) return _this.failure(error, callback);
        return _this.respondWith(scope.build(), callback);
      });
    },
    respondWithStatus: function(success, callback) {
      var failureResponder, options, successResponder;
      options = {
        records: this.resource || this.collection
      };
      if (callback && callback.length > 1) {
        successResponder = new Tower.Controller.Responder(this, options);
        failureResponder = new Tower.Controller.Responder(this, options);
        callback.call(this, successResponder, failureResponder);
        if (success) {
          return successResponder[format].call(this);
        } else {
          return failureResponder[format].call(this, error);
        }
      } else {
        return Tower.Controller.Responder.respond(this, options, callback);
      }
    },
    buildResource: function(callback) {
      var _this = this;
      return this.scoped(function(error, scope) {
        var resource;
        if (error) return callback.call(_this, error, null);
        _this[_this.resourceName] = _this.resource = resource = scope.build(_this.params[_this.resourceName]);
        if (callback) callback.call(_this, null, resource);
        return resource;
      });
    },
    findResource: function(callback) {
      var _this = this;
      return this.scoped(function(error, scope) {
        if (error) return callback.call(_this, error, null);
        return scope.find(_this.params.id, function(error, resource) {
          _this[_this.resourceName] = _this.resource = resource;
          return callback.call(_this, error, resource);
        });
      });
    },
    findCollection: function(callback) {
      var _this = this;
      return this.scoped(function(error, scope) {
        if (error) return callback.call(_this, error, null);
        return scope.all(function(error, collection) {
          _this[_this.collectionName] = _this.collection = collection;
          if (callback) return callback.call(_this, error, collection);
        });
      });
    },
    findParent: function(callback) {
      var association, param, parentClass,
        _this = this;
      association = this.constructor._belongsTo;
      if (association) {
        param = association.param || ("" + association.key + "Id");
        parentClass = Tower.constant(association.type);
        return parentClass.find(this.params[param], function(error, parent) {
          if (error && !callback) throw error;
          if (!error) _this.parent = _this[association.key] = parent;
          if (callback) return callback.call(_this, error, parent);
        });
      } else {
        if (callback) callback.call(this, null, false);
        return false;
      }
    },
    scoped: function(callback) {
      var callbackWithScope,
        _this = this;
      callbackWithScope = function(error, scope) {
        return callback.call(_this, error, scope.where(_this.criteria()));
      };
      if (this.hasParent) {
        return this.findParent(function(error, parent) {
          return callbackWithScope(error, parent[_this.collectionName]());
        });
      } else {
        return callbackWithScope(null, Tower.constant(this.resourceType));
      }
    },
    failure: function(resource, callback) {
      return callback();
    }
  };

  Tower.Controller.Responder = (function() {

    Responder.respond = function(controller, options, callback) {
      var responder;
      responder = new this(controller, options);
      return responder.respond(callback);
    };

    function Responder(controller, options) {
      var format, _len5, _m, _ref5;
      if (options == null) options = {};
      this.controller = controller;
      this.options = options;
      _ref5 = this.controller.formats;
      for (_m = 0, _len5 = _ref5.length; _m < _len5; _m++) {
        format = _ref5[_m];
        this.accept(format);
      }
    }

    Responder.prototype.accept = function(format) {
      return this[format] = function(callback) {
        return this["_" + format] = callback;
      };
    };

    Responder.prototype.respond = function(callback) {
      var method;
      if (callback) callback.call(this.controller, this);
      method = this["_" + this.controller.format];
      if (method) {
        return method.call(this);
      } else {
        return this.toFormat();
      }
    };

    Responder.prototype._html = function() {
      return this.controller.render({
        action: this.controller.action
      });
    };

    Responder.prototype._json = function() {
      return this.controller.render({
        json: this.options.records
      });
    };

    Responder.prototype.toFormat = function() {
      try {
        if ((typeof get !== "undefined" && get !== null) || !(typeof hasErrors !== "undefined" && hasErrors !== null)) {
          return this.defaultRender();
        } else {
          return this.displayErrors();
        }
      } catch (error) {
        return this._apiBehavior(error);
      }
    };

    Responder.prototype._navigationBehavior = function(error) {
      if (typeof get !== "undefined" && get !== null) {
        throw error;
      } else if ((typeof hasErrors !== "undefined" && hasErrors !== null) && defaultAction) {
        return this.render({
          action: this.defaultAction
        });
      } else {
        return this.redirectTo(this.navigationLocation);
      }
    };

    Responder.prototype._apiBehavior = function(error) {
      if (typeof get !== "undefined" && get !== null) {
        return this.display(resource);
      } else if (typeof post !== "undefined" && post !== null) {
        return this.display(resource, {
          status: "created",
          location: this.apiLocation
        });
      } else {
        return this.head("noContent");
      }
    };

    Responder.prototype.isResourceful = function() {
      return this.resource.hasOwnProperty("to" + (this.format.toUpperCase()));
    };

    Responder.prototype.resourceLocation = function() {
      return this.options.location || this.resources;
    };

    Responder.prototype.defaultRender = function() {
      return this.defaultResponse.call(options);
    };

    Responder.prototype.display = function(resource, givenOptions) {
      if (givenOptions == null) givenOptions = {};
      return this.controller.render(_.extend(givenOptions, this.options, {
        format: this.resource
      }));
    };

    Responder.prototype.displayErrors = function() {
      return this.controller.render({
        format: this.resourceErrors,
        status: "unprocessableEntity"
      });
    };

    Responder.prototype.hasErrors = function() {
      var _base;
      return (typeof (_base = this.resource).respondTo === "function" ? _base.respondTo("errors") : void 0) && !(this.resource.errors.empty != null);
    };

    Responder.prototype.defaultAction = function() {
      return this.action || (this.action = ACTIONS_FOR_VERBS[request.requestMethodSymbol]);
    };

    Responder.prototype.resourceErrors = function() {
      if (this.hasOwnProperty("" + format + "ResourceErrors")) {
        return this["" + format + "RresourceErrors"];
      } else {
        return this.resource.errors;
      }
    };

    Responder.prototype.jsonResourceErrors = function() {
      return {
        errors: this.resource.errors
      };
    };

    return Responder;

  })();

  Tower.Controller.Responding = {
    ClassMethods: {
      respondTo: function() {
        var args, except, mimes, name, only, options, _len5, _m;
        mimes = this.mimes();
        args = Tower.Support.Array.args(arguments);
        if (typeof args[args.length - 1] === "object") {
          options = args.pop();
        } else {
          options = {};
        }
        if (options.only) only = Tower.Support.Object.toArray(options.only);
        if (options.except) except = Tower.Support.Object.toArray(options.except);
        for (_m = 0, _len5 = args.length; _m < _len5; _m++) {
          name = args[_m];
          mimes[name] = {};
          if (only) mimes[name].only = only;
          if (except) mimes[name].except = except;
        }
        return this;
      },
      mimes: function() {
        return this._mimes || (this._mimes = {
          json: {},
          html: {}
        });
      }
    },
    respondTo: function(block) {
      return Tower.Controller.Responder.respond(this, {}, block);
    },
    respondWith: function() {
      var args, callback, options;
      args = Tower.Support.Array.args(arguments);
      callback = null;
      if (typeof args[args.length - 1] === "function") callback = args.pop();
      if (typeof args[args.length - 1] === "object" && !(args[args.length - 1] instanceof Tower.Model)) {
        options = args.pop();
      } else {
        options = {};
      }
      options || (options = {});
      options.records = args[0];
      return Tower.Controller.Responder.respond(this, options, callback);
    },
    _mimesForAction: function() {
      var action, config, mime, mimes, result, success;
      action = this.action;
      result = [];
      mimes = this.constructor.mimes();
      for (mime in mimes) {
        config = mimes[mime];
        success = false;
        if (config.except) {
          success = !_.include(config.except, action);
        } else if (config.only) {
          success = _.include(config.only, action);
        } else {
          success = true;
        }
        if (success) result.push(mime);
      }
      return result;
    }
  };

  Tower.Controller.include(Tower.Controller.Callbacks);

  Tower.Controller.include(Tower.Controller.Helpers);

  Tower.Controller.include(Tower.Controller.Instrumentation);

  Tower.Controller.include(Tower.Controller.Params);

  Tower.Controller.include(Tower.Controller.Redirecting);

  Tower.Controller.include(Tower.Controller.Rendering);

  Tower.Controller.include(Tower.Controller.Resourceful);

  Tower.Controller.include(Tower.Controller.Responding);

  Tower.Controller.Elements = {
    ClassMethods: {
      extractElements: function(target, options) {
        var key, method, result, selector, selectors;
        if (options == null) options = {};
        result = {};
        for (method in options) {
          selectors = options[method];
          for (key in selectors) {
            selector = selectors[key];
            result[key] = target[method](selector);
          }
        }
        return result;
      },
      processElements: function(target, options) {
        if (options == null) options = {};
        return this.elements = this.extractElements(target, options);
      },
      clickHandler: function(name, handler, options) {
        var _this = this;
        return $(this.dispatcher).on(name, function(event) {});
      },
      submitHandler: function(name, handler, options) {
        var _this = this;
        return $(this.dispatcher).on(name, function(event) {
          var action, elements, form, method, params, target;
          try {
            target = $(event.target);
            form = target.closest("form");
            action = form.attr("action");
            method = (form.attr("data-method") || form.attr("method")).toUpperCase();
            params = form.serializeParams();
            params.method = method;
            params.action = action;
            elements = _.extend({
              target: target,
              form: form
            }, {});
            _this._dispatch(handler, {
              elements: elements,
              params: params
            });
          } catch (error) {
            console.log(error);
          }
          return false;
        });
      },
      invalidForm: function() {
        var attribute, element, errors, field, _ref5, _results;
        element = $("#" + this.resourceName + "-" + this.elementName);
        _ref5 = this.resource.errors;
        _results = [];
        for (attribute in _ref5) {
          errors = _ref5[attribute];
          field = $("#" + this.resourceName + "-" + attribute + "-field");
          if (field.length) {
            field.css("background", "yellow");
            _results.push($("input", field).after("<output class='error'>" + (errors.join("\n")) + "</output>"));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      }
    }
  };

  Tower.Controller.Events = {
    ClassMethods: {
      DOM_EVENTS: ["click", "dblclick", "blur", "error", "focus", "focusIn", "focusOut", "hover", "keydown", "keypress", "keyup", "load", "mousedown", "mouseenter", "mouseleave", "mousemove", "mouseout", "mouseover", "mouseup", "mousewheel", "ready", "resize", "scroll", "select", "submit", "tap", "taphold", "swipe", "swipeleft", "swiperight"],
      dispatcher: global,
      addEventHandler: function(name, handler, options) {
        if (options.type === "socket" || !name.match(this.DOM_EVENT_PATTERN)) {
          return this.addSocketEventHandler(name, handler, options);
        } else {
          return this.addDomEventHandler(name, handler, options);
        }
      },
      socketNamespace: function() {
        return Tower.Support.String.pluralize(Tower.Support.String.camelize(this.name.replace(/(Controller)$/, ""), false));
      },
      addSocketEventHandler: function(name, handler, options) {
        var _this = this;
        this.io || (this.io = Tower.Application.instance().io.connect(this.socketNamespace()));
        return this.io.on(name, function(data) {
          return _this._dispatch(void 0, handler, data);
        });
      },
      addDomEventHandler: function(name, handler, options) {
        var eventType, method, parts, selector,
          _this = this;
        parts = name.split(/\ +/);
        name = parts.shift();
        selector = parts.join(" ");
        if (selector && selector !== "") options.target = selector;
        options.target || (options.target = "body");
        eventType = name.split(/[\.:]/)[0];
        method = this["" + eventType + "Handler"];
        if (method) {
          method.call(this, name, handler, options);
        } else {
          $(this.dispatcher).on(name, options.target, function(event) {
            return _this._dispatch(handler, options);
          });
        }
        return this;
      },
      _dispatch: function(handler, options) {
        var controller;
        if (options == null) options = {};
        controller = this.instance();
        controller.elements || (controller.elements = {});
        controller.params || (controller.params = {});
        if (options.params) _.extend(controller.params, options.params);
        if (options.elements) _.extend(controller.elements, options.elements);
        if (typeof handler === "string") {
          return controller[handler].call(controller, event);
        } else {
          return handler.call(controller, event);
        }
      }
    }
  };

  Tower.Controller.Events.ClassMethods.DOM_EVENT_PATTERN = new RegExp("^(" + (Tower.Controller.Events.ClassMethods.DOM_EVENTS.join("|")) + ")");

  Tower.Controller.Handlers = {
    ClassMethods: {
      submitHandler: function(name, handler, options) {
        var _this = this;
        return $(this.dispatcher).on(name, function(event) {
          var action, elements, form, method, params, target;
          target = $(event.target);
          form = target.closest("form");
          action = form.attr("action");
          method = (form.attr("data-method") || form.attr("method")).toUpperCase();
          params = form.serializeParams();
          params.method = method;
          params.action = action;
          elements = _.extend({
            target: target,
            form: form
          }, {});
          return _this._dispatch(handler, {
            elements: elements,
            params: params
          });
        });
      }
    }
  };

  Tower.Controller.include(Tower.Controller.Elements);

  Tower.Controller.include(Tower.Controller.Events);

  Tower.Controller.include(Tower.Controller.Handlers);

  $.fn.serializeParams = function(coerce) {
    return $.serializeParams($(this).serialize(), coerce);
  };

  $.serializeParams = function(params, coerce) {
    var array, coerce_types, cur, i, index, item, keys, keys_last, obj, param, val, _len5;
    obj = {};
    coerce_types = {
      "true": !0,
      "false": !1,
      "null": null
    };
    array = params.replace(/\+/g, " ").split("&");
    for (index = 0, _len5 = array.length; index < _len5; index++) {
      item = array[index];
      param = item.split("=");
      key = decodeURIComponent(param[0]);
      val = void 0;
      cur = obj;
      i = 0;
      keys = key.split("][");
      keys_last = keys.length - 1;
      if (/\[/.test(keys[0]) && /\]$/.test(keys[keys_last])) {
        keys[keys_last] = keys[keys_last].replace(/\]$/, "");
        keys = keys.shift().split("[").concat(keys);
        keys_last = keys.length - 1;
      } else {
        keys_last = 0;
      }
      if (param.length === 2) {
        val = decodeURIComponent(param[1]);
        if (coerce) {
          val = (val && !isNaN(val) ? +val : (val === "undefined" ? undefined : (coerce_types[val] !== undefined ? coerce_types[val] : val)));
        }
        if (keys_last) {
          while (i <= keys_last) {
            key = (keys[i] === "" ? cur.length : keys[i]);
            cur = cur[key] = (i < keys_last ? cur[key] || (keys[i + 1] && isNaN(keys[i + 1]) ? {} : []) : val);
            i++;
          }
        } else {
          if ($.isArray(obj[key])) {
            obj[key].push(val);
          } else if (obj[key] !== undefined) {
            obj[key] = [obj[key], val];
          } else {
            obj[key] = val;
          }
        }
      } else {
        if (key) obj[key] = (coerce ? undefined : "");
      }
    }
    return obj;
  };

  Tower.HTTP = {};

  Tower.HTTP.Agent = (function() {

    function Agent(attributes) {
      if (attributes == null) attributes = {};
      _.extend(this, attributes);
    }

    Agent.prototype.toJSON = function() {
      return {
        family: this.family,
        major: this.major,
        minor: this.minor,
        patch: this.patch,
        version: this.version,
        os: this.os,
        name: this.name
      };
    };

    return Agent;

  })();

  Tower.HTTP.Cookies = (function() {

    Cookies.parse = function(string) {
      var eqlIndex, pair, pairs, result, value, _len5, _m;
      if (string == null) string = document.cookie;
      result = {};
      pairs = string.split(/[;,] */);
      for (_m = 0, _len5 = pairs.length; _m < _len5; _m++) {
        pair = pairs[_m];
        eqlIndex = pair.indexOf('=');
        key = pair.substring(0, eqlIndex).trim().toLowerCase();
        value = pair.substring(++eqlIndex, pair.length).trim();
        if ('"' === value[0]) value = value.slice(1, -1);
        if (result[key] === void 0) {
          value = value.replace(/\+/g, ' ');
          try {
            result[key] = decodeURIComponent(value);
          } catch (error) {
            if (error instanceof URIError) {
              result[key] = value;
            } else {
              throw err;
            }
          }
        }
      }
      return new this(result);
    };

    function Cookies(attributes) {
      var key, value;
      if (attributes == null) attributes = {};
      for (key in attributes) {
        value = attributes[key];
        this[key] = value;
      }
    }

    return Cookies;

  })();

  Tower.HTTP.Param = (function() {

    Param.perPage = 20;

    Param.sortDirection = "ASC";

    Param.sortKey = "sort";

    Param.limitKey = "limit";

    Param.pageKey = "page";

    Param.separator = "_";

    Param.create = function(key, options) {
      options.type || (options.type = "String");
      return new Tower.HTTP.Param[options.type](key, options);
    };

    function Param(key, options) {
      if (options == null) options = {};
      this.controller = options.controller;
      this.key = key;
      this.attribute = options.as || this.key;
      this.modelName = options.modelName;
      if (typeof modelName !== "undefined" && modelName !== null) {
        this.namespace = Tower.Support.String.pluralize(this.modelName);
      }
      this.exact = options.exact || false;
      this["default"] = options["default"];
    }

    Param.prototype.parse = function(value) {
      return value;
    };

    Param.prototype.render = function(value) {
      return value;
    };

    Param.prototype.toCriteria = function(value) {
      var attribute, conditions, criteria, node, nodes, operator, set, _len5, _len6, _m, _n;
      nodes = this.parse(value);
      criteria = new Tower.Model.Criteria;
      for (_m = 0, _len5 = nodes.length; _m < _len5; _m++) {
        set = nodes[_m];
        for (_n = 0, _len6 = set.length; _n < _len6; _n++) {
          node = set[_n];
          attribute = node.attribute;
          operator = node.operators[0];
          conditions = {};
          if (operator === "$eq") {
            conditions[attribute] = node.value;
          } else {
            conditions[attribute] = {};
            conditions[attribute][operator] = node.value;
          }
          criteria.where(conditions);
        }
      }
      return criteria;
    };

    Param.prototype.parseValue = function(value, operators) {
      return {
        namespace: this.namespace,
        key: this.key,
        operators: operators,
        value: value,
        attribute: this.attribute
      };
    };

    Param.prototype._clean = function(string) {
      return string.replace(/^-/, "").replace(/^\+-/, "").replace(/^'|'$/, "").replace("+", " ").replace(/^\^/, "").replace(/\$$/, "").replace(/^\s+|\s+$/, "");
    };

    return Param;

  })();

  Tower.HTTP.Param.Array = (function(_super) {

    __extends(Array, _super);

    function Array() {
      Array.__super__.constructor.apply(this, arguments);
    }

    Array.prototype.parse = function(value) {
      var array, isRange, negation, string, values, _len5, _m,
        _this = this;
      values = [];
      array = value.toString().split(/[,\|]/);
      for (_m = 0, _len5 = array.length; _m < _len5; _m++) {
        string = array[_m];
        isRange = false;
        negation = !!string.match(/^\^/);
        string = string.replace(/^\^/, "");
        string.replace(/([^\.]+)?(\.{2})([^\.]+)?/, function(_, startsOn, operator, endsOn) {
          var range;
          isRange = true;
          range = [];
          if (!!(startsOn && startsOn.match(/^\d/))) {
            range.push(_this.parseValue(startsOn, ["$gte"]));
          }
          if (!!(endsOn && endsOn.match(/^\d/))) {
            range.push(_this.parseValue(endsOn, ["$lte"]));
          }
          return values.push(range);
        });
        if (!isRange) values.push([this.parseValue(string, ["$eq"])]);
      }
      return values;
    };

    return Array;

  })(Tower.HTTP.Param);

  Tower.HTTP.Param.Date = (function(_super) {

    __extends(Date, _super);

    function Date() {
      Date.__super__.constructor.apply(this, arguments);
    }

    Date.prototype.parse = function(value) {
      var array, isRange, string, values, _len5, _m,
        _this = this;
      values = [];
      array = value.toString().split(/[\s,\+]/);
      for (_m = 0, _len5 = array.length; _m < _len5; _m++) {
        string = array[_m];
        isRange = false;
        string.replace(/([^\.]+)?(\.\.)([^\.]+)?/, function(_, startsOn, operator, endsOn) {
          var range;
          isRange = true;
          range = [];
          if (!!(startsOn && startsOn.match(/^\d/))) {
            range.push(_this.parseValue(startsOn, ["$gte"]));
          }
          if (!!(endsOn && endsOn.match(/^\d/))) {
            range.push(_this.parseValue(endsOn, ["$lte"]));
          }
          return values.push(range);
        });
        if (!isRange) values.push([this.parseValue(string, ["$eq"])]);
      }
      return values;
    };

    Date.prototype.parseValue = function(value, operators) {
      return Date.__super__.parseValue.call(this, Tower.date(value), operators);
    };

    return Date;

  })(Tower.HTTP.Param);

  Tower.HTTP.Param.Number = (function(_super) {

    __extends(Number, _super);

    function Number() {
      Number.__super__.constructor.apply(this, arguments);
    }

    Number.prototype.parse = function(value) {
      var array, isRange, negation, string, values, _len5, _m,
        _this = this;
      values = [];
      array = value.toString().split(/[,\|]/);
      for (_m = 0, _len5 = array.length; _m < _len5; _m++) {
        string = array[_m];
        isRange = false;
        negation = !!string.match(/^\^/);
        string = string.replace(/^\^/, "");
        string.replace(/([^\.]+)?(\.{2})([^\.]+)?/, function(_, startsOn, operator, endsOn) {
          var range;
          isRange = true;
          range = [];
          if (!!(startsOn && startsOn.match(/^\d/))) {
            range.push(_this.parseValue(startsOn, ["$gte"]));
          }
          if (!!(endsOn && endsOn.match(/^\d/))) {
            range.push(_this.parseValue(endsOn, ["$lte"]));
          }
          return values.push(range);
        });
        if (!isRange) values.push([this.parseValue(string, ["$eq"])]);
      }
      return values;
    };

    Number.prototype.parseValue = function(value, operators) {
      return Number.__super__.parseValue.call(this, parseFloat(value), operators);
    };

    return Number;

  })(Tower.HTTP.Param);

  Tower.HTTP.Param.String = (function(_super) {

    __extends(String, _super);

    function String() {
      String.__super__.constructor.apply(this, arguments);
    }

    String.prototype.parse = function(value) {
      var arrays, i, node, values, _len5,
        _this = this;
      arrays = value.split(/(?:[\s|\+]OR[\s|\+]|\||,)/g);
      for (i = 0, _len5 = arrays.length; i < _len5; i++) {
        node = arrays[i];
        values = [];
        node.replace(/([\+\-\^]?[\w@_\s\d\.\$]+|-?\'[\w@-_\s\d\+\.\$]+\')/g, function(_, token) {
          var exact, negation, operators;
          negation = false;
          exact = false;
          token = token.replace(/^(\+?-+)/, function(_, $1) {
            negation = $1 && $1.length > 0;
            return "";
          });
          token = token.replace(/^\'(.+)\'$/, function(_, $1) {
            exact = $1 && $1.length > 0;
            return $1;
          });
          if (negation) {
            operators = [exact ? "$neq" : "$notMatch"];
          } else {
            operators = [exact ? "$eq" : "$match"];
          }
          if (!!token.match(/^\+?\-?\^/)) operators.push("^");
          if (!!token.match(/\$$/)) operators.push("$");
          values.push(_this.parseValue(_this._clean(token), operators));
          return _;
        });
        arrays[i] = values;
      }
      return arrays;
    };

    return String;

  })(Tower.HTTP.Param);

  Tower.HTTP.Route = (function(_super) {

    __extends(Route, _super);

    Route.store = function() {
      return this._store || (this._store = []);
    };

    Route.create = function(route) {
      return this.store().push(route);
    };

    Route.all = function() {
      return this.store();
    };

    Route.clear = function() {
      return this._store = [];
    };

    Route.draw = function(callback) {
      return callback.apply(new Tower.HTTP.Route.DSL(this));
    };

    Route.findController = function(request, response, callback) {
      var controller, route, routes, _len5, _m;
      routes = Tower.Route.all();
      for (_m = 0, _len5 = routes.length; _m < _len5; _m++) {
        route = routes[_m];
        controller = route.toController(request);
        if (controller) break;
      }
      if (controller) {
        controller.call(request, response, function() {
          return callback(controller);
        });
      } else {
        callback(null);
      }
      return controller;
    };

    Route.prototype.toController = function(request) {
      var capture, controller, i, keys, match, method, params, _len5, _name;
      match = this.match(request);
      if (!match) return null;
      method = request.method.toLowerCase();
      keys = this.keys;
      params = Tower.Support.Object.extend({}, this.defaults, request.query || {}, request.body || {});
      match = match.slice(1);
      for (i = 0, _len5 = match.length; i < _len5; i++) {
        capture = match[i];
        params[_name = keys[i].name] || (params[_name] = capture ? decodeURIComponent(capture) : null);
      }
      controller = this.controller;
      if (controller) params.action = controller.action;
      request.params = params;
      if (controller) {
        controller = new (Tower.constant(Tower.namespaced(this.controller.className)));
      }
      return controller;
    };

    function Route(options) {
      options || (options = options);
      this.path = options.path;
      this.name = options.name;
      this.method = (options.method || "GET").toUpperCase();
      this.ip = options.ip;
      this.defaults = options.defaults || {};
      this.constraints = options.constraints;
      this.options = options;
      this.controller = options.controller;
      this.keys = [];
      this.pattern = this.extractPattern(this.path);
      this.id = this.path;
      if (this.controller) {
        this.id += this.controller.name + this.controller.action;
      }
    }

    Route.prototype.match = function(requestOrPath) {
      var match, path;
      if (typeof requestOrPath === "string") {
        return this.pattern.exec(requestOrPath);
      }
      path = requestOrPath.location.path;
      if (requestOrPath.method.toUpperCase() !== this.method) return null;
      match = this.pattern.exec(path);
      if (!match) return null;
      if (!this.matchConstraints(requestOrPath)) return null;
      return match;
    };

    Route.prototype.matchConstraints = function(request) {
      var constraints, key, value;
      constraints = this.constraints;
      switch (typeof constraints) {
        case "object":
          for (key in constraints) {
            value = constraints[key];
            switch (typeof value) {
              case "string":
              case "number":
                if (request[key] !== value) return false;
                break;
              case "function":
              case "object":
                if (!request.location[key].match(value)) return false;
            }
          }
          break;
        case "function":
          return constraints.call(request, request);
        default:
          return false;
      }
      return true;
    };

    Route.prototype.urlFor = function(options) {
      var key, result, value;
      if (options == null) options = {};
      result = this.path;
      for (key in options) {
        value = options[key];
        result = result.replace(new RegExp(":" + key + "\\??", "g"), value);
      }
      result = result.replace(new RegExp("\\.?:\\w+\\??", "g"), "");
      return result;
    };

    Route.prototype.extractPattern = function(path, caseSensitive, strict) {
      var self;
      if (path instanceof RegExp) return path;
      self = this;
      if (path === "/") return new RegExp('^' + path + '$');
      path = path.replace(/(\(?)(\/)?(\.)?([:\*])(\w+)(\))?(\?)?/g, function(_, open, slash, format, symbol, key, close, optional) {
        var result, splat;
        optional = (!!optional) || (open + close === "()");
        splat = symbol === "*";
        self.keys.push({
          name: key,
          optional: !!optional,
          splat: splat
        });
        slash || (slash = "");
        result = "";
        if (!optional || !splat) result += slash;
        result += "(?:";
        if (format != null) {
          result += splat ? "\\.([^.]+?)" : "\\.([^/.]+?)";
        } else {
          result += splat ? "/?(.+)" : "([^/\\.]+)";
        }
        result += ")";
        if (optional) result += "?";
        return result;
      });
      return new RegExp('^' + path + '$', !!caseSensitive ? '' : 'i');
    };

    return Route;

  })(Tower.Class);

  Tower.Route = Tower.HTTP.Route;

  Tower.HTTP.Route.DSL = (function() {

    function DSL() {
      this._scope = {};
    }

    DSL.prototype.match = function() {
      this.scope || (this.scope = {});
      return Tower.HTTP.Route.create(new Tower.HTTP.Route(this._extractOptions.apply(this, arguments)));
    };

    DSL.prototype.get = function() {
      return this.matchMethod("get", Tower.Support.Array.args(arguments));
    };

    DSL.prototype.post = function() {
      return this.matchMethod("post", Tower.Support.Array.args(arguments));
    };

    DSL.prototype.put = function() {
      return this.matchMethod("put", Tower.Support.Array.args(arguments));
    };

    DSL.prototype["delete"] = function() {
      return this.matchMethod("delete", Tower.Support.Array.args(arguments));
    };

    DSL.prototype.matchMethod = function(method, args) {
      var name, options, path;
      if (typeof args[args.length - 1] === "object") {
        options = args.pop();
      } else {
        options = {};
      }
      name = args.shift();
      options.method = method;
      options.action = name;
      options.name = name;
      if (this._scope.name) {
        options.name = this._scope.name + Tower.Support.String.camelize(options.name);
      }
      path = "/" + name;
      if (this._scope.path) path = this._scope.path + path;
      this.match(path, options);
      return this;
    };

    DSL.prototype.scope = function(options, block) {
      var originalScope;
      if (options == null) options = {};
      originalScope = this._scope || (this._scope = {});
      this._scope = Tower.Support.Object.extend({}, originalScope, options);
      block.call(this);
      this._scope = originalScope;
      return this;
    };

    DSL.prototype.controller = function(controller, options, block) {
      options.controller = controller;
      return this.scope(options, block);
    };

    DSL.prototype.namespace = function(path, options, block) {
      if (typeof options === 'function') {
        block = options;
        options = {};
      } else {
        options = {};
      }
      options = Tower.Support.Object.extend({
        name: path,
        path: path,
        as: path,
        module: path,
        shallowPath: path,
        shallowPrefix: path
      }, options);
      if (options.name && this._scope.name) {
        options.name = this._scope.name + Tower.Support.String.camelize(options.name);
      }
      return this.scope(options, block);
    };

    DSL.prototype.constraints = function(options, block) {
      return this.scope({
        constraints: options
      }, block);
    };

    DSL.prototype.defaults = function(options, block) {
      return this.scope({
        defaults: options
      }, block);
    };

    DSL.prototype.resource = function(name, options) {
      if (options == null) options = {};
      options.controller = name;
      this.match("" + name + "/new", Tower.Support.Object.extend({
        action: "new"
      }, options));
      this.match("" + name, Tower.Support.Object.extend({
        action: "create",
        method: "POST"
      }, options));
      this.match("" + name + "/", Tower.Support.Object.extend({
        action: "show"
      }, options));
      this.match("" + name + "/edit", Tower.Support.Object.extend({
        action: "edit"
      }, options));
      this.match("" + name, Tower.Support.Object.extend({
        action: "update",
        method: "PUT"
      }, options));
      return this.match("" + name, Tower.Support.Object.extend({
        action: "destroy",
        method: "DELETE"
      }, options));
    };

    DSL.prototype.resources = function(name, options, callback) {
      var many, one, path;
      if (typeof options === 'function') {
        callback = options;
        options = {};
      } else {
        options = {};
      }
      options.controller || (options.controller = name);
      path = "/" + name;
      if (this._scope.path) path = this._scope.path + path;
      if (this._scope.name) {
        many = this._scope.name + Tower.Support.String.camelize(name);
      } else {
        many = name;
      }
      one = Tower.Support.String.singularize(many);
      this.match("" + path, Tower.Support.Object.extend({
        name: "" + many,
        action: "index"
      }, options));
      this.match("" + path + "/new", Tower.Support.Object.extend({
        name: "new" + (Tower.Support.String.camelize(one)),
        action: "new"
      }, options));
      this.match("" + path, Tower.Support.Object.extend({
        action: "create",
        method: "POST"
      }, options));
      this.match("" + path + "/:id", Tower.Support.Object.extend({
        name: "" + one,
        action: "show"
      }, options));
      this.match("" + path + "/:id/edit", Tower.Support.Object.extend({
        name: "edit" + (Tower.Support.String.camelize(one)),
        action: "edit"
      }, options));
      this.match("" + path + "/:id", Tower.Support.Object.extend({
        action: "update",
        method: "PUT"
      }, options));
      this.match("" + path + "/:id", Tower.Support.Object.extend({
        action: "destroy",
        method: "DELETE"
      }, options));
      if (callback) {
        this.scope(Tower.Support.Object.extend({
          path: "" + path + "/:" + (Tower.Support.String.singularize(name)) + "Id",
          name: one
        }, options), callback);
      }
      return this;
    };

    DSL.prototype.collection = function() {};

    DSL.prototype.member = function() {};

    DSL.prototype.root = function(options) {
      return this.match('/', Tower.Support.Object.extend({
        as: "root"
      }, options));
    };

    DSL.prototype._extractOptions = function() {
      var anchor, args, constraints, controller, defaults, format, method, name, options, path;
      args = Tower.Support.Array.args(arguments);
      path = "/" + args.shift().replace(/^\/|\/$/, "");
      if (typeof args[args.length - 1] === "object") {
        options = args.pop();
      } else {
        options = {};
      }
      if (args.length > 0) options.to || (options.to = args.shift());
      options.path = path;
      format = this._extractFormat(options);
      options.path = this._extractPath(options);
      method = this._extractRequestMethod(options);
      constraints = this._extractConstraints(options);
      defaults = this._extractDefaults(options);
      controller = this._extractController(options);
      anchor = this._extractAnchor(options);
      name = this._extractName(options);
      options = Tower.Support.Object.extend(options, {
        method: method,
        constraints: constraints,
        defaults: defaults,
        name: name,
        format: format,
        controller: controller,
        anchor: anchor,
        ip: options.ip
      });
      return options;
    };

    DSL.prototype._extractFormat = function(options) {};

    DSL.prototype._extractName = function(options) {
      return options.as || options.name;
    };

    DSL.prototype._extractConstraints = function(options) {
      return Tower.Support.Object.extend(this._scope.constraints || {}, options.constraints || {});
    };

    DSL.prototype._extractDefaults = function(options) {
      return options.defaults || {};
    };

    DSL.prototype._extractPath = function(options) {
      return "" + options.path + ".:format?";
    };

    DSL.prototype._extractRequestMethod = function(options) {
      return (options.method || options.via || "GET").toUpperCase();
    };

    DSL.prototype._extractAnchor = function(options) {
      return options.anchor;
    };

    DSL.prototype._extractController = function(options) {
      var action, controller, to;
      if (options == null) options = {};
      to = options.to;
      if (to) {
        to = to.split('#');
        if (to.length === 1) {
          action = to[0];
        } else {
          controller = to[0];
          action = to[1];
        }
      }
      controller || (controller = options.controller || this._scope.controller);
      action || (action = options.action);
      if (!controller) {
        throw new Error("No controller was specified for the route " + options.path);
      }
      controller = controller.toLowerCase().replace(/(?:[cC]ontroller)?$/, "Controller");
      return {
        name: controller,
        action: action,
        className: Tower.Support.String.camelize("" + controller)
      };
    };

    return DSL;

  })();

  Tower.HTTP.Route.Urls = {
    ClassMethods: {
      urlFor: function(options) {
        var action, anchor, controller, host, port;
        switch (typeof options) {
          case "string":
            return options;
          default:
            return controller = options.controller, action = options.action, host = options.host, port = options.port, anchor = options.anchor, options;
        }
      }
    }
  };

  Tower.HTTP.Route.PolymorphicUrls = {
    ClassMethods: {
      polymorphicUrl: function() {}
    }
  };

  Tower.HTTP.Route.include(Tower.HTTP.Route.Urls);

  Tower.HTTP.Route.include(Tower.HTTP.Route.PolymorphicUrls);

  Tower.HTTP.Request = (function() {

    function Request(data) {
      if (data == null) data = {};
      this.url = data.url;
      this.location = data.location;
      this.pathname = this.location.path;
      this.query = this.location.query;
      this.title = data.title;
      this.title || (this.title = typeof document !== "undefined" && document !== null ? document.title : void 0);
      this.body = data.body || {};
      this.headers = data.headers || {};
      this.method = data.method || "GET";
    }

    return Request;

  })();

  Tower.HTTP.Response = (function() {

    function Response(data) {
      if (data == null) data = {};
      this.url = data.url;
      this.location = data.location;
      this.pathname = this.location.path;
      this.query = this.location.query;
      this.title = data.title;
      this.title || (this.title = typeof document !== "undefined" && document !== null ? document.title : void 0);
      this.body = data.body || {};
      this.headers = data.headers || {};
      this.headerSent = false;
      this.statusCode = 200;
      this.body = "";
    }

    Response.prototype.writeHead = function(statusCode, headers) {
      this.statusCode = statusCode;
      return this.headers = headers;
    };

    Response.prototype.setHeader = function(key, value) {
      if (this.headerSent) throw new Error("Headers already sent");
      return this.headers[key] = value;
    };

    Response.prototype.write = function(body) {
      if (body == null) body = '';
      return this.body += body;
    };

    Response.prototype.end = function(body) {
      if (body == null) body = '';
      this.body += body;
      this.sent = true;
      return this.headerSent = true;
    };

    Response.prototype.redirect = function(path, options) {
      if (options == null) options = {};
      if (global.History) return global.History.push(options, null, path);
    };

    return Response;

  })();

  Tower.HTTP.Url = (function() {

    Url.key = ["source", "protocol", "host", "userInfo", "user", "password", "hostname", "port", "relative", "path", "directory", "file", "query", "fragment"];

    Url.aliases = {
      anchor: "fragment"
    };

    Url.parser = {
      strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
      loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
    };

    Url.querystringParser = /(?:^|&|;)([^&=;]*)=?([^&;]*)/g;

    Url.fragmentParser = /(?:^|&|;)([^&=;]*)=?([^&;]*)/g;

    Url.typeParser = /(youtube|vimeo|eventbrite)/;

    Url.prototype.parse = function(string) {
      var attributes, domains, fragment, i, key, params, parsed, value;
      key = this.constructor.key;
      string = decodeURI(string);
      parsed = this.constructor.parser[(this.strictMode || false ? "strict" : "loose")].exec(string);
      attributes = {};
      this.params = params = {};
      this.fragment = fragment = {
        params: {}
      };
      i = 14;
      while (i--) {
        attributes[key[i]] = parsed[i] || "";
      }
      attributes["query"].replace(this.constructor.querystringParser, function($0, $1, $2) {
        if ($1) return params[$1] = $2;
      });
      attributes["fragment"].replace(this.constructor.fragmentParser, function($0, $1, $2) {
        if ($1) return fragment.params[$1] = $2;
      });
      this.segments = attributes.path.replace(/^\/+|\/+$/g, "").split("/");
      fragment.segments = attributes.fragment.replace(/^\/+|\/+$/g, "").split("/");
      for (key in attributes) {
        value = attributes[key];
        this[key] || (this[key] = value);
      }
      this.root = (attributes.host ? attributes.protocol + "://" + attributes.hostname + (attributes.port ? ":" + attributes.port : "") : "");
      domains = this.hostname.split(".");
      this.domain = domains.slice(domains.length - 1 - this.depth, (domains.length - 1) + 1 || 9e9).join(".");
      this.subdomains = domains.slice(0, (domains.length - 2 - this.depth) + 1 || 9e9);
      this.subdomain = this.subdomains.join(".");
      if (this.port != null) return this.port = parseInt(this.port);
    };

    function Url(url, depth, strictMode) {
      if (depth == null) depth = 1;
      this.strictMode = strictMode || false;
      this.depth = depth || 1;
      if (typeof window !== "undefined" && window !== null) {
        this.url = url || (url = window.location.toString());
      }
      this.parse(url);
    }

    return Url;

  })();

  Tower.Middleware = {};

  Tower.Middleware.Agent = function(request, response, next) {
    var agent, attributes;
    agent = require('useragent').parse(request.headers['user-agent']);
    attributes = Tower.Support.Object.extend(require('useragent').is(request.headers['user-agent']), {
      family: agent.family,
      major: agent.major,
      minor: agent.minor,
      patch: agent.patch,
      version: agent.toVersion(),
      os: agent.os,
      name: agent.toAgent(),
      mac: !!agent.os.match(/mac/i),
      windows: !!agent.os.match(/win/i),
      linux: !!agent.os.match(/linux/i)
    });
    request.agent = new Tower.HTTP.Agent(attributes);
    if (next) return next();
  };

  Tower.Middleware.Cookies = function(request, response, next) {
    return request._cookies || (request._cookies = Tower.HTTP.Cookies.parse());
  };

  Tower.Middleware.Location = function(request, response, next) {
    var url;
    if (!request.location) {
      if (request.url.match(/^http/)) {
        url = request.url;
      } else {
        url = "http://" + request.headers.host + request.url;
      }
      request.location = new Tower.HTTP.Url(url);
    }
    return next();
  };

  Tower.Middleware.Router = function(request, response, callback) {
    Tower.Middleware.Router.find(request, response, function(controller) {
      if (controller) {
        if (response.statusCode !== 302) {
          response.controller = controller;
          response.writeHead(controller.status, controller.headers);
          response.write(controller.body);
          response.end();
        }
        return controller.clear();
      } else {
        return Tower.Middleware.Router.error(request, response);
      }
    });
    return response;
  };

  Tower.Support.Object.extend(Tower.Middleware.Router, {
    find: function(request, response, callback) {
      this.processHost(request, response);
      this.processAgent(request, response);
      return Tower.HTTP.Route.findController(request, response, callback);
    },
    processHost: function(request, response) {
      return request.location || (request.location = new Tower.HTTP.Url(request.url));
    },
    processAgent: function(request, response) {
      if (request.headers) {
        return request.userAgent || (request.userAgent = request.headers["user-agent"]);
      }
    },
    error: function(request, response) {
      if (response) {
        response.statusCode = 404;
        response.setHeader('Content-Type', 'text/plain');
        return response.end("No path matches " + request.url);
      }
    }
  });

}).call(this);


/* ===================================================
 * bootstrap-transition.js v2.0.2
 * http://twitter.github.com/bootstrap/javascript.html#transitions
 * ===================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */

!function( $ ) {

  $(function () {

    "use strict"

    /* CSS TRANSITION SUPPORT (https://gist.github.com/373874)
     * ======================================================= */

    $.support.transition = (function () {
      var thisBody = document.body || document.documentElement
        , thisStyle = thisBody.style
        , support = thisStyle.transition !== undefined || thisStyle.WebkitTransition !== undefined || thisStyle.MozTransition !== undefined || thisStyle.MsTransition !== undefined || thisStyle.OTransition !== undefined

      return support && {
        end: (function () {
          var transitionEnd = "TransitionEnd"
          if ( $.browser.webkit ) {
          	transitionEnd = "webkitTransitionEnd"
          } else if ( $.browser.mozilla ) {
          	transitionEnd = "transitionend"
          } else if ( $.browser.opera ) {
          	transitionEnd = "oTransitionEnd"
          }
          return transitionEnd
        }())
      }
    })()

  })

}( window.jQuery );

/* ==========================================================
 * bootstrap-alert.js v2.0.2
 * http://twitter.github.com/bootstrap/javascript.html#alerts
 * ==========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function( $ ){

  "use strict"

 /* ALERT CLASS DEFINITION
  * ====================== */

  var dismiss = '[data-dismiss="alert"]'
    , Alert = function ( el ) {
        $(el).on('click', dismiss, this.close)
      }

  Alert.prototype = {

    constructor: Alert

  , close: function ( e ) {
      var $this = $(this)
        , selector = $this.attr('data-target')
        , $parent

      if (!selector) {
        selector = $this.attr('href')
        selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
      }

      $parent = $(selector)
      $parent.trigger('close')

      e && e.preventDefault()

      $parent.length || ($parent = $this.hasClass('alert') ? $this : $this.parent())

      $parent
        .trigger('close')
        .removeClass('in')

      function removeElement() {
        $parent
          .trigger('closed')
          .remove()
      }

      $.support.transition && $parent.hasClass('fade') ?
        $parent.on($.support.transition.end, removeElement) :
        removeElement()
    }

  }


 /* ALERT PLUGIN DEFINITION
  * ======================= */

  $.fn.alert = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('alert')
      if (!data) $this.data('alert', (data = new Alert(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  $.fn.alert.Constructor = Alert


 /* ALERT DATA-API
  * ============== */

  $(function () {
    $('body').on('click.alert.data-api', dismiss, Alert.prototype.close)
  })

}( window.jQuery );

/* =========================================================
 * bootstrap-modal.js v2.0.2
 * http://twitter.github.com/bootstrap/javascript.html#modals
 * =========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================= */


!function( $ ){

  "use strict"

 /* MODAL CLASS DEFINITION
  * ====================== */

  var Modal = function ( content, options ) {
    this.options = options
    this.$element = $(content)
      .delegate('[data-dismiss="modal"]', 'click.dismiss.modal', $.proxy(this.hide, this))
  }

  Modal.prototype = {

      constructor: Modal

    , toggle: function () {
        return this[!this.isShown ? 'show' : 'hide']()
      }

    , show: function () {
        var that = this

        if (this.isShown) return

        $('body').addClass('modal-open')

        this.isShown = true
        this.$element.trigger('show')

        escape.call(this)
        backdrop.call(this, function () {
          var transition = $.support.transition && that.$element.hasClass('fade')

          !that.$element.parent().length && that.$element.appendTo(document.body) //don't move modals dom position

          that.$element
            .show()

          if (transition) {
            that.$element[0].offsetWidth // force reflow
          }

          that.$element.addClass('in')

          transition ?
            that.$element.one($.support.transition.end, function () { that.$element.trigger('shown') }) :
            that.$element.trigger('shown')

        })
      }

    , hide: function ( e ) {
        e && e.preventDefault()

        if (!this.isShown) return

        var that = this
        this.isShown = false

        $('body').removeClass('modal-open')

        escape.call(this)

        this.$element
          .trigger('hide')
          .removeClass('in')

        $.support.transition && this.$element.hasClass('fade') ?
          hideWithTransition.call(this) :
          hideModal.call(this)
      }

  }


 /* MODAL PRIVATE METHODS
  * ===================== */

  function hideWithTransition() {
    var that = this
      , timeout = setTimeout(function () {
          that.$element.off($.support.transition.end)
          hideModal.call(that)
        }, 500)

    this.$element.one($.support.transition.end, function () {
      clearTimeout(timeout)
      hideModal.call(that)
    })
  }

  function hideModal( that ) {
    this.$element
      .hide()
      .trigger('hidden')

    backdrop.call(this)
  }

  function backdrop( callback ) {
    var that = this
      , animate = this.$element.hasClass('fade') ? 'fade' : ''

    if (this.isShown && this.options.backdrop) {
      var doAnimate = $.support.transition && animate

      this.$backdrop = $('<div class="modal-backdrop ' + animate + '" />')
        .appendTo(document.body)

      if (this.options.backdrop != 'static') {
        this.$backdrop.click($.proxy(this.hide, this))
      }

      if (doAnimate) this.$backdrop[0].offsetWidth // force reflow

      this.$backdrop.addClass('in')

      doAnimate ?
        this.$backdrop.one($.support.transition.end, callback) :
        callback()

    } else if (!this.isShown && this.$backdrop) {
      this.$backdrop.removeClass('in')

      $.support.transition && this.$element.hasClass('fade')?
        this.$backdrop.one($.support.transition.end, $.proxy(removeBackdrop, this)) :
        removeBackdrop.call(this)

    } else if (callback) {
      callback()
    }
  }

  function removeBackdrop() {
    this.$backdrop.remove()
    this.$backdrop = null
  }

  function escape() {
    var that = this
    if (this.isShown && this.options.keyboard) {
      $(document).on('keyup.dismiss.modal', function ( e ) {
        e.which == 27 && that.hide()
      })
    } else if (!this.isShown) {
      $(document).off('keyup.dismiss.modal')
    }
  }


 /* MODAL PLUGIN DEFINITION
  * ======================= */

  $.fn.modal = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('modal')
        , options = $.extend({}, $.fn.modal.defaults, $this.data(), typeof option == 'object' && option)
      if (!data) $this.data('modal', (data = new Modal(this, options)))
      if (typeof option == 'string') data[option]()
      else if (options.show) data.show()
    })
  }

  $.fn.modal.defaults = {
      backdrop: true
    , keyboard: true
    , show: true
  }

  $.fn.modal.Constructor = Modal


 /* MODAL DATA-API
  * ============== */

  $(function () {
    $('body').on('click.modal.data-api', '[data-toggle="modal"]', function ( e ) {
      var $this = $(this), href
        , $target = $($this.attr('data-target') || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) //strip for ie7
        , option = $target.data('modal') ? 'toggle' : $.extend({}, $target.data(), $this.data())

      e.preventDefault()
      $target.modal(option)
    })
  })

}( window.jQuery );

/* ============================================================
 * bootstrap-dropdown.js v2.0.2
 * http://twitter.github.com/bootstrap/javascript.html#dropdowns
 * ============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */


!function( $ ){

  "use strict"

 /* DROPDOWN CLASS DEFINITION
  * ========================= */

  var toggle = '[data-toggle="dropdown"]'
    , Dropdown = function ( element ) {
        var $el = $(element).on('click.dropdown.data-api', this.toggle)
        $('html').on('click.dropdown.data-api', function () {
          $el.parent().removeClass('open')
        })
      }

  Dropdown.prototype = {

    constructor: Dropdown

  , toggle: function ( e ) {
      var $this = $(this)
        , selector = $this.attr('data-target')
        , $parent
        , isActive

      if (!selector) {
        selector = $this.attr('href')
        selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
      }

      $parent = $(selector)
      $parent.length || ($parent = $this.parent())

      isActive = $parent.hasClass('open')

      clearMenus()
      !isActive && $parent.toggleClass('open')

      return false
    }

  }

  function clearMenus() {
    $(toggle).parent().removeClass('open')
  }


  /* DROPDOWN PLUGIN DEFINITION
   * ========================== */

  $.fn.dropdown = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('dropdown')
      if (!data) $this.data('dropdown', (data = new Dropdown(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  $.fn.dropdown.Constructor = Dropdown


  /* APPLY TO STANDARD DROPDOWN ELEMENTS
   * =================================== */

  $(function () {
    $('html').on('click.dropdown.data-api', clearMenus)
    $('body').on('click.dropdown.data-api', toggle, Dropdown.prototype.toggle)
  })

}( window.jQuery );

/* =============================================================
 * bootstrap-scrollspy.js v2.0.2
 * http://twitter.github.com/bootstrap/javascript.html#scrollspy
 * =============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================== */

!function ( $ ) {

  "use strict"

  /* SCROLLSPY CLASS DEFINITION
   * ========================== */

  function ScrollSpy( element, options) {
    var process = $.proxy(this.process, this)
      , $element = $(element).is('body') ? $(window) : $(element)
      , href
    this.options = $.extend({}, $.fn.scrollspy.defaults, options)
    this.$scrollElement = $element.on('scroll.scroll.data-api', process)
    this.selector = (this.options.target
      || ((href = $(element).attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) //strip for ie7
      || '') + ' .nav li > a'
    this.$body = $('body').on('click.scroll.data-api', this.selector, process)
    this.refresh()
    this.process()
  }

  ScrollSpy.prototype = {

      constructor: ScrollSpy

    , refresh: function () {
        this.targets = this.$body
          .find(this.selector)
          .map(function () {
            var href = $(this).attr('href')
            return /^#\w/.test(href) && $(href).length ? href : null
          })

        this.offsets = $.map(this.targets, function (id) {
          return $(id).position().top
        })
      }

    , process: function () {
        var scrollTop = this.$scrollElement.scrollTop() + this.options.offset
          , offsets = this.offsets
          , targets = this.targets
          , activeTarget = this.activeTarget
          , i

        for (i = offsets.length; i--;) {
          activeTarget != targets[i]
            && scrollTop >= offsets[i]
            && (!offsets[i + 1] || scrollTop <= offsets[i + 1])
            && this.activate( targets[i] )
        }
      }

    , activate: function (target) {
        var active

        this.activeTarget = target

        this.$body
          .find(this.selector).parent('.active')
          .removeClass('active')

        active = this.$body
          .find(this.selector + '[href="' + target + '"]')
          .parent('li')
          .addClass('active')

        if ( active.parent('.dropdown-menu') )  {
          active.closest('li.dropdown').addClass('active')
        }
      }

  }


 /* SCROLLSPY PLUGIN DEFINITION
  * =========================== */

  $.fn.scrollspy = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('scrollspy')
        , options = typeof option == 'object' && option
      if (!data) $this.data('scrollspy', (data = new ScrollSpy(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.scrollspy.Constructor = ScrollSpy

  $.fn.scrollspy.defaults = {
    offset: 10
  }


 /* SCROLLSPY DATA-API
  * ================== */

  $(function () {
    $('[data-spy="scroll"]').each(function () {
      var $spy = $(this)
      $spy.scrollspy($spy.data())
    })
  })

}( window.jQuery );

/* ========================================================
 * bootstrap-tab.js v2.0.2
 * http://twitter.github.com/bootstrap/javascript.html#tabs
 * ========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ======================================================== */


!function( $ ){

  "use strict"

 /* TAB CLASS DEFINITION
  * ==================== */

  var Tab = function ( element ) {
    this.element = $(element)
  }

  Tab.prototype = {

    constructor: Tab

  , show: function () {
      var $this = this.element
        , $ul = $this.closest('ul:not(.dropdown-menu)')
        , selector = $this.attr('data-target')
        , previous
        , $target

      if (!selector) {
        selector = $this.attr('href')
        selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
      }

      if ( $this.parent('li').hasClass('active') ) return

      previous = $ul.find('.active a').last()[0]

      $this.trigger({
        type: 'show'
      , relatedTarget: previous
      })

      $target = $(selector)

      this.activate($this.parent('li'), $ul)
      this.activate($target, $target.parent(), function () {
        $this.trigger({
          type: 'shown'
        , relatedTarget: previous
        })
      })
    }

  , activate: function ( element, container, callback) {
      var $active = container.find('> .active')
        , transition = callback
            && $.support.transition
            && $active.hasClass('fade')

      function next() {
        $active
          .removeClass('active')
          .find('> .dropdown-menu > .active')
          .removeClass('active')

        element.addClass('active')

        if (transition) {
          element[0].offsetWidth // reflow for transition
          element.addClass('in')
        } else {
          element.removeClass('fade')
        }

        if ( element.parent('.dropdown-menu') ) {
          element.closest('li.dropdown').addClass('active')
        }

        callback && callback()
      }

      transition ?
        $active.one($.support.transition.end, next) :
        next()

      $active.removeClass('in')
    }
  }


 /* TAB PLUGIN DEFINITION
  * ===================== */

  $.fn.tab = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('tab')
      if (!data) $this.data('tab', (data = new Tab(this)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.tab.Constructor = Tab


 /* TAB DATA-API
  * ============ */

  $(function () {
    $('body').on('click.tab.data-api', '[data-toggle="tab"], [data-toggle="pill"]', function (e) {
      e.preventDefault()
      $(this).tab('show')
    })
  })

}( window.jQuery );

/* ===========================================================
 * bootstrap-tooltip.js v2.0.2
 * http://twitter.github.com/bootstrap/javascript.html#tooltips
 * Inspired by the original jQuery.tipsy by Jason Frame
 * ===========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */

!function( $ ) {

  "use strict"

 /* TOOLTIP PUBLIC CLASS DEFINITION
  * =============================== */

  var Tooltip = function ( element, options ) {
    this.init('tooltip', element, options)
  }

  Tooltip.prototype = {

    constructor: Tooltip

  , init: function ( type, element, options ) {
      var eventIn
        , eventOut

      this.type = type
      this.$element = $(element)
      this.options = this.getOptions(options)
      this.enabled = true

      if (this.options.trigger != 'manual') {
        eventIn  = this.options.trigger == 'hover' ? 'mouseenter' : 'focus'
        eventOut = this.options.trigger == 'hover' ? 'mouseleave' : 'blur'
        this.$element.on(eventIn, this.options.selector, $.proxy(this.enter, this))
        this.$element.on(eventOut, this.options.selector, $.proxy(this.leave, this))
      }

      this.options.selector ?
        (this._options = $.extend({}, this.options, { trigger: 'manual', selector: '' })) :
        this.fixTitle()
    }

  , getOptions: function ( options ) {
      options = $.extend({}, $.fn[this.type].defaults, options, this.$element.data())

      if (options.delay && typeof options.delay == 'number') {
        options.delay = {
          show: options.delay
        , hide: options.delay
        }
      }

      return options
    }

  , enter: function ( e ) {
      var self = $(e.currentTarget)[this.type](this._options).data(this.type)

      if (!self.options.delay || !self.options.delay.show) {
        self.show()
      } else {
        self.hoverState = 'in'
        setTimeout(function() {
          if (self.hoverState == 'in') {
            self.show()
          }
        }, self.options.delay.show)
      }
    }

  , leave: function ( e ) {
      var self = $(e.currentTarget)[this.type](this._options).data(this.type)

      if (!self.options.delay || !self.options.delay.hide) {
        self.hide()
      } else {
        self.hoverState = 'out'
        setTimeout(function() {
          if (self.hoverState == 'out') {
            self.hide()
          }
        }, self.options.delay.hide)
      }
    }

  , show: function () {
      var $tip
        , inside
        , pos
        , actualWidth
        , actualHeight
        , placement
        , tp

      if (this.hasContent() && this.enabled) {
        $tip = this.tip()
        this.setContent()

        if (this.options.animation) {
          $tip.addClass('fade')
        }

        placement = typeof this.options.placement == 'function' ?
          this.options.placement.call(this, $tip[0], this.$element[0]) :
          this.options.placement

        inside = /in/.test(placement)

        $tip
          .remove()
          .css({ top: 0, left: 0, display: 'block' })
          .appendTo(inside ? this.$element : document.body)

        pos = this.getPosition(inside)

        actualWidth = $tip[0].offsetWidth
        actualHeight = $tip[0].offsetHeight

        switch (inside ? placement.split(' ')[1] : placement) {
          case 'bottom':
            tp = {top: pos.top + pos.height, left: pos.left + pos.width / 2 - actualWidth / 2}
            break
          case 'top':
            tp = {top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2}
            break
          case 'left':
            tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth}
            break
          case 'right':
            tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width}
            break
        }

        $tip
          .css(tp)
          .addClass(placement)
          .addClass('in')
      }
    }

  , setContent: function () {
      var $tip = this.tip()
      $tip.find('.tooltip-inner').html(this.getTitle())
      $tip.removeClass('fade in top bottom left right')
    }

  , hide: function () {
      var that = this
        , $tip = this.tip()

      $tip.removeClass('in')

      function removeWithAnimation() {
        var timeout = setTimeout(function () {
          $tip.off($.support.transition.end).remove()
        }, 500)

        $tip.one($.support.transition.end, function () {
          clearTimeout(timeout)
          $tip.remove()
        })
      }

      $.support.transition && this.$tip.hasClass('fade') ?
        removeWithAnimation() :
        $tip.remove()
    }

  , fixTitle: function () {
      var $e = this.$element
      if ($e.attr('title') || typeof($e.attr('data-original-title')) != 'string') {
        $e.attr('data-original-title', $e.attr('title') || '').removeAttr('title')
      }
    }

  , hasContent: function () {
      return this.getTitle()
    }

  , getPosition: function (inside) {
      return $.extend({}, (inside ? {top: 0, left: 0} : this.$element.offset()), {
        width: this.$element[0].offsetWidth
      , height: this.$element[0].offsetHeight
      })
    }

  , getTitle: function () {
      var title
        , $e = this.$element
        , o = this.options

      title = $e.attr('data-original-title')
        || (typeof o.title == 'function' ? o.title.call($e[0]) :  o.title)

      title = (title || '').toString().replace(/(^\s*|\s*$)/, "")

      return title
    }

  , tip: function () {
      return this.$tip = this.$tip || $(this.options.template)
    }

  , validate: function () {
      if (!this.$element[0].parentNode) {
        this.hide()
        this.$element = null
        this.options = null
      }
    }

  , enable: function () {
      this.enabled = true
    }

  , disable: function () {
      this.enabled = false
    }

  , toggleEnabled: function () {
      this.enabled = !this.enabled
    }

  , toggle: function () {
      this[this.tip().hasClass('in') ? 'hide' : 'show']()
    }

  }


 /* TOOLTIP PLUGIN DEFINITION
  * ========================= */

  $.fn.tooltip = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('tooltip')
        , options = typeof option == 'object' && option
      if (!data) $this.data('tooltip', (data = new Tooltip(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.tooltip.Constructor = Tooltip

  $.fn.tooltip.defaults = {
    animation: true
  , delay: 0
  , selector: false
  , placement: 'top'
  , trigger: 'hover'
  , title: ''
  , template: '<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'
  }

}( window.jQuery );

/* ===========================================================
 * bootstrap-popover.js v2.0.2
 * http://twitter.github.com/bootstrap/javascript.html#popovers
 * ===========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =========================================================== */


!function( $ ) {

 "use strict"

  var Popover = function ( element, options ) {
    this.init('popover', element, options)
  }

  /* NOTE: POPOVER EXTENDS BOOTSTRAP-TOOLTIP.js
     ========================================== */

  Popover.prototype = $.extend({}, $.fn.tooltip.Constructor.prototype, {

    constructor: Popover

  , setContent: function () {
      var $tip = this.tip()
        , title = this.getTitle()
        , content = this.getContent()

      $tip.find('.popover-title')[ $.type(title) == 'object' ? 'append' : 'html' ](title)
      $tip.find('.popover-content > *')[ $.type(content) == 'object' ? 'append' : 'html' ](content)

      $tip.removeClass('fade top bottom left right in')
    }

  , hasContent: function () {
      return this.getTitle() || this.getContent()
    }

  , getContent: function () {
      var content
        , $e = this.$element
        , o = this.options

      content = $e.attr('data-content')
        || (typeof o.content == 'function' ? o.content.call($e[0]) :  o.content)

      content = content.toString().replace(/(^\s*|\s*$)/, "")

      return content
    }

  , tip: function() {
      if (!this.$tip) {
        this.$tip = $(this.options.template)
      }
      return this.$tip
    }

  })


 /* POPOVER PLUGIN DEFINITION
  * ======================= */

  $.fn.popover = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('popover')
        , options = typeof option == 'object' && option
      if (!data) $this.data('popover', (data = new Popover(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.popover.Constructor = Popover

  $.fn.popover.defaults = $.extend({} , $.fn.tooltip.defaults, {
    placement: 'right'
  , content: ''
  , template: '<div class="popover"><div class="arrow"></div><div class="popover-inner"><h3 class="popover-title"></h3><div class="popover-content"><p></p></div></div></div>'
  })

}( window.jQuery );

/* ============================================================
 * bootstrap-button.js v2.0.2
 * http://twitter.github.com/bootstrap/javascript.html#buttons
 * ============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */

!function( $ ){

  "use strict"

 /* BUTTON PUBLIC CLASS DEFINITION
  * ============================== */

  var Button = function ( element, options ) {
    this.$element = $(element)
    this.options = $.extend({}, $.fn.button.defaults, options)
  }

  Button.prototype = {

      constructor: Button

    , setState: function ( state ) {
        var d = 'disabled'
          , $el = this.$element
          , data = $el.data()
          , val = $el.is('input') ? 'val' : 'html'

        state = state + 'Text'
        data.resetText || $el.data('resetText', $el[val]())

        $el[val](data[state] || this.options[state])

        // push to event loop to allow forms to submit
        setTimeout(function () {
          state == 'loadingText' ?
            $el.addClass(d).attr(d, d) :
            $el.removeClass(d).removeAttr(d)
        }, 0)
      }

    , toggle: function () {
        var $parent = this.$element.parent('[data-toggle="buttons-radio"]')

        $parent && $parent
          .find('.active')
          .removeClass('active')

        this.$element.toggleClass('active')
      }

  }


 /* BUTTON PLUGIN DEFINITION
  * ======================== */

  $.fn.button = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('button')
        , options = typeof option == 'object' && option
      if (!data) $this.data('button', (data = new Button(this, options)))
      if (option == 'toggle') data.toggle()
      else if (option) data.setState(option)
    })
  }

  $.fn.button.defaults = {
    loadingText: 'loading...'
  }

  $.fn.button.Constructor = Button


 /* BUTTON DATA-API
  * =============== */

  $(function () {
    $('body').on('click.button.data-api', '[data-toggle^=button]', function ( e ) {
      var $btn = $(e.target)
      if (!$btn.hasClass('btn')) $btn = $btn.closest('.btn')
      $btn.button('toggle')
    })
  })

}( window.jQuery );

/* =============================================================
 * bootstrap-collapse.js v2.0.2
 * http://twitter.github.com/bootstrap/javascript.html#collapse
 * =============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */

!function( $ ){

  "use strict"

  var Collapse = function ( element, options ) {
  	this.$element = $(element)
    this.options = $.extend({}, $.fn.collapse.defaults, options)

    if (this.options["parent"]) {
      this.$parent = $(this.options["parent"])
    }

    this.options.toggle && this.toggle()
  }

  Collapse.prototype = {

    constructor: Collapse

  , dimension: function () {
      var hasWidth = this.$element.hasClass('width')
      return hasWidth ? 'width' : 'height'
    }

  , show: function () {
      var dimension = this.dimension()
        , scroll = $.camelCase(['scroll', dimension].join('-'))
        , actives = this.$parent && this.$parent.find('.in')
        , hasData

      if (actives && actives.length) {
        hasData = actives.data('collapse')
        actives.collapse('hide')
        hasData || actives.data('collapse', null)
      }

      this.$element[dimension](0)
      this.transition('addClass', 'show', 'shown')
      this.$element[dimension](this.$element[0][scroll])

    }

  , hide: function () {
      var dimension = this.dimension()
      this.reset(this.$element[dimension]())
      this.transition('removeClass', 'hide', 'hidden')
      this.$element[dimension](0)
    }

  , reset: function ( size ) {
      var dimension = this.dimension()

      this.$element
        .removeClass('collapse')
        [dimension](size || 'auto')
        [0].offsetWidth

      this.$element[size ? 'addClass' : 'removeClass']('collapse')

      return this
    }

  , transition: function ( method, startEvent, completeEvent ) {
      var that = this
        , complete = function () {
            if (startEvent == 'show') that.reset()
            that.$element.trigger(completeEvent)
          }

      this.$element
        .trigger(startEvent)
        [method]('in')

      $.support.transition && this.$element.hasClass('collapse') ?
        this.$element.one($.support.transition.end, complete) :
        complete()
  	}

  , toggle: function () {
      this[this.$element.hasClass('in') ? 'hide' : 'show']()
  	}

  }

  /* COLLAPSIBLE PLUGIN DEFINITION
  * ============================== */

  $.fn.collapse = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('collapse')
        , options = typeof option == 'object' && option
      if (!data) $this.data('collapse', (data = new Collapse(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.collapse.defaults = {
    toggle: true
  }

  $.fn.collapse.Constructor = Collapse


 /* COLLAPSIBLE DATA-API
  * ==================== */

  $(function () {
    $('body').on('click.collapse.data-api', '[data-toggle=collapse]', function ( e ) {
      var $this = $(this), href
        , target = $this.attr('data-target')
          || e.preventDefault()
          || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '') //strip for ie7
        , option = $(target).data('collapse') ? 'toggle' : $this.data()
      $(target).collapse(option)
    })
  })

}( window.jQuery );

/* ==========================================================
 * bootstrap-carousel.js v2.0.2
 * http://twitter.github.com/bootstrap/javascript.html#carousel
 * ==========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function( $ ){

  "use strict"

 /* CAROUSEL CLASS DEFINITION
  * ========================= */

  var Carousel = function (element, options) {
    this.$element = $(element)
    this.options = $.extend({}, $.fn.carousel.defaults, options)
    this.options.slide && this.slide(this.options.slide)
    this.options.pause == 'hover' && this.$element
      .on('mouseenter', $.proxy(this.pause, this))
      .on('mouseleave', $.proxy(this.cycle, this))
  }

  Carousel.prototype = {

    cycle: function () {
      this.interval = setInterval($.proxy(this.next, this), this.options.interval)
      return this
    }

  , to: function (pos) {
      var $active = this.$element.find('.active')
        , children = $active.parent().children()
        , activePos = children.index($active)
        , that = this

      if (pos > (children.length - 1) || pos < 0) return

      if (this.sliding) {
        return this.$element.one('slid', function () {
          that.to(pos)
        })
      }

      if (activePos == pos) {
        return this.pause().cycle()
      }

      return this.slide(pos > activePos ? 'next' : 'prev', $(children[pos]))
    }

  , pause: function () {
      clearInterval(this.interval)
      this.interval = null
      return this
    }

  , next: function () {
      if (this.sliding) return
      return this.slide('next')
    }

  , prev: function () {
      if (this.sliding) return
      return this.slide('prev')
    }

  , slide: function (type, next) {
      var $active = this.$element.find('.active')
        , $next = next || $active[type]()
        , isCycling = this.interval
        , direction = type == 'next' ? 'left' : 'right'
        , fallback  = type == 'next' ? 'first' : 'last'
        , that = this

      this.sliding = true

      isCycling && this.pause()

      $next = $next.length ? $next : this.$element.find('.item')[fallback]()

      if ($next.hasClass('active')) return

      if (!$.support.transition && this.$element.hasClass('slide')) {
        this.$element.trigger('slide')
        $active.removeClass('active')
        $next.addClass('active')
        this.sliding = false
        this.$element.trigger('slid')
      } else {
        $next.addClass(type)
        $next[0].offsetWidth // force reflow
        $active.addClass(direction)
        $next.addClass(direction)
        this.$element.trigger('slide')
        this.$element.one($.support.transition.end, function () {
          $next.removeClass([type, direction].join(' ')).addClass('active')
          $active.removeClass(['active', direction].join(' '))
          that.sliding = false
          setTimeout(function () { that.$element.trigger('slid') }, 0)
        })
      }

      isCycling && this.cycle()

      return this
    }

  }


 /* CAROUSEL PLUGIN DEFINITION
  * ========================== */

  $.fn.carousel = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('carousel')
        , options = typeof option == 'object' && option
      if (!data) $this.data('carousel', (data = new Carousel(this, options)))
      if (typeof option == 'number') data.to(option)
      else if (typeof option == 'string' || (option = options.slide)) data[option]()
      else data.cycle()
    })
  }

  $.fn.carousel.defaults = {
    interval: 5000
  , pause: 'hover'
  }

  $.fn.carousel.Constructor = Carousel


 /* CAROUSEL DATA-API
  * ================= */

  $(function () {
    $('body').on('click.carousel.data-api', '[data-slide]', function ( e ) {
      var $this = $(this), href
        , $target = $($this.attr('data-target') || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) //strip for ie7
        , options = !$target.data('modal') && $.extend({}, $target.data(), $this.data())
      $target.carousel(options)
      e.preventDefault()
    })
  })

}( window.jQuery );

/* =============================================================
 * bootstrap-typeahead.js v2.0.2
 * http://twitter.github.com/bootstrap/javascript.html#typeahead
 * =============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */

!function( $ ){

  "use strict"

  var Typeahead = function ( element, options ) {
    this.$element = $(element)
    this.options = $.extend({}, $.fn.typeahead.defaults, options)
    this.matcher = this.options.matcher || this.matcher
    this.sorter = this.options.sorter || this.sorter
    this.highlighter = this.options.highlighter || this.highlighter
    this.$menu = $(this.options.menu).appendTo('body')
    this.source = this.options.source
    this.shown = false
    this.listen()
  }

  Typeahead.prototype = {

    constructor: Typeahead

  , select: function () {
      var val = this.$menu.find('.active').attr('data-value')
      this.$element.val(val)
      this.$element.change();
      return this.hide()
    }

  , show: function () {
      var pos = $.extend({}, this.$element.offset(), {
        height: this.$element[0].offsetHeight
      })

      this.$menu.css({
        top: pos.top + pos.height
      , left: pos.left
      })

      this.$menu.show()
      this.shown = true
      return this
    }

  , hide: function () {
      this.$menu.hide()
      this.shown = false
      return this
    }

  , lookup: function (event) {
      var that = this
        , items
        , q

      this.query = this.$element.val()

      if (!this.query) {
        return this.shown ? this.hide() : this
      }

      items = $.grep(this.source, function (item) {
        if (that.matcher(item)) return item
      })

      items = this.sorter(items)

      if (!items.length) {
        return this.shown ? this.hide() : this
      }

      return this.render(items.slice(0, this.options.items)).show()
    }

  , matcher: function (item) {
      return ~item.toLowerCase().indexOf(this.query.toLowerCase())
    }

  , sorter: function (items) {
      var beginswith = []
        , caseSensitive = []
        , caseInsensitive = []
        , item

      while (item = items.shift()) {
        if (!item.toLowerCase().indexOf(this.query.toLowerCase())) beginswith.push(item)
        else if (~item.indexOf(this.query)) caseSensitive.push(item)
        else caseInsensitive.push(item)
      }

      return beginswith.concat(caseSensitive, caseInsensitive)
    }

  , highlighter: function (item) {
      return item.replace(new RegExp('(' + this.query + ')', 'ig'), function ($1, match) {
        return '<strong>' + match + '</strong>'
      })
    }

  , render: function (items) {
      var that = this

      items = $(items).map(function (i, item) {
        i = $(that.options.item).attr('data-value', item)
        i.find('a').html(that.highlighter(item))
        return i[0]
      })

      items.first().addClass('active')
      this.$menu.html(items)
      return this
    }

  , next: function (event) {
      var active = this.$menu.find('.active').removeClass('active')
        , next = active.next()

      if (!next.length) {
        next = $(this.$menu.find('li')[0])
      }

      next.addClass('active')
    }

  , prev: function (event) {
      var active = this.$menu.find('.active').removeClass('active')
        , prev = active.prev()

      if (!prev.length) {
        prev = this.$menu.find('li').last()
      }

      prev.addClass('active')
    }

  , listen: function () {
      this.$element
        .on('blur',     $.proxy(this.blur, this))
        .on('keypress', $.proxy(this.keypress, this))
        .on('keyup',    $.proxy(this.keyup, this))

      if ($.browser.webkit || $.browser.msie) {
        this.$element.on('keydown', $.proxy(this.keypress, this))
      }

      this.$menu
        .on('click', $.proxy(this.click, this))
        .on('mouseenter', 'li', $.proxy(this.mouseenter, this))
    }

  , keyup: function (e) {
      switch(e.keyCode) {
        case 40: // down arrow
        case 38: // up arrow
          break

        case 9: // tab
        case 13: // enter
          if (!this.shown) return
          this.select()
          break

        case 27: // escape
          if (!this.shown) return
          this.hide()
          break

        default:
          this.lookup()
      }

      e.stopPropagation()
      e.preventDefault()
  }

  , keypress: function (e) {
      if (!this.shown) return

      switch(e.keyCode) {
        case 9: // tab
        case 13: // enter
        case 27: // escape
          e.preventDefault()
          break

        case 38: // up arrow
          e.preventDefault()
          this.prev()
          break

        case 40: // down arrow
          e.preventDefault()
          this.next()
          break
      }

      e.stopPropagation()
    }

  , blur: function (e) {
      var that = this
      setTimeout(function () { that.hide() }, 150)
    }

  , click: function (e) {
      e.stopPropagation()
      e.preventDefault()
      this.select()
    }

  , mouseenter: function (e) {
      this.$menu.find('.active').removeClass('active')
      $(e.currentTarget).addClass('active')
    }

  }


  /* TYPEAHEAD PLUGIN DEFINITION
   * =========================== */

  $.fn.typeahead = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('typeahead')
        , options = typeof option == 'object' && option
      if (!data) $this.data('typeahead', (data = new Typeahead(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.typeahead.defaults = {
    source: []
  , items: 8
  , menu: '<ul class="typeahead dropdown-menu"></ul>'
  , item: '<li><a href="#"></a></li>'
  }

  $.fn.typeahead.Constructor = Typeahead


 /* TYPEAHEAD DATA-API
  * ================== */

  $(function () {
    $('body').on('focus.typeahead.data-api', '[data-provide="typeahead"]', function (e) {
      var $this = $(this)
      if ($this.data('typeahead')) return
      e.preventDefault()
      $this.typeahead($this.data())
    })
  })

}( window.jQuery );

