#!/usr/bin/env node
const fs = require('fs');
const utils = require('./utils');
const configSys= require('./configSys');
const multiDownload = require("./multiDownload");

async function download(url,fileName,parts=10,verbose=1){
    if(!fileName){
        fileName = await utils.getFileName(url);
        if(!fileName) return;
    }
    let d = new multiDownload(url,fileName,parts,verbose);
    d.run().catch((e)=>{console.log('err:',e.message)});
}

async function resume(fileName,parts=10){
    let Obj = configSys.loadFromConfig(fileName);
    if(!Obj){
        console.log('No download exists for fileName!');
        return;
    }
    Obj.resume();
}

function ls(){
    let fileList = configSys.listConfigs();
    if(fileList.length<1){
        console.log('No incomplete downloads in folder');
    }
    for(let entry of fileList){
        console.log(entry)
    }
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
    .command('r <fileName>',
        'Resume a download that was stopped gracefully (using Ctrl+C)',
        (yargs)=>{
            yargs.positional('fileName',{
                'describe':'fileName to resume download',
                'type':'string',
            });
        },
        (argv)=>{
            resume(argv.fileName);
        })
    .command('ls',
        'list downloads in folder',(yargs)=>{},
        (argv)=>{
            ls();
        })
    .option('file',{
        'alias':'f',
        'type':'string',
        'description':'fileName of the download [default: determined from URL]',
    })
    .option('parts',{
        'alias':'p',
        'type':'number',
        'default':10,
        'description':'number of parts downloaded simultaneously [default:10]',
    })
    .option('verbose',{
        'alias':'v',
        'type':'number',
        'default':1,
        'description':'Whether to display progress bar[default:True]',
    })
    .argv;