import { PuppeteerCrawler, Dataset } from 'crawlee';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

const puppeteer = puppeteerExtra;
puppeteer.use(StealthPlugin());

const startUrls = [
    'https://www.insolvenzbekanntmachungen.de/cgi-bin/bl_suche.pl?Gericht=Hamburg&Suchart=einfach&Dateiart=er&Seite=1'
];

const crawler = new PuppeteerCrawler({
    launchContext: {
        launcher: puppeteer,
        launchOptions: {
            headless: true,
        },
    },
    requestHandler: async ({ request, page, log }) => {
        log.info(`📄 Crawling ${request.url}`);

        const rows = await page.$$eval('tr', trs =>
            trs.map(tr => {
                const cells = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim());
                const link = tr.querySelector('a')?.href || null;
                return [...cells, link];
            }).filter(r => r.length >= 6)
        );

        for (const row of rows) {
            await Dataset.pushData({
                Datum: row[0],
                Aktenzeichen: row[1],
                Gericht: row[2],
                Firmenname: row[3],
                Ort: row[4],
                HRB: row[5],
                Link: row[6],
            });
        }
    },
    maxRequestsPerCrawl: 1,
});

await crawler.run(startUrls.map(url => ({ url })));
