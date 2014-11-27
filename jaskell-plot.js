var FunctionGraph = function (
    originPercentX, originPercentY,
    xLength, yLength, colors, canvas) {
    
    var c2D = canvas.getContext('2d')

    var pX = originPercentX / 100
    var pY = 1 - originPercentY / 100
    
    var x1 = c2D.canvas.width
    var y1 = c2D.canvas.height

    var xmin = pX * xLength - xLength
    var xmax = xLength - pX * xLength
    var ymin = pY * yLength - yLength
    var ymax = yLength - pY * yLength

    var pt = function(x, y) {
        return { x: x, y: y }
    }

    var setColor = function(r, g, b) {
        var colors = [r, g, b].join(',')
        c2D.strokeStyle = 'rgb(' + colors + ')'
    }

    var drawRawLine = function(p1, p2) {
        c2D.beginPath()
        c2D.moveTo(p1.x, p1.y)
        c2D.lineTo(p2.x, p2.y)
        c2D.stroke()
    }

    var drawAxes = function() {
        drawRawLine(pt(0, y1 * pY), pt(x1, y1 * pY))
        drawRawLine(pt(x1 * pX, 0), pt(x1 * pX, y1))
    }

    var transformPoint = function(p) {
        return pt(
            (p.x + xLength * pX) * x1 / xLength,
            (-p.y + yLength * pY) * y1 / yLength)
    }

    var drawLine = function(p1, p2) {
        drawRawLine(
            transformPoint(p1),
            transformPoint(p2))
    }
    
    var plot = function(xData, yData) {
        if (jaskell.isFunction(xData)) {
            yData = xData
            xData = jaskell.range(xmin, (xmax-xmin)/x1, xmax)
        }
        if (jaskell.isFunction(yData)) {
            for (var i = 1; i < xData.length; i++) {
                drawLine(
                    pt(xData[i-1], yData(xData[i-1])),
                    pt(xData[i], yData(xData[i])))
            }
        } else {
            for (var i = 1; i < xData.length; i++) {
                drawLine(
                    pt(xData[i-1], yData[i-1]),
                    pt(xData[i], yData[i]))
            }
        }
    }

    var setDimensions = function (width, height) {
        if (width === undefined) {
            var width = canvas.offsetWidth
            var height = width * yLength / xLength
        } else if (height === undefined) {
            var height = width * yLength / xLength
        }
        canvas.width = width
        canvas.height = height
        c2D = canvas.getContext('2d')
        x1 = c2D.canvas.width
        y1 = c2D.canvas.height
        setColor.apply(this, colors)
        drawAxes()
    }
    
    _ = {}
    _.setColor = setColor
    _.drawLine = drawLine
    _.plot = plot
    _.setDimensions = setDimensions
    return _
}