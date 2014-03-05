var operation = require('plumber').operation;
var Report = require('plumber').Report;

var tinylr = require('tiny-lr');

// TODO: take options (port, ssl)
module.exports = function() {
    // TODO: lazy initialise when needed only
    var port = 35729;
    var server;

    return operation(function(reports) {
        if (! server) {
            server = tinylr({port: port});
            server.server.removeAllListeners('error');
            server.server.on('error', function(err) {
                if (err.code === 'EADDRINUSE') {
                    console.error('Port ' + port + ' is already in use by another process.');
                } else {
                    console.error(err);
                }
                process.exit(1);
            });
            server.listen(port, function(err) {
                if (err) { return console.error(err); }
                console.log('Live reload server started on port: ' + port);
            });
        }

        return reports.collect().map(function(reports) {
            var r = reports.filter(Report.isReport);

        // FIXME: filter reports only
        if (r.length > 1) {
            var files = r.filter(function (report) {
                // Filter out source maps — LiveReload will refresh the whole
                // page when it detects a non-CSS file.
                // FIXME: Add API for detecting source map reports.
                return ! report.path.filename().match(/\.map$/);
            }).map(function(report) {
                return report.path.absolute();
            });
            // TODO: append as report
            console.log('Live reloading ' + files.length + ' files...');
            server.changed({body: {files: files}});
        }

        // TODO: return reload report? avoid output?
        return reports;

        });
    });
};
