// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    // to get price we need to use chainlink data feeds which gets the price for us.
    function getPrice(
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        // since the contract reacts with the outside network following things are needed.
        // ABI
        // Address - 0x694AA1769357215DE4FAC081bf1f309aDC325306 // this is the feed testnet address extracted from chainlink to get the pricefeeed.
        // AggregatorV3Interface priceFeed = AggregatorV3Interface(
        //     0x0FE374673c61690D1f4Ea90706281b2Ab2fD1890
        // );
        (, int256 price, , , ) = priceFeed.latestRoundData();
        // price eth in usd
        return uint256(price * 1e10);
    }

    // function getVersion() internal view returns (uint256) {
    //     address ad = 0x694AA1769357215DE4FAC081bf1f309aDC325306;
    //     return AggregatorV3Interface(ad).version();
    // }

    function getConversionRates(
        uint256 ethAmount,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        uint256 ethPrice = getPrice(priceFeed);
        uint256 ethAmountinUsd = (ethPrice * ethAmount) / 1e18;
        return ethAmountinUsd;
    }
}
