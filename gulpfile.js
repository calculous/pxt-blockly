/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

var gulp = require('gulp');
var bump = require('gulp-bump');
var git = require('gulp-git');
var semver = require('semver');
var fs = require('fs');
var spawn = require('child_process').spawn;

var USE_PY_LAUNCHER = !!process.env["PXT_BLOCKLY_PY_LAUNCHER"];

function spawnPython(args, opts) {
	var cmd = 'python';
	if (USE_PY_LAUNCHER) {
		cmd = 'py';
		args.unshift('-2');
	}
	return spawn(cmd, args, opts);
}

// Default task
gulp.task("default", ["python-build-core"]);

gulp.task("python-build-core", function (cb) {
	console.info('Starting python build');
	var python = spawnPython(['build.py', 'core'], { stdio: 'inherit' });
	python.on('close', function (code) {
		console.log('python exited with code ' + code);
		cb(code);
	});
});

gulp.task("python-build", function (cb) {
	console.info('Starting python build');
	var python = spawnPython(['build.py', 'core'], { stdio: 'inherit' });
	python.on('close', function (code) {
		console.log('python exited with code ' + code);
		cb(code);
	});
});

gulp.task("python-build-all", function (cb) {
	console.info('Starting python build all');
	var python = spawnPython(['build.py'], { stdio: 'inherit' });
	python.on('close', function (code) {
		console.log('python exited with code ' + code);
		cb(code);
	});
});

gulp.task("generate-dts", function(cb) {
	console.info('Generate blockly.d.ts')
	var sh =spawn("sh", ["generate-dts.sh"], {
		cwd: "typings"
	})
	sh.on('close', function(code) {
		console.log('generate-dts exited with code ' + code);
		cb(code)
	})
})

function pxtPublishTask() {
	if (fs.existsSync('../pxt')) {
		pxtPublishTsTask();
		gulp.src('./blocks_compressed.js').pipe(gulp.dest('../pxt/webapp/public/blockly/'));
		gulp.src('./blockly_compressed.js').pipe(gulp.dest('../pxt/webapp/public/blockly/'));
		gulp.src('./msg/js/en.js').pipe(gulp.dest('../pxt/webapp/public/blockly/msg/js/'));
		gulp.src('./msg/json/en.json').pipe(gulp.dest('../pxt/webapp/public/blockly/msg/json/'));
		gulp.src('./media/**/*').pipe(gulp.dest('../pxt/webapp/public/blockly/media/'));
	}
}

function pxtPublishTsTask() {
	if (fs.existsSync('../pxt')) {
		gulp.src('./typings/blockly.d.ts').pipe(gulp.dest('../pxt/localtypings/'));
	}
}

gulp.task('build', ['python-build-core'], function (cb) {
	cb(0);
});

gulp.task('publish', ['python-build-core'], pxtPublishTask);

gulp.task('publishall', ['python-build-all'], pxtPublishTask);

gulp.task('publishts', ['generate-dts'], pxtPublishTsTask);

gulp.task('publishall-nobuild', [], pxtPublishTask);

gulp.task('bump', function (done) {
    var v = semver.inc(JSON.parse(fs.readFileSync('./package.json', 'utf8')).version, 'patch');
	gulp.src('./package.json')
		.pipe(bump({ "version": v }))
		.pipe(gulp.dest('./'));

    gulp.src('.')
        .pipe(git.add())
        .pipe(git.commit(v))
        .on('end', function () {
            git.tag('v' + v, v, function (error) {
                if (error) {
                  return done(error);
                }
                git.push('origin', '', {args: '--tags'}, done);
            })
        });
});
