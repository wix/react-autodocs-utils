/* global Promise */
const {readFile, lstat} = require('fs');
const pathJoin = require('path').join;

const log = (...msgs) => fn => {
  console.log(...msgs);
  return fn;
};

const isDir = path =>
  new Promise((resolve, reject) =>
    lstat(path, (err, stats) =>
      err
        ? reject(new Error(`ERROR: Unable to get stats for ${path}`))
        : resolve(stats.isDirectory())
    )
  );

const readEntryFile = path =>
  isDir(path)
    .then(isDir =>
      new Promise((resolve, reject) =>
        readFile(
          isDir ? pathJoin(path, 'index.js') : path,
          'utf8',
          (err, data) => err ? reject(err) : resolve(data)
        )
      )
    );

module.exports = (path = '') =>
  path.length
    ? readEntryFile(path)
    : Promise.reject(new Error('ERROR: Missing required `path` argument'));
