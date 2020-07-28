#!/usr/bin/env node
const utils = require('./utils');
const multiDownload = require("./multidownload");

async function download(url,filename,parts=10){
    if(!filename){
        filename = await utils.getFileName(url);
    }
    let d = new multiDownload(url,filename,parts);
    d.run();
}

let options = require("yargs")
    .usage('$0 url -f [file]')
    .demandCommand(1)
    .option('file',{
        'alias':'f',
        'type':'string',
        'description':'Filename of download',
    })
    .option('parts',{
        'alias':'p',
        'type':'number',
        'description':'number of parts downloaded simultaneously',
    })
    .argv;
download(options._[0],options.f,options.parts);