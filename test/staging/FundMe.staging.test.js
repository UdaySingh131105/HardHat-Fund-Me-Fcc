const { network, ethers, deployments } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");
const { assert } = require("chai");

developmentChains.includes(network.name)
  ? console.log("On Local Network")
  : describe("FundMe Staging Tests", function () {
      let signer;
      let FundMe;
      const sendValue = ethers.parseEther("0.1");
      beforeEach(async () => {
        // deployer = (await getNamedAccounts()).deployer
        // FundMe = await ethers.getContract("FundMe", deployer)
        const accounts = await ethers.getSigners();
        signer = accounts[0];
        // await deployments.fixture(["FundMe"]);
        const FundMeDeployments = await deployments.get("FundMe");
        FundMe = await ethers.getContractAt(
          FundMeDeployments.abi,
          FundMeDeployments.address,
          signer
        );
      });

      it("allows people to fund and withdraw", async function () {
        const fundTxResponse = await FundMe.fundMe({ value: sendValue });
        await fundTxResponse.wait(1);

        const withdrawTxResponse = await FundMe.withdraw();
        await withdrawTxResponse.wait(1);

        const endingFundMeBalance = await ethers.provider.getBalance(
          FundMe.target
        );
        console.log(
          endingFundMeBalance.toString() +
            " should equal 0, running assert equal..."
        );
        assert.equal(endingFundMeBalance.toString(), "0");
      });
    });
