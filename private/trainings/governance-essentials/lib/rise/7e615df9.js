'use strict'
;(self.wpRiseJsonp = self.wpRiseJsonp || []).push([
  ['node_modules_pnpm_react_19_2_3_node_modules_react_jsx-runtime_js'],
  {
    6534: (e, r, s) => {
      e.exports = s(96212)
    },
    96212: (e, r) => {
      /**
       * @license React
       * react-jsx-runtime.production.js
       *
       * Copyright (c) Meta Platforms, Inc. and affiliates.
       *
       * This source code is licensed under the MIT license found in the
       * LICENSE file in the root directory of this source tree.
       */
      var s = Symbol.for('react.transitional.element'),
        o = Symbol.for('react.fragment')
      function n(e, r, o) {
        var n = null
        if ((void 0 !== o && (n = '' + o), void 0 !== r.key && (n = '' + r.key), 'key' in r))
          for (var t in ((o = {}), r)) 'key' !== t && (o[t] = r[t])
        else o = r
        return (
          (r = o.ref),
          { $$typeof: s, type: e, key: n, ref: void 0 !== r ? r : null, props: o }
        )
      }
      ;((r.Fragment = o), (r.jsx = n), (r.jsxs = n))
    },
  },
])
