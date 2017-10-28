/*!
 * watch-log
 * Copyright(c) 2016-2017 Javanile.org
 * MIT Licensed
 */

var fs     = require("fs");
var path   = require("path");
var colors = require("colors/safe");

module.exports = {

    /**
     *
     * @param text
     * @private
     */
    write: function (text) {
        process.stdout.write(text);
    },

    /**
     *
     * @param text
     * @private
     */
    writePad: function (text) {
        this.write(this.pad(11) + text);
    },

    /**
     *
     * @param text
     * @private
     */
    brandPad: function (text) {
        this.write(this.colorKey("watch-log:") + " " + text);
    },

    /**
     * Basic tail function get line of file.
     *
     * @param filename
     * @param line_no
     * @param callback
     */
    tail: function (file, len, callback) {
        fs.readFile(file, function (err, data) {
            if (err) throw err;
            var lines = data.toString("utf-8").trim().split("\n");
            callback(null, lines.slice(-len));
        });
    },

    /**
     * Basic diff function.
     *
     * @param filename
     * @param line_no
     * @param callback
     */
    diff: function (file, len, callback) {
        fs.readFile(file, function (err, data) {
            if (err) throw err;
            var lines = data.toString('utf-8').substr(-len).trim().split("\n");
            callback(null, lines);
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
        for (var i = 0; i < len; i++) {
            pad += " ";
        }
        return pad;
    },

    /**
     * Get position to break string line.
     *
     * @param line
     * @returns {number}
     */
    lineBreak: function(line, max) {
        var sym = "-;,)]:> ";
        var wgt = [0,0,0,2,2,0,3,3];
        var breakPos = 0;
        var breakSym = null;
        for (var j in sym) {
            if (!sym.hasOwnProperty(j)) { continue; }
            var pos = line.indexOf(sym[j], max - 30);
            if (pos !== -1 && (pos - wgt[j]) > breakPos && pos < max) {
                breakSym = sym[j];
                breakPos = pos;
            }
        }
        if (breakSym === "-") { breakPos--; }
        return breakPos > 0 ? breakPos : max;
    },

    /**
     *
     * @param line
     */
    colorize: function (line) {
        var hot = line.match(/([^' ]+(\/[^:' ]+)+)/g);
        if (hot && hot.length > 0) {
            for (t in hot) {
                if (!hot.hasOwnProperty(t)) { continue; }
                line = line.replace(hot[t], colors.red.bold(hot[t]));
            }
        }
        var hot = line.match(/([^' ]+(\\[^:' ]+)+)/g);
        if (hot && hot.length > 0) {
            for (t in hot) {
                if (!hot.hasOwnProperty(t)) { continue; }
                line = line.replace(hot[t], colors.cyan.bold(hot[t]));
            }
        }
        return line;
    },

    /**
     *
     * @param text
     * @returns {*|string}
     */
    colorKey: function (text) {
        return colors.yellow.bold(text);
    },

    /**
     *
     * @param text
     * @param len
     * @returns {*}
     */
    short: function (text, len) {
        if (text.length > len) {
            return colors.blue("###" + text.substr(3 - len));
        }
        return colors.blue(text);
    },

    /**
     *
     * @param file
     * @returns {string}
     */
    getSlug: function (file) {
        return path.basename(file, ".log").toLowerCase();
    },

    /**
     *
     * @param file
     * @returns {string}
     */
    getLongSlug: function (file) {
        var dirname = path.dirname(file).toLowerCase();
        var basename = path.basename(file, ".log").toLowerCase();

        return dirname != "." ? dirname + "/" + basename : basename;
    },

    /**
     * Get option value.
     */
    getOption: function (options, key, defaults) {
        return typeof options[key] != "undefined" ? options[key] : defaults;
    },

    /**
     * Check if not a value.
     */
    isEmpty: function (options, key) {
        return typeof options[key] == "undefined" || !options[key];
    }
};
