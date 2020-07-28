const axios= require("axios")
const fs=require("fs")
class singleDownload
{
    constructor(url,filename,start=0,end=0,resumable=-1)
    {
        this.filename=filename;
        this.url=url;
        this.length="";
        this.stream="";
        this.resumable="";
        this.paused=false;
        this.cancelToken=axios.CancelToken.source();
        this.start=start;
        this.total=end;
        this.done=0;
        this.resumable=resumable;
        this.partial=0;
        start=Math.max(0,start-1); //start is +ve
        if(end==0)
            this.stream=fs.createWriteStream(this.filename);
        else
        {
            this.stream=fs.createWriteStream(this.filename,{flags:'r+',start:start});
            this.partial=1;
        }
            
    }
    async run()
    {
        if(this.total==0)
        {
            const heads=await this.gethead(this.url);
            try {
                this.total=heads['content-length'];
                this.resumable=heads['accept-ranges'];
            } catch (error) {
                console.log(error);
            }
            
        }
        this.load(this.url);
    }
    async gethead(url)
    {
        /*
        fix no net time errors
        */
        var res=await axios({
            method: 'head',
            url: url,
        }).catch(this.error.bind(this));
        if(res)
            return res.headers;
    };
    async load(url)
    {
        var headers= {};
        if(this.partial==1)
        {
            headers.Range='bytes='+(this.start+this.done)+'-'+this.total;
        }
        try {
            
            var res=await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
            headers:headers,
            cancelToken:this.cancelToken.token
            }).catch(this.error.bind(this));
            
        } catch (error) {}
        if(res)
        {
            res.data.pipe(this.stream);
            this.interval=setInterval(this.monitor.bind(this),500);
            this.stream.on("close",this.end.bind(this));
        }

    };
    async pause()
    {
        this.cancelToken.cancel();
        console.log("paused!");
        this.partial=1;
    };
    async resume()
    {
        console.log("resume");
        this.cancelToken=axios.CancelToken.source();
        if(this.done==0)
            this.done=this.stream.bytesWritten+1;
        else
            this.done+=this.stream.bytesWritten;
        if(this.start==0)
            this.stream=fs.createWriteStream(this.filename,{'flags':'a'});
        else
        {
            var offset=Math.max(0,this.start+this.done-1);
            this.stream=fs.createWriteStream(this.filename,{'flags':'r+',start:offset});
        }
        this.load(this.url);
    };
    monitor()
    {
        // console.log("done:"+(this.done+this.stream.bytesWritten)+'/'+(this.total-this.start));
    };
    end()
    {
        clearInterval(this.interval);
    };
    save()
    {
        const obj={
            filename:this.filename,
            url:this.url,
            length:this.length,
            resumable:this.resumable,
            paused:this.paused,
            start:this.start,
            total:this.total,
            done:this.done+this.stream.bytesWritten,
            partial:this.partial,
        };
        return obj;
    };
    fromObj(obj)
    {
        Object.assign(this,obj);
    }
    error(e)
    {
        console.log(e.message);
    };
};

module.exports=singleDownload;

/* TODO
1. internet disconnection
while the progress is logged, 
    if disconnected. 
        The monitor stays in infinite loop

2. implement resumable or not checking

3. to JSON for save and restoration
    
*/