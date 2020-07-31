const fs = require('fs')
const MultiDownload = require('./multi-download.js')

module.exports = {
  configPath: function (fileName) {
    return './.save/' + fileName + '.json'
  },
  setupConfig: function () {
    fs.mkdirSync('.save')
    fs.writeFileSync('.save/index.json', JSON.stringify({
      downloads: [],
    }))
  },
  saveToIndexConfig: function (obj) {
    let indexObj = JSON.parse(fs.readFileSync('.save/index.json'))
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
    fs.writeFileSync('.save/index.json', JSON.stringify(indexObj))
  },
  delFromIndexConfig: function (fileName) {
    if (!fs.existsSync('.save'))
      return
    let indexObj = JSON.parse(fs.readFileSync('.save/index.json'))
    let targetIndex = indexObj.downloads.findIndex(entry => {
      return entry.fileName === fileName
    })
    if (targetIndex !== -1)
      indexObj.downloads.pop(targetIndex)
    fs.writeFileSync('.save/index.json', JSON.stringify(indexObj))
  },
  saveToConfig: function (obj) {
    if (!fs.existsSync('.save'))
      this.setupConfig()
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
    return JSON.parse(fs.readFileSync('.save/index.json')).downloads
  },
  getFileName: function (configFileName) {
    return configFileName.substring(0, configFileName.lastIndexOf('.json'))
  },
}
