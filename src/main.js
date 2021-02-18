require('dotenv').config();
const FetchService = require('./services/fetch.service');
const ParserService = require('./services/parser.service');
const FileService = require('./services/file.service');

const fetch = new FetchService();
const parser = new ParserService();
const file = new FileService();

// fetch.wikiPageIds({}).then(pageids => fetch.wikiPages({pageids}).then(console.log));
// 10265: ahrim's staff
// 65179: abyssal dagger
fetch
    .wikiPages({pageids: [65179]})
    .then(pages => pages.forEach(page => parser.parseWikiPage(page.title, page.content)));

// fetch.wikiWeaponTypes({})
//     .then(page => file.writeObj('combat_styles.json', parser.parseCombatStyles(page.content)));
