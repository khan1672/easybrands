# EasyBrands — Premium Clothing Brand Mobile App

A premium fashion shopping experience built with React Native.

The goal is not "build screens." The goal is:

> **Make discovering, understanding, choosing, and purchasing clothing feel effortless.**

---

## Design Principles

| Principle | Meaning |
|---|---|
| **Product First** | Clothing imagery is always the visual hero. No excessive UI decoration. |
| **Confidence Before Conversion** | The product page must answer all 10 purchase questions before the user has to ask. |
| **One-Handed Usage** | Primary actions must be within comfortable thumb reach. |
| **Minimal Friction** | No unnecessary alerts, popups, or forced registration before browsing. |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native CLI |
| Language | TypeScript (strict mode) |
| Navigation | React Navigation |
| Server State | TanStack Query |
| Client State | Zustand |
| Networking | Axios |
| Forms | React Hook Form + Zod |
| Animations | react-native-reanimated |
| Gestures | react-native-gesture-handler |
| Lists | FlashList |
| Persistence | MMKV |
| Secure Storage | iOS Keychain / Android Keystore |
| Testing | Jest + Detox |
| Error Monitoring | Sentry |
| Analytics | Firebase / PostHog / Amplitude |

---

## Project Structure

```
src/
├── app/                    # App entry, providers
│   ├── App.tsx
│   └── providers/
│
├── navigation/             # Navigators
│   ├── RootNavigator.tsx
│   ├── AuthNavigator.tsx
│   └── MainNavigator.tsx
│
├── features/               # Feature modules (screen + components + hooks + queries)
│   ├── auth/
│   ├── home/
│   ├── search/
│   ├── categories/
│   ├── products/
│   ├── wishlist/
│   ├── cart/
│   ├── checkout/
│   ├── orders/
│   ├── profile/
│   └── recommendations/
│
├── components/             # Shared components
│   ├── ui/                 # AppText, AppButton, AppInput, etc.
│   ├── product/            # ProductCard, ProductGrid, etc.
│   ├── forms/              # Form field components
│   └── feedback/           # EmptyState, ErrorState, Skeleton
│
├── services/               # Centralized services
│   ├── api/                # Axios layer + API functions
│   ├── analytics/          # Analytics service
│   ├── storage/            # MMKV wrappers
│   └── notifications/      # Push notification service
│
├── store/                  # Zustand stores
├── hooks/                  # Shared hooks
├── theme/                  # Design tokens
├── utils/                  # Utility functions
├── types/                  # Shared TypeScript types
└── assets/                 # Images, fonts, etc.
```

---

## Navigation Architecture

```
RootNavigator
├── AuthNavigator
│   ├── Login
│   ├── Register
│   └── Forgot Password
│
└── MainNavigator (Bottom Tabs)
    ├── Home
    ├── Discover
    ├── Wishlist
    ├── Bag (Cart)
    └── Profile
```

Product details must be accessible from every surface: Home, Search, Categories, Wishlist, Recently Viewed, Recommendations, Complete the Look.

---

## Key Data Models

### Product

```ts
type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  categoryId: string;
  images: ProductImage[];
  variants: ProductVariant[];
  colors: ProductColor[];
  sizes: ProductSize[];
  material?: string;
  fit?: string;
  rating?: number;
  reviewCount?: number;
  inventory: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
};
```

### Product Variant

```ts
type ProductVariant = {
  id: string;
  colorId: string;
  sizeId: string;
  sku: string;
  price: number;
  inventory: number;
  images: string[];
};
```

### Cart

```ts
type CartItem = {
  productId: string;
  variantId: string;
  quantity: number;
  priceAtAdd: number;
  currentPrice: number;
  selectedColor: string;
  selectedSize: string;
  image: string;
};
```

---

## API Architecture

Base endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/products` | List products (cursor pagination) |
| GET | `/products/:id` | Product details |
| GET | `/products/:id/recommendations` | Related products |
| GET | `/categories` | Category list |
| GET | `/search` | Search products |
| POST | `/wishlist` | Add to wishlist |
| DELETE | `/wishlist/:id` | Remove from wishlist |
| GET | `/cart` | Get cart |
| POST | `/cart/items` | Add to cart |
| PATCH | `/cart/items/:id` | Update cart item |
| DELETE | `/cart/items/:id` | Remove from cart |
| POST | `/checkout` | Start checkout |
| POST | `/payments` | Process payment |
| GET | `/orders` | Order history |
| GET | `/orders/:id` | Order details |

---

## State Management

| State | Tool | Examples |
|---|---|---|
| Server State | TanStack Query | Products, categories, reviews, orders, user profile |
| Client State | Zustand | Cart, wishlist, UI state, onboarding, local filters |

**Rule:** Never put API data in Zustand. Never call Axios from components.

---

## Sprint Plan

### Sprint 1 — Foundation

- Project setup (React Native CLI, TypeScript, paths)
- Theme system (colors, typography, spacing, radius, shadows)
- Navigation (Root, Auth, Main tab navigators)
- API layer (Axios client, interceptors, token injection)
- State management (TanStack Query provider, Zustand stores)
- Local persistence (MMKV setup)
- Analytics service
- Error monitoring (Sentry)
- Design system components (AppText, AppButton, AppInput, Skeleton)

### Sprint 2 — Discovery

- Home screen (greeting, search, hero banner, categories, product rows)
- Category navigation
- Search (instant, suggestions, history, trending)
- Product listing (FlashList grid, 2 columns)
- Filtering (bottom sheet: size, color, price, fit, availability)
- Sorting (recommended, newest, popular, price, rating)
- Product cards

### Sprint 3 — Product Experience

- Product details screen
- Image gallery (swipe, pinch zoom, double tap zoom, full screen, thumbnails)
- Color selection (updates image, gallery, sizes, inventory)
- Size selection (visible buttons, out-of-stock strikethrough)
- Size guide (conversions, measurements, cm/inches, model info)
- Fit description + model measurements
- Reviews (fit/quality/comfort ratings, customer photos)
- Wishlist (optimistic UI, haptic feedback)

### Sprint 4 — Purchase

- Cart / Bag screen
- Save for later
- Checkout flow (linear: Delivery → Shipping → Payment → Review → Success)
- Guest checkout
- Address form with validation
- Shipping options
- Payment (Stripe / Apple Pay / Google Pay)
- Promo code
- Order confirmation
- Order success screen

### Sprint 5 — Account & Orders

- Profile screen
- Order history
- Order tracking (timeline UI)
- Saved addresses
- Payment methods
- Size profile (preferred fit, favorite colors, usual size)
- Notifications preferences

### Sprint 6 — Optimization

- Analytics full funnel implementation
- Performance audit (60 FPS, cold start, re-renders)
- API caching strategy (staleTime, gcTime per data type)
- Offline handling (cached data, retry, offline indicator)
- Error states (every screen)
- Accessibility audit (labels, contrast, touch targets, screen readers)
- E2E tests (Detox critical path)
- Crash monitoring verification

### Sprint 7 — Intelligence

- Size recommendation (height, weight, fit preference → recommended size)
- Personalized home screen
- Complete the Look (outfit recommendations)
- Recently viewed
- Smart recommendations (behavioral signals)

### Sprint 8 — Advanced AI

- AI Style Assistant
- AI Outfit Builder (occasion, color, budget → product combination)
- Visual search (image upload → similar products)
- Advanced recommendation engine (user profile + product attributes + behavior + purchase history)

---

## MVP Scope

The following ships in the first release:

- Splash screen
- Onboarding (3 screens max)
- Guest browsing + guest cart
- Authentication (email/password, social)
- Home (hero, categories, new arrivals, trending)
- Categories
- Search (instant, suggestions, history)
- Product listing (grid, filter, sort)
- Product details (gallery, zoom, color, size, size guide, fit, reviews)
- Wishlist
- Cart / Bag
- Checkout (address, shipping, payment, promo, confirmation)
- Order history + tracking
- Profile
- Push notifications
- Analytics
- Crash reporting (Sentry)

---

## Definition of Done

Every screen must satisfy:

```
✓ Responsive layout
✓ TypeScript-safe (no any, no errors)
✓ Accessible (labels, roles, contrast)
✓ Loading state (skeleton preferred)
✓ Empty state with CTA
✓ Error state with retry
✓ Offline consideration
✓ API integration via service layer
✓ Analytics events
✓ Navigation (deep linking where applicable)
✓ Performance tested
✓ Dark mode support (if enabled)
✓ Localization-ready (no hardcoded strings)
```

---

## Getting Started

### Prerequisites

- Node.js >= 26 (React Native 0.87 requires Node `^22.13 || ^24.3 || >= 26`; see `.nvmrc`)
- JDK 17+
- Android Studio / Android SDK
- Xcode >= 15 (iOS — full Xcode, not just Command Line Tools)
- Ruby (for CocoaPods)

> **No magic needed:** the default Homebrew `node` (>= 26) satisfies React Native's engine requirement.

### Installation

```bash
# Install dependencies
npm install

# Install iOS pods
cd ios && pod install && cd ..

# Run iOS (requires full Xcode)
npm run ios

# Run Android
npm run android
```

### Scripts

```bash
npm run start       # Start Metro bundler
npm run ios         # Run iOS
npm run android     # Run Android
npm run test        # Run unit tests
npm run lint        # Lint code
npm run typecheck   # Type check (tsc --noEmit)
npm run format      # Format with Prettier
```

---

## Coding Standards

See [AGENTS.md](./AGENTS.md) for the full developer rules and conventions.

Key rules:

- TypeScript strict mode always
- Never use `any`
- Never hardcode colors/spacing/fonts
- Never call Axios from UI components
- Never use dropdowns for size selection
- Always show skeleton loaders (not spinners)
- Always show actionable error states
- Always support guest browsing
- Always track analytics events
