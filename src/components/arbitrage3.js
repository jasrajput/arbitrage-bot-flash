import React, { useEffect, useState } from 'react';
// import { Line } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, Cell } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

function ImprovedDEXComparisonComponent({ tokens, sourceToken, sourceAmount }) {
    const [dexData, setDexData] = useState({});
    const [bestBuySellData, setBestBuySellData] = useState({});
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState([]);
    const [buySellData, setBuySellData] = useState({}); // New state for buy/sell

    const srcToken = sourceToken.address;
    const srcDecimals = sourceToken.decimals;
    const amount = (parseFloat(sourceAmount) * Math.pow(10, sourceToken.decimals)).toFixed(0);
    const currencySymbol = sourceToken.symbol;
    const network = '137';
    

    const fetchBuySellData = async (destToken, decimals, symbol) => {
        const sellUrl = `https://api.paraswap.io/prices?srcToken=${srcToken}&destToken=${destToken}&amount=${amount}&side=SELL&network=${network}&srcDecimals=${srcDecimals}&destDecimals=${decimals}&otherExchangePrices=true`;
        try {
            const sellResponse = await fetch(sellUrl, { headers: { 'Accept': 'application/json' } });

            if (sellResponse.ok) {
                const sellData = await sellResponse.json();

                if (sellData.error) {
                    console.error(`Error in sell data: ${sellData.error} - Value: ${sellData.value}`);
                    return;
                }

                console.log("USDT to Link: ", sellData);

                processDEXData(sellData, destToken, symbol);

                const estimatedDestAmount = sellData?.priceRoute?.destAmount;
                const estBuy = estimatedDestAmount / Math.pow(10, sellData?.priceRoute?.destDecimals);

                if (estimatedDestAmount) {
                    const buyUrl = `https://api.paraswap.io/prices?srcToken=${destToken}&destToken=${srcToken}&amount=${estimatedDestAmount}&side=SELL&network=${network}&srcDecimals=${decimals}&destDecimals=${srcDecimals}&otherExchangePrices=true`;
                    const buyResponse = await fetch(buyUrl, { headers: { 'Accept': 'application/json' } });

                    if (buyResponse.ok) {
                        const buyData = await buyResponse.json();
                        if (buyData.error) {
                            console.error(`Error in buy data: ${buyData.error} - Value: ${buyData.value}`);
                            return;
                        }

                        const estSell = buyData?.priceRoute?.destAmount / Math.pow(10, buyData?.priceRoute?.destDecimals);

                        console.log('Link to USDT:', buyData);

                        setBuySellData((prevData) => ({
                            ...prevData,
                            [destToken]: {
                                buyData,
                                sellData,
                                buyOutAmount: estBuy,
                                sellOutAmount: estSell,
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

    const processDEXData = (data, destToken, symbol) => {
        const srcDecimals = data.priceRoute.srcDecimals;
        const destDecimals = data.priceRoute.destDecimals;
        const destUSD = data.priceRoute.destUSD;

        // const bestRoute = data.priceRoute.bestRoute.swaps;
        // bestRoute.map((route) => {
        //     route.swapExchanges.map(r => ({

        //     }))
        // })

        const processedData = data.priceRoute.others.map(dex => ({
            exchange: dex.exchange,
            srcAmount: parseFloat((parseInt(dex.srcAmount) / Math.pow(10, srcDecimals)).toFixed(srcDecimals)),
            destAmount: parseFloat((parseInt(dex.destAmount) / Math.pow(10, destDecimals)).toFixed(destDecimals)),
            unit: dex.unit,
            gasCost: dex.data && dex.data.gasUSD ? parseFloat(dex.data.gasUSD).toFixed(6) : 'N/A',
            decimals: destDecimals,
            symbol: symbol,
            equivalentUSD: destUSD,
            fee: dex.data.feeFactor / Math.pow(10, 4)
        }));

        const sortedDestAmounts = processedData.map(dex => dex.destAmount).sort((a, b) => a - b);
        const midIndex = Math.floor(sortedDestAmounts.length / 2);
        const medianDestAmount = sortedDestAmounts.length % 2 !== 0
            ? sortedDestAmounts[midIndex]
            : (sortedDestAmounts[midIndex - 1] + sortedDestAmounts[midIndex]) / 2;

        const filteredData = processedData.filter(dex => {
            const deviation = Math.abs(dex.destAmount - medianDestAmount) / medianDestAmount;
            return deviation <= 0.1; // 10% tolerance
        });

        console.log("processedData: ", processedData);
        console.log("filteredData: ", filteredData);

        const bestBuy = filteredData.reduce((min, dex) => (dex.destAmount < min.destAmount ? dex : min), filteredData[0] || {});
        const bestSell = filteredData.reduce((max, dex) => (dex.destAmount > max.destAmount ? dex : max), filteredData[0] || {});

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

    useEffect(() => {
        // Function to handle fetching data with delays and wait for all fetches to finish
        const fetchDataWithDelay = async () => {
          let delay = 0;
      
          // Use Promise.all to wait for all the fetch operations to complete
          await Promise.all(
            tokens.map((token, index) => 
              new Promise((resolve) => {
                setTimeout(async () => {
                  await fetchBuySellData(token.address, token.decimals, token.symbol);
                  resolve(); // Resolve the promise once fetch is done
                }, delay);
                delay += 2000; // Add 2-second delay between each request
              })
            )
          );
      
          setLoading(false); // Set loading to false only when all fetches are done
        };
      
        // Initial fetch
        fetchDataWithDelay();
      
        // Set an interval to repeat the process after all requests have been completed
        const interval = setInterval(async () => {
          await fetchDataWithDelay(); // Refetch after all previous fetches are completed
        }, 60000); // 30-second interval
      
        // Cleanup interval on unmount or when tokens change
        return () => clearInterval(interval);
    }, [tokens, srcToken, srcDecimals, sourceAmount]);
      

    const calculateArbitrage = (buyDex, sellDex) => {
        if (!buyDex || !sellDex) return 'N/A';
        const profit = sellDex.destAmount - buyDex.destAmount;
        const profitPercentage = (profit / buyDex.destAmount) * 100;
        return profitPercentage.toFixed(6);
    };

    const calculateNetProfit = (tokenAddress) => {
        
        const data = buySellData[tokenAddress];
        console.log("data: ", data);
        if (!data) return null;

        const initialAmount = parseFloat(amount) / Math.pow(10, srcDecimals);
        const buyOutAmount = parseFloat(parseFloat(data.buyOutAmount).toFixed(4));;
        const sellOutAmount = parseFloat(parseFloat(data.sellOutAmount).toFixed(4));;
        const polygonFee = parseFloat(data?.buyData?.priceRoute?.gasCostUSD).toFixed(4); // Fixed network fee
        const exchangeFee = initialAmount * 0.006; // 0.6% exchange fee

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

    const saveNetProfit = (details) => {
        fetch("https://rapidfox.io/bot/save_net_paraswap.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `details=${encodeURIComponent(details)}`,
          })
          .then((response) => response.json())
          .then((data) => {
            console.log('Success:', data);
          })
          .catch((error) => {
            console.error('Error:', error);
          });
    }

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


    const displayBestRouteExchange = (buySellData, tokenAddress, type) => {
        const data = type === 'buy' ? buySellData[tokenAddress]?.buyData : buySellData[tokenAddress]?.sellData;
        const bestRoute = data?.priceRoute?.bestRoute;
        
        if (bestRoute && bestRoute.length > 0) {
          const swaps = bestRoute[0].swaps;
          
          if (swaps && swaps.length > 0) {
            const swapExchanges = swaps[0].swapExchanges;
            
            if (swapExchanges && swapExchanges.length > 0) {
              return swapExchanges[0].exchange; // Display the best exchange for the swap
            }
          }
        }
      
        return 'Unknown Exchange'; // Fallback in case no valid exchange is found
    };

    return (
        <div className="container mx-auto px-4 py-8">

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
                                                {/* <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gas Cost (USD)</th> */}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {dexData[token.address]?.map((dex, dexIndex) => (
                                                <tr key={dexIndex} className={dexIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{dex.exchange}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{dex.srcAmount}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{dex.destAmount}(${parseFloat(dex.equivalentUSD).toFixed(3)})</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">1 {currencySymbol} - {dex.unit / Math.pow(10, dex.decimals)} {dex.symbol}</td>
                                                    {/* <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{dex.gasCost}</td> */}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="p-4 bg-gray-100">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white p-4 rounded-lg shadow">
                                            <h4 className="text-lg font-semibold mb-2">Best Buy</h4>
                                            <p>{bestBuySellData[token.address]?.bestBuy?.exchange}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg shadow">
                                            <h4 className="text-lg font-semibold mb-2">Best Sell</h4>
                                            <p>{bestBuySellData[token.address]?.bestSell?.exchange}</p>
                                        </div>

                                        {/* <div className="bg-white p-4 rounded-lg shadow">
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
                                        </div> */}
                                    </div>

                                    <div className="bg-white p-4 rounded-lg shadow mt-4">
                                        <h4 className="text-lg font-semibold mb-2">Net Profit Calculation</h4>
                                        {buySellData[token.address] ? (
                                            <div>
                                                {(() => {
                                                    const profitData = calculateNetProfit(token.address);
                                                    console.log("Net: ", profitData);
                                                    if (!profitData) return 'Loading...';

                                                    const { initialAmount, buyOutAmount, sellOutAmount, polygonFee, exchangeFee, finalNetAmount, netProfit } = profitData;
                                                    const details = `Initial Amount: ${initialAmount.toFixed(6)} ${currencySymbol}, Buy: ${displayBestRouteExchange(buySellData, token.address, 'buy')}, Buy Output: ${buyOutAmount} ${token.symbol}, Sell: ${displayBestRouteExchange(buySellData, token.address, 'sell')}, Sell Output: ${sellOutAmount} ${currencySymbol}, Polygon Network Fee: ${polygonFee} USDT, Exchange Fee: ${exchangeFee.toFixed(6)} ${currencySymbol}, Final Net Amount: ${finalNetAmount.toFixed(6)} ${currencySymbol}, Net Profit: ${netProfit.toFixed(6)} ${currencySymbol}`;

                                                    if (netProfit > 0.00) {
                                                        console.log("Got Profit")
                                                        saveNetProfit(details);
                                                    }

                                                    return (
                                                        <>
                                                            <p><b>Initial Loan Amount:</b> {initialAmount.toFixed(6)} {currencySymbol}</p>
                                                            <p><b>Buy on {displayBestRouteExchange(buySellData, token.address, 'buy')}:</b> Input Amount: {initialAmount} {currencySymbol} - <b>Output Amount:</b> {buyOutAmount} {token.symbol}</p>
                                                            <p><b>Sell on {displayBestRouteExchange(buySellData, token.address, 'sell')}:</b> Input Amount: {buyOutAmount} {token.symbol} - <b>Output Amount:</b> {sellOutAmount} {currencySymbol}</p>
                                                            {/* <p>Buy Amount: {initialAmount} {currencySymbol} - <b>Output Amount:</b> {buyOutAmount} {token.symbol}</p>
                                                            <p>Sell Amount: {buyOutAmount} {token.symbol} - <b>Output Amount:</b> {sellOutAmount} {currencySymbol}</p> */}
                                                            <p><b>Polygon Network Fee:</b> {polygonFee} USDT</p>
                                                            <p><b>Exchange Fee (0.6%):</b> {exchangeFee.toFixed(6)} {currencySymbol}</p>
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
                    ))}
                </>
            )}
        </div>
    );
}

export default ImprovedDEXComparisonComponent;