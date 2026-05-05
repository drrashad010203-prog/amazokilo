# Project Brief: Product Catalog Application

## Purpose

A product catalog web application that fetches and displays products from the DummyJSON API with search, filtering, and pagination capabilities.

## Target Users

- Shoppers browsing product catalogs
- Developers needing a reference implementation for product listing pages
- Users looking for a clean, responsive product grid interface

## Core Use Case

Display products from a REST API in an attractive, responsive grid with:
- Real-time search across product data
- Category filtering
- Paginated results
- Product details (image, title, price, discount, rating, stock)

## Key Requirements

### Must Have

- Fetch product data from DummyJSON API (https://dummyjson.com/products)
- Display products in responsive grid layout
- Show product image, title, price, category on each card
- Search functionality (across title, description, brand)
- Category filter dropdown
- Pagination controls (previous/next + page numbers)
- Modern, clean CSS styling
- Fully responsive design (mobile, tablet, desktop)

### Nice to Have

- Product ratings display with star icons
- Discount badge on discounted products
- Stock availability indicator
- Link to product details
- Loading states
- Error handling
- Image optimization with Next.js Image

## Success Metrics

- Products load successfully from API
- Search and filter work in real-time
- Pagination functions correctly
- Responsive design works on all screen sizes
- Zero TypeScript errors
- Passing lint checks
- Clean, maintainable code

## Constraints

- Framework: Next.js 16 + React 19
- Styling: Tailwind CSS 4
- Package manager: Bun
- Image optimization: Next.js Image component with remote patterns
- API: DummyJSON public API (no authentication required)
