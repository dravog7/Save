#!/usr/bin/env node
const fs = require('fs');
const utils = require('./utils');
const multiDownload = require("./multidownload");

async function download(url,filename,parts=10){
    if(!filename){
        filename = await utils.getFileName(url);
        if(!filename) return;
    }
    let d = new multiDownload(url,filename,parts);
    d.run().catch((e)=>{console.log('err:',e.message)});
}

function checkSetup(){
    //Check if .save folder exists and if not make it
    if(!fs.existsSync('.save')){
        fs.mkdirSync('.save');
    }
}

checkSetup();
require("yargs")
    .usage('$0 <url>',
        'download the url',
        (yargs)=>{
            yargs.positional('url',{
                'describe':'URL to download',
                'type':'string',
            })
        },
        (argv)=>{
            download(argv.url,argv.f,argv.parts);
        })

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