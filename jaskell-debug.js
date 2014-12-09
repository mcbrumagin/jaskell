 //---------------------------------------------------------------------------
// Development & Testing Helpers ----------------------------------------------

jaskell.debug = new function () {

    let _ = {}
    _.test = {}
    _.test.suite = function (name, ...cases) {
        let successful = 0
        let failed = 0
        for (let fn of cases) {
            let result = fn()
            result.success ? successful++ : failed++
        }
        let total = successful + failed
        /*console.info(`Test suite ${name} complete. Results are:
         Total: ${total}`)
         console.log(`Successful: ${successful}`)
         console.error(`Failed: ${failed}`)*/
        console.info('Test suite: ' + name + ' is complete.\n Total test cases: ' + total)
        if (failed > 0) {
            console.log('Successful: ' + successful)
            console.warn('Failed: ' + failed)
        } else console.log('All tests passed!')
    }

    _.test.run = function (fn) {
        const stepFailed = 'Test step failed.'
        // TODO: Result object with step prototype
        let result = new function () {
            this.success = true
            this.output = null
            this.step = function () {
                if(!this.success) throw new Error(stepFailed)
            }
        }
        try {
            result.output = fn()
            let message = fn.name ? 'Success: ' + fn.name : 'Success'
            console.info(message)
            return result
        } catch (exception) {
            if (exception.message === stepFailed) exception.stack = ''
            let message = 'Failure: ' + fn.name + ' Exception is:\n'
                + exception.message + '\n' + exception.stack
            console.error(message)
            result.success = false
            return result
        }
    }

    _.test.case = fn => () => jaskell.debug.test.run(fn)

    _.assert = {}
    _.assert.equal = function (expected, actual) {
        var equal = function (actual) {
            var message = 'Expected ' + expected + ' but got ' + actual
            if (JSON.stringify(expected) !== JSON.stringify(actual))
                throw new Error(message)
            else return actual
        }
        if (actual === undefined) return equal
        else return equal(actual)
    }

    _.assert.error = function (fn, ...inputs) {
        try {
            var result = fn(...inputs)
            var message = 'Expected an exception, but got ' + result
        } catch (exc) {}
        if (message !== undefined) throw new Error(message)
    }

    _.assert.contains = function (set, value) {}
    _.assert.empty = function (object) {}

    _.timeIt = function(fn) {
        return function(...args) {
            var start = new Date().getTime()
            console.log('Started at: ' + start)
            var result = fn.apply(this, args)
            var end = new Date().getTime()
            console.log('Ended at: ' + end)
            var total = end - start
            console.log(fn.name + ' time taken: ' + total)
            return result
        }
    }

    return _
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
