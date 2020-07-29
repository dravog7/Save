const fs = require('fs');
const multi = require('./multidownload');
const { config } = require('yargs');

module.exports = {
    configPath: function(filename){
        return './.save/'+filename+'.json';
    },
    saveToConfig: function(obj){
        let filename = module.exports.configPath(obj.filename);
        let jsonObj = JSON.stringify(obj);
        fs.writeFileSync(filename,jsonObj);
    },
    loadFromConfig: function(filename){
        let configPath = module.exports.configPath(filename);
        if(fs.existsSync(configPath)){
            let obj = JSON.parse(fs.readFileSync(configPath));
            let dObj = new multi(obj.url,obj.filename);
            dObj.fromObj(obj);
            return dObj;
        }
        else
            return null;
    },
    delFromConfig: function(filename){
        let configPath = module.exports.configPath(filename);
        if(fs.existsSync(configPath)){
            fs.unlinkSync(configPath);
        }
    }
};