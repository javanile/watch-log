
var fs = require("fs");
var fw = require("chokidar").watch("all", {
    persistent: true,
    usePolling: true
});

var path = require("path");
var base = process.cwd();
var file = base + "/watch.log.js";

module.exports = {

    /**
     *
     */
    watch: {
        files: [],
        folders: []
    },

    /**
     *
     */
    files: {

    },

    /**
     *
     * @param args
     */
    run: function(args) {
        var self = this;
        fs.stat(file, function(err, stat) {
            if(err == null) {
                require(file);
                self.start();
            } else if(err.code == 'ENOENT') {
                console.log("watch-log: config file not found.");
                process.exit();
            }
        });
    },

    /**
     *
     * @param files
     */
    files: function(files) {
        this.watch.files = this.watch.files.concat(files);
    },

    /**
     *
     */
    start: function() {

        //
        for (var i in this.watch.files) {
            var f = base + "/" + this.watch.files[i];
            fw.add(base + "/" + this.watch.files[i]);
        }

        //
        var self = this;
        fw.on("change", function (name, stat) {

            if (typeof self.files[name] === "number") {
                var diff = stat.size - self.files[name];
                if (diff > 0) {
                    self.diffLog(name, diff);
                } else {
                    self.tailLog(name, 5);
                }
            } else {
                self.tailLog(name, 5);
            }

            self.files[name] = stat.size;
        });
    },

    /**
     *
     * @param filename
     * @param line_no
     * @param callback
     */
    tail: function (filename, length, callback) {
        fs.readFile(filename, function (err, data) {
            if (err) throw err;
            var lines = data.toString("utf-8").trim().split("\n");
            callback(null, lines.slice(-length));
        });
    },

    /**
     *
     * @param filename
     * @param tail
     */
    tailLog: function(filename, tail) {
        this.tail(filename, 5, function(err, lines) {
            if (err) { return console.log(err); }
            var key = path.basename(filename, ".log");
            var msg = key + ": " + lines.join("\n - ");
            console.log(msg);
        })
    },

    /**
     *
     * @param filename
     * @param line_no
     * @param callback
     */
    diff: function (filename, diff, callback) {
        fs.readFile(filename, function (err, data) {
            if (err) throw err;
            var lines = data.toString('utf-8').substr(-diff).trim().split("\n");
            callback(null, lines);
        });
    },

    /**
     *
     * @param filename
     * @param diff
     */
    diffLog: function (filename, diff) {
        this.diff(filename, diff, function(err, lines) {
            if (err) { return console.log(err); }
            var key = path.basename(filename, ".log");
            var msg = key + ": " + lines.slice(0, 5).join("\n");
            console.log(msg);
        });
    }
};
