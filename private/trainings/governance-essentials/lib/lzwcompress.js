'use strict'
;(function () {
  var r = (function (r, e) {
    var n = {},
      t = !1,
      o = function (r) {
        try {
          console.log(
            'lzwCompress: ' +
              new Date().toISOString() +
              ' : ' +
              ('object' == typeof r ? e.stringify(r) : r),
          )
        } catch (r) {}
      }
    ;(!(function (r, e, n) {
      var i = [],
        u = function (r) {
          return function (e) {
            return e === r
          }
        },
        f = function (r, e, n) {
          ;(function (r, e) {
            for (var n = 0; n < r.length; n++) if (e(r[n])) return !0
            return !1
          })(r, n) || r.push(e)
        },
        c = function (r) {
          if ('object' == typeof r) for (var n in r) (e.isArray(r) || f(i, n, u(n)), c(r[n]))
        },
        a = function (r) {
          if ('object' != typeof r) return r
          for (var n in r)
            e.isArray(r)
              ? (r[n] = a(r[n]))
              : r.hasOwnProperty(n) && ((r[i.indexOf(n)] = a(r[n])), delete r[n])
          return r
        },
        s = function (r) {
          if ('object' != typeof r) return r
          for (var n in r)
            e.isArray(r)
              ? (r[n] = s(r[n]))
              : r.hasOwnProperty(n) && i[n] && ((r[i[n]] = s(r[n])), delete r[n])
          return r
        }
      r.KeyOptimize = {
        pack: function (r) {
          i = []
          var e = n.parse(r)
          return (
            c(e),
            t && o('keys length : ' + i.length),
            t && o('keys        : ' + i),
            n.stringify({ __k: i, __v: a(e) })
          )
        },
        unpack: function (r) {
          var e = r
          return 'object' != typeof e
            ? r
            : e.hasOwnProperty('__k')
              ? ((i = e.__k), s(e.__v))
              : n.stringify(e)
        },
      }
    })(n, r, e),
      (function (r, e) {
        r.LZWCompress = {
          pack: function (r) {
            if ('string' != typeof r) return r
            var e,
              n,
              t,
              o = {},
              i = '',
              u = [],
              f = 256
            for (e = 0; e < 256; e += 1) o[String.fromCharCode(e)] = e
            for (e = 0; e < r.length; e += 1)
              if (o[(t = i + (n = r.charAt(e)))]) i = t
              else {
                if (void 0 === o[i]) return r
                ;(u.push(o[i]), (o[t] = f++), (i = String(n)))
              }
            return ('' !== i && u.push(o[i]), u)
          },
          unpack: function (r) {
            if (!e.isArray(r)) return r
            var n,
              t,
              o,
              i,
              u = [],
              f = '',
              c = 256
            for (n = 0; n < 256; n += 1) u[n] = String.fromCharCode(n)
            for (o = t = String.fromCharCode(r[0]), n = 1; n < r.length; n += 1) {
              if (u[(i = r[n])]) f = u[i]
              else {
                if (i !== c) return null
                f = t + t.charAt(0)
              }
              ;((o += f), (u[c++] = t + f.charAt(0)), (t = f))
            }
            return o
          },
        }
      })(n, r))
    return {
      pack: function (r) {
        if ((t && o('original (uncompressed) : ' + r), !r || !0 === r || r instanceof Date))
          return r
        var i = r
        'object' == typeof r &&
          ((i = n.KeyOptimize.pack(e.stringify(r))), t && o('key optimized: ' + i))
        var u = n.LZWCompress.pack(i)
        return (t && o('packed   (compressed)   : ' + u), u)
      },
      unpack: function (r) {
        if ((t && o('original (compressed)   : ' + r), !r || !0 === r || r instanceof Date))
          return r
        var i,
          u = n.LZWCompress.unpack(r)
        try {
          i = e.parse(u)
        } catch (r) {
          return (t && o('unpacked (uncompressed) : ' + u), u)
        }
        return (
          'object' == typeof i && (u = n.KeyOptimize.unpack(i)),
          t && o('unpacked (uncompressed) : ' + u),
          u
        )
      },
      enableLogging: function (r) {
        t = r
      },
    }
  })(Array, JSON)
  'undefined' != typeof module && module.exports ? (module.exports = r) : (this.lzwCompress = r)
}).call(this)
