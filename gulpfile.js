const browserSync = require('browser-sync'),
    gulp = require('gulp'),
    fs = require('fs'),
    prefix = require('gulp-autoprefixer'),
    cssnano = require('gulp-cssnano'),
    sass = require('gulp-sass'),
    watch = require('gulp-watch'),
    runSequence = require('run-sequence'),
    notify = require('gulp-notify'),
    merge = require('merge-stream'),
    path = require('path'),
    spritesmith = require('gulp.spritesmith-multi'),
    sassGrapher = require('gulp-sass-grapher'),
    plumber = require('gulp-plumber'),
    errorHandler = require('gulp-plumber-error-handler'),
    reload = browserSync.reload;

gulp.task('browserSync', function() {
    browserSync.init({
        server: {
            baseDir: './'
        },
        reloadDelay: 100,
        reloadOnrestart: true,
        open: true
    });
});

gulp.task('styles', function() {
    return merge(
        gulp.src('sass/**/*.scss').pipe(
            sass({
                includePaths: 'sass'
            }).on('error', sass.logError)
        )
    )
        .pipe(prefix('last 2 version', '> 1%'), { cascade: true })
        .pipe(cssnano())
        .pipe(gulp.dest('css'))
        .pipe(reload({ stream: true }))
        .pipe(notify({ message: '<%= file.relative %> styles status: OK' }));
});

gulp.task('watch-styles', function() {
    var loadPaths = [path.resolve('sass')];
    sassGrapher.init('sass', { loadPaths: loadPaths });
    return watch('sass/**/*.scss', { base: path.resolve('sass') })
        .pipe(sassGrapher.ancestors())
        .pipe(sass({ includePath: loadPaths }).on('error', sass.logError))
        .pipe(prefix('last 8 version', '> 1%'), { cascade: true })
        .pipe(cssnano())
        .pipe(gulp.dest('css'))
        .pipe(reload({ stream: true }))
        .pipe(notify({ message: '<%= file.relative %> styles status: OK' }));
});

gulp.task('sprites', () => {
    const imgPath = './../assets/';
    const cssTemplate =
        'node_modules/spritesheet-templates/lib/templates/scss_retina.template.handlebars';
    const spriteData = gulp
        .src(['assets/icons/**/*.png', '!assets/icons/*.png'])
        .pipe(plumber({ errorHandler: errorHandler(`Error in 'sprites' task`) }))
        .pipe(
            spritesmith({
                spritesmith(options) {
                    options.imgPath = imgPath + options.imgName;
                    options.retinaImgPath = imgPath + options.retinaImgName;
                    options.cssName = '_' + options.cssName.replace(/\.css$/, '.scss');
                    options.cssFormat = 'scss';
                    options.cssTemplate = cssTemplate;
                    options.algorithm = 'binary-tree';
                    options.padding = 8;

                    return options;
                }
            })
        );

    const imgStream = spriteData.img.pipe(gulp.dest('assets/'));
    const styleStream = spriteData.css.pipe(gulp.dest('sass/sprites/'));

    return merge(imgStream, styleStream);
});

//default task
gulp.task('default', function(callback) {
    runSequence('styles', callback);
});

//Watch tasks
gulp.task('watch', function() {
    runSequence('browserSync', 'watch-styles');
    global.watch = true;
    gulp.watch(['index.html', 'sass'], ['watch-styles']).on('change', reload);
});
