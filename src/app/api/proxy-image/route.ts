import { NextRequest, NextResponse } from "next/server";

 
const https = require("https");

function fetchImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
        timeout: 15000,
      },
       
      (res: any) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          fetchImage(res.headers.location).then(resolve).catch(reject);
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      }
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Image request timeout"));
    });
  });
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "Missing URL" },
      { status: 400 }
    );
  }

  try {
    const buf = await fetchImage(url);
    return new NextResponse(
      buf.buffer.slice(
        buf.byteOffset,
        buf.byteOffset + buf.byteLength
      ) as ArrayBuffer,
      {
        headers: {
          "Content-Type": "image/jpeg",
          "Content-Disposition":
            'attachment; filename="product-image.jpg"',
          "Cache-Control": "public, max-age=86400",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch image",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
