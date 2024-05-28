// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "./PriceConverter.sol";

error FundMe__notOwner();
error FundMe__notEnoughGas();

/**
 * @title A Sample Funding Contract
 * @author Uday Singh
 * @notice A Sample Funding Contract to learn the basics of Blockchain
 * @dev This implements price feeds as our library
 */
contract FundMe {
    // Type Declerations
    using PriceConverter for uint256;

    // state Variables
    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;

    // constant variables.
    uint256 public MIN_USD = 50 * 1e18;
    address private immutable i_owner;
    string private constant AUTHOR = "Uday Singh";
    AggregatorV3Interface private s_priceFeed;

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    modifier OnlyOwner() {
        if (msg.sender != i_owner) revert FundMe__notOwner();
        _;
    }

    /**  @notice Funds our contract based on the ETH/USD price */
    function fundMe() public payable {
        // if conditon false reverts the remaining gas.
        if (msg.value.getConversionRates(s_priceFeed) < MIN_USD)
            revert FundMe__notEnoughGas();
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] = msg.value;
    }

    function withdraw() public payable OnlyOwner {
        address[] memory funders = s_funders;
        uint256 len = funders.length;

        for (uint256 i = 0; i < len; i++) {
            address funder = funders[i];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);

        (bool callSuccess /*bytes memory dataReturned*/, ) = payable(msg.sender)
            .call{value: address(this).balance}("");
        require(callSuccess, "Transaction UnSuccessFull");
    }

    /** A Costly withdraw function , it costs more gas*/
    function costly_withdraw() public OnlyOwner {
        for (
            uint256 s_fundersIdx = 0;
            s_fundersIdx < s_funders.length;
            s_fundersIdx++
        ) {
            address funder = s_funders[s_fundersIdx];
            s_addressToAmountFunded[funder] = 0;
        }

        // reset the array
        s_funders = new address[](0);
        // actually withdraw the funds
        /*      
        ways to transer..
        // transfer
        // send 
        // call


        // msg.sender == address type;
        // payable(msg.sender) == payable address type;

        // transfer;
        // address(this) reffers to the contract;
        payable (msg.sender).transfer(address(this).balance);

        // send
        bool sendSuccess = payable (msg.sender).send(address(this).balance);
        require(sendSuccess, "Transaction UnSuccessFull");
        */
        // call
        (bool callSuccess /*bytes memory dataReturned*/, ) = payable(msg.sender)
            .call{value: address(this).balance}("");
        require(callSuccess, "Transaction UnSuccessFull");
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunders(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(
        address funder
    ) public view returns (uint256) {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
