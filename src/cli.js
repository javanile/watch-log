/*!
 * @module: watch-log
 * @file:   cli.js
 *
 * Copyright(c) 2016-2017 Javanile.org
 * MIT Licensed
 */

var fs     = require("fs");
var base   = process.cwd();
var config = base + "/watch.log.js";

module.exports = {

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
    }
};
