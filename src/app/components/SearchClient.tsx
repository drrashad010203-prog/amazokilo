"use client";

import { useState, FormEvent } from "react";
import JSZip from "jszip";

interface Product {
  title: string;
  image: string;
  price: string;
  link: string;
  rating: string;
}

interface SearchResult {
  query: string;
  products: Product[];
  error?: string;
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export default function SearchClient() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({
    current: 0,
    total: 0,
  });

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    setError("");
    setResults([]);

      const products = input
        ?.split("\n")
        .map((s) => s?.trim())
        .filter((s) => s && s.length > 0) || [];

    if (products.length === 0) {
      setError("من فضلك أدخل اسم منتج واحد على الأقل");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products }),
      });

      if (!res.ok) {
        throw new Error("فشل البحث");
      }

      const data = await res.json();
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadSingle(imageUrl: string, title: string) {
    try {
      const res = await fetch(
        `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`
      );
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${sanitizeFilename(title)}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      const a = document.createElement("a");
      a.href = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
      a.download = `${sanitizeFilename(title)}.jpg`;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  async function handleDownloadAll() {
    const allProducts = results.flatMap((r) => r.products);
    if (allProducts.length === 0) return;

    setDownloadingAll(true);
    setDownloadProgress({ current: 0, total: allProducts.length });

    try {
      const zip = new JSZip();
      const folder = zip.folder("صور المنتجات");

      let count = 0;
      const seenNames = new Set<string>();

      for (const product of allProducts) {
        try {
          const res = await fetch(
            `/api/proxy-image?url=${encodeURIComponent(product.image)}`
          );
          if (res.ok) {
            const blob = await res.blob();
            let fileName = `${sanitizeFilename(product.title)}.jpg`;
            if (seenNames.has(fileName)) {
              fileName = `${sanitizeFilename(product.title)}_${count}.jpg`;
            }
            seenNames.add(fileName);
            folder?.file(fileName, blob);
          }
        } catch {
          // skip failed images
        }
        count++;
        setDownloadProgress({ current: count, total: allProducts.length });
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `صور المنتجات.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // error creating zip
    } finally {
      setDownloadingAll(false);
      setDownloadProgress({ current: 0, total: 0 });
    }
  }

  const totalProducts = results?.reduce(
    (sum, r) => sum + (r?.products?.length || 0),
    0
  ) || 0;

  return (
    <div className="space-y-8">
      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <label
            htmlFor="products"
            className="block text-lg font-semibold text-white mb-2"
          >
            أسماء المنتجات
          </label>
          <p className="text-neutral-400 text-sm mb-3">
            أدخل اسم منتج واحد أو عدة منتجات (كل منتج في سطر منفصل)
          </p>
          <textarea
            id="products"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
            className="w-full rounded-xl bg-neutral-800 border border-neutral-700 text-white p-4 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder-neutral-500 resize-none text-base"
            placeholder={
              "iPhone 16 Pro Max\nSamsung Galaxy S24\nسماعات بلوتوث"
            }
            dir="auto"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-neutral-600 disabled:to-neutral-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 text-lg cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              جاري البحث...
            </span>
          ) : (
            "🔍 بحث على أمازون مصر"
          )}
        </button>
      </form>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-xl p-4 text-center">
          {error}
        </div>
      )}

      {results.length > 0 && totalProducts > 0 && (
        <div className="bg-gradient-to-r from-green-900/40 to-green-800/30 border border-green-700/60 rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 text-white text-center sm:text-right">
              <p className="text-lg font-bold">
                <span className="text-green-400 text-2xl">
                  {totalProducts}
                </span>{" "}
                صورة متاحة للتحميل
              </p>
              <p className="text-neutral-400 text-sm mt-1">
                كل الصور المتاحة لهذا المنتج
              </p>
            </div>
            <button
              onClick={handleDownloadAll}
              disabled={downloadingAll}
              className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-600 text-white font-bold py-4 px-8 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-3 whitespace-nowrap text-lg shadow-lg shadow-green-900/30"
            >
              {downloadingAll ? (
                <>
                  <svg
                    className="animate-spin h-6 w-6"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>
                    جاري التحميل... {downloadProgress.current}/
                    {downloadProgress.total}
                  </span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  تحميل كل الصور (ZIP)
                </>
              )}
            </button>
          </div>
          {downloadingAll && (
            <div className="mt-4">
              <div className="w-full bg-neutral-700 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-green-500 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      (downloadProgress.current / downloadProgress.total) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-10">
          {results.map((result, idx) => (
            <div key={idx} className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white" dir="auto">
                  نتائج: {result.query}
                </h2>
                <span className="bg-neutral-700 text-neutral-300 text-sm px-3 py-1 rounded-full">
                  {result.products.length} منتج
                </span>
              </div>

              {result.error ? (
                <div className="bg-yellow-900/30 border border-yellow-700 text-yellow-200 rounded-lg p-3 text-sm">
                  {result.error}
                </div>
              ) : result.products.length === 0 ? (
                <div className="text-neutral-500 text-center py-8 bg-neutral-800/50 rounded-xl">
                  لم يتم العثور على نتائج لهذا المنتج
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {result.products.map((product, pIdx) => (
                    <div
                      key={pIdx}
                      className="bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden hover:border-orange-500/50 transition-colors group"
                    >
                      <div className="relative aspect-square bg-white p-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                        <button
                          onClick={() =>
                            handleDownloadSingle(
                              product.image,
                              product.title
                            )
                          }
                          className="absolute top-2 left-2 bg-black/70 hover:bg-orange-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          title="تحميل الصورة"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="p-3 space-y-2">
                        <h3
                          className="text-sm text-white line-clamp-2 leading-relaxed"
                          dir="auto"
                        >
                          {product.title}
                        </h3>
                        {product.price && (
                          <p className="text-orange-400 font-bold text-lg">
                            {product.price}
                          </p>
                        )}
                        {product.rating && (
                          <p className="text-yellow-400 text-xs">
                            ⭐ {product.rating}
                          </p>
                        )}
                        {product.link && (
                          <a
                            href={product.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-center bg-neutral-700 hover:bg-orange-600 text-white text-sm py-2 rounded-lg transition-colors"
                          >
                            عرض على أمازون
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
