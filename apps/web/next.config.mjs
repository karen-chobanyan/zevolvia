/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config) {
    config.module.rules.push({ test: /\.svg$/, use: ["@svgr/webpack"] });

    // pdfjs-dist ships pre-bundled .mjs files that mix CJS internals with
    // ESM exports.  SWC defaults to treating them as scripts and chokes on
    // the trailing `export` statements.  Force them to be parsed as ESM.
    config.module.rules.push({
      test: /\.m?js$/,
      include: /node_modules[\\/]pdfjs-dist/,
      resolve: { fullySpecified: false },
      type: "javascript/esm",
    });

    return config;
  },
};

export default nextConfig;
