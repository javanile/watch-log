
var fs = require("fs");
var fw = require("watch-files");

var base = process.cwd();
var file = base + "/watch.log.js";

module.exports = {

    watch: {
        files: [],
        folders: []
    },

    run: function(args) {
        fs.stat(file, function(err, stat) {
            if(err == null) {
                require(file);
                this.start();
            } else if(err.code == 'ENOENT') {
                console.log("watch-log: config file not found.");
            }
        });
    },

    files: function(files) {
        this.watch.concat(files);
    },

    start: function() {

        for (var i in this.watch.files) {
            fw.add(this.watch.files[i]);
        }

        fw.on('change', function (stat) {
            console.log(stat);
        });

    }
}


