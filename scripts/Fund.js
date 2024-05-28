const { ethers, deployments } = require("hardhat");

/**
 * @dev a script to fund the deployed contract.
 */
async function main() {
  const accounts = await ethers.getSigners();
  const signer = accounts[0];

  const FundMeDeployment = await deployments.get("FundMe");
  const FundMe = await ethers.getContractAt(
    FundMeDeployment.abi,
    FundMeDeployment.address,
    signer
  );

  console.log("Initiating to Fund the Contract........");

  const txResponse = await FundMe.fundMe({ value: ethers.parseEther("0.1") });
  await txResponse.wait(1);

  console.log("Funding to the Contract Successfull !!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
