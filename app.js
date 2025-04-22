const express = require("express");
const puppeteer = require("puppeteer");
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_SCROLL_TIMES = 20;
const TIMEOUT_GO_TO_PAGE = 60000;
const TIMEOUT_TO_SLEEP_WHEN_SCROLL = 1500;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.use(express.json());

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

app.post("/crawl-linkedin-group", async (req, res) => {
  const { linkedin_group_url, li_at_cookie, scroll_times = MAX_SCROLL_TIMES } = req.body;

  if (!linkedin_group_url || !li_at_cookie) {
    return res.status(400).json({ error: "Missing required fields: linkedin_group_url and li_at_cookie" });
  }

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: 'new', // or true depending on your version
      slowMo: 10,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
        '--single-process',
        "--window-size=1920,1080"
      ]
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
    
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

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
          author: author?.innerText?.trim() || "",
          content: content?.innerText?.trim() || "",
        };
      });
    });
    
    if (posts.length === 0) {
      return res.status(404).json({ error: "No posts found" });
    }
    
    const ONE_HOUR_IN_MS = 60 * 60 * 1000;

    for (const post of posts) {
      // Check if this author has posted in the last 60 minutes
      const { data: recentPosts, error } = await supabase
        .from("posts")
        .select("created_at")
        .eq("author", post.author)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("❌ Error checking existing posts:", error);
        continue;
      }

      if (recentPosts.length > 0) {
        const lastPostTime = new Date(recentPosts[0].created_at).getTime();
        const now = Date.now();
        const diffMs = now - lastPostTime;

        if (diffMs < ONE_HOUR_IN_MS) {
          console.log(`⏭️ Skipping: ${post.author} posted ${Math.floor(diffMs / 60000)} minutes ago`);
          continue; // Skip inserting
        }
      }

      // Insert the post
      const { error: insertError } = await supabase
        .from("posts")
        .insert({
          author: post.author,
          content: post.content
        });

      if (insertError) {
        res.status(500).json({ error: "Something went wrong", detail: "Insert error: " + insertError });
      } else {
        console.log(`✅ Inserted post by ${post.author}`);
      }
    }

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
