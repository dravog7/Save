const single=require("./singledownload");
const axios=require("axios");
url="http://9092.ultratv100.com:9090/music/Linkin%20Park/In%20The%20End.MP3";
file="in_the_end.mp3";
obj={};
a=new single(url,file);
b="";
a.run();
setTimeout(()=>{
    a.pause();obj=JSON.stringify(a.save());
},3000);
setTimeout(()=>{
    delete a;
    b=new single(url,file);
    console.log(obj);
    b.fromObj(JSON.parse(obj));
    b.resume();
},5000);

// async function checkpart()
// {
//     var res=await axios({
//         method: 'head',
//         url: url,
//     });
//     res=res.headers;
//     var length=res['content-length'];
//     var start=Math.floor(length/3);
//     var end=Math.floor(2*length/3);
//     console.log("from:"+start+",to:"+end+",len:"+length);
//     a=new single(url,file,start,end,'bytes');
//     await a.run();
//     setTimeout(()=>{a.pause();},1000);
//     setTimeout(()=>{a.resume();},2000);
// }
// checkpart();