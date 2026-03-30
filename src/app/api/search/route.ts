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

async function searchAmazonEG(query: string): Promise<Product[]> {
  const url = `https://www.amazon.eg/s?k=${encodeURIComponent(query)}&language=en`;

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Amazon returned ${response.status}`);
  }

  const html = await response.text();
  const products: Product[] = [];

  const productRegex =
    /data-component-type="s-search-result"[^>]*>([\s\S]*?)(?=data-component-type="s-search-result"|$)/g;
  let match;

  while ((match = productRegex.exec(html)) !== null && products.length < 12) {
    const block = match[1];

    const imgMatch = block.match(
      /class="s-image"[^>]*src="([^"]+)"/
    );

    const titleMatch = block.match(
      /class="a-size-[a-z]+ a-color-base a-text-normal"[^>]*>([^<]+)/
    ) || block.match(
      /class="a-text-normal"[^>]*>([^<]+)/
    );

    const linkMatch = block.match(
      /class="a-link-normal s-no-outline"[^>]*href="([^"]+)"/
    ) || block.match(
      /data-component-type="s-product-image"[^>]*>[\s\S]*?href="([^"]+)"/
    );

    const priceWholeMatch = block.match(
      /class="a-price-whole">([^<]+)/
    );
    const priceFractionMatch = block.match(
      /class="a-price-fraction">([^<]+)/
    );

    const ratingMatch = block.match(
      /class="a-icon-alt">([^<]+)/
    );

    if (imgMatch && titleMatch) {
      const price = priceWholeMatch
        ? `${priceWholeMatch[1].trim()}${priceFractionMatch ? priceFractionMatch[1].trim() : ""} ج.م`
        : "السعر غير متاح";

      const link = linkMatch
        ? `https://www.amazon.eg${linkMatch[1].split("/ref=")[0]}`
        : "";

      products.push({
        title: titleMatch[1].trim(),
        image: imgMatch[1],
        price,
        link,
        rating: ratingMatch ? ratingMatch[1].trim() : "",
      });
    }
  }

  return products;
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json();

    if (!body.products || !Array.isArray(body.products) || body.products.length === 0) {
      return NextResponse.json(
        { error: "يجب تقديم قائمة بأسماء المنتجات" },
        { status: 400 }
      );
    }

    const results: SearchResult[] = await Promise.all(
      body.products.map(async (query) => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) {
          return { query: trimmedQuery, products: [], error: "اسم المنتج فارغ" };
        }

        try {
          const products = await searchAmazonEG(trimmedQuery);
          return { query: trimmedQuery, products };
        } catch (error) {
          return {
            query: trimmedQuery,
            products: [],
            error: error instanceof Error ? error.message : "حدث خطأ أثناء البحث",
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
