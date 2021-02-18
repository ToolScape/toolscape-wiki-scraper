class UtilService {
    static parseBoolean(str) {
        return str.toLowerCase() === 'yes';
    }

    static parseNumber(str) {
        let result = Number(str);
        if (isNaN(result)) {
            result = undefined;
        }
        return result;
    }
}

module.exports = UtilService;
