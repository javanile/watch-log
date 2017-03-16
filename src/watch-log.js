
var fs = require('fs');

var base = process.cwd();
var file = base + "/watch.log.js";

module.exports = {
    run: function(args) {
        fs.stat(file, function(err, stat) {
            if(err == null) {
                require(file);
            } else if(err.code == 'ENOENT') {
                console.log("watch-log: config file not found.");
            }
        });
    }
}


