// Linear Congruential Generator for Euler #150
function generate(length) {
    var data = []
    var tLast = 0
    for (var i = 0; i < length; i++) {
        t = (615949 * tLast + 797807) % (Math.pow(2, 20))
        s_k = t - (Math.pow(2, 19))
        data.push(s_k)
        tLast = t
    }
    console.log(data)
}