const axios = require('axios');

class FetchService {
    #baseWikiApiUrl = 'https://oldschool.runescape.wiki/api.php';
    #userAgent = 'ToolScape Wiki Scraper/1.0 (toolscape.github@gmail.com)';
    #wikiApi;

    constructor() {
        this.#wikiApi = axios.create({
            baseURL: this.#baseWikiApiUrl,
            timeout: 10000,
            headers: {'User-Agent': this.#userAgent}
        });
    }

    async wikiPageIds({action = 'query', list = 'categorymembers', cmlimit = 500, cmtitle = 'Category:Items', format = 'json', cmcontinue}) {
        try {
            const config = {
                url: '',
                params: {
                    action, list, cmlimit, cmtitle, format, cmcontinue
                }
            };
            console.log(`Fetching pageIds: ${this.#wikiApi.getUri(config)}`);
            let {data} = await this.#wikiApi.request(config);
            let morePageIds = [];
            if (data.hasOwnProperty('continue')) {
                morePageIds = await this.wikiPageIds({
                    action,
                    list,
                    cmlimit,
                    cmtitle,
                    format,
                    cmcontinue: data.continue.cmcontinue
                });
            }

            const pageIds = [];
            pageIds.push(...data.query[list].map(obj => obj.pageid));
            pageIds.push(...morePageIds);
            return pageIds;
        } catch (e) {
            console.error(`Something bad happened during fetching pageIds: ${e.message}`);
        }
    }

    async wikiPages({action = 'query', prop = 'revisions', rvprop = 'content', pageids, format = 'json'}) {
        try {
            const result = [];
            const copyOfPageIds = pageids.slice();
            const chunks = [];
            let chunkCounter = 0;
            while (copyOfPageIds.length > 0) {
                chunks[chunkCounter++] = copyOfPageIds.splice(0, 50);
            }
            for (let i = 0, len = chunks.length; i < len; i++) {
                const chunk = chunks[i];
                const config = {
                    url: '',
                    params: {
                        action, prop, rvprop, pageids: chunk.join('|'), format
                    }
                };
                console.log(`Fetching pages: ${this.#wikiApi.getUri(config)}`);
                const {data} = await this.#wikiApi.request(config);
                const {query: {pages}} = data;
                for (const pageId in pages) {
                    if (pages.hasOwnProperty(pageId)) {
                        const page = pages[pageId];
                        const pageObj = {
                            title: page.title,
                            content: page.revisions[0]['*']
                        };
                        result.push(pageObj);
                    }
                }
            }
            return result;
        } catch (e) {
            console.error(`Something bad happened while fetching pages: ${e.message}`)
        }
    }

    // https://oldschool.runescape.wiki/api.php?action=query&titles=Weapons/Types&prop=revisions&rvprop=content
    async wikiWeaponTypes({action = 'query', titles = 'Weapons/Types', prop = 'revisions', rvprop = 'content', format = 'json'}) {
        try {
            const config = {
                url: '',
                params: {
                    action, titles, format, prop, rvprop
                }
            };
            console.log(`Fetching combat styles template: ${this.#wikiApi.getUri(config)}`);
            const {data: {query: {pages}}} = await this.#wikiApi.request(config);
            for (const page in pages) {
                if (pages.hasOwnProperty(page)) {
                    const templateData = pages[page];
                    return {
                        title: templateData.title,
                        content: templateData.revisions[0]['*']
                    };
                }
            }
        } catch (e) {
            console.error(`Something bad happened while fetching weapon types: ${e.message}`);
        }
    }
}

module.exports = FetchService;
