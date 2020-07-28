const axios=require("axios");
const fs=require("fs");
const single=require("./singledownload.js");
const utils=require("./utils.js");
const progBar = require('cli-progress')
const _colors = require('colors');

function myFormatter(options, params, payload){
    let completeLength = Math.round(params.progress*options.barsize);
    let bar = options.barCompleteString.substr(0,completeLength)+
            options.barIncompleteString.substr(0,options.barsize - completeLength);
    let progText = utils.byte2string(params.value) + '/' + utils.byte2string(params.total);
    let ETAText = utils.seconds2time(params.eta);
    let baseText = ''
    if (params.value >= params.total){
        baseText= '#' + _colors.grey(payload.task) + ' ['+bar+'] '+' ' + _colors.green(progText);
    }else{
        baseText= '#' + payload.task + '  '+' ['+bar+'] ' + _colors.yellow(progText);
    }
    baseText +=' |'+ETAText+'|speed:'+payload.speed;
    return baseText;
}

class multidownload
{
    constructor(url,filename,noof=10)
    {
        this.url=url;
        this.filename=filename;
        this.length="";
        this.resumable="";
        this.noof=noof;
        this.parts=[];
        this.interval=0;
        this.prevspeed = 0;
        this.prevdone=0;
        this.bar = new progBar.SingleBar({
            format: myFormatter,
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true,
            stopOnComplete: true
        });
    }

    async gethead(url)
    {
        var res=await axios({
            method: 'head',
            url: url,
        }).catch(this.error.bind(this));
        res=res.headers;
        this.length=res['content-length'];
        this.resumable=res['accept-ranges'];
        await this.allocate();//allocate file size
        this.divisions(); //make singledownload parts
    }
    async allocate()
    {
        var stream=fs.createWriteStream(this.filename);
        var empty=new Uint8Array(400);
        var times=Math.floor(this.length/empty.length);
        var left=new Uint8Array(this.length%empty.length);
        for(var i=0;i<times;i++)
        {
            stream.write(empty);
        }
        stream.write(left);
        await new Promise((resolve)=>{stream.end(resolve)});
    }
    divisions()
    {
        var starts=0;
        var ends=0;
        if(this.resumable!="")
        {
            var divlength=Math.floor(this.length/this.noof);
            for(var i=0;i<this.noof;i++)
            {
                starts=Math.max(0,i*divlength);
                ends=Math.min((i+1)*divlength-1,this.length);
                if(i==this.noof-1)
                    ends=this.length;
                var instance=new single(this.url,this.filename,starts,ends,this.resumable);
                this.parts.push(instance);
            }
        }
    }
    async run()
    {
        try {
            await this.gethead(this.url);
        } catch (error) {
            console.log(error);
            return;
        }
        
        for(var i=0;i<this.noof;i++)
        {
            this.parts[i].run();
        }
        this.bar.start(this.length,0,{'task':this.filename,'speed':'N/A'});
        this.interval=setInterval(this.monitor.bind(this),1000);
    }
    monitor()
    {
        var done=0;
        for(var i=0;i<this.parts.length;i++)
        {
            done+=this.parts[i].done+this.parts[i].stream.bytesWritten;
        }
        let speed = this.calculateSpeed(done);

        this.bar.update(done,{'speed':utils.byte2string(speed)+'/s'});
        if(done>=this.length){
            clearInterval(this.interval);
            this.bar.stop();
        }
            
    }
    calculateSpeed(done){
        let coeff = 0.5;
        let currSpeed = done - this.prevdone;
        this.prevdone = done;
        this.prevspeed = currSpeed*(coeff) + (1-coeff)*this.prevspeed;
        return this.prevspeed;
    }
    save()
    {
        var obj={
            url:this.url,
            filename:this.filename,
            length:this.length,
            resumable:this.resumable,
            noof:this.noof,
            parts:[],
        }
        this.parts.forEach((val,index,ar)=>{
            obj.part.push(val.save());
        });
        return obj;
    }
    error(e)
    {
        console.log(e.message);
    }

}

module.exports=multidownload;

/*
TODO
1. handle errors
2. implement resumable or not checking
*/