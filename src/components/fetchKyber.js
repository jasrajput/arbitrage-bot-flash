import { LiquidityWidget, PoolType } from "@kyberswap/liquidity-widgets";
import { ethers } from 'ethers';

const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);


const FetchKyber = () => {
    return (
        <LiquidityWidget
            theme={{
                text: "#FFFFFF",
                subText: "#B6AECF",
                icons: "#a9a9a9",
                layer1: "#27262C",
                dialog: "#27262C",
                layer2: "#363046",
                stroke: "#363046",
                chartRange: "#5DC5D2",
                chartArea: "#457F89",
                accent: "#5DC5D2",
                warning: "#F4B452",
                error: "#FF5353",
                success: "#189470",
                fontFamily: "Kanit, Sans-serif",
                borderRadius: "20px",
                buttonRadius: "16px",
                boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.04)",
            }}
            provider={ethersProvider}
            chainId={137}
            poolType={PoolType.DEX_PANCAKESWAPV3}
            poolAddress="0x36696169c63e42cd08ce11f5deebbcebae652050"
            onDismiss={() => {
                console.log("Dismiss");
            }}
            source="zap-widget-demo"
            />

    )
}

export default FetchKyber;