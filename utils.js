axios = require('axios')
module.exports= {
    byte2string:function(byte)
    {
        var kb=byte/1024;
        var mb=kb/1024;
        var gb=mb/1024;
        if(gb>0.9)
            return ""+gb.toFixed(2)+" GB";
        else if(mb>0.9)
            return ""+mb.toFixed(2)+" MB";
        else if(kb>0.9)
            return ""+kb.toFixed(2)+" KB";
        else
            return ""+byte.toFixed(2)+" bytes";
    },
    seconds2time:function(sec){
        var min = Math.floor(sec /60);
        var sec = sec % 60;

        var hr = Math.floor(min/60);
        min =min%60;

        var day =Math.floor(hr/24);
        hr = hr%24;

        var str = sec.toFixed(0)+' s';
        if(min>0) str = min.toFixed(0)+' m '+str;
        if(hr>0) str = hr.toFixed(0)+' h '+str;
        if(day>0) str = day.toFixed(0)+' d '+str;
        return str;

    },
    getFileName:async function(url){
        //method 1: from url string
        try {
        let filename = new URL(url).pathname;
        }
        catch(e){
            console.log('invalid URL: "'+url+'"');
            return null;
        }
        filename = filename.substring(filename.lastIndexOf('/')+1)
        //method 2: head request disposition arg
        let response = await axios.head(url);
        if (response.headers['Content-Disposition']){
            let header = response.headers['Content-Disposition'];
            let pos = header.indexOf('filename="')+10;
            filename = header.substring(pos,header.indexOf('"',pos));
        }
        return filename;

    }
}