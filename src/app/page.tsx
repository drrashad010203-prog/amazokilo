import ProductsClient from "./components/ProductsClient";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">
            Product Catalog
          </h1>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
            Browse products from DummyJSON API - Search, filter, and paginate through our collection
          </p>
        </header>
        <ProductsClient />
        <footer className="text-center mt-16 text-neutral-600 text-sm">
          <p>Data provided by DummyJSON API</p>
        </footer>
      </div>
    </main>
  );
}
