import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

function ImprovedDEXComparisonComponent({ tokens }) {
  const [dexData, setDexData] = useState({});
  const [bestBuySellData, setBestBuySellData] = useState({});
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [buySellData, setBuySellData] = useState({}); // New state for buy/sell

  const srcToken = '0xc2132d05d31c914a87c6611c10748aeb04b58e8f'; // USDT
  const srcDecimals = 6;
  const amount = '10000000'; // 1000 USDT
  const network = '137';
  const currencySymbol = 'USDT';

  // Buy and sell logic implementation
  const fetchBuySellData = async (destToken, decimals, symbol) => {
    // First, perform a SELL operation to estimate how much of destToken we get for 10 USDT
    const sellUrl = `https://api.paraswap.io/prices?srcToken=${srcToken}&destToken=${destToken}&amount=${amount}&side=SELL&network=${network}&srcDecimals=${srcDecimals}&destDecimals=${decimals}&otherExchangePrices=true`;
  
    try {
      const sellResponse = await fetch(sellUrl, { headers: { 'Accept': 'application/json' } });
  
      if (sellResponse.ok) {
        const sellData = await sellResponse.json();
  
        if (sellData.error) {
          console.error(`Error in sell data: ${sellData.error} - Value: ${sellData.value}`);
          return; // Exit early if error
        }

        console.log("Sell: ", sellData);

        processDEXData(sellData, destToken, symbol);
  
        // Estimate how much destToken (MATIC) we get for 10 USDT
        const estimatedDestAmount = sellData?.priceRoute?.destAmount;
        console.log('Estimated Dest Amount from Sell Operation:', estimatedDestAmount);
  
        // Now perform a BUY operation using the estimatedDestAmount as the amount of the destination token
        if (estimatedDestAmount) {
          const buyUrl = `https://api.paraswap.io/prices?srcToken=${srcToken}&destToken=${destToken}&amount=${estimatedDestAmount}&side=BUY&network=${network}&srcDecimals=${srcDecimals}&destDecimals=${decimals}&otherExchangePrices=true`;
  
          const buyResponse = await fetch(buyUrl, { headers: { 'Accept': 'application/json' } });
  
          if (buyResponse.ok) {
            const buyData = await buyResponse.json();
            
  
            if (buyData.error) {
              console.error(`Error in buy data: ${buyData.error} - Value: ${buyData.value}`);
              return; // Exit early if error
            }
  
            console.log('Buy Data:', buyData);
  
            // Store buy and sell data in state
            setBuySellData((prevData) => ({
              ...prevData,
              [destToken]: {
                buyData,
                sellData,
                buyOutAmount: estimatedDestAmount,
                sellOutAmount: sellData?.priceRoute?.destAmount || 0,
              },
            }));
          }
        }
      } else {
        console.error('Error fetching sell data:', sellResponse.status);
      }
    } catch (error) {
      console.error('Error fetching buy/sell data:', error);
    }
  };

  // Helper function to process DEX data and find best buy/sell rates
  const processDEXData = (data, destToken, symbol) => {
    console.log("Data received: ", data);
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


    console.log("processedData: ", processedData);
    // Calculate the median destAmount as our target base
    // const sortedDestAmounts = processedData.map(dex => dex.destAmount).sort((a, b) => a - b);
    // const midIndex = Math.floor(sortedDestAmounts.length / 2);
    // const medianDestAmount = sortedDestAmounts.length % 2 !== 0
    // ? sortedDestAmounts[midIndex]
    // : (sortedDestAmounts[midIndex - 1] + sortedDestAmounts[midIndex]) / 2;

    // Filter out exchanges with rates that deviate more than 10% from the median
    // const filteredData = processedData.filter(dex => {
    //     const deviation = Math.abs(dex.destAmount - medianDestAmount) / medianDestAmount;
    //     return deviation <= 0.1; // 10% tolerance
    // });

    // console.log("filteredData: ", filteredData);
    
    // Filter best buy/sell data
    const bestBuy = processedData.reduce((min, dex) => (dex.destAmount < min.destAmount ? dex : min), processedData[0] || {});
    const bestSell = processedData.reduce((max, dex) => (dex.destAmount > max.destAmount ? dex : max), processedData[0] || {});

    // Update state with fetched data for the destToken
    setDexData((prevState) => ({
    ...prevState,
    [destToken]: processedData,
    }));

    setBestBuySellData((prevState) => ({
    ...prevState,
    [destToken]: { bestBuy, bestSell },
    }));

    setChartData(prevData => [...prevData, { symbol: symbol, token: destToken, profit: bestSell.destAmount - bestBuy.destAmount }]);
};


  // Fetch Buy and Sell data for each token
  useEffect(() => {
    let delay = 0;
    tokens.forEach((token, index) => {
      setTimeout(() => {
        fetchBuySellData(token.address, token.decimals, token.symbol);
      }, delay);
      delay += 2000; // Delay to space out the requests
    });

    setLoading(false);
  }, [tokens]);

  // Fee calculation and Net Profit logic
  const calculateNetProfit = (tokenAddress) => {
    const data = buySellData[tokenAddress];
    if (!data) return null;

    const initialAmount = parseFloat(amount) / Math.pow(10, srcDecimals); // 10 USDT
    const buyOutAmount = parseFloat(data.buyOutAmount) / Math.pow(10, data.buyData.priceRoute.destDecimals); // Amount of destToken received
    const sellOutAmount = parseFloat(data.sellOutAmount) / Math.pow(10, data.sellData.priceRoute.destDecimals); // Amount of USDT received from selling destToken
    const polygonFee = 0.01; // Fixed network fee
    const exchangeFee = initialAmount * 0.006; // 0.35% exchange fee

    const finalNetAmount = sellOutAmount - polygonFee - exchangeFee;
    const netProfit = finalNetAmount - initialAmount;

    return {
      initialAmount,
      buyOutAmount,
      sellOutAmount,
      polygonFee,
      exchangeFee,
      finalNetAmount,
      netProfit,
    };
  };

  const getOverallChartData = () => {
    return tokens.map(token => ({
      symbol: token.symbol,
      arbitrageOpportunity: calculateNetProfit(
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

  // Maintain existing UI and add new fee calculations and net profit
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
            <>
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
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h4 className="text-lg font-semibold mb-2">Arbitrage Opportunity</h4>
                        <div className="flex items-center">
                            {parseFloat(calculateNetProfit(bestBuySellData[token.address]?.bestBuy, bestBuySellData[token.address]?.bestSell)) > 0 ? (
                                <ArrowUpCircle className="text-green-500 mr-2" />
                            ) : (
                                <ArrowDownCircle className="text-red-500 mr-2" />
                            )}
                            <span className={parseFloat(calculateNetProfit(bestBuySellData[token.address]?.bestBuy, bestBuySellData[token.address]?.bestSell)) > 0 ? 'text-green-500' : 'text-red-500'}>
                                {calculateNetProfit(bestBuySellData[token.address]?.bestBuy, bestBuySellData[token.address]?.bestSell)}%
                            </span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h4 className="text-lg font-semibold mb-2">Best Buy</h4>
                        <p>{bestBuySellData[token.address]?.bestBuy?.exchange}</p>
                        <p>{(buySellData[token.address]?.buyOutAmount / Math.pow(10, token.decimals)) || 'Loading...'}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h4 className="text-lg font-semibold mb-2">Best Sell</h4>
                        <p>{bestBuySellData[token.address]?.bestSell?.exchange}</p>
                        <p>{(buySellData[token.address]?.sellOutAmount / Math.pow(10, srcDecimals)) || 'Loading...'}</p>
                    </div>
                    

                    <div className="bg-white p-4 rounded-lg shadow">
                        <h4 className="text-lg font-semibold mb-2">Net Profit Calculation</h4>
                        {buySellData[token.address] ? (
                        <div>
                            {(() => {
                            const profitData = calculateNetProfit(token.address);
                            console.log("Net: ", profitData);
                            if (!profitData) return 'Loading...';

                            const { initialAmount, buyOutAmount, sellOutAmount, polygonFee, exchangeFee, finalNetAmount, netProfit } = profitData;

                            return (
                                <>
                                <p><b>Initial Loan Amount:</b> {initialAmount.toFixed(6)} {currencySymbol}</p>
                                <p><b>Buy on {buySellData[token.address].buyData.priceRoute?.others[0]?.exchange}:</b> Input Amount: {initialAmount.toFixed(6)} {currencySymbol} - <b>Output Amount:</b> {buyOutAmount.toFixed(6)} {token.symbol}</p>
                                <p><b>Sell on {buySellData[token.address].sellData.priceRoute?.others[0]?.exchange}:</b> Input Amount: {buyOutAmount.toFixed(6)} {token.symbol} - <b>Output Amount:</b> {sellOutAmount.toFixed(6)} {currencySymbol}</p>
                                <p><b>Polygon Network Fee:</b> {polygonFee.toFixed(6)} {currencySymbol}</p>
                                <p><b>Exchange Fee (0.35%):</b> {exchangeFee.toFixed(6)} {currencySymbol}</p>
                                <p><b>Final Net Amount (after all fees):</b> {finalNetAmount.toFixed(6)} {currencySymbol}</p>
                                <p style={{ color: netProfit < 0 ? 'red' : 'green' }}><b>Net Profit:</b> {netProfit.toFixed(6)} {currencySymbol}</p>
                                </>
                            );
                            })()}
                        </div>
                        ) : (
                        'Loading...'
                        )}
                    </div>
                 </div>
                </div>
              </div>
            </div>
            </>
          ))}
        </>
      )}
    </div>
  );
}

export default ImprovedDEXComparisonComponent;
