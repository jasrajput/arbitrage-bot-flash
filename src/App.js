import React from 'react';
import OpenOceanTokenList from './components/fetchTokens';
// import OpenOceanSwap from './components/fetchSwapQuote';
import TokenPairs from './components/paraswapTokenLists';
import ParaswapComponent from './components/fetchParaswapOld';



function App() {
  return (
    <div className="App bg-green-500">
      {/* <ParaswapComponent /> */}
      <TokenPairs />
      {/* <OpenOceanSwap /> */}
      {/* <TokenListComponent /> */}
      {/* <FetchKyber /> */}
    </div>
  );
}

export default App;
