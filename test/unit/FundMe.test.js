const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts, network } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? console.log(`On testnet: ${network.name}`)
  : describe("FundMe", async () => {
      let FundMe;
      let signer;
      let MockV3Aggregator;
      const sendValue = ethers.parseEther("1"); // 1 ETH
      beforeEach(async () => {
        // don't use (await getNamedAccounts()).signer, as a parameter to the getContractAt function, it will report an error !!!
        const accounts = await ethers.getSigners();
        signer = accounts[0];
        // signer = ethers.getSigner();

        await deployments.fixture(["all"]);

        // there is no getContract function in ethers, so using getContractAt
        const FundMeDeployment = await deployments.get("FundMe");
        FundMe = await ethers.getContractAt(
          FundMeDeployment.abi,
          FundMeDeployment.address,
          signer
        );

        const MockV3AggregatorDeployment = await deployments.get(
          "MockV3Aggregator"
        );
        MockV3Aggregator = await ethers.getContractAt(
          MockV3AggregatorDeployment.abi,
          MockV3AggregatorDeployment.address,
          signer
        );
      });

      describe("constructor", async () => {
        it("sets the aggregator address correctly", async () => {
          const response = await FundMe.getPriceFeed();
          assert.equal(response, MockV3Aggregator.target); // get address using target instead of address property
        });
      });

      describe("fundme", async () => {
        it("Fails when you donot send enough ETH", async () => {
          await expect(FundMe.fundMe()).to.be.revertedWithCustomError(
            FundMe,
            "FundMe__notEnoughGas"
          );
        });

        it("Updating the DataStructures", async () => {
          await FundMe.fundMe({ value: sendValue });
          const response = await FundMe.getAddressToAmountFunded(signer);
          // console.log(signer);

          assert.equal(response.toString(), sendValue.toString());
        });

        it("Updating the funders array", async () => {
          await FundMe.fundMe({ value: sendValue });
          const response = await FundMe.getFunders(0);
          assert.equal(response, signer.address);
        });
      });

      describe("Withdraw", async () => {
        // Arrange
        beforeEach(async function () {
          await FundMe.fundMe({ value: sendValue });
        });

        it("Withdraw ETH from single funder (costly)", async function () {
          const initailBalance = await ethers.provider.getBalance(
            FundMe.target
          );
          const initialSignerBalance = await ethers.provider.getBalance(
            signer.address
          );
          // Act
          const transactionResponse = await FundMe.costly_withdraw();
          const transactionReciept = await transactionResponse.wait(1);

          // const gasPrice = transactionReciept.gasPrice;
          const gasUsed = await transactionReciept.fee;

          const finalBalance = await ethers.provider.getBalance(FundMe.target);
          const finalSignerBalance = await ethers.provider.getBalance(
            signer.address
          );
          // Assert

          assert.equal(finalBalance, 0);
          assert(
            (initailBalance + initialSignerBalance).toString(),
            (finalSignerBalance + gasUsed).toString()
          );
        });

        it("Withdraw ETH from single funder (cheaper)", async function () {
          const initailBalance = await ethers.provider.getBalance(
            FundMe.target
          );
          const initialSignerBalance = await ethers.provider.getBalance(
            signer.address
          );
          // Act
          const transactionResponse = await FundMe.withdraw();
          const transactionReciept = await transactionResponse.wait(1);

          // const gasPrice = transactionReciept.gasPrice;
          const gasUsed = await transactionReciept.fee;

          const finalBalance = await ethers.provider.getBalance(FundMe.target);
          const finalSignerBalance = await ethers.provider.getBalance(
            signer.address
          );
          // Assert

          assert.equal(finalBalance, 0);
          assert(
            (initailBalance + initialSignerBalance).toString(),
            (finalSignerBalance + gasUsed).toString()
          );
        });

        it("Withdraw ETH From multiple funders (costly)", async function () {
          const accounts = await ethers.getSigners();
          for (let i = 1; i < 7; i++) {
            const fundMeConnectedContract = await FundMe.connect(accounts[i]);
            await fundMeConnectedContract.fundMe({ value: sendValue });
          }

          const initailBalance = await ethers.provider.getBalance(
            FundMe.target
          );
          const initialSignerBalance = await ethers.provider.getBalance(
            signer.address
          );
          // Act
          const transactionResponse = await FundMe.costly_withdraw();
          const transactionReciept = await transactionResponse.wait(1);

          // const gasPrice = transactionReciept.gasPrice;
          const gasUsed = await transactionReciept.fee;

          const finalBalance = await ethers.provider.getBalance(FundMe.target);
          const finalSignerBalance = await ethers.provider.getBalance(
            signer.address
          );

          assert.equal(finalBalance, 0);
          assert(
            (initailBalance + initialSignerBalance).toString(),
            (finalSignerBalance + gasUsed).toString()
          );

          await expect(FundMe.getFunders(0)).to.be.reverted;
          for (let i = 0; i < 7; i++) {
            assert.equal(
              await FundMe.getAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });

        it("Withdraw ETH From multiple funders (cheaper)", async function () {
          const accounts = await ethers.getSigners();
          for (let i = 1; i < 7; i++) {
            const fundMeConnectedContract = await FundMe.connect(accounts[i]);
            await fundMeConnectedContract.fundMe({ value: sendValue });
          }

          const initailBalance = await ethers.provider.getBalance(
            FundMe.target
          );
          const initialSignerBalance = await ethers.provider.getBalance(
            signer.address
          );
          // Act
          const transactionResponse = await FundMe.withdraw();
          const transactionReciept = await transactionResponse.wait(1);

          // const gasPrice = transactionReciept.gasPrice;
          const gasUsed = await transactionReciept.fee;

          const finalBalance = await ethers.provider.getBalance(FundMe.target);
          const finalSignerBalance = await ethers.provider.getBalance(
            signer.address
          );

          assert.equal(finalBalance, 0);
          assert(
            (initailBalance + initialSignerBalance).toString(),
            (finalSignerBalance + gasUsed).toString()
          );

          await expect(FundMe.getFunders(0)).to.be.reverted;
          for (let i = 0; i < 7; i++) {
            assert.equal(
              await FundMe.getAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });

        it("Only Owner Can Withdraw", async function () {
          const accounts = await ethers.getSigners();
          const attacker = accounts[1];

          const attackerConnectedContract = await FundMe.connect(attacker);
          await expect(
            attackerConnectedContract.withdraw()
          ).to.be.revertedWithCustomError(FundMe, "FundMe__notOwner");
        });
      });

      describe("Getting the owner of the contract", async function () {
        const owner = await FundMe.getOwner();
        assert.equal(owner, signer.address);
      });
      // it("My Test for testing", async function () {
      //   let deployer = (await getNamedAccounts()).deployer;
      //   let owner = await FundMe.getOwner();
      //   // let fund = await ethers.getContract("FundMe", deployer);
      //   let fundDeployment = await deployments.get("FundMe");
      //   let fund = await ethers.getContractAt(
      //     "FundMe",
      //     fundDeployment.address,
      //     deployer
      //   );
      //   let fund2 = await ethers.getContractAt(
      //     "FundMe",
      //     fundDeployment.address,
      //     signer
      //   );
      //   let fund3 = await ethers.getContractAt(
      //     fundDeployment.abi,
      //     fundDeployment.address,
      //     signer
      //   );
      //   assert.equal(deployer, owner);
      // });
    });
