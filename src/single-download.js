const axios = require('axios')
const fs = require('fs')

class SingleDownload {
  // eslint-disable-next-line max-params
  constructor(url, fileName, start = 0, end = 0, resumable = -1, resuming = 0) {
    this.fileName = fileName
    this.url = url
    this.length = ''
    this.stream = ''
    this.resumable = ''
    this.paused = false
    this.cancelToken = axios.CancelToken.source()
    this.start = start
    this.total = end
    this.done = 0
    this.resumable = resumable
    this.partial = 0
    start = Math.max(0, start) // start is +ve
    if (!resuming) {
      if (end === 0)
        this.stream = fs.createWriteStream(this.fileName)
      else {
        this.stream = fs.createWriteStream(this.fileName, {flags: 'r+', start: start})
        this.partial = 1
      }
    }
  }

  async run() {
    if (this.total === 0) {
      try {
        const heads = await this.gethead(this.url)
        this.total = heads['content-length']
        this.resumable = heads['accept-ranges']
      } catch (error) {
        throw error
      }
    }
    this.load(this.url)
  }

  async gethead(url) {
    /*
        fix no net time errors
        */
    var res = await axios({
      method: 'head',
      url: url,
    }).catch(this.error.bind(this))
    if (res)
      return res.headers
  }

  async load(url) {
    var headers = {}
    if (this.partial === 1) {
      headers.Range = 'bytes=' + (this.start + this.done) + '-' + this.total
    }
    try {
      var res = await axios({
        method: 'get',
        url: url,
        responseType: 'stream',
        headers: headers,
        cancelToken: this.cancelToken.token,
      }).catch(this.error.bind(this))

      if (res) {
        res.data.pipe(this.stream)
        // this.interval=setInterval(this.monitor.bind(this),500);
        this.stream.on('close', this.end.bind(this))
      }
    } catch (error) {}
  }

  async pause() {
    this.cancelToken.cancel()
    this.partial = 1
  }

  async resume() {
    this.cancelToken = axios.CancelToken.source()
    var offset = Math.max(0, this.start + this.done - 1)
    this.stream = fs.createWriteStream(this.fileName, {flags: 'r+', start: offset})
    this.load(this.url)
  }

  monitor() {
    // console.log("done:"+(this.done+this.stream.bytesWritten)+'/'+(this.total-this.start));
  }

  end() {
    // clearInterval(this.interval);
  }

  save() {
    const obj = {
      fileName: this.fileName,
      url: this.url,
      length: this.length,
      resumable: this.resumable,
      paused: this.paused,
      start: this.start,
      total: this.total,
      done: this.done + this.stream.bytesWritten,
      partial: this.partial,
    }
    return obj
  }

  static fromObj(obj) {
    let dObj = new SingleDownload(
      obj.url,
      obj.fileName,
      obj.start,
      obj.total,
      this.resumable,
      1)
    Object.assign(dObj, obj)
    return dObj
  }

  error(e) {
    throw e
  }
}

module.exports = SingleDownload
