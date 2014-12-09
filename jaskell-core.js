 //---------------------------------------------------------------------------
// Core Jaskell Functions -----------------------------------------------------

var jaskell = new function () {

    Function.prototype.curry = function (...args) {
        var f = this
        var a = args
        return (...args) => f.apply(this, a.concat(args))
    }

    var _ = {}

    _.isFunction = function (obj) {
        return {}.toString.call(obj) === '[object Function]'
    }

    _.isArray = function (obj) {
        return Object.prototype.toString.call(obj) === '[object Array]'
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

    _.using = function (...args /* ...names, operation */) {
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

    _.mixin = function (...args /* ...names, operation */) {
        let names = args.slice(0, args.length - 1)
        let operation = args[args.length - 1]
        let mix = op => op(_.include({name:"mixin"}, ...names))
        if (!_.isFunction(operation)) {
            names = args
            return mix
        } else return mix(operation)
    }

    _.sequence = function (...fns) {
        let i = -1
        while (++i < fns.length) {
            if (!_.isFunction(fns[i])) {
                let val = fns[i]
                fns[i] = () => val
            }
        }
        let sequence = function (...args) {
            let i = -1
            while (++i < fns.length) args = [fns[i].apply(this, args)]
            return args.length === 1 ? args[0] : args
        }
        return sequence
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
        let compose = function (...args) {
            let i = fns.length
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
            if (++i >= amount) break
            array.push(n)
        }
        return array
    }
    LazyRange.prototype.takeTill = function (maximum) {
        let array = []
        for (let n in this) {
            if (n >= maximum) break
            else array.push(n)
        }
        return array
    }
    LazyRange.prototype.takeThrough = function (maximum) {
        let array = []
        for (let n in this) {
            array.push(n)
            if (n >= maximum) break
        }
        return array
    }
    _.lazyRange = LazyRange

    // Examples
    // (1,1,10), (`1,2..10`), (1,10), (`1..10`), (10), (`..10`) == [1,2,3,4,5,6,7,8,9,10]
    // (1,1,Infinity), (`1,2..`), (1,Infinity), (`1..`) -> infinite list from 1 to n
    // (Infinity), (`..`) -> infinite list from 0 to n
    _.range = function (start, step, end) {
        if (start.length) {
            // TODO, remove whitespace
            [startString, endString] = start.split('..')
            let startFrags = startString.split(',')
            let endFrags = endString.split(',')
            if (endString === undefined) throw new Error('Expecting a \'..\' in expression.')
            if (startString === '') { // ..10, ..9,10, TODO: '..' -> lazyRange from 0 to Infinity
                start = 0
                if (!endFrags.length || endFrags.length > 2) throw new Error()
                if (endFrags.length === 1) { // ..10
                    step = 1
                    end = Number(endFrags[0])
                } else { // ..9,10
                    end = Number(endFrags[1])
                    let secondToLast = Number(endFrags[0])
                    if (Math.abs(secondToLast) > Math.abs(end)) throw new Error()
                    step = end - secondToLast
                }
            } else if (endString === '') { // 1.., 1,2.., ..
                if (!startFrags.length || startFrags.length > 2) throw new Error()
                if (startFrags.length === 1) { // 1..
                    start = Number(startFrags[0])
                    step = 1
                    end = Infinity
                    if (start < 0) {
                        step *= -1
                        end *= -1
                    }
                } else { // 1,2..
                    start = Number(startFrags[0])
                    let second = Number(startFrags[1])
                    step = second - start
                    end = second > start ? Infinity : -Infinity
                    console.log('Lazy Range:',start, step, end)
                }
            } else { // 1..10, 1,2..10, 1..9,10
                if (startFrags.length === 1 && endFrags.length === 1) { // 1..10
                    start = Number(startFrags[0])
                    step = 1
                    end = Number(endFrags[0])
                } else if (startFrags.length > 1 && endFrags.length === 1) { // 1,2..10
                    start = Number(startFrags[0])
                    step = Number(startFrags[1]) - start
                    end = Number(endFrags[0])
                } else if (startFrags.length === 1 && endFrags.length > 1) { // 1..9,10
                    start = Number(startFrags[0])
                    end = Number(endFrags[1])
                    step = end - Number(endFrags[0])
                } else {
                    throw new Error()
                }
            }
        }
        if (step == '..') {
            step = 1
            end = Infinity
        }
        if (end == '..') {
            end = Infinity * (step >= 0 ? 1 : -1)
            console.log('End..?',end)
        }
        if (end === undefined) {
            if (step !== undefined) end = step, step = start < step ? 1 : -1
            else end = start, step = start < 0 ? -1 : 1, start = 0
        }
        console.log('Range:',start, step, end)
        if (isFinite(end)) {
            let array = []
            for (let i = start; i <= end; i = i + step) array.push(i)
            return array
        } else {
            return new _.lazyRange(start,step)
        }
    }

    return _
}
