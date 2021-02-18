const fs = require('fs');

class FileService {
    writeObj(filename, obj) {
        fs.writeFile(filename, JSON.stringify(obj), 'utf8', (err) => {});
    }
}

module.exports = FileService;
