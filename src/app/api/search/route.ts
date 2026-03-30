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

function extractNoonProducts(html: string): Product[] {
  const hitsIdx = html.indexOf('\\"hits\\":[');
  if (hitsIdx === -1) return [];

  const section = html.slice(hitsIdx);
  const productBlocks = section.split('\\"offer_code\\":');
  const products: Product[] = [];

  for (let i = 1; i < productBlocks.length && products.length < 12; i++) {
    const block = productBlocks[i];

    const nameMatch = block.match(/\\"name\\":\\"([^\\]{15,}?)\\"/);
    const skuMatch = block.match(/\\"sku\\":\\"(N[A-Z0-9]+)\\"/);
    const imgMatch = block.match(/\\"image_url\\":\\"(https:[^\\]+\.jpg)/);
    const priceMatch = block.match(/\\"price\\":(\d{4,})/);
    const salePriceMatch = block.match(/\\"sale_price\\":(\d{4,})/);
    const slugMatch = block.match(
      /\\"url\\":\\"([a-z0-9][a-z0-9-]{10,}[a-z0-9])\\"/
    );

    if (!nameMatch || !skuMatch) continue;

    const rawPrice = salePriceMatch
      ? parseInt(salePriceMatch[1])
      : priceMatch
        ? parseInt(priceMatch[1])
        : 0;
    const priceStr = rawPrice
      ? `${(rawPrice / 100).toLocaleString("en-EG")} ج.م`
      : "السعر غير متاح";

    const imageUrl = imgMatch
      ? imgMatch[1].replace(/\\\//g, "/")
      : "";

    const link = slugMatch
      ? `https://www.noon.com/egypt-en/p/${slugMatch[1]}/n/${skuMatch[1]}/`
      : `https://www.noon.com/egypt-en/search/?q=${encodeURIComponent(nameMatch[1])}`;

    products.push({
      title: nameMatch[1],
      image: imageUrl,
      price: priceStr,
      link,
      rating: "",
    });
  }

  return products;
}

async function searchNoonEG(query: string): Promise<Product[]> {
  const url = `https://www.noon.com/egypt-en/search/?q=${encodeURIComponent(query)}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      Accept: "text/html",
      "Accept-Language": "en-US,en;q=0.9",
    },
    redirect: "follow",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Noon returned ${res.status}`);
  }

  const html = await res.text();
  return extractNoonProducts(html);
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
          const products = await searchNoonEG(trimmedQuery);
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
