import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // your Supabase bucket (keep this)
      {
        protocol: "https",
        hostname: "wllibrxaymmkulldmaug.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },

      // X (Twitter) media + avatars
      { protocol: "https", hostname: "pbs.twimg.com" },   // tweet images
      { protocol: "https", hostname: "abs.twimg.com" },   // avatars/assets
      { protocol: "https", hostname: "video.twimg.com" }, // video previews
    ],
  },
  serverExternalPackages: ['pdf-parse'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://js.paystack.co https://checkout.paystack.com https://www.googletagmanager.com https://s3-eu-west-1.amazonaws.com/pstk-public-files/js/pusher.min.js https://applepay.cdn-apple.com/jsapi/v1.1.0/apple-pay-sdk.js",
              "script-src-elem 'self' 'unsafe-inline' blob: https://js.paystack.co https://checkout.paystack.com https://www.googletagmanager.com https://s3-eu-west-1.amazonaws.com/pstk-public-files/js/pusher.min.js https://applepay.cdn-apple.com/jsapi/v1.1.0/apple-pay-sdk.js",
              "style-src 'self' 'unsafe-inline' https://checkout.paystack.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.paystack.co https://checkout.paystack.com https://*.supabase.co https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com wss://*.pusher.com",
              "frame-src 'self' https://checkout.paystack.com",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
