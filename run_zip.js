
var gulp = require('gulp'),
vfs = require('vinyl-fs'),
zip = require('gulp-zip');

vfs.src(['*.js', '*.json', 'node_modules/**/*'],{cwd:'./src', base:'./src'})
.pipe(zip('spotinst.zip'))
.pipe(gulp.dest('.'))
.on('end', function(err, data) {
  if (err)  console.log("failed : " + err);
  else console.log('completed');
});
