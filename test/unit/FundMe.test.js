const { deployments, ethers } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name) 
    ?   describe.skip
    :   describe("FundMe", async function () {
            let fundMe;
            let deployer;
            let mockV3Aggregator;
            const sendValue = ethers.utils.parseEther("1");
            beforeEach(async function(){
                // We can get accounts from our hardhat runtime environment (hre) as follows. 
                // The first commented method gets it from our config file under the networks.*.accounts.
                // const accounts = await ethers.getSigners();
                // const accountZero = accounts[0];
                deployer = (await getNamedAccounts()).deployer;
                // runs through ouor deploy folder and runs all scripts with the "all" tag
                await deployments.fixture(["all"]);
                // gets the most recent deployed contract of "FundMe". We further conect our deployer account
                // to this fundMe contract we got. So when we call a function on fundMe it will be through this account.
                fundMe = await ethers.getContract("FundMe", deployer);
                mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
            })

            describe("constructor", async function() {
                it("sets the aggregator addresses correctly", async function () {
                    const response = await fundMe.getPriceFeed();
                    // same as const response = await fundMe.s_priceFeed();
                    assert.equal(response, mockV3Aggregator.address);
                })
            })

            describe("fund", async function() {
                it("Fails if you don't send enough ETH", async function () {
                    await expect(fundMe.fund()).to.be.revertedWith("Didn't send enough!");
                })
                it("updated the amount funded data structure", async function () {
                    await fundMe.fund({value: sendValue});
                    const response = await fundMe.getAddressToAmountFunded(deployer);
                    assert.equal(response.toString(), sendValue.toString());
                })
                it("Adds funder to array of getFunder", async function() {
                    await fundMe.fund({value: sendValue});
                    const funder = await fundMe.getFunder(0);
                    assert.equal(funder, deployer);
                })
            })

            describe("withdraw", async function() {
                beforeEach(async function(){
                    await fundMe.fund({value: sendValue}); // before each test fund it, so we have something to withdraw
                })
                it("withdraw ETH from a single founder", async function () {
                    // we could also do ethers.provider.getBalance, it doesn't really matter
                    const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
                    const startingDeployerBalance = await fundMe.provider.getBalance(deployer);
                    const transactionResponse = await fundMe.withdraw()
                    const transactionReceipt = await transactionResponse.wait(1);
                    // curly brackets allow us to pull out objects out of another object
                    const {gasUsed, effectiveGasPrice} = transactionReceipt; 
                    const gasCost = gasUsed.mul(effectiveGasPrice)
                    
                    const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
                    const endingDeployerBalance = await fundMe.provider.getBalance(deployer);
                    assert.equal(endingFundMeBalance, 0);
                    assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(), endingDeployerBalance.add(gasCost).toString());
                })  
                it("allows us to withdraw with multiple getFunder", async function () {
                    const accounts = await ethers.getSigners();
                    for (let i = 1; i < 6; i++) {
                        // Generally when we call any function on fundMe, the caller is the deployer wallet with which
                        // we connected the contract: fundMe = await ethers.getContract("FundMe", deployer);
                        // Here we want to have multiple getFunder so we connect them with the contract as follows. 
                        const fundMeConnectedContract = await fundMe.connect(accounts[i]);
                        await fundMeConnectedContract.fund({value: sendValue});
                        const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
                        const startingDeployerBalance = await fundMe.provider.getBalance(deployer);

                        const transactionResponse = await fundMe.withdraw();
                        const transactionReceipt = await transactionResponse.wait(1);
                        const {gasUsed, effectiveGasPrice} = transactionReceipt; 
                        const gasCost = gasUsed.mul(effectiveGasPrice)  
                        const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
                        const endingDeployerBalance = await fundMe.provider.getBalance(deployer);
                        assert.equal(endingFundMeBalance, 0);
                        assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(), endingDeployerBalance.add(gasCost).toString());    
                        // Make sure that the getFunder are reset properly
                        await expect(fundMe.getFunder(0)).to.be.reverted;
                        for (i = 1; i < 6; i++) {
                        assert.equal(await fundMe.getAddressToAmountFunded(accounts[i].address), 0);
                        }
                    }
                })  
                it("Only allows the owner to withdraw", async function () {
                    const accounts = await ethers.getSigners();
                    const attacker = accounts[1];
                    const attackerConnectedContract = await fundMe.connect(attacker);
                    await expect(attackerConnectedContract.withdraw()).to.be.revertedWith("FundMe__NotOwner");
                })   

                it("cheaperWithdraw testing...", async function () {
                    const accounts = await ethers.getSigners();
                    for (let i = 1; i < 6; i++) {
                        // Generally when we call any function on fundMe, the caller is the deployer wallet with which
                        // we connected the contract: fundMe = await ethers.getContract("FundMe", deployer);
                        // Here we want to have multiple getFunder so we connect them with the contract as follows. 
                        const fundMeConnectedContract = await fundMe.connect(accounts[i]);
                        await fundMeConnectedContract.fund({value: sendValue});
                        const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
                        const startingDeployerBalance = await fundMe.provider.getBalance(deployer);

                        const transactionResponse = await fundMe.cheaperWithdraw();
                        const transactionReceipt = await transactionResponse.wait(1);
                        const {gasUsed, effectiveGasPrice} = transactionReceipt; 
                        const gasCost = gasUsed.mul(effectiveGasPrice)  
                        const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
                        const endingDeployerBalance = await fundMe.provider.getBalance(deployer);
                        assert.equal(endingFundMeBalance, 0);
                        assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(), endingDeployerBalance.add(gasCost).toString());    
                        // Make sure that the getFunder are reset properly
                        await expect(fundMe.getFunder(0)).to.be.reverted;
                        for (i = 1; i < 6; i++) {
                        assert.equal(await fundMe.getAddressToAmountFunded(accounts[i].address), 0);
                        }
                    }
                })  
            })
        })