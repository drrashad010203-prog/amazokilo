"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand: string;
  category: string;
  thumbnail: string;
  images: string[];
}

interface ProductsResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

const ITEMS_PER_PAGE = 12;

export default function ProductsClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState("");

  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category))];
    return cats.sort();
  }, [products]);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("https://dummyjson.com/products");
        if (!res.ok) throw new Error("Failed to fetch products");
        const data: ProductsResponse = await res.json();
        setProducts(data.products);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load products");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];
    const query = searchQuery.toLowerCase();
    return products.filter((product) => {
      const matchesSearch = !query || (
        (product.title?.toLowerCase() || "").includes(query) ||
        (product.description?.toLowerCase() || "").includes(query) ||
        (product.brand?.toLowerCase() || "").includes(query)
      );
      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  return (
    <div className="space-y-8">
      {/* Search and Filter Bar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search products by name, description, or brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-neutral-800 border border-neutral-700 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder-neutral-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl bg-neutral-800 border border-neutral-700 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Active Filters */}
        {(searchQuery || selectedCategory !== "all") && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-neutral-400 text-sm">Active filters:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 bg-neutral-700 text-white px-3 py-1 rounded-full text-sm">
                Search: {searchQuery}
                <button
                  onClick={() => setSearchQuery("")}
                  className="ml-1 hover:text-orange-400"
                >
                  ×
                </button>
              </span>
            )}
            {selectedCategory !== "all" && (
              <span className="inline-flex items-center gap-1 bg-neutral-700 text-white px-3 py-1 rounded-full text-sm">
                Category: {selectedCategory}
                <button
                  onClick={() => setSelectedCategory("all")}
                  className="ml-1 hover:text-orange-400"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="text-neutral-300">
        Showing {paginatedProducts.length} of {filteredProducts.length} products
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 text-neutral-400">
            <svg
              className="animate-spin h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading products...
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-xl p-6 text-center">
          {error}
        </div>
      ) : paginatedProducts.length === 0 ? (
        <div className="text-center py-16 text-neutral-500 bg-neutral-800/30 rounded-xl">
          <p className="text-lg">No products found</p>
          <p className="text-sm mt-2">
            Try adjusting your search or filter
          </p>
        </div>
      ) : (
        <>
          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedProducts.map((product) => (
              <div
                key={product.id}
                className="bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden hover:border-orange-500/50 transition-all duration-300 group hover:shadow-lg hover:shadow-orange-900/20"
              >
                <div className="relative aspect-square bg-white p-4">
                  <Image
                    src={product.thumbnail}
                    alt={product.title}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                  {product.discountPercentage > 0 && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                      -{Math.round(product.discountPercentage)}%
                    </span>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/70 text-yellow-400 text-xs px-2 py-1 rounded flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {product.rating.toFixed(1)}
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                    {product.category}
                  </div>
                  <h3 className="text-white font-medium line-clamp-2 leading-snug min-h-[2.5rem]">
                    {product.title}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-orange-400">
                      ${product.price.toFixed(2)}
                    </span>
                    {product.discountPercentage > 0 && (
                      <span className="text-sm text-neutral-500 line-through">
                        ${(product.price / (1 - product.discountPercentage / 100)).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-500">
                    Stock: {product.stock > 0 ? `${product.stock} available` : "Out of stock"}
                  </div>
                  {product.brand && (
                    <div className="text-xs text-neutral-500">
                      Brand: {product.brand}
                    </div>
                  )}
                  <a
                    href={`https://dummyjson.com/products/${product.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center bg-neutral-700 hover:bg-orange-600 text-white text-sm font-medium py-2 rounded-lg transition-colors mt-3"
                  >
                    View Details
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg bg-neutral-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-600 transition-colors"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  const showPage =
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1;

                  if (!showPage && (page === 2 || page === totalPages - 1)) {
                    return <span key={page} className="px-2 text-neutral-500">...</span>;
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg transition-colors ${
                        page === currentPage
                          ? "bg-orange-600 text-white font-bold"
                          : "bg-neutral-700 text-white hover:bg-neutral-600"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg bg-neutral-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-600 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
