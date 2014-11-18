// TODO: Wrap in jaskell function
//   refactor to use private methods (should cut 25-50% of code)
// TODO: Import other jaskell functions
//   refactor to have core jaskell script and jaskell-html separately


 //---------------------------------------------------------------------------
// Core Jaskell Functions -----------------------------------------------------

Function.prototype.curry = function () {
    var f = this
    var a = toArray(arguments)
    return function curried() {
        return f.apply(this, a.concat(toArray(arguments)))
    }
}

var isFunction = function (obj) {
    return {}.toString.call(obj) === '[object Function]'
}

var toArray = function (args) {
    return Array.prototype.slice.call(args)
}

var each = function (objs, fn) {
    if (objs.length) {
        var results = []
        for (var i = 0; i < objs.length; i++) {
            results.push(fn(objs[i]))
        }
        return results
    } else return fn(objs)
}

var using = function (/* ...names, operation */) {
    var args = toArray(arguments)
    var ind = args.length - 1
    var names = args.slice(0, ind)
    var operation = args[ind]
    return operation.apply(this, names)
}

var sequence = function (/* ...operations */) {
    var fns = arguments,
        l = arguments.length
    var seq = function () {
        var i = -1
        var args = toArray(arguments)
        while (i++ < l - 1) {
            if (!isFunction(fns[i])) {
                var val = fns[i]
                fns[i] = function () {
                    return val
                }
            }
            args = [fns[i].apply(this, args)]
        }
        return args[0]
    }
    if (!isFunction(fns[0])) return seq()
    else return seq
}


 //---------------------------------------------------------------------------
// Jaskell Html ---------------------------------------------------------------

var html = {
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
        if (elem) return each(elem, append)
        else return function (elem) {
            return each(elem, append)
        }
    },
    class: {
        add: function (/* ...vals, elem */) {
            var args = toArray(arguments)
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
            if (elem) return each(elem, add)
            else return function (elem) {
                return each(elem, add)
            }
        },
        remove: function (/* ...vals, elem */) {
            var args = toArray(arguments)
            var ind = args.length - 1
            if (args[ind].toString() === '[object HTMLCollection]') {
                var vals = args.slice(0, ind)
                var elem = args[ind]
            } else vals = args.slice(0)
            var rmv = function (elem) {
                for (var i = 0; i < vals.length; i++) {
                    elem.className.replace(vals[i], '')
                    elem.className.trim()
                }
                return elem
            }
            if (elem) return each(elem, rmv)
            else return function (elem) {
                return each(elem, rmv)
            }
        }
    },
    event: {
        listen: function (type, handler, elem) {
            var bind = function (elem) {
                elem.addEventListener(type, handler, false)
                return elem
            }
            if (elem) return each(elem, bind)
            else return function (elem) {
                return each(elem, bind)
            }
        },
        capture: function (type, handler, elem) {
            var bind = function (elem) {
                elem.addEventListener(type, handler, true)
                return elem
            }
            if (elem) return each(elem, bind)
            else return function (elem) {
                return each(elem, bind)
            }
        },
        watch: function (type, handler, target) {
        },
        list: {},
        create: function (name, bubbles, cancelable, detail) {
            var options = {}
            options.bubbles = bubbles === undefined ? true : bubbles
            options.cancelable = cancelable === undefined ? true : cancelable
            html.event.list[name] = function () {
                if (detail) options.detail = detail()
                return new CustomEvent(name, options)
            }
        },
        trigger: function (event, elem) {
            var trigger = function (elem) {
                var evt = html.event.list[event]
                if (evt) elem.dispatchEvent(evt())
                else elem.dispatchEvent(html.event.create(event)())
                return elem
            }
            if (elem) return each(elem, trigger)
            else return function (elem) {
                return each(elem, trigger)
            }
        }
    },
    request: {
        create: function (method, url, headers, callback) {
            var defaultHeaders = {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
            }
            if (isFunction(headers)) {
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


 //---------------------------------------------------------------------------
// Ehancements & Shortcuts ----------------------------------------------------

each([html.request, html.request.json], function write(_) {
    _.get = _.create.curry('get')
    _.post = _.create.curry('post')
    _.put = _.create.curry('put')
    _.delete = _.create.curry('delete')
})


 //---------------------------------------------------------------------------
// Samples & Tests ------------------------------------------------------------

using(html, function operations(_) {

    var iterator = 0;
    _.event.create('test', true, true, function () {
        return {date: new Date(), iteration: iterator++}
    })
    _.append('!', _.select.id('test-pane'))

    var append123 = sequence(
        _.select.class,
        _.append('1'),
        _.append('2'),
        _.append('3'),
        _.class.add('neat'),
        _.class.remove('test0')
    )

    _.class.remove('thing', _.select.class('test1'))

    sequence(
        _.select.class('neat'),
        _.class.remove('est'),
        _.class.add('woah','dude'),
        _.event.capture('click', function (event) {
            event.preventDefault()
            using(event.currentTarget, sequence(
                _.append('..'),
                _.append('?'),
                _.log('appending')
            ))
        }),
        _.append('...'),
        _.select.class('test5'),
        _.append('???'),
        _.event.capture('click', function () {
            _.event.trigger('test', document.body)
        })
    )

    _.event.capture('test', function (event) {
        console.log(event.detail)
    }, document.body)

    sequence(
        _.select.tag('button'),
        _.append(' Button'),
        _.event.capture('click', function (event) {
            event.preventDefault()
            alert('neat')
            append123('test0')
        })
    )

    sequence(
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

    /*_.request.get({}, '/sandbox/test', {test:'test'}, function (res) {
        console.log(res.slice(0, 50).concat('...'))
    })*/

    /*_.request.post({"Content-Type": "application/json"},'/sandbox/log', {test:'test'}, function (res, status) {
        console.log('Result:', status)
    })*/

    /*_.request.send({test:'test'}, function(response, status) {
        console.log('Result is', response, 'with status', status)
    }, _.request.create('post','/sandbox/log',{"Content-Type": "application/json"}))
    */

    // All are equivalent
    _.request.create(
        'post', '/sandbox/log', {
            "Content-Type": "application/json"
        }, function(response, status) {
            console.log('Result is', response, 'with status', status)
        })(JSON.stringify({test:'test1'}))

    _.request.post('/sandbox/log', {
            "Content-Type": "application/json"
        }, function(response, status) {
            console.log('Result is', response, 'with status', status)
        })(JSON.stringify({test:'test2'}))

    _.request.json.create(
        'post', '/sandbox/log', function(response, status) {
            console.log('Result is', response, 'with status', status)
        })({test:'test3'})

    _.request.json.post('/sandbox/log', function(response, status) {
            console.log('Result is', response, 'with status', status)
        })({test:'test4'})

    /*
    var netLog = _.request.create('post','/sandbox/log',{"Content-Type": "application/json"})
    var sender = _.request.send({test:'test'}, function(response, status) {
        console.log('Result is', response, 'with status', status)
    })

    sequence(netLog, sender)()
    */
})