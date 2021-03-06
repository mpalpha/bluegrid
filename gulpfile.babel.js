//TODO:
// - Add source maps to docs file

// Release reminders
// gulp docs - releases docs
// 1. After any updates are made, commit and push live
// 2. gulp package - compiles usable code
// 3. gulp patch, feature, release - updates semver (you have to manually update meteor package)
// 4. git push --tags
// 5. npm publish and meteor publish

import gulp from 'gulp';
import del from 'del';
import browserSync from 'browser-sync';
const bsync = browserSync.create();
const reload = bsync.reload;
import runSequence from 'run-sequence';
import tag_version from 'gulp-tag-version';
import gulpLoadPlugins from 'gulp-load-plugins';
const $ = gulpLoadPlugins();


const dir = {
  src: './src',
  dest: './build',
  dist: './dist',
  sass: './bluegrid'
}

const stylePath = {
  src: `${dir.src}/styles`,
  dest: `${dir.dest}/css`,
  dist: `${dir.dist}`,
  sass: `${dir.sass}`
}

const scriptPath = {
  src: `${dir.src}/scripts`,
  dest: `${dir.dest}/js`
}

const imagePath = {
  src: `${dir.src}/images`,
  dest: `${dir.dest}/assets/images`
}

gulp.task('serve', function(cb) {
  bsync.init({
    server: { baseDir: dir.dest }
  });

  gulp.watch(`${stylePath.src}/**/*.scss`, ['compile:styles']);
  gulp.watch(`${scriptPath.src}/**/*.js`, ['compile:scripts']);
  gulp.watch(`${imagePath.src}/**/*`, ['compile:images']);
  gulp.watch(`${dir.src}/**/*.html`, ['compile:html']);
  cb();
});

gulp.task('clean', function(cb) {
  del.sync([`${dir.dest}/**`]);
  cb();
});

gulp.task('compile', function(cb) {
  // Move CNAME file over to build folder
  gulp.src(`${dir.src}/CNAME`)
  .pipe(gulp.dest(dir.dest));

  runSequence([
    'compile:html',
    'compile:images',
    'compile:scripts',
    'compile:styles'
  ], cb);
});

gulp.task('compile:styles', () => {
  return gulp.src(`${stylePath.src}/**/*.scss`)
  .pipe($.plumber())
  .pipe($.sass({outputStyle: 'compressed'}).on('error', $.sass.logError))
  .pipe($.autoprefixer({
    browsers: ['last 2 versions'],
    cascade: false
  }))
  .pipe(gulp.dest(stylePath.dest))
  .pipe(bsync.stream());
});

gulp.task('compile:scripts', () => {
  return gulp.src(`${scriptPath.src}/**/*.js`)
  .pipe($.plumber())
  .pipe($.uglify())
  .pipe(gulp.dest(scriptPath.dest))
  .pipe(bsync.stream());
});

gulp.task('compile:images', () => {
  return gulp.src(`${imagePath.src}/*`)
  .pipe($.plumber())
  .pipe($.size())
  .pipe(gulp.dest(imagePath.dest))
  .pipe(bsync.stream());
});

gulp.task('compile:html', () => {
  return gulp.src([`${dir.src}/*.html`])
  .pipe($.plumber())
  .pipe(gulp.dest(dir.dest))
  .pipe(bsync.stream());
});

gulp.task('package', function(cb) {
  runSequence('package:clean', ['package:dist', 'package:sass'], cb);
});

gulp.task('package:clean', function(cb) {
  del.sync([`${dir.dist}/**`, `${dir.sass}/**`]);
  cb();
});

gulp.task('package:sass', () => {
  return gulp.src([`${stylePath.src}/vendors/bluegrid/**`])
  .pipe(gulp.dest(`${dir.sass}`))
});

gulp.task('package:dist', () => {
  return gulp.src([`${stylePath.src}/vendors/bluegrid/_bluegrid.scss`])
  .pipe($.rename('main.scss')) // TODO: why is this necessary?
  .pipe($.sass({outputStyle: 'compressed'}))
  .pipe($.autoprefixer({
    browsers: ['last 2 versions'],
    cascade: false
  }))
  .pipe($.rename('bluegrid.min.css'))
  .pipe(gulp.dest(dir.dist))
});

function inc(importance) {
  return gulp.src(['./package.json'])
  .pipe($.bump({type: importance}))
  .pipe(gulp.dest('./'))
  .pipe($.git.commit('bumps package version'))
  .pipe($.filter('package.json'))
  .pipe(tag_version());
}

gulp.task('patch', () => inc('patch'));
gulp.task('feature', () => inc('minor'));
gulp.task('release', () => inc('major'));

gulp.task('build', function(cb) {
  runSequence('clean', ['compile', 'package'], cb);
});

gulp.task('docs', () => {
  return gulp.src(`${dir.dest}/**/*`)
  .pipe($.ghPages({force:true}));
});

gulp.task('default', function(cb) {
  runSequence('clean', ['compile', 'serve'], cb);
});
