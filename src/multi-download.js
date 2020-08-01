/* eslint-disable no-unused-vars */
/* eslint-disable unicorn/no-process-exit */
/* eslint-disable no-process-exit */
const axios = require('axios')
const fs = require('fs')
const EventEmitter = require('events')
const onDeath = require('death')
const SingleDownload = require('./single-download.js')
const utils = require('./utils.js')
const Monitor = require('./monitor.js')

class MultiDownload extends EventEmitter {
  constructor(url, fileName, partsLength, verbose = 1) {
    super()
    this.url = url
    this.fileName = fileName
    this.length = ''
    this.resumable = null
    this.partsLength = partsLength
    this.parts = []
    this.interval = 0

    this.monitor = new Monitor(this, verbose)

    this.offDeath = onDeath(this.onDeath.bind(this))
  }

  async gethead(url) {
    var res = await axios({
      method: 'head',
      url: url,
    }).catch(this.error.bind(this))
    res = res.headers
    this.length = res['content-length']
    this.resumable = res['accept-ranges']
    this.emit('head')
    await this.allocate()// allocate file size
    this.divisions() // make SingleDownload parts
  }

  async allocate() {
    var stream = fs.createWriteStream(this.fileName)
    var empty = new Uint8Array(400)
    var times = Math.floor(this.length / empty.length)
    var left = new Uint8Array(this.length % empty.length)
    for (var i = 0; i < times; i++) {
      stream.write(empty)
    }
    stream.write(left)
    await new Promise(resolve => {
      stream.end(resolve)
    })
    stream.close()
  }

  divisions() {
    var starts = 0
    var ends = 0
    if (!this.resumable) {
      this.partsLength = 1
    }
    var divlength = Math.floor(this.length / this.partsLength)
    for (var i = 0; i < this.partsLength; i++) {
      starts = Math.max(0, i * divlength)
      ends = Math.min(((i + 1) * divlength) - 1, this.length)
      if (i === this.partsLength - 1)
        ends = this.length
      // console.log(i+'=>'+starts+':'+ends);
      var instance = new SingleDownload(this.url, this.fileName, starts, ends, this.resumable)
      this.parts.push(instance)
    }
  }

  async run() {
    await this.gethead(this.url)
    for (var i = 0; i < this.partsLength; i++) {
      this.parts[i].run()
    }
    this.emit('start')
    this.interval = setInterval(this.observer.bind(this), 1000)
  }

  async resume() {
    if (!this.resumable) {
      this.run()
      return
    }
    for (var i = 0; i < this.partsLength; i++) {
      this.parts[i].resume()
    }
    this.emit('resume')
    this.interval = setInterval(this.observer.bind(this), 1000)
  }

  progress() {
    var done = 0
    for (var i = 0; i < this.parts.length; i++) {
      done += this.parts[i].done + this.parts[i].stream.bytesWritten
    }
    return done
  }

  observer() {
    var done = this.progress()
    if (done >= this.length) {
      clearInterval(this.interval)
      this.end()
    }
  }

  end() {
    require('./config-sys').delFromConfig(this.fileName)
    this.emit('end')
    this.offDeath()
  }

  save() {
    var obj = {
      url: this.url,
      fileName: this.fileName,
      length: this.length,
      resumable: this.resumable,
      partsLength: this.partsLength,
      monitor: this.monitor.save(),
      parts: [],
    }
    this.parts.forEach((val, _index, _ar) => {
      obj.parts.push(val.save())
    })
    return obj
  }

  error(e) {
    throw e
  }

  onDeath(_sig, _err) {
    let obj = this.save()
    require('./config-sys').saveToConfig(obj)
    this.monitor.cliDisplay.stop()
    process.exit()
  }
}

MultiDownload.fromObj = function (obj) {
  let dObj = new MultiDownload(obj.url, obj.fileName, obj.partsLength)
  Object.assign(dObj, obj)

  dObj.monitor = Monitor.fromObj(obj.monitor, dObj)

  obj.parts.forEach((val, index, array) => {
    array[index] = SingleDownload.fromObj(val)
  })
  return dObj
}

module.exports = MultiDownload
