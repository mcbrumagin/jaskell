 //---------------------------------------------------------------------------
// Samples & Tests ------------------------------------------------------------

var assertion1 = null
var assertion2 = null
jaskell.mixin(jaskell, jaskell.html, jaskell.debug, function main(_) {

    var append123 = null
    _.timeIt(_.test.suite.curry('Main',
        _.test.case(function createCustomEvent() {
            let i = 0
            _.event.create('test', true, true, function () {
                return {date: new Date(), iteration: i++}
            })
        }),
        _.test.case(function testAppend() {
            _.append('!', _.select.byId('test-pane'))
        }),
        _.test.case(function createAppend123Sequence() {
            append123 = _.sequence(
                _.append('123'),
                _.classes.add('neat'),
                _.classes.remove('test0')
            )
        }),
        _.test.case(function removeThingFromTest1() {
            _.classes.remove('thing', _.select.byClass('test1'))
        }),
        _.test.case(function neatSequence() {
            let j = 0
            _.sequence(
                _.select.byClass('neat'),
                _.classes.remove('est'),
                _.classes.add('woah','dude'),
                _.event.capture('click', _.sequence(
                    _.event.prevent,
                    evt => evt.currentTarget,
                    _.append(j++) // TODO: Try binding, or create custom runBefore function?
                )),
                _.append(' oh wow '),
                _.select.byClass('test5'),
                _.append(' select in the middle of a sequence'),
                _.event.capture('click', () => _.event.trigger('test', document.body))
            )() // TODO: immediately invoked sequence (like compose and nest)
        }),
        _.test.case(function captureTestEvent() {
            _.event.capture('test', evt => console.log(evt.detail), document.body)
        }),
        _.test.case(function buttonSequence() {
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
            )() // TODO: immediately invoked sequence (like compose and nest)
        }),
        _.test.case(_.sequence(
            ((a,b) => () => () => a + b)(10,20),
            ((c,d) => (ab) => c + d + ab())(30,40),
            _.assert.equal(100),
            _.log('test sequence result')
        )),
        _.test.case(function testSequence1() {
            _.assert.error(_.sequence(
                ((a,b) => () => () => a + b)(10,20),
                ((c,d) => (ab) => c + d + ab())(30,40),
                _.assert.equal(110)
            ))
        }),
        _.test.case(_.compose(
            _.log('test composition result'),
            _.assert.equal(100),
            ((c,d) => (ab) => c + d + ab())(30,40),
            ((a,b) => () => () => a + b)(10,20)
        )),
        _.test.case(function testRequests() {
            let url = '/sandbox/log'
            let contentHeader = { "Content-Type": "application/json" }
            let data = {test:'test'}
            let callback = (r,s) => _.test.case(() => _.assert.equal(JSON.stringify(data),r) && _.assert.equal(200,s))

            let sendReq1 = _.request.create('post', url, contentHeader, callback)
            sendReq1(JSON.stringify(data))

            let sendReq2 = _.request.post(url, contentHeader, callback)
            sendReq2(JSON.stringify(data))

            let sendReq3 = _.request.json.create('post', url, callback)
            sendReq3(data)

            let sendReq4 = _.request.json.post(url, callback)
            sendReq4(data) // TODO: Create function to receive json from callback
        }),
        _.test.case(function testCss() {
            _.style.css({
                backgroundColor: "#123",
                border: "1px solid #666",
                borderRadius: "5px",
                padding: "5px",
                margin: "5px"
            }, _.select.byClass('test4'))
        }),
        _.test.case(function testTransitions() {
            _.event.capture('click', function() {
                _.transition.easeInOut('scrollTop', 0, 500, _.select.byClass('sandbox-preview'))
            }, _.select.byClass('test0'))

            _.event.capture('click', function() {
                _.transition.bezier([0.42, -0.1, 0.58, 1.1], 'offsetHeight', 500, 2000, _.select.byId('height-test'))
            }, _.select.byClass('test1'))
        }),
        _.test.case(function testFibonacci() {
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
        }),
        _.test.case(function testLazyRange() {
            let evens = new _.lazyRange(0,2)
            for (let n in evens) {
                console.log(n)
                if (isNaN(n)) break
                if (n > 50) break
                if (n.value && n.value > 50) break
            }

            console.log('start',evens.first)

            _.test.run(_.sequence(
                evens.take(5),
                _.assert.equal([0,2,4,6,8])
            )).step()

            //console.log(evens.next())

            _.test.run(_.sequence(
                evens.takeTill(10),
                _.assert.equal([0,2,4,6,8])
            )).step()

            _.test.run(_.sequence(
                evens.takeThrough(10),
                _.assert.equal([0,2,4,6,8,10])
            )).step()

            console.log('done')
        })
    ))()

    assertion1 = _.test.case.curry(_.assert.equal.curry([1,2,3,4,5,6,7,8,9,10]))
    assertion2 = _.test.case.curry(_.assert.equal.curry([0,2,4,6,8,10]))
    _.test.suite('Range',
        assertion1(_.range(1,1,10)),
        assertion1(_.range(1,10)),
        assertion1(_.range('1..10')),
        assertion1(_.range('1,2..10')),
        assertion2(_.range(0,2,10)),
        assertion2(_.range('0,2..10')),
        assertion2(_.range('0..8,10')),
        assertion2(_.range('..8,10')),
        assertion1(_.range(1,1,'..').take(10)),
        assertion1(_.range(1,'..').take(10)),
        assertion1(_.range('1..').take(10)),
        assertion1(_.range('1,2..').take(10)),
        assertion2(_.range(0,2,'..').take(6)),
        assertion2(_.range('0,2..').take(6))
    )
})
