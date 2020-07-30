const assert =require('assert')
const http = require('http')
const parseUrl = require('url').parse
const fs = require('fs');
const send = require('send')
const multiDownload = require('../multiDownload')
const sha256File = require('sha256-file')
const singleDownload = require('../singleDownload')


let server = null;

function timeout(ms){
    new Promise((resolve)=>{setTimeout(resolve,ms)});
}

function startServer(){
    server = http.createServer(function(req,res){
        let url = parseUrl(req.url).pathname;
        send(req,url,{root:'test/test_files'}).pipe(res);
    })
    server.listen(3000)
}

function stopServer(){
    server.close();
}

function compareFiles(expected,obtained){
    let expectedHash = sha256File(expected);
    let obtainedHash = sha256File(obtained);
    return expectedHash == obtainedHash;
}

function generate_file(fileName,fileSize){
    let file = fs.openSync('test/test_files/'+fileName,'w');
    let text='abcdefghijklmnopqrstuvwxyz\n';
    let times=Math.floor(fileSize/text.length);
    let left = text.substr(0,fileSize%text.length);
    for(let i=0;i<times;i++)
        fs.writeSync(file,text);
    fs.writeSync(file,left);
    fs.closeSync(file);
}

//file generation
console.log('generating files!');
generate_file('a.txt',1024*1024*4);


describe('Server Based Tests',function(){
    before(function(){
        startServer()
    })
    after(function(){
        setTimeout(stopServer,1000);
    })
    describe('SingleDownload',function(){
        it('continous download',async function(){
            let url = 'http://localhost:3000/a.txt';
            let destFile = 'test/a.txt';
            let dObj = new singleDownload(url,destFile);
            try {
                await dObj.run();
                await new Promise(function(resolve){
                    dObj.stream.on('close',resolve);
                })
            }
            catch(e){ assert.fail(e) }

            if(!compareFiles('test/test_files/a.txt',destFile)){
                assert.fail('Downloaded File Hash not equal!')
            }
        })
    })
    describe('MultiDownload',function(){
        it('continous download',async function(){
            let url = 'http://localhost:3000/a.txt';
            let destFile = 'test/am.txt';
            let dObj = new multiDownload(url,destFile,10,0);
            try{
                await new Promise(function(resolve){
                    dObj.on('end',resolve);
                    dObj.run();
                })
            }
            catch(e){
                assert.fail(e);
            }
            if(!compareFiles('test/test_files/a.txt',destFile))
                assert.fail('Downloaded File Hash not equal!');
        })
    })
})