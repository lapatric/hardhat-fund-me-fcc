const networkConfig = {
    4: {
        name: "rinkeby",
        ethUsdPriceFeed: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
    },
    137:{
        name: "polygon",
        ethUsdPriceFeed: "0xF9680D99D6C9589e2a93a78A04A279e509205945"
    },
}

const developmentChains = ["hardhat", "localhost"];
const DECIMALS = 8;
const INITIAL_ANSWER = 200000000000

// The following export allows us to import the above variable easily through
// const {networkConfig} = require("../helper-hardhat-config");
// Otherwise we would need to do 
// const helperConfig = require("../helper-hardhat-config");
// const networkConfig = helperConfig.networkConfig;
module.exports = {
    networkConfig,
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
}