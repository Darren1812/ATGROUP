/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 允许通过代理加载外部图片
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'atgroup.synology.me',
        port: '5003',
        pathname: '/api/PrinteImage/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
      // 如果你还需要本地调试，保留这个
      {
        protocol: 'http',
        hostname: '192.168.1.200',
        port: '5002', 
        pathname: '/api/PrinteImage/**',
      }
    ],
  },
}

module.exports = nextConfig