const {Command, flags} = require('@oclif/command')
const MultiDownload = require('../multi-download')
const utils = require('../utils')

class DownloadCommand extends Command {
  async run() {
    const {flags, args} = this.parse(DownloadCommand)
    let fileName = flags.fileName
    if (!fileName)
      fileName = await utils.getFileName(args.url)
    let downloadObject = new MultiDownload(args.url, fileName, flags.parts, flags.verbose)
    await downloadObject.run()
  }
}

DownloadCommand.description = `Download the given URL
...
Extra documentation goes here
`

DownloadCommand.flags = {
  fileName: flags.string({char: 'f', description: 'filename to save into'}),
  parts: flags.integer({char: 'p', description: 'number of concurrent requests', default: 10}),
  verbose: flags.integer({char: 'v', description: 'verbose level', default: 1}),
}

DownloadCommand.args = [
  {name: 'url', required: true, description: 'URL to download from'},
]

module.exports = DownloadCommand
