// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// imports from github (~ npm)
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {

    function getPrice(AggregatorV3Interface priceFeed) internal view returns(uint256){
        // As we rely on an external contract to get the price we'll need the ABI and its address
        // ABI
        // Address: 0x8A753747A1Fa494EC906cE90E9f37563A8AF630e
        // If the contract at this address fits this ABI (interface) then it will work!
        // AggregatorV3Interface priceFeed = AggregatorV3Interface(0x8A753747A1Fa494EC906cE90E9f37563A8AF630e);
        (,int256 price,,,) = priceFeed.latestRoundData();
        // returns ETH price in terms of USD
        // E.g., 300000000000. Solidity doesn't work well with explicit decimals (but we can query the 
        // aggregator interface for decimals() to find out it uses 8 decimals, i.e. 3000.00000000
        // As we will use this function in fund() and we're working with uint256 wtih 18 decimals we'll 
        // we'll want to convert it to conform with this numerical format
        return uint256(price * 1e10); 
    }

    function getConversionRate(uint256 ethAmount, AggregatorV3Interface priceFeed) internal view returns(uint256) {
        uint256 ethPrice = getPrice(priceFeed);
        // We must remember to 'divide by 1e18' because the multiplication adds another 1e18 decimals to it.
        uint256 ethAmountInUsd = (ethPrice * ethAmount) / 1e18;
        return ethAmountInUsd;
    }

}