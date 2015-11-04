var express = require('express')
var bodyParser = require('body-parser')
var zlib = require('zlib')
var extend = require('xtend')

var app = module.exports = express()

app.use(function (req, res, next) {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Credentials', 'true')
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
  res.set(
    'Access-Control-Allow-Headers',
    'X-Requested-With, Content-Type, Content-Length, Referrer'
  )
  res.set('Access-Control-Expose-Headers', 'Content-Length')

  if (req.method === 'OPTIONS') {
    return res.end()
  }

  return next()
})

app.all('/echo', function (req, res, next) {
  res.set(req.headers)
  req.pipe(res)
})

app.all('/echo/zip', function (req, res, next) {
  var acceptEncoding = req.headers['accept-encoding']
  var encodings = acceptEncoding ? acceptEncoding.split(/ *, */) : []

  console.log(encodings)

  if (encodings.indexOf('deflate') > -1) {
    res.writeHead(200, { 'content-encoding': 'deflate' })
    req.pipe(zlib.createDeflate()).pipe(res)
  } else if (encodings.indexOf('gzip') > -1) {
    res.writeHead(200, { 'content-encoding': 'gzip' })
    req.pipe(zlib.createGzip()).pipe(res)
  } else {
    res.writeHead(200, {})
    req.pipe(res)
  }
})

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.get('/', function (req, res) {
  res.redirect('/test/')
})

app.get('/error', function (req, res) {
  res.status(500).send('fail')
})

app.get('/cookie', function (req, res) {
  var expires = new Date(Date.now() + 10 * 60 * 60).toGMTString()

  res.set('set-cookie', 'hello=world; expires=' + expires + '; path=/')
  res.sendStatus(200)
})

app.get('/cookie-redirect-target', function (req, res) {
  res.sendStatus(200)
})
app.get('/cookie-redirect', function (req, res) {
  var expires = new Date(Date.now() + 10 * 60 * 60).toGMTString()

  res.set('set-cookie', 'hello=mundo; expires=' + expires + '; path=/')
  res.redirect(301, '/cookie-redirect-target');
})

app.get('/not-found', function (req, res) {
  res.sendStatus(404)
})

app.get('/no-content', function (req, res) {
  res.sendStatus(204)
})

app.get('/delay/const', function (req, res) {
  res.redirect('/delay/3000')
})

app.get('/delay/:ms(\\d+)', function (req, res) {
  var ms = ~~req.params.ms

  setTimeout(function () {
    res.sendStatus(200)
  }, ms)
})

app.all('/echo/query', function (req, res) {
  res.send(req.query)
})

app.all('/echo/header/:field', function (req, res) {
  res.send(req.headers[req.params.field])
})

app.all('/echo/method', function (req, res) {
  res.send(req.method)
})

app.all('/redirect/code/:code(\\d+)', function (req, res) {
  return res.redirect(~~req.params.code, '/destination')
})

app.all('/redirect/:n(\\d+)', function (req, res) {
  const n = ~~req.params.n

  if (n < 2) {
    res.redirect('/destination')
    return
  }

  res.redirect('/redirect/' + (n - 1))
})

app.all('/redirect', function (req, res) {
  res.redirect('/destination')
})

app.all('/destination', function (req, res) {
  res.send('welcome ' + req.method.toLowerCase())
})

app.get('/json', function (req, res) {
  res.send({
    username: 'blakeembrey'
  })
})

app.get('/text', function (req, res) {
  res.send('text response')
})

app.get('/foo', function (req, res) {
  res.header('Content-Type', 'application/x-www-form-urlencoded')
  res.send('foo=bar')
})

app.get('/download', function (req, res) {
  res.set('Content-Length', 12)

  res.write('hello ')

  setTimeout(function () {
    res.write('world!')
    res.end()
  }, 200)
})

if (!module.parent) {
  app.listen(process.env.PORT || 3000)
}
