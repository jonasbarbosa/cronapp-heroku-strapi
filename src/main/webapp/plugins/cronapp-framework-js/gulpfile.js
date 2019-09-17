var gulp = require('gulp'),
  autoprefixer = require('gulp-autoprefixer'),
  uglify = require('gulp-uglify'),
  rename = require('gulp-rename'),
  notify = require('gulp-notify'),
  uglifycss = require('gulp-uglifycss'),
  imagemin = require('gulp-imagemin'),
  htmlmin = require('gulp-htmlmin'),
  ngAnnotate = require('gulp-ng-annotate'),
  minify = require("gulp-babel-minify");
gulp.task('minify-js', function() {
  return gulp.src(['js/**'])
  	.pipe(ngAnnotate())
    	.pipe(minify({
	      mangle: {
		keepClassName: true
	      }
	    }))
    .pipe(gulp.dest('dist/js/'));
});

gulp.task('minify-css', function() {
  return gulp.src(['css/app.css', 'css/cronos-bootstrap.css', 'css/cronos-template.css', 'css/cronos.css'])
    .pipe(uglifycss())
    .pipe(gulp.dest('dist/css/'));
});

gulp.task('minify-img', function() {
  return gulp.src('img/**')
    .pipe(imagemin({
      optimizationLevel: 5,
      progressive: true,
      interlaced: true
    }))
    .pipe(gulp.dest('dist/img/'));
});

gulp.task('minify-components-css', function() {
  return gulp.src(['components/css/**'])
    .pipe(uglifycss())
    .pipe(gulp.dest('dist/components/css/'));
});

gulp.task('minify-components-js', function() {
  return gulp.src(['components/js/**'])
    .pipe(uglify())
    .pipe(gulp.dest('dist/components/js/'));
});

gulp.task('minify-components-templates', function() {
  return gulp.src(['components/templates/**'])
    .pipe(htmlmin({
      collapseWhitespace: true
    }))
    .pipe(gulp.dest('dist/components/templates/'));
});

gulp.task('minify-components-report', function() {
  return gulp.src(['components/reports/**'])
    .pipe(htmlmin({
      collapseWhitespace: true
    }))
    .pipe(gulp.dest('dist/components/reports/'));
});

gulp.task('i18n', function() {
  return gulp.src('i18n/**').pipe(gulp.dest('dist/i18n/'));
});

gulp.task('build', [
  'minify-js',
  'minify-css',
  'minify-img',
  'minify-components-css',
  'minify-components-js',
  'minify-components-templates',
  'minify-components-report',
  'i18n'
]);

gulp.task('default', ['build']);
