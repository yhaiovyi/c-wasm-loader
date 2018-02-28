function getDependencies(content) {
  content.match(/#include\s+"[^"]+"/g);
}

module.exports = {
  getDependencies,
};
