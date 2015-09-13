#!/usr/bin/env node

var fs = require('fs'),
    Firebase = require('firebase'),
    argv = require('minimist')(process.argv.slice(2)),
    colors = require('colors');

if (!argv.firebase) console.warn("Please specify a Firebase with --firebase");
if (!argv.path) {
  console.log('Assuming path /'.blue);
  argv.path = '/';
}
if (!argv.file) {
  argv.file = 'fire.json';
  console.log(('Assuming file ' + argv.file).blue);
}

if (argv.path[0] !== '/') argv.path = '/' + argv.path;

console.log('Firebase:', argv.firebase.green);
console.log('Path:', argv.path.green);

var rootRef = new Firebase(argv.firebase + '.firebaseio.com'),
    ref = rootRef.child(argv.path),
    last, readyToClose;

fs.writeFile(argv.file, "", function (err) {
  ref.on('value', function (snap) {
    last = snap.val();
    fs.writeFile(argv.file, JSON.stringify(snap.val(), null, 2), function (err) {
      if (err) throw err;
    });
  });

  fs.watchFile(argv.file, function (curr, prev) {
    fs.readFile(argv.file, function (err, data) {
      var data;

      if (err) {
        console.log('File deleted!')
        return process.exit(0);
      }

      try {
        data = JSON.parse(data.toString());
      } catch (e) {
        console.log(e.toString().red);
        return;
      }

      if (last == data) return;

      ref.set(data);
      console.log('Updating Firebase', new Date());
    });
  });

  process.on('exit', exitHandler.bind(null,{cleanup:true}));
  process.on('SIGINT', exitHandler.bind(null, {exit:true}));
});

function exitHandler(options, err) {
  if (!readyToClose)
    fs.unlinkSync(argv.file);

  readyToClose = true;
  if (options.cleanup) console.log('Cleaning up...'.blue);
  if (options.exit) process.exit();
}
