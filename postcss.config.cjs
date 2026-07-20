const purgecss = require('@fullhuman/postcss-purgecss').default;

module.exports = {
  plugins: process.env.NODE_ENV === 'production' ? [
    purgecss({
      content: ['./index.html', './src/**/*.{ts,tsx}'],
      defaultExtractor: (content) => content.match(/[A-Za-z0-9_:\-/\[\].%]+/g) || [],
      safelist: {
        standard: [
          'active','open','selected','disabled','hidden','loading','danger','success','warning','error',
          'draft','published','archived','requested','approved','received','refunded','closed','rejected',
          'is-open','is-sticky','is-live','is-active','is-fullbleed','sold-out','available','low','out',
          'desktop','tablet','mobile','light','dark','green','red','on','off'
        ],
        deep: [
          /^v23-columns-/,
          /^v23-gallery-/,
          /^v19-device/,
          /^v18-blog-status/,
          /^v9-status/,
          /^payment-/,
          /^fulfillment-/,
          /^order-/,
          /^return-/,
          /^role-/,
          /^status-/,
          /^theme-/,
          /^toast-/,
          /^sonner-/,
          /^radix-/,
          /^data-/
        ],
        greedy: [/\[data-state/, /\[aria-/, /:focus-visible/, /:hover/, /:active/]
      },
      variables: true,
      keyframes: true,
      fontFace: true,
    })
  ] : []
};
