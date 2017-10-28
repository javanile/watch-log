/*!
 * watch-log
 * Copyright(c) 2016-2017 Javanile.org
 * MIT Licensed
 */

var fs = require("fs"),
    path = require("path"),
    yaml = require("yamljs"),
    shell = require('shelljs'),
    util = require("./util.js");

var watch = require("chokidar").watch("file", {
    persistent: true,
    usePolling: true
});

var cols = process.stdout.columns;

module.exports = {

    /**
     * Working directory.
     *
     * @var string
     */
    cwd: process.cwd(),

    /**
     *
     */
    files: [],

    /**
     *
     */
    stats: {

    },

    /**
     *
     */
    slugs: {

    },

    /**
     *
     */
    prevSlug: null,

    /**
     *
     */
    configFile: null,

    /**
     *
     */
    options: null,

    /**
     * Start deamon.
     */
    start: function(options) {
        this.options = options;
        this.configFile = util.getOption(options, "config", path.join(this.cwd, ".debug.yml"));

        watch.add(this.configFile);

        var self = this,
            debugYml = yaml.load(this.configFile);

        if (util.isEmpty(debugYml, "watch-log")) {
            return util.error("no watch-log section on config file");
        }

        if (util.isEmpty(debugYml["watch-log"], "files")) {
            return util.error("no files on watch-log section");
        }

        this.files = debugYml["watch-log"]["files"];

        util.brandPad("start: " + util.short(new Date(), cols - 29) + "\n");
        util.writePad("config: " + util.short(this.configFile, cols - 29) + "\n");


        for (var i in this.files) {
            if (!this.files.hasOwnProperty(i)) { continue; }
            var name = this.files[i];
            var file = path.join(this.cwd, name);
            this.initStat(file);
            this.initSlug(file, name);
            util.writePad("file: " + util.short(name, cols - 29) + "\n");
            watch.add(file);
        }

        watch.on("change", function (file, stat) {
            if (file == self.configFile) {
                return self.changeConfig();
            }
            return self.changeLog(file, stat);
        });

        util.writePad("watching... ");
    },

    /**
     * Init file size on cache.
     *
     * @param file
     */
    initStat: function(file) {
        var self = this;
        if (!fs.existsSync(file)) {
            if (!fs.existsSync(path.dirname(file))) {
                shell.mkdir("-p", path.dirname(file));
            }
            fs.writeFileSync(file, "");
        }
        fs.stat(file, function(err, stat) {
            if (err) { return; }
            self.stats[file] = stat.size;
        });
    },

    /**
     * Init file size on cache.
     *
     * @param file
     */
    initSlug: function(file, name) {
        for (var f in this.slugs) {
            if (!this.slugs.hasOwnProperty(f)) { continue; }
            if (util.getSlug(name) == this.slugs[f].slug) {
                this.slugs[f].slug = util.getLongSlug(this.slugs[f].name);
                this.slugs[file] = {
                    name: name,
                    slug: util.getLongSlug(name)
                }
                return;
            }
        }
        this.slugs[file] = {
            name: name,
            slug: util.getSlug(name)
        };
    },

    /**
     * Handle config changes.
     *
     * @param name
     * @param stat
     * @private
     */
    changeConfig: function (file, stat) {
        this.prevSlug = null;
        watch.close();
        console.log("\n");
        this.start(this.options);
    },

    /**
     * Handle log file changes.
     *
     * @param name
     * @param stat
     * @private
     */
    changeLog: function (file, stat) {
        var rows = process.stdout.rows;

        if (typeof this.stats[file] === "number") {
            var diff = stat.size - this.stats[file];
            if (diff > 0) {
                this.diffLog(file, diff);
            } else {
                this.tailLog(file, rows);
            }
        } else {
            this.tailLog(file, rows);
        }

        this.stats[file] = stat.size;
    },

    /**
     * Print tail of file.
     *
     * @param filename
     * @param tail
     */
    tailLog: function(file, tail) {
        var self = this,
            rows = process.stdout.rows;

        util.tail(file, rows, function(err, lines) {
            if (err) { return console.log(err); }
            self.printLog(file, lines);
        })
    },

    /**
     * Print log with diff on file
     *
     * @param filename
     * @param diff
     */
    diffLog: function (file, diff) {
        var self = this,
            rows = process.stdout.rows;

        util.diff(file, diff, function(err, lines) {
            if (err) { return console.log(err); }
            self.printLog(file, lines.slice(0, rows));
        });
    },

    /**
     *
     * @param filename
     * @param lines
     */
    printLog: function (file, lines) {
        var rows = process.stdout.rows,
            slug = this.slugs[file].slug;

        var pad = util.pad(slug.length + 4);
        var max = cols - slug.length - 10;

        var log = [];
        for (var i in lines) {
            if (!lines.hasOwnProperty(i)) { continue; }
            var tabs = "";
            var line = lines[i];
            while (line.length > max) {
                var pos = util.lineBreak(line, max);
                var part = line.substr(0, pos + 1);
                line = line.substr(pos + 1);
                if (i == 0) { part = util.colorize(part); }
                log.push(tabs + part.trim());
                tabs = "   ";
            }
            line = line.trim();
            if (line.length > 0) {
                if (i == 0) { line = util.colorize(line); }
                log.push(tabs + line.trim());
            }
        }
        var msg = log.slice(0, rows).join("\n" + pad);
        var pre = slug === this.prevSlug ? "\n" : "\n\n";
        util.write(pre + util.colorKey(slug + ":") + " " + msg + " ");

        this.prevSlug = slug;
    }
};
