#!/usr/bin/env node
const fs = require('fs');
const utils = require('./utils');
const configSys= require('./configSys');
const multiDownload = require("./multidownload");

async function download(url,filename,parts=10){
    if(!filename){
        filename = await utils.getFileName(url);
        if(!filename) return;
    }
    let d = new multiDownload(url,filename,parts);
    d.run().catch((e)=>{console.log('err:',e.message)});
}

async function resume(filename,parts=10){
    let Obj = configSys.loadFromConfig(filename);
    if(!Obj){
        console.log('No download exists for filename!');
        return;
    }
    Obj.resume();
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
        'Downloads the URL',
        (yargs)=>{
            yargs.positional('url',{
                'describe':'URL to download',
                'type':'string',
            })
        },
        (argv)=>{
            download(argv.url,argv.f,argv.parts);
        })
    .command('r <filename>',
        'Resume a download that was stopped gracefully (using Ctrl+C)',
        (yargs)=>{
            yargs.positional('filename',{
                'describe':'filename to resume download',
                'type':'string',
            });
        },
        (argv)=>{
            resume(argv.filename);
        })
    .option('file',{
        'alias':'f',
        'type':'string',
        'description':'filename of the download [default: determined from URL]',
    })
    .option('parts',{
        'alias':'p',
        'type':'number',
        'description':'number of parts downloaded simultaneously [default:10]',
    })
    .argv;