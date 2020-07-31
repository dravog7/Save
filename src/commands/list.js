const {Command} = require('@oclif/command')
const configSys = require('../config-sys')
const utils = require('../utils')
const {cli} = require('cli-ux')
class ListCommand extends Command {
  async run() {
    const {flags} = this.parse(ListCommand)
    let entries = configSys.listConfigs()
    cli.table(entries, {
      filename: {
        get(row) {
          return row.fileName
        },
      },
      URL: {
        get(row) {
          return row.url
        },
      },
      Size: {
        get(row) {
          return utils.byte2string(row.total)
        },
      },
      Completion: {
        get(row) {
          return ((row.done / row.total) * 100).toFixed(1) + '%'
        },
      },
    }, {
      printLine: this.log,
      ...flags,
    })
  }
}

ListCommand.description = `List of downloads in folder
...
Extra documentation goes here
`

ListCommand.flags = {
  ...cli.table.flags,
}

module.exports = ListCommand
