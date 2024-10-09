import React, { useState, useEffect } from 'react';
import { cacheExchange, createClient, fetchExchange, Provider, useQuery } from 'urql';

// Get API key from environment variables
const api_key = process.env.REACT_APP_API_KEY;

// Create clients for both Uniswap and QuickSwap
const UNISWAP_V3_CLIENT = createClient({
  url: `https://gateway.thegraph.com/api/${api_key}/subgraphs/id/BvYimJ6vCLkk63oWZy7WB5cVDTVVMugUAF35RAUZpQXE`,
  exchanges: [cacheExchange, fetchExchange],
});

const QUICKSWAP_CLIENT = createClient({
  url: `https://gateway.thegraph.com/api/${api_key}/subgraphs/id/FqsRcH1XqSjqVx9GRTvEJe959aCbKrcyGgDWBrUkG24g`,
  exchanges: [cacheExchange, fetchExchange],
});

const BALANCER_CLIENT = createClient({
  url: `https://gateway.thegraph.com/api/${api_key}/subgraphs/id/H9oPAbXnobBRq1cB3HDmbZ1E8MWQyJYQjT1QDJMrdbNp`,
  exchanges: [cacheExchange, fetchExchange],
});

const SUSHISWAP_CLIENT = createClient({
  url: `https://gateway.thegraph.com/api/${api_key}/subgraphs/id/B3Jt84tHJJjanE4W1YijyksTwtm7jqK8KcG5dcoc1ZNF`,
  exchanges: [cacheExchange, fetchExchange],
});

const APESWAP_CLIENT = createClient({
  url: `https://gateway.thegraph.com/api/${api_key}/subgraphs/id/2x478mWv6rECUcJR4VxNxRnuMuRsY22Jxy7xxXJu4Q7F`,
  exchanges: [cacheExchange, fetchExchange],
});



const TOKEN_QUERY = `{
  usdc: token(id: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174") {
    ...TokenFields
  }
  wbtc: token(id: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6") {
    ...TokenFields
  }
  weth: token(id: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619") {
    ...TokenFields
  }
  link: token(id: "0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39") {
    ...TokenFields
  }
  dai: token(id: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063") {
    ...TokenFields
  }
  lido: token(id: "0xc3c7d422809852031b44ab29eec9f1eff2a58756") {
    ...TokenFields
  }
}

fragment TokenFields on Token {
  symbol
  name
  decimals,
  lastPriceUSD
}
`;

const QUICKSWAP_QUERY =  `{
  bundles(first: 1) {
    maticPriceUSD
  }
  
  usdc: token(id: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174") {
    ...TokenFields
  }
  wbtc: token(id: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6") {
    ...TokenFields
  }
  weth: token(id: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619") {
    ...TokenFields
  }
  link: token(id: "0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39") {
    ...TokenFields
  }
  dai: token(id: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063") {
    ...TokenFields
  }
  lido: token(id: "0xc3c7d422809852031b44ab29eec9f1eff2a58756") {
    ...TokenFields
  }
}

fragment TokenFields on Token {
  symbol
  name
  decimals,
  derivedMatic
}
`;

const BALANCER_QUERY = `{
  usdc: token(id: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174") {
    ...TokenFields
  }
  wbtc: token(id: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6") {
    ...TokenFields
  }
  weth: token(id: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619") {
    ...TokenFields
  },
  link: token(id: "0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39") {
    ...TokenFields
  },
  dai: token(id: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063") {
    ...TokenFields
  },
  lido: token(id: "0xc3c7d422809852031b44ab29eec9f1eff2a58756") {
    ...TokenFields
  }
  
}

fragment TokenFields on Token {
  symbol
  name
  decimals
  latestUSDPrice
}
`;

const APESWAP_QUERY = `{
  usdc: token(id: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174") {
    ...TokenFields
  }
  wbtc: token(id: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6") {
    ...TokenFields
  }
  weth: token(id: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619") {
    ...TokenFields
  },
  link: token(id: "0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39") {
    ...TokenFields
  },
  dai: token(id: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063") {
    ...TokenFields
  },
  lido: token(id: "0xc3c7d422809852031b44ab29eec9f1eff2a58756") {
    ...TokenFields
  }
  
}

fragment TokenFields on Token {
  symbol
  name
  decimals,
  lastPriceUSD
}`;

const SUSHISWAP_QUERY = `{
  usdc: token(id: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174") {
    ...TokenFields
  }
  wbtc: token(id: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6") {
    ...TokenFields
  }
  weth: token(id: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619") {
    ...TokenFields
  },
  link: token(id: "0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39") {
    ...TokenFields
  },
  dai: token(id: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063") {
    ...TokenFields
  },
  lido: token(id: "0xc3c7d422809852031b44ab29eec9f1eff2a58756") {
    ...TokenFields
  }
  
}

fragment TokenFields on Token {
  symbol
  name
  decimals,
  lastPriceUSD
  
}
`;

const TokenPriceComparison = () => {
  const [uniswapData, setUniswapData] = useState([]);
  const [quickswapData, setQuickswapData] = useState([]);
  const [balancerData, setBalancerData] = useState([]);
  const [sushiData, setSushiData] = useState([]);
  const [apeData, setApeData] = useState([]);
  
  const [maticPriceUSD, setMaticPriceUSD] = useState(0);

    //Fetch Uniswap data
    const UniswapComponent = () => {
      const [uniswapResult] = useQuery({ 
        query: TOKEN_QUERY, 
        client: UNISWAP_V3_CLIENT, 
        // requestPolicy: 'network-only',
        // pollInterval: 10000
      });
      console.log('uni client: ', uniswapResult);
      useEffect(() => {
        if (uniswapResult.data && !uniswapResult.fetching && !uniswapResult.error) {
          setUniswapData(uniswapResult.data);
        }
      }, [uniswapResult.data]);
      return null; // No rendering needed
    };

    //Fetch QuickSwap data
    const QuickSwapComponent = () => {
      const [quickswapResult] = useQuery({ 
        query: QUICKSWAP_QUERY, 
        client: QUICKSWAP_CLIENT, 
        // requestPolicy: 'network-only', 
        pollInterval: 10000 
      });
      console.log('quick client: ', quickswapResult);
      useEffect(() => {
        if (quickswapResult.data && !quickswapResult.fetching && !quickswapResult.error) {
          setMaticPriceUSD(parseFloat(quickswapResult.data.bundles[0].maticPriceUSD));
          setQuickswapData(quickswapResult.data);
        }
      }, [quickswapResult.data]);

      return null; // No rendering needed
    };

    // Fetch Balancer data
    const BalancerComponent = () => {
      const [balancerResult] = useQuery({ 
        query: BALANCER_QUERY, 
        client: BALANCER_CLIENT, 
        // requestPolicy: 'network-only', 
        pollInterval: 10000
      });
      console.log('balancer client: ', balancerResult);
      useEffect(() => {
        if (balancerResult.data && !balancerResult.fetching && !balancerResult.error) {
          setBalancerData(balancerResult.data);
        }
      }, [balancerResult.data]);
      return null; // No rendering needed
    };

    // Fetch sushi data
    const SushiComponent = () => {
      const [sushiResult] = useQuery({ 
        query: SUSHISWAP_QUERY, 
        client: SUSHISWAP_CLIENT, 
        // requestPolicy: 'network-only', 
        pollInterval: 10000
      });
      console.log('sushi client: ', sushiResult);
      useEffect(() => {
        if (sushiResult.data && !sushiResult.fetching && !sushiResult.error) {
          setSushiData(sushiResult.data);
        }
      }, [sushiResult.data]);
      return null; // No rendering needed
    };

    // Fetch ape data
    const ApeComponent = () => {
      const [apeResult] = useQuery({ 
        query: APESWAP_QUERY, 
        client: APESWAP_CLIENT, 
        // requestPolicy: 'network-only', 
        pollInterval: 10000
      });
      console.log('ape client: ', apeResult);
      useEffect(() => {
        if (apeResult.data && !apeResult.fetching && !apeResult.error) {
          setApeData(apeResult.data);
        }
      }, [apeResult.data]);
      return null; // No rendering needed
    };


    const renderTableRows = () => {
      if (!uniswapData || !quickswapData || !balancerData) {
        return (
          <tr>
            <td colSpan="10" style={{ textAlign: 'center', padding: '8px' }}>Loading...</td>
          </tr>
        );
      }
    
      const initialAmount = 10; // Initial investment amount in USD
      const tokens = Object.keys(uniswapData);
    
      return tokens.map((token) => {
        if (token === '__typename' || token === 'bundles') return null;
    
        const uniPrice = parseFloat(uniswapData[token]?.lastPriceUSD) || 0;
        const sushiPrice = parseFloat(sushiData[token]?.lastPriceUSD) || 0;
        const quickswapDerivedMatic = parseFloat(quickswapData[token]?.derivedMatic) || 0;
        const quickPrice = quickswapDerivedMatic * maticPriceUSD;
        const balancerPrice = parseFloat(balancerData[token]?.latestUSDPrice) || 0;
        const apePrice = parseFloat(apeData[token]?.lastPriceUSD) || 0;
    
        const prices = [
          { exchange: 'Uniswap', price: uniPrice },
          { exchange: 'QuickSwap', price: quickPrice },
          { exchange: 'Balancer', price: balancerPrice },
          { exchange: 'Sushiswap', price: sushiPrice },
          { exchange: 'ApeSwap', price: apePrice }
        ];
    
        const bestBuy = prices.filter((item) => item.price > 0).reduce((min, curr) => (curr.price < min.price ? curr : min), prices[0]);
        const bestSell = prices.filter((item) => item.price > 0).reduce((max, curr) => (curr.price > max.price ? curr : max), prices[0]);

    
        const profitPercentage = bestBuy.price > 0
          ? (((bestSell.price - bestBuy.price) / bestBuy.price) * 100).toFixed(2)
          : '0.00';
    
        const potentialProfit = bestBuy.price > 0
          ? (((bestSell.price - bestBuy.price) / bestBuy.price) * initialAmount).toFixed(2)
          : '0.00';
    
        // Calculate equivalent value for the initial amount in each DEX
        const uniEquivalentValue = uniPrice > 0 ? (initialAmount / uniPrice).toFixed(6) : '0.000000';
        const quickEquivalentValue = quickPrice > 0 ? (initialAmount / quickPrice).toFixed(4) : '0.000000';
        const balancerEquivalentValue = balancerPrice > 0 ? (initialAmount / balancerPrice).toFixed(4) : '0.000000';
        const sushiEquivalentValue = sushiPrice > 0 ? (initialAmount / sushiPrice).toFixed(4) : '0.000000';
        const apeEquivalentValue = apePrice > 0 ? (initialAmount / apePrice).toFixed(4) : '0.000000';
    
        return (
          <tr key={token}>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{uniswapData[token]?.name}</td>
            {/* <td style={{ border: '1px solid #ddd', padding: '8px' }}>{uniEquivalentValue}</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{quickEquivalentValue}</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{balancerEquivalentValue}</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{sushiEquivalentValue}</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{apeEquivalentValue}</td> */}

            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{parseFloat(uniPrice).toFixed(4)}</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{parseFloat(quickPrice).toFixed(4)}</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{parseFloat(balancerPrice).toFixed(4)}</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{parseFloat(sushiPrice).toFixed(4)}</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{parseFloat(apePrice).toFixed(4)}</td>


            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{bestBuy.exchange}</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{bestSell.exchange}</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{profitPercentage}%</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>${potentialProfit}</td>
          </tr>
        );
      });
    };
    
    
  return (
    <div style={{ padding: '20px' }}>
      <h1>Token Pair Price Comparison (Uniswap vs QuickSwap)</h1>
      <Provider value={UNISWAP_V3_CLIENT}>
        <UniswapComponent />
      </Provider>
      <Provider value={QUICKSWAP_CLIENT}>
        <QuickSwapComponent />
      </Provider>
      <Provider value={BALANCER_CLIENT}>
        <BalancerComponent />
      </Provider>
      <Provider value={SUSHISWAP_CLIENT}>
        <SushiComponent />
      </Provider>

      <Provider value={APESWAP_CLIENT}>
        <ApeComponent />
      </Provider>
      
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Token Pair</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Uniswap Price</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>QuickSwap Price</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Balancer Price</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Sushiswap Price</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>ApeSwap Price</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Best Buy Price (Exchange)</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Best Sell Price (Exchange)</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Profit Percentage</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Potential Profit</th>
          </tr>
        </thead>
        <tbody>{renderTableRows()}</tbody>
      </table>
    </div>
  );
};

export default TokenPriceComparison;
