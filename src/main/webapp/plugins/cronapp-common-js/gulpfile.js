var gulp = require('gulp'),
  autoprefixer = require('gulp-autoprefixer'),
  uglify = require('gulp-uglify'),
  rename = require('gulp-rename'),
  notify = require('gulp-notify'),
  uglifycss = require('gulp-uglifycss'),
  imagemin = require('gulp-imagemin'),
  htmlmin = require('gulp-htmlmin')
  ngAnnotate = require('gulp-ng-annotate')
gulp.task('minify-js', function () {
    return gulp.src('js/**')
		.pipe(ngAnnotate())
        .pipe(uglify())
        .pipe(gulp.dest('dist/js/'));
});

gulp.task('build', ['minify-js']);

gulp.task('default', ['build']);