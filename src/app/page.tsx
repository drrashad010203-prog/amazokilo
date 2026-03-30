import SearchClient from "./components/SearchClient";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">
            🛒 مصور منتجات أمازون مصر
          </h1>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
            أدخل اسم المنتج أو قائمة منتجات للبحث عن صورها على أمازون مصر
          </p>
        </header>
        <SearchClient />
        <footer className="text-center mt-16 text-neutral-600 text-sm">
          <p>النتائج مأخوذة من Amazon.eg - جميع الحقوق محفوظة لأصحابها</p>
        </footer>
      </div>
    </main>
  );
}
