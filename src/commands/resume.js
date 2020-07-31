const {Command, flags} = require('@oclif/command')
const configSys = require('../config-sys')

class ResumeCommand extends Command {
  async run() {
    const {flags, args} = this.parse(ResumeCommand)
    let downloadObject = configSys.loadFromConfig(args.fileName)
    downloadObject.verbose = flags.verbose
    downloadObject.resume()
    await new Promise(resolve => {
      downloadObject.on('end', resolve)
    })
  }
}

ResumeCommand.description = `Resume downloading file
...
Extra documentation goes here
`

ResumeCommand.args = [
  {name: 'fileName', required: true, description: 'filename to resume download!'},
]

ResumeCommand.flags = {
  verbose: flags.boolean({char: 'v', description: 'verbose level', default: 1}),
}

module.exports = ResumeCommand
