// next.config.js
/** @type {import('next').NextConfig} */
module.exports = {
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
};
