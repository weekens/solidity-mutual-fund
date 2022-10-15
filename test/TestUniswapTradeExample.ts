import { expect } from "chai";
import { ethers } from "hardhat";
const ERC20ABI = require("@openzeppelin/contracts/build/contracts/ERC20.json");

const DAI_ADDRESS = "0x6b175474e89094c44da98b954eedeac495271d0f";

describe("UniswapTradeExample", function () {
    it("Swap ETH for DAI", async function () {
        const provider = ethers.provider;
        const [owner, addr1] = await ethers.getSigners();
        const DAI = new ethers.Contract(DAI_ADDRESS, ERC20ABI.abi, provider);

        // Assert addr1 has 1000 ETH to start
        let addr1Balance = await provider.getBalance(addr1.address);
        let expectedBalance = ethers.BigNumber.from("10000000000000000000000");
        expect(addr1Balance.eq(expectedBalance)).to.be.true;

        // Assert addr1 DAI balance is 0
        let addr1Dai = await DAI.balanceOf(addr1.address);
        expect(addr1Dai.isZero()).to.be.true;

        // Deploy UniswapTradeExample
        const uniswapTradeExample =
            await ethers.getContractFactory("UniswapTradeExample")
                .then(contract => contract.deploy());
        await uniswapTradeExample.deployed();

        // Swap 1 ETH for DAI
        await uniswapTradeExample.connect(addr1).swapExactETHForTokens(
            0,
            DAI_ADDRESS,
            { value: ethers.utils.parseEther("1") }
        );

        // Assert addr1Balance contains one less ETH
        expectedBalance = addr1Balance.sub(ethers.utils.parseEther("1"));
        addr1Balance = await provider.getBalance(addr1.address);
        expect(addr1Balance.lt(expectedBalance)).to.be.true;

        // Assert DAI balance increased
        addr1Dai = await DAI.balanceOf(addr1.address);
        expect(addr1Dai.gt(ethers.BigNumber.from("0"))).to.be.true;

        // Swap back 0.5 of the sum.
        await DAI.connect(addr1).approve(uniswapTradeExample.address, addr1Dai);
        await uniswapTradeExample.connect(addr1).swapBack(
            DAI_ADDRESS,
            ethers.utils.parseEther("1").div(2),
            addr1.address
        );
    });
});
