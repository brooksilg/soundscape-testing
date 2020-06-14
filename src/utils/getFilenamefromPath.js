module.exports = function(filepath) {
  return filepath.replace(/^.*[\\\/]/, '');
}
