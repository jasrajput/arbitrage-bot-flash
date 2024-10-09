module.exports = {
  webpack: {
    alias: {
      'ethers/lib/utils': 'ethers/utils.js', // Fix the import path
    },
  },
};