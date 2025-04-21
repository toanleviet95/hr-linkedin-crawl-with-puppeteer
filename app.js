const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_SCROLL_TIMES = 20;
const TIMEOUT_GO_TO_PAGE = 60000;
const TIMEOUT_TO_SLEEP_WHEN_SCROLL = 1500;


app.use(express.json()); // for parsing application/json

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

app.post("/crawl-linkedin-group", async (req, res) => {
  const { linkedin_group_url, li_at_cookie, scroll_times = MAX_SCROLL_TIMES } = req.body;

  if (!linkedin_group_url || !li_at_cookie) {
    return res.status(400).json({ error: "Missing required fields: linkedin_group_url and li_at_cookie" });
  }

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 10,
      args: ["--no-sandbox", "--disable-setuid-sandbox", '--window-size=1920,1080'],
    });

    const page = await browser.newPage();
    
    await page.setViewport({
      width: 1920,
      height: 1080
    });

    await page.setCookie({
      name: "li_at",
      value: li_at_cookie,
      domain: ".linkedin.com",
      path: "/",
      httpOnly: true,
      secure: true,
    });

    await page.goto(linkedin_group_url, {
      waitUntil: "domcontentloaded",
      timeout: TIMEOUT_GO_TO_PAGE,
    });

    for (let i = 0; i < scroll_times; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });
      await sleep(TIMEOUT_TO_SLEEP_WHEN_SCROLL);
    }

    const posts = await page.evaluate(() => {
      const postElements = document.querySelectorAll("div.feed-shared-update-v2");

      return Array.from(postElements).map(post => {
        const content = post.querySelector("span.break-words");
        const author = post.querySelector("span.update-components-actor__title span.visually-hidden");

        return {
          author: author?.innerText?.trim() || "Unknown",
          text: content?.innerText?.trim() || "No content",
        };
      });
    });

    res.json({ success: true, posts });

  } catch (err) {
    console.error("Error crawling LinkedIn group:", err);
    res.status(500).json({ error: "Something went wrong", detail: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
