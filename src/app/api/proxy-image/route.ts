import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { readFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

function fetchImageWithCurl(url: string): Promise<Buffer> {
  const tmpFile = join(
    tmpdir(),
    `img_${Date.now()}_${Math.random().toString(36).slice(2)}`
  );

  return new Promise((resolve, reject) => {
    execFile(
      "curl",
      [
        "-s",
        "-L",
        "--max-time",
        "15",
        "-o",
        tmpFile,
        "-A",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        url,
      ],
      { timeout: 20000 },
      async (error) => {
        if (error) {
          reject(new Error(`curl failed: ${error.message}`));
          return;
        }
        try {
          const buf = await readFile(tmpFile);
          unlink(tmpFile).catch(() => {});
          resolve(buf);
        } catch {
          reject(new Error("Failed to read image"));
        }
      }
    );
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
    const buf = await fetchImageWithCurl(url);
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
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 }
    );
  }
}
