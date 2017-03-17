/*!
 * watch-log
 * Copyright(c) 2016-2017 Javanile.org
 * MIT Licensed
 */

var fs = require("fs");
var fw = require("chokidar").watch("all", {
    persistent: true,
    usePolling: true
});

var colors = require('colors/safe');

var nuol = 8;
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
     */
    prevKey: null,

    /**
     *
     */
    limit: 110,

    /**
     *
     * @param args
     */
    run: function(args) {

        //
        if (args[0] === "--version") {
            var package = JSON.parse(fs.readFileSync(__dirname + "/../package.json"), "utf8");
            console.log("watch-log@" + package.version);
            process.exit();
        }

        //
        var self = this;
        fs.stat(file, function(err, stat) {
            if(err === null) {
                require(file);
                self.start(file);
            } else if(err.code === 'ENOENT') {
                console.error(
                    colors.yellow.bold("WATCH-LOG >") +
                    "  Config file 'watch.log.js' not found."
                );
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
     * @param config
     */
    start: function(config) {
        process.stdout.write(
            colors.yellow.bold("WATCH-LOG >") +
            "  Config file: '" + config + "'\n"
        );

        for (var i in this.watch.files) {
            if (!this.watch.files.hasOwnProperty(i)) { continue; }
            var file = base + "/" + this.watch.files[i];
            this.initStat(file);
            process.stdout.write("             Adding file: '"+file+"'\n");
            fw.add(file);
        }

        process.stdout.write("             Watching... ");

        //
        var self = this;
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
     * Basic tail function get line of file.
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
     * Print tail of file.
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
     * Basic diff function.
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
     * Print log with diff on file
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
     * Build a spaces padded string.
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
        var logLines = [];
        for (var i in lines) {

            if (!lines.hasOwnProperty(i)) { continue; }
            var tabs = "";
            var line = lines[i];
            while (line.length > this.limit) {
                var pos = this.linePos(line);
                var part = line.substr(0, pos + 1);
                line = line.substr(pos + 1);
                if (i == 0) { part = this.colorFiles(part); }
                logLines.push(tabs + part.trim());
                tabs = "    ";
            }
            line = line.trim();
            if (line.length > 0) {
                if (i == 0) { line = this.colorFiles(line); }
                logLines.push(tabs + line.trim());
            }
        }
        var key = path.basename(filename, ".log").toUpperCase();
        var pad = this.pad(key.length + 4);
        var msg = logLines.slice(0, nuol).join("\n" + pad);
        var pre = key === this.prevKey ? "\n" : "\n\n";
        process.stdout.write(pre + colors.yellow.bold(key + " >") + "  " + msg + " ");
        this.prevKey = key;
    },

    /**
     * Get position to break string line.
     *
     * @param line
     * @returns {number}
     */
    linePos: function(line) {
        var breaks = ";,)]:> ";
        var pos = this.limit + 30;
        for (var j in breaks) {
            if (!breaks.hasOwnProperty(j)) { continue; }
            var p = line.indexOf(breaks[j], this.limit);
            if (p !== -1 && p < pos) { pos = p; }
        }
        return pos;
    },

    /**
     * Init file size on cache.
     *
     * @param file
     */
    initStat: function(file) {
        var self = this;
        fs.stat(file, function(err, stat) {
            if (err) { return; }
            self.stats[file] = stat.size;
        });
    },

    /**
     *
     * @param line
     */
    colorFiles: function (line) {
        var hot = line.match(/([^' ]+(\/[^:' ]+)+)/g);
        if (hot && hot.length > 0) {
            for (t in hot) {
                if (hot.hasOwnProperty(t)) {
                    line = line.replace(hot[t], colors.red.bold(hot[t]));
                }
            }
        }
        var hot = line.match(/([^' ]+(\\[^:' ]+)+)/g);
        if (hot && hot.length > 0) {
            for (t in hot) {
                if (hot.hasOwnProperty(t)) {
                    line = line.replace(hot[t], colors.cyan.bold(hot[t]));
                }
            }
        }
        return line;
    }
};
