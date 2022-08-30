import { expect } from "chai";
import { ethers } from "hardhat";
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
const UniswapV2Factory = require('@uniswap/v2-core/build/UniswapV2Factory.json');

describe("UniswapDeploy", function () {

    it('should create a new pair', async () => {
        const TestToken = await ethers.getContractFactory("TestToken");

        const token1 = await TestToken.deploy();
        const token2 = await TestToken.deploy();
        const [signer, addr1] = await ethers.getSigners();
        const uniswapFactoryFactory = new ethers.ContractFactory(UniswapV2Factory.abi, UniswapV2Factory.bytecode, signer);
        const uniswapFactory = await uniswapFactoryFactory.deploy(signer.address);

        await uniswapFactory.deployTransaction.wait();

        const createPairTx = await uniswapFactory.createPair(
            token1.address,
            token2.address,
            { from: signer.address }
        );

        // await expect(createPairPromise)
        //     .to.emit(uniswapFactory, "PairCreated");

        console.log('createPairTx =', createPairTx);

        const createPairResult = await createPairTx.wait();

        console.log('createPairResult =', createPairResult);

        const filter = uniswapFactory.filters.PairCreated();
        const events = await uniswapFactory.queryFilter(filter, -10, "latest");

        console.log('events = ', events);

        const pairAddress = events[0].args?.["pair"];

        console.log('pairAddress =', pairAddress);

        expect(pairAddress).to.not.be.null;
    });
});
