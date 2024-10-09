import React, { useEffect, useState } from 'react';
// import { Line } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, Cell } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

function ImprovedDEXComparisonComponent({ tokens }) {
  const [dexData, setDexData] = useState({});
  const [bestBuySellData, setBestBuySellData] = useState({});
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);

  const srcToken = '0xc2132d05d31c914a87c6611c10748aeb04b58e8f'; // USDT
  const srcDecimals = 6;
  const amount = '10000000';
  const network = '137';
  const currencySymbol = 'USDT';

  const fetchPriceData = async (destToken, decimals, symbol, tokenIndex) => {
    const url = `https://api.paraswap.io/prices?srcToken=${srcToken}&destToken=${destToken}&amount=${amount}&side=SELL&network=${network}&srcDecimals=${srcDecimals}&destDecimals=${decimals}&otherExchangePrices=true`;

    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data);
        processDEXData(data, destToken, symbol);
      } else {
        console.error('Error: ', response.status, response.statusText);
        const errorResponse = await response.text();
        console.error('Error details: ', errorResponse);
      }
    } catch (error) {
      console.error('Error fetching token data:', error);
    }
  };

  // Helper function to process DEX data and find best buy/sell rates
  const processDEXData = (data, destToken, symbol) => {
        const srcDecimals = data.priceRoute.srcDecimals;
        const destDecimals = data.priceRoute.destDecimals;

        const processedData = data.priceRoute.others.map(dex => ({
            exchange: dex.exchange,
            srcAmount: parseFloat((parseInt(dex.srcAmount) / Math.pow(10, srcDecimals)).toFixed(srcDecimals)),
            destAmount: parseFloat((parseInt(dex.destAmount) / Math.pow(10, destDecimals)).toFixed(destDecimals)),
            unit: dex.unit,
            gasCost: dex.data && dex.data.gasUSD ? parseFloat(dex.data.gasUSD).toFixed(6) : 'N/A',
            decimals: destDecimals,
            symbol: symbol
        }));

        // Calculate the median destAmount as our target base
        const sortedDestAmounts = processedData.map(dex => dex.destAmount).sort((a, b) => a - b);
        const midIndex = Math.floor(sortedDestAmounts.length / 2);
        const medianDestAmount = sortedDestAmounts.length % 2 !== 0
        ? sortedDestAmounts[midIndex]
        : (sortedDestAmounts[midIndex - 1] + sortedDestAmounts[midIndex]) / 2;
    
        // Filter out exchanges with rates that deviate more than 10% from the median
        const filteredData = processedData.filter(dex => {
            const deviation = Math.abs(dex.destAmount - medianDestAmount) / medianDestAmount;
            return deviation <= 0.1; // 10% tolerance
        });
        
        // Filter best buy/sell data
        const bestBuy = filteredData.reduce((min, dex) => (dex.destAmount < min.destAmount ? dex : min), filteredData[0] || {});
        const bestSell = filteredData.reduce((max, dex) => (dex.destAmount > max.destAmount ? dex : max), filteredData[0] || {});

        // Update state with fetched data for the destToken
        setDexData((prevState) => ({
        ...prevState,
        [destToken]: filteredData,
        }));

        setBestBuySellData((prevState) => ({
        ...prevState,
        [destToken]: { bestBuy, bestSell },
        }));

        setChartData(prevData => [...prevData, { symbol: symbol, token: destToken, profit: bestSell.destAmount - bestBuy.destAmount }]);
   };


  const renderChart = () => {
    const data = {
      labels: chartData.map(item => item.symbol),
      datasets: [
        {
          label: 'Arbitrage Profit',
          data: chartData.map(item => item.profit),
          borderColor: chartData.map(item => (item.profit > 0 ? 'green' : 'red')),
          backgroundColor: chartData.map(item => (item.profit > 0 ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)')),
          fill: true,
          tension: 0.4,
        },
      ],
    };

    return (
      <Line
        data={data}
        options={{
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: 'Arbitrage Opportunities (Profit/Loss)',
            },
          },
        }}
      />
    );
  };




  useEffect(() => {
    let delay = 0;

    // Fetch data for each destToken with 2-second delay
    tokens.forEach((token, index) => {
      setTimeout(() => {
        fetchPriceData(token.address, token.decimals, token.symbol, index);
      }, delay);
      delay += 2000;
    });

    setLoading(false);
  }, [tokens]);

  const calculateArbitrage = (buyDex, sellDex) => {
    if (!buyDex || !sellDex) return 'N/A';
    const profit = sellDex.destAmount - buyDex.destAmount;
    const profitPercentage = (profit / buyDex.destAmount) * 100;
    return profitPercentage.toFixed(6);
  };

  const getOverallChartData = () => {
    return tokens.map(token => ({
      symbol: token.symbol,
      arbitrageOpportunity: calculateArbitrage(
        bestBuySellData[token.address]?.bestBuy,
        bestBuySellData[token.address]?.bestSell
      ),
    }));
  };

  const getPriceDifferenceData = (tokenAddress) => {
    const data = dexData[tokenAddress];
    if (!data || data.length === 0) return [];

    const averageDestAmount = data.reduce((sum, dex) => sum + dex.destAmount, 0) / data.length;

    return data.map(dex => ({
      exchange: dex.exchange,
      priceDifference: ((dex.destAmount - averageDestAmount) / averageDestAmount) * 100
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">DEX Comparison & Arbitrage Analysis</h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="mb-12 bg-white rounded-lg shadow-lg overflow-hidden">
            <h2 className="text-2xl font-semibold p-4 bg-gray-100">Overall Arbitrage Opportunities</h2>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={getOverallChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="symbol" />
                  <YAxis label={{ value: 'Arbitrage Opportunity (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="arbitrageOpportunity" fill="#8884d8" name="Arbitrage Opportunity (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {tokens.map((token, index) => (
            <div key={index} className="mb-12 bg-white rounded-lg shadow-lg overflow-hidden">
              <div
                className="bg-gray-100 p-4 cursor-pointer flex justify-between items-center"
                onClick={() => {
                  const collapseDiv = document.getElementById(`collapse-${token.address}`);
                  collapseDiv.classList.toggle('hidden');
                }}
              >
                <h3 className="text-xl font-semibold text-gray-800">{token.symbol}</h3>
                <span className="text-sm text-gray-500">{token.address}</span>
              </div>

              <div id={`collapse-${token.address}`} className="hiddens">
                <div className="p-4">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={getPriceDifferenceData(token.address)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="exchange" />
                            <YAxis label={{ value: 'Price Difference from Average (%)', angle: -90, position: 'insideLeft' }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="priceDifference" name="Price Difference (%)">
                                {getPriceDifferenceData(token.address).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.priceDifference >= 0 ? "#C70039" : "#50C878"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                    <thead className="bg-gray-100">
                        <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exchange</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gas Cost (USD)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {dexData[token.address]?.map((dex, dexIndex) => (
                        <tr key={dexIndex} className={dexIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{dex.exchange}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{dex.srcAmount}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{dex.destAmount}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">1 {currencySymbol} - {dex.unit / Math.pow(10, dex.decimals)} {dex.symbol}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{dex.gasCost}</td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                    </div>

                    <div className="p-4 bg-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h4 className="text-lg font-semibold mb-2">Best Buy</h4>
                        <p>{bestBuySellData[token.address]?.bestBuy?.exchange}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h4 className="text-lg font-semibold mb-2">Best Sell</h4>
                        <p>{bestBuySellData[token.address]?.bestSell?.exchange}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h4 className="text-lg font-semibold mb-2">Arbitrage Opportunity</h4>
                        <div className="flex items-center">
                        {parseFloat(calculateArbitrage(bestBuySellData[token.address]?.bestBuy, bestBuySellData[token.address]?.bestSell)) > 0 ? (
                            <ArrowUpCircle className="text-green-500 mr-2" />
                        ) : (
                            <ArrowDownCircle className="text-red-500 mr-2" />
                        )}
                        <span className={parseFloat(calculateArbitrage(bestBuySellData[token.address]?.bestBuy, bestBuySellData[token.address]?.bestSell)) > 0 ? 'text-green-500' : 'text-red-500'}>
                            {calculateArbitrage(bestBuySellData[token.address]?.bestBuy, bestBuySellData[token.address]?.bestSell)}%
                        </span>
                        </div>
                    </div>
                    </div>
                    </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default ImprovedDEXComparisonComponent;