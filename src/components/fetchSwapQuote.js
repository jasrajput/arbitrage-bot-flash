import React, { useState } from "react";
import axios from "axios";
import { ethers } from "ethers";
import contractABI from "../abi/ContractABI"; // Your ABI file

const OpenOceanFlashLoan = () => {
  const [error, setError] = useState(null);

  const secondaryCurrency = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";

  const executeFlashLoan = async (swapCalldata, estimatedGas, gasPrice, profit) => {
    
    // Set up provider and signer
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    // Your contract address
    const contractAddress = '0x008f6cd2490E642f3990D58a5236863E501f9e3c'; // Replace with your contract address
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    // Prepare parameters
    const tokenAddresses = [
      '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // USDT
      secondaryCurrency  // USDC.POS
    ];
    const caller = await signer.getAddress(); // Get the caller's address
    const amount = ethers.utils.parseUnits("5", 6); // Amount to borrow (50 USDT, 6 decimals)
    const dexPath = [2];

    console.log(swapCalldata);
    console.log("Swap Calldata Length:", swapCalldata.length);
    console.log("Dex Path Length:", dexPath.length);

    const roundedProfit = Math.floor(profit * 1e6) / 1e6;
    const profitAmount = ethers.utils.parseUnits(roundedProfit.toString(), 6);

    try {
      // Call the function with prepared parameters
      const tx = await contract.requestFlashLoanForBot({
        tokenAddress: tokenAddresses,
        caller: caller,
        profit: profitAmount,
        amount: amount,
        dexPath: dexPath,
        swapCalldata: swapCalldata // Data received from OpenOcean
      }
      , {
        gasLimit: "6000000",      // Set the estimated gas limit here
        gasPrice: gasPrice
       }
);

      await tx.wait(); // Wait for the transaction to be mined
      console.log('Flash loan transaction successful:', tx);
    } catch (error) {
      console.error('Error executing flash loan:', error);
      setError(error.message);
    }
  };


  const fetchSwapQuoteAndExecute = async () => {
    const params = {
      chain: 'polygon',
      inTokenAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // USDT
      outTokenAddress: secondaryCurrency, // USDC.POS
      amount: 5,
      gasPrice: 50,
      slippage: 1,
      account: '0xEDF8C42a83362896e17AEa8604e12Ae46d4Acb69'
    };

    try {
      // Fetch the first swap quote (USDT to USDC)
      const response = await axios.get(`https://open-api.openocean.finance/v3/${params.chain}/swap_quote`, {
            params: {
            inTokenAddress: params.inTokenAddress,
            outTokenAddress: params.outTokenAddress,
            amount: params.amount,
            gasPrice: params.gasPrice,
            slippage: params.slippage,
            account: params.account
         }
      });


      const priceImpact = response.data.data.price_impact;

      console.log('Price Impact:', priceImpact);

        // Check price impact before proceeding
        // if (Math.abs(priceImpact) > 1) { // Set your desired threshold
        //     alert('Price impact exceeds acceptable limits:', priceImpact);
        //     return; // Stop execution if the price impact is too high
        // }

        console.log('First Swap Response:', response.data.data);
        console.log('First Swap object:', params);

        if (response.data.data) {
            const { data: swapCalldata, estimatedGas, gasPrice: swapGasPrice } = response.data.data;

            const outTokenDecimals = response.data.data.outToken.decimals; // Get the decimals for USDC
            // Fetch the second swap quote (USDC to USDT)
            const reverseParams = {
                chain: params.chain,
                inTokenAddress: params.outTokenAddress, // Now using USDC
                outTokenAddress: params.inTokenAddress, // Now using USDT
                amount: (response.data.data.outAmount / Math.pow(10, outTokenDecimals)),
                gasPrice: params.gasPrice,
                slippage: params.slippage,
                account: params.account
            };

            const reverseResponse = await axios.get(`https://open-api.openocean.finance/v3/${reverseParams.chain}/swap_quote`, {
            params: {
                inTokenAddress: reverseParams.inTokenAddress,
                outTokenAddress: reverseParams.outTokenAddress,
                amount: reverseParams.amount,
                gasPrice: reverseParams.gasPrice,
                slippage: reverseParams.slippage,
                account: reverseParams.account
            }
            });

            console.log('Second Swap object:', reverseParams);
            console.log('Second Swap Response:', reverseResponse.data.data);

            const profit = reverseParams.amount - params.amount;
            // alert(profit)

            if (reverseResponse.data.data && profit > 0.00) {
            const reverseSwapCalldata = reverseResponse.data.data.data; // Calldata for second swap
            // alert(reverseSwapCalldata)
            // const reverseEstimatedGas = reverseResponse.data.data.estimatedGas; // Estimated gas for second swap
            // const reverseGasPrice = reverseResponse.data.data.gasPrice; // Gas price for second swap

            // alert(estimatedGas * 4);
            const adjustedGasLimit = estimatedGas * 2.4; // or 1.5 based on your needs

            // Execute flash loan with both swap calldata
            const swapCalldataArray = [swapCalldata]; // Prepare array of calldata for both swaps
            await executeFlashLoan(swapCalldataArray, adjustedGasLimit, swapGasPrice, profit); // Pass total estimated gas and gas price for the transaction
            } else {
            setError("No data received for the second swap or no profit");
            }
        } else {
            setError("No data received for the first swap");
        }
        } catch (err) {
        setError(err.message);
        }
 };


  return (
    <div>
      <h1>OpenOcean Flash Loan</h1>
      <button onClick={fetchSwapQuoteAndExecute}>Execute Flash Loan</button>
      {error && <p>Error: {error}</p>}
    </div>
  );
};

export default OpenOceanFlashLoan;
