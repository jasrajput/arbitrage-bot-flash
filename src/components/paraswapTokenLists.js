import React, { useEffect, useState } from 'react';
import ImprovedDEXComparisonComponent from './arbitrage3';

function TokenPairs() {
  const [tokens, setTokens] = useState([]);
  const [filteredTokens, setFilteredTokens] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  const [sourceToken, setSourceToken] = useState({
    symbol: 'USDT',
    address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    decimals: 6,
    logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png',
  });
  const [sourceAmount, setSourceAmount] = useState('1'); // Default amount is 100

  useEffect(() => {
    const fetchTokens = async () => {
      setIsLoading(true);
      const response = await fetch('https://tokens.coingecko.com/polygon-pos/all.json');
      const data = await response.json();
      const paginatedTokens = data.tokens.slice(page * pageSize, (page + 1) * pageSize);
      setTokens(data.tokens);
      setFilteredTokens(paginatedTokens);
      setIsLoading(false);
    };

    fetchTokens();
  }, []);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    // Filter tokens by both `name` and `symbol`
    const filtered = tokens.filter(token => 
      token.symbol.toLowerCase().includes(term) || 
      token.name.toLowerCase().includes(term)
    );

    setFilteredTokens(filtered.slice(0, pageSize)); // Show first page of filtered tokens
    setPage(0); // Reset page to 0 after filtering
  };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      const newPage = page + 1;
      const paginatedTokens = tokens.slice(newPage * pageSize, (newPage + 1) * pageSize);
      setFilteredTokens(prevTokens => [...prevTokens, ...paginatedTokens]);
      setPage(newPage);
      setHasMore(paginatedTokens.length === pageSize);
    }
  };

  // Handle source token selection
  const handleSourceTokenChange = (e) => {
    const tokenAddress = e.target.value;
    const token = tokens.find(t => t.address === tokenAddress);
    if (token) {
      setSourceToken(token);
    }
  };

  // Handle source amount change
  const handleAmountChange = (e) => {
    setSourceAmount(e.target.value);
  };

  return (
    <div className="flex flex-col items-center w-full space-y-4">
      <br />
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
        DEX Comparison & Arbitrage Analysis
      </h1>

      {/* Source Token Selection */}
      <div className="w-full max-w-lg mb-4 p-4 bg-white shadow-lg rounded-lg">
        <h2 className="text-xl font-bold mb-4">Select Source Token & Amount</h2>

        {/* Token Dropdown */}
        <label className="block mb-2 text-sm font-medium text-gray-700">Select Token</label>
        <select
          value={sourceToken.address}
          onChange={handleSourceTokenChange}
          className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500"
        >
          {tokens.map(token => (
            <option key={token.address} value={token.address}>
              {token.symbol} - {token.name}
            </option>
          ))}
        </select>

        {/* Display selected token */}
        <div className="flex items-center mb-4">
          <img src={sourceToken.logoURI} alt={sourceToken.symbol} className="w-8 h-8 mr-2" />
          <span className="text-lg font-semibold">{sourceToken.symbol}</span>
        </div>

        {/* Amount Input */}
        <label className="block mb-2 text-sm font-medium text-gray-700">Enter your Loan Amount</label>
        <input
          type="number"
          value={sourceAmount}
          onChange={handleAmountChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500"
        />

        {/* Display amount in decimals */}
        {/* <p className="mt-2 text-sm text-gray-700">
          Amount in decimals: {(parseFloat(sourceAmount) * Math.pow(10, sourceToken.decimals)).toFixed(0)}
        </p> */}
      </div>
      <br/>
      {/* Search Bar */}
      <h2 className="text-xl font-bold">Search for your custom token</h2>
      
      <input
        type="text"
        placeholder="Search tokens..."
        value={searchTerm}
        onChange={handleSearch}
        className="w-full max-w-lg px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500"
      />

      {/* Token List */}
      <ImprovedDEXComparisonComponent 
        tokens={filteredTokens}
        sourceToken={sourceToken} 
        sourceAmount={sourceAmount} 
     />

      {/* Load More Button */}
      {isLoading && <p className="text-gray-500">Loading...</p>}
      {hasMore && !isLoading && (
        <>
          <button
            onClick={loadMore}
            className="w-full max-w-lg px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none"
          >
            Load More
          </button>
          <br />
          <br />
        </>
      )}
    </div>
  );
}

export default TokenPairs;
