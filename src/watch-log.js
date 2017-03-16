
var fs = require("fs");
var fw = require("chokidar").watch("all", {
    persistent: true,
    usePolling: true
});

var nuol = 6;
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
    stats: {

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

        process.stdout.write("npm watch-log: watching... ");

        //
        var self = this;
        for (var i in this.watch.files) {
            var file = base + "/" + this.watch.files[i];
            fw.add(file);
            this.initStat(file);
        }

        fw.on("change", function (name, stat) {
            if (typeof self.stats[name] === "number") {
                var diff = stat.size - self.stats[name];
                if (diff > 0) {
                    self.diffLog(name, diff);
                } else {
                    self.tailLog(name, nuol);
                }
            } else {
                self.tailLog(name, nuol);
            }

            self.stats[name] = stat.size;
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
        var self = this;
        this.tail(filename, nuol, function(err, lines) {
            if (err) { return console.log(err); }
            self.print(filename, lines);
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
        var self = this;
        this.diff(filename, diff, function(err, lines) {
            if (err) { return console.log(err); }
            self.print(filename, lines.slice(0, nuol));
        });
    },

    /**
     *
     * @param len
     * @returns {string}
     */
    pad: function (len) {
        var pad = "";
        for (var i=0; i<len; i++) {
            pad += " ";
        }
        return pad;
    },

    /**
     *
     * @param filename
     * @param lines
     */
    print: function (filename, lines) {
        var limit = 110;
        var breaks = ";,:/>\\";
        var logLines = [];
        for (var i in lines) {
            var tabs = "";
            var line = lines[i];
            while (line.length > limit) {
                var pos = limit + 30;
                for (var j in breaks) {
                    var p = line.indexOf(breaks[j], limit);
                    if (p !== -1 && p < pos) { pos = p; }
                }
                var part = line.substr(0, pos + 1);
                line = line.substr(pos + 1);
                logLines.push(tabs + part.trim());
                tabs = "    ";
            }
            logLines.push(tabs + line.trim());
        }
        var key = path.basename(filename, ".log").toUpperCase();
        var pad = this.pad(key.length + 4);
        var msg = key + " >  " + logLines.join("\n" + pad);
        process.stdout.write("\n" + msg + " ");
    },

    /**
     *
     * @param file
     */
    initStat: function(file) {
        var self = this;
        fs.stat(file, function(err, stat) {
            //if (err) { return; }
            self.stats[file] = stat.size;
        });
    }
};
