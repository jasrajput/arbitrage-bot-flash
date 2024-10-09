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

  return (
    <div className="flex flex-col items-center w-full space-y-4">
      <br />
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
        DEX Comparison & Arbitrage Analysis
      </h1>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search tokens..."
        value={searchTerm}
        onChange={handleSearch}
        className="w-full max-w-lg px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500"
      />

      {/* Token List */}
      <ImprovedDEXComparisonComponent tokens={filteredTokens} />

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
