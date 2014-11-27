// TODO: Refactor to use private methods (should cut 25-50% of code)
// TODO: Import other jaskell functions

 //---------------------------------------------------------------------------
// Core Jaskell Functions -----------------------------------------------------

var jaskell = new function () {
    
    Function.prototype.curry = function () {
        var f = this
        var a = _.toArray(arguments)
        return function curried() {
            return f.apply(this, a.concat(_.toArray(arguments)))
        }
    }

    var _ = {}

    _.isFunction = function (obj) {
        return {}.toString.call(obj) === '[object Function]'
    }

    _.toArray = function (args) {
        return Array.prototype.slice.call(args)
    }

    _.each = function (objs, fn) {
        if (objs.length) {
            var results = []
            for (var i = 0; i < objs.length; i++) {
                results.push(fn(objs[i]))
            }
            return results
        } else return fn(objs)
    }

    _.using = function (/* ...names, operation */) {
        var args = _.toArray(arguments)
        var ind = args.length - 1
        var names = args.slice(0, ind)
        var operation = args[ind]
        return operation.apply(this, names)
    }

    _.sequence = function (/* ...operations */) {
        var fns = arguments,
            l = arguments.length
        var seq = function () {
            var i = -1
            var args = _.toArray(arguments)
            while (i++ < l - 1) {
                if (!_.isFunction(fns[i])) {
                    var val = fns[i]
                    fns[i] = function () {
                        return val
                    }
                }
                args = [fns[i].apply(this, args)]
            }
            return args[0]
        }
        if (!_.isFunction(fns[0])) return seq()
        else return seq
    }

    _.compose = function () {
        var fns = arguments,
            len = arguments.length
        return function () {
            var i = len
            var args = _.toArray(arguments)
            while ( --i >= 0 ) {
                args = [fns[i].apply(this, args)]
            }
            return args[0]
        }
    }

    _.range = function (start, increment, end) {
        var array = []
        for (var i = start; i < end; i = i + increment) {
            array.push(i)
        }
        return array
    }

    return _
}


 //---------------------------------------------------------------------------
// Jaskell Html ---------------------------------------------------------------

jaskell.html = new function () {

    // Adapted from http://trac.webkit.org/browser/trunk/Source/WebCore/platform/graphics/UnitBezier.h
    var UnitBezier = function (p1x, p1y, p2x, p2y) {

        // Calculate the polynomial coefficients, implicit first and last control points are (0,0) and (1,1).
        var cx = 3.0 * p1x
        var bx = 3.0 * (p2x - p1x) - cx
        var ax = 1.0 - cx - bx

        var cy = 3.0 * p1y
        var by = 3.0 * (p2y - p1y) - cy
        var ay = 1.0 - cy - by

        var sampleCurveX = function (t) {
            // `ax t^3 + bx t^2 + cx t' expanded using Horner's rule.
            return ((ax * t + bx) * t + cx) * t
        }

        var sampleCurveY = function (t) {
            return ((ay * t + by) * t + cy) * t
        }

        var sampleCurveDerivativeX = function (t) {
            return (3.0 * ax * t + 2.0 * bx) * t + cx
        }

        // Given an x value, find a parametric value it came from.
        var solveCurveX = function (x, epsilon) {
            var t0, t1, t2, x2, d2, i

            // First try a few iterations of Newton's method -- normally very fast.
            for (t2 = x, i = 0; i < 8; i++) {
                x2 = sampleCurveX(t2) - x
                if (Math.abs(x2) < epsilon) return t2
                d2 = sampleCurveDerivativeX(t2)
                if (Math.abs(d2) < 1e-6) break
                t2 = t2 - x2 / d2
            }

            // Fall back to the bisection method for reliability.
            t0 = 0.0
            t1 = 1.0
            t2 = x

            if (t2 < t0) return t0
            if (t2 > t1) return t1

            while (t0 < t1) {
                x2 = sampleCurveX(t2)
                if (Math.abs(x2 - x) < epsilon)  return t2
                if (x > x2) t0 = t2
                else t1 = t2
                t2 = (t1 - t0) * .5 + t0
            }

            // Failure.
            return t2
        }

        var solve = function (x, epsilon) {
            return sampleCurveY(solveCurveX(x, epsilon))
        }

        this.sampleCurveX = sampleCurveX
        this.sampleCurveY = sampleCurveY
        this.sampleCurveDerivativeX = sampleCurveDerivativeX
        this.solveCurveX = solveCurveX
        this.solve = solve

        return this
    }

    var doEachIfElem = function (elem, fn) {
        if (elem) return jaskell.each(elem, fn)
        else return function (elem) {
            return jaskell.each(elem, fn)
        }
    }

    var _ = {
        configuration: {
            stepTime: 10
        },
        select: {
            id: document.getElementById.bind(document),
            one: document.querySelector.bind(document),
            all: document.querySelectorAll.bind(document),
            class: document.getElementsByClassName.bind(document),
            tag: document.getElementsByTagName.bind(document),
            name: document.getElementsByName.bind(document)
        },
        append: function (val, elem) {
            var append = function (o) {
                o.innerHTML += val;
                return o
            }
            return doEachIfElem(elem, append)
        },
        class: {
            add: function (/* ...vals, elem */) {
                var args = jaskell.toArray(arguments)
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
            },
            remove: function (/* ...vals, elem */) {
                var args = jaskell.toArray(arguments)
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
        },
        transition: {
            bezier: function (bezier, prop, start, end, duration, callback, elem) {
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
                bezier = new UnitBezier(bezier[0], bezier[1], bezier[2], bezier[3])
                var transition = function (elem) {
                    if (start == null) start = elem[prop]
                    var stepVal = _.configuration.stepTime / duration
                    var max = duration / _.configuration.stepTime
                    var steps = [start]
                    for (var i = 0; i < max; i++) {
                        // TODO: Pick epsilon based on magnitude/steps/or something?
                        var solution = bezier.solve(stepVal * i, .001)
                        steps.push(Math.round(solution * (end - start) + start))
                    }
                    var step = 0
                    var timer = setInterval(function () {
                        if (!steps[step]) {
                            clearTimeout(timer)
                            elem[prop] = end
                        } else {
                            // Do not force the browser to handle unnecessary assignments
                            if (elem[prop] != steps[step]) elem[prop] = steps[step]
                        }
                        step++
                    }, _.configuration.stepTime)
                    return elem
                }
                return doEachIfElem(elem, transition)
            }
        },
        style: {
            css: function(styles, elem) {
                var css = function (elem) {
                    for (var style in styles) {
                        elem.style[style] = styles[style]
                    }
                    return elem
                }
                return doEachIfElem(elem, css)
            },
            animate: function(style, start, end, duration, callback, elem) {
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
                var animate = function (elem) {
                    var durSec = duration / 1000
                    if(start != null) elem.style[style] = start
                    elem.style['transition'] = style + ' ' + durSec + 's'
                    elem.style[style] = end
                    var callElem = callback.curry(elem)
                    setTimeout(callElem, duration)
                    return elem
                }
                return doEachIfElem(elem, animate)
            },
            reset: function (elem) {
                console.log('resetting',elem)
                var reset = function (elem) {
                    elem.removeAttribute('style')
                    return elem
                }
                return doEachIfElem(elem, reset)
            }
        },
        event: {
            listen: function (type, handler, elem) {
                var listen = function (elem) {
                    elem.addEventListener(type, handler, false)
                    return elem
                }
                return doEachIfElem(elem, listen)
            },
            capture: function (type, handler, elem) {
                var capture = function (elem) {
                    elem.addEventListener(type, handler, true)
                    return elem
                }
                return doEachIfElem(elem, capture)
            },
            watch: function (type, handler, target) {
            },
            list: {},
            create: function (name, bubbles, cancelable, detail) {
                var options = {}
                options.bubbles = bubbles === undefined ? true : bubbles
                options.cancelable = cancelable === undefined ? true : cancelable
                _.event.list[name] = function () {
                    if (detail) options.detail = detail()
                    return new CustomEvent(name, options)
                }
            },
            trigger: function (event, elem) {
                var trigger = function (elem) {
                    var evt = _.event.list[event]
                    if (evt) elem.dispatchEvent(evt())
                    else elem.dispatchEvent(_.event.create(event)())
                    return elem
                }
                return doEachIfElem(elem, trigger)
            }
        },
        request: {
            create: function (method, url, headers, callback) {
                var defaultHeaders = {
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
                }
                if (jaskell.isFunction(headers)) {
                    callback = headers
                    headers = defaultHeaders
                }
                return function sender(data) {
                    var req = new XMLHttpRequest()
                    req.onload = function () {
                        callback(req.responseText, req.status)
                    }
                    req.open(method, url, true)
                    for (var prop in headers) {
                        req.setRequestHeader(prop, headers[prop])
                    }
                    req.send(data)
                }
            },
            json: {
                create: function (method, url, callback) {
                    return function sender(data) {
                        var req = new XMLHttpRequest()
                        req.onload = function () {
                            callback(req.responseText, req.status)
                        }
                        req.open(method, url, true)
                        req.setRequestHeader("Content-Type", "application/json")
                        req.send(JSON.stringify(data))
                    }
                }
            }
        },
        log: function (message, elem) {
            var log = function (elem) {
                console.log(message, elem)
                return elem
            }
            if (elem) return log(elem)
            else return log
        }
    }
    return _
}

 //---------------------------------------------------------------------------
// Ehancements & Shortcuts ----------------------------------------------------

jaskell.using(jaskell.html.transition, function write(_) {
    _.linear = _.bezier.curry([0, 0, 1, 1])
    _.easeOut = _.bezier.curry([0, 0, 0.58, 1])
    _.easeInOut = _.bezier.curry([0.42, 0, 0.58, 1])
    _.easeIn = _.bezier.curry([0.42, 0, 1, 1])
})

jaskell.each([jaskell.html.request, jaskell.html.request.json], function write(_) {
    _.get = _.create.curry('get')
    _.post = _.create.curry('post')
    _.put = _.create.curry('put')
    _.delete = _.create.curry('delete')
})


//---------------------------------------------------------------------------
// Samples & Tests ------------------------------------------------------------

jaskell.using(jaskell, jaskell.html, function operations(_, $) {

    console.log(0)

    var iterator = 0;
    $.event.create('test', true, true, function () {
        return {date: new Date(), iteration: iterator++}
    })
    $.append('!', $.select.id('test-pane'))

    console.log(1)

    var append123 = _.sequence(
        $.select.class,
        $.append('1'),
        $.append('2'),
        $.append('3'),
        $.class.add('neat'),
        $.class.remove('test0')
    )

    console.log(2)

    $.class.remove('thing', $.select.class('test1'))

    console.log(3)

    _.sequence(
        $.select.class('neat'),
        $.class.remove('est'),
        $.class.add('woah','dude'),
        $.event.capture('click', function (event) {
            event.preventDefault()
            _.using(event.currentTarget, _.sequence(
                $.append('..'),
                $.append('?'),
                $.log('appending')
            ))
        }),
        $.append('...'),
        $.select.class('test5'),
        $.append('???'),
        $.event.capture('click', function () {
            $.event.trigger('test', document.body)
        })
    )

    console.log(4)

    $.event.capture('test', function (event) {
        console.log(event.detail)
    }, document.body)


    console.log(5)

    _.sequence(
        $.select.tag('button'),
        $.append(' Button'),
        $.event.capture('click', function (event) {
            event.preventDefault()
            append123('test0')

            $.style.animate('color', '#fff', '#000', 5000,
                $.style.animate('color', '#000', '#fff', 3000,
                    $.style.reset), $.select.class('neat'))
        })
    )

    console.log(6)

    _.sequence(
        (function (a,b) {
            return function () {
                return function () { return a + b }
            }
        })(10,20),
        (function(a,b) {
            return function (ab) {
                var result = a + b + ab()
                console.log('test result is',result)
                return result
            }
        })(10,20)
    )()

    console.log(7)

    var url = '/sandbox/log'
    var contentHeader = { "Content-Type": "application/json" }
    var callback = function(response, status) {
        console.log('Result is', response, 'with status', status)
    }
    var data = {test:'test'}

    // All are equivalent
    data.test = 'test1'
    var sendReq1 = $.request.create('post', url, contentHeader, callback)
    sendReq1(JSON.stringify(data))

    data.test = 'test2'
    var sendReq2 = $.request.post(url, contentHeader, callback)
    sendReq2(JSON.stringify(data))

    data.test = 'test3'
    var sendReq3 = $.request.json.create('post', url, callback)
    sendReq3(data)

    data.test = 'test4'
    var sendReq4 = $.request.json.post(url, callback)
    sendReq4(data)

    console.log(8)

    $.style.css({
        "background-color": "#123",
        "border": "1px solid #666",
        "border-radius": "5px",
        "padding": "5px",
        "margin": "5px"
    }, $.select.class('test4'))

    console.log(9)

    $.event.capture('click', function() {
        $.transition.easeInOut('scrollTop', 0, 500, $.select.class('sandbox-preview'))
    }, $.select.class('test0'))
})