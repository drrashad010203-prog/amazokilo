# Product Context: Product Catalog Application

## Why This Application Exists

E-commerce sites need clean, performant product listing pages that allow users to quickly find what they're looking for. This application demonstrates how to build a modern product catalog using Next.js, with features like real-time search, filtering, and pagination, all powered by a mock product API.

## Problems It Solves

1. **Discovery**: Users can quickly search and filter through products
2. **Performance**: Server-side rendering with Next.js Image optimization
3. **Usability**: Clean, responsive design that works on all devices
4. **Developer Experience**: Type-safe, linted codebase with clear patterns
5. **Scalability**: Pagination prevents loading too much data at once

## How It Should Work (User Flow)

1. User visits the page
2. Products automatically load from DummyJSON API
3. User can:
   - Scroll through the product grid
   - Type in search box to filter products in real-time
   - Select a category from dropdown
   - Navigate pages using pagination controls
   - Click "View Details" to see product on DummyJSON
4. Active filters are displayed and can be removed

## Key User Experience Goals

- **Fast Loading**: Images optimized with Next.js Image
- **Intuitive Search**: Real-time filtering as user types
- **Clear Navigation**: Obvious pagination controls
- **Responsive**: Works beautifully on all screen sizes
- **Visual Hierarchy**: Important info (title, price) prominently displayed
- **Feedback**: Loading states, empty states, error messages

## What This Application Provides

1. **Product Grid**: Responsive 1-4 column layout
2. **Search**: Instant search across title, description, brand
3. **Filtering**: Category dropdown with active filter indicators
4. **Pagination**: Numbered pages with prev/next buttons
5. **Product Cards**: Thumbnail, title, category, price, rating, discount, stock info
6. **External Links**: Direct links to full product pages

## Technical Features

- Client-side state management with React hooks
- Data fetching from external REST API
- Image optimization with next/image
- Tailwind CSS for styling
- TypeScript for type safety
- ESLint for code quality
