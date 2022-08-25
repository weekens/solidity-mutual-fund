const TestToken = artifacts.require('TestToken');
const { ethers, providers } = require('ethers');
const UniswapV2Factory = require('@uniswap/v2-core/build/UniswapV2Factory.json');
const expect = require('chai').expect;

contract('TestUniswap', (accounts) => {

  it('should create a new pair', async () => {
    const token1 = await TestToken.new();
    const token2 = await TestToken.new();
    const web3Provider = new providers.Web3Provider(web3.currentProvider);
    const signer = web3Provider.getSigner(accounts[0]);
    const uniswapFactoryFactory = new ethers.ContractFactory(UniswapV2Factory.abi, UniswapV2Factory.bytecode, signer);
    const uniswapFactory = await uniswapFactoryFactory.deploy(accounts[0]);

    console.log('After uniswapFactory deployed');

    await uniswapFactory.deployTransaction.wait();

    const createPairTx = await uniswapFactory.createPair(
      token1.address,
      token2.address,
      { from: accounts[0] }
    );

    console.log('createPairTx =', createPairTx);

    const createPairResult = await createPairTx.wait();

    console.log('createPairResult =', createPairResult);

    const filter = uniswapFactory.filters.PairCreated();
    const events = await uniswapFactory.queryFilter(filter, -10, "latest");

    console.log('events = ', events);

    const pairAddress = events[0].args.pair;

    console.log('pairAddress =', pairAddress);

    expect(pairAddress).to.not.be.null;
  });
});
