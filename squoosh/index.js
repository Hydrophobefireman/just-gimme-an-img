import { p as preprocessors, c as codecs } from '../public/squoosh/codecs-cf5f19af.js';

function assertPath(path) {
  if (typeof path !== 'string') {
    throw new TypeError('Path must be a string. Received ' + JSON.stringify(path));
  }
}

function normalizeStringPosix(path, allowAboveRoot) {
  var res = '';
  var lastSegmentLength = 0;
  var lastSlash = -1;
  var dots = 0;
  var code;

  for (var i = 0; i <= path.length; ++i) {
    if (i < path.length) code = path.charCodeAt(i);else if (code === 47) break;else code = 47;

    if (code === 47) {
        if (lastSlash === i - 1 || dots === 1) ;else if (lastSlash !== i - 1 && dots === 2) {
          if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
              if (res.length > 2) {
                var lastSlashIndex = res.lastIndexOf('/');

                if (lastSlashIndex !== res.length - 1) {
                  if (lastSlashIndex === -1) {
                    res = '';
                    lastSegmentLength = 0;
                  } else {
                    res = res.slice(0, lastSlashIndex);
                    lastSegmentLength = res.length - 1 - res.lastIndexOf('/');
                  }

                  lastSlash = i;
                  dots = 0;
                  continue;
                }
              } else if (res.length === 2 || res.length === 1) {
                res = '';
                lastSegmentLength = 0;
                lastSlash = i;
                dots = 0;
                continue;
              }
            }

          if (allowAboveRoot) {
            if (res.length > 0) res += '/..';else res = '..';
            lastSegmentLength = 2;
          }
        } else {
          if (res.length > 0) res += '/' + path.slice(lastSlash + 1, i);else res = path.slice(lastSlash + 1, i);
          lastSegmentLength = i - lastSlash - 1;
        }
        lastSlash = i;
        dots = 0;
      } else if (code === 46 && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }

  return res;
}

function _format(sep, pathObject) {
  var dir = pathObject.dir || pathObject.root;
  var base = pathObject.base || (pathObject.name || '') + (pathObject.ext || '');

  if (!dir) {
    return base;
  }

  if (dir === pathObject.root) {
    return dir + base;
  }

  return dir + sep + base;
}

var posix = {
  resolve: function resolve() {
    var resolvedPath = '';
    var resolvedAbsolute = false;
    var cwd;

    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path;
      if (i >= 0) path = arguments[i];else {
        if (cwd === undefined) cwd = process.cwd();
        path = cwd;
      }
      assertPath(path);

      if (path.length === 0) {
        continue;
      }

      resolvedPath = path + '/' + resolvedPath;
      resolvedAbsolute = path.charCodeAt(0) === 47;
    }

    resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);

    if (resolvedAbsolute) {
      if (resolvedPath.length > 0) return '/' + resolvedPath;else return '/';
    } else if (resolvedPath.length > 0) {
      return resolvedPath;
    } else {
      return '.';
    }
  },
  normalize: function normalize(path) {
    assertPath(path);
    if (path.length === 0) return '.';
    var isAbsolute = path.charCodeAt(0) === 47;
    var trailingSeparator = path.charCodeAt(path.length - 1) === 47;
    path = normalizeStringPosix(path, !isAbsolute);
    if (path.length === 0 && !isAbsolute) path = '.';
    if (path.length > 0 && trailingSeparator) path += '/';
    if (isAbsolute) return '/' + path;
    return path;
  },
  isAbsolute: function isAbsolute(path) {
    assertPath(path);
    return path.length > 0 && path.charCodeAt(0) === 47;
  },
  join: function join() {
    if (arguments.length === 0) return '.';
    var joined;

    for (var i = 0; i < arguments.length; ++i) {
      var arg = arguments[i];
      assertPath(arg);

      if (arg.length > 0) {
        if (joined === undefined) joined = arg;else joined += '/' + arg;
      }
    }

    if (joined === undefined) return '.';
    return posix.normalize(joined);
  },
  relative: function relative(from, to) {
    assertPath(from);
    assertPath(to);
    if (from === to) return '';
    from = posix.resolve(from);
    to = posix.resolve(to);
    if (from === to) return '';
    var fromStart = 1;

    for (; fromStart < from.length; ++fromStart) {
      if (from.charCodeAt(fromStart) !== 47) break;
    }

    var fromEnd = from.length;
    var fromLen = fromEnd - fromStart;
    var toStart = 1;

    for (; toStart < to.length; ++toStart) {
      if (to.charCodeAt(toStart) !== 47) break;
    }

    var toEnd = to.length;
    var toLen = toEnd - toStart;
    var length = fromLen < toLen ? fromLen : toLen;
    var lastCommonSep = -1;
    var i = 0;

    for (; i <= length; ++i) {
      if (i === length) {
        if (toLen > length) {
          if (to.charCodeAt(toStart + i) === 47) {
              return to.slice(toStart + i + 1);
            } else if (i === 0) {
            return to.slice(toStart + i);
          }
        } else if (fromLen > length) {
          if (from.charCodeAt(fromStart + i) === 47) {
              lastCommonSep = i;
            } else if (i === 0) {
            lastCommonSep = 0;
          }
        }

        break;
      }

      var fromCode = from.charCodeAt(fromStart + i);
      var toCode = to.charCodeAt(toStart + i);
      if (fromCode !== toCode) break;else if (fromCode === 47) lastCommonSep = i;
    }

    var out = '';

    for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
      if (i === fromEnd || from.charCodeAt(i) === 47) {
          if (out.length === 0) out += '..';else out += '/..';
        }
    }

    if (out.length > 0) return out + to.slice(toStart + lastCommonSep);else {
      toStart += lastCommonSep;
      if (to.charCodeAt(toStart) === 47) ++toStart;
      return to.slice(toStart);
    }
  },
  _makeLong: function _makeLong(path) {
    return path;
  },
  dirname: function dirname(path) {
    assertPath(path);
    if (path.length === 0) return '.';
    var code = path.charCodeAt(0);
    var hasRoot = code === 47;
    var end = -1;
    var matchedSlash = true;

    for (var i = path.length - 1; i >= 1; --i) {
      code = path.charCodeAt(i);

      if (code === 47) {
          if (!matchedSlash) {
            end = i;
            break;
          }
        } else {
        matchedSlash = false;
      }
    }

    if (end === -1) return hasRoot ? '/' : '.';
    if (hasRoot && end === 1) return '//';
    return path.slice(0, end);
  },
  basename: function basename(path, ext) {
    if (ext !== undefined && typeof ext !== 'string') throw new TypeError('"ext" argument must be a string');
    assertPath(path);
    var start = 0;
    var end = -1;
    var matchedSlash = true;
    var i;

    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
      if (ext.length === path.length && ext === path) return '';
      var extIdx = ext.length - 1;
      var firstNonSlashEnd = -1;

      for (i = path.length - 1; i >= 0; --i) {
        var code = path.charCodeAt(i);

        if (code === 47) {
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else {
          if (firstNonSlashEnd === -1) {
            matchedSlash = false;
            firstNonSlashEnd = i + 1;
          }

          if (extIdx >= 0) {
            if (code === ext.charCodeAt(extIdx)) {
              if (--extIdx === -1) {
                end = i;
              }
            } else {
              extIdx = -1;
              end = firstNonSlashEnd;
            }
          }
        }
      }

      if (start === end) end = firstNonSlashEnd;else if (end === -1) end = path.length;
      return path.slice(start, end);
    } else {
      for (i = path.length - 1; i >= 0; --i) {
        if (path.charCodeAt(i) === 47) {
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else if (end === -1) {
          matchedSlash = false;
          end = i + 1;
        }
      }

      if (end === -1) return '';
      return path.slice(start, end);
    }
  },
  extname: function extname(path) {
    assertPath(path);
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    var preDotState = 0;

    for (var i = path.length - 1; i >= 0; --i) {
      var code = path.charCodeAt(i);

      if (code === 47) {
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }

          continue;
        }

      if (end === -1) {
        matchedSlash = false;
        end = i + 1;
      }

      if (code === 46) {
          if (startDot === -1) startDot = i;else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
        preDotState = -1;
      }
    }

    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      return '';
    }

    return path.slice(startDot, end);
  },
  format: function format(pathObject) {
    if (pathObject === null || typeof pathObject !== 'object') {
      throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof pathObject);
    }

    return _format('/', pathObject);
  },
  parse: function parse(path) {
    assertPath(path);
    var ret = {
      root: '',
      dir: '',
      base: '',
      ext: '',
      name: ''
    };
    if (path.length === 0) return ret;
    var code = path.charCodeAt(0);
    var isAbsolute = code === 47;
    var start;

    if (isAbsolute) {
      ret.root = '/';
      start = 1;
    } else {
      start = 0;
    }

    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    var i = path.length - 1;
    var preDotState = 0;

    for (; i >= start; --i) {
      code = path.charCodeAt(i);

      if (code === 47) {
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }

          continue;
        }

      if (end === -1) {
        matchedSlash = false;
        end = i + 1;
      }

      if (code === 46) {
          if (startDot === -1) startDot = i;else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
        preDotState = -1;
      }
    }

    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      if (end !== -1) {
        if (startPart === 0 && isAbsolute) ret.base = ret.name = path.slice(1, end);else ret.base = ret.name = path.slice(startPart, end);
      }
    } else {
      if (startPart === 0 && isAbsolute) {
        ret.name = path.slice(1, startDot);
        ret.base = path.slice(1, end);
      } else {
        ret.name = path.slice(startPart, startDot);
        ret.base = path.slice(startPart, end);
      }

      ret.ext = path.slice(startDot, end);
    }

    if (startPart > 0) ret.dir = path.slice(0, startPart - 1);else if (isAbsolute) ret.dir = '/';
    return ret;
  },
  sep: '/',
  delimiter: ':',
  win32: null,
  posix: null
};
posix.posix = posix;
var pathBrowserify = posix;
var SymbolPolyfill = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol' ? Symbol : function (description) {
  return "Symbol(" + description + ")";
};

function noop() {}

function getGlobals() {
  if (typeof self !== 'undefined') {
    return self;
  } else if (typeof window !== 'undefined') {
    return window;
  } else if (typeof global !== 'undefined') {
    return global;
  }

  return undefined;
}

var globals = getGlobals();

function typeIsObject(x) {
  return typeof x === 'object' && x !== null || typeof x === 'function';
}

var rethrowAssertionErrorRejection = noop;
var originalPromise = Promise;
var originalPromiseThen = Promise.prototype.then;
var originalPromiseResolve = Promise.resolve.bind(originalPromise);
var originalPromiseReject = Promise.reject.bind(originalPromise);

function newPromise(executor) {
  return new originalPromise(executor);
}

function promiseResolvedWith(value) {
  return originalPromiseResolve(value);
}

function promiseRejectedWith(reason) {
  return originalPromiseReject(reason);
}

function PerformPromiseThen(promise, onFulfilled, onRejected) {
  return originalPromiseThen.call(promise, onFulfilled, onRejected);
}

function uponPromise(promise, onFulfilled, onRejected) {
  PerformPromiseThen(PerformPromiseThen(promise, onFulfilled, onRejected), undefined, rethrowAssertionErrorRejection);
}

function uponFulfillment(promise, onFulfilled) {
  uponPromise(promise, onFulfilled);
}

function uponRejection(promise, onRejected) {
  uponPromise(promise, undefined, onRejected);
}

function transformPromiseWith(promise, fulfillmentHandler, rejectionHandler) {
  return PerformPromiseThen(promise, fulfillmentHandler, rejectionHandler);
}

function setPromiseIsHandledToTrue(promise) {
  PerformPromiseThen(promise, undefined, rethrowAssertionErrorRejection);
}

var queueMicrotask = function () {
  var globalQueueMicrotask = globals && globals.queueMicrotask;

  if (typeof globalQueueMicrotask === 'function') {
    return globalQueueMicrotask;
  }

  var resolvedPromise = promiseResolvedWith(undefined);
  return function (fn) {
    return PerformPromiseThen(resolvedPromise, fn);
  };
}();

function reflectCall(F, V, args) {
  if (typeof F !== 'function') {
    throw new TypeError('Argument is not a function');
  }

  return Function.prototype.apply.call(F, V, args);
}

function promiseCall(F, V, args) {
  try {
    return promiseResolvedWith(reflectCall(F, V, args));
  } catch (value) {
    return promiseRejectedWith(value);
  }
}

var QUEUE_MAX_ARRAY_SIZE = 16384;

var SimpleQueue = function () {
  function SimpleQueue() {
    this._cursor = 0;
    this._size = 0;
    this._front = {
      _elements: [],
      _next: undefined
    };
    this._back = this._front;
    this._cursor = 0;
    this._size = 0;
  }

  Object.defineProperty(SimpleQueue.prototype, "length", {
    get: function () {
      return this._size;
    },
    enumerable: false,
    configurable: true
  });

  SimpleQueue.prototype.push = function (element) {
    var oldBack = this._back;
    var newBack = oldBack;

    if (oldBack._elements.length === QUEUE_MAX_ARRAY_SIZE - 1) {
      newBack = {
        _elements: [],
        _next: undefined
      };
    }

    oldBack._elements.push(element);

    if (newBack !== oldBack) {
      this._back = newBack;
      oldBack._next = newBack;
    }

    ++this._size;
  };

  SimpleQueue.prototype.shift = function () {
    var oldFront = this._front;
    var newFront = oldFront;
    var oldCursor = this._cursor;
    var newCursor = oldCursor + 1;
    var elements = oldFront._elements;
    var element = elements[oldCursor];

    if (newCursor === QUEUE_MAX_ARRAY_SIZE) {
      newFront = oldFront._next;
      newCursor = 0;
    }

    --this._size;
    this._cursor = newCursor;

    if (oldFront !== newFront) {
      this._front = newFront;
    }

    elements[oldCursor] = undefined;
    return element;
  };

  SimpleQueue.prototype.forEach = function (callback) {
    var i = this._cursor;
    var node = this._front;
    var elements = node._elements;

    while (i !== elements.length || node._next !== undefined) {
      if (i === elements.length) {
        node = node._next;
        elements = node._elements;
        i = 0;

        if (elements.length === 0) {
          break;
        }
      }

      callback(elements[i]);
      ++i;
    }
  };

  SimpleQueue.prototype.peek = function () {
    var front = this._front;
    var cursor = this._cursor;
    return front._elements[cursor];
  };

  return SimpleQueue;
}();

function ReadableStreamReaderGenericInitialize(reader, stream) {
  reader._ownerReadableStream = stream;
  stream._reader = reader;

  if (stream._state === 'readable') {
    defaultReaderClosedPromiseInitialize(reader);
  } else if (stream._state === 'closed') {
    defaultReaderClosedPromiseInitializeAsResolved(reader);
  } else {
    defaultReaderClosedPromiseInitializeAsRejected(reader, stream._storedError);
  }
}

function ReadableStreamReaderGenericCancel(reader, reason) {
  var stream = reader._ownerReadableStream;
  return ReadableStreamCancel(stream, reason);
}

function ReadableStreamReaderGenericRelease(reader) {
  if (reader._ownerReadableStream._state === 'readable') {
    defaultReaderClosedPromiseReject(reader, new TypeError("Reader was released and can no longer be used to monitor the stream's closedness"));
  } else {
    defaultReaderClosedPromiseResetToRejected(reader, new TypeError("Reader was released and can no longer be used to monitor the stream's closedness"));
  }

  reader._ownerReadableStream._reader = undefined;
  reader._ownerReadableStream = undefined;
}

function readerLockException(name) {
  return new TypeError('Cannot ' + name + ' a stream using a released reader');
}

function defaultReaderClosedPromiseInitialize(reader) {
  reader._closedPromise = newPromise(function (resolve, reject) {
    reader._closedPromise_resolve = resolve;
    reader._closedPromise_reject = reject;
  });
}

function defaultReaderClosedPromiseInitializeAsRejected(reader, reason) {
  defaultReaderClosedPromiseInitialize(reader);
  defaultReaderClosedPromiseReject(reader, reason);
}

function defaultReaderClosedPromiseInitializeAsResolved(reader) {
  defaultReaderClosedPromiseInitialize(reader);
  defaultReaderClosedPromiseResolve(reader);
}

function defaultReaderClosedPromiseReject(reader, reason) {
  setPromiseIsHandledToTrue(reader._closedPromise);

  reader._closedPromise_reject(reason);

  reader._closedPromise_resolve = undefined;
  reader._closedPromise_reject = undefined;
}

function defaultReaderClosedPromiseResetToRejected(reader, reason) {
  defaultReaderClosedPromiseInitializeAsRejected(reader, reason);
}

function defaultReaderClosedPromiseResolve(reader) {
  reader._closedPromise_resolve(undefined);

  reader._closedPromise_resolve = undefined;
  reader._closedPromise_reject = undefined;
}

var AbortSteps = SymbolPolyfill('[[AbortSteps]]');
var ErrorSteps = SymbolPolyfill('[[ErrorSteps]]');
var CancelSteps = SymbolPolyfill('[[CancelSteps]]');
var PullSteps = SymbolPolyfill('[[PullSteps]]');

var NumberIsFinite = Number.isFinite || function (x) {
  return typeof x === 'number' && isFinite(x);
};

var MathTrunc = Math.trunc || function (v) {
  return v < 0 ? Math.ceil(v) : Math.floor(v);
};

function isDictionary(x) {
  return typeof x === 'object' || typeof x === 'function';
}

function assertDictionary(obj, context) {
  if (obj !== undefined && !isDictionary(obj)) {
    throw new TypeError(context + " is not an object.");
  }
}

function assertFunction(x, context) {
  if (typeof x !== 'function') {
    throw new TypeError(context + " is not a function.");
  }
}

function isObject(x) {
  return typeof x === 'object' && x !== null || typeof x === 'function';
}

function assertObject(x, context) {
  if (!isObject(x)) {
    throw new TypeError(context + " is not an object.");
  }
}

function assertRequiredArgument(x, position, context) {
  if (x === undefined) {
    throw new TypeError("Parameter " + position + " is required in '" + context + "'.");
  }
}

function assertRequiredField(x, field, context) {
  if (x === undefined) {
    throw new TypeError(field + " is required in '" + context + "'.");
  }
}

function convertUnrestrictedDouble(value) {
  return Number(value);
}

function censorNegativeZero(x) {
  return x === 0 ? 0 : x;
}

function integerPart(x) {
  return censorNegativeZero(MathTrunc(x));
}

function convertUnsignedLongLongWithEnforceRange(value, context) {
  var lowerBound = 0;
  var upperBound = Number.MAX_SAFE_INTEGER;
  var x = Number(value);
  x = censorNegativeZero(x);

  if (!NumberIsFinite(x)) {
    throw new TypeError(context + " is not a finite number");
  }

  x = integerPart(x);

  if (x < lowerBound || x > upperBound) {
    throw new TypeError(context + " is outside the accepted range of " + lowerBound + " to " + upperBound + ", inclusive");
  }

  if (!NumberIsFinite(x) || x === 0) {
    return 0;
  }

  return x;
}

function assertReadableStream(x, context) {
  if (!IsReadableStream(x)) {
    throw new TypeError(context + " is not a ReadableStream.");
  }
}

function AcquireReadableStreamDefaultReader(stream) {
  return new ReadableStreamDefaultReader(stream);
}

function ReadableStreamAddReadRequest(stream, readRequest) {
  stream._reader._readRequests.push(readRequest);
}

function ReadableStreamFulfillReadRequest(stream, chunk, done) {
  var reader = stream._reader;

  var readRequest = reader._readRequests.shift();

  if (done) {
    readRequest._closeSteps();
  } else {
    readRequest._chunkSteps(chunk);
  }
}

function ReadableStreamGetNumReadRequests(stream) {
  return stream._reader._readRequests.length;
}

function ReadableStreamHasDefaultReader(stream) {
  var reader = stream._reader;

  if (reader === undefined) {
    return false;
  }

  if (!IsReadableStreamDefaultReader(reader)) {
    return false;
  }

  return true;
}

var ReadableStreamDefaultReader = function () {
  function ReadableStreamDefaultReader(stream) {
    assertRequiredArgument(stream, 1, 'ReadableStreamDefaultReader');
    assertReadableStream(stream, 'First parameter');

    if (IsReadableStreamLocked(stream)) {
      throw new TypeError('This stream has already been locked for exclusive reading by another reader');
    }

    ReadableStreamReaderGenericInitialize(this, stream);
    this._readRequests = new SimpleQueue();
  }

  Object.defineProperty(ReadableStreamDefaultReader.prototype, "closed", {
    get: function () {
      if (!IsReadableStreamDefaultReader(this)) {
        return promiseRejectedWith(defaultReaderBrandCheckException('closed'));
      }

      return this._closedPromise;
    },
    enumerable: false,
    configurable: true
  });

  ReadableStreamDefaultReader.prototype.cancel = function (reason) {
    if (reason === void 0) {
      reason = undefined;
    }

    if (!IsReadableStreamDefaultReader(this)) {
      return promiseRejectedWith(defaultReaderBrandCheckException('cancel'));
    }

    if (this._ownerReadableStream === undefined) {
      return promiseRejectedWith(readerLockException('cancel'));
    }

    return ReadableStreamReaderGenericCancel(this, reason);
  };

  ReadableStreamDefaultReader.prototype.read = function () {
    if (!IsReadableStreamDefaultReader(this)) {
      return promiseRejectedWith(defaultReaderBrandCheckException('read'));
    }

    if (this._ownerReadableStream === undefined) {
      return promiseRejectedWith(readerLockException('read from'));
    }

    var resolvePromise;
    var rejectPromise;
    var promise = newPromise(function (resolve, reject) {
      resolvePromise = resolve;
      rejectPromise = reject;
    });
    var readRequest = {
      _chunkSteps: function (chunk) {
        return resolvePromise({
          value: chunk,
          done: false
        });
      },
      _closeSteps: function () {
        return resolvePromise({
          value: undefined,
          done: true
        });
      },
      _errorSteps: function (e) {
        return rejectPromise(e);
      }
    };
    ReadableStreamDefaultReaderRead(this, readRequest);
    return promise;
  };

  ReadableStreamDefaultReader.prototype.releaseLock = function () {
    if (!IsReadableStreamDefaultReader(this)) {
      throw defaultReaderBrandCheckException('releaseLock');
    }

    if (this._ownerReadableStream === undefined) {
      return;
    }

    if (this._readRequests.length > 0) {
      throw new TypeError('Tried to release a reader lock when that reader has pending read() calls un-settled');
    }

    ReadableStreamReaderGenericRelease(this);
  };

  return ReadableStreamDefaultReader;
}();

Object.defineProperties(ReadableStreamDefaultReader.prototype, {
  cancel: {
    enumerable: true
  },
  read: {
    enumerable: true
  },
  releaseLock: {
    enumerable: true
  },
  closed: {
    enumerable: true
  }
});

if (typeof SymbolPolyfill.toStringTag === 'symbol') {
  Object.defineProperty(ReadableStreamDefaultReader.prototype, SymbolPolyfill.toStringTag, {
    value: 'ReadableStreamDefaultReader',
    configurable: true
  });
}

function IsReadableStreamDefaultReader(x) {
  if (!typeIsObject(x)) {
    return false;
  }

  if (!Object.prototype.hasOwnProperty.call(x, '_readRequests')) {
    return false;
  }

  return true;
}

function ReadableStreamDefaultReaderRead(reader, readRequest) {
  var stream = reader._ownerReadableStream;
  stream._disturbed = true;

  if (stream._state === 'closed') {
    readRequest._closeSteps();
  } else if (stream._state === 'errored') {
    readRequest._errorSteps(stream._storedError);
  } else {
    stream._readableStreamController[PullSteps](readRequest);
  }
}

function defaultReaderBrandCheckException(name) {
  return new TypeError("ReadableStreamDefaultReader.prototype." + name + " can only be used on a ReadableStreamDefaultReader");
}

var _a;

var AsyncIteratorPrototype;

if (typeof SymbolPolyfill.asyncIterator === 'symbol') {
  AsyncIteratorPrototype = (_a = {}, _a[SymbolPolyfill.asyncIterator] = function () {
    return this;
  }, _a);
  Object.defineProperty(AsyncIteratorPrototype, SymbolPolyfill.asyncIterator, {
    enumerable: false
  });
}

var ReadableStreamAsyncIteratorImpl = function () {
  function ReadableStreamAsyncIteratorImpl(reader, preventCancel) {
    this._ongoingPromise = undefined;
    this._isFinished = false;
    this._reader = reader;
    this._preventCancel = preventCancel;
  }

  ReadableStreamAsyncIteratorImpl.prototype.next = function () {
    var _this = this;

    var nextSteps = function () {
      return _this._nextSteps();
    };

    this._ongoingPromise = this._ongoingPromise ? transformPromiseWith(this._ongoingPromise, nextSteps, nextSteps) : nextSteps();
    return this._ongoingPromise;
  };

  ReadableStreamAsyncIteratorImpl.prototype.return = function (value) {
    var _this = this;

    var returnSteps = function () {
      return _this._returnSteps(value);
    };

    return this._ongoingPromise ? transformPromiseWith(this._ongoingPromise, returnSteps, returnSteps) : returnSteps();
  };

  ReadableStreamAsyncIteratorImpl.prototype._nextSteps = function () {
    var _this = this;

    if (this._isFinished) {
      return Promise.resolve({
        value: undefined,
        done: true
      });
    }

    var reader = this._reader;

    if (reader._ownerReadableStream === undefined) {
      return promiseRejectedWith(readerLockException('iterate'));
    }

    var resolvePromise;
    var rejectPromise;
    var promise = newPromise(function (resolve, reject) {
      resolvePromise = resolve;
      rejectPromise = reject;
    });
    var readRequest = {
      _chunkSteps: function (chunk) {
        _this._ongoingPromise = undefined;
        queueMicrotask(function () {
          return resolvePromise({
            value: chunk,
            done: false
          });
        });
      },
      _closeSteps: function () {
        _this._ongoingPromise = undefined;
        _this._isFinished = true;
        ReadableStreamReaderGenericRelease(reader);
        resolvePromise({
          value: undefined,
          done: true
        });
      },
      _errorSteps: function (reason) {
        _this._ongoingPromise = undefined;
        _this._isFinished = true;
        ReadableStreamReaderGenericRelease(reader);
        rejectPromise(reason);
      }
    };
    ReadableStreamDefaultReaderRead(reader, readRequest);
    return promise;
  };

  ReadableStreamAsyncIteratorImpl.prototype._returnSteps = function (value) {
    if (this._isFinished) {
      return Promise.resolve({
        value: value,
        done: true
      });
    }

    this._isFinished = true;
    var reader = this._reader;

    if (reader._ownerReadableStream === undefined) {
      return promiseRejectedWith(readerLockException('finish iterating'));
    }

    if (!this._preventCancel) {
      var result = ReadableStreamReaderGenericCancel(reader, value);
      ReadableStreamReaderGenericRelease(reader);
      return transformPromiseWith(result, function () {
        return {
          value: value,
          done: true
        };
      });
    }

    ReadableStreamReaderGenericRelease(reader);
    return promiseResolvedWith({
      value: value,
      done: true
    });
  };

  return ReadableStreamAsyncIteratorImpl;
}();

var ReadableStreamAsyncIteratorPrototype = {
  next: function () {
    if (!IsReadableStreamAsyncIterator(this)) {
      return promiseRejectedWith(streamAsyncIteratorBrandCheckException('next'));
    }

    return this._asyncIteratorImpl.next();
  },
  return: function (value) {
    if (!IsReadableStreamAsyncIterator(this)) {
      return promiseRejectedWith(streamAsyncIteratorBrandCheckException('return'));
    }

    return this._asyncIteratorImpl.return(value);
  }
};

if (AsyncIteratorPrototype !== undefined) {
  Object.setPrototypeOf(ReadableStreamAsyncIteratorPrototype, AsyncIteratorPrototype);
}

function AcquireReadableStreamAsyncIterator(stream, preventCancel) {
  var reader = AcquireReadableStreamDefaultReader(stream);
  var impl = new ReadableStreamAsyncIteratorImpl(reader, preventCancel);
  var iterator = Object.create(ReadableStreamAsyncIteratorPrototype);
  iterator._asyncIteratorImpl = impl;
  return iterator;
}

function IsReadableStreamAsyncIterator(x) {
  if (!typeIsObject(x)) {
    return false;
  }

  if (!Object.prototype.hasOwnProperty.call(x, '_asyncIteratorImpl')) {
    return false;
  }

  return true;
}

function streamAsyncIteratorBrandCheckException(name) {
  return new TypeError("ReadableStreamAsyncIterator." + name + " can only be used on a ReadableSteamAsyncIterator");
}

var NumberIsNaN = Number.isNaN || function (x) {
  return x !== x;
};

function IsFiniteNonNegativeNumber(v) {
  if (!IsNonNegativeNumber(v)) {
    return false;
  }

  if (v === Infinity) {
    return false;
  }

  return true;
}

function IsNonNegativeNumber(v) {
  if (typeof v !== 'number') {
    return false;
  }

  if (NumberIsNaN(v)) {
    return false;
  }

  if (v < 0) {
    return false;
  }

  return true;
}

function DequeueValue(container) {
  var pair = container._queue.shift();

  container._queueTotalSize -= pair.size;

  if (container._queueTotalSize < 0) {
    container._queueTotalSize = 0;
  }

  return pair.value;
}

function EnqueueValueWithSize(container, value, size) {
  size = Number(size);

  if (!IsFiniteNonNegativeNumber(size)) {
    throw new RangeError('Size must be a finite, non-NaN, non-negative number.');
  }

  container._queue.push({
    value: value,
    size: size
  });

  container._queueTotalSize += size;
}

function PeekQueueValue(container) {
  var pair = container._queue.peek();

  return pair.value;
}

function ResetQueue(container) {
  container._queue = new SimpleQueue();
  container._queueTotalSize = 0;
}

function CreateArrayFromList(elements) {
  return elements.slice();
}

function CopyDataBlockBytes(dest, destOffset, src, srcOffset, n) {
  new Uint8Array(dest).set(new Uint8Array(src, srcOffset, n), destOffset);
}

function TransferArrayBuffer(O) {
  return O;
}

function IsDetachedBuffer(O) {
  return false;
}

var ReadableStreamBYOBRequest = function () {
  function ReadableStreamBYOBRequest() {
    throw new TypeError('Illegal constructor');
  }

  Object.defineProperty(ReadableStreamBYOBRequest.prototype, "view", {
    get: function () {
      if (!IsReadableStreamBYOBRequest(this)) {
        throw byobRequestBrandCheckException('view');
      }

      return this._view;
    },
    enumerable: false,
    configurable: true
  });

  ReadableStreamBYOBRequest.prototype.respond = function (bytesWritten) {
    if (!IsReadableStreamBYOBRequest(this)) {
      throw byobRequestBrandCheckException('respond');
    }

    assertRequiredArgument(bytesWritten, 1, 'respond');
    bytesWritten = convertUnsignedLongLongWithEnforceRange(bytesWritten, 'First parameter');

    if (this._associatedReadableByteStreamController === undefined) {
      throw new TypeError('This BYOB request has been invalidated');
    }

    if (IsDetachedBuffer(this._view.buffer)) ;
    ReadableByteStreamControllerRespond(this._associatedReadableByteStreamController, bytesWritten);
  };

  ReadableStreamBYOBRequest.prototype.respondWithNewView = function (view) {
    if (!IsReadableStreamBYOBRequest(this)) {
      throw byobRequestBrandCheckException('respondWithNewView');
    }

    assertRequiredArgument(view, 1, 'respondWithNewView');

    if (!ArrayBuffer.isView(view)) {
      throw new TypeError('You can only respond with array buffer views');
    }

    if (view.byteLength === 0) {
      throw new TypeError('chunk must have non-zero byteLength');
    }

    if (view.buffer.byteLength === 0) {
      throw new TypeError("chunk's buffer must have non-zero byteLength");
    }

    if (this._associatedReadableByteStreamController === undefined) {
      throw new TypeError('This BYOB request has been invalidated');
    }

    ReadableByteStreamControllerRespondWithNewView(this._associatedReadableByteStreamController, view);
  };

  return ReadableStreamBYOBRequest;
}();

Object.defineProperties(ReadableStreamBYOBRequest.prototype, {
  respond: {
    enumerable: true
  },
  respondWithNewView: {
    enumerable: true
  },
  view: {
    enumerable: true
  }
});

if (typeof SymbolPolyfill.toStringTag === 'symbol') {
  Object.defineProperty(ReadableStreamBYOBRequest.prototype, SymbolPolyfill.toStringTag, {
    value: 'ReadableStreamBYOBRequest',
    configurable: true
  });
}

var ReadableByteStreamController = function () {
  function ReadableByteStreamController() {
    throw new TypeError('Illegal constructor');
  }

  Object.defineProperty(ReadableByteStreamController.prototype, "byobRequest", {
    get: function () {
      if (!IsReadableByteStreamController(this)) {
        throw byteStreamControllerBrandCheckException('byobRequest');
      }

      if (this._byobRequest === null && this._pendingPullIntos.length > 0) {
        var firstDescriptor = this._pendingPullIntos.peek();

        var view = new Uint8Array(firstDescriptor.buffer, firstDescriptor.byteOffset + firstDescriptor.bytesFilled, firstDescriptor.byteLength - firstDescriptor.bytesFilled);
        var byobRequest = Object.create(ReadableStreamBYOBRequest.prototype);
        SetUpReadableStreamBYOBRequest(byobRequest, this, view);
        this._byobRequest = byobRequest;
      }

      return this._byobRequest;
    },
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(ReadableByteStreamController.prototype, "desiredSize", {
    get: function () {
      if (!IsReadableByteStreamController(this)) {
        throw byteStreamControllerBrandCheckException('desiredSize');
      }

      return ReadableByteStreamControllerGetDesiredSize(this);
    },
    enumerable: false,
    configurable: true
  });

  ReadableByteStreamController.prototype.close = function () {
    if (!IsReadableByteStreamController(this)) {
      throw byteStreamControllerBrandCheckException('close');
    }

    if (this._closeRequested) {
      throw new TypeError('The stream has already been closed; do not close it again!');
    }

    var state = this._controlledReadableByteStream._state;

    if (state !== 'readable') {
      throw new TypeError("The stream (in " + state + " state) is not in the readable state and cannot be closed");
    }

    ReadableByteStreamControllerClose(this);
  };

  ReadableByteStreamController.prototype.enqueue = function (chunk) {
    if (!IsReadableByteStreamController(this)) {
      throw byteStreamControllerBrandCheckException('enqueue');
    }

    assertRequiredArgument(chunk, 1, 'enqueue');

    if (!ArrayBuffer.isView(chunk)) {
      throw new TypeError('chunk must be an array buffer view');
    }

    if (chunk.byteLength === 0) {
      throw new TypeError('chunk must have non-zero byteLength');
    }

    if (chunk.buffer.byteLength === 0) {
      throw new TypeError("chunk's buffer must have non-zero byteLength");
    }

    if (this._closeRequested) {
      throw new TypeError('stream is closed or draining');
    }

    var state = this._controlledReadableByteStream._state;

    if (state !== 'readable') {
      throw new TypeError("The stream (in " + state + " state) is not in the readable state and cannot be enqueued to");
    }

    ReadableByteStreamControllerEnqueue(this, chunk);
  };

  ReadableByteStreamController.prototype.error = function (e) {
    if (e === void 0) {
      e = undefined;
    }

    if (!IsReadableByteStreamController(this)) {
      throw byteStreamControllerBrandCheckException('error');
    }

    ReadableByteStreamControllerError(this, e);
  };

  ReadableByteStreamController.prototype[CancelSteps] = function (reason) {
    if (this._pendingPullIntos.length > 0) {
      var firstDescriptor = this._pendingPullIntos.peek();

      firstDescriptor.bytesFilled = 0;
    }

    ResetQueue(this);

    var result = this._cancelAlgorithm(reason);

    ReadableByteStreamControllerClearAlgorithms(this);
    return result;
  };

  ReadableByteStreamController.prototype[PullSteps] = function (readRequest) {
    var stream = this._controlledReadableByteStream;

    if (this._queueTotalSize > 0) {
      var entry = this._queue.shift();

      this._queueTotalSize -= entry.byteLength;
      ReadableByteStreamControllerHandleQueueDrain(this);
      var view = new Uint8Array(entry.buffer, entry.byteOffset, entry.byteLength);

      readRequest._chunkSteps(view);

      return;
    }

    var autoAllocateChunkSize = this._autoAllocateChunkSize;

    if (autoAllocateChunkSize !== undefined) {
      var buffer = void 0;

      try {
        buffer = new ArrayBuffer(autoAllocateChunkSize);
      } catch (bufferE) {
        readRequest._errorSteps(bufferE);

        return;
      }

      var pullIntoDescriptor = {
        buffer: buffer,
        byteOffset: 0,
        byteLength: autoAllocateChunkSize,
        bytesFilled: 0,
        elementSize: 1,
        viewConstructor: Uint8Array,
        readerType: 'default'
      };

      this._pendingPullIntos.push(pullIntoDescriptor);
    }

    ReadableStreamAddReadRequest(stream, readRequest);
    ReadableByteStreamControllerCallPullIfNeeded(this);
  };

  return ReadableByteStreamController;
}();

Object.defineProperties(ReadableByteStreamController.prototype, {
  close: {
    enumerable: true
  },
  enqueue: {
    enumerable: true
  },
  error: {
    enumerable: true
  },
  byobRequest: {
    enumerable: true
  },
  desiredSize: {
    enumerable: true
  }
});

if (typeof SymbolPolyfill.toStringTag === 'symbol') {
  Object.defineProperty(ReadableByteStreamController.prototype, SymbolPolyfill.toStringTag, {
    value: 'ReadableByteStreamController',
    configurable: true
  });
}

function IsReadableByteStreamController(x) {
  if (!typeIsObject(x)) {
    return false;
  }

  if (!Object.prototype.hasOwnProperty.call(x, '_controlledReadableByteStream')) {
    return false;
  }

  return true;
}

function IsReadableStreamBYOBRequest(x) {
  if (!typeIsObject(x)) {
    return false;
  }

  if (!Object.prototype.hasOwnProperty.call(x, '_associatedReadableByteStreamController')) {
    return false;
  }

  return true;
}

function ReadableByteStreamControllerCallPullIfNeeded(controller) {
  var shouldPull = ReadableByteStreamControllerShouldCallPull(controller);

  if (!shouldPull) {
    return;
  }

  if (controller._pulling) {
    controller._pullAgain = true;
    return;
  }

  controller._pulling = true;

  var pullPromise = controller._pullAlgorithm();

  uponPromise(pullPromise, function () {
    controller._pulling = false;

    if (controller._pullAgain) {
      controller._pullAgain = false;
      ReadableByteStreamControllerCallPullIfNeeded(controller);
    }
  }, function (e) {
    ReadableByteStreamControllerError(controller, e);
  });
}

function ReadableByteStreamControllerClearPendingPullIntos(controller) {
  ReadableByteStreamControllerInvalidateBYOBRequest(controller);
  controller._pendingPullIntos = new SimpleQueue();
}

function ReadableByteStreamControllerCommitPullIntoDescriptor(stream, pullIntoDescriptor) {
  var done = false;

  if (stream._state === 'closed') {
    done = true;
  }

  var filledView = ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor);

  if (pullIntoDescriptor.readerType === 'default') {
    ReadableStreamFulfillReadRequest(stream, filledView, done);
  } else {
    ReadableStreamFulfillReadIntoRequest(stream, filledView, done);
  }
}

function ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor) {
  var bytesFilled = pullIntoDescriptor.bytesFilled;
  var elementSize = pullIntoDescriptor.elementSize;
  return new pullIntoDescriptor.viewConstructor(pullIntoDescriptor.buffer, pullIntoDescriptor.byteOffset, bytesFilled / elementSize);
}

function ReadableByteStreamControllerEnqueueChunkToQueue(controller, buffer, byteOffset, byteLength) {
  controller._queue.push({
    buffer: buffer,
    byteOffset: byteOffset,
    byteLength: byteLength
  });

  controller._queueTotalSize += byteLength;
}

function ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor) {
  var elementSize = pullIntoDescriptor.elementSize;
  var currentAlignedBytes = pullIntoDescriptor.bytesFilled - pullIntoDescriptor.bytesFilled % elementSize;
  var maxBytesToCopy = Math.min(controller._queueTotalSize, pullIntoDescriptor.byteLength - pullIntoDescriptor.bytesFilled);
  var maxBytesFilled = pullIntoDescriptor.bytesFilled + maxBytesToCopy;
  var maxAlignedBytes = maxBytesFilled - maxBytesFilled % elementSize;
  var totalBytesToCopyRemaining = maxBytesToCopy;
  var ready = false;

  if (maxAlignedBytes > currentAlignedBytes) {
    totalBytesToCopyRemaining = maxAlignedBytes - pullIntoDescriptor.bytesFilled;
    ready = true;
  }

  var queue = controller._queue;

  while (totalBytesToCopyRemaining > 0) {
    var headOfQueue = queue.peek();
    var bytesToCopy = Math.min(totalBytesToCopyRemaining, headOfQueue.byteLength);
    var destStart = pullIntoDescriptor.byteOffset + pullIntoDescriptor.bytesFilled;
    CopyDataBlockBytes(pullIntoDescriptor.buffer, destStart, headOfQueue.buffer, headOfQueue.byteOffset, bytesToCopy);

    if (headOfQueue.byteLength === bytesToCopy) {
      queue.shift();
    } else {
      headOfQueue.byteOffset += bytesToCopy;
      headOfQueue.byteLength -= bytesToCopy;
    }

    controller._queueTotalSize -= bytesToCopy;
    ReadableByteStreamControllerFillHeadPullIntoDescriptor(controller, bytesToCopy, pullIntoDescriptor);
    totalBytesToCopyRemaining -= bytesToCopy;
  }

  return ready;
}

function ReadableByteStreamControllerFillHeadPullIntoDescriptor(controller, size, pullIntoDescriptor) {
  ReadableByteStreamControllerInvalidateBYOBRequest(controller);
  pullIntoDescriptor.bytesFilled += size;
}

function ReadableByteStreamControllerHandleQueueDrain(controller) {
  if (controller._queueTotalSize === 0 && controller._closeRequested) {
    ReadableByteStreamControllerClearAlgorithms(controller);
    ReadableStreamClose(controller._controlledReadableByteStream);
  } else {
    ReadableByteStreamControllerCallPullIfNeeded(controller);
  }
}

function ReadableByteStreamControllerInvalidateBYOBRequest(controller) {
  if (controller._byobRequest === null) {
    return;
  }

  controller._byobRequest._associatedReadableByteStreamController = undefined;
  controller._byobRequest._view = null;
  controller._byobRequest = null;
}

function ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller) {
  while (controller._pendingPullIntos.length > 0) {
    if (controller._queueTotalSize === 0) {
      return;
    }

    var pullIntoDescriptor = controller._pendingPullIntos.peek();

    if (ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor)) {
      ReadableByteStreamControllerShiftPendingPullInto(controller);
      ReadableByteStreamControllerCommitPullIntoDescriptor(controller._controlledReadableByteStream, pullIntoDescriptor);
    }
  }
}

function ReadableByteStreamControllerPullInto(controller, view, readIntoRequest) {
  var stream = controller._controlledReadableByteStream;
  var elementSize = 1;

  if (view.constructor !== DataView) {
    elementSize = view.constructor.BYTES_PER_ELEMENT;
  }

  var ctor = view.constructor;
  var buffer = TransferArrayBuffer(view.buffer);
  var pullIntoDescriptor = {
    buffer: buffer,
    byteOffset: view.byteOffset,
    byteLength: view.byteLength,
    bytesFilled: 0,
    elementSize: elementSize,
    viewConstructor: ctor,
    readerType: 'byob'
  };

  if (controller._pendingPullIntos.length > 0) {
    controller._pendingPullIntos.push(pullIntoDescriptor);

    ReadableStreamAddReadIntoRequest(stream, readIntoRequest);
    return;
  }

  if (stream._state === 'closed') {
    var emptyView = new ctor(pullIntoDescriptor.buffer, pullIntoDescriptor.byteOffset, 0);

    readIntoRequest._closeSteps(emptyView);

    return;
  }

  if (controller._queueTotalSize > 0) {
    if (ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor)) {
      var filledView = ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor);
      ReadableByteStreamControllerHandleQueueDrain(controller);

      readIntoRequest._chunkSteps(filledView);

      return;
    }

    if (controller._closeRequested) {
      var e = new TypeError('Insufficient bytes to fill elements in the given buffer');
      ReadableByteStreamControllerError(controller, e);

      readIntoRequest._errorSteps(e);

      return;
    }
  }

  controller._pendingPullIntos.push(pullIntoDescriptor);

  ReadableStreamAddReadIntoRequest(stream, readIntoRequest);
  ReadableByteStreamControllerCallPullIfNeeded(controller);
}

function ReadableByteStreamControllerRespondInClosedState(controller, firstDescriptor) {
  firstDescriptor.buffer = TransferArrayBuffer(firstDescriptor.buffer);
  var stream = controller._controlledReadableByteStream;

  if (ReadableStreamHasBYOBReader(stream)) {
    while (ReadableStreamGetNumReadIntoRequests(stream) > 0) {
      var pullIntoDescriptor = ReadableByteStreamControllerShiftPendingPullInto(controller);
      ReadableByteStreamControllerCommitPullIntoDescriptor(stream, pullIntoDescriptor);
    }
  }
}

function ReadableByteStreamControllerRespondInReadableState(controller, bytesWritten, pullIntoDescriptor) {
  if (pullIntoDescriptor.bytesFilled + bytesWritten > pullIntoDescriptor.byteLength) {
    throw new RangeError('bytesWritten out of range');
  }

  ReadableByteStreamControllerFillHeadPullIntoDescriptor(controller, bytesWritten, pullIntoDescriptor);

  if (pullIntoDescriptor.bytesFilled < pullIntoDescriptor.elementSize) {
    return;
  }

  ReadableByteStreamControllerShiftPendingPullInto(controller);
  var remainderSize = pullIntoDescriptor.bytesFilled % pullIntoDescriptor.elementSize;

  if (remainderSize > 0) {
    var end = pullIntoDescriptor.byteOffset + pullIntoDescriptor.bytesFilled;
    var remainder = pullIntoDescriptor.buffer.slice(end - remainderSize, end);
    ReadableByteStreamControllerEnqueueChunkToQueue(controller, remainder, 0, remainder.byteLength);
  }

  pullIntoDescriptor.buffer = TransferArrayBuffer(pullIntoDescriptor.buffer);
  pullIntoDescriptor.bytesFilled -= remainderSize;
  ReadableByteStreamControllerCommitPullIntoDescriptor(controller._controlledReadableByteStream, pullIntoDescriptor);
  ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller);
}

function ReadableByteStreamControllerRespondInternal(controller, bytesWritten) {
  var firstDescriptor = controller._pendingPullIntos.peek();

  var stream = controller._controlledReadableByteStream;

  if (stream._state === 'closed') {
    if (bytesWritten !== 0) {
      throw new TypeError('bytesWritten must be 0 when calling respond() on a closed stream');
    }

    ReadableByteStreamControllerRespondInClosedState(controller, firstDescriptor);
  } else {
    ReadableByteStreamControllerRespondInReadableState(controller, bytesWritten, firstDescriptor);
  }

  ReadableByteStreamControllerCallPullIfNeeded(controller);
}

function ReadableByteStreamControllerShiftPendingPullInto(controller) {
  var descriptor = controller._pendingPullIntos.shift();

  ReadableByteStreamControllerInvalidateBYOBRequest(controller);
  return descriptor;
}

function ReadableByteStreamControllerShouldCallPull(controller) {
  var stream = controller._controlledReadableByteStream;

  if (stream._state !== 'readable') {
    return false;
  }

  if (controller._closeRequested) {
    return false;
  }

  if (!controller._started) {
    return false;
  }

  if (ReadableStreamHasDefaultReader(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
    return true;
  }

  if (ReadableStreamHasBYOBReader(stream) && ReadableStreamGetNumReadIntoRequests(stream) > 0) {
    return true;
  }

  var desiredSize = ReadableByteStreamControllerGetDesiredSize(controller);

  if (desiredSize > 0) {
    return true;
  }

  return false;
}

function ReadableByteStreamControllerClearAlgorithms(controller) {
  controller._pullAlgorithm = undefined;
  controller._cancelAlgorithm = undefined;
}

function ReadableByteStreamControllerClose(controller) {
  var stream = controller._controlledReadableByteStream;

  if (controller._closeRequested || stream._state !== 'readable') {
    return;
  }

  if (controller._queueTotalSize > 0) {
    controller._closeRequested = true;
    return;
  }

  if (controller._pendingPullIntos.length > 0) {
    var firstPendingPullInto = controller._pendingPullIntos.peek();

    if (firstPendingPullInto.bytesFilled > 0) {
      var e = new TypeError('Insufficient bytes to fill elements in the given buffer');
      ReadableByteStreamControllerError(controller, e);
      throw e;
    }
  }

  ReadableByteStreamControllerClearAlgorithms(controller);
  ReadableStreamClose(stream);
}

function ReadableByteStreamControllerEnqueue(controller, chunk) {
  var stream = controller._controlledReadableByteStream;

  if (controller._closeRequested || stream._state !== 'readable') {
    return;
  }

  var buffer = chunk.buffer;
  var byteOffset = chunk.byteOffset;
  var byteLength = chunk.byteLength;
  var transferredBuffer = TransferArrayBuffer(buffer);

  if (ReadableStreamHasDefaultReader(stream)) {
    if (ReadableStreamGetNumReadRequests(stream) === 0) {
      ReadableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
    } else {
      var transferredView = new Uint8Array(transferredBuffer, byteOffset, byteLength);
      ReadableStreamFulfillReadRequest(stream, transferredView, false);
    }
  } else if (ReadableStreamHasBYOBReader(stream)) {
    ReadableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
    ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller);
  } else {
    ReadableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
  }

  ReadableByteStreamControllerCallPullIfNeeded(controller);
}

function ReadableByteStreamControllerError(controller, e) {
  var stream = controller._controlledReadableByteStream;

  if (stream._state !== 'readable') {
    return;
  }

  ReadableByteStreamControllerClearPendingPullIntos(controller);
  ResetQueue(controller);
  ReadableByteStreamControllerClearAlgorithms(controller);
  ReadableStreamError(stream, e);
}

function ReadableByteStreamControllerGetDesiredSize(controller) {
  var stream = controller._controlledReadableByteStream;
  var state = stream._state;

  if (state === 'errored') {
    return null;
  }

  if (state === 'closed') {
    return 0;
  }

  return controller._strategyHWM - controller._queueTotalSize;
}

function ReadableByteStreamControllerRespond(controller, bytesWritten) {
  bytesWritten = Number(bytesWritten);

  if (!IsFiniteNonNegativeNumber(bytesWritten)) {
    throw new RangeError('bytesWritten must be a finite');
  }

  ReadableByteStreamControllerRespondInternal(controller, bytesWritten);
}

function ReadableByteStreamControllerRespondWithNewView(controller, view) {
  var firstDescriptor = controller._pendingPullIntos.peek();

  if (firstDescriptor.byteOffset + firstDescriptor.bytesFilled !== view.byteOffset) {
    throw new RangeError('The region specified by view does not match byobRequest');
  }

  if (firstDescriptor.byteLength !== view.byteLength) {
    throw new RangeError('The buffer of view has different capacity than byobRequest');
  }

  firstDescriptor.buffer = view.buffer;
  ReadableByteStreamControllerRespondInternal(controller, view.byteLength);
}

function SetUpReadableByteStreamController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, autoAllocateChunkSize) {
  controller._controlledReadableByteStream = stream;
  controller._pullAgain = false;
  controller._pulling = false;
  controller._byobRequest = null;
  controller._queue = controller._queueTotalSize = undefined;
  ResetQueue(controller);
  controller._closeRequested = false;
  controller._started = false;
  controller._strategyHWM = highWaterMark;
  controller._pullAlgorithm = pullAlgorithm;
  controller._cancelAlgorithm = cancelAlgorithm;
  controller._autoAllocateChunkSize = autoAllocateChunkSize;
  controller._pendingPullIntos = new SimpleQueue();
  stream._readableStreamController = controller;
  var startResult = startAlgorithm();
  uponPromise(promiseResolvedWith(startResult), function () {
    controller._started = true;
    ReadableByteStreamControllerCallPullIfNeeded(controller);
  }, function (r) {
    ReadableByteStreamControllerError(controller, r);
  });
}

function SetUpReadableByteStreamControllerFromUnderlyingSource(stream, underlyingByteSource, highWaterMark) {
  var controller = Object.create(ReadableByteStreamController.prototype);

  var startAlgorithm = function () {
    return undefined;
  };

  var pullAlgorithm = function () {
    return promiseResolvedWith(undefined);
  };

  var cancelAlgorithm = function () {
    return promiseResolvedWith(undefined);
  };

  if (underlyingByteSource.start !== undefined) {
    startAlgorithm = function () {
      return underlyingByteSource.start(controller);
    };
  }

  if (underlyingByteSource.pull !== undefined) {
    pullAlgorithm = function () {
      return underlyingByteSource.pull(controller);
    };
  }

  if (underlyingByteSource.cancel !== undefined) {
    cancelAlgorithm = function (reason) {
      return underlyingByteSource.cancel(reason);
    };
  }

  var autoAllocateChunkSize = underlyingByteSource.autoAllocateChunkSize;
  SetUpReadableByteStreamController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, autoAllocateChunkSize);
}

function SetUpReadableStreamBYOBRequest(request, controller, view) {
  request._associatedReadableByteStreamController = controller;
  request._view = view;
}

function byobRequestBrandCheckException(name) {
  return new TypeError("ReadableStreamBYOBRequest.prototype." + name + " can only be used on a ReadableStreamBYOBRequest");
}

function byteStreamControllerBrandCheckException(name) {
  return new TypeError("ReadableByteStreamController.prototype." + name + " can only be used on a ReadableByteStreamController");
}

function AcquireReadableStreamBYOBReader(stream) {
  return new ReadableStreamBYOBReader(stream);
}

function ReadableStreamAddReadIntoRequest(stream, readIntoRequest) {
  stream._reader._readIntoRequests.push(readIntoRequest);
}

function ReadableStreamFulfillReadIntoRequest(stream, chunk, done) {
  var reader = stream._reader;

  var readIntoRequest = reader._readIntoRequests.shift();

  if (done) {
    readIntoRequest._closeSteps(chunk);
  } else {
    readIntoRequest._chunkSteps(chunk);
  }
}

function ReadableStreamGetNumReadIntoRequests(stream) {
  return stream._reader._readIntoRequests.length;
}

function ReadableStreamHasBYOBReader(stream) {
  var reader = stream._reader;

  if (reader === undefined) {
    return false;
  }

  if (!IsReadableStreamBYOBReader(reader)) {
    return false;
  }

  return true;
}

var ReadableStreamBYOBReader = function () {
  function ReadableStreamBYOBReader(stream) {
    assertRequiredArgument(stream, 1, 'ReadableStreamBYOBReader');
    assertReadableStream(stream, 'First parameter');

    if (IsReadableStreamLocked(stream)) {
      throw new TypeError('This stream has already been locked for exclusive reading by another reader');
    }

    if (!IsReadableByteStreamController(stream._readableStreamController)) {
      throw new TypeError('Cannot construct a ReadableStreamBYOBReader for a stream not constructed with a byte ' + 'source');
    }

    ReadableStreamReaderGenericInitialize(this, stream);
    this._readIntoRequests = new SimpleQueue();
  }

  Object.defineProperty(ReadableStreamBYOBReader.prototype, "closed", {
    get: function () {
      if (!IsReadableStreamBYOBReader(this)) {
        return promiseRejectedWith(byobReaderBrandCheckException('closed'));
      }

      return this._closedPromise;
    },
    enumerable: false,
    configurable: true
  });

  ReadableStreamBYOBReader.prototype.cancel = function (reason) {
    if (reason === void 0) {
      reason = undefined;
    }

    if (!IsReadableStreamBYOBReader(this)) {
      return promiseRejectedWith(byobReaderBrandCheckException('cancel'));
    }

    if (this._ownerReadableStream === undefined) {
      return promiseRejectedWith(readerLockException('cancel'));
    }

    return ReadableStreamReaderGenericCancel(this, reason);
  };

  ReadableStreamBYOBReader.prototype.read = function (view) {
    if (!IsReadableStreamBYOBReader(this)) {
      return promiseRejectedWith(byobReaderBrandCheckException('read'));
    }

    if (!ArrayBuffer.isView(view)) {
      return promiseRejectedWith(new TypeError('view must be an array buffer view'));
    }

    if (view.byteLength === 0) {
      return promiseRejectedWith(new TypeError('view must have non-zero byteLength'));
    }

    if (view.buffer.byteLength === 0) {
      return promiseRejectedWith(new TypeError("view's buffer must have non-zero byteLength"));
    }

    if (this._ownerReadableStream === undefined) {
      return promiseRejectedWith(readerLockException('read from'));
    }

    var resolvePromise;
    var rejectPromise;
    var promise = newPromise(function (resolve, reject) {
      resolvePromise = resolve;
      rejectPromise = reject;
    });
    var readIntoRequest = {
      _chunkSteps: function (chunk) {
        return resolvePromise({
          value: chunk,
          done: false
        });
      },
      _closeSteps: function (chunk) {
        return resolvePromise({
          value: chunk,
          done: true
        });
      },
      _errorSteps: function (e) {
        return rejectPromise(e);
      }
    };
    ReadableStreamBYOBReaderRead(this, view, readIntoRequest);
    return promise;
  };

  ReadableStreamBYOBReader.prototype.releaseLock = function () {
    if (!IsReadableStreamBYOBReader(this)) {
      throw byobReaderBrandCheckException('releaseLock');
    }

    if (this._ownerReadableStream === undefined) {
      return;
    }

    if (this._readIntoRequests.length > 0) {
      throw new TypeError('Tried to release a reader lock when that reader has pending read() calls un-settled');
    }

    ReadableStreamReaderGenericRelease(this);
  };

  return ReadableStreamBYOBReader;
}();

Object.defineProperties(ReadableStreamBYOBReader.prototype, {
  cancel: {
    enumerable: true
  },
  read: {
    enumerable: true
  },
  releaseLock: {
    enumerable: true
  },
  closed: {
    enumerable: true
  }
});

if (typeof SymbolPolyfill.toStringTag === 'symbol') {
  Object.defineProperty(ReadableStreamBYOBReader.prototype, SymbolPolyfill.toStringTag, {
    value: 'ReadableStreamBYOBReader',
    configurable: true
  });
}

function IsReadableStreamBYOBReader(x) {
  if (!typeIsObject(x)) {
    return false;
  }

  if (!Object.prototype.hasOwnProperty.call(x, '_readIntoRequests')) {
    return false;
  }

  return true;
}

function ReadableStreamBYOBReaderRead(reader, view, readIntoRequest) {
  var stream = reader._ownerReadableStream;
  stream._disturbed = true;

  if (stream._state === 'errored') {
    readIntoRequest._errorSteps(stream._storedError);
  } else {
    ReadableByteStreamControllerPullInto(stream._readableStreamController, view, readIntoRequest);
  }
}

function byobReaderBrandCheckException(name) {
  return new TypeError("ReadableStreamBYOBReader.prototype." + name + " can only be used on a ReadableStreamBYOBReader");
}

function ExtractHighWaterMark(strategy, defaultHWM) {
  var highWaterMark = strategy.highWaterMark;

  if (highWaterMark === undefined) {
    return defaultHWM;
  }

  if (NumberIsNaN(highWaterMark) || highWaterMark < 0) {
    throw new RangeError('Invalid highWaterMark');
  }

  return highWaterMark;
}

function ExtractSizeAlgorithm(strategy) {
  var size = strategy.size;

  if (!size) {
    return function () {
      return 1;
    };
  }

  return size;
}

function convertQueuingStrategy(init, context) {
  assertDictionary(init, context);
  var highWaterMark = init === null || init === void 0 ? void 0 : init.highWaterMark;
  var size = init === null || init === void 0 ? void 0 : init.size;
  return {
    highWaterMark: highWaterMark === undefined ? undefined : convertUnrestrictedDouble(highWaterMark),
    size: size === undefined ? undefined : convertQueuingStrategySize(size, context + " has member 'size' that")
  };
}

function convertQueuingStrategySize(fn, context) {
  assertFunction(fn, context);
  return function (chunk) {
    return convertUnrestrictedDouble(fn(chunk));
  };
}

function convertUnderlyingSink(original, context) {
  assertDictionary(original, context);
  var abort = original === null || original === void 0 ? void 0 : original.abort;
  var close = original === null || original === void 0 ? void 0 : original.close;
  var start = original === null || original === void 0 ? void 0 : original.start;
  var type = original === null || original === void 0 ? void 0 : original.type;
  var write = original === null || original === void 0 ? void 0 : original.write;
  return {
    abort: abort === undefined ? undefined : convertUnderlyingSinkAbortCallback(abort, original, context + " has member 'abort' that"),
    close: close === undefined ? undefined : convertUnderlyingSinkCloseCallback(close, original, context + " has member 'close' that"),
    start: start === undefined ? undefined : convertUnderlyingSinkStartCallback(start, original, context + " has member 'start' that"),
    write: write === undefined ? undefined : convertUnderlyingSinkWriteCallback(write, original, context + " has member 'write' that"),
    type: type
  };
}

function convertUnderlyingSinkAbortCallback(fn, original, context) {
  assertFunction(fn, context);
  return function (reason) {
    return promiseCall(fn, original, [reason]);
  };
}

function convertUnderlyingSinkCloseCallback(fn, original, context) {
  assertFunction(fn, context);
  return function () {
    return promiseCall(fn, original, []);
  };
}

function convertUnderlyingSinkStartCallback(fn, original, context) {
  assertFunction(fn, context);
  return function (controller) {
    return reflectCall(fn, original, [controller]);
  };
}

function convertUnderlyingSinkWriteCallback(fn, original, context) {
  assertFunction(fn, context);
  return function (chunk, controller) {
    return promiseCall(fn, original, [chunk, controller]);
  };
}

function assertWritableStream(x, context) {
  if (!IsWritableStream(x)) {
    throw new TypeError(context + " is not a WritableStream.");
  }
}

var WritableStream = function () {
  function WritableStream(rawUnderlyingSink, rawStrategy) {
    if (rawUnderlyingSink === void 0) {
      rawUnderlyingSink = {};
    }

    if (rawStrategy === void 0) {
      rawStrategy = {};
    }

    if (rawUnderlyingSink === undefined) {
      rawUnderlyingSink = null;
    } else {
      assertObject(rawUnderlyingSink, 'First parameter');
    }

    var strategy = convertQueuingStrategy(rawStrategy, 'Second parameter');
    var underlyingSink = convertUnderlyingSink(rawUnderlyingSink, 'First parameter');
    InitializeWritableStream(this);
    var type = underlyingSink.type;

    if (type !== undefined) {
      throw new RangeError('Invalid type is specified');
    }

    var sizeAlgorithm = ExtractSizeAlgorithm(strategy);
    var highWaterMark = ExtractHighWaterMark(strategy, 1);
    SetUpWritableStreamDefaultControllerFromUnderlyingSink(this, underlyingSink, highWaterMark, sizeAlgorithm);
  }

  Object.defineProperty(WritableStream.prototype, "locked", {
    get: function () {
      if (!IsWritableStream(this)) {
        throw streamBrandCheckException('locked');
      }

      return IsWritableStreamLocked(this);
    },
    enumerable: false,
    configurable: true
  });

  WritableStream.prototype.abort = function (reason) {
    if (reason === void 0) {
      reason = undefined;
    }

    if (!IsWritableStream(this)) {
      return promiseRejectedWith(streamBrandCheckException('abort'));
    }

    if (IsWritableStreamLocked(this)) {
      return promiseRejectedWith(new TypeError('Cannot abort a stream that already has a writer'));
    }

    return WritableStreamAbort(this, reason);
  };

  WritableStream.prototype.close = function () {
    if (!IsWritableStream(this)) {
      return promiseRejectedWith(streamBrandCheckException('close'));
    }

    if (IsWritableStreamLocked(this)) {
      return promiseRejectedWith(new TypeError('Cannot close a stream that already has a writer'));
    }

    if (WritableStreamCloseQueuedOrInFlight(this)) {
      return promiseRejectedWith(new TypeError('Cannot close an already-closing stream'));
    }

    return WritableStreamClose(this);
  };

  WritableStream.prototype.getWriter = function () {
    if (!IsWritableStream(this)) {
      throw streamBrandCheckException('getWriter');
    }

    return AcquireWritableStreamDefaultWriter(this);
  };

  return WritableStream;
}();

Object.defineProperties(WritableStream.prototype, {
  abort: {
    enumerable: true
  },
  close: {
    enumerable: true
  },
  getWriter: {
    enumerable: true
  },
  locked: {
    enumerable: true
  }
});

if (typeof SymbolPolyfill.toStringTag === 'symbol') {
  Object.defineProperty(WritableStream.prototype, SymbolPolyfill.toStringTag, {
    value: 'WritableStream',
    configurable: true
  });
}

function AcquireWritableStreamDefaultWriter(stream) {
  return new WritableStreamDefaultWriter(stream);
}

function CreateWritableStream(startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm) {
  if (highWaterMark === void 0) {
    highWaterMark = 1;
  }

  if (sizeAlgorithm === void 0) {
    sizeAlgorithm = function () {
      return 1;
    };
  }

  var stream = Object.create(WritableStream.prototype);
  InitializeWritableStream(stream);
  var controller = Object.create(WritableStreamDefaultController.prototype);
  SetUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm);
  return stream;
}

function InitializeWritableStream(stream) {
  stream._state = 'writable';
  stream._storedError = undefined;
  stream._writer = undefined;
  stream._writableStreamController = undefined;
  stream._writeRequests = new SimpleQueue();
  stream._inFlightWriteRequest = undefined;
  stream._closeRequest = undefined;
  stream._inFlightCloseRequest = undefined;
  stream._pendingAbortRequest = undefined;
  stream._backpressure = false;
}

function IsWritableStream(x) {
  if (!typeIsObject(x)) {
    return false;
  }

  if (!Object.prototype.hasOwnProperty.call(x, '_writableStreamController')) {
    return false;
  }

  return true;
}

function IsWritableStreamLocked(stream) {
  if (stream._writer === undefined) {
    return false;
  }

  return true;
}

function WritableStreamAbort(stream, reason) {
  var state = stream._state;

  if (state === 'closed' || state === 'errored') {
    return promiseResolvedWith(undefined);
  }

  if (stream._pendingAbortRequest !== undefined) {
    return stream._pendingAbortRequest._promise;
  }

  var wasAlreadyErroring = false;

  if (state === 'erroring') {
    wasAlreadyErroring = true;
    reason = undefined;
  }

  var promise = newPromise(function (resolve, reject) {
    stream._pendingAbortRequest = {
      _promise: undefined,
      _resolve: resolve,
      _reject: reject,
      _reason: reason,
      _wasAlreadyErroring: wasAlreadyErroring
    };
  });
  stream._pendingAbortRequest._promise = promise;

  if (!wasAlreadyErroring) {
    WritableStreamStartErroring(stream, reason);
  }

  return promise;
}

function WritableStreamClose(stream) {
  var state = stream._state;

  if (state === 'closed' || state === 'errored') {
    return promiseRejectedWith(new TypeError("The stream (in " + state + " state) is not in the writable state and cannot be closed"));
  }

  var promise = newPromise(function (resolve, reject) {
    var closeRequest = {
      _resolve: resolve,
      _reject: reject
    };
    stream._closeRequest = closeRequest;
  });
  var writer = stream._writer;

  if (writer !== undefined && stream._backpressure && state === 'writable') {
    defaultWriterReadyPromiseResolve(writer);
  }

  WritableStreamDefaultControllerClose(stream._writableStreamController);
  return promise;
}

function WritableStreamAddWriteRequest(stream) {
  var promise = newPromise(function (resolve, reject) {
    var writeRequest = {
      _resolve: resolve,
      _reject: reject
    };

    stream._writeRequests.push(writeRequest);
  });
  return promise;
}

function WritableStreamDealWithRejection(stream, error) {
  var state = stream._state;

  if (state === 'writable') {
    WritableStreamStartErroring(stream, error);
    return;
  }

  WritableStreamFinishErroring(stream);
}

function WritableStreamStartErroring(stream, reason) {
  var controller = stream._writableStreamController;
  stream._state = 'erroring';
  stream._storedError = reason;
  var writer = stream._writer;

  if (writer !== undefined) {
    WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, reason);
  }

  if (!WritableStreamHasOperationMarkedInFlight(stream) && controller._started) {
    WritableStreamFinishErroring(stream);
  }
}

function WritableStreamFinishErroring(stream) {
  stream._state = 'errored';

  stream._writableStreamController[ErrorSteps]();

  var storedError = stream._storedError;

  stream._writeRequests.forEach(function (writeRequest) {
    writeRequest._reject(storedError);
  });

  stream._writeRequests = new SimpleQueue();

  if (stream._pendingAbortRequest === undefined) {
    WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
    return;
  }

  var abortRequest = stream._pendingAbortRequest;
  stream._pendingAbortRequest = undefined;

  if (abortRequest._wasAlreadyErroring) {
    abortRequest._reject(storedError);

    WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
    return;
  }

  var promise = stream._writableStreamController[AbortSteps](abortRequest._reason);

  uponPromise(promise, function () {
    abortRequest._resolve();

    WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
  }, function (reason) {
    abortRequest._reject(reason);

    WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
  });
}

function WritableStreamFinishInFlightWrite(stream) {
  stream._inFlightWriteRequest._resolve(undefined);

  stream._inFlightWriteRequest = undefined;
}

function WritableStreamFinishInFlightWriteWithError(stream, error) {
  stream._inFlightWriteRequest._reject(error);

  stream._inFlightWriteRequest = undefined;
  WritableStreamDealWithRejection(stream, error);
}

function WritableStreamFinishInFlightClose(stream) {
  stream._inFlightCloseRequest._resolve(undefined);

  stream._inFlightCloseRequest = undefined;
  var state = stream._state;

  if (state === 'erroring') {
    stream._storedError = undefined;

    if (stream._pendingAbortRequest !== undefined) {
      stream._pendingAbortRequest._resolve();

      stream._pendingAbortRequest = undefined;
    }
  }

  stream._state = 'closed';
  var writer = stream._writer;

  if (writer !== undefined) {
    defaultWriterClosedPromiseResolve(writer);
  }
}

function WritableStreamFinishInFlightCloseWithError(stream, error) {
  stream._inFlightCloseRequest._reject(error);

  stream._inFlightCloseRequest = undefined;

  if (stream._pendingAbortRequest !== undefined) {
    stream._pendingAbortRequest._reject(error);

    stream._pendingAbortRequest = undefined;
  }

  WritableStreamDealWithRejection(stream, error);
}

function WritableStreamCloseQueuedOrInFlight(stream) {
  if (stream._closeRequest === undefined && stream._inFlightCloseRequest === undefined) {
    return false;
  }

  return true;
}

function WritableStreamHasOperationMarkedInFlight(stream) {
  if (stream._inFlightWriteRequest === undefined && stream._inFlightCloseRequest === undefined) {
    return false;
  }

  return true;
}

function WritableStreamMarkCloseRequestInFlight(stream) {
  stream._inFlightCloseRequest = stream._closeRequest;
  stream._closeRequest = undefined;
}

function WritableStreamMarkFirstWriteRequestInFlight(stream) {
  stream._inFlightWriteRequest = stream._writeRequests.shift();
}

function WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream) {
  if (stream._closeRequest !== undefined) {
    stream._closeRequest._reject(stream._storedError);

    stream._closeRequest = undefined;
  }

  var writer = stream._writer;

  if (writer !== undefined) {
    defaultWriterClosedPromiseReject(writer, stream._storedError);
  }
}

function WritableStreamUpdateBackpressure(stream, backpressure) {
  var writer = stream._writer;

  if (writer !== undefined && backpressure !== stream._backpressure) {
    if (backpressure) {
      defaultWriterReadyPromiseReset(writer);
    } else {
      defaultWriterReadyPromiseResolve(writer);
    }
  }

  stream._backpressure = backpressure;
}

var WritableStreamDefaultWriter = function () {
  function WritableStreamDefaultWriter(stream) {
    assertRequiredArgument(stream, 1, 'WritableStreamDefaultWriter');
    assertWritableStream(stream, 'First parameter');

    if (IsWritableStreamLocked(stream)) {
      throw new TypeError('This stream has already been locked for exclusive writing by another writer');
    }

    this._ownerWritableStream = stream;
    stream._writer = this;
    var state = stream._state;

    if (state === 'writable') {
      if (!WritableStreamCloseQueuedOrInFlight(stream) && stream._backpressure) {
        defaultWriterReadyPromiseInitialize(this);
      } else {
        defaultWriterReadyPromiseInitializeAsResolved(this);
      }

      defaultWriterClosedPromiseInitialize(this);
    } else if (state === 'erroring') {
      defaultWriterReadyPromiseInitializeAsRejected(this, stream._storedError);
      defaultWriterClosedPromiseInitialize(this);
    } else if (state === 'closed') {
      defaultWriterReadyPromiseInitializeAsResolved(this);
      defaultWriterClosedPromiseInitializeAsResolved(this);
    } else {
      var storedError = stream._storedError;
      defaultWriterReadyPromiseInitializeAsRejected(this, storedError);
      defaultWriterClosedPromiseInitializeAsRejected(this, storedError);
    }
  }

  Object.defineProperty(WritableStreamDefaultWriter.prototype, "closed", {
    get: function () {
      if (!IsWritableStreamDefaultWriter(this)) {
        return promiseRejectedWith(defaultWriterBrandCheckException('closed'));
      }

      return this._closedPromise;
    },
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(WritableStreamDefaultWriter.prototype, "desiredSize", {
    get: function () {
      if (!IsWritableStreamDefaultWriter(this)) {
        throw defaultWriterBrandCheckException('desiredSize');
      }

      if (this._ownerWritableStream === undefined) {
        throw defaultWriterLockException('desiredSize');
      }

      return WritableStreamDefaultWriterGetDesiredSize(this);
    },
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(WritableStreamDefaultWriter.prototype, "ready", {
    get: function () {
      if (!IsWritableStreamDefaultWriter(this)) {
        return promiseRejectedWith(defaultWriterBrandCheckException('ready'));
      }

      return this._readyPromise;
    },
    enumerable: false,
    configurable: true
  });

  WritableStreamDefaultWriter.prototype.abort = function (reason) {
    if (reason === void 0) {
      reason = undefined;
    }

    if (!IsWritableStreamDefaultWriter(this)) {
      return promiseRejectedWith(defaultWriterBrandCheckException('abort'));
    }

    if (this._ownerWritableStream === undefined) {
      return promiseRejectedWith(defaultWriterLockException('abort'));
    }

    return WritableStreamDefaultWriterAbort(this, reason);
  };

  WritableStreamDefaultWriter.prototype.close = function () {
    if (!IsWritableStreamDefaultWriter(this)) {
      return promiseRejectedWith(defaultWriterBrandCheckException('close'));
    }

    var stream = this._ownerWritableStream;

    if (stream === undefined) {
      return promiseRejectedWith(defaultWriterLockException('close'));
    }

    if (WritableStreamCloseQueuedOrInFlight(stream)) {
      return promiseRejectedWith(new TypeError('Cannot close an already-closing stream'));
    }

    return WritableStreamDefaultWriterClose(this);
  };

  WritableStreamDefaultWriter.prototype.releaseLock = function () {
    if (!IsWritableStreamDefaultWriter(this)) {
      throw defaultWriterBrandCheckException('releaseLock');
    }

    var stream = this._ownerWritableStream;

    if (stream === undefined) {
      return;
    }

    WritableStreamDefaultWriterRelease(this);
  };

  WritableStreamDefaultWriter.prototype.write = function (chunk) {
    if (chunk === void 0) {
      chunk = undefined;
    }

    if (!IsWritableStreamDefaultWriter(this)) {
      return promiseRejectedWith(defaultWriterBrandCheckException('write'));
    }

    if (this._ownerWritableStream === undefined) {
      return promiseRejectedWith(defaultWriterLockException('write to'));
    }

    return WritableStreamDefaultWriterWrite(this, chunk);
  };

  return WritableStreamDefaultWriter;
}();

Object.defineProperties(WritableStreamDefaultWriter.prototype, {
  abort: {
    enumerable: true
  },
  close: {
    enumerable: true
  },
  releaseLock: {
    enumerable: true
  },
  write: {
    enumerable: true
  },
  closed: {
    enumerable: true
  },
  desiredSize: {
    enumerable: true
  },
  ready: {
    enumerable: true
  }
});

if (typeof SymbolPolyfill.toStringTag === 'symbol') {
  Object.defineProperty(WritableStreamDefaultWriter.prototype, SymbolPolyfill.toStringTag, {
    value: 'WritableStreamDefaultWriter',
    configurable: true
  });
}

function IsWritableStreamDefaultWriter(x) {
  if (!typeIsObject(x)) {
    return false;
  }

  if (!Object.prototype.hasOwnProperty.call(x, '_ownerWritableStream')) {
    return false;
  }

  return true;
}

function WritableStreamDefaultWriterAbort(writer, reason) {
  var stream = writer._ownerWritableStream;
  return WritableStreamAbort(stream, reason);
}

function WritableStreamDefaultWriterClose(writer) {
  var stream = writer._ownerWritableStream;
  return WritableStreamClose(stream);
}

function WritableStreamDefaultWriterCloseWithErrorPropagation(writer) {
  var stream = writer._ownerWritableStream;
  var state = stream._state;

  if (WritableStreamCloseQueuedOrInFlight(stream) || state === 'closed') {
    return promiseResolvedWith(undefined);
  }

  if (state === 'errored') {
    return promiseRejectedWith(stream._storedError);
  }

  return WritableStreamDefaultWriterClose(writer);
}

function WritableStreamDefaultWriterEnsureClosedPromiseRejected(writer, error) {
  if (writer._closedPromiseState === 'pending') {
    defaultWriterClosedPromiseReject(writer, error);
  } else {
    defaultWriterClosedPromiseResetToRejected(writer, error);
  }
}

function WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, error) {
  if (writer._readyPromiseState === 'pending') {
    defaultWriterReadyPromiseReject(writer, error);
  } else {
    defaultWriterReadyPromiseResetToRejected(writer, error);
  }
}

function WritableStreamDefaultWriterGetDesiredSize(writer) {
  var stream = writer._ownerWritableStream;
  var state = stream._state;

  if (state === 'errored' || state === 'erroring') {
    return null;
  }

  if (state === 'closed') {
    return 0;
  }

  return WritableStreamDefaultControllerGetDesiredSize(stream._writableStreamController);
}

function WritableStreamDefaultWriterRelease(writer) {
  var stream = writer._ownerWritableStream;
  var releasedError = new TypeError("Writer was released and can no longer be used to monitor the stream's closedness");
  WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, releasedError);
  WritableStreamDefaultWriterEnsureClosedPromiseRejected(writer, releasedError);
  stream._writer = undefined;
  writer._ownerWritableStream = undefined;
}

function WritableStreamDefaultWriterWrite(writer, chunk) {
  var stream = writer._ownerWritableStream;
  var controller = stream._writableStreamController;
  var chunkSize = WritableStreamDefaultControllerGetChunkSize(controller, chunk);

  if (stream !== writer._ownerWritableStream) {
    return promiseRejectedWith(defaultWriterLockException('write to'));
  }

  var state = stream._state;

  if (state === 'errored') {
    return promiseRejectedWith(stream._storedError);
  }

  if (WritableStreamCloseQueuedOrInFlight(stream) || state === 'closed') {
    return promiseRejectedWith(new TypeError('The stream is closing or closed and cannot be written to'));
  }

  if (state === 'erroring') {
    return promiseRejectedWith(stream._storedError);
  }

  var promise = WritableStreamAddWriteRequest(stream);
  WritableStreamDefaultControllerWrite(controller, chunk, chunkSize);
  return promise;
}

var closeSentinel = {};

var WritableStreamDefaultController = function () {
  function WritableStreamDefaultController() {
    throw new TypeError('Illegal constructor');
  }

  WritableStreamDefaultController.prototype.error = function (e) {
    if (e === void 0) {
      e = undefined;
    }

    if (!IsWritableStreamDefaultController(this)) {
      throw new TypeError('WritableStreamDefaultController.prototype.error can only be used on a WritableStreamDefaultController');
    }

    var state = this._controlledWritableStream._state;

    if (state !== 'writable') {
      return;
    }

    WritableStreamDefaultControllerError(this, e);
  };

  WritableStreamDefaultController.prototype[AbortSteps] = function (reason) {
    var result = this._abortAlgorithm(reason);

    WritableStreamDefaultControllerClearAlgorithms(this);
    return result;
  };

  WritableStreamDefaultController.prototype[ErrorSteps] = function () {
    ResetQueue(this);
  };

  return WritableStreamDefaultController;
}();

Object.defineProperties(WritableStreamDefaultController.prototype, {
  error: {
    enumerable: true
  }
});

if (typeof SymbolPolyfill.toStringTag === 'symbol') {
  Object.defineProperty(WritableStreamDefaultController.prototype, SymbolPolyfill.toStringTag, {
    value: 'WritableStreamDefaultController',
    configurable: true
  });
}

function IsWritableStreamDefaultController(x) {
  if (!typeIsObject(x)) {
    return false;
  }

  if (!Object.prototype.hasOwnProperty.call(x, '_controlledWritableStream')) {
    return false;
  }

  return true;
}

function SetUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm) {
  controller._controlledWritableStream = stream;
  stream._writableStreamController = controller;
  controller._queue = undefined;
  controller._queueTotalSize = undefined;
  ResetQueue(controller);
  controller._started = false;
  controller._strategySizeAlgorithm = sizeAlgorithm;
  controller._strategyHWM = highWaterMark;
  controller._writeAlgorithm = writeAlgorithm;
  controller._closeAlgorithm = closeAlgorithm;
  controller._abortAlgorithm = abortAlgorithm;
  var backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
  WritableStreamUpdateBackpressure(stream, backpressure);
  var startResult = startAlgorithm();
  var startPromise = promiseResolvedWith(startResult);
  uponPromise(startPromise, function () {
    controller._started = true;
    WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
  }, function (r) {
    controller._started = true;
    WritableStreamDealWithRejection(stream, r);
  });
}

function SetUpWritableStreamDefaultControllerFromUnderlyingSink(stream, underlyingSink, highWaterMark, sizeAlgorithm) {
  var controller = Object.create(WritableStreamDefaultController.prototype);

  var startAlgorithm = function () {
    return undefined;
  };

  var writeAlgorithm = function () {
    return promiseResolvedWith(undefined);
  };

  var closeAlgorithm = function () {
    return promiseResolvedWith(undefined);
  };

  var abortAlgorithm = function () {
    return promiseResolvedWith(undefined);
  };

  if (underlyingSink.start !== undefined) {
    startAlgorithm = function () {
      return underlyingSink.start(controller);
    };
  }

  if (underlyingSink.write !== undefined) {
    writeAlgorithm = function (chunk) {
      return underlyingSink.write(chunk, controller);
    };
  }

  if (underlyingSink.close !== undefined) {
    closeAlgorithm = function () {
      return underlyingSink.close();
    };
  }

  if (underlyingSink.abort !== undefined) {
    abortAlgorithm = function (reason) {
      return underlyingSink.abort(reason);
    };
  }

  SetUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm);
}

function WritableStreamDefaultControllerClearAlgorithms(controller) {
  controller._writeAlgorithm = undefined;
  controller._closeAlgorithm = undefined;
  controller._abortAlgorithm = undefined;
  controller._strategySizeAlgorithm = undefined;
}

function WritableStreamDefaultControllerClose(controller) {
  EnqueueValueWithSize(controller, closeSentinel, 0);
  WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
}

function WritableStreamDefaultControllerGetChunkSize(controller, chunk) {
  try {
    return controller._strategySizeAlgorithm(chunk);
  } catch (chunkSizeE) {
    WritableStreamDefaultControllerErrorIfNeeded(controller, chunkSizeE);
    return 1;
  }
}

function WritableStreamDefaultControllerGetDesiredSize(controller) {
  return controller._strategyHWM - controller._queueTotalSize;
}

function WritableStreamDefaultControllerWrite(controller, chunk, chunkSize) {
  try {
    EnqueueValueWithSize(controller, chunk, chunkSize);
  } catch (enqueueE) {
    WritableStreamDefaultControllerErrorIfNeeded(controller, enqueueE);
    return;
  }

  var stream = controller._controlledWritableStream;

  if (!WritableStreamCloseQueuedOrInFlight(stream) && stream._state === 'writable') {
    var backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
    WritableStreamUpdateBackpressure(stream, backpressure);
  }

  WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
}

function WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller) {
  var stream = controller._controlledWritableStream;

  if (!controller._started) {
    return;
  }

  if (stream._inFlightWriteRequest !== undefined) {
    return;
  }

  var state = stream._state;

  if (state === 'erroring') {
    WritableStreamFinishErroring(stream);
    return;
  }

  if (controller._queue.length === 0) {
    return;
  }

  var value = PeekQueueValue(controller);

  if (value === closeSentinel) {
    WritableStreamDefaultControllerProcessClose(controller);
  } else {
    WritableStreamDefaultControllerProcessWrite(controller, value);
  }
}

function WritableStreamDefaultControllerErrorIfNeeded(controller, error) {
  if (controller._controlledWritableStream._state === 'writable') {
    WritableStreamDefaultControllerError(controller, error);
  }
}

function WritableStreamDefaultControllerProcessClose(controller) {
  var stream = controller._controlledWritableStream;
  WritableStreamMarkCloseRequestInFlight(stream);
  DequeueValue(controller);

  var sinkClosePromise = controller._closeAlgorithm();

  WritableStreamDefaultControllerClearAlgorithms(controller);
  uponPromise(sinkClosePromise, function () {
    WritableStreamFinishInFlightClose(stream);
  }, function (reason) {
    WritableStreamFinishInFlightCloseWithError(stream, reason);
  });
}

function WritableStreamDefaultControllerProcessWrite(controller, chunk) {
  var stream = controller._controlledWritableStream;
  WritableStreamMarkFirstWriteRequestInFlight(stream);

  var sinkWritePromise = controller._writeAlgorithm(chunk);

  uponPromise(sinkWritePromise, function () {
    WritableStreamFinishInFlightWrite(stream);
    var state = stream._state;
    DequeueValue(controller);

    if (!WritableStreamCloseQueuedOrInFlight(stream) && state === 'writable') {
      var backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
      WritableStreamUpdateBackpressure(stream, backpressure);
    }

    WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
  }, function (reason) {
    if (stream._state === 'writable') {
      WritableStreamDefaultControllerClearAlgorithms(controller);
    }

    WritableStreamFinishInFlightWriteWithError(stream, reason);
  });
}

function WritableStreamDefaultControllerGetBackpressure(controller) {
  var desiredSize = WritableStreamDefaultControllerGetDesiredSize(controller);
  return desiredSize <= 0;
}

function WritableStreamDefaultControllerError(controller, error) {
  var stream = controller._controlledWritableStream;
  WritableStreamDefaultControllerClearAlgorithms(controller);
  WritableStreamStartErroring(stream, error);
}

function streamBrandCheckException(name) {
  return new TypeError("WritableStream.prototype." + name + " can only be used on a WritableStream");
}

function defaultWriterBrandCheckException(name) {
  return new TypeError("WritableStreamDefaultWriter.prototype." + name + " can only be used on a WritableStreamDefaultWriter");
}

function defaultWriterLockException(name) {
  return new TypeError('Cannot ' + name + ' a stream using a released writer');
}

function defaultWriterClosedPromiseInitialize(writer) {
  writer._closedPromise = newPromise(function (resolve, reject) {
    writer._closedPromise_resolve = resolve;
    writer._closedPromise_reject = reject;
    writer._closedPromiseState = 'pending';
  });
}

function defaultWriterClosedPromiseInitializeAsRejected(writer, reason) {
  defaultWriterClosedPromiseInitialize(writer);
  defaultWriterClosedPromiseReject(writer, reason);
}

function defaultWriterClosedPromiseInitializeAsResolved(writer) {
  defaultWriterClosedPromiseInitialize(writer);
  defaultWriterClosedPromiseResolve(writer);
}

function defaultWriterClosedPromiseReject(writer, reason) {
  setPromiseIsHandledToTrue(writer._closedPromise);

  writer._closedPromise_reject(reason);

  writer._closedPromise_resolve = undefined;
  writer._closedPromise_reject = undefined;
  writer._closedPromiseState = 'rejected';
}

function defaultWriterClosedPromiseResetToRejected(writer, reason) {
  defaultWriterClosedPromiseInitializeAsRejected(writer, reason);
}

function defaultWriterClosedPromiseResolve(writer) {
  writer._closedPromise_resolve(undefined);

  writer._closedPromise_resolve = undefined;
  writer._closedPromise_reject = undefined;
  writer._closedPromiseState = 'resolved';
}

function defaultWriterReadyPromiseInitialize(writer) {
  writer._readyPromise = newPromise(function (resolve, reject) {
    writer._readyPromise_resolve = resolve;
    writer._readyPromise_reject = reject;
  });
  writer._readyPromiseState = 'pending';
}

function defaultWriterReadyPromiseInitializeAsRejected(writer, reason) {
  defaultWriterReadyPromiseInitialize(writer);
  defaultWriterReadyPromiseReject(writer, reason);
}

function defaultWriterReadyPromiseInitializeAsResolved(writer) {
  defaultWriterReadyPromiseInitialize(writer);
  defaultWriterReadyPromiseResolve(writer);
}

function defaultWriterReadyPromiseReject(writer, reason) {
  setPromiseIsHandledToTrue(writer._readyPromise);

  writer._readyPromise_reject(reason);

  writer._readyPromise_resolve = undefined;
  writer._readyPromise_reject = undefined;
  writer._readyPromiseState = 'rejected';
}

function defaultWriterReadyPromiseReset(writer) {
  defaultWriterReadyPromiseInitialize(writer);
}

function defaultWriterReadyPromiseResetToRejected(writer, reason) {
  defaultWriterReadyPromiseInitializeAsRejected(writer, reason);
}

function defaultWriterReadyPromiseResolve(writer) {
  writer._readyPromise_resolve(undefined);

  writer._readyPromise_resolve = undefined;
  writer._readyPromise_reject = undefined;
  writer._readyPromiseState = 'fulfilled';
}

function isAbortSignal(value) {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  try {
    return typeof value.aborted === 'boolean';
  } catch (_a) {
    return false;
  }
}

var NativeDOMException = typeof DOMException !== 'undefined' ? DOMException : undefined;

function isDOMExceptionConstructor(ctor) {
  if (!(typeof ctor === 'function' || typeof ctor === 'object')) {
    return false;
  }

  try {
    new ctor();
    return true;
  } catch (_a) {
    return false;
  }
}

function createDOMExceptionPolyfill() {
  var ctor = function DOMException(message, name) {
    this.message = message || '';
    this.name = name || 'Error';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  };

  ctor.prototype = Object.create(Error.prototype);
  Object.defineProperty(ctor.prototype, 'constructor', {
    value: ctor,
    writable: true,
    configurable: true
  });
  return ctor;
}

var DOMException$1 = isDOMExceptionConstructor(NativeDOMException) ? NativeDOMException : createDOMExceptionPolyfill();

function ReadableStreamPipeTo(source, dest, preventClose, preventAbort, preventCancel, signal) {
  var reader = AcquireReadableStreamDefaultReader(source);
  var writer = AcquireWritableStreamDefaultWriter(dest);
  source._disturbed = true;
  var shuttingDown = false;
  var currentWrite = promiseResolvedWith(undefined);
  return newPromise(function (resolve, reject) {
    var abortAlgorithm;

    if (signal !== undefined) {
      abortAlgorithm = function () {
        var error = new DOMException$1('Aborted', 'AbortError');
        var actions = [];

        if (!preventAbort) {
          actions.push(function () {
            if (dest._state === 'writable') {
              return WritableStreamAbort(dest, error);
            }

            return promiseResolvedWith(undefined);
          });
        }

        if (!preventCancel) {
          actions.push(function () {
            if (source._state === 'readable') {
              return ReadableStreamCancel(source, error);
            }

            return promiseResolvedWith(undefined);
          });
        }

        shutdownWithAction(function () {
          return Promise.all(actions.map(function (action) {
            return action();
          }));
        }, true, error);
      };

      if (signal.aborted) {
        abortAlgorithm();
        return;
      }

      signal.addEventListener('abort', abortAlgorithm);
    }

    function pipeLoop() {
      return newPromise(function (resolveLoop, rejectLoop) {
        function next(done) {
          if (done) {
            resolveLoop();
          } else {
            PerformPromiseThen(pipeStep(), next, rejectLoop);
          }
        }

        next(false);
      });
    }

    function pipeStep() {
      if (shuttingDown) {
        return promiseResolvedWith(true);
      }

      return PerformPromiseThen(writer._readyPromise, function () {
        return newPromise(function (resolveRead, rejectRead) {
          ReadableStreamDefaultReaderRead(reader, {
            _chunkSteps: function (chunk) {
              currentWrite = PerformPromiseThen(WritableStreamDefaultWriterWrite(writer, chunk), undefined, noop);
              resolveRead(false);
            },
            _closeSteps: function () {
              return resolveRead(true);
            },
            _errorSteps: rejectRead
          });
        });
      });
    }

    isOrBecomesErrored(source, reader._closedPromise, function (storedError) {
      if (!preventAbort) {
        shutdownWithAction(function () {
          return WritableStreamAbort(dest, storedError);
        }, true, storedError);
      } else {
        shutdown(true, storedError);
      }
    });
    isOrBecomesErrored(dest, writer._closedPromise, function (storedError) {
      if (!preventCancel) {
        shutdownWithAction(function () {
          return ReadableStreamCancel(source, storedError);
        }, true, storedError);
      } else {
        shutdown(true, storedError);
      }
    });
    isOrBecomesClosed(source, reader._closedPromise, function () {
      if (!preventClose) {
        shutdownWithAction(function () {
          return WritableStreamDefaultWriterCloseWithErrorPropagation(writer);
        });
      } else {
        shutdown();
      }
    });

    if (WritableStreamCloseQueuedOrInFlight(dest) || dest._state === 'closed') {
      var destClosed_1 = new TypeError('the destination writable stream closed before all data could be piped to it');

      if (!preventCancel) {
        shutdownWithAction(function () {
          return ReadableStreamCancel(source, destClosed_1);
        }, true, destClosed_1);
      } else {
        shutdown(true, destClosed_1);
      }
    }

    setPromiseIsHandledToTrue(pipeLoop());

    function waitForWritesToFinish() {
      var oldCurrentWrite = currentWrite;
      return PerformPromiseThen(currentWrite, function () {
        return oldCurrentWrite !== currentWrite ? waitForWritesToFinish() : undefined;
      });
    }

    function isOrBecomesErrored(stream, promise, action) {
      if (stream._state === 'errored') {
        action(stream._storedError);
      } else {
        uponRejection(promise, action);
      }
    }

    function isOrBecomesClosed(stream, promise, action) {
      if (stream._state === 'closed') {
        action();
      } else {
        uponFulfillment(promise, action);
      }
    }

    function shutdownWithAction(action, originalIsError, originalError) {
      if (shuttingDown) {
        return;
      }

      shuttingDown = true;

      if (dest._state === 'writable' && !WritableStreamCloseQueuedOrInFlight(dest)) {
        uponFulfillment(waitForWritesToFinish(), doTheRest);
      } else {
        doTheRest();
      }

      function doTheRest() {
        uponPromise(action(), function () {
          return finalize(originalIsError, originalError);
        }, function (newError) {
          return finalize(true, newError);
        });
      }
    }

    function shutdown(isError, error) {
      if (shuttingDown) {
        return;
      }

      shuttingDown = true;

      if (dest._state === 'writable' && !WritableStreamCloseQueuedOrInFlight(dest)) {
        uponFulfillment(waitForWritesToFinish(), function () {
          return finalize(isError, error);
        });
      } else {
        finalize(isError, error);
      }
    }

    function finalize(isError, error) {
      WritableStreamDefaultWriterRelease(writer);
      ReadableStreamReaderGenericRelease(reader);

      if (signal !== undefined) {
        signal.removeEventListener('abort', abortAlgorithm);
      }

      if (isError) {
        reject(error);
      } else {
        resolve(undefined);
      }
    }
  });
}

var ReadableStreamDefaultController = function () {
  function ReadableStreamDefaultController() {
    throw new TypeError('Illegal constructor');
  }

  Object.defineProperty(ReadableStreamDefaultController.prototype, "desiredSize", {
    get: function () {
      if (!IsReadableStreamDefaultController(this)) {
        throw defaultControllerBrandCheckException('desiredSize');
      }

      return ReadableStreamDefaultControllerGetDesiredSize(this);
    },
    enumerable: false,
    configurable: true
  });

  ReadableStreamDefaultController.prototype.close = function () {
    if (!IsReadableStreamDefaultController(this)) {
      throw defaultControllerBrandCheckException('close');
    }

    if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(this)) {
      throw new TypeError('The stream is not in a state that permits close');
    }

    ReadableStreamDefaultControllerClose(this);
  };

  ReadableStreamDefaultController.prototype.enqueue = function (chunk) {
    if (chunk === void 0) {
      chunk = undefined;
    }

    if (!IsReadableStreamDefaultController(this)) {
      throw defaultControllerBrandCheckException('enqueue');
    }

    if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(this)) {
      throw new TypeError('The stream is not in a state that permits enqueue');
    }

    return ReadableStreamDefaultControllerEnqueue(this, chunk);
  };

  ReadableStreamDefaultController.prototype.error = function (e) {
    if (e === void 0) {
      e = undefined;
    }

    if (!IsReadableStreamDefaultController(this)) {
      throw defaultControllerBrandCheckException('error');
    }

    ReadableStreamDefaultControllerError(this, e);
  };

  ReadableStreamDefaultController.prototype[CancelSteps] = function (reason) {
    ResetQueue(this);

    var result = this._cancelAlgorithm(reason);

    ReadableStreamDefaultControllerClearAlgorithms(this);
    return result;
  };

  ReadableStreamDefaultController.prototype[PullSteps] = function (readRequest) {
    var stream = this._controlledReadableStream;

    if (this._queue.length > 0) {
      var chunk = DequeueValue(this);

      if (this._closeRequested && this._queue.length === 0) {
        ReadableStreamDefaultControllerClearAlgorithms(this);
        ReadableStreamClose(stream);
      } else {
        ReadableStreamDefaultControllerCallPullIfNeeded(this);
      }

      readRequest._chunkSteps(chunk);
    } else {
      ReadableStreamAddReadRequest(stream, readRequest);
      ReadableStreamDefaultControllerCallPullIfNeeded(this);
    }
  };

  return ReadableStreamDefaultController;
}();

Object.defineProperties(ReadableStreamDefaultController.prototype, {
  close: {
    enumerable: true
  },
  enqueue: {
    enumerable: true
  },
  error: {
    enumerable: true
  },
  desiredSize: {
    enumerable: true
  }
});

if (typeof SymbolPolyfill.toStringTag === 'symbol') {
  Object.defineProperty(ReadableStreamDefaultController.prototype, SymbolPolyfill.toStringTag, {
    value: 'ReadableStreamDefaultController',
    configurable: true
  });
}

function IsReadableStreamDefaultController(x) {
  if (!typeIsObject(x)) {
    return false;
  }

  if (!Object.prototype.hasOwnProperty.call(x, '_controlledReadableStream')) {
    return false;
  }

  return true;
}

function ReadableStreamDefaultControllerCallPullIfNeeded(controller) {
  var shouldPull = ReadableStreamDefaultControllerShouldCallPull(controller);

  if (!shouldPull) {
    return;
  }

  if (controller._pulling) {
    controller._pullAgain = true;
    return;
  }

  controller._pulling = true;

  var pullPromise = controller._pullAlgorithm();

  uponPromise(pullPromise, function () {
    controller._pulling = false;

    if (controller._pullAgain) {
      controller._pullAgain = false;
      ReadableStreamDefaultControllerCallPullIfNeeded(controller);
    }
  }, function (e) {
    ReadableStreamDefaultControllerError(controller, e);
  });
}

function ReadableStreamDefaultControllerShouldCallPull(controller) {
  var stream = controller._controlledReadableStream;

  if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
    return false;
  }

  if (!controller._started) {
    return false;
  }

  if (IsReadableStreamLocked(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
    return true;
  }

  var desiredSize = ReadableStreamDefaultControllerGetDesiredSize(controller);

  if (desiredSize > 0) {
    return true;
  }

  return false;
}

function ReadableStreamDefaultControllerClearAlgorithms(controller) {
  controller._pullAlgorithm = undefined;
  controller._cancelAlgorithm = undefined;
  controller._strategySizeAlgorithm = undefined;
}

function ReadableStreamDefaultControllerClose(controller) {
  if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
    return;
  }

  var stream = controller._controlledReadableStream;
  controller._closeRequested = true;

  if (controller._queue.length === 0) {
    ReadableStreamDefaultControllerClearAlgorithms(controller);
    ReadableStreamClose(stream);
  }
}

function ReadableStreamDefaultControllerEnqueue(controller, chunk) {
  if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
    return;
  }

  var stream = controller._controlledReadableStream;

  if (IsReadableStreamLocked(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
    ReadableStreamFulfillReadRequest(stream, chunk, false);
  } else {
    var chunkSize = void 0;

    try {
      chunkSize = controller._strategySizeAlgorithm(chunk);
    } catch (chunkSizeE) {
      ReadableStreamDefaultControllerError(controller, chunkSizeE);
      throw chunkSizeE;
    }

    try {
      EnqueueValueWithSize(controller, chunk, chunkSize);
    } catch (enqueueE) {
      ReadableStreamDefaultControllerError(controller, enqueueE);
      throw enqueueE;
    }
  }

  ReadableStreamDefaultControllerCallPullIfNeeded(controller);
}

function ReadableStreamDefaultControllerError(controller, e) {
  var stream = controller._controlledReadableStream;

  if (stream._state !== 'readable') {
    return;
  }

  ResetQueue(controller);
  ReadableStreamDefaultControllerClearAlgorithms(controller);
  ReadableStreamError(stream, e);
}

function ReadableStreamDefaultControllerGetDesiredSize(controller) {
  var stream = controller._controlledReadableStream;
  var state = stream._state;

  if (state === 'errored') {
    return null;
  }

  if (state === 'closed') {
    return 0;
  }

  return controller._strategyHWM - controller._queueTotalSize;
}

function ReadableStreamDefaultControllerHasBackpressure(controller) {
  if (ReadableStreamDefaultControllerShouldCallPull(controller)) {
    return false;
  }

  return true;
}

function ReadableStreamDefaultControllerCanCloseOrEnqueue(controller) {
  var state = controller._controlledReadableStream._state;

  if (!controller._closeRequested && state === 'readable') {
    return true;
  }

  return false;
}

function SetUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm) {
  controller._controlledReadableStream = stream;
  controller._queue = undefined;
  controller._queueTotalSize = undefined;
  ResetQueue(controller);
  controller._started = false;
  controller._closeRequested = false;
  controller._pullAgain = false;
  controller._pulling = false;
  controller._strategySizeAlgorithm = sizeAlgorithm;
  controller._strategyHWM = highWaterMark;
  controller._pullAlgorithm = pullAlgorithm;
  controller._cancelAlgorithm = cancelAlgorithm;
  stream._readableStreamController = controller;
  var startResult = startAlgorithm();
  uponPromise(promiseResolvedWith(startResult), function () {
    controller._started = true;
    ReadableStreamDefaultControllerCallPullIfNeeded(controller);
  }, function (r) {
    ReadableStreamDefaultControllerError(controller, r);
  });
}

function SetUpReadableStreamDefaultControllerFromUnderlyingSource(stream, underlyingSource, highWaterMark, sizeAlgorithm) {
  var controller = Object.create(ReadableStreamDefaultController.prototype);

  var startAlgorithm = function () {
    return undefined;
  };

  var pullAlgorithm = function () {
    return promiseResolvedWith(undefined);
  };

  var cancelAlgorithm = function () {
    return promiseResolvedWith(undefined);
  };

  if (underlyingSource.start !== undefined) {
    startAlgorithm = function () {
      return underlyingSource.start(controller);
    };
  }

  if (underlyingSource.pull !== undefined) {
    pullAlgorithm = function () {
      return underlyingSource.pull(controller);
    };
  }

  if (underlyingSource.cancel !== undefined) {
    cancelAlgorithm = function (reason) {
      return underlyingSource.cancel(reason);
    };
  }

  SetUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm);
}

function defaultControllerBrandCheckException(name) {
  return new TypeError("ReadableStreamDefaultController.prototype." + name + " can only be used on a ReadableStreamDefaultController");
}

function ReadableStreamTee(stream, cloneForBranch2) {
  var reader = AcquireReadableStreamDefaultReader(stream);
  var reading = false;
  var canceled1 = false;
  var canceled2 = false;
  var reason1;
  var reason2;
  var branch1;
  var branch2;
  var resolveCancelPromise;
  var cancelPromise = newPromise(function (resolve) {
    resolveCancelPromise = resolve;
  });

  function pullAlgorithm() {
    if (reading) {
      return promiseResolvedWith(undefined);
    }

    reading = true;
    var readRequest = {
      _chunkSteps: function (value) {
        queueMicrotask(function () {
          reading = false;
          var value1 = value;
          var value2 = value;

          if (!canceled1) {
            ReadableStreamDefaultControllerEnqueue(branch1._readableStreamController, value1);
          }

          if (!canceled2) {
            ReadableStreamDefaultControllerEnqueue(branch2._readableStreamController, value2);
          }
        });
      },
      _closeSteps: function () {
        reading = false;

        if (!canceled1) {
          ReadableStreamDefaultControllerClose(branch1._readableStreamController);
        }

        if (!canceled2) {
          ReadableStreamDefaultControllerClose(branch2._readableStreamController);
        }
      },
      _errorSteps: function () {
        reading = false;
      }
    };
    ReadableStreamDefaultReaderRead(reader, readRequest);
    return promiseResolvedWith(undefined);
  }

  function cancel1Algorithm(reason) {
    canceled1 = true;
    reason1 = reason;

    if (canceled2) {
      var compositeReason = CreateArrayFromList([reason1, reason2]);
      var cancelResult = ReadableStreamCancel(stream, compositeReason);
      resolveCancelPromise(cancelResult);
    }

    return cancelPromise;
  }

  function cancel2Algorithm(reason) {
    canceled2 = true;
    reason2 = reason;

    if (canceled1) {
      var compositeReason = CreateArrayFromList([reason1, reason2]);
      var cancelResult = ReadableStreamCancel(stream, compositeReason);
      resolveCancelPromise(cancelResult);
    }

    return cancelPromise;
  }

  function startAlgorithm() {}

  branch1 = CreateReadableStream(startAlgorithm, pullAlgorithm, cancel1Algorithm);
  branch2 = CreateReadableStream(startAlgorithm, pullAlgorithm, cancel2Algorithm);
  uponRejection(reader._closedPromise, function (r) {
    ReadableStreamDefaultControllerError(branch1._readableStreamController, r);
    ReadableStreamDefaultControllerError(branch2._readableStreamController, r);
  });
  return [branch1, branch2];
}

function convertUnderlyingDefaultOrByteSource(source, context) {
  assertDictionary(source, context);
  var original = source;
  var autoAllocateChunkSize = original === null || original === void 0 ? void 0 : original.autoAllocateChunkSize;
  var cancel = original === null || original === void 0 ? void 0 : original.cancel;
  var pull = original === null || original === void 0 ? void 0 : original.pull;
  var start = original === null || original === void 0 ? void 0 : original.start;
  var type = original === null || original === void 0 ? void 0 : original.type;
  return {
    autoAllocateChunkSize: autoAllocateChunkSize === undefined ? undefined : convertUnsignedLongLongWithEnforceRange(autoAllocateChunkSize, context + " has member 'autoAllocateChunkSize' that"),
    cancel: cancel === undefined ? undefined : convertUnderlyingSourceCancelCallback(cancel, original, context + " has member 'cancel' that"),
    pull: pull === undefined ? undefined : convertUnderlyingSourcePullCallback(pull, original, context + " has member 'pull' that"),
    start: start === undefined ? undefined : convertUnderlyingSourceStartCallback(start, original, context + " has member 'start' that"),
    type: type === undefined ? undefined : convertReadableStreamType(type, context + " has member 'type' that")
  };
}

function convertUnderlyingSourceCancelCallback(fn, original, context) {
  assertFunction(fn, context);
  return function (reason) {
    return promiseCall(fn, original, [reason]);
  };
}

function convertUnderlyingSourcePullCallback(fn, original, context) {
  assertFunction(fn, context);
  return function (controller) {
    return promiseCall(fn, original, [controller]);
  };
}

function convertUnderlyingSourceStartCallback(fn, original, context) {
  assertFunction(fn, context);
  return function (controller) {
    return reflectCall(fn, original, [controller]);
  };
}

function convertReadableStreamType(type, context) {
  type = "" + type;

  if (type !== 'bytes') {
    throw new TypeError(context + " '" + type + "' is not a valid enumeration value for ReadableStreamType");
  }

  return type;
}

function convertReaderOptions(options, context) {
  assertDictionary(options, context);
  var mode = options === null || options === void 0 ? void 0 : options.mode;
  return {
    mode: mode === undefined ? undefined : convertReadableStreamReaderMode(mode, context + " has member 'mode' that")
  };
}

function convertReadableStreamReaderMode(mode, context) {
  mode = "" + mode;

  if (mode !== 'byob') {
    throw new TypeError(context + " '" + mode + "' is not a valid enumeration value for ReadableStreamReaderMode");
  }

  return mode;
}

function convertIteratorOptions(options, context) {
  assertDictionary(options, context);
  var preventCancel = options === null || options === void 0 ? void 0 : options.preventCancel;
  return {
    preventCancel: Boolean(preventCancel)
  };
}

function convertPipeOptions(options, context) {
  assertDictionary(options, context);
  var preventAbort = options === null || options === void 0 ? void 0 : options.preventAbort;
  var preventCancel = options === null || options === void 0 ? void 0 : options.preventCancel;
  var preventClose = options === null || options === void 0 ? void 0 : options.preventClose;
  var signal = options === null || options === void 0 ? void 0 : options.signal;

  if (signal !== undefined) {
    assertAbortSignal(signal, context + " has member 'signal' that");
  }

  return {
    preventAbort: Boolean(preventAbort),
    preventCancel: Boolean(preventCancel),
    preventClose: Boolean(preventClose),
    signal: signal
  };
}

function assertAbortSignal(signal, context) {
  if (!isAbortSignal(signal)) {
    throw new TypeError(context + " is not an AbortSignal.");
  }
}

function convertReadableWritablePair(pair, context) {
  assertDictionary(pair, context);
  var readable = pair === null || pair === void 0 ? void 0 : pair.readable;
  assertRequiredField(readable, 'readable', 'ReadableWritablePair');
  assertReadableStream(readable, context + " has member 'readable' that");
  var writable = pair === null || pair === void 0 ? void 0 : pair.writable;
  assertRequiredField(writable, 'writable', 'ReadableWritablePair');
  assertWritableStream(writable, context + " has member 'writable' that");
  return {
    readable: readable,
    writable: writable
  };
}

var ReadableStream = function () {
  function ReadableStream(rawUnderlyingSource, rawStrategy) {
    if (rawUnderlyingSource === void 0) {
      rawUnderlyingSource = {};
    }

    if (rawStrategy === void 0) {
      rawStrategy = {};
    }

    if (rawUnderlyingSource === undefined) {
      rawUnderlyingSource = null;
    } else {
      assertObject(rawUnderlyingSource, 'First parameter');
    }

    var strategy = convertQueuingStrategy(rawStrategy, 'Second parameter');
    var underlyingSource = convertUnderlyingDefaultOrByteSource(rawUnderlyingSource, 'First parameter');
    InitializeReadableStream(this);

    if (underlyingSource.type === 'bytes') {
      if (strategy.size !== undefined) {
        throw new RangeError('The strategy for a byte stream cannot have a size function');
      }

      var highWaterMark = ExtractHighWaterMark(strategy, 0);
      SetUpReadableByteStreamControllerFromUnderlyingSource(this, underlyingSource, highWaterMark);
    } else {
      var sizeAlgorithm = ExtractSizeAlgorithm(strategy);
      var highWaterMark = ExtractHighWaterMark(strategy, 1);
      SetUpReadableStreamDefaultControllerFromUnderlyingSource(this, underlyingSource, highWaterMark, sizeAlgorithm);
    }
  }

  Object.defineProperty(ReadableStream.prototype, "locked", {
    get: function () {
      if (!IsReadableStream(this)) {
        throw streamBrandCheckException$1('locked');
      }

      return IsReadableStreamLocked(this);
    },
    enumerable: false,
    configurable: true
  });

  ReadableStream.prototype.cancel = function (reason) {
    if (reason === void 0) {
      reason = undefined;
    }

    if (!IsReadableStream(this)) {
      return promiseRejectedWith(streamBrandCheckException$1('cancel'));
    }

    if (IsReadableStreamLocked(this)) {
      return promiseRejectedWith(new TypeError('Cannot cancel a stream that already has a reader'));
    }

    return ReadableStreamCancel(this, reason);
  };

  ReadableStream.prototype.getReader = function (rawOptions) {
    if (rawOptions === void 0) {
      rawOptions = undefined;
    }

    if (!IsReadableStream(this)) {
      throw streamBrandCheckException$1('getReader');
    }

    var options = convertReaderOptions(rawOptions, 'First parameter');

    if (options.mode === undefined) {
      return AcquireReadableStreamDefaultReader(this);
    }

    return AcquireReadableStreamBYOBReader(this);
  };

  ReadableStream.prototype.pipeThrough = function (rawTransform, rawOptions) {
    if (rawOptions === void 0) {
      rawOptions = {};
    }

    if (!IsReadableStream(this)) {
      throw streamBrandCheckException$1('pipeThrough');
    }

    assertRequiredArgument(rawTransform, 1, 'pipeThrough');
    var transform = convertReadableWritablePair(rawTransform, 'First parameter');
    var options = convertPipeOptions(rawOptions, 'Second parameter');

    if (IsReadableStreamLocked(this)) {
      throw new TypeError('ReadableStream.prototype.pipeThrough cannot be used on a locked ReadableStream');
    }

    if (IsWritableStreamLocked(transform.writable)) {
      throw new TypeError('ReadableStream.prototype.pipeThrough cannot be used on a locked WritableStream');
    }

    var promise = ReadableStreamPipeTo(this, transform.writable, options.preventClose, options.preventAbort, options.preventCancel, options.signal);
    setPromiseIsHandledToTrue(promise);
    return transform.readable;
  };

  ReadableStream.prototype.pipeTo = function (destination, rawOptions) {
    if (rawOptions === void 0) {
      rawOptions = {};
    }

    if (!IsReadableStream(this)) {
      return promiseRejectedWith(streamBrandCheckException$1('pipeTo'));
    }

    if (destination === undefined) {
      return promiseRejectedWith("Parameter 1 is required in 'pipeTo'.");
    }

    if (!IsWritableStream(destination)) {
      return promiseRejectedWith(new TypeError("ReadableStream.prototype.pipeTo's first argument must be a WritableStream"));
    }

    var options;

    try {
      options = convertPipeOptions(rawOptions, 'Second parameter');
    } catch (e) {
      return promiseRejectedWith(e);
    }

    if (IsReadableStreamLocked(this)) {
      return promiseRejectedWith(new TypeError('ReadableStream.prototype.pipeTo cannot be used on a locked ReadableStream'));
    }

    if (IsWritableStreamLocked(destination)) {
      return promiseRejectedWith(new TypeError('ReadableStream.prototype.pipeTo cannot be used on a locked WritableStream'));
    }

    return ReadableStreamPipeTo(this, destination, options.preventClose, options.preventAbort, options.preventCancel, options.signal);
  };

  ReadableStream.prototype.tee = function () {
    if (!IsReadableStream(this)) {
      throw streamBrandCheckException$1('tee');
    }

    var branches = ReadableStreamTee(this);
    return CreateArrayFromList(branches);
  };

  ReadableStream.prototype.values = function (rawOptions) {
    if (rawOptions === void 0) {
      rawOptions = undefined;
    }

    if (!IsReadableStream(this)) {
      throw streamBrandCheckException$1('values');
    }

    var options = convertIteratorOptions(rawOptions, 'First parameter');
    return AcquireReadableStreamAsyncIterator(this, options.preventCancel);
  };

  return ReadableStream;
}();

Object.defineProperties(ReadableStream.prototype, {
  cancel: {
    enumerable: true
  },
  getReader: {
    enumerable: true
  },
  pipeThrough: {
    enumerable: true
  },
  pipeTo: {
    enumerable: true
  },
  tee: {
    enumerable: true
  },
  values: {
    enumerable: true
  },
  locked: {
    enumerable: true
  }
});

if (typeof SymbolPolyfill.toStringTag === 'symbol') {
  Object.defineProperty(ReadableStream.prototype, SymbolPolyfill.toStringTag, {
    value: 'ReadableStream',
    configurable: true
  });
}

if (typeof SymbolPolyfill.asyncIterator === 'symbol') {
  Object.defineProperty(ReadableStream.prototype, SymbolPolyfill.asyncIterator, {
    value: ReadableStream.prototype.values,
    writable: true,
    configurable: true
  });
}

function CreateReadableStream(startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm) {
  if (highWaterMark === void 0) {
    highWaterMark = 1;
  }

  if (sizeAlgorithm === void 0) {
    sizeAlgorithm = function () {
      return 1;
    };
  }

  var stream = Object.create(ReadableStream.prototype);
  InitializeReadableStream(stream);
  var controller = Object.create(ReadableStreamDefaultController.prototype);
  SetUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm);
  return stream;
}

function InitializeReadableStream(stream) {
  stream._state = 'readable';
  stream._reader = undefined;
  stream._storedError = undefined;
  stream._disturbed = false;
}

function IsReadableStream(x) {
  if (!typeIsObject(x)) {
    return false;
  }

  if (!Object.prototype.hasOwnProperty.call(x, '_readableStreamController')) {
    return false;
  }

  return true;
}

function IsReadableStreamLocked(stream) {
  if (stream._reader === undefined) {
    return false;
  }

  return true;
}

function ReadableStreamCancel(stream, reason) {
  stream._disturbed = true;

  if (stream._state === 'closed') {
    return promiseResolvedWith(undefined);
  }

  if (stream._state === 'errored') {
    return promiseRejectedWith(stream._storedError);
  }

  ReadableStreamClose(stream);

  var sourceCancelPromise = stream._readableStreamController[CancelSteps](reason);

  return transformPromiseWith(sourceCancelPromise, noop);
}

function ReadableStreamClose(stream) {
  stream._state = 'closed';
  var reader = stream._reader;

  if (reader === undefined) {
    return;
  }

  if (IsReadableStreamDefaultReader(reader)) {
    reader._readRequests.forEach(function (readRequest) {
      readRequest._closeSteps();
    });

    reader._readRequests = new SimpleQueue();
  }

  defaultReaderClosedPromiseResolve(reader);
}

function ReadableStreamError(stream, e) {
  stream._state = 'errored';
  stream._storedError = e;
  var reader = stream._reader;

  if (reader === undefined) {
    return;
  }

  if (IsReadableStreamDefaultReader(reader)) {
    reader._readRequests.forEach(function (readRequest) {
      readRequest._errorSteps(e);
    });

    reader._readRequests = new SimpleQueue();
  } else {
    reader._readIntoRequests.forEach(function (readIntoRequest) {
      readIntoRequest._errorSteps(e);
    });

    reader._readIntoRequests = new SimpleQueue();
  }

  defaultReaderClosedPromiseReject(reader, e);
}

function streamBrandCheckException$1(name) {
  return new TypeError("ReadableStream.prototype." + name + " can only be used on a ReadableStream");
}

function convertQueuingStrategyInit(init, context) {
  assertDictionary(init, context);
  var highWaterMark = init === null || init === void 0 ? void 0 : init.highWaterMark;
  assertRequiredField(highWaterMark, 'highWaterMark', 'QueuingStrategyInit');
  return {
    highWaterMark: convertUnrestrictedDouble(highWaterMark)
  };
}

var byteLengthSizeFunction = function size(chunk) {
  return chunk.byteLength;
};

var ByteLengthQueuingStrategy = function () {
  function ByteLengthQueuingStrategy(options) {
    assertRequiredArgument(options, 1, 'ByteLengthQueuingStrategy');
    options = convertQueuingStrategyInit(options, 'First parameter');
    this._byteLengthQueuingStrategyHighWaterMark = options.highWaterMark;
  }

  Object.defineProperty(ByteLengthQueuingStrategy.prototype, "highWaterMark", {
    get: function () {
      if (!IsByteLengthQueuingStrategy(this)) {
        throw byteLengthBrandCheckException('highWaterMark');
      }

      return this._byteLengthQueuingStrategyHighWaterMark;
    },
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(ByteLengthQueuingStrategy.prototype, "size", {
    get: function () {
      if (!IsByteLengthQueuingStrategy(this)) {
        throw byteLengthBrandCheckException('size');
      }

      return byteLengthSizeFunction;
    },
    enumerable: false,
    configurable: true
  });
  return ByteLengthQueuingStrategy;
}();

Object.defineProperties(ByteLengthQueuingStrategy.prototype, {
  highWaterMark: {
    enumerable: true
  },
  size: {
    enumerable: true
  }
});

if (typeof SymbolPolyfill.toStringTag === 'symbol') {
  Object.defineProperty(ByteLengthQueuingStrategy.prototype, SymbolPolyfill.toStringTag, {
    value: 'ByteLengthQueuingStrategy',
    configurable: true
  });
}

function byteLengthBrandCheckException(name) {
  return new TypeError("ByteLengthQueuingStrategy.prototype." + name + " can only be used on a ByteLengthQueuingStrategy");
}

function IsByteLengthQueuingStrategy(x) {
  if (!typeIsObject(x)) {
    return false;
  }

  if (!Object.prototype.hasOwnProperty.call(x, '_byteLengthQueuingStrategyHighWaterMark')) {
    return false;
  }

  return true;
}

var countSizeFunction = function size() {
  return 1;
};

var CountQueuingStrategy = function () {
  function CountQueuingStrategy(options) {
    assertRequiredArgument(options, 1, 'CountQueuingStrategy');
    options = convertQueuingStrategyInit(options, 'First parameter');
    this._countQueuingStrategyHighWaterMark = options.highWaterMark;
  }

  Object.defineProperty(CountQueuingStrategy.prototype, "highWaterMark", {
    get: function () {
      if (!IsCountQueuingStrategy(this)) {
        throw countBrandCheckException('highWaterMark');
      }

      return this._countQueuingStrategyHighWaterMark;
    },
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(CountQueuingStrategy.prototype, "size", {
    get: function () {
      if (!IsCountQueuingStrategy(this)) {
        throw countBrandCheckException('size');
      }

      return countSizeFunction;
    },
    enumerable: false,
    configurable: true
  });
  return CountQueuingStrategy;
}();

Object.defineProperties(CountQueuingStrategy.prototype, {
  highWaterMark: {
    enumerable: true
  },
  size: {
    enumerable: true
  }
});

if (typeof SymbolPolyfill.toStringTag === 'symbol') {
  Object.defineProperty(CountQueuingStrategy.prototype, SymbolPolyfill.toStringTag, {
    value: 'CountQueuingStrategy',
    configurable: true
  });
}

function countBrandCheckException(name) {
  return new TypeError("CountQueuingStrategy.prototype." + name + " can only be used on a CountQueuingStrategy");
}

function IsCountQueuingStrategy(x) {
  if (!typeIsObject(x)) {
    return false;
  }

  if (!Object.prototype.hasOwnProperty.call(x, '_countQueuingStrategyHighWaterMark')) {
    return false;
  }

  return true;
}

function convertTransformer(original, context) {
  assertDictionary(original, context);
  var flush = original === null || original === void 0 ? void 0 : original.flush;
  var readableType = original === null || original === void 0 ? void 0 : original.readableType;
  var start = original === null || original === void 0 ? void 0 : original.start;
  var transform = original === null || original === void 0 ? void 0 : original.transform;
  var writableType = original === null || original === void 0 ? void 0 : original.writableType;
  return {
    flush: flush === undefined ? undefined : convertTransformerFlushCallback(flush, original, context + " has member 'flush' that"),
    readableType: readableType,
    start: start === undefined ? undefined : convertTransformerStartCallback(start, original, context + " has member 'start' that"),
    transform: transform === undefined ? undefined : convertTransformerTransformCallback(transform, original, context + " has member 'transform' that"),
    writableType: writableType
  };
}

function convertTransformerFlushCallback(fn, original, context) {
  assertFunction(fn, context);
  return function (controller) {
    return promiseCall(fn, original, [controller]);
  };
}

function convertTransformerStartCallback(fn, original, context) {
  assertFunction(fn, context);
  return function (controller) {
    return reflectCall(fn, original, [controller]);
  };
}

function convertTransformerTransformCallback(fn, original, context) {
  assertFunction(fn, context);
  return function (chunk, controller) {
    return promiseCall(fn, original, [chunk, controller]);
  };
}

var TransformStream = function () {
  function TransformStream(rawTransformer, rawWritableStrategy, rawReadableStrategy) {
    if (rawTransformer === void 0) {
      rawTransformer = {};
    }

    if (rawWritableStrategy === void 0) {
      rawWritableStrategy = {};
    }

    if (rawReadableStrategy === void 0) {
      rawReadableStrategy = {};
    }

    if (rawTransformer === undefined) {
      rawTransformer = null;
    }

    var writableStrategy = convertQueuingStrategy(rawWritableStrategy, 'Second parameter');
    var readableStrategy = convertQueuingStrategy(rawReadableStrategy, 'Third parameter');
    var transformer = convertTransformer(rawTransformer, 'First parameter');

    if (transformer.readableType !== undefined) {
      throw new RangeError('Invalid readableType specified');
    }

    if (transformer.writableType !== undefined) {
      throw new RangeError('Invalid writableType specified');
    }

    var readableHighWaterMark = ExtractHighWaterMark(readableStrategy, 0);
    var readableSizeAlgorithm = ExtractSizeAlgorithm(readableStrategy);
    var writableHighWaterMark = ExtractHighWaterMark(writableStrategy, 1);
    var writableSizeAlgorithm = ExtractSizeAlgorithm(writableStrategy);
    var startPromise_resolve;
    var startPromise = newPromise(function (resolve) {
      startPromise_resolve = resolve;
    });
    InitializeTransformStream(this, startPromise, writableHighWaterMark, writableSizeAlgorithm, readableHighWaterMark, readableSizeAlgorithm);
    SetUpTransformStreamDefaultControllerFromTransformer(this, transformer);

    if (transformer.start !== undefined) {
      startPromise_resolve(transformer.start(this._transformStreamController));
    } else {
      startPromise_resolve(undefined);
    }
  }

  Object.defineProperty(TransformStream.prototype, "readable", {
    get: function () {
      if (!IsTransformStream(this)) {
        throw streamBrandCheckException$2('readable');
      }

      return this._readable;
    },
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(TransformStream.prototype, "writable", {
    get: function () {
      if (!IsTransformStream(this)) {
        throw streamBrandCheckException$2('writable');
      }

      return this._writable;
    },
    enumerable: false,
    configurable: true
  });
  return TransformStream;
}();

Object.defineProperties(TransformStream.prototype, {
  readable: {
    enumerable: true
  },
  writable: {
    enumerable: true
  }
});

if (typeof SymbolPolyfill.toStringTag === 'symbol') {
  Object.defineProperty(TransformStream.prototype, SymbolPolyfill.toStringTag, {
    value: 'TransformStream',
    configurable: true
  });
}

function InitializeTransformStream(stream, startPromise, writableHighWaterMark, writableSizeAlgorithm, readableHighWaterMark, readableSizeAlgorithm) {
  function startAlgorithm() {
    return startPromise;
  }

  function writeAlgorithm(chunk) {
    return TransformStreamDefaultSinkWriteAlgorithm(stream, chunk);
  }

  function abortAlgorithm(reason) {
    return TransformStreamDefaultSinkAbortAlgorithm(stream, reason);
  }

  function closeAlgorithm() {
    return TransformStreamDefaultSinkCloseAlgorithm(stream);
  }

  stream._writable = CreateWritableStream(startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, writableHighWaterMark, writableSizeAlgorithm);

  function pullAlgorithm() {
    return TransformStreamDefaultSourcePullAlgorithm(stream);
  }

  function cancelAlgorithm(reason) {
    TransformStreamErrorWritableAndUnblockWrite(stream, reason);
    return promiseResolvedWith(undefined);
  }

  stream._readable = CreateReadableStream(startAlgorithm, pullAlgorithm, cancelAlgorithm, readableHighWaterMark, readableSizeAlgorithm);
  stream._backpressure = undefined;
  stream._backpressureChangePromise = undefined;
  stream._backpressureChangePromise_resolve = undefined;
  TransformStreamSetBackpressure(stream, true);
  stream._transformStreamController = undefined;
}

function IsTransformStream(x) {
  if (!typeIsObject(x)) {
    return false;
  }

  if (!Object.prototype.hasOwnProperty.call(x, '_transformStreamController')) {
    return false;
  }

  return true;
}

function TransformStreamError(stream, e) {
  ReadableStreamDefaultControllerError(stream._readable._readableStreamController, e);
  TransformStreamErrorWritableAndUnblockWrite(stream, e);
}

function TransformStreamErrorWritableAndUnblockWrite(stream, e) {
  TransformStreamDefaultControllerClearAlgorithms(stream._transformStreamController);
  WritableStreamDefaultControllerErrorIfNeeded(stream._writable._writableStreamController, e);

  if (stream._backpressure) {
    TransformStreamSetBackpressure(stream, false);
  }
}

function TransformStreamSetBackpressure(stream, backpressure) {
  if (stream._backpressureChangePromise !== undefined) {
    stream._backpressureChangePromise_resolve();
  }

  stream._backpressureChangePromise = newPromise(function (resolve) {
    stream._backpressureChangePromise_resolve = resolve;
  });
  stream._backpressure = backpressure;
}

var TransformStreamDefaultController = function () {
  function TransformStreamDefaultController() {
    throw new TypeError('Illegal constructor');
  }

  Object.defineProperty(TransformStreamDefaultController.prototype, "desiredSize", {
    get: function () {
      if (!IsTransformStreamDefaultController(this)) {
        throw defaultControllerBrandCheckException$1('desiredSize');
      }

      var readableController = this._controlledTransformStream._readable._readableStreamController;
      return ReadableStreamDefaultControllerGetDesiredSize(readableController);
    },
    enumerable: false,
    configurable: true
  });

  TransformStreamDefaultController.prototype.enqueue = function (chunk) {
    if (chunk === void 0) {
      chunk = undefined;
    }

    if (!IsTransformStreamDefaultController(this)) {
      throw defaultControllerBrandCheckException$1('enqueue');
    }

    TransformStreamDefaultControllerEnqueue(this, chunk);
  };

  TransformStreamDefaultController.prototype.error = function (reason) {
    if (reason === void 0) {
      reason = undefined;
    }

    if (!IsTransformStreamDefaultController(this)) {
      throw defaultControllerBrandCheckException$1('error');
    }

    TransformStreamDefaultControllerError(this, reason);
  };

  TransformStreamDefaultController.prototype.terminate = function () {
    if (!IsTransformStreamDefaultController(this)) {
      throw defaultControllerBrandCheckException$1('terminate');
    }

    TransformStreamDefaultControllerTerminate(this);
  };

  return TransformStreamDefaultController;
}();

Object.defineProperties(TransformStreamDefaultController.prototype, {
  enqueue: {
    enumerable: true
  },
  error: {
    enumerable: true
  },
  terminate: {
    enumerable: true
  },
  desiredSize: {
    enumerable: true
  }
});

if (typeof SymbolPolyfill.toStringTag === 'symbol') {
  Object.defineProperty(TransformStreamDefaultController.prototype, SymbolPolyfill.toStringTag, {
    value: 'TransformStreamDefaultController',
    configurable: true
  });
}

function IsTransformStreamDefaultController(x) {
  if (!typeIsObject(x)) {
    return false;
  }

  if (!Object.prototype.hasOwnProperty.call(x, '_controlledTransformStream')) {
    return false;
  }

  return true;
}

function SetUpTransformStreamDefaultController(stream, controller, transformAlgorithm, flushAlgorithm) {
  controller._controlledTransformStream = stream;
  stream._transformStreamController = controller;
  controller._transformAlgorithm = transformAlgorithm;
  controller._flushAlgorithm = flushAlgorithm;
}

function SetUpTransformStreamDefaultControllerFromTransformer(stream, transformer) {
  var controller = Object.create(TransformStreamDefaultController.prototype);

  var transformAlgorithm = function (chunk) {
    try {
      TransformStreamDefaultControllerEnqueue(controller, chunk);
      return promiseResolvedWith(undefined);
    } catch (transformResultE) {
      return promiseRejectedWith(transformResultE);
    }
  };

  var flushAlgorithm = function () {
    return promiseResolvedWith(undefined);
  };

  if (transformer.transform !== undefined) {
    transformAlgorithm = function (chunk) {
      return transformer.transform(chunk, controller);
    };
  }

  if (transformer.flush !== undefined) {
    flushAlgorithm = function () {
      return transformer.flush(controller);
    };
  }

  SetUpTransformStreamDefaultController(stream, controller, transformAlgorithm, flushAlgorithm);
}

function TransformStreamDefaultControllerClearAlgorithms(controller) {
  controller._transformAlgorithm = undefined;
  controller._flushAlgorithm = undefined;
}

function TransformStreamDefaultControllerEnqueue(controller, chunk) {
  var stream = controller._controlledTransformStream;
  var readableController = stream._readable._readableStreamController;

  if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(readableController)) {
    throw new TypeError('Readable side is not in a state that permits enqueue');
  }

  try {
    ReadableStreamDefaultControllerEnqueue(readableController, chunk);
  } catch (e) {
    TransformStreamErrorWritableAndUnblockWrite(stream, e);
    throw stream._readable._storedError;
  }

  var backpressure = ReadableStreamDefaultControllerHasBackpressure(readableController);

  if (backpressure !== stream._backpressure) {
    TransformStreamSetBackpressure(stream, true);
  }
}

function TransformStreamDefaultControllerError(controller, e) {
  TransformStreamError(controller._controlledTransformStream, e);
}

function TransformStreamDefaultControllerPerformTransform(controller, chunk) {
  var transformPromise = controller._transformAlgorithm(chunk);

  return transformPromiseWith(transformPromise, undefined, function (r) {
    TransformStreamError(controller._controlledTransformStream, r);
    throw r;
  });
}

function TransformStreamDefaultControllerTerminate(controller) {
  var stream = controller._controlledTransformStream;
  var readableController = stream._readable._readableStreamController;
  ReadableStreamDefaultControllerClose(readableController);
  var error = new TypeError('TransformStream terminated');
  TransformStreamErrorWritableAndUnblockWrite(stream, error);
}

function TransformStreamDefaultSinkWriteAlgorithm(stream, chunk) {
  var controller = stream._transformStreamController;

  if (stream._backpressure) {
    var backpressureChangePromise = stream._backpressureChangePromise;
    return transformPromiseWith(backpressureChangePromise, function () {
      var writable = stream._writable;
      var state = writable._state;

      if (state === 'erroring') {
        throw writable._storedError;
      }

      return TransformStreamDefaultControllerPerformTransform(controller, chunk);
    });
  }

  return TransformStreamDefaultControllerPerformTransform(controller, chunk);
}

function TransformStreamDefaultSinkAbortAlgorithm(stream, reason) {
  TransformStreamError(stream, reason);
  return promiseResolvedWith(undefined);
}

function TransformStreamDefaultSinkCloseAlgorithm(stream) {
  var readable = stream._readable;
  var controller = stream._transformStreamController;

  var flushPromise = controller._flushAlgorithm();

  TransformStreamDefaultControllerClearAlgorithms(controller);
  return transformPromiseWith(flushPromise, function () {
    if (readable._state === 'errored') {
      throw readable._storedError;
    }

    ReadableStreamDefaultControllerClose(readable._readableStreamController);
  }, function (r) {
    TransformStreamError(stream, r);
    throw readable._storedError;
  });
}

function TransformStreamDefaultSourcePullAlgorithm(stream) {
  TransformStreamSetBackpressure(stream, false);
  return stream._backpressureChangePromise;
}

function defaultControllerBrandCheckException$1(name) {
  return new TypeError("TransformStreamDefaultController.prototype." + name + " can only be used on a TransformStreamDefaultController");
}

function streamBrandCheckException$2(name) {
  return new TypeError("TransformStream.prototype." + name + " can only be used on a TransformStream");
}

var exports = {
  ReadableStream: ReadableStream,
  ReadableStreamDefaultController: ReadableStreamDefaultController,
  ReadableByteStreamController: ReadableByteStreamController,
  ReadableStreamBYOBRequest: ReadableStreamBYOBRequest,
  ReadableStreamDefaultReader: ReadableStreamDefaultReader,
  ReadableStreamBYOBReader: ReadableStreamBYOBReader,
  WritableStream: WritableStream,
  WritableStreamDefaultController: WritableStreamDefaultController,
  WritableStreamDefaultWriter: WritableStreamDefaultWriter,
  ByteLengthQueuingStrategy: ByteLengthQueuingStrategy,
  CountQueuingStrategy: CountQueuingStrategy,
  TransformStream: TransformStream,
  TransformStreamDefaultController: TransformStreamDefaultController
};

if (typeof globals !== 'undefined') {
  for (var prop in exports) {
    if (Object.prototype.hasOwnProperty.call(exports, prop)) {
      Object.defineProperty(globals, prop, {
        value: exports[prop],
        writable: true,
        configurable: true
      });
    }
  }
}

function uuid() {
  return Array.from({
    length: 16
  }, () => Math.floor(Math.random() * 256).toString(16)).join('');
}

function jobPromise(worker, msg) {
  return new Promise(resolve => {
    const id = uuid();
    worker.postMessage({
      msg,
      id
    });
    worker.addEventListener('message', function f({
      data
    }) {
      const result = data.result;
      const rid = data.id;

      if (rid !== id) {
        return;
      }

      worker.removeEventListener('message', f);
      resolve(result);
    });
    worker.addEventListener('error', error => console.error('Worker error: ', error));
  });
}

class WorkerPool {
  constructor(numWorkers, workerFile) {
    this.numWorkers = numWorkers;
    this.jobQueue = new TransformStream();
    this.workerQueue = new TransformStream();
    const writer = this.workerQueue.writable.getWriter();

    for (let i = 0; i < numWorkers; i++) {
      writer.write(new Worker(new URL("/worker-2ead94c1.js", import.meta.url), {
        type: 'module'
      }));
    }

    writer.releaseLock();
    this.done = this._readLoop();
  }

  async _readLoop() {
    const reader = this.jobQueue.readable.getReader();

    while (true) {
      const {
        value,
        done
      } = await reader.read();

      if (done) {
        await this._terminateAll();
        return;
      }

      const {
        msg,
        resolve
      } = value;
      const worker = await this._nextWorker();
      jobPromise(worker, msg).then(result => {
        resolve(result);
        const writer = this.workerQueue.writable.getWriter();
        writer.write(worker);
        writer.releaseLock();
      });
    }
  }

  async _nextWorker() {
    const reader = this.workerQueue.readable.getReader();
    const {
      value,
      done
    } = await reader.read();
    reader.releaseLock();
    return value;
  }

  async _terminateAll() {
    for (let n = 0; n < this.numWorkers; n++) {
      const worker = await this._nextWorker();
      worker.terminate();
    }

    this.workerQueue.writable.close();
  }

  async join() {
    this.jobQueue.writable.getWriter().close();
    await this.done;
  }

  dispatchJob(msg) {
    return new Promise(resolve => {
      const writer = this.jobQueue.writable.getWriter();
      writer.write({
        msg,
        resolve
      });
      writer.releaseLock();
    });
  }

}

function clamp(v, min, max) {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

const suffix = ['B', 'KB', 'MB'];

function prettyPrintSize(size) {
  const base = Math.floor(Math.log2(size) / 10);
  const index = clamp(base, 0, 2);
  return (size / 2 ** (10 * index)).toFixed(2) + suffix[index];
}

function progressTracker(results, program) {
  const tracker = {};
  tracker.progressOffset = 0;
  tracker.totalOffset = 0;
  let status = '';

  tracker.setStatus = text => {
    status = text || '';
    update();
  };

  let progress = '';

  tracker.setProgress = (done, total) => {
    const completeness = (tracker.progressOffset + done) / (tracker.totalOffset + total);
    progress = `▐${'▨'.repeat(completeness * 10 | 0).padEnd(10, '╌')}▌ `;
    update();
  };

  function update() {
    console.log(progress + status.bold() + getResultsText());
  }

  tracker.finish = text => {
    console.log('finished', text.bold() + getResultsText());
  };

  function getResultsText() {
    let out = '';

    for (const [filename, result] of results.entries()) {
      out += `\n ${filename}: ${prettyPrintSize(result.size)}`;

      for (const {
        outputFile,
        outputSize,
        infoText
      } of result.outputs) {
        const name = (program.suffix + pathBrowserify.extname(outputFile)).padEnd(5);
        out += `\n  ${'└'} ${name} → ${prettyPrintSize(outputSize)}`;
        const percent = (outputSize / result.size * 100).toPrecision(3);
        out += ` (${percent}%)`;
        if (infoText) out += infoText;
      }
    }

    return out || '\n';
  }

  return tracker;
}

async function run({
  files = [],
  suffix = '',
  optimizerButteraugliTarget = false,
  outputDir = '',
  maxOptimizerRounds = 8,
  ...extras
}) {
  return await processFiles(files, {
    suffix,
    optimizerButteraugliTarget,
    outputDir,
    maxOptimizerRounds,
    ...extras
  });
}

async function processFiles(files, program) {
  const parallelism = navigator.hardwareConcurrency;
  const results = new Map();
  const progress = progressTracker(results, program);
  progress.setStatus('Decoding...');
  progress.totalOffset = files.length;
  progress.setProgress(0, files.length);
  const workerPool = new WorkerPool(parallelism);
  let decoded = 0;
  let decodedFiles = await Promise.all(files.map(async file => {
    const result = await workerPool.dispatchJob({
      operation: 'decode',
      file
    });
    results.set(file.name, {
      file: result.file,
      size: result.size,
      outputs: []
    });
    progress.setProgress(++decoded, files.length);
    return result;
  }));

  for (const [preprocessorName, value] of Object.entries(preprocessors)) {
    if (!program[preprocessorName]) {
      continue;
    }

    const preprocessorParam = program[preprocessorName];
    const preprocessorOptions = Object.assign({}, value.defaultOptions, preprocessorParam);
    decodedFiles = await Promise.all(decodedFiles.map(async file => {
      return workerPool.dispatchJob({
        file,
        operation: 'preprocess',
        preprocessorName,
        options: preprocessorOptions
      });
    }));
  }

  progress.progressOffset = decoded;
  progress.setStatus(`Encoding (${parallelism} threads)`);
  progress.setProgress(0, files.length);
  const jobs = [];
  let jobsStarted = 0;
  let jobsFinished = 0;

  for (const {
    file,
    bitmap,
    size
  } of decodedFiles) {
    const ext = pathBrowserify.extname(file.name);
    const base = pathBrowserify.basename(file.name, ext) + program.suffix;

    for (const [encName, value] of Object.entries(codecs)) {
      if (!program[encName]) {
        continue;
      }

      const encParam = typeof program[encName] === 'string' ? program[encName] : '{}';
      const encConfig = encParam.toLowerCase() === 'auto' ? 'auto' : Object.assign({}, value.defaultEncoderOptions, encParam);
      const outputFile = pathBrowserify.join(program.outputDir, `${base}.${value.extension}`);
      jobsStarted++;
      const p = workerPool.dispatchJob({
        operation: 'encode',
        file,
        size,
        bitmap,
        outputFile,
        encName,
        encConfig,
        optimizerButteraugliTarget: Number(program.optimizerButteraugliTarget),
        maxOptimizerRounds: Number(program.maxOptimizerRounds)
      }).then(output => {
        jobsFinished++;
        results.get(file.name).outputs.push(output);
        progress.setProgress(jobsFinished, jobsStarted);
      });
      jobs.push(p);
    }
  }

  progress.setProgress(jobsFinished, jobsStarted);
  await workerPool.join();
  await Promise.all(jobs);
  progress.finish('Squoosh results:');
  return results;
}

export { run };
