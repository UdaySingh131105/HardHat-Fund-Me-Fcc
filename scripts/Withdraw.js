const { ethers, deployments } = require("hardhat");

/**
 * @dev a script to withdraw the funds from the deployed contract.
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

  console.log("Initiating to Withdraw Funds from the Contract........");

  const txResponse = await FundMe.withdraw({ value: ethers.parseEther("0.1") });
  await txResponse.wait(1);

  console.log("Funds Withdrawal Successfull !!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
