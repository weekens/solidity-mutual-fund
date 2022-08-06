const MutualFund = artifacts.require('MutualFund');
const expect = require('chai').expect;
const truffleAssert = require('truffle-assertions');

contract('MutualFund', (accounts) => {
  it('should add sender to members upon creation', async () => {
    const instance = await MutualFund.new({ from: accounts[0] });

    const members = await instance.getMembers.call();

    expect(members).to.have.lengthOf(1);

    const member = members.find(elem => elem.addr === accounts[0]);

    expect(member).to.not.be.null;
  });

  it('should be able to deposit funds with proposal', async () => {
    const instance = await MutualFund.new({ from: accounts[0] });

    const submitProposalResult = await instance.submitProposal(
      {
        proposalType: MutualFund.ProposalType.DepositFunds,
        amount: 20
      },
      { from: accounts[0] }
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

    const voteResult = await instance.vote(proposalId,
      true,
      {from: accounts[0]}
    );

    truffleAssert.eventEmitted(
      voteResult,
      "NewVote",
      (ev) => {
        return ev.proposalId.toNumber() === proposalId && ev.memberAddress === accounts[0];
      }
    );

    // Try to send wrong sum.
    await truffleAssert.fails(
      instance.executeProposal(
        proposalId,
        { from: accounts[0], value: 200 }
      ),
      truffleAssert.ErrorType.REVERT,
      "The sent funds amount differs from proposed"
    );

    const beginningFundBalance = parseInt(await web3.eth.getBalance(instance.address));
    const beginningMemberBalance = parseInt((await instance.getMember.call(accounts[0])).balance);
    const beginningAccountBalance = parseInt(await web3.eth.getBalance(accounts[0]));

    // Send the right sum.
    const executeResult = await instance.executeProposal(
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

    const endingFundBalance = parseInt(await web3.eth.getBalance(instance.address));

    expect(endingFundBalance).to.be.equal(beginningFundBalance + 20);

    const endingMemberBalance = parseInt((await instance.getMember.call(accounts[0])).balance);

    expect(endingMemberBalance).to.be.equal(beginningMemberBalance + 20);

    const endingAccountBalance = parseInt(await web3.eth.getBalance(accounts[0]));

    expect(endingAccountBalance).to.be.lessThanOrEqual(beginningAccountBalance - 20); // Include gas price.

    const proposalsAfter = await instance.getProposals.call();

    expect(proposalsAfter).to.have.lengthOf(0);
  });
});
