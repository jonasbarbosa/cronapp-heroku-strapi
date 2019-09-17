var gulp = require('gulp'),
    autoprefixer = require('gulp-autoprefixer'),
    rename = require('gulp-rename'),
    notify = require('gulp-notify'),
    minify = require("gulp-babel-minify");

gulp.task('minify', function () {
    return gulp.src('cronapi.js')	
        .pipe(minify({
	      mangle: {
		keepClassName: true
	      }
	    }))
        .pipe(rename('cronapi.min.js'))
        .pipe(gulp.dest('dist/'));
});

gulp.task('i18n', function () {
    return gulp.src('i18n/').pipe(gulp.dest('i18n/'));
});

gulp.task('build', ['minify', 'i18n']);

gulp.task('default', ['build']);
