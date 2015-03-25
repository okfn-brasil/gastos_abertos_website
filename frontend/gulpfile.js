'use strict';

var gulp = require('gulp'),
  sass = require('gulp-sass'),
  autoprefixer = require('gulp-autoprefixer'),
  sourcemaps = require('gulp-sourcemaps'),
  runSequence = require('run-sequence'),
  riot = require('gulp-riot'),
  karma = require('karma').server,
  bower = require('main-bower-files'),
  bowerNormalizer = require('gulp-bower-normalize'),
  dest = '../static',
  src = './src';

gulp.task('riotjs', function() {
  return gulp.src(src + '/**/*.tag')
    .pipe(riot())
    .pipe(gulp.dest(dest))
});

gulp.task('vendor', function() {
    return gulp.src(bower(), {base: './bower_components'})
        .pipe(bowerNormalizer({bowerJson: './bower.json'}))
        .pipe(gulp.dest(dest + '/vendor/'))
});

gulp.task('sass', function() {
  return gulp.src(src + '/scss/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({errLogToConsole: true}))
    .pipe(autoprefixer({cascade: false, browsers: ['last 2 versions']}))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(dest + '/css'));
});

gulp.task('copy', function() {
  gulp.src(src + '/**/*.js')
    .pipe(gulp.dest(dest));

  gulp.src('bower_components/gastos_abertos_interface_module_example/dist/js/example/**/*')
    .pipe(gulp.dest(dest + '/vendor/gastos_abertos_interface_module_example/'));

  gulp.src(src + '/favicon.ico')
    .pipe(gulp.dest(dest));
});

gulp.task('build', function () {
  runSequence('riotjs', 'vendor', 'sass', 'copy', function() {
    console.log('js and css build');
  });
});

gulp.task('watch', function() {
  gulp.watch('src/**/*.*', ['build']);
});

gulp.task('server', ['build', 'watch']);

function startKarma(done, singleRun) {
  karma.start({
    configFile: __dirname + '/karma.conf.js',
    singleRun: singleRun
  }, function(exitStatus){
    done(exitStatus ? "There are failing unit tests" : undefined);
  });
}

gulp.task('test', function (done) {
  startKarma(done, true);
});

gulp.task('tdd', function (done) {
  startKarma(done, false);
});
