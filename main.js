// main.js
import { PuppeteerCrawler, Dataset, ProxyConfiguration } from 'crawlee';
import puppeteer, { executablePath } from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const startUrls = [
    'https://www.insolvenzbekanntmachungen.de/cgi-bin/bl_suche.pl?Gericht=Hamburg&Suchart=einfach&Dateiart=er&Seite=1'
];

const proxyConfiguration = await ProxyConfiguration.create({
    groups: ['AUTO'] // oder 'RESIDENTIAL', falls verfügbar
});

const crawler = new PuppeteerCrawler({
    launchContext: {
        launcher: puppeteer,
        launchOptions: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            executablePath: executablePath(),
        },
    },
    proxyConfiguration,
    requestHandler: async ({ request, page, log }) => {
        log.info(`📄 Crawling ${request.url}`);

        await page.waitForSelector('tr');
        await page.mouse.move(200, 200);
        await page.mouse.wheel({ deltaY: 300 });
        await page.waitForTimeout(1000);

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
