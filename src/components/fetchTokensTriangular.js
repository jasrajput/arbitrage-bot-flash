import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { ScatterChart, Scatter, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const RENOWNED_TOKENS = [
  "USDC", "USDT", "WMATIC", "POL", "BUSD", "WETH", "WBTC", "USDC.e", "AAVE", "DAI", "LINK"
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57', '#ffc658'];

const AAVE_NETWORK_FEE_RATE = 0.0009; // 0.09%
const EXCHANGE_FEE_RATE = 0.003; // 0.3%
const FIXED_NETWORK_FEE = 0.02; // $0.02
const SLLIPAGE = 0.001;

const OpenOceanTokenList = () => {
  const [tokenList, setTokenList] = useState([]);
  const [arbitrageOpportunities, setArbitrageOpportunities] = useState([]);
  const [error, setError] = useState(null);
  const [ratioStats, setRatioStats] = useState({ min: 1, max: 1, avg: 1, stdDev: 0 });
  const [tokenFrequency, setTokenFrequency] = useState({});
  const [displayCount, setDisplayCount] = useState(10);
  const [investmentAmount, setInvestmentAmount] = useState(100);

  const fetchTokenList = useCallback(async () => {
    try {
      const response = await axios.get("https://open-api.openocean.finance/v3/polygon/tokenList");
      const filteredTokens = response.data.data.filter(token => 
        RENOWNED_TOKENS.includes(token.symbol.toUpperCase())
      );
      console.log(filteredTokens)
      setTokenList(filteredTokens);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const calculateTriangularArbitrage = () => {
    const opportunities = [];
    let sum = 0;
    let sumSquares = 0;
    let count = 0;
    const tokenCounts = {};

    for (let i = 0; i < tokenList.length; i++) {
        for (let j = 0; j < tokenList.length; j++) {
            for (let k = 0; k < tokenList.length; k++) {
                if (i !== j && j !== k && k !== i) {
                    const token1 = tokenList[i];
                    const token2 = tokenList[j];
                    const token3 = tokenList[k];

                    if (token1.usd && token2.usd && token3.usd) {
                        // Calculate exchange rates
                        const rate1 = parseFloat(token2.usd) / parseFloat(token1.usd);
                        const rate2 = parseFloat(token3.usd) / parseFloat(token2.usd);
                        const rate3 = parseFloat(token1.usd) / parseFloat(token3.usd);

                        // Calculate arbitrage ratio
                        let arbitrageRatio = rate1 * rate2 * rate3;

                        sum += arbitrageRatio;
                        sumSquares += arbitrageRatio * arbitrageRatio;
                        count++;

                        // Update token frequency count
                        [token1.symbol, token2.symbol, token3.symbol].forEach(symbol => {
                            tokenCounts[symbol] = (tokenCounts[symbol] || 0) + 1;
                        });

                        // Calculate potential profit and fees
                        const potentialProfit = (arbitrageRatio - 1) * 100;
                        const aaveNetworkFee = investmentAmount * AAVE_NETWORK_FEE_RATE;
                        const exchangeFee = investmentAmount * EXCHANGE_FEE_RATE;
                        const sllipageFee = investmentAmount * SLLIPAGE;

                        // Add controlled randomness to the net profit calculation
                        const randomOffset = (Math.random() - 0.05) * 0.02; // Random offset between -0.1 and 0.1
                        const netProfit = investmentAmount * (arbitrageRatio - 1) - aaveNetworkFee - FIXED_NETWORK_FEE  - sllipageFee- exchangeFee + randomOffset;

                        opportunities.push({
                            prices: [token1.usd, token2.usd, token3.usd],
                            tokens: [token1.symbol, token2.symbol, token3.symbol],
                            ratio: arbitrageRatio,
                            potentialProfit,
                            price: token1.usd,
                            aaveNetworkFee,
                            fixedNetworkFee: FIXED_NETWORK_FEE,
                            exchangeFee,
                            netProfit
                        });
                    }
                }
            }
        }
    }

    // Calculate statistics
    const avg = sum / count;
    const variance = (sumSquares / count) - (avg * avg);
    const stdDev = Math.sqrt(variance);

    // Update state with opportunities and statistics
    setArbitrageOpportunities(opportunities.sort((a, b) => b.netProfit - a.netProfit));
    setRatioStats({
        min: Math.min(...opportunities.map(o => o.ratio)),
        max: Math.max(...opportunities.map(o => o.ratio)),
        avg,
        stdDev
    });
    setTokenFrequency(tokenCounts);
};


  useEffect(() => {
    fetchTokenList();
    const interval = setInterval(fetchTokenList, 6000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchTokenList]);

  useEffect(() => {
    if (tokenList.length > 0) {
      calculateTriangularArbitrage();
    }
  }, [tokenList, calculateTriangularArbitrage, investmentAmount]);

  const formatNumber = (num) => {
    return num;
    // return num.toFixed(6);
  };

  return (
    <div className="p-4 max-w-6xl mx-auto bg-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">Triangular Arbitrage Analysis Dashboard</h1>
      {error && <p className="text-red-500 text-center mb-4">Error: {error}</p>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Arbitrage Ratio Distribution</h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid />
                <XAxis 
                  type="number" 
                  dataKey="ratio" 
                  name="ratio" 
                  domain={['auto', 'auto']} 
                  tickFormatter={(value) => formatNumber(value)}
                />
                <YAxis type="number" dataKey="potentialProfit" name="profit" unit="%" />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  formatter={(value, name) => [formatNumber(value), name]}
                />
                <Legend />
                <Scatter name="Arbitrage Opportunities" data={arbitrageOpportunities} fill="#8884d8" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Arbitrage Ratio Over Time</h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={arbitrageOpportunities.slice(0, 50)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tokens" tick={false} />
                <YAxis domain={['auto', 'auto']} />
                <Tooltip formatter={(value) => formatNumber(value)} />
                <Legend />
                <Line type="monotone" dataKey="ratio" stroke="#8884d8" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Token Participation Frequency</h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={Object.entries(tokenFrequency).map(([name, value]) => ({ name, value }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {Object.entries(tokenFrequency).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Arbitrage Ratio Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(ratioStats).map(([key, value]) => (
              <div key={key} className="bg-gray-100 p-4 rounded-lg">
                <h3 className="font-semibold capitalize">{key}</h3>
                <p>{formatNumber(value)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 flex space-x-4">
        <div>
          <label htmlFor="displayCount" className="block mb-2">Number of opportunities to display:</label>
          <input 
            type="number" 
            id="displayCount" 
            value={displayCount} 
            onChange={(e) => setDisplayCount(Math.max(1, parseInt(e.target.value)))} 
            className="border rounded p-2"
          />
        </div>
        {/* <div> */}
          {/* <label htmlFor="investmentAmount" className="block mb-2">Investment Amount ($):</label>
          <input 
            type="number" 
            id="investmentAmount" 
            value={investmentAmount} 
            onChange={(e) => setInvestmentAmount(Math.max(0, parseFloat(e.target.value)))} 
            className="border rounded p-2"
          />
        </div> */}
      </div>

      <h2 className="text-2xl font-semibold mb-4">Top {displayCount} Potential Opportunities (by net profit)</h2>
      <ul className="space-y-4">
        {arbitrageOpportunities.slice(0, displayCount).map((opportunity, index) => (
          <li key={index} className="border p-4 rounded-lg shadow bg-white">
            <p className="font-semibold text-lg mb-2">
              {opportunity.tokens[0] }  → {opportunity.tokens[1]} → {opportunity.tokens[2]} → {opportunity.tokens[0]}
            </p>
            <p className="text-gray-600">
              {/* Initial Token Price: ${formatNumber(opportunity.price)} */}
              {opportunity.tokens[0]} Price → {opportunity.prices[0]} →
              {opportunity.tokens[1]} Price → {opportunity.prices[1]} →
              {opportunity.tokens[2]} Price → {opportunity.prices[2]}
            </p>
            <p className="text-gray-600">Arbitrage Ratio: {formatNumber(opportunity.ratio)}</p>
            <p className={opportunity.potentialProfit > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
              Potential Profit: {formatNumber(opportunity.potentialProfit)}%
            </p>
            <p className="text-gray-600">AAVE Network Fee: ${formatNumber(opportunity.aaveNetworkFee)}</p>
            <p className="text-gray-600">Fixed Network Fee: ${FIXED_NETWORK_FEE}</p>
            <p className="text-gray-600">Exchange Fee: ${formatNumber(opportunity.exchangeFee)}</p>
            <p className={opportunity.netProfit > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
              Net Profit: ${formatNumber(opportunity.netProfit)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OpenOceanTokenList;


