const MutualFund = artifacts.require('MutualFund');
const TestToken = artifacts.require('TestToken');
const MutualFundAsset = artifacts.require('MutualFundAsset');
const expect = require('chai').expect;
const truffleAssert = require('truffle-assertions');

const zeroAddress = '0x0000000000000000000000000000000000000000';

contract('MutualFund', (accounts) => {
  it('should add sender to members upon creation', async () => {
    const instance = await MutualFund.new({ from: accounts[0] });

    const members = await instance.getMembers.call();

    expect(members).to.have.lengthOf(1);

    const member = members.find(elem => elem.addr === accounts[0]);

    expect(member).to.not.be.null;
  });

  it('should be able to deposit funds with proposal', async () => {
    const fund = await MutualFund.new({ from: accounts[0] });

    const proposalId = await submitProposal(
      fund,
      accounts[0],
      {
        proposalType: MutualFund.ProposalType.DepositFunds,
        amount: 20,
        addr1: zeroAddress,
        addr2: zeroAddress
      }
    );

    await voteForProposal(
      fund,
      accounts[0],
      proposalId
    );

    // Try to send wrong sum.
    await truffleAssert.fails(
      fund.executeProposal(
        proposalId,
        { from: accounts[0], value: 200 }
      ),
      truffleAssert.ErrorType.REVERT,
      "The sent funds amount differs from proposed"
    );

    const beginningFundBalance = parseInt(await web3.eth.getBalance(fund.address));
    const beginningMemberBalance = parseInt((await fund.getMember.call(accounts[0])).balance);
    const beginningAccountBalance = parseInt(await web3.eth.getBalance(accounts[0]));

    // Send the right sum.
    const executeResult = await fund.executeProposal(
      proposalId,
      { from: accounts[0], value: 20 }
    );

    truffleAssert.eventEmitted(
      executeResult,
      "ProposalExecuted",
      (ev) => {
        return ev.id.toNumber() === proposalId;
      }
    );

    const endingFundBalance = parseInt(await web3.eth.getBalance(fund.address));

    expect(endingFundBalance).to.be.equal(beginningFundBalance + 20);

    const endingMemberBalance = parseInt((await fund.getMember.call(accounts[0])).balance);

    expect(endingMemberBalance).to.be.equal(beginningMemberBalance + 20);

    const endingAccountBalance = parseInt(await web3.eth.getBalance(accounts[0]));

    expect(endingAccountBalance).to.be.lessThanOrEqual(beginningAccountBalance - 20); // Include gas price.

    const proposalsAfter = await fund.getProposals.call();

    expect(proposalsAfter).to.have.lengthOf(0);
  });

  it('should be able to exit with funds');

  it('should be able to invite a new member');

  it('should be able to add asset and make a swap', async () => {
    const assetToken = await TestToken.new();
    const asset = await MutualFundAsset.new(assetToken.address);
    const fund = await MutualFund.new({ from: accounts[0] });

    const assets = await fund.getAssets.call();

    expect(assets).to.have.lengthOf(0);

    const assetProposalId = await submitProposal(
      fund,
      accounts[0],
      {
        proposalType: MutualFund.ProposalType.AddAsset,
        amount: 0,
        addr1: asset.address,
        addr2: zeroAddress
      }
    );
    await voteForProposal(fund, accounts[0], assetProposalId);

    await executeProposal(
      fund,
      accounts[0],
      assetProposalId
    );

    const newAssets = await fund.getAssets.call();

    expect(newAssets).to.have.lengthOf(1);
    expect(newAssets[0]).to.be.equal(asset.address);

    await depositFunds(fund, accounts[0], 20);

    const swapProposalId = await submitProposal(
      fund,
      accounts[0],
      {
        proposalType: MutualFund.ProposalType.Swap,
        amount: 20,
        addr1: fund.address,
        addr2: asset.address
      }
    );
    await voteForProposal(fund, accounts[0], swapProposalId);
    await executeProposal(
      fund,
      accounts[0],
      swapProposalId
    );
  });
});

async function depositFunds(fund, from, amount) {
  const proposalId = await submitProposal(
    fund,
    from,
    {
      proposalType: MutualFund.ProposalType.DepositFunds,
      amount,
      addr1: zeroAddress,
      addr2: zeroAddress
    }
  );

  await voteForProposal(
    fund,
    from,
    proposalId
  );

  await executeProposal(
    fund,
    from,
    proposalId,
    amount
  );
}

async function submitProposal(fund, from, proposal) {
  const submitProposalResult = await fund.submitProposal(
    proposal,
    { from }
  );

  let proposalId;

  truffleAssert.eventEmitted(
    submitProposalResult,
    "NewProposal",
    (ev) => {
      proposalId = ev.id.toNumber();
      return true;
    }
  );

  return proposalId;
}

async function voteForProposal(fund, from, proposalId) {
  const voteResult = await fund.vote(
    proposalId,
    true,
    { from }
  );

  truffleAssert.eventEmitted(
    voteResult,
    "NewVote",
    (ev) => {
      return ev.proposalId.toNumber() === proposalId && ev.memberAddress === from;
    }
  );
}

async function executeProposal(fund, from, proposalId, value) {
  const executeResult = await fund.executeProposal(
    proposalId,
    { from, value }
  );

  truffleAssert.eventEmitted(
    executeResult,
    "ProposalExecuted",
    (ev) => {
      return ev.id.toNumber() === proposalId;
    }
  );
}
