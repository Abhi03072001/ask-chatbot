import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0"
}

# -------------------------------
# 🧠 GET SITEMAP URLS
# -------------------------------
def get_sitemap_urls(sitemap_url):
    try:
        response = requests.get(sitemap_url, headers=HEADERS, timeout=10)
        soup = BeautifulSoup(response.content, "xml")

        urls = [loc.text for loc in soup.find_all("loc")]
        return urls

    except Exception as e:
        print("Sitemap Error:", e)
        return []


# -------------------------------
# 🔍 FILTER IMPORTANT URLS
# -------------------------------
def filter_urls(urls):
    allowed = []

    for url in urls:
        if any(x in url for x in [
            "/study",
            "/undergraduate",
            "/postgraduate",
            "/students",
            "/research"
        ]):
            allowed.append(url)

    return list(set(allowed))  # remove duplicates


# -------------------------------
# 📄 EXTRACT CLEAN TEXT
# -------------------------------
def extract_text(url):
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)

        # ❌ Skip bad responses
        if response.status_code != 200:
            return ""

        soup = BeautifulSoup(response.text, "html.parser")

        # 🔥 Remove junk HTML
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()

        text = soup.get_text(separator=" ", strip=True)

        # ❌ Remove bad pages
        if not text:
            return ""

        if "404" in text.lower():
            return ""

        if len(text) < 200:
            return ""

        return text

    except Exception as e:
        print("Error:", url, e)
        return ""


# -------------------------------
# 🚀 MAIN CRAWLER
# -------------------------------
def crawl_site():
    sitemap_url = "https://www.imperial.ac.uk/sitemap.xml"

    urls = get_sitemap_urls(sitemap_url)
    urls = filter_urls(urls)

    print(f"Total URLs after filter: {len(urls)}")

    data = []

    for url in urls[:50]:  # 🔥 increase later (100 → 500 → full)
        print("Crawling:", url)

        text = extract_text(url)

        if text:
            data.append({
                "url": url,
                "content": text
            })

    print(f"✅ Total valid pages collected: {len(data)}")

    return data