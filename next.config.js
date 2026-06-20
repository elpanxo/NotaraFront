/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['i.scdn.co', 'mosaic.scdn.co'], // imágenes de Spotify con <Image> optimizado
  },
  compress: true,
};
module.exports = nextConfig;