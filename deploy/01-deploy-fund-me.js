const { getNamedAccounts, deployments, network } = require("hardhat");
const {
  networkConfig,
  developmentChains,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

// module.exports.default = deployFunc;

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  // console.log(chainId);

  // when going for localnetwork or hardhat we use mock
  // const ETH_USD_PriceFeedAddress = networkConfig[chainId][ETH_USD_PriceFeed];

  let ethUsdPriceFeedAddress;
  if (chainId == 31337) {
    const ethUsdAggregator = await deployments.get("MockV3Aggregator");
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
  } else {
    // ethUsdPriceFeedAddress = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
    ethUsdPriceFeedAddress = networkConfig[chainId].ETH_USD_PriceFeed;
  }

  const args = [ethUsdPriceFeedAddress];
  const FundMe = await deploy("FundMe", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  // log(FundMe);

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(FundMe.address, args);
  }
  log("-----------------------------------------------------------------");
};

module.exports.tags = ["all", "FundMe"];
