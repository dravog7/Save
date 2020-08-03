const fs = require('fs')
const path = require('path')
const MultiDownload = require('./multi-download.js')

module.exports = {
  configPath: function (fileName) {
    let JSONfile = path.basename(fileName) + '.json'
    let saveDir = this.savePath(fileName)
    return path.resolve(saveDir, JSONfile)
  },
  savePath: function (fileName) {
    let absPath = path.resolve(fileName)
    let dir = path.dirname(absPath)
    let saveDir = path.resolve(dir, '.save')
    return saveDir
  },
  setupConfig: function (fileName) {
    let saveDir = this.savePath(fileName)
    fs.mkdirSync(saveDir)
    fs.writeFileSync(path.resolve(saveDir, 'index.json'), JSON.stringify({
      downloads: [],
    }))
  },
  saveToIndexConfig: function (obj) {
    let saveDir = this.savePath(obj.fileName)
    let saveIndex = path.resolve(saveDir, 'index.json')
    if (!fs.existsSync(saveIndex))
      return
    let indexObj = JSON.parse(fs.readFileSync(saveIndex))
    let targetIndex = indexObj.downloads.findIndex(entry => {
      return entry.fileName === obj.fileName
    })
    let entryObj = {
      fileName: obj.fileName,
      url: obj.url,
      done: obj.prevdone,
      total: obj.length,
    }
    if (targetIndex === -1)
      indexObj.downloads.push(entryObj)
    else
      indexObj.downloads[targetIndex] = entryObj
    fs.writeFileSync(saveIndex, JSON.stringify(indexObj))
  },
  delFromIndexConfig: function (fileName) {
    let saveDir = this.savePath(fileName)
    let saveIndex = path.resolve(saveDir, 'index.json')
    if (!fs.existsSync(saveIndex))
      return
    let indexObj = JSON.parse(fs.readFileSync(saveIndex))
    let targetIndex = indexObj.downloads.findIndex(entry => {
      return entry.fileName === fileName
    })
    if (targetIndex !== -1)
      indexObj.downloads.pop(targetIndex)
    fs.writeFileSync(saveIndex, JSON.stringify(indexObj))
  },
  saveToConfig: function (obj) {
    let saveDir = this.savePath(obj.fileName)
    if (!fs.existsSync(saveDir))
      this.setupConfig(obj.fileName)
    this.saveToIndexConfig(obj)
    let fileName = this.configPath(obj.fileName)
    let jsonObj = JSON.stringify(obj)
    fs.writeFileSync(fileName, jsonObj)
  },
  loadFromConfig: function (fileName) {
    let configPath = this.configPath(fileName)
    if (fs.existsSync(configPath)) {
      let obj = JSON.parse(fs.readFileSync(configPath))
      let dObj = MultiDownload.fromObj(obj)
      return dObj
    }
    return null
  },
  delFromConfig: function (fileName) {
    this.delFromIndexConfig(fileName)
    let configPath = this.configPath(fileName)
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath)
    }
  },
  listConfigs: function () {
    let saveIndex = path.resolve('.save/index.json')
    if (fs.existsSync(saveIndex))
      return JSON.parse(fs.readFileSync(saveIndex)).downloads
    return []
  },
  getFileName: function (configFileName) {
    let JSONFileName = path.basename(configFileName)
    return JSONFileName.substring(0, JSONFileName.lastIndexOf('.json'))
  },
}
