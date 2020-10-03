const fs = require('fs');

function writeFile(path, data, { rewrite = true } = {}) {
  if (fs.existsSync(path)) {
    if (rewrite) {
      fs.writeFileSync(path, data);
      return true;
    } else {
      return false;
    }
  } else {
    fs.writeFileSync(path, data);
    return true;
  }
}

function readFile(path, options = {}) {
  if (fs.existsSync(path)) {
    const buffer = fs.readFileSync(path);
    if (buffer) {
      if (options.toJson) {
        return buffer.toJSON();
      } else {
        return buffer.toString();
      }
    }
  } else {
    return null;
  }
}

module.exports = {
  readFile,
  writeFile,
};
