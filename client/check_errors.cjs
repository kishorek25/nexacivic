const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        
        page.on('console', msg => {
            if (msg.type() === 'error') console.error('BROWSER ERROR:', msg.text());
        });
        
        page.on('pageerror', error => {
            console.error('PAGE ERROR:', error.message);
        });

        // Navigate to the staff route as in the screenshot
        await page.goto('http://localhost:5173/staff', { waitUntil: 'networkidle0', timeout: 8000 });
        
        await browser.close();
    } catch (e) {
        console.error("Puppeteer failed:", e.message);
    }
})();
