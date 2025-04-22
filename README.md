# LinkedIn Group Crawler API

An Express + Puppeteer-based API to crawl posts from a LinkedIn Group using a valid login cookie (`li_at`).

---

## 🚀 Features

- Accepts `POST` request with group URL and `li_at` cookie.
- Automatically scrolls the page to load more posts.
- Returns a list of posts with author and content.

---

## 📦 Installation

```bash
git clone https://github.com/yourusername/linkedin-group-crawler.git
cd hr-linkedin-crawl-with-puppeteer

# Install dependencies
npm install
```

## 📦 Running

```bash
node app.js
```

## Structure

.
├── server.js           # Express API + Puppeteer logic
├── package.json
└── README.md

## Usage

`POST /crawl-linkedin-group`

```bash
{
  "LINKEDIN_GROUP_URL": "your_linkedin_group_url",
  "LI_AT_COOKIE": "your_li_at_cookie_here"
}
```

```bash
{
  "success": true,
  "posts": [
    {
      "author": "John Doe",
      "text": "Sharing highlights from last week's tech meetup..."
    },
    {
      "author": "Jane Smith",
      "text": "We're hiring frontend developers at ABC Corp..."
    }
  ]
}
```
