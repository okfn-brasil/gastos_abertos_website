var gulp = require('gulp'),
  less = require('gulp-less'),
  autoprefixer = require('gulp-autoprefixer'),
  sourcemaps = require('gulp-sourcemaps'),
  karma = require('karma').server
  dest = '../static',
  src = './src',
  config = {
    src: src + '/less/main.less',
    watch: [
      src + '/less/**'
    ],
    dest: dest
  },
  runSequence = require('run-sequence'),
  bower = require('main-bower-files'),
  bowerNormalizer = require('gulp-bower-normalize'),
  riot = require('gulp-riot');

gulp.task('less', function() {
  return gulp.src(config.src)
    .pipe(sourcemaps.init())
    .pipe(less())
    .pipe(autoprefixer({cascade: false, browsers: ['last 2 versions']}))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(config.dest + '/css'));
});

gulp.task('copy', function() {
    gulp.src(src + '/**/*.js')
        .pipe(gulp.dest(dest));

    gulp.src('bower_components/gastos_abertos_interface_module_example/dist/js/example/**/*')
        .pipe(gulp.dest(dest+'/vendor/gastos_abertos_interface_module_example/'));

    gulp.src(src + '/favicon.ico')
        .pipe(gulp.dest(dest));
});

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

gulp.task('build', function () {
  runSequence('riotjs', 'vendor', 'less', 'copy', function() {
    console.log('js and css build');
  });
});

gulp.task('test', function (done) {
  karma.start({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, function(exitStatus){
    done(exitStatus ? "There are failing unit tests" : undefined);
  });
});

gulp.task('server', ['build', 'watch']);

gulp.task('watch', function() {
    gulp.watch('src/**/*.*', ['build']);
});
