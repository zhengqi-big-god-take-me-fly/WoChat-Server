var express = require('express');
var formidable = require('formidable');
var fs = require('fs');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', { title: 'Express' });
});

router.post('/', function (req, res) {
    var form = new formidable.IncomingForm();
    //Formidable uploads to operating systems tmp dir by default
    form.uploadDir = 'tmp';       //set upload directory
    form.keepExtensions = true;     //keep file extension

    form.parse(req, function(err, fields, files) {
        res.writeHead(200, {'content-type': 'text/plain'});
        res.write('received upload:\n\n');
        console.log("form.bytesReceived");
        //TESTING
        console.log("file: " + JSON.stringify(files));
        // console.log("file size: "+JSON.stringify(files.fileUploaded.size));
        // console.log("file path: "+JSON.stringify(files.fileUploaded.path));
        // console.log("file name: "+JSON.stringify(files.fileUploaded.name));
        // console.log("file type: "+JSON.stringify(files.fileUploaded.type));
        // console.log("astModifiedDate: "+JSON.stringify(files.fileUploaded.lastModifiedDate));

        //Formidable changes the name of the uploaded file
        //Rename the file to its original name
        fs.rename(files.avatar.path, 'public/avatar/' + files.avatar.name, function(err) {
            if (err)
                throw err;
            console.log('renamed complete');
        });
        res.end();
    });
});

module.exports = router;
