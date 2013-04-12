var fs = require('fs'),
    exifImage = require('exif').ExifImage,
    moment = require('moment');

var walkPath = './',
    processed = {};

var walk = function (dir, done) {
    fs.readdir(dir, function (error, list) {
        if (error) {
            return done(error);
        }

        var i = 0;

        (function next () {
            var file = list[i++];

            if (!file) {
                return done(null);
            }
            
            file = dir + '/' + file;
            
            fs.stat(file, function (error, stat) {
        
                if (stat && stat.isDirectory()) {
                    walk(file, function (error) {
                        next();
                    });
                } else {
                    // do stuff to file here
                    try {
                        new exifImage({ image : file }, function (error, image) {
                            if (error) {
                                console.log('Error: ' + error.message);
                            } else {
                                for (var i = 0; i < image.exif.length; i++) {
                                    var tag = image.exif[i];

                                    if (tag.tagName === 'DateTimeOriginal') {
                                        var dateTime = moment(tag.value, 'YYYY:MM:DD hh:mm:ss'),
                                            dateName = dateTime.format('YYYY-MM-DD');

                                        // see if another image on the same date was processed already
                                        if (processed[dateName]) {
                                            processed[dateName].count++;
                                            dateName = dateName + '---' + processed[dateName].count;
                                        } else {
                                            // save in processed
                                            processed[dateName] = {
                                                count: 1
                                            };
                                        }

                                        // add extension of file
                                        var newPath = dir + '/' + dateName + file.substr(file.lastIndexOf('.'));
                                        fs.renameSync(file, newPath);
                                        console.log(dateName);

                                        break;
                                    }
                                }
                            }
                        });
                    } catch (error) {
                        console.log('Error: ' + error);
                    }

                    next();
                }
            });
        })();
    });
};

process.argv.forEach(function (val, index, array) {
    if (val.indexOf('source') !== -1) {
        walkPath = val.split('=')[1];
    }
});

console.log('-------------------------------------------------------------');
console.log('processing...');
console.log('-------------------------------------------------------------');

walk(walkPath, function(error) {
    if (error) {
        throw error;
    } else {
        console.log('-------------------------------------------------------------');
        console.log('finished.');
        console.log('-------------------------------------------------------------');
    }
});