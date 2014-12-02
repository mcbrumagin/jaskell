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

    _.isArray = function (obj) {
        return Object.prototype.toString.call(obj) === '[object Array]'
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

    _.include = function (context, ...names) {
        var propNames = []
        for (var name of names) {
            for (var prop in name) {
                if (context[prop]) console.warn('Overwriting property',prop)
                context[prop] = name[prop]
                propNames.push(prop)
            }
        }
        var contextName = context.name ? context.name : context.toString()
        console.info('Declaring names', propNames.join(', '), 'in context', contextName)
        return context
    }

    _.mixin = function (/* ...names, operation */) {
        let args = _.toArray(arguments)
        let names = args.slice(0, args.length - 1)
        let operation = args[args.length - 1]
        let mix = op => op(_.include({name:"mixin"}, ...names))
        if (!_.isFunction(operation)) {
            names = args
            return mix
        } else return mix(operation)
    }

    _.sequence = function (...fns) {
        if (!_.isFunction(fns[0])) var returnNow = true
        let i = -1
        while (++i < fns.length) {
            if (!_.isFunction(fns[i])) {
                let val = fns[i]
                fns[i] = () => val
            }
        }
        let sequence = function () {
            let i = -1
            let args = _.toArray(arguments)
            while (++i < fns.length) args = [fns[i].apply(this, args)]
            return args.length === 1 ? args[0] : args
        }
        if (returnNow) return sequence()
        else return sequence
    }

    _.compose = function (...fns) {
        if (!_.isFunction(fns[0])) var returnNow = true
        let i = fns.length
        while (i-- > 0) {
            if (!_.isFunction(fns[i])) {
                let val = fns[i]
                fns[i] = () => val
            }
        }
        let compose = function () {
            let i = fns.length
            let args = _.toArray(arguments)
            while (i-- > 0) args = [fns[i].apply(this, args)]
            return args.length === 1 ? args[0] : args
        }
        if (returnNow) return compose()
        else return compose
    }

    // The functions should accept just a callback and return a function that accepts a target
    // Ideally, the functions should also accept a callback and target simultaneously
    _.nest = function (...fns) {
        let i = fns.length - 1
        let args = [fns[fns.length - 1]]
        while (i-- > 0) args = [fns[i].apply(this, args)]
        return args.length === 1 ? args[0] : args
    }

    function LazyRange(first, second) {
        this.first = first
        this.second = second
    }
    LazyRange.prototype.__iterator__ = function() {
        for (var i = this.first; i < 1000; i += this.second) yield i
    }
    LazyRange.prototype.take = function (amount) {
        let array = [], i = -1
        for (let n in this) {
            if (++i > amount) break
            array.push(n)
        }
        return array
    }
    LazyRange.prototype.takeTill = function (maximum) {
        let array = []
        for (let n in this) {
            if (n > maximum) break
            else array.push(n)
        }
        return array
    }
    _.lazyRange = LazyRange

    // Examples
    // (1,1,10), (`1,2..10`), (1,10), (`1..10`), (10), (`..10`) == [1,2,3,4,5,6,7,8,9,10]
    // (1,1,Infinity), (`1,2..`), (1,Infinity), (`1..`) -> infinite list from 1 to n
    // (Infinity), (`..`) -> infinite list from 0 to n
    _.range = function (start, step, end) {
        /*if (start.length) {
         // TODO, remove whitespace
         [start, end] = start.split('..')
         if (end === undefined) throw new Error('Expecting a \'..\' in expression.')
         if (start === '') {
         start = 0
         let frags = end.split(',')
         if (!frags.length || frags.length > 2) throw new Error()
         if (frags.length === 1) {
         step = 1
         end = Number(frags[0])
         } else {
         end = Number(frags[1])
         let secondToLast = Number(frags[0])
         if (Math.abs(secondToLast) > Math.abs(end)) throw new Error()
         step = end - secondToLast
         }
         } else if (end === '') {
         let frags = start.split(',')
         if (!frags.length || frags.length > 2) throw new Error()
         if (frags.length === 1) {
         start = Number(frags[0])
         step = 1
         end = Infinity
         if (start < 0) {
         step *= -1
         end *= -1
         }
         } else {
         start = Number(frags[1])
         let second = Number(frags[0])
         step = second - start
         end = second > start ? Infinity : -Infinity
         }
         } else {
         let frags = start.split(',')
         if (frags.length > 1) {
         start = Number(frags[0])
         let second = Number(frags[1])
         step = second - start
         end = Number(end)
         } else {
         frags = end.split(',')
         if (frags.length > 1) {
         start = Number(frags[0])
         let second = Number(frags[1])
         step = second - start
         end = Number(end)
         } else {
         start = Number(start)
         end = Number(end)
         step = end > start ? 1 : -1
         }
         }
         }
         }*/
        if (end === undefined) {
            if (step !== undefined) end = step, step = start < step ? 1 : -1
            else end = start, step = start < 0 ? -1 : 1, start = 0
        }
        var array = []
        if (isFinite(end)) {
            for (let i = start; i < end; i = i + step) array.push(i)
            return array
        } else {
            return _.lazyRange(start,step)
        }
    }

    return _
}


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
        var solveCurveX = function (x, epsilon) {

            // First try Newton's method
            for (var t2 = x, i = 0; i < 4; i++) {
                var x2 = curveX(t2) - x
                if (Math.abs(x2) < epsilon) return t2
                var d2 = curveDerivativeX(t2)
                if (Math.abs(d2) < 1e-6) break
                t2 = t2 - x2 / d2
            }

            // Fall back to the bisection method
            if (x < 0) return 0
            else return 1
        }

        var solve = (x, epsilon) => curveY(solveCurveX(x, epsilon))

        return solve
    }

    var doEachIfElem = function (elem, fn) {
        if (elem) return jaskell.each(elem, fn)
        else return elem => jaskell.each(elem, fn)
    }

    var _ = {
        select: {
            byId: document.getElementById.bind(document),
            one: document.querySelector.bind(document),
            all: document.querySelectorAll.bind(document),
            byClass: document.getElementsByClassName.bind(document),
            byTag: document.getElementsByTagName.bind(document),
            byName: document.getElementsByName.bind(document)
        },
        append: function (val, elem) {
            var append = function (elem) {
                elem.innerHTML += val
                return elem
            }
            return doEachIfElem(elem, append)
        },
        classes: {
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
                bezier = new UnitBezier(...bezier)
                var transition = function (elem) {
                    if (start == null) start = elem[prop]
                    var startTime = Date.now()
                    var update = function() {
                        var elapsed = Date.now() - startTime
                        if (elapsed > duration) {
                            elem[prop] = end
                        } else {
                            var solution = bezier(elapsed / duration, .001)
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
            animate: {
                bezier: function(bezier, style, start, end, duration, callback, elem) {
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
            },
            reset: function (/* ...props, elem */) {
                var args = jaskell.toArray(arguments)
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
        },
        event: {
            prevent: function (event) {
                event.preventDefault()
                return event
            },
            stop: function (event) {
                event.stopPropagation()
                return event
            },
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
                    req.onload = () => callback(req.responseText, req.status)
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
                        req.onload = () => callback(req.responseText, req.status)
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
// Development & Testing Helpers ----------------------------------------------

jaskell.debug = {
    test: function (fn) {
        try {
            fn()
            let message = fn.name ? 'Success: ' + fn.name : 'Success'
            console.info(message)
        } catch (exception) {
            console.error('Failure:', fn.name, '. Exception is:')
            console.error(exception.message)
            console.error(exception.stack)
        }
    },
    assert: {
        equal: function (expected, actual) {
            var equal = function (actual) {
                var message = 'Expected ' + expected + ' but got ' + actual
                if (expected !== actual) throw new Error(message)
                else return actual
            }
            if (actual === undefined) return equal
            else return equal(actual)
        },
        contains: function (set, value) {

        },
        empty: function (object) {

        },
        error: function (fn, ...inputs) {
            try {
                var result = fn(...inputs)
                var message = 'Expected an exception, but got ' + result
            } catch (exc) {}
            if (message !== undefined) throw new Error(message)
        }
    }
}


//---------------------------------------------------------------------------
// Ehancements & Shortcuts ----------------------------------------------------

jaskell.using(jaskell.html.transition, function write(_) {
    _.linear = _.bezier.curry([0, 0, 1, 1])
    _.easeIn = _.bezier.curry([0.42, 0, 1, 1])
    _.easeOut = _.bezier.curry([0, 0, 0.58, 1])
    _.easeInOut = _.bezier.curry([0.42, 0, 0.58, 1])
})

jaskell.using(jaskell.html.style.animate, function write(_) {
    _.linear = _.bezier.curry('linear')
    _.ease = _.bezier.curry('ease')
    _.easeIn = _.bezier.curry('ease-in')
    _.easeOut = _.bezier.curry('ease-out')
    _.easeInOut = _.bezier.curry('ease-in-out')
})

jaskell.each([jaskell.html.request, jaskell.html.request.json], function write(_) {
    _.get = _.create.curry('get')
    _.post = _.create.curry('post')
    _.put = _.create.curry('put')
    _.delete = _.create.curry('delete')
})


//---------------------------------------------------------------------------
// Samples & Tests ------------------------------------------------------------

jaskell.mixin(jaskell, jaskell.html, jaskell.debug, function main(_) {

    _.test(function createCustomEvent() {
        let i = 0
        _.event.create('test', true, true, function () {
            return {date: new Date(), iteration: i++}
        })
    })

    _.test(function testAppend() {
        _.append('!', _.select.byId('test-pane'))
    })

    var append123 = null
    _.test(function createAppend123Sequence() {
        append123 = _.sequence(
            _.append('123'),
            _.classes.add('neat'),
            _.classes.remove('test0')
        )
    })

    _.test(function removeThingFromTest1() {
        _.classes.remove('thing', _.select.byClass('test1'))
    })

    _.test(function neatSequence() {
        let j = 0
        _.sequence(
            _.select.byClass('neat'),
            _.classes.remove('est'),
            _.classes.add('woah','dude'),
            _.event.capture('click', _.sequence(
                _.event.prevent,
                    evt => evt.currentTarget,
                _.append(j++)
            )),
            _.append(' oh wow '),
            _.select.byClass('test5'),
            _.append(' select in the middle of a sequence'),
            _.event.capture('click', () => _.event.trigger('test', document.body))
        )
    })

    _.test(function captureTestEvent() {
        _.event.capture('test', evt => console.log(evt.detail), document.body)
    })

    _.test(function buttonSequence() {
        _.sequence(
            _.select.byTag('button'),
            _.append(' Button'),
            _.event.capture('click', _.sequence(
                _.event.prevent,
                _.select.byClass('test0'),
                append123,
                _.select.byClass('neat'),
                _.nest(
                    _.style.animate.ease('color', '#fff', '#000', 5000),
                    _.style.animate.ease('color', '#000', '#fff', 3000),
                    _.style.reset('color', 'transition') )
            ))
        )
    })

    _.test(_.sequence(
        ((a,b) => () => () => a + b)(10,20),
        ((c,d) => (ab) => c + d + ab())(30,40),
        _.assert.equal(100),
        _.log('test sequence result')
    ))

    _.test(function testSequence1() {
        _.assert.error(_.sequence(
            ((a,b) => () => () => a + b)(10,20),
            ((c,d) => (ab) => c + d + ab())(30,40),
            _.assert.equal(110)
        ))
    })

    _.test(_.compose(
        _.log('test composition result'),
        _.assert.equal(100),
        ((c,d) => (ab) => c + d + ab())(30,40),
        ((a,b) => () => () => a + b)(10,20)
    ))

    _.test(function testRequests() {
        var url = '/sandbox/log'
        var contentHeader = { "Content-Type": "application/json" }
        var data = {test:'test'}
        var callback = (r,s) => _.test(() => _.assert.equal(JSON.stringify(data),r) && _.assert.equal(200,s))

        var sendReq1 = _.request.create('post', url, contentHeader, callback)
        sendReq1(JSON.stringify(data))

        var sendReq2 = _.request.post(url, contentHeader, callback)
        sendReq2(JSON.stringify(data))

        var sendReq3 = _.request.json.create('post', url, callback)
        sendReq3(data)

        var sendReq4 = _.request.json.post(url, callback)
        sendReq4(data)
    })

    _.test(function testCss() {
        _.style.css({
            "background-color": "#123",
            "border": "1px solid #666",
            "border-radius": "5px",
            "padding": "5px",
            "margin": "5px"
        }, _.select.byClass('test4'))
    })

    _.test(function testTransitions() {
        _.event.capture('click', function() {
            _.transition.easeInOut('scrollTop', 0, 500, _.select.byClass('sandbox-preview'))
        }, _.select.byClass('test0'))

        _.event.capture('click', function() {
            _.transition.bezier([0.42, -0.1, 0.58, 1.1], 'offsetHeight', 500, 2000, _.select.byId('height-test'))
        }, _.select.byClass('test1'))
    })

    _.test(function testFibonacci() {
        function* fibonacci() {
            let [prev, curr] = [0, 1];
            for (;;) {
                [prev, curr] = [curr, prev + curr];
                yield curr;
            }
        }

        for (let n of fibonacci()) {
            // truncate the sequence at 1000
            if (n > 1000)
                break;
            console.log(n);
        }
    })

    _.test(function testLazyRange() {
        let evens = new _.lazyRange(0,2)
        for (let n in evens) {
            console.log(n)
            if (isNaN(n)) break
            if (n > 50) break
            if (n.value && n.value > 50) break
        }

        console.log('start',evens.first)

        _.test(function take() {
            console.log(evens.take(10))
        })

        //console.log(evens.next())

        _.test(function takeTill() {
            console.log(evens.takeTill(50))
        })

        console.log('done')
    })
})
