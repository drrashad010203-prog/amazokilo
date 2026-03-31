import { NextRequest, NextResponse } from "next/server";

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
    : "السعر غير متاح";

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

async function searchAmazonEG(
  query: string
): Promise<Product[]> {
  const url = `https://www.amazon.eg/s?k=${encodeURIComponent(query)}&language=en`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    redirect: "follow",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Amazon returned ${res.status}`);
  }

  const html = await res.text();
  const blocks = extractProductBlocks(html);
  const products: Product[] = [];

  for (const block of blocks) {
    if (products.length >= 12) break;
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
