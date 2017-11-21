/*!
 * watch-log
 * Copyright(c) 2016-2017 Javanile.org
 * MIT Licensed
 */

var fs = require("fs"),
    path = require("path"),
    yaml = require("yamljs"),
    wrap = require("wordwrap"),
    shell = require("shelljs"),
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
     * Watching files.
     *
     * @var array
     */
    files: [],

    /**
     * Watching files stats.
     *
     * @var object
     */
    stats: {

    },

    /**
     * Collect slugs of files.
     *
     * @var object
     */
    slugs: {

    },

    /**
     * Previsour slug.
     *
     * @var string
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
            var info = name;
            if (util.isEnabled(this.options, "showInfo")) {
                info += " (" + this.stats[file] + " byte)";
            }
            util.writePad("file: " + util.short(info, cols - 29) + "\n");
            watch.add(file);
        }

        watch.on("change", function (file, stat) {
            if (file == self.configFile) {
                return self.changeConfig();
            }
            return self.changeLog(file, stat);
        });

        if (util.isEnabled(this.options, "debug")) {
            watch.on("raw", function (event, path, details) {
                util.debug("watch(" + event + ")", path);
            });
        }

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

        var stat = fs.statSync(file);
        self.stats[file] = stat.size;
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
        var logs = [],
            rows = process.stdout.rows,
            slug = this.slugs[file].slug,
            cols = process.stdout.columns - slug.length - 6,
            span = util.pad(slug.length + 2);

        for (var i in lines) {
            if (!lines.hasOwnProperty(i)) { continue; }
            var raw = lines[i].split("\\n").join("\n");
            raw = raw.split("&quot;").join("'");
            var line = wrap(cols)(raw).split("\n");
            for (var j in line) {
                if (!line.hasOwnProperty(j)) { continue; }
                logs.push((j > 0 ? ".  " : "") + util.colorize(line[j].trim()));
            }
        }

        logs = logs.slice(0, rows).join("\n" + span);

        var newline = slug === this.prevSlug ? "\n" : "\n\n";

        util.write(newline + util.colorKey(slug + ":") + " " + logs + " ");

        this.prevSlug = slug;
    }
};
