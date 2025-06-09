import { PuppeteerCrawler, Dataset } from 'crawlee';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const startUrls = [
    'https://www.insolvenzbekanntmachungen.de/cgi-bin/bl_suche.pl?Gericht=Hamburg&Suchart=einfach&Dateiart=er&Seite=1'
];

const crawler = new PuppeteerCrawler({
    launchContext: {
        launcher: puppeteer,
        launchOptions: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
    },
    // Anti-Bot-Strategien aktivieren
    preNavigationHooks: [
        async ({ page }) => {
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
            await page.setExtraHTTPHeaders({
                'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
            });
        },
    ],
    requestHandler: async ({ request, page, log }) => {
        log.info(`📄 Crawling ${request.url}`);

        // kleine Wartezeit für menschliches Verhalten
        await page.waitForTimeout(2000);

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
    maxRequestRetries: 5,
    maxRequestsPerCrawl: 1,
    requestHandlerTimeoutSecs: 60,
});

await crawler.run(startUrls.map(url => ({ url })));
