/* eslint-disable no-restricted-modules */
const cliProgress = require('cli-progress')
const utils = require('./utils')
const _colors =  require('colors')

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

class Monitor {
  constructor(downloadObj, verbose = 1) {
    this.downloadObj = downloadObj
    this.prevSpeed = 0
    this.prevDone = 0
    this.verbose = verbose
    this.cliDisplay = null
    this.interval = setInterval(this.run.bind(this), 1000)
    this.setup()
  }

  setup() {
    if (this.verbose)
      this.cliDisplay = new cliProgress.SingleBar({
        format: progressFormat,
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true,
        stopOnComplete: true,
      })
    this.downloadObj.on('head', this.head.bind(this))
    this.downloadObj.on('start', this.start.bind(this))
    this.downloadObj.on('resume', this.resume.bind(this))
    this.downloadObj.on('end', this.end.bind(this))
  }

  calculateSpeed(done) {
    let coeff = 0.5
    let currSpeed = done - this.prevDone
    this.prevDone = done
    this.prevSpeed = (currSpeed * coeff) + ((1 - coeff) * this.prevSpeed)
    return this.prevSpeed
  }

  start() {
    if (this.verbose)
      this.cliDisplay.start(this.downloadObj.length, 0, {
        task: this.downloadObj.fileName,
        speed: 'N/A',
      })
  }

  resume() {
    if (this.verbose)
      this.cliDisplay.start(this.downloadObj.length, this.downloadObj.progress(), {
        task: this.downloadObj.fileName,
        speed: 'N/A',
      })
  }

  head() {
    // when head request returns!
  }

  run() {
    let done = this.downloadObj.progress()
    let speed = this.calculateSpeed(done)
    if (this.verbose)
      this.cliDisplay.update(done, {speed: utils.byte2string(speed) + '/s'})
  }

  end() {
    clearInterval(this.interval)
    if (this.verbose)
      this.cliDisplay.stop()
  }

  save() {
    return {
      prevSpeed: this.prevSpeed,
      prevDone: this.prevDone,
      verbose: this.verbose,
    }
  }

  static fromObj(obj, downloadObj) {
    let monitor = new Monitor(downloadObj, obj.verbose)
    Object.assign(monitor, obj)
    return monitor
  }
}

module.exports = Monitor
