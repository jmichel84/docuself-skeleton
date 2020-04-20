const gulp = require('gulp');
const connect = require('gulp-connect');
const terser = require('gulp-terser');
const jsonminify = require('gulp-jsonminify');
const htmlmin = require('gulp-htmlmin');
const nunjucks = require('gulp-nunjucks');
const jsonschema = require("gulp-json-schema");
const rename = require("gulp-rename");
const filter = require('gulp-filter');
const replace = require('gulp-replace');
const clean = require('gulp-clean');
const argv = require('yargs').argv;

const port = argv.port||9100;
const subdomain = argv.subdomain;
if(!subdomain) throw('You must specify a site subdomain as parameter.');
const scriptdomain = argv['script-domain']||`https://${subdomain}.docuself.com`;

const cors = (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  next();
};

gulp.task('connect', () => {
  return connect.server({
    port: port,
    livereload: true,
    root: 'dist/',
    fallback: 'dist/index.html',
    middleware: () => { return [cors]; }
  })
});

gulp.task('reload', () =>
  gulp.src('dist/index.html')
  .pipe(connect.reload())
);

gulp.task('clean-dist', () =>
  gulp.src('dist', {read: false, allowEmpty: true})
  .pipe(clean())
);

gulp.task('build-index', () =>
  gulp.src('index.html')
  .pipe(replace(/{{port}}/g, port))
  .pipe(replace(/{{subdomain}}/g, subdomain))
  .pipe(replace(/{{scriptdomain}}/g, scriptdomain))
  .pipe(htmlmin({ collapseWhitespace: true, minifyCSS: true, removeComments: true }))
  .pipe(gulp.dest('dist'))
);

gulp.task('build-config', () =>
  gulp.src('configs.json')
  .pipe(jsonschema("schema.json"))
  .pipe(jsonminify())
  .pipe(gulp.dest(`dist/${subdomain}`))
);

gulp.task('build-template', () => {
  const htmlFilter = filter('**/*.html', {restore: true});
  const jsFilter = filter('**/*.js', {restore: true});
  const njkFilter = filter('**/*.njk', {restore: true});
  return gulp.src('templates/*')
  .pipe(htmlFilter)
  .pipe(htmlmin({ collapseWhitespace: true, minifyCSS: true, removeComments: true }))
  .pipe(htmlFilter.restore)
  .pipe(jsFilter)
  .pipe(terser())
  .pipe(jsFilter.restore)
  .pipe(njkFilter)
  .pipe(nunjucks.precompile())
  .pipe(terser())
  .pipe(rename((path) => { path.extname = ".njk.js"; }))
  .pipe(njkFilter.restore)
  .pipe(gulp.dest(`dist/${subdomain}/templates`))
});

gulp.task('build-resources', () =>
  gulp.src('resources/*.json')
  .pipe(jsonminify())
  .pipe(gulp.dest(`dist/${subdomain}/resources`))
);

gulp.task('watch', (done) => {
  gulp.watch('configs.json', gulp.series('build-config', 'reload'));
  gulp.watch('templates/*', gulp.series('build-template', 'reload'));
  gulp.watch('resources/*.json', gulp.series('build-resources', 'reload'));
  done();
});

gulp.task('build', gulp.parallel(
  'build-index',
  'build-config',
  'build-template',
  'build-resources'
));

gulp.task('default', gulp.series('clean-dist', 'build', 'watch', 'connect'));
