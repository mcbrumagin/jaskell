 //---------------------------------------------------------------------------
// Jaskell Html ---------------------------------------------------------------

jaskell.html = new function () {

    var UnitBezier = function (p1x, p1y, p2x, p2y) {

        // Calculate the polynomial coefficients
        var cx = 3.0 * p1x
        var bx = 3.0 * (p2x - p1x) - cx
        var ax = 1.0 - cx - bx
        var cy = 3.0 * p1y
        var by = 3.0 * (p2y - p1y) - cy
        var ay = 1.0 - cy - by

        // Using Horner's rule
        var curveX = t => ((ax * t + bx) * t + cx) * t
        var curveY = t => ((ay * t + by) * t + cy) * t
        var curveDerivativeX = t => (3.0 * ax * t + 2.0 * bx) * t + cx

        // Given an x value, find a parametric value it came from
        //var mult = Math.EPSILON // TODO: Pending browser support
        var mult = 0.000000001
        var solveCurveX = function (x, grain) {

            // First try Newton's method
            // TODO: Dynamically choose iterations based on performance and grain
            for (var t2 = x, i = 0; i < 4; i++) {
                var x2 = curveX(t2) - x
                if (Math.abs(x2) < grain * mult) return t2
                var d2 = curveDerivativeX(t2)
                if (Math.abs(d2) < 1e-6) break
                t2 = t2 - x2 / d2
            }

            // Newton's failed, double the grain to prevent failures
            mult *= 2

            // Fall back to the bisection method
            if (x < 0) return 0
            else return 1
        }

        var solve = (x, epsilon) => curveY(solveCurveX(x, epsilon))

        return solve
    }

    var doEachIfElem = function (elem, fn) {
        if (elem) {
            if (elem.toString() !== '[object HTMLCollection]') return fn(elem)
            else return jaskell.each(elem, fn)
        } else return elem => jaskell.each(elem, fn)
    }

    var _ = {}
    _.select = {
        byId: document.getElementById.bind(document),
        one: document.querySelector.bind(document),
        all: document.querySelectorAll.bind(document),
        byClass: document.getElementsByClassName.bind(document),
        byTag: document.getElementsByTagName.bind(document),
        byName: document.getElementsByName.bind(document)
    }
    _.append = function (val, elem) {
        var append = function (elem) {
            elem.innerHTML += val
            return elem
        }
        return doEachIfElem(elem, append)
    }
    _.template = {}
    _.template.list = {},
        _.template.add = function (name, text) {
            if (_.template.list[name]) console.warn(`Overwriting template ${name}`)
            if (text.outerHTML) text = text.outerHTML
            _.template.list[name] = text
        }
    _.template.render = function (name, ...params) {
        if (!_.template.list[name]) throw new Error(`Could not find a template by name: ${name}`)
        return _.template.list[name].replace(/{\d*}/g, function (matched) {
            return params[matched.replace(/{|}/g,'')]
        })
    }
    _.classes = {}
    _.classes.add = function (...args /* ...vals, elem */) {
        var ind = args.length - 1
        if (args[ind].toString() === '[object HTMLCollection]') {
            var vals = args.slice(0, ind)
            var elem = args[ind]
        } else vals = args.slice(0)
        var add = function (elem) {
            for (var i = 0; i < vals.length; i++) {
                if (!new RegExp(vals[i]).test(elem.className))
                    elem.className += ' ' + vals[i]
            }
            return elem
        }
        return doEachIfElem(elem, add)
    }
    _.classes.remove = function (...args /* ...vals, elem */) {
        var ind = args.length - 1
        if (args[ind].toString() === '[object HTMLCollection]') {
            var vals = args.slice(0, ind)
            var elem = args[ind]
        } else vals = args.slice(0)
        var remove = function (elem) {
            for (var i = 0; i < vals.length; i++) {
                var regex = new RegExp('(^|\\s)' + vals[i] + '(?=\\s|$)', 'g')
                elem.className = elem.className.replace(regex, '').trim()
            }
            return elem
        }
        return doEachIfElem(elem, remove)
    }
    _.transition = {}
    _.transition.bezier = function (bezier, prop, start, end, duration, callback, elem) {
        if (isNaN(duration)) {
            elem = callback
            callback = duration
            duration = end
            end = start
            start = null
        }
        if (!jaskell.isFunction(callback)) {
            elem = callback
        }
        bezier = new UnitBezier(...bezier)
        var transition = function (elem) {
            if (start == null) start = elem[prop]
            var startTime = Date.now()
            var update = function() {
                var elapsed = Date.now() - startTime
                if (elapsed > duration) {
                    elem[prop] = end
                } else {
                    var solution = bezier(elapsed / duration, 100)
                    var result = Math.round(solution * (end - start) + start)
                    // Do not force the browser to handle unnecessary assignments
                    if (elem[prop] != result) elem[prop] = result
                    requestAnimationFrame(update)
                }
            }
            requestAnimationFrame(update)
            return elem
        }
        return doEachIfElem(elem, transition)
    }
    _.style = {}
    _.style.css = function(styles, elem) {
        var css = function (elem) {
            for (var style in styles) {
                elem.style[style] = styles[style]
            }
            return elem
        }
        return doEachIfElem(elem, css)
    }
    _.style.animate = {}
    _.style.animate.bezier = function(bezier, style, start, end, duration, callback, elem) {
        if (isNaN(duration)) {
            elem = callback
            callback = duration
            duration = end
            end = start
            start = null
        }
        var checkCallback = function (callback, elem) {
            if (!jaskell.isFunction(callback)) {
                elem = callback
            }
            var animate = function (elem) {
                var durSec = duration / 1000
                if (start != null) elem.style[style] = start
                var easing = 'ease'
                if (jaskell.isArray(bezier)) easing = 'cubic-bezier(' + bezier.join(',') + ')'
                else if (bezier === 'linear') easing = 'linear'
                else if (bezier === 'ease-in') easing = 'ease-in'
                else if (bezier === 'ease-out') easing = 'ease-out'
                else if (bezier === 'ease-in-out') easing = 'ease-in-out'
                elem.style['transition'] = style + ' ' + durSec + 's ' + easing
                elem.style[style] = end
                if (jaskell.isFunction(callback))
                    setTimeout(() => callback(elem), duration)
                return elem
            }
            return doEachIfElem(elem, animate)
        }
        if (callback !== undefined) return checkCallback(callback, elem)
        else return (callback, elem) => checkCallback(callback, elem)
    }
    _.style.reset = function (...args /* ...props, elem */) {
        var ind = args.length - 1
        if (args[ind].toString() === '[object HTMLCollection]') {
            var props = args.slice(0, ind)
            var elem = args[ind]
        } else props = args

        var reset = function (elem) {
            console.log('resetting',props.join(', '))
            if (props) {
                for (var prop of props) {
                    elem.style[prop] = ''
                }
            } else elem.removeAttribute('style')
            return elem
        }
        return doEachIfElem(elem, reset)
    }
    _.event = {}
    _.event.prevent = function (event) {
        event.preventDefault()
        return event
    }
    _.event.stop = function (event) {
        event.stopPropagation()
        return event
    }
    _.event.listen = function (type, handler, elem) {
        var listen = function (elem) {
            elem.addEventListener(type, handler, false)
            return elem
        }
        return doEachIfElem(elem, listen)
    }
    _.event.capture = function (type, handler, elem) {
        var capture = function (elem) {
            elem.addEventListener(type, handler, true)
            return elem
        }
        return doEachIfElem(elem, capture)
    }
    _.event.watch = function (type, handler, target) {}
    _.event.list = {}
    _.event.create = function (name, bubbles, cancelable, detail) {
        let options = {}
        options.bubbles = bubbles === undefined ? true : bubbles
        options.cancelable = cancelable === undefined ? true : cancelable
        _.event.list[name] = function () {
            if (detail) options.detail = detail()
            return new CustomEvent(name, options)
        }
    }
    _.event.trigger = function (event, elem) {
        var trigger = function (elem) {
            var evt = _.event.list[event]
            if (evt) elem.dispatchEvent(evt())
            else elem.dispatchEvent(_.event.create(event)())
            return elem
        }
        return doEachIfElem(elem, trigger)
    }
    _.request = {}
    _.request.create = function (method, url, headers, callback) {
        var defaultHeaders = {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        }
        if (jaskell.isFunction(headers)) {
            callback = headers
            headers = defaultHeaders
        }
        return function sender(data) {
            var req = new XMLHttpRequest()
            req.onload = () => callback(req.responseText, req.status)
            req.open(method, url, true)
            for (var prop in headers) {
                req.setRequestHeader(prop, headers[prop])
            }
            req.send(data)
        }
    }
    _.request.json = {}
    _.request.json.create = function (method, url, callback) {
        return function sender(data) {
            var req = new XMLHttpRequest()
            req.onload = () => callback(req.responseText, req.status)
            req.open(method, url, true)
            req.setRequestHeader("Content-Type", "application/json")
            req.send(JSON.stringify(data))
        }
    }
    _.log = function (message, elem) {
        var log = function (elem) {
            console.log(message, elem)
            return elem
        }
        if (elem) return log(elem)
        else return log
    }
    return _
}
