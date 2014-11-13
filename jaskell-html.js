var len = function(obj) {
    return obj ? obj.length : -1
}

function isFunction(f) {
    return {}.toString.call(f) === '[object Function]'
}

var toArray = function(args) {
    return Array.prototype.slice.call(args)
}

var sequence = function() {
    var fns = arguments,
        l = len(arguments)
    console.log(l)
    console.log(fns)
    var seq = function() {
        var i = -1
        var args = toArray(arguments)
        while (i++ < l - 1) {
            if (!isFunction(fns[i])) {
                var val = fns[i]
                fns[i] = function() {
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

// Util
var each = function(objs, fn) {
    console.log('For each: ')
    console.log(objs)
    if (objs.length) {
        var results = []
        for (var i = 0; i < objs.length; i++) {
            results.push(fn(objs[i]))
        }
        return results
    } else {
        return fn(objs)
    }
}

var html = {
    select: {
        id: document.getElementById.bind(document),
        one: document.querySelector.bind(document),
        all: document.querySelectorAll.bind(document),
        class: document.getElementsByClassName.bind(document),
        tag: document.getElementsByTagName.bind(document),
        name: document.getElementsByName.bind(document)
    },
    append: function(val, elem) {
        var append = function(o) {
            o.innerHTML += val;
            return o
        }
        if (!elem) return function(elem) {
            return each(elem, append)
        } else return each(elem, append)
    },
    class: {
        add: function(val, elem) {
                var add = function(o) {
                    var ind = o.className.indexOf(val)
                    if (ind > -1) return o
                    else {
                        var classes = o.className.split(' ').concat(val.split(' '))
                        var resultClasses = []
                        for (var i = 0; i < len(classes); i++) {
                            if (classes[i] != '') resultClasses.push(classes[i])
                        }
                        o.className = resultClasses.join(' ')
                    }
                    return o
                }
                if (!elem) return function(elem) {
                    return each(elem, add)
                } else return each(elem, add)
            },
            remove: function(val, elem) {
                var rem = function(o) {
                    var classes = o.className.split(' ')
                    var resultClasses = []
                    for (var i = 0; i < classes.length; i++) {
                        if (classes[i] != val && classes[i] != '') resultClasses.push(classes[i])
                    }
                    o.className = resultClasses.join(' ')
                    return o
                }
                if (!elem) return function(elem) {
                    return each(elem, rem)
                } else return each(elem, rem)
            }
    },
    event: {
        listen: function(type, handler, elem) {
            var bind = function(elem) {
                elem.addEventListener(type, handler, false)
                return elem
            }
            if (elem) return each(elem, bind)
            else return function(elem) {
                return each(elem, bind)
            }
        },
        capture: function(type, handler, elem) {
            var bind = function(elem) {
                elem.addEventListener(type, handler, true)
                return elem
            }
            if (elem) return each(elem, bind)
            else return function(elem) {
                return each(elem, bind)
            }
        },
        watch: function(type, handler, target) {}
    },
    log: function(message, elem) {
        var log = function(elem) {
            console.log(message, elem)
            return elem
        }
        if (elem) return log(elem)
        else return log
    }
}

var using = function(nameSpace, operations) {
    return operations(nameSpace)
}


using(html, function operations(_) {

    _.append('!', _.select.id('test-pane'))

    var append123 = sequence(
        _.select.class,
        _.append('1'),
        _.append('2'),
        _.append('3'),
        _.class.add('neat'),
        _.class.remove('test0'))

    _.class.remove('thing', _.select.class('test1'))
        //_.class.remove('test2', _.select.class('test2'))

    sequence(
        _.select.class('neat'),
        _.class.remove('est'),
        _.class.add('  woah     dude  '),
        _.event.capture('click', function(event) {
            event.preventDefault()
            using(event.currentTarget,
                sequence(
                    _.append('..'),
                    _.append('?'),
                    _.log('appending')
                ))
        }),
        _.append('...'),
        _.select.class('test5'),
        _.append('???'))

    sequence(
        _.select.tag('button'),
        _.append(' Button'),
        _.event.capture('click', function(event) {
            event.preventDefault()
            alert('neat')
            append123('test0')
        }))

});

/*
//jQuery euivalent
$(document).ready(function() {

    $('#test-pane').append('!')

    var append123 = function(sel) {
        $(sel)
            .append('1')
            .append('2')
            .append('3')
            .addClass('neat')
            .removeClass('test0')
    }

    $('.test1').removeClass('thing')

    $('.neat')
        .removeClass('est')
        .addClass('   woah    dude  ')
        .on('click', function(event) {
            event.preventDefault()
            $(event.currentTarget)
                .append('..')
                .append('?')
            console.log('appending', event.currentTarget)
        })
        .append('...')

    $('.test5').append('???')

    $('button')
        .append('Button')
        .on('click', function(event) {
            event.preventDefault()
            alert('neat')
            append123('.test0')
        })
})
*/