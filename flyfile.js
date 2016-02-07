const config = require('./config.json');
const sync = require('browser-sync');
const reload = sync.reload;

let isProd = false;
let isWatch = false;
let isServer = false;

/**
 * Default Task: watch
 */
export default async function () {
	await this.start('watch');
}

/**
 * Run a dev server & Recompile when files change
 */
export async function watch() {
	isWatch = true;
	isProd = false;
	await this.start('clean');
	await this.watch(config.templates.src, 'templates');
	await this.watch(config.scripts.src, ['lint', 'scripts']);
	await this.watch(config.styles.src, 'styles');
	await this.watch(config.images.src, 'images');
	await this.watch(config.fonts.src, 'fonts');
	await this.watch(config.html.src, 'html');
	await this.start(['extras', 'serve']);
}

/**
 * Build the production files
 */
export async function build() {
	isProd = true;
	isWatch = false;
	await this.start('clean');
	await this.start(['lint', 'images', 'fonts', 'templates', 'styles', 'html', 'extras'], {parallel: true});
	await this.start(['scripts', 'rev'], {parallel: false});
}

// ###
// # Sub-Tasks
// ###

// Delete the output directories
export async function clean() {
	await this.clear('dist');
}

// Lint javascript
export async function lint() {
	await this.source(config.scripts.src).xo({
		globals: ['document', 'angular']
	});
}

// Copy all images, compress them, then send to dest
export async function images() {
	await this.source(config.images.src)
		.target(config.images.dest, {depth: 1});

	if (isWatch && isServer) {
		reload();
	}
}

// Copy all fonts, then send to dest
export async function fonts() {
	await this.source(config.fonts.src).target(config.fonts.dest);

	if (isWatch && isServer) {
		reload();
	}
}

// Move static HTML files to dist. If isProd, minify!
export async function html() {
	const dest = config.html.dest;

	await this.source(config.html.src).target(dest);

	if (isWatch && isServer) {
		reload();
	} else if (isProd) {
		await this.source(`${dest}/*.html`)
			.htmlmin({
				removeComments: true,
				collapseWhitespace: true,
				collapseBooleanAttributes: true,
				removeAttributeQuotes: true,
				removeRedundantAttributes: true,
				removeEmptyAttributes: true,
				removeScriptTypeAttributes: true,
				removeStyleLinkTypeAttributes: true,
				removeOptionalTags: true
			})
			.target(dest);
	}
}

// Copy other root-level files
export async function extras() {
	await this.source(config.extras.src).target(config.extras.dest);
}

// Compile scripts
export async function scripts() {
	await this.source(config.scripts.src)
		.babel({
			presets: ['es2015'],
			sourceMaps: !isProd
		})
		.concat('main.js')
		.target(config.scripts.dest);

	if (isWatch && isServer) {
		reload();
	} else if (isProd) {
		return await this.start('uglify');
	}
}

export async function templates() {
	await this.source(config.templates.src)
		.ngTemplates({
			standalone: true,
			moduleName: 'app.templates',
			transformUrl: (url) => url.replace('src/app/', '')
		})
		.target(config.templates.dest);
}

// minify & optimize production js files
export async function uglify() {
	await this.source(`${config.scripts.dest}/*.js`)
		.uglify({
			compress: {
				conditionals: true,
				comparisons: true,
				booleans: true,
				loops: true,
				join_vars: true,
				drop_console: true
			}
		})
		.target(config.scripts.dest);
}

// Compile & automatically prefix stylesheets
export async function styles() {
	await this
		.source(config.styles.src)
		.sass({
			outputStyle: 'compressed'
		})
		.autoprefixer({
			browsers: [
				'ie >= 10',
				'ie_mob >= 10',
				'ff >= 30',
				'chrome >= 34',
				'safari >= 7',
				'opera >= 23',
				'ios >= 7',
				'android >= 4.4',
				'bb >= 10'
			]
		})
		.concat('main.css')
		.target(config.styles.dest);

	if (isWatch && isServer) {
		reload();
	}
}

// Revision asset names (Cache-busting)
export async function rev() {
	const src = ['scripts', 'styles', 'images'].map(type => `${paths[type].dest}/**/*`);
	return this.source(src).rev({
		base: config.html.dest,
		replace: true
	});
}

// Launch loacl serve at develop directory
export async function serve() {
	isServer = true;

	sync({
		notify: false,
		logPrefix: 'Fly',
		server: {
			baseDir: config.html.dest
		}
	});
}
