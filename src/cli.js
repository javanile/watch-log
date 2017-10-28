/*!
 * watch-log
 * Copyright(c) 2016-2017 Javanile.org
 * MIT Licensed
 */

var fs = require("fs"),
    util = require("./util"),
    watch = require("./watch-log");

module.exports = {

    /**
     * Command line entry-point.
     *
     * @param args
     */
    run: function(args, callback) {
        if (args[0] === "--version") {
            var package = JSON.parse(fs.readFileSync(__dirname + "/../package.json"), "utf8");
            util.write("watch-log@" + package.version + "\n");
            process.exit();
        }

        var options = {};

        watch.start(options, callback);
    },

    /**
     *
     */
    loadConfig: function() {
        if (!fs.existsSync(config)) {
            util.brandPad("Config file 'watch.log.js' not found.\n");
            process.exit();
        }
        return config;
    }
};
