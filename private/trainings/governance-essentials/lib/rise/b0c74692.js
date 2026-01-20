'use strict'
;(self.wpRiseJsonp = self.wpRiseJsonp || []).push([
  ['node_modules_pnpm_react_19_2_3_node_modules_react_index_js'],
  {
    28375: (e, t) => {
      /**
       * @license React
       * react.production.js
       *
       * Copyright (c) Meta Platforms, Inc. and affiliates.
       *
       * This source code is licensed under the MIT license found in the
       * LICENSE file in the root directory of this source tree.
       */
      var n = Symbol.for('react.transitional.element'),
        r = Symbol.for('react.portal'),
        o = Symbol.for('react.fragment'),
        u = Symbol.for('react.strict_mode'),
        s = Symbol.for('react.profiler'),
        c = Symbol.for('react.consumer'),
        i = Symbol.for('react.context'),
        a = Symbol.for('react.forward_ref'),
        f = Symbol.for('react.suspense'),
        l = Symbol.for('react.memo'),
        p = Symbol.for('react.lazy'),
        y = Symbol.for('react.activity'),
        d = Symbol.iterator
      var _ = {
          isMounted: function () {
            return !1
          },
          enqueueForceUpdate: function () {},
          enqueueReplaceState: function () {},
          enqueueSetState: function () {},
        },
        h = Object.assign,
        m = {}
      function v(e, t, n) {
        ;((this.props = e), (this.context = t), (this.refs = m), (this.updater = n || _))
      }
      function b() {}
      function S(e, t, n) {
        ;((this.props = e), (this.context = t), (this.refs = m), (this.updater = n || _))
      }
      ;((v.prototype.isReactComponent = {}),
        (v.prototype.setState = function (e, t) {
          if ('object' != typeof e && 'function' != typeof e && null != e)
            throw Error(
              'takes an object of state variables to update or a function which returns an object of state variables.',
            )
          this.updater.enqueueSetState(this, e, t, 'setState')
        }),
        (v.prototype.forceUpdate = function (e) {
          this.updater.enqueueForceUpdate(this, e, 'forceUpdate')
        }),
        (b.prototype = v.prototype))
      var E = (S.prototype = new b())
      ;((E.constructor = S), h(E, v.prototype), (E.isPureReactComponent = !0))
      var w = Array.isArray
      function g() {}
      var j = { H: null, A: null, T: null, S: null },
        H = Object.prototype.hasOwnProperty
      function R(e, t, r) {
        var o = r.ref
        return { $$typeof: n, type: e, key: t, ref: void 0 !== o ? o : null, props: r }
      }
      function k(e) {
        return 'object' == typeof e && null !== e && e.$$typeof === n
      }
      var C = /\/+/g
      function $(e, t) {
        return 'object' == typeof e && null !== e && null != e.key
          ? (function (e) {
              var t = { '=': '=0', ':': '=2' }
              return (
                '$' +
                e.replace(/[=:]/g, function (e) {
                  return t[e]
                })
              )
            })('' + e.key)
          : t.toString(36)
      }
      function x(e, t, o, u, s) {
        var c = typeof e
        ;('undefined' === c || 'boolean' === c) && (e = null)
        var i = !1
        if (null === e) i = !0
        else
          switch (c) {
            case 'bigint':
            case 'string':
            case 'number':
              i = !0
              break
            case 'object':
              switch (e.$$typeof) {
                case n:
                case r:
                  i = !0
                  break
                case p:
                  return x((i = e._init)(e._payload), t, o, u, s)
              }
          }
        if (i)
          return (
            (s = s(e)),
            (i = '' === u ? '.' + $(e, 0) : u),
            w(s)
              ? ((o = ''),
                null != i && (o = i.replace(C, '$&/') + '/'),
                x(s, t, o, '', function (e) {
                  return e
                }))
              : null != s &&
                (k(s) &&
                  (s = (function (e, t) {
                    return R(e.type, t, e.props)
                  })(
                    s,
                    o +
                      (null == s.key || (e && e.key === s.key)
                        ? ''
                        : ('' + s.key).replace(C, '$&/') + '/') +
                      i,
                  )),
                t.push(s)),
            1
          )
        i = 0
        var a = '' === u ? '.' : u + ':'
        if (w(e)) for (var f = 0; f < e.length; f++) i += x((u = e[f]), t, o, (c = a + $(u, f)), s)
        else if (
          ((f = (function (e) {
            return null === e || 'object' != typeof e
              ? null
              : 'function' == typeof (e = (d && e[d]) || e['@@iterator'])
                ? e
                : null
          })(e)),
          'function' == typeof f)
        )
          for (e = f.call(e), f = 0; !(u = e.next()).done; )
            i += x((u = u.value), t, o, (c = a + $(u, f++)), s)
        else if ('object' === c) {
          if ('function' == typeof e.then)
            return x(
              (function (e) {
                switch (e.status) {
                  case 'fulfilled':
                    return e.value
                  case 'rejected':
                    throw e.reason
                  default:
                    switch (
                      ('string' == typeof e.status
                        ? e.then(g, g)
                        : ((e.status = 'pending'),
                          e.then(
                            function (t) {
                              'pending' === e.status && ((e.status = 'fulfilled'), (e.value = t))
                            },
                            function (t) {
                              'pending' === e.status && ((e.status = 'rejected'), (e.reason = t))
                            },
                          )),
                      e.status)
                    ) {
                      case 'fulfilled':
                        return e.value
                      case 'rejected':
                        throw e.reason
                    }
                }
                throw e
              })(e),
              t,
              o,
              u,
              s,
            )
          throw (
            (t = String(e)),
            Error(
              'Objects are not valid as a React child (found: ' +
                ('[object Object]' === t
                  ? 'object with keys {' + Object.keys(e).join(', ') + '}'
                  : t) +
                '). If you meant to render a collection of children, use an array instead.',
            )
          )
        }
        return i
      }
      function T(e, t, n) {
        if (null == e) return e
        var r = [],
          o = 0
        return (
          x(e, r, '', '', function (e) {
            return t.call(n, e, o++)
          }),
          r
        )
      }
      function A(e) {
        if (-1 === e._status) {
          var t = e._result
          ;((t = t()).then(
            function (t) {
              ;(0 === e._status || -1 === e._status) && ((e._status = 1), (e._result = t))
            },
            function (t) {
              ;(0 === e._status || -1 === e._status) && ((e._status = 2), (e._result = t))
            },
          ),
            -1 === e._status && ((e._status = 0), (e._result = t)))
        }
        if (1 === e._status) return e._result.default
        throw e._result
      }
      var O =
          'function' == typeof reportError
            ? reportError
            : function (e) {
                if ('object' == typeof window && 'function' == typeof window.ErrorEvent) {
                  var t = new window.ErrorEvent('error', {
                    bubbles: !0,
                    cancelable: !0,
                    message:
                      'object' == typeof e && null !== e && 'string' == typeof e.message
                        ? String(e.message)
                        : String(e),
                    error: e,
                  })
                  if (!window.dispatchEvent(t)) return
                } else if ('object' == typeof process && 'function' == typeof process.emit)
                  return void process.emit('uncaughtException', e)
                console.error(e)
              },
        I = {
          map: T,
          forEach: function (e, t, n) {
            T(
              e,
              function () {
                t.apply(this, arguments)
              },
              n,
            )
          },
          count: function (e) {
            var t = 0
            return (
              T(e, function () {
                t++
              }),
              t
            )
          },
          toArray: function (e) {
            return (
              T(e, function (e) {
                return e
              }) || []
            )
          },
          only: function (e) {
            if (!k(e))
              throw Error('React.Children.only expected to receive a single React element child.')
            return e
          },
        }
      ;((t.Activity = y),
        (t.Children = I),
        (t.Component = v),
        (t.Fragment = o),
        (t.Profiler = s),
        (t.PureComponent = S),
        (t.StrictMode = u),
        (t.Suspense = f),
        (t.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = j),
        (t.__COMPILER_RUNTIME = {
          __proto__: null,
          c: function (e) {
            return j.H.useMemoCache(e)
          },
        }),
        (t.cache = function (e) {
          return function () {
            return e.apply(null, arguments)
          }
        }),
        (t.cacheSignal = function () {
          return null
        }),
        (t.cloneElement = function (e, t, n) {
          if (null == e)
            throw Error('The argument must be a React element, but you passed ' + e + '.')
          var r = h({}, e.props),
            o = e.key
          if (null != t)
            for (u in (void 0 !== t.key && (o = '' + t.key), t))
              !H.call(t, u) ||
                'key' === u ||
                '__self' === u ||
                '__source' === u ||
                ('ref' === u && void 0 === t.ref) ||
                (r[u] = t[u])
          var u = arguments.length - 2
          if (1 === u) r.children = n
          else if (1 < u) {
            for (var s = Array(u), c = 0; c < u; c++) s[c] = arguments[c + 2]
            r.children = s
          }
          return R(e.type, o, r)
        }),
        (t.createContext = function (e) {
          return (
            ((e = {
              $$typeof: i,
              _currentValue: e,
              _currentValue2: e,
              _threadCount: 0,
              Provider: null,
              Consumer: null,
            }).Provider = e),
            (e.Consumer = { $$typeof: c, _context: e }),
            e
          )
        }),
        (t.createElement = function (e, t, n) {
          var r,
            o = {},
            u = null
          if (null != t)
            for (r in (void 0 !== t.key && (u = '' + t.key), t))
              H.call(t, r) && 'key' !== r && '__self' !== r && '__source' !== r && (o[r] = t[r])
          var s = arguments.length - 2
          if (1 === s) o.children = n
          else if (1 < s) {
            for (var c = Array(s), i = 0; i < s; i++) c[i] = arguments[i + 2]
            o.children = c
          }
          if (e && e.defaultProps) for (r in (s = e.defaultProps)) void 0 === o[r] && (o[r] = s[r])
          return R(e, u, o)
        }),
        (t.createRef = function () {
          return { current: null }
        }),
        (t.forwardRef = function (e) {
          return { $$typeof: a, render: e }
        }),
        (t.isValidElement = k),
        (t.lazy = function (e) {
          return { $$typeof: p, _payload: { _status: -1, _result: e }, _init: A }
        }),
        (t.memo = function (e, t) {
          return { $$typeof: l, type: e, compare: void 0 === t ? null : t }
        }),
        (t.startTransition = function (e) {
          var t = j.T,
            n = {}
          j.T = n
          try {
            var r = e(),
              o = j.S
            ;(null !== o && o(n, r),
              'object' == typeof r && null !== r && 'function' == typeof r.then && r.then(g, O))
          } catch (e) {
            O(e)
          } finally {
            ;(null !== t && null !== n.types && (t.types = n.types), (j.T = t))
          }
        }),
        (t.unstable_useCacheRefresh = function () {
          return j.H.useCacheRefresh()
        }),
        (t.use = function (e) {
          return j.H.use(e)
        }),
        (t.useActionState = function (e, t, n) {
          return j.H.useActionState(e, t, n)
        }),
        (t.useCallback = function (e, t) {
          return j.H.useCallback(e, t)
        }),
        (t.useContext = function (e) {
          return j.H.useContext(e)
        }),
        (t.useDebugValue = function () {}),
        (t.useDeferredValue = function (e, t) {
          return j.H.useDeferredValue(e, t)
        }),
        (t.useEffect = function (e, t) {
          return j.H.useEffect(e, t)
        }),
        (t.useEffectEvent = function (e) {
          return j.H.useEffectEvent(e)
        }),
        (t.useId = function () {
          return j.H.useId()
        }),
        (t.useImperativeHandle = function (e, t, n) {
          return j.H.useImperativeHandle(e, t, n)
        }),
        (t.useInsertionEffect = function (e, t) {
          return j.H.useInsertionEffect(e, t)
        }),
        (t.useLayoutEffect = function (e, t) {
          return j.H.useLayoutEffect(e, t)
        }),
        (t.useMemo = function (e, t) {
          return j.H.useMemo(e, t)
        }),
        (t.useOptimistic = function (e, t) {
          return j.H.useOptimistic(e, t)
        }),
        (t.useReducer = function (e, t, n) {
          return j.H.useReducer(e, t, n)
        }),
        (t.useRef = function (e) {
          return j.H.useRef(e)
        }),
        (t.useState = function (e) {
          return j.H.useState(e)
        }),
        (t.useSyncExternalStore = function (e, t, n) {
          return j.H.useSyncExternalStore(e, t, n)
        }),
        (t.useTransition = function () {
          return j.H.useTransition()
        }),
        (t.version = '19.2.3'))
    },
    33910: (e, t, n) => {
      e.exports = n(28375)
    },
  },
])
