import React, { useState, useEffect } from 'react';

function ImprovedDEXComparisonComponent() {
  const [priceData, setPriceData] = useState(null);
  const [dexComparison, setDexComparison] = useState([]);
  const [bestBuy, setBestBuy] = useState(null);
  const [bestSell, setBestSell] = useState(null);
  const [excludedExchanges, setExcludedExchanges] = useState(['WaultFinance']);

  useEffect(() => {
    const fetchPriceData = async () => {
      const srcToken = '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6';
      const destToken = '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619';
      const amount = '100000000';
      const network = '137';

      const url = `https://api.paraswap.io/prices?srcToken=${srcToken}&destToken=${destToken}&amount=${amount}&side=SELL&network=${network}&otherExchangePrices=true`;

      try {
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          console.log(data);
          setPriceData(data);
          processDEXData(data);
        } else {
          console.error('Error fetching price data:', response.statusText);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchPriceData();
  }, [excludedExchanges]);

  const processDEXData = (data) => {
    if (!data || !data.priceRoute || !data.priceRoute.others) return;

    const srcDecimals = data.priceRoute.srcDecimals;
    const destDecimals = data.priceRoute.destDecimals;

    const processedData = data.priceRoute.others
      .filter(dex => !excludedExchanges.includes(dex.exchange))
      .map(dex => ({
        exchange: dex.exchange,
        srcAmount: parseFloat((parseInt(dex.srcAmount) / Math.pow(10, srcDecimals)).toFixed(srcDecimals)),
        destAmount: parseFloat((parseInt(dex.destAmount) / Math.pow(10, destDecimals)).toFixed(destDecimals)),
        unit: dex.unit,
        gasCost: dex.data && dex.data.gasUSD ? parseFloat(dex.data.gasUSD).toFixed(6) : 'N/A',
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
      return deviation <= 0.6; // 10% tolerance
    });

    // Find best buy (lowest destAmount) and best sell (highest destAmount) from filtered data
    const bestBuyDex = filteredData.reduce((min, dex) => dex.destAmount < min.destAmount ? dex : min);
    const bestSellDex = filteredData.reduce((max, dex) => dex.destAmount > max.destAmount ? dex : max);

    setBestBuy(bestBuyDex);
    setBestSell(bestSellDex);

    setDexComparison(filteredData);
  };

  const calculateArbitrage = (buyDex, sellDex) => {
    if (!buyDex || !sellDex) return 'N/A';
    const profit = sellDex.destAmount - buyDex.destAmount;
    const profitPercentage = (profit / buyDex.destAmount) * 100;
    return profitPercentage.toFixed(9);
  };

  const handleExcludeExchange = (exchange) => {
    setExcludedExchanges(prev => [...prev, exchange]);
  };

  const handleIncludeExchange = (exchange) => {
    setExcludedExchanges(prev => prev.filter(e => e !== exchange));
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>DEX Comparison and Arbitrage Analysis</h1>
      {dexComparison.length > 0 ? (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Exchange</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Source Amount</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Destination Amount</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Unit Price</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Gas Cost (USD)</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {dexComparison.map((dex, index) => (
                <tr key={index} style={{ backgroundColor: 
                  dex.exchange === bestBuy.exchange ? '#e6ffe6' : 
                  dex.exchange === bestSell.exchange ? '#ffe6e6' : 'white' 
                }}>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{dex.exchange}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{dex.srcAmount.toFixed(3)}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{dex.destAmount.toFixed(3)}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{dex.unit}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{dex.gasCost}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    <button onClick={() => handleExcludeExchange(dex.exchange)}>Exclude</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>Arbitrage Opportunity</h2>
            <p>Best Buy: {bestBuy.exchange} (Dest. Amount: {bestBuy.destAmount.toFixed(6)})</p>
            <p>Best Sell: {bestSell.exchange} (Dest. Amount: {bestSell.destAmount.toFixed(6)})</p>
            <p>Potential Profit: {calculateArbitrage(bestBuy, bestSell)}%</p>
          </div>
          <div>
            <h3>Excluded Exchanges</h3>
            <ul>
              {excludedExchanges.map((exchange, index) => (
                <li key={index}>
                  {exchange} <button onClick={() => handleIncludeExchange(exchange)}>Include</button>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <p>Loading DEX comparison data...</p>
      )}
    </div>
  );
}

export default ImprovedDEXComparisonComponent;