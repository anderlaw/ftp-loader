var Client = require('ftp');
var fs = require('fs');
var spinner = require('ora')()

var client = new Client();


module.exports = function({ host,user,password,sourceDir,targetDir }){
    var filepaths = [];
    function readFilesFromDir(parentPath,filePath){
        let currentPath = "";
        if(parentPath === ""){
            currentPath = filePath;
        }else{
            currentPath = parentPath+'/'+filePath;
        }
        let sourcePath = `${sourceDir}/${currentPath}`;

        if(fs.lstatSync(sourcePath).isDirectory()){
            let files = fs.readdirSync(sourcePath);
            for(let filePath of files){
                readFilesFromDir(currentPath,filePath); 
            } 
        }else{
            filepaths.push(currentPath)
        }
        
    }

    function readyFn(){
        spinner.start();
        fs.readdir(sourceDir, function(err,files){
            if(err) throw err;
            for(let filePath of files){
                readFilesFromDir("",filePath);
            }
            transferFiles();
        })
    }
    function transferFile(filePath){
        return new Promise((res,rej)=>{
            let parentPath = filePath.lastIndexOf('/') !== -1 && filePath.substring(0 , filePath.lastIndexOf('/') );
            let sourcePath = `${sourceDir}/${filePath}`;
            let targetPath = `${targetDir}/${filePath}`;
            let newDirInServer = `${targetDir}/${parentPath}`;
            if(!parentPath || parentPath === '.'){
                client.put(sourcePath, targetPath,function(err) {
                    if (err) throw err;
                    console.log(sourcePath+'-----'+targetPath)
                    res(true);
                });
            }else{
                client.mkdir(newDirInServer,true,function(err){
                    if(err) throw err;
                    client.put(sourcePath, targetPath,function(err) {
                        if (err) throw err;
                        console.log(sourcePath+'-----'+targetPath)
                        res(true);
                    });
                })
            }
        })
    }
    function transferFiles(){
        let promises = [];
        filepaths.forEach(filePath=>{
            promises.push(transferFile(filePath))
        })
        Promise.all(promises).then(res=>{
            console.log('上传成功！')
            spinner.stop();
            client.end();
        }).catch(rej=>{
            console.log('上传失败！');
            spinner.stop();
            client.end();
        })

    }
    client.on('ready', readyFn);
    // connect to localhost:21 as anonymous
    client.connect({
        host,
        user,
        password
    });
}