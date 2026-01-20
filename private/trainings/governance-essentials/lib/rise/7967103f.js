'use strict'
;(self.wpRiseJsonp = self.wpRiseJsonp || []).push([
  ['profiler'],
  {
    30965: (e, t, n) => {
      ;(n.r(t), n.d(t, { DEFAULT_RUM_PROFILER_CONFIGURATION: () => v, createRumProfiler: () => w }))
      var s = n(93195),
        i = n(91045),
        r = n(90637),
        a = n(87791),
        o = n(62877),
        c = n(15320),
        u = n(54203)
      const l = /\/(?![vV]\d{1,2}\/)([^/\d?]*\d+[^/?]*)/g
      const p = (e, t) =>
        e ||
        (function (e) {
          return e ? e.replace(l, '/?') : '/'
        })(t)
      var d = n(72029)
      function f(e, t, n) {
        const s = { application: { id: t } }
        n && (s.session = { id: n })
        const { ids: i, names: r } = (function (e) {
          const t = { ids: [], names: [] }
          for (const n of e) (t.ids.push(n.viewId), n.viewName && t.names.push(n.viewName))
          return ((t.names = Array.from(new Set(t.names))), t)
        })(e.views)
        i.length && (s.view = { id: i, name: r })
        const a = e.longTasks.map((e) => e.id).filter((e) => void 0 !== e)
        return (a.length && (s.long_task = { id: a }), s)
      }
      function m(e, t, n) {
        const s = (0, d.m5)(t),
          i = f(e, t.applicationId, n),
          r = (function (e) {
            return e.concat([
              'language:javascript',
              'runtime:chrome',
              'family:chrome',
              'host:browser',
            ])
          })(s)
        return {
          ...i,
          attachments: ['wall-time.json'],
          start: new Date(e.startClocks.timeStamp).toISOString(),
          end: new Date(e.endClocks.timeStamp).toISOString(),
          family: 'chrome',
          runtime: 'chrome',
          format: 'json',
          version: 4,
          tags_profiler: r.join(','),
          _dd: { clock_drift: (0, o.TP)() },
        }
      }
      const v = {
        sampleIntervalMs: 10,
        collectIntervalMs: 6e4,
        minProfileDurationMs: 5e3,
        minNumberOfSamples: 50,
      }
      function w(e, t, n, l, d, f, w, g = v) {
        const h = (0, u.wP)(e, t, f, 6)
        let k
        const b = []
        let y = { state: 'stopped', stateReason: 'initializing' }
        function I() {
          if ('running' === y.state) return
          const t = w.findView()
          ;((k = t
            ? {
                startClocks: t.startClocks,
                viewId: t.id,
                viewName: p(t.name, document.location.pathname),
              }
            : void 0),
            b.push(
              (0, i.q)(e, window, 'visibilitychange', P).stop,
              (0, i.q)(e, window, 'beforeunload', C).stop,
            ),
            S())
        }
        async function M(e) {
          ;(await (async function (e) {
            'running' === y.state && (await D(), (y = { state: 'stopped', stateReason: e }))
          })(e),
            b.forEach((e) => e()),
            l.set({ status: 'stopped', error_reason: void 0 }))
        }
        function S() {
          const e = (0, r.VZ)().Profiler
          if (!e)
            throw (
              l.set({ status: 'error', error_reason: 'not-supported-by-browser' }),
              new Error('RUM Profiler is not supported in this browser.')
            )
          T(y).catch(s.Dx)
          const { cleanupTasks: n } = (function (e) {
            if ('running' === e.state) return { cleanupTasks: e.cleanupTasks }
            const n = [],
              s = t.subscribe(2, (e) => {
                const t = {
                  viewId: e.id,
                  viewName: p(e.name, document.location.pathname),
                  startClocks: e.startClocks,
                }
                ;(R(t), (k = t))
              })
            return (n.push(s.unsubscribe), { cleanupTasks: n })
          })(y)
          let i
          try {
            i = new e({
              sampleInterval: g.sampleIntervalMs,
              maxBufferSize: Math.round((1.5 * g.collectIntervalMs) / g.sampleIntervalMs),
            })
          } catch (e) {
            return void (e instanceof Error && e.message.includes('disabled by Document Policy')
              ? (a.Vy.warn(
                  '[DD_RUM] Profiler startup failed. Ensure your server includes the `Document-Policy: js-profiling` response header when serving HTML pages.',
                  e,
                ),
                l.set({ status: 'error', error_reason: 'missing-document-policy-header' }))
              : l.set({ status: 'error', error_reason: 'unexpected-exception' }))
          }
          ;(l.set({ status: 'running', error_reason: void 0 }),
            (y = {
              state: 'running',
              startClocks: (0, o.M8)(),
              profiler: i,
              timeoutId: (0, c.wg)(S, g.collectIntervalMs),
              views: [],
              cleanupTasks: n,
              longTasks: [],
            }),
            R(k),
            i.addEventListener('samplebufferfull', _))
        }
        async function T(t) {
          if ('running' !== t.state) return
          ;((0, c.DJ)(t.timeoutId), t.profiler.removeEventListener('samplebufferfull', _))
          const { startClocks: i, views: r } = t
          await t.profiler
            .stop()
            .then((t) => {
              const s = (0, o.M8)(),
                a = d.findLongTasks(i.relative),
                c = (0, o.vk)(i.timeStamp, s.timeStamp) < g.minProfileDurationMs,
                u =
                  (function (e) {
                    let t = 0
                    for (const n of e) void 0 !== n.stackId && t++
                    return t
                  })(t.samples) < g.minNumberOfSamples
              ;(0 === a.length && (c || u)) ||
                (function (t) {
                  var s
                  const i = null === (s = n.findTrackedSession()) || void 0 === s ? void 0 : s.id,
                    r = (function (e, t, n) {
                      return { event: m(e, t, n), 'wall-time.json': e }
                    })(t, e, i)
                  h.send(r)
                })(
                  Object.assign(t, {
                    startClocks: i,
                    endClocks: s,
                    clocksOrigin: (0, o.Oc)(),
                    longTasks: a,
                    views: r,
                    sampleInterval: g.sampleIntervalMs,
                  }),
                )
            })
            .catch(s.Dx)
        }
        async function D() {
          'running' === y.state && (y.cleanupTasks.forEach((e) => e()), await T(y))
        }
        function R(e) {
          'running' !== y.state || !e || y.views.push(e)
        }
        function _() {
          S()
        }
        function P() {
          'hidden' === document.visibilityState && 'running' === y.state
            ? (async function () {
                'running' === y.state && (await D(), (y = { state: 'paused' }))
              })().catch(s.Dx)
            : 'visible' === document.visibilityState && 'paused' === y.state && S()
        }
        function C() {
          S()
        }
        return (
          t.subscribe(9, () => {
            M('session-expired').catch(s.Dx)
          }),
          t.subscribe(10, () => {
            'stopped' === y.state && 'session-expired' === y.stateReason && I()
          }),
          {
            start: I,
            stop: async function () {
              await M('stopped-by-user')
            },
            isStopped: function () {
              return 'stopped' === y.state
            },
            isRunning: function () {
              return 'running' === y.state
            },
            isPaused: function () {
              return 'paused' === y.state
            },
          }
        )
      }
    },
  },
])
