import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { readFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export const runtime = "nodejs";

interface Product {
  title: string;
  image: string;
  price: string;
  link: string;
  rating: string;
}

interface SearchRequest {
  products: string[];
}

interface SearchResult {
  query: string;
  products: Product[];
  error?: string;
}

function extractProductBlocks(html: string): string[] {
  const blocks: string[] = [];
  const marker = 'data-component-type="s-search-result"';
  let start = 0;

  while (true) {
    const idx = html.indexOf(marker, start);
    if (idx === -1) break;
    const nextIdx = html.indexOf(marker, idx + marker.length);
    const block =
      nextIdx === -1
        ? html.substring(idx)
        : html.substring(idx, nextIdx);
    blocks.push(block);
    start = nextIdx === -1 ? html.length : nextIdx;
  }

  return blocks;
}

function parseProduct(block: string): Product | null {
  const imgMatch = block.match(
    /class="s-image"[^>]*src="([^"]+)"/
  );
  if (!imgMatch) return null;

  const titleMatch = block.match(
    /<h2[^>]*aria-label="([^"]{10,})"/
  );
  if (!titleMatch) return null;

  const linkMatch =
    block.match(
      /data-cy="title-recipe"[\s\S]*?href="([^"]+)"/
    ) ||
    block.match(
      /class="a-link-normal[^"]*"[^>]*href="([^"]+)"/
    );

  const priceWholeMatch = block.match(
    /class="a-price-whole">([^<]+)/
  );
  const priceFractionMatch = block.match(
    /class="a-price-fraction">([^<]+)/
  );

  const ratingMatch = block.match(
    /aria-label="([\d.]+ out of 5 stars)/
  );

  const price = priceWholeMatch
    ? `${priceWholeMatch[1].trim()}${priceFractionMatch ? "." + priceFractionMatch[1].trim() : ""} ج.م`
    : "";

  let link = "";
  if (linkMatch) {
    const rawLink = linkMatch[1].split("/ref=")[0];
    link = rawLink.startsWith("http")
      ? rawLink
      : `https://www.amazon.eg${rawLink}`;
  }

  return {
    title: titleMatch[1],
    image: imgMatch[1],
    price,
    link,
    rating: ratingMatch ? ratingMatch[1] : "",
  };
}

function fetchWithCurl(url: string): Promise<string> {
  const tmpFile = join(
    tmpdir(),
    `amz_${Date.now()}_${Math.random().toString(36).slice(2)}.html`
  );

  return new Promise((resolve, reject) => {
    execFile(
      "curl",
      [
        "-s",
        "-L",
        "--max-time",
        "20",
        "--connect-timeout",
        "10",
        "-o",
        tmpFile,
        "-A",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "-H",
        "Accept: text/html,application/xhtml+xml",
        "-H",
        "Accept-Language: en-US,en;q=0.9",
        url,
      ],
      { timeout: 25000 },
      async (error) => {
        if (error) {
          reject(new Error(`curl failed: ${error.message}`));
          return;
        }
        try {
          readFile(tmpFile, "utf8").then((html) => {
            unlink(tmpFile).catch(() => {});
            resolve(html);
          });
        } catch {
          reject(new Error("Failed to read curl output"));
        }
      }
    );
  });
}

async function fetchAmazonPage(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      cache: "no-store",
    });
    if (res.ok) {
      const html = await res.text();
      if (html.includes('data-component-type="s-search-result"')) {
        return html;
      }
    }
  } catch {
    // fallback to curl
  }

  const html = await fetchWithCurl(url);
  if (html.includes('data-component-type="s-search-result"')) {
    return html;
  }

  throw new Error("Amazon returned 503");
}

async function searchAmazonEG(query: string): Promise<Product[]> {
  const url = `https://www.amazon.eg/s?k=${encodeURIComponent(query)}&language=en`;
  const html = await fetchAmazonPage(url);
  const blocks = extractProductBlocks(html);
  const products: Product[] = [];

  for (const block of blocks) {
    if (products.length >= 10) break;
    const product = parseProduct(block);
    if (product) products.push(product);
  }

  return products;
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json();

    if (
      !body.products ||
      !Array.isArray(body.products) ||
      body.products.length === 0
    ) {
      return NextResponse.json(
        { error: "يجب تقديم قائمة بأسماء المنتجات" },
        { status: 400 }
      );
    }

    const results: SearchResult[] = await Promise.all(
      body.products.map(async (query) => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) {
          return {
            query: trimmedQuery,
            products: [],
            error: "اسم المنتج فارغ",
          };
        }

        try {
          const products = await searchAmazonEG(trimmedQuery);
          return { query: trimmedQuery, products };
        } catch (error) {
          return {
            query: trimmedQuery,
            products: [],
            error:
              error instanceof Error
                ? error.message
                : "حدث خطأ أثناء البحث",
          };
        }
      })
    );

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { error: "حدث خطأ في معالجة الطلب" },
      { status: 500 }
    );
  }
}
