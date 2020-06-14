/**
* Executes a shell command and return it as a Promise.
* @param cmd {string}
* @return {Promise<string>}
*/

module.exports = function(cmd) {
  // child_process.exec(command[, options][, callback])
  const exec = require('child_process').exec;
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.warn(error);
        console.warn(stderr);
        reject(error);
      }
      resolve(stdout);
    });
  });
}