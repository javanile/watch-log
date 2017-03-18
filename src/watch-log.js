/*!
 * @module: watch-log
 * @file:   watch-log.js
 *
 * Copyright(c) 2016-2017 Javanile.org
 * MIT Licensed
 */

var ut = require("./utils.js");
var fs = require("fs");
var fw = require("chokidar").watch("all", {
    persistent: true,
    usePolling: true
});

var path = require("path");
var base = process.cwd();
var rows = process.stdout.rows;
var cols = process.stdout.columns;

var config = base + "/watch.log.js";

module.exports = {

    /**
     *
     */
    _watch: {
        files: [],
        folders: []
    },

    /**
     *
     */
    _stats: {

    },

    /**
     *
     */
    _prevKey: null,

    /**
     *
     * @param args
     */
    parseArgs: function(args) {
        if (args[0] === "--version") {
            var package = JSON.parse(fs.readFileSync(__dirname + "/../package.json"), "utf8");
            ut.write("watch-log@" + package.version + "\n");
            process.exit();
        }
    },

    /**
     *
     */
    checkConfig() {
        if (!fs.existsSync(config)) {
            ut.brandPad("Config file 'watch.log.js' not found.\n");
            process.exit();
        }
        return config;
    },

    /**
     *
     * @param files
     */
    files: function(files) {
        this._watch.files = this._watch.files.concat(files);
    },

    /**
     *
     * @param config
     */
    start: function() {
        ut.brandPad("Config file: '" + ut.short(config, cols - 29) + "'\n");
        for (var i in this._watch.files) {
            if (!this._watch.files.hasOwnProperty(i)) { continue; }
            var file = base + "/" + this._watch.files[i];
            this._initStat(file);
            ut.writePad("Adding file: '" + ut.short(file, cols - 29) + "'\n");
            fw.add(file);
        }
        var self = this;
        fw.on("change", function (file, stat) {
            self._change(file, stat);
        });
        ut.writePad("Watching... ");
    },

    /**
     * Init file size on cache.
     *
     * @param file
     */
    _initStat: function(file) {
        var self = this;
        fs.stat(file, function(err, stat) {
            if (err) { return; }
            self._stats[file] = stat.size;
        });
    },

    /**
     * Handle log file changes.
     *
     * @param name
     * @param stat
     * @private
     */
    _change: function (file, stat) {
        if (typeof this._stats[file] === "number") {
            var diff = stat.size - this._stats[file];
            if (diff > 0) {
                this._diffLog(file, diff);
            } else {
                this._tailLog(file, rows);
            }
        } else {
            this._tailLog(file, rows);
        }
        this._stats[file] = stat.size;
    },

    /**
     * Print tail of file.
     *
     * @param filename
     * @param tail
     */
    _tailLog: function(file, tail) {
        var self = this;
        ut.tail(file, rows, function(err, lines) {
            if (err) { return console.log(err); }
            self.print(file, lines);
        })
    },

    /**
     * Print log with diff on file
     *
     * @param filename
     * @param diff
     */
    _diffLog: function (file, diff) {
        var self = this;
        ut.diff(file, diff, function(err, lines) {
            if (err) { return console.log(err); }
            self._printLog(file, lines.slice(0, rows));
        });
    },

    /**
     *
     * @param filename
     * @param lines
     */
    _printLog: function (file, lines) {
        var key = ut.getKey(file);
        var pad = ut.pad(key.length + 4);
        var max = cols - key.length - 10;
        var log = [];
        for (var i in lines) {
            if (!lines.hasOwnProperty(i)) { continue; }
            var tabs = "";
            var line = lines[i];
            while (line.length > max) {
                var pos = ut.lineBreak(line, max);
                var part = line.substr(0, pos + 1);
                line = line.substr(pos + 1);
                if (i == 0) { part = ut.colorize(part); }
                log.push(tabs + part.trim());
                tabs = "   ";
            }
            line = line.trim();
            if (line.length > 0) {
                if (i == 0) { line = ut.colorize(line); }
                log.push(tabs + line.trim());
            }
        }
        var msg = log.slice(0, rows).join("\n" + pad);
        var pre = key === this.prevKey ? "\n" : "\n\n";
        ut.write(pre + ut.colorKey(key + " >") + "  " + msg + " ");
        this.prevKey = key;
    }
};
