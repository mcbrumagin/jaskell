var FunctionGraph = function (originPercentX, originPercentY, 
                              xLength, yLength, canvas) {
    
    var c2D = canvas.getContext('2d')

    var pX = originPercentX / 100
    var pY = 1 - originPercentY / 100

    var x0 = 0
    var x1 = c2D.canvas.width
    var y0 = 0
    var y1 = c2D.canvas.height

    var pt = function(x, y) {
        console.log('creating point')
        return {
            x: x,
            y: y
        }
    }

    var setColor = function(r, g, b) {
        var colors = [r, g, b].join(',')
        c2D.strokeStyle = 'rgb(' + colors + ')'
    }

    var drawRawLine = function(p1, p2) {
        console.log('drawing raw line', p1, p2)
        c2D.beginPath()
        c2D.moveTo(p1.x, p1.y)
        c2D.lineTo(p2.x, p2.y)
        c2D.stroke()
    }

    var drawAxes = function() {
        setColor(0, 0, 0)
        drawRawLine(pt(x0, y1 * pY), pt(x1, y1 * pY))
        drawRawLine(pt(x1 * pX, y0), pt(x1 * pX, y1))
    }

    var transformPoint = function(p) {
        console.log('transforming point', p.x, p.y)
        return pt(
            (p.x + xLength * pX) * x1 / 2, (-p.y + yLength * pY) * y1 / 2)
    }

    var drawLine = function(p1, p2) {
        console.log('drawing line')
        drawRawLine(
            transformPoint(p1),
            transformPoint(p2))
    }

    var plot = function(xData, yData) {
        if (jaskell.isFunction(yData)) {
            for (var i = 1; i < xData.length; i++) {
                drawLine(
                    pt(xData[i - 1], yData(xData[i - 1])),
                    pt(xData[i], yData(xData[i])))
            }
        } else {
            for (var i = 1; i < xData.length; i++) {
                drawLine(
                    pt(xData[i - 1], yData[i - 1]),
                    pt(xData[i], yData[i]))
            }
        }
    }

    drawAxes()
    _ = {}
    _.drawLine = drawLine
    _.plot = plot
    return _
}