/* eslint-disable no-unused-vars */
/* eslint-disable unicorn/no-process-exit */
/* eslint-disable no-process-exit */
const axios = require('axios')
const fs = require('fs')
const EventEmitter = require('events')
const cliProgress = require('cli-progress')
// eslint-disable-next-line no-restricted-modules
const _colors = require('colors')
const onDeath = require('death')
const SingleDownload = require('./single-download.js')
const utils = require('./utils.js')
function progressFormat(options, params, payload) {
  let completeLength = Math.round(params.progress * options.barsize)
  let bar = options.barCompleteString.substr(0, completeLength) +
            options.barIncompleteString.substr(0, options.barsize - completeLength)
  let progText = utils.byte2string(params.value) + '/' + utils.byte2string(params.total)
  let etaText = utils.seconds2time(params.eta)
  let baseText = ''
  if (params.value >= params.total) {
    baseText = '#' + _colors.grey(payload.task) + ' [' + bar + '] ' + _colors.green(progText)
  } else {
    baseText = '#' + payload.task + ' [' + bar + '] ' + _colors.yellow(progText)
  }
  baseText += ' |' + etaText + '|speed:' + payload.speed
  return baseText
}

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
    this.prevspeed = 0
    this.prevdone = 0
    this.verbose = verbose
    this.offDeath = onDeath(this.onDeath.bind(this))
    if (verbose)
      this.bar = new cliProgress.SingleBar({
        format: progressFormat,
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true,
        stopOnComplete: true,
      })
  }

  async gethead(url) {
    var res = await axios({
      method: 'head',
      url: url,
    }).catch(this.error.bind(this))
    res = res.headers
    this.length = res['content-length']
    this.resumable = res['accept-ranges']
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

  async run(_callback) {
    try {
      await this.gethead(this.url)
    } catch (error) {
      throw error
    }

    for (var i = 0; i < this.partsLength; i++) {
      this.parts[i].run()
    }
    if (this.verbose) {
      this.bar.start(this.length, 0, {task: this.fileName, speed: 'N/A'})
    }
    this.interval = setInterval(this.monitor.bind(this), 1000)
  }

  async resume() {
    if (!this.resumable) {
      this.run()
      return
    }
    for (var i = 0; i < this.partsLength; i++) {
      this.parts[i].resume()
    }
    this.bar.start(this.length, 0, {task: this.fileName, speed: 'N/A'})
    this.interval = setInterval(this.monitor.bind(this), 1000)
  }

  monitor() {
    var done = 0
    for (var i = 0; i < this.parts.length; i++) {
      done += this.parts[i].done + this.parts[i].stream.bytesWritten
    }
    let speed = this.calculateSpeed(done)
    if (this.verbose)
      this.bar.update(done, {speed: utils.byte2string(speed) + '/s'})
    if (done >= this.length) {
      clearInterval(this.interval)
      this.end()
    }
  }

  end() {
    if (this.verbose)
      this.bar.stop()
    require('./config-sys').delFromConfig(this.fileName)
    this.emit('end')
    this.offDeath()
  }

  calculateSpeed(done) {
    let coeff = 0.5
    let currSpeed = done - this.prevdone
    this.prevdone = done
    this.prevspeed = (currSpeed * coeff) + ((1 - coeff) * this.prevspeed)
    return this.prevspeed
  }

  save() {
    var obj = {
      url: this.url,
      fileName: this.fileName,
      length: this.length,
      resumable: this.resumable,
      partsLength: this.partsLength,
      prevdone: this.prevdone,
      prevspeed: this.prevspeed,
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
    this.bar.stop()
    let obj = this.save()
    require('./config-sys').saveToConfig(obj)
    process.exit()
  }
}

MultiDownload.fromObj = function (obj) {
  let dObj = new MultiDownload(obj.url, obj.fileName, obj.partsLength)
  Object.assign(dObj, obj)
  obj.parts.forEach((val, index, __) => {
    let instance = SingleDownload.fromObj(val)
    dObj.parts[index] = instance
  })
  return dObj
}

module.exports = MultiDownload
