'use strict'
;(self.wpRiseJsonp = self.wpRiseJsonp || []).push([
  ['recorder'],
  {
    33949: (t, e, n) => {
      ;(n.r(e), n.d(e, { startRecording: () => Et }))
      var o = n(91388),
        s = n(10144),
        r = n(78586),
        i = n(87542),
        a = n(54203),
        c = n(62877)
      const u = {
          FullSnapshot: 2,
          IncrementalSnapshot: 3,
          Meta: 4,
          Focus: 6,
          ViewEnd: 7,
          VisualViewport: 8,
          FrustrationRecord: 9,
        },
        d = { Document: 0, DocumentType: 1, Element: 2, Text: 3, CDATA: 4, DocumentFragment: 11 },
        l = {
          Mutation: 0,
          MouseMove: 1,
          MouseInteraction: 2,
          Scroll: 3,
          ViewportResize: 4,
          Input: 5,
          TouchMove: 6,
          MediaInteraction: 7,
          StyleSheetRule: 8,
        },
        p = {
          MouseUp: 0,
          MouseDown: 1,
          Click: 2,
          ContextMenu: 3,
          DblClick: 4,
          Focus: 5,
          Blur: 6,
          TouchStart: 7,
          TouchEnd: 9,
        },
        f = { Play: 0, Pause: 1 }
      var m = n(38549)
      function h(t, e) {
        const n = t.tagName,
          o = t.value
        if ((0, a.Ie)(t, e)) {
          const e = t.type
          return 'INPUT' !== n || ('button' !== e && 'submit' !== e && 'reset' !== e)
            ? o && 'OPTION' !== n
              ? a.o
              : void 0
            : o
        }
        return 'OPTION' === n || 'SELECT' === n
          ? t.value
          : 'INPUT' === n || 'TEXTAREA' === n
            ? o
            : void 0
      }
      const g = /url\((?:(')([^']*)'|(")([^"]*)"|([^)]*))\)/gm,
        y = /^[A-Za-z]+:|^\/\//,
        v = /^["']?data:.*,/i
      function w(t, e) {
        return t.replace(g, (t, n, o, s, r, i) => {
          const a = o || r || i
          if (!e || !a || y.test(a) || v.test(a)) return t
          const c = n || s || ''
          return `url(${c}${(function (t, e) {
            try {
              return (0, m.c$)(t, e).href
            } catch {
              return t
            }
          })(a, e)}${c})`
        })
      }
      const S = /[^a-z1-6-_]/
      function I(t) {
        return t.tagName.toLowerCase()
      }
      function T(t, e) {
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${t}' height='${e}' style='background-color:silver'%3E%3C/svg%3E`
      }
      function x(t) {
        if (void 0 !== t && 0 !== t.length)
          return t.map((t) => {
            const e = t.cssRules || t.rules
            return {
              cssRules: Array.from(e, (t) => t.cssText),
              disabled: t.disabled || void 0,
              media: t.media.length > 0 ? Array.from(t.media) : void 0,
            }
          })
      }
      var E = n(77448)
      const b = 1e6
      function N(t, e, n, o) {
        if (e === a.$m.HIDDEN) return null
        const s = t.getAttribute(n),
          r = t.tagName
        if ((0, a.ap)(r, n, s, e, o)) {
          if ('IMG' === r) {
            const e = t
            if (e.naturalWidth > 0) return T(e.naturalWidth, e.naturalHeight)
            const { width: n, height: o } = t.getBoundingClientRect()
            return n > 0 || o > 0 ? T(n, o) : a.eT
          }
          return 'SOURCE' === r ? a.eT : a.o
        }
        return s && (0, a.ei)(s, b)
      }
      function R(t, e, n) {
        if (e === a.$m.HIDDEN) return {}
        const o = {},
          s = I(t)
        for (let s = 0; s < t.attributes.length; s += 1) {
          const r = t.attributes.item(s).name,
            i = N(t, e, r, n.scope.configuration)
          null !== i && (o[r] = i)
        }
        if (t.value && ('textarea' === s || 'select' === s || 'option' === s || 'input' === s)) {
          const n = h(t, e)
          void 0 !== n && (o.value = n)
        }
        if ('option' === s) {
          const n = t
          n.selected && !(0, a.Ie)(n, e) ? (o.selected = '') : delete o.selected
        }
        const r = t
        return (
          'input' === s &&
            ('radio' === r.type || 'checkbox' === r.type) &&
            (r.checked && !(0, a.Ie)(r, e) ? (o.checked = '') : delete o.checked),
          o
        )
      }
      function C(t, e, n) {
        if (e === a.$m.HIDDEN) return {}
        const o = {},
          s = t.ownerDocument,
          r = I(t)
        if ('link' === r) {
          const e = Array.from(s.styleSheets).find((e) => e.href === t.href),
            r = M(e)
          r && e && (n.addMetric('cssText', r.length), (o._cssText = r))
        }
        if ('style' === r && t.sheet) {
          const e = M(t.sheet)
          e && (n.addMetric('cssText', e.length), (o._cssText = e))
        }
        if ('audio' === r || 'video' === r) {
          const e = t
          o.rr_mediaState = e.paused ? 'paused' : 'played'
        }
        let i, c
        switch (n.kind) {
          case 0:
            ;((i = Math.round(t.scrollTop)),
              (c = Math.round(t.scrollLeft)),
              (i || c) && n.scope.elementsScrollPositions.set(t, { scrollTop: i, scrollLeft: c }))
            break
          case 1:
            n.scope.elementsScrollPositions.has(t) &&
              ({ scrollTop: i, scrollLeft: c } = n.scope.elementsScrollPositions.get(t))
        }
        return (c && (o.rr_scrollLeft = c), i && (o.rr_scrollTop = i), o)
      }
      function M(t) {
        if (!t) return null
        let e
        try {
          e = t.rules || t.cssRules
        } catch {}
        if (!e) return null
        return w(Array.from(e, (0, E.nr)() ? D : _).join(''), t.href)
      }
      function D(t) {
        if (
          (function (t) {
            return 'selectorText' in t
          })(t) &&
          t.selectorText.includes(':')
        ) {
          const e = /(\[[\w-]+[^\\])(:[^\]]+\])/g
          return t.cssText.replace(e, '$1\\$2')
        }
        return _(t)
      }
      function _(t) {
        return (
          ((function (t) {
            return 'styleSheet' in t
          })(t) &&
            M(t.styleSheet)) ||
          t.cssText
        )
      }
      function L(t, e, n) {
        switch (t.nodeType) {
          case t.DOCUMENT_NODE:
            return (function (t, e, n) {
              return {
                type: d.Document,
                id: n.assignId(t),
                childNodes: O(t, e, n),
                adoptedStyleSheets: x(t.adoptedStyleSheets),
              }
            })(t, e, n)
          case t.DOCUMENT_FRAGMENT_NODE:
            return (function (t, e, n) {
              const o = (0, a.p_)(t)
              return (
                o && n.scope.shadowRootsController.addShadowRoot(t, n.scope),
                {
                  type: d.DocumentFragment,
                  id: n.assignId(t),
                  childNodes: O(t, e, n),
                  isShadowRoot: o,
                  adoptedStyleSheets: o ? x(t.adoptedStyleSheets) : void 0,
                }
              )
            })(t, e, n)
          case t.DOCUMENT_TYPE_NODE:
            return (function (t, e) {
              return {
                type: d.DocumentType,
                id: e.assignId(t),
                name: t.name,
                publicId: t.publicId,
                systemId: t.systemId,
              }
            })(t, n)
          case t.ELEMENT_NODE:
            return (function (t, e, n) {
              const o = (function (t) {
                  const e = t.toLowerCase().trim()
                  return S.test(e) ? 'div' : e
                })(t.tagName),
                s =
                  (function (t) {
                    return 'svg' === t.tagName || t instanceof SVGElement
                  })(t) || void 0,
                r = (0, a.jR)((0, a.dT)(t), e)
              if (r === a.$m.HIDDEN) {
                const { width: e, height: r } = t.getBoundingClientRect()
                return {
                  type: d.Element,
                  id: n.assignId(t),
                  tagName: o,
                  attributes: { rr_width: `${e}px`, rr_height: `${r}px`, [a.NT]: a.Wd },
                  childNodes: [],
                  isSVG: s,
                }
              }
              if (r === a.$m.IGNORE) return null
              const i = n.assignId(t),
                c = (function (t, e, n) {
                  return { ...R(t, e, n), ...C(t, e, n) }
                })(t, r, n)
              let u = []
              return (
                (0, a.wR)(t) && 'style' !== o && (u = O(t, r, n)),
                { type: d.Element, id: i, tagName: o, attributes: c, childNodes: u, isSVG: s }
              )
            })(t, e, n)
          case t.TEXT_NODE:
            return (function (t, e, n) {
              const o = (0, a.rf)(t, e)
              return void 0 === o ? null : { type: d.Text, id: n.assignId(t), textContent: o }
            })(t, e, n)
          case t.CDATA_SECTION_NODE:
            return (function (t, e) {
              return { type: d.CDATA, id: e.assignId(t), textContent: '' }
            })(t, n)
          default:
            return null
        }
      }
      function O(t, e, n) {
        const o = []
        return (
          (0, a.wI)(t, (t) => {
            const s = L(t, e, n)
            s && o.push(s)
          }),
          o
        )
      }
      function P(t, e) {
        return L(t, e.scope.configuration.defaultPrivacyLevel, e)
      }
      function V(t, e, n) {
        ;((t[e].count += 1), (t[e].max = Math.max(t[e].max, n)), (t[e].sum += n))
      }
      function k(t, e, n, o, s) {
        const r = [],
          i = {
            cssText: { count: 0, max: 0, sum: 0 },
            serializationDuration: { count: 0, max: 0, sum: 0 },
          },
          a = {
            add(t) {
              r.push(t)
            },
            addMetric(t, e) {
              V(i, t, e)
            },
            assignId(t) {
              const e = o.nodeIds.assign(t)
              return (a.serializedNodeIds && a.serializedNodeIds.add(e), e)
            },
            kind: t,
            scope: o,
          },
          u = (0, c.nx)()
        ;(s(a), V(i, 'serializationDuration', (0, c.vk)(u, (0, c.nx)())))
        for (const t of r) e(t)
        n(i)
      }
      const A = (t, e) => {
          const n = window.visualViewport,
            o = { layoutViewportX: t, layoutViewportY: e, visualViewportX: t, visualViewportY: e }
          return n
            ? (!(function (t) {
                return (
                  Math.abs(t.pageTop - t.offsetTop - window.scrollY) > 25 ||
                  Math.abs(t.pageLeft - t.offsetLeft - window.scrollX) > 25
                )
              })(n)
                ? ((o.visualViewportX = Math.round(t - n.offsetLeft)),
                  (o.visualViewportY = Math.round(e - n.offsetTop)))
                : ((o.layoutViewportX = Math.round(t + n.offsetLeft)),
                  (o.layoutViewportY = Math.round(e + n.offsetTop))),
              o)
            : o
        },
        $ = (t) => ({
          scale: t.scale,
          offsetLeft: t.offsetLeft,
          offsetTop: t.offsetTop,
          pageLeft: t.pageLeft,
          pageTop: t.pageTop,
          height: t.height,
          width: t.width,
        })
      function z(t, e, n, o, s) {
        k(e, n, o, s, (e) => {
          const { width: n, height: o } = (0, a.pB)()
          ;(e.add({
            data: { height: o, href: window.location.href, width: n },
            type: u.Meta,
            timestamp: t,
          }),
            e.add({ data: { has_focus: document.hasFocus() }, type: u.Focus, timestamp: t }),
            e.add({
              data: {
                node: P(document, e),
                initialOffset: { left: (0, a.Gn)(), top: (0, a.zL)() },
              },
              type: u.FullSnapshot,
              timestamp: t,
            }),
            window.visualViewport &&
              e.add({ data: $(window.visualViewport), type: u.VisualViewport, timestamp: t }))
        })
      }
      var F = n(45377),
        H = n(93642),
        B = n(91045)
      function G(t) {
        return !!t.changedTouches
      }
      function J(t) {
        return !0 === t.composed && (0, a.XS)(t.target) ? t.composedPath()[0] : t.target
      }
      function U(t, e) {
        return { data: { source: t, ...e }, type: u.IncrementalSnapshot, timestamp: (0, c.nx)() }
      }
      const X = 50
      function Y(t, e) {
        const { throttled: n, cancel: o } = (0, i.n)(
            (n) => {
              const o = J(n),
                s = e.nodeIds.get(o)
              if (void 0 === s) return
              const r = W(n)
              if (!r) return
              const i = { id: s, timeOffset: 0, x: r.x, y: r.y }
              t(U(G(n) ? l.TouchMove : l.MouseMove, { positions: [i] }))
            },
            X,
            { trailing: !1 },
          ),
          { stop: s } = (0, B.l)(e.configuration, document, ['mousemove', 'touchmove'], n, {
            capture: !0,
            passive: !0,
          })
        return {
          stop: () => {
            ;(s(), o())
          },
        }
      }
      function W(t) {
        let { clientX: e, clientY: n } = G(t) ? t.changedTouches[0] : t
        if (window.visualViewport) {
          const { visualViewportX: t, visualViewportY: o } = A(e, n)
          ;((e = t), (n = o))
        }
        if (Number.isFinite(e) && Number.isFinite(n)) return { x: e, y: n }
      }
      const q = {
        pointerup: p.MouseUp,
        mousedown: p.MouseDown,
        click: p.Click,
        contextmenu: p.ContextMenu,
        dblclick: p.DblClick,
        focus: p.Focus,
        blur: p.Blur,
        touchstart: p.TouchStart,
        touchend: p.TouchEnd,
      }
      function j(t, e) {
        return (0, B.l)(
          e.configuration,
          document,
          Object.keys(q),
          (n) => {
            const o = J(n),
              s = e.nodeIds.get(o)
            if (void 0 === s || (0, a.PJ)(o, e.configuration.defaultPrivacyLevel) === a.$m.HIDDEN)
              return
            const r = q[n.type]
            let i
            if (r !== p.Blur && r !== p.Focus) {
              const t = W(n)
              if (!t) return
              i = { id: s, type: r, x: t.x, y: t.y }
            } else i = { id: s, type: r }
            t({ id: e.eventIds.getIdForEvent(n), ...U(l.MouseInteraction, i) })
          },
          { capture: !0, passive: !0 },
        )
      }
      const K = 100
      function Z(t, e, n) {
        const { throttled: o, cancel: s } = (0, i.n)((t) => {
            const o = J(t)
            if (!o) return
            const s = n.nodeIds.get(o)
            if (void 0 === s || (0, a.PJ)(o, n.configuration.defaultPrivacyLevel) === a.$m.HIDDEN)
              return
            const r =
              o === document
                ? { scrollTop: (0, a.zL)(), scrollLeft: (0, a.Gn)() }
                : { scrollTop: Math.round(o.scrollTop), scrollLeft: Math.round(o.scrollLeft) }
            ;(n.elementsScrollPositions.set(o, r),
              e(U(l.Scroll, { id: s, x: r.scrollLeft, y: r.scrollTop })))
          }, K),
          { stop: r } = (0, B.q)(n.configuration, t, 'scroll', o, { capture: !0, passive: !0 })
        return {
          stop: () => {
            ;(r(), s())
          },
        }
      }
      const Q = 200
      function tt(t, e) {
        const n = (0, a.g1)(e.configuration).subscribe((e) => {
          t(U(l.ViewportResize, e))
        })
        return {
          stop: () => {
            n.unsubscribe()
          },
        }
      }
      function et(t, e) {
        const n = window.visualViewport
        if (!n) return { stop: i.l }
        const { throttled: o, cancel: s } = (0, i.n)(
            () => {
              t({ data: $(n), type: u.VisualViewport, timestamp: (0, c.nx)() })
            },
            Q,
            { trailing: !1 },
          ),
          { stop: r } = (0, B.l)(e.configuration, n, ['resize', 'scroll'], o, {
            capture: !0,
            passive: !0,
          })
        return {
          stop: () => {
            ;(r(), s())
          },
        }
      }
      function nt(t, e) {
        return (0, B.l)(
          e.configuration,
          document,
          ['play', 'pause'],
          (n) => {
            const o = J(n)
            if (!o) return
            const s = e.nodeIds.get(o)
            void 0 === s ||
              (0, a.PJ)(o, e.configuration.defaultPrivacyLevel) === a.$m.HIDDEN ||
              t(U(l.MediaInteraction, { id: s, type: 'play' === n.type ? f.Play : f.Pause }))
          },
          { capture: !0, passive: !0 },
        )
      }
      var ot = n(89261)
      function st(t, e) {
        function n(t, n) {
          if (!t || !t.ownerNode) return
          const o = e.nodeIds.get(t.ownerNode)
          void 0 !== o && n(o)
        }
        const o = [
          (0, ot.H)(CSSStyleSheet.prototype, 'insertRule', ({ target: e, parameters: [o, s] }) => {
            n(e, (e) => t(U(l.StyleSheetRule, { id: e, adds: [{ rule: o, index: s }] })))
          }),
          (0, ot.H)(CSSStyleSheet.prototype, 'deleteRule', ({ target: e, parameters: [o] }) => {
            n(e, (e) => t(U(l.StyleSheetRule, { id: e, removes: [{ index: o }] })))
          }),
        ]
        function s(e) {
          o.push(
            (0, ot.H)(e.prototype, 'insertRule', ({ target: e, parameters: [o, s] }) => {
              n(e.parentStyleSheet, (n) => {
                const r = rt(e)
                r &&
                  (r.push(s || 0), t(U(l.StyleSheetRule, { id: n, adds: [{ rule: o, index: r }] })))
              })
            }),
            (0, ot.H)(e.prototype, 'deleteRule', ({ target: e, parameters: [o] }) => {
              n(e.parentStyleSheet, (n) => {
                const s = rt(e)
                s && (s.push(o), t(U(l.StyleSheetRule, { id: n, removes: [{ index: s }] })))
              })
            }),
          )
        }
        return (
          typeof CSSGroupingRule < 'u' ? s(CSSGroupingRule) : (s(CSSMediaRule), s(CSSSupportsRule)),
          {
            stop: () => {
              o.forEach((t) => t.stop())
            },
          }
        )
      }
      function rt(t) {
        const e = []
        let n = t
        for (; n.parentRule; ) {
          const t = Array.from(n.parentRule.cssRules).indexOf(n)
          ;(e.unshift(t), (n = n.parentRule))
        }
        if (!n.parentStyleSheet) return
        const o = Array.from(n.parentStyleSheet.cssRules).indexOf(n)
        return (e.unshift(o), e)
      }
      function it(t, e) {
        return (0, B.l)(e.configuration, window, ['focus', 'blur'], () => {
          t({ data: { has_focus: document.hasFocus() }, type: u.Focus, timestamp: (0, c.nx)() })
        })
      }
      function at(t, e, n) {
        const o = t.subscribe(12, (t) => {
          var o, s
          t.rawRumEvent.type === a.bb.ACTION &&
            t.rawRumEvent.action.type === a.X2.CLICK &&
            null !==
              (s =
                null === (o = t.rawRumEvent.action.frustration) || void 0 === o
                  ? void 0
                  : o.type) &&
            void 0 !== s &&
            s.length &&
            'events' in t.domainContext &&
            t.domainContext.events &&
            t.domainContext.events.length &&
            e({
              timestamp: t.rawRumEvent.date,
              type: u.FrustrationRecord,
              data: {
                frustrationTypes: t.rawRumEvent.action.frustration.type,
                recordIds: t.domainContext.events.map((t) => n.eventIds.getIdForEvent(t)),
              },
            })
        })
        return {
          stop: () => {
            o.unsubscribe()
          },
        }
      }
      function ct(t, e, n) {
        const o = t.subscribe(5, () => {
          ;(n(), e({ timestamp: (0, c.nx)(), type: u.ViewEnd }))
        })
        return {
          stop: () => {
            o.unsubscribe()
          },
        }
      }
      function ut(t, e, n) {
        const o = n.configuration.defaultPrivacyLevel,
          s = new WeakMap(),
          r = t !== document,
          { stop: c } = (0, B.l)(
            n.configuration,
            t,
            r ? ['change'] : ['input', 'change'],
            (t) => {
              const e = J(t)
              ;(e instanceof HTMLInputElement ||
                e instanceof HTMLTextAreaElement ||
                e instanceof HTMLSelectElement) &&
                d(e)
            },
            { capture: !0, passive: !0 },
          )
        let u
        if (r) u = i.l
        else {
          const t = [
            (0, ot.t)(HTMLInputElement.prototype, 'value', d),
            (0, ot.t)(HTMLInputElement.prototype, 'checked', d),
            (0, ot.t)(HTMLSelectElement.prototype, 'value', d),
            (0, ot.t)(HTMLTextAreaElement.prototype, 'value', d),
            (0, ot.t)(HTMLSelectElement.prototype, 'selectedIndex', d),
          ]
          u = () => {
            t.forEach((t) => t.stop())
          }
        }
        return {
          stop: () => {
            ;(u(), c())
          },
        }
        function d(t) {
          const e = (0, a.PJ)(t, o)
          if (e === a.$m.HIDDEN) return
          const n = t.type
          let s
          if ('radio' === n || 'checkbox' === n) {
            if ((0, a.Ie)(t, e)) return
            s = { isChecked: t.checked }
          } else {
            const n = h(t, e)
            if (void 0 === n) return
            s = { text: n }
          }
          p(t, s)
          const r = t.name
          'radio' === n &&
            r &&
            t.checked &&
            document
              .querySelectorAll(`input[type="radio"][name="${CSS.escape(r)}"]`)
              .forEach((e) => {
                e !== t && p(e, { isChecked: !1 })
              })
        }
        function p(t, o) {
          const r = n.nodeIds.get(t)
          if (void 0 === r) return
          const i = s.get(t)
          ;(!i || i.text !== o.text || i.isChecked !== o.isChecked) &&
            (s.set(t, o), e(U(l.Input, { id: r, ...o })))
        }
      }
      var dt = n(93195),
        lt = n(7417)
      const pt = 100,
        ft = 16
      function mt(t, e, n, o) {
        const s = (0, a.W3)()
        if (!s) return { stop: i.l, flush: i.l }
        const r = (function (t) {
            let e = i.l,
              n = []
            function o() {
              ;(e(), t(n), (n = []))
            }
            const { throttled: s, cancel: r } = (0, i.n)(o, ft, { leading: !1 })
            return {
              addMutations: (t) => {
                ;(0 === n.length && (e = (0, lt.BB)(s, { timeout: pt })), n.push(...t))
              },
              flush: o,
              stop: () => {
                ;(e(), r())
              },
            }
          })((t) => {
            k(2, e, n, o, (e) =>
              (function (t, e) {
                const n = new Map()
                t.filter((t) => 'childList' === t.type).forEach((t) => {
                  t.removedNodes.forEach((t) => {
                    ht(t, e.scope.shadowRootsController.removeShadowRoot)
                  })
                })
                const o = t.filter(
                    (t) =>
                      t.target.isConnected &&
                      e.scope.nodeIds.areAssignedForNodeAndAncestors(t.target) &&
                      (0, a.PJ)(t.target, e.scope.configuration.defaultPrivacyLevel, n) !==
                        a.$m.HIDDEN,
                  ),
                  {
                    adds: s,
                    removes: r,
                    hasBeenSerialized: i,
                  } = (function (t, e, n) {
                    const o = new Set(),
                      s = new Map()
                    for (const e of t)
                      (e.addedNodes.forEach((t) => {
                        o.add(t)
                      }),
                        e.removedNodes.forEach((t) => {
                          ;(o.has(t) || s.set(t, e.target), o.delete(t))
                        }))
                    const r = Array.from(o)
                    ;((function (t) {
                      t.sort((t, e) => {
                        const n = t.compareDocumentPosition(e)
                        return n & Node.DOCUMENT_POSITION_CONTAINED_BY
                          ? -1
                          : n & Node.DOCUMENT_POSITION_CONTAINS ||
                              n & Node.DOCUMENT_POSITION_FOLLOWING
                            ? 1
                            : n & Node.DOCUMENT_POSITION_PRECEDING
                              ? -1
                              : 0
                      })
                    })(r),
                      (n.serializedNodeIds = new Set()))
                    const i = []
                    for (const t of r) {
                      if (u(t)) continue
                      const o = (0, a.PJ)(
                        t.parentNode,
                        n.scope.configuration.defaultPrivacyLevel,
                        e,
                      )
                      if (o === a.$m.HIDDEN || o === a.$m.IGNORE) continue
                      const s = L(t, o, n)
                      if (!s) continue
                      const r = (0, a.$4)(t)
                      i.push({ nextId: d(t), parentId: n.scope.nodeIds.get(r), node: s })
                    }
                    const c = []
                    return (
                      s.forEach((t, e) => {
                        const o = n.scope.nodeIds.get(t),
                          s = n.scope.nodeIds.get(e)
                        void 0 !== o && void 0 !== s && c.push({ parentId: o, id: s })
                      }),
                      { adds: i, removes: c, hasBeenSerialized: u }
                    )
                    function u(t) {
                      var e
                      const o = n.scope.nodeIds.get(t)
                      return (
                        void 0 !== o &&
                        (null === (e = n.serializedNodeIds) || void 0 === e ? void 0 : e.has(o))
                      )
                    }
                    function d(t) {
                      let e = t.nextSibling
                      for (; e; ) {
                        const t = n.scope.nodeIds.get(e)
                        if (void 0 !== t) return t
                        e = e.nextSibling
                      }
                      return null
                    }
                  })(
                    o.filter((t) => 'childList' === t.type),
                    n,
                    e,
                  ),
                  c = (function (t, e, n) {
                    var o
                    const s = [],
                      r = new Set(),
                      i = t.filter((t) => !r.has(t.target) && (r.add(t.target), !0))
                    for (const t of i) {
                      if (t.target.textContent === t.oldValue) continue
                      const r = n.scope.nodeIds.get(t.target)
                      if (void 0 === r) continue
                      const i = (0, a.PJ)(
                        (0, a.$4)(t.target),
                        n.scope.configuration.defaultPrivacyLevel,
                        e,
                      )
                      i === a.$m.HIDDEN ||
                        i === a.$m.IGNORE ||
                        s.push({
                          id: r,
                          value: null !== (o = (0, a.rf)(t.target, i)) && void 0 !== o ? o : null,
                        })
                    }
                    return s
                  })(
                    o.filter((t) => 'characterData' === t.type && !i(t.target)),
                    n,
                    e,
                  ),
                  u = (function (t, e, n) {
                    const o = [],
                      s = new Map(),
                      r = t.filter((t) => {
                        const e = s.get(t.target)
                        return (
                          (!e || !e.has(t.attributeName)) &&
                          (e ? e.add(t.attributeName) : s.set(t.target, new Set([t.attributeName])),
                          !0)
                        )
                      }),
                      i = new Map()
                    for (const t of r) {
                      if (t.target.getAttribute(t.attributeName) === t.oldValue) continue
                      const s = n.scope.nodeIds.get(t.target)
                      if (void 0 === s) continue
                      const r = (0, a.PJ)(t.target, n.scope.configuration.defaultPrivacyLevel, e),
                        c = N(t.target, r, t.attributeName, n.scope.configuration)
                      let u
                      if ('value' === t.attributeName) {
                        const e = h(t.target, r)
                        if (void 0 === e) continue
                        u = e
                      } else u = 'string' == typeof c ? c : null
                      let d = i.get(t.target)
                      ;(d || ((d = { id: s, attributes: {} }), o.push(d), i.set(t.target, d)),
                        (d.attributes[t.attributeName] = u))
                    }
                    return o
                  })(
                    o.filter((t) => 'attributes' === t.type && !i(t.target)),
                    n,
                    e,
                  )
                ;(!c.length && !u.length && !r.length && !s.length) ||
                  e.add(U(l.Mutation, { adds: s, removes: r, texts: c, attributes: u }))
              })(t.concat(c.takeRecords()), e),
            )
          }),
          c = new s((0, dt.dm)(r.addMutations))
        return (
          c.observe(t, {
            attributeOldValue: !0,
            attributes: !0,
            characterData: !0,
            characterDataOldValue: !0,
            childList: !0,
            subtree: !0,
          }),
          {
            stop: () => {
              ;(c.disconnect(), r.stop())
            },
            flush: () => {
              r.flush()
            },
          }
        )
      }
      function ht(t, e) {
        ;((0, a.XS)(t) && e(t.shadowRoot), (0, a.wI)(t, (t) => ht(t, e)))
      }
      const gt = (t, e) => {
        const n = new Map()
        return {
          addShadowRoot: (o, s) => {
            if (n.has(o)) return
            const r = mt(o, t, e, s),
              i = ut(o, t, s),
              a = Z(o, t, s)
            n.set(o, {
              flush: () => r.flush(),
              stop: () => {
                ;(r.stop(), i.stop(), a.stop())
              },
            })
          },
          removeShadowRoot: (t) => {
            const e = n.get(t)
            e && (e.stop(), n.delete(t))
          },
          stop: () => {
            n.forEach(({ stop: t }) => t())
          },
          flush: () => {
            n.forEach(({ flush: t }) => t())
          },
        }
      }
      function yt(t) {
        const { emitRecord: e, emitStats: n, configuration: o, lifeCycle: s } = t
        if (!e || !n) throw new Error('emit functions are required')
        const r = (n) => {
            ;(e(n), (0, F.b)('record', { record: n }))
            const o = t.viewHistory.findView()
            H.$1(o.id)
          },
          i = gt(r, n),
          u = (function (t, e, n, o, s) {
            return {
              configuration: t,
              elementsScrollPositions: e,
              eventIds: n,
              nodeIds: o,
              shadowRootsController: s,
            }
          })(
            o,
            (function () {
              const t = new WeakMap()
              return {
                set(e, n) {
                  ;(e === document && !document.scrollingElement) ||
                    t.set(e === document ? document.scrollingElement : e, n)
                },
                get: (e) => t.get(e),
                has: (e) => t.has(e),
              }
            })(),
            (function () {
              const t = new WeakMap()
              let e = 1
              return { getIdForEvent: (n) => (t.has(n) || t.set(n, e++), t.get(n)) }
            })(),
            (function () {
              const t = new WeakMap()
              let e = 0
              const n = (e) => t.get(e)
              return {
                assign: (o) => {
                  let s = n(o)
                  return (void 0 === s && ((s = e++), t.set(o, s)), s)
                },
                get: n,
                areAssignedForNodeAndAncestors: (t) => {
                  let e = t
                  for (; e; ) {
                    if (void 0 === n(e) && !(0, a.p_)(e)) return !1
                    e = (0, a.$4)(e)
                  }
                  return !0
                },
              }
            })(),
            i,
          ),
          { stop: d } = (function (t, e, n, o, s) {
            z((0, c.nx)(), 0, e, n, s)
            const { unsubscribe: r } = t.subscribe(2, (t) => {
              ;(o(), z(t.startClocks.timeStamp, 1, e, n, s))
            })
            return { stop: r }
          })(s, r, n, l, u)
        function l() {
          ;(i.flush(), p.flush())
        }
        const p = mt(document, r, n, u),
          f = [
            p,
            Y(r, u),
            j(r, u),
            Z(document, r, u),
            tt(r, u),
            ut(document, r, u),
            nt(r, u),
            st(r, u),
            it(r, u),
            et(r, u),
            at(s, r, u),
            ct(s, r, l),
          ]
        return {
          stop: () => {
            ;(i.stop(), f.forEach((t) => t.stop()), d())
          },
          flushMutations: l,
          shadowRootsController: i,
        }
      }
      var vt = n(70583),
        wt = n(15320)
      function St({ context: t, creationReason: e, encoder: n }) {
        let o = 0
        const s = t.view.id,
          r = {
            start: 1 / 0,
            end: -1 / 0,
            creation_reason: e,
            records_count: 0,
            has_full_snapshot: !1,
            index_in_view: H.K_(s),
            source: 'browser',
            ...t,
          },
          i = {
            cssText: { count: 0, max: 0, sum: 0 },
            serializationDuration: { count: 0, max: 0, sum: 0 },
          }
        return (
          H.H5(s),
          {
            addRecord: function (t, e) {
              ;((r.start = Math.min(r.start, t.timestamp)),
                (r.end = Math.max(r.end, t.timestamp)),
                (r.records_count += 1),
                r.has_full_snapshot || (r.has_full_snapshot = t.type === u.FullSnapshot))
              const s = n.isEmpty ? '{"records":[' : ','
              n.write(s + JSON.stringify(t), (t) => {
                ;((o += t), e(o))
              })
            },
            addStats: function (t) {
              !(function (t, e) {
                for (const n of ['cssText', 'serializationDuration'])
                  ((t[n].count += e[n].count),
                    (t[n].max = Math.max(t[n].max, e[n].max)),
                    (t[n].sum += e[n].sum))
              })(i, t)
            },
            flush: function (t) {
              if (n.isEmpty) throw new Error('Empty segment flushed')
              ;(n.write(`],${JSON.stringify(r).slice(1)}\n`),
                n.finish((e) => {
                  ;(H.L7(r.view.id, e.rawBytesCount), t(r, i, e))
                }))
            },
          }
        )
      }
      const It = 5 * c.OY
      let Tt = 6e4
      function xt(t, e, n, o, s, r) {
        return (function (t, e, n, o) {
          let s = { status: 0, nextSegmentCreationReason: 'init' }
          const { unsubscribe: r } = t.subscribe(2, () => {
              a('view_change')
            }),
            { unsubscribe: i } = t.subscribe(11, (t) => {
              a(t.reason)
            })
          function a(t) {
            ;(1 === s.status &&
              (s.segment.flush((e, o, s) => {
                const r = (function (t, e, n, o) {
                  const s = new FormData()
                  s.append(
                    'segment',
                    new Blob([t], { type: 'application/octet-stream' }),
                    `${e.session.id}-${e.start}`,
                  )
                  const r = { raw_segment_size: o, compressed_segment_size: t.byteLength, ...e },
                    i = JSON.stringify(r)
                  return (
                    s.append('event', new Blob([i], { type: 'application/json' })),
                    {
                      data: s,
                      bytesCount: t.byteLength,
                      cssText: n.cssText,
                      isFullSnapshot: 0 === e.index_in_view,
                      rawSize: o,
                      recordCount: e.records_count,
                      serializationDuration: n.serializationDuration,
                    }
                  )
                })(s.output, e, o, s.rawBytesCount)
                ;(0, vt.Kp)(t) ? n.sendOnExit(r) : n.send(r)
              }),
              (0, wt.DJ)(s.expirationTimeoutId)),
              (s = 'stop' !== t ? { status: 0, nextSegmentCreationReason: t } : { status: 2 }))
          }
          return {
            addRecord: (t) => {
              if (2 !== s.status) {
                if (0 === s.status) {
                  const t = e()
                  if (!t) return
                  s = {
                    status: 1,
                    segment: St({
                      encoder: o,
                      context: t,
                      creationReason: s.nextSegmentCreationReason,
                    }),
                    expirationTimeoutId: (0, wt.wg)(() => {
                      a('segment_duration_limit')
                    }, It),
                  }
                }
                s.segment.addRecord(t, (t) => {
                  t > Tt && a('segment_bytes_limit')
                })
              }
            },
            addStats: (t) => {
              1 === s.status && s.segment.addStats(t)
            },
            stop: () => {
              ;(a('stop'), r(), i())
            },
          }
        })(
          t,
          () =>
            (function (t, e, n) {
              const o = e.findTrackedSession(),
                s = n.findView()
              if (o && s)
                return { application: { id: t }, session: { id: o.id }, view: { id: s.id } }
            })(e.applicationId, n, o),
          s,
          r,
        )
      }
      function Et(t, e, n, a, c, u, d) {
        const l = [],
          p =
            d ||
            (0, s.sA)(
              [e.sessionReplayEndpointBuilder],
              (e) => {
                ;(t.notify(14, { error: e }),
                  (0, o.A2)('Error reported to customer', { 'error.message': e.message }))
              },
              Tt,
            )
        let f, m
        if ((0, r.d0)())
          (({ addRecord: f } = (function (t) {
            const e = (0, r.Y9)()
            return {
              addRecord: (n) => {
                const o = t.findView()
                e.send('record', n, o.id)
              },
            }
          })(a)),
            (m = i.l))
        else {
          const s = xt(t, e, n, a, p, c)
          ;((f = s.addRecord), (m = s.addStats), l.push(s.stop))
          const r = (function (t, e) {
            if (!t.metricsEnabled) return { stop: i.l }
            const { unsubscribe: n } = e.subscribe((t) => {
              if (
                'failure' === t.type ||
                'queue-full' === t.type ||
                ('success' === t.type && t.payload.isFullSnapshot)
              ) {
                const e = (function (t, e, n) {
                  return {
                    cssText: { count: n.cssText.count, max: n.cssText.max, sum: n.cssText.sum },
                    isFullSnapshot: n.isFullSnapshot,
                    ongoingRequests: {
                      count: e.ongoingRequestCount,
                      totalSize: e.ongoingByteCount,
                    },
                    recordCount: n.recordCount,
                    result: t,
                    serializationDuration: {
                      count: n.serializationDuration.count,
                      max: n.serializationDuration.max,
                      sum: n.serializationDuration.sum,
                    },
                    size: { compressed: n.bytesCount, raw: n.rawSize },
                  }
                })(t.type, t.bandwidth, t.payload)
                ;(0, o.Gk)('Segment network request metrics', { metrics: e })
              }
            })
            return { stop: n }
          })(u, p.observable)
          l.push(r.stop)
        }
        const { stop: h } = yt({
          emitRecord: f,
          emitStats: m,
          configuration: e,
          lifeCycle: t,
          viewHistory: a,
        })
        return (
          l.push(h),
          {
            stop: () => {
              l.forEach((t) => t())
            },
          }
        )
      }
    },
  },
])
