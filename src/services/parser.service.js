const wikiMediaParser = require('wtf_wikipedia');
const util = require('./util.service');

class ParserService {
    parseWikiPage(title, content) {
        console.log(`Processing: ${title}`);
        const items = {};
        const doc = wikiMediaParser(content);
        const infoboxes = doc.infoboxes();
        const itemInfobox = infoboxes.find(i => i._type === 'item');
        const bonusesInfobox = infoboxes.find(i => i._type === 'bonuses');
        const itemInfoboxVersions = this.extractInfoboxVersions(itemInfobox);
        const bonusesInfoboxVersions = this.extractInfoboxVersions(bonusesInfobox);

        if (itemInfoboxVersions.length === 1) {
            // there is only one base version
        } else {
            for (let i = 1, len = itemInfoboxVersions.length; i < len; i++) {
                let itemIB = { ...itemInfoboxVersions[0], ...itemInfoboxVersions[i]};
                let bonusesIB;
                if (itemIB.hasOwnProperty('equipable') && util.parseBoolean(itemIB.equipable) && !(itemIB.hasOwnProperty('swmname') && itemIB.smwname === '(broken)')) {
                    if (itemIB.hasOwnProperty('version')) {
                        if (bonusesInfoboxVersions.length > 1) {
                            const foundBonusesVersion = bonusesInfoboxVersions.find(bversion => bversion.version === itemIB.version);
                            if (!foundBonusesVersion) {
                                console.warn(`${itemIB.name} is displaying weird behaviour.`)
                            } else {
                                bonusesIB = {...bonusesInfoboxVersions[0], ...foundBonusesVersion}
                            }
                        } else {
                            bonusesIB = bonusesInfoboxVersions[0];
                        }
                    }

                }
            }
        }

        return items;
    }

    extractInfoboxVersions(infobox) {
        const {data} = infobox;
        const regex = /^(.+?)([0-9]+)?$/;
        const versions = [];
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                let matches = key.match(regex);
                let actualKey = matches[1];
                let version = matches[2] || 0;
                if (version !== undefined) {
                    if (versions[version] === undefined) {
                        versions[version] = {};
                    }
                    versions[version][actualKey] = data[key];
                }
            }
        }
        return versions;
    }

    parseCombatStyles(content) {
        console.log(`Processing: combat styles`);
        const result = {};
        const doc = wikiMediaParser(content);
        const tables = doc.tables();
        for (let i = 0, len = tables.length; i < len; i++) {
            const table = tables[i].data;
            const weaponType = this.parseCombatStylesColumnWeaponType(table);
            result[weaponType] = this.parseCombatStylesOtherColumns(table);
        }
        return result;
    }

    parseCombatStylesColumnCount(table) {
        const firstRow = table[0];
        let count = 0;
        for (let col in firstRow) {
            if (firstRow.hasOwnProperty(col) && col.startsWith('col')) {
                count++;
            }
        }
        return count;
    }

    // the first column contains the name of the weapon type
    parseCombatStylesColumnWeaponType(table) {
        const combatStyleRegex = /^.*:CombatStyles(.+)\..*$/;
        const cellText = this.getValueFromTable(table, 0, 0);
        const regexResult = cellText.match(combatStyleRegex);
        return regexResult[1].trim().toLowerCase();
    }

    parseCombatStylesOtherColumns(table) {
        const result = {};
        const rowCount = table.length;
        const colCount = this.parseCombatStylesColumnCount(table);

        // i = 1; skip first column and j = 1; skip first row
        for (let i = 1; i < rowCount; i++) {
            let combatStyle = 'unknown';
            for (let j = 1; j < colCount; j++) {
                let header = this.getValueFromTable(table, 0, j).replace(' ', '_').toLowerCase();
                if (header === 'combat_style') {
                    combatStyle = this.getValueFromTable(table, i, j).toLowerCase();
                    result[combatStyle] = {}
                } else {
                    result[combatStyle][header] = this.getValueFromTable(table, i, j).toLowerCase();
                }
            }
        }
        return result;
    }

    // row and col are zero indexed
    getValueFromTable(table, row, col) {
        const rowCount = table.length;
        const colCount = this.parseCombatStylesColumnCount(table);
        if (row >= rowCount || col >= colCount) {
            throw new Error('Invalid index');
        }
        return table[row][`col${++col}`].data.text;
    }
}

module.exports = ParserService;
