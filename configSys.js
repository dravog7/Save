const fs = require('fs');
const multiDownload = require('./multiDownload');

module.exports = {
    configPath: function(fileName){
        return './.save/'+fileName+'.json';
    },
    saveToConfig: function(obj){
        let fileName = module.exports.configPath(obj.fileName);
        let jsonObj = JSON.stringify(obj);
        fs.writeFileSync(fileName,jsonObj);
    },
    loadFromConfig: function(fileName){
        let configPath = module.exports.configPath(fileName);
        if(fs.existsSync(configPath)){
            let obj = JSON.parse(fs.readFileSync(configPath));
            let dObj = multiDownload.fromObj(obj);
            return dObj;
        }
        else
            return null;
    },
    delFromConfig: function(fileName){
        let configPath = module.exports.configPath(fileName);
        if(fs.existsSync(configPath)){
            fs.unlinkSync(configPath);
        }
    },
    listConfigs: function(){
        let fileNames = [];
        for(let configFileName of fs.readdirSync('.save')){
            fileNames.push(module.exports.getFileName(configFileName));
        }
        return fileNames;
    },
    getFileName: function(configFileName){
        return configFileName.substring(0,a.lastIndexOf('.json'));
    }
};