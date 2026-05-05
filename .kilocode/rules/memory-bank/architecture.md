# System Patterns: Product Catalog Application

## Architecture Overview

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout + metadata
│   ├── page.tsx            # Home page (renders ProductsClient)
│   ├── globals.css         # Tailwind imports + global styles
│   └── components/
│       └── ProductsClient.tsx  # Main product catalog component
└── (expand as needed)
    ├── components/         # Additional React components
    ├── lib/                # Utilities and helpers
    └── db/                 # Database files (if added later)
```

## Key Design Patterns

### 1. App Router Pattern

Uses Next.js App Router with file-based routing:
```
src/app/
├── page.tsx           # Route: /
├── about/page.tsx     # Route: /about
├── blog/
│   ├── page.tsx       # Route: /blog
│   └── [slug]/page.tsx # Route: /blog/:slug
└── api/
    └── route.ts       # API Route: /api
```

### 2. Client Component Pattern

The product catalog uses a client component for interactivity (search, filter, pagination):
```tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";

export default function ProductsClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // useEffect for data fetching
  // useMemo for filtered products
  // render UI with Tailwind classes
}
```

### 3. Server Components by Default

All components are Server Components unless marked with `"use client"`:
```tsx
// Server Component (default) - can fetch data, access DB
export default function Page() {
  return <div>Server rendered</div>;
}

// Client Component - for interactivity
"use client";
export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

For this app:
- `page.tsx` is a Server Component (no `"use client"`)
- `ProductsClient.tsx` is a Client Component (has `"use client"`)

### 4. Data Fetching Pattern

External API data (DummyJSON) is fetched directly in the client component using `fetch()` inside `useEffect`:
```tsx
useEffect(() => {
  async function fetchProducts() {
    const res = await fetch("https://dummyjson.com/products");
    const data = await res.json();
    setProducts(data.products);
  }
  fetchProducts();
}, []);
```

This keeps it simple without needing additional API routes.

### 5. State Management Pattern

Local React state for UI state:
- `products`: all fetched products
- `searchQuery`: search input value
- `selectedCategory`: chosen category filter
- `currentPage`: pagination state
- `loading`: loading indicator
- `error`: error messages

Derived state computed with `useMemo`:
- `categories`: unique list from products
- `filteredProducts`: products matching search + category
- `paginatedProducts`: slice of filtered products for current page

### 6. Layout Pattern

Layouts wrap pages and can be nested. Current app uses single root layout:
```tsx
// src/app/layout.tsx - Root layout
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-neutral-900 text-white">
        {children}
      </body>
    </html>
  );
}
```

## Styling Conventions

### Tailwind CSS Usage

- Utility classes directly on elements
- Responsive breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- Dark theme: neutral palette with orange accents
- Hover effects: `hover:border-orange-500/50`, `hover:bg-orange-600`
- Transitions: `transition-all duration-300`

### Common Patterns

```tsx
// Container with max-width
<div className="max-w-7xl mx-auto px-4 py-8">

// Responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

// Product card
<div className="bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden hover:border-orange-500/50 transition-all">
```

## Component Structure

```
ProductsClient/
├── State hooks (useState)
├── Derived state hooks (useMemo)
├── Data fetching (useEffect)
├── UI sections:
│   ├── Search and Filter Bar
│   │   ├── Search input
│   │   ├── Category dropdown
│   │   └── Active filter tags
│   ├── Results count
│   ├── Loading state
│   ├── Empty state (no products)
│   ├── Products Grid (responsive)
│   │   └── ProductCard (repeated)
│   └── Pagination controls
```

## Naming Conventions

- Components: PascalCase (`ProductsClient.tsx`)
- Variables/functions: camelCase (`searchQuery`, `filteredProducts`)
- Constants: UPPER_SNAKE_CASE (`ITEMS_PER_PAGE`)
- Directories: kebab-case (`components/`)
- Files: PascalCase for components, lowercase for pages

## API Integration

- **Endpoint**: `https://dummyjson.com/products`
- **Method**: GET
- **Response Type**: `ProductsResponse { products: Product[], total: number, skip: number, limit: number }`
- **Error Handling**: Try-catch with user-friendly error messages
- **Image Handling**: Next.js Image with remote patterns configured

## Performance Optimizations

1. **Image Optimization**: `next/image` with `fill` prop and proper `sizes` attribute
2. **Memoization**: `useMemo` for expensive filtered/paginated calculations
3. **Lazy Loading**: Images use native lazy loading via Next.js Image
4. **Efficient Re-renders**: State updates only when necessary
5. **API Response Caching**: DummyJSON responses are cacheable

## Error Handling Strategy

- Network errors: display error banner with retry (reload)
- Empty search results: show friendly empty state
- Loading states: spinner with text
- Error boundaries: not needed for this simple app, but could be added

## Future Considerations

- Add hydration of SSR data for better initial load
- Add URL query params for search/filter/pagination state
- Add skeleton loaders instead of spinner
- Add sorting options (price, rating, etc.)
- Add product detail page (`/products/[id]`)
- Add compare/wishlist functionality
- Add persistent preferences (localStorage)
- Add debounce for search input
