/**
 * Mobile Layout & Responsive Enhancements
 * Tailwind CSS configuration extensions for better mobile support
 */

export const MOBILE_BREAKPOINTS = {
  'xs': '320px',
  'sm': '480px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
  '2xl': '1536px',
};

export const TOUCH_TARGET_SIZE = '44px'; // iOS/Android standard touch target
export const SAFE_AREA_PADDING = 'var(safe-area-inset-*)';

/**
 * Mobile-first responsive classes that should be applied
 * 
 * Usage in components:
 * - Always start with mobile-first defaults
 * - Override with md:, lg:, xl: for larger screens
 * - Use touch: prefix for touch-specific styling
 */

export const RESPONSIVE_CLASSES = {
  // Padding & Margins
  container: 'px-4 sm:px-6 md:px-8 lg:px-16', // Responsive horizontal padding
  section: 'py-8 sm:py-12 md:py-16 lg:py-24', // Responsive vertical padding
  
  // Font sizes
  heading1: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl',
  heading2: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl',
  heading3: 'text-lg sm:text-xl md:text-2xl lg:text-3xl',
  body: 'text-sm sm:text-base md:text-lg',
  caption: 'text-xs sm:text-sm',
  
  // Grid layouts
  twoColGrid: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6',
  threeColGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6',
  fourColGrid: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4',
  
  // Spacing
  touchButton: 'p-3 sm:p-4 min-h-[44px] min-w-[44px]', // Touch target minimum
  
  // Display utilities
  hideOnMobile: 'hidden md:block',
  showOnMobile: 'block md:hidden',
  hideOnTablet: 'hidden lg:block',
};

/**
 * Mobile optimization tips:
 * 1. Never hide critical functionality - always provide mobile alternative
 * 2. Use touch-friendly sizes (44px minimum)
 * 3. Stack elements vertically on mobile (not side-by-side)
 * 4. Ensure inputs/buttons have adequate spacing
 * 5. Use hardware-accelerated animations (transform, opacity)
 * 6. Test on real devices, not just browser DevTools
 * 7. Avoid hover states on touch - use focus/active instead
 * 8. Use @apply in CSS for consistency
 */

/**
 * Viewport meta tag requirements
 * Add to HTML <head>:
 * <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no" />
 */

/**
 * Safe area support for notch/dynamic island:
 * CSS:
 * padding-top: max(16px, env(safe-area-inset-top));
 * padding-left: max(16px, env(safe-area-inset-left));
 * padding-right: max(16px, env(safe-area-inset-right));
 * padding-bottom: max(16px, env(safe-area-inset-bottom));
 */

export const ANIMATION_OPTIMIZATIONS = {
  // Use GPU acceleration
  transform: 'transform translateZ(0)', // Force GPU
  
  // Mobile-safe animation durations (faster on mobile)
  fast: 'duration-150',
  normal: 'duration-300',
  slow: 'duration-500',
  
  // Reduce motion for users who prefer it
  prefersReducedMotion: '@media (prefers-reduced-motion: reduce)',
};

/**
 * Common mobile layout patterns
 */

export const MOBILE_LAYOUT_PATTERNS = {
  // Bottom sheet (drawer from bottom)
  bottomSheet: {
    container: 'fixed bottom-0 left-0 right-0 z-[1000] rounded-t-2xl',
    touch: 'touch-target p-4 mb-2',
  },
  
  // Modal with safe area
  modal: {
    overlay: 'fixed inset-0 z-[999] bg-black/80',
    content: 'fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[1000]',
  },
  
  // Sticky header with safe area
  stickyHeader: {
    container: 'sticky top-0 z-50',
    padding: 'pt-[max(1rem,env(safe-area-inset-top))]',
  },
  
  // Horizontal scroll
  scrollContainer: 'overflow-x-auto snap-x snap-mandatory',
  scrollItem: 'snap-center snap-always flex-shrink-0',
};

/**
 * Performance optimizations for mobile
 */
export const PERFORMANCE_TIPS = [
  'Use CSS containment: contain: layout style paint',
  'Lazy load images: loading="lazy"',
  'Use Intersection Observer for animations',
  'Minimize bundle size - tree-shake unused code',
  'Use async/defer for scripts',
  'Enable compression (gzip/brotli)',
  'Optimize images with srcset/WebP',
  'Use CSS Grid/Flexbox over absolute positioning',
  'Minimize reflows/repaints',
  'Throttle scroll/resize events',
];
