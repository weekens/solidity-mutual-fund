import {ethers} from "hardhat";
import {
  defaultFundConfig,
  depositFunds,
  executeProposal,
  ProposalType,
  submitProposal, voteAgainstProposal,
  voteForProposal
} from "./common";
import {time} from "@nomicfoundation/hardhat-network-helpers";
import {expect} from "chai";

describe("Voting Tests", function () {
  it("should allow changing voting period and grace period", async () => {
    const MutualFund = await ethers.getContractFactory("MutualFund");
    const fund = await MutualFund.deploy(defaultFundConfig());
    const [founder, member1, member2] = await ethers.getSigners();

    await depositFunds(fund, founder.address, 10000);

    // Change the grace period.
    const gracePeriodProposalId = await submitProposal(fund, founder.address, {
      proposalType: ProposalType.ChangeGracePeriod,
      amount: 0,
      addresses: [],
      name: ""
    });
    await executeProposal(fund, founder.address, gracePeriodProposalId);

    // Add new member.
    const memberProposalId = await submitProposal(fund, founder.address, {
      proposalType: ProposalType.AddMember,
      name: "member1",
      amount: 0,
      addresses: [member1.address]
    });
    await executeProposal(fund, founder.address, memberProposalId);

    // Deposit funds for new member.
    const depositProposalId = await submitProposal(
      fund,
      member1.address,
      {
        proposalType: ProposalType.DepositFunds,
        amount: 1000,
        addresses: [],
        name: ""
      }
    );
    await voteForProposal(fund, founder.address, depositProposalId);
    await executeProposal(fund, member1.address, depositProposalId, 1000);

    // Submit and execute new grace period change proposal.
    // It should be successfully executed even if rejected, because the current grace period is zero.
    const gracePeriod2ProposalId = await submitProposal(fund, founder.address, {
      proposalType: ProposalType.ChangeGracePeriod,
      amount: 10 * 60,
      addresses: [],
      name: ""
    });
    await voteAgainstProposal(fund, member1.address, gracePeriod2ProposalId);
    // Wait for voting period to pass. There should be no grace period.
    await time.increase(2 * 60 * 60 + 10);
    await executeProposal(fund, founder.address, gracePeriod2ProposalId);

    // Now try to kick a member.
    // An immediate attempt to execute proposal should fail, because the new grace period is 10 minutes.
    const kickProposalId = await submitProposal(fund, founder.address, {
      proposalType: ProposalType.KickMember,
      amount: 0,
      addresses: [member1.address],
      name: ""
    });
    await voteAgainstProposal(fund, member1.address, kickProposalId);
    await expect(
      fund.connect(await ethers.getSigner(founder.address)).executeProposal(kickProposalId)
    ).to.be.revertedWith("Grace period is in progress");

    // Wait for voting and grace period to pass.
    await time.increase(2 * 60 * 60 + 11 * 60);

    // The proposal should be now successfully executed.
    await executeProposal(fund, founder.address, kickProposalId);

    // Set the voting period to 0.
    const votingPeriodProposalId = await submitProposal(fund, founder.address, {
      proposalType: ProposalType.ChangeVotingPeriod,
      amount: 0,
      addresses: [],
      name: ""
    });
    await executeProposal(fund, founder.address, votingPeriodProposalId);

    // Add new member.
    const member2ProposalId = await submitProposal(fund, founder.address, {
      proposalType: ProposalType.AddMember,
      name: "member2",
      amount: 0,
      addresses: [member2.address]
    });
    await executeProposal(fund, founder.address, member2ProposalId);

    // Deposit funds for new member.
    const deposit2ProposalId = await submitProposal(
      fund,
      member2.address,
      {
        proposalType: ProposalType.DepositFunds,
        amount: 2000,
        addresses: [],
        name: ""
      }
    );
    await expect(
      fund.connect(await ethers.getSigner(founder.address)).vote(
        deposit2ProposalId,
        false
      )
    ).to.be.revertedWith("Voting period has passed");
  });

  it("should prohibit setting invalid voting or grace period", async () => {
    const MutualFund = await ethers.getContractFactory("MutualFund");
    const fund = await MutualFund.deploy(defaultFundConfig());
    const [founder] = await ethers.getSigners();

    await expect(
      fund.connect(await ethers.getSigner(founder.address)).submitProposal({
        proposalType: ProposalType.ChangeVotingPeriod,
        amount: ethers.constants.MaxUint256,
        addresses: [],
        name: ""
      })
    ).to.be.revertedWithPanic(0x11);
    await expect(
      fund.connect(await ethers.getSigner(founder.address)).submitProposal({
        proposalType: ProposalType.ChangeGracePeriod,
        amount: ethers.constants.MaxUint256,
        addresses: [],
        name: ""
      })
    ).to.be.revertedWithPanic(0x11);
  });

  it("should allow partial voting", async () => {
    const MutualFund = await ethers.getContractFactory("MutualFund");
    const fund = await MutualFund.deploy({
      votingPeriod: 2 * 60 * 60,
      gracePeriod: 60 * 60,
      proposalExpiryPeriod: defaultFundConfig().proposalExpiryPeriod,
      founderName: "admin"
    });
    const [founder, member1, member2] = await ethers.getSigners();

    await depositFunds(fund, founder.address, 10000);

    // Add new member.
    const memberProposalId = await submitProposal(fund, founder.address, {
      proposalType: ProposalType.AddMember,
      name: "member1",
      amount: 0,
      addresses: [member1.address]
    });
    await executeProposal(fund, founder.address, memberProposalId);

    // member1 should now be able to deposit funds.

    const depositProposalId = await submitProposal(
      fund,
      member1.address,
      {
        proposalType: ProposalType.DepositFunds,
        amount: 1000,
        addresses: [],
        name: ""
      }
    );
    await voteForProposal(fund, founder.address, depositProposalId);
    await fund.connect(await ethers.getSigner(member1.address)).executeProposal(
      depositProposalId,
      {
        value: 1000
      }
    );

    // Now we submit another member proposal.
    const member2ProposalId = await submitProposal(
      fund,
      member1.address,
      {
        proposalType: ProposalType.AddMember,
        name: "member2",
        amount: 0,
        addresses: [member2.address]
      }
    );

    // Try to execute proposal; should fail because the voting has not finished yet.
    await expect(
      fund.connect(await ethers.getSigner(member1.address)).executeProposal(
        member2ProposalId,
        { value: 0 }
      ))
      .to.be.revertedWith("Voting or grace period is in progress");

    // Wait for voting period to pass.
    await time.increase(2 * 60 * 60 + 10 * 60);

    // Try to execute proposal; should fail because not everyone has voted, and the grace period has not passed.
    await expect(
      fund.connect(await ethers.getSigner(member1.address)).executeProposal(
        member2ProposalId,
        { value: 0 }
      ))
      .to.be.revertedWith("Voting or grace period is in progress");

    // Wait for grace period to pass.
    await time.increase(60 * 60);

    // Now the proposal should be successfully executed.
    await executeProposal(fund, member1.address, member2ProposalId);
    const members = await fund.getMembers();
    expect(members).to.have.lengthOf(3);
  });

  it("should prohibit voting after voting period", async () => {
    const MutualFund = await ethers.getContractFactory("MutualFund");
    const fund = await MutualFund.deploy({
      votingPeriod: 2 * 60 * 60,
      gracePeriod: 60 * 60,
      proposalExpiryPeriod: defaultFundConfig().proposalExpiryPeriod,
      founderName: "admin"
    });
    const [founder, member1, member2] = await ethers.getSigners();

    await depositFunds(fund, founder.address, 10000);

    // Add new member.
    const memberProposalId = await submitProposal(fund, founder.address, {
      proposalType: ProposalType.AddMember,
      name: "member1",
      amount: 0,
      addresses: [member1.address]
    });
    await executeProposal(fund, founder.address, memberProposalId);

    // Now we submit another member proposal.
    const member2ProposalId = await submitProposal(
      fund,
      founder.address,
      {
        proposalType: ProposalType.AddMember,
        name: "member2",
        amount: 0,
        addresses: [member2.address]
      }
    );

    // Wait for voting period to pass.
    await time.increase(2 * 60 * 60 + 10 * 60);

    await expect(
      voteAgainstProposal(fund, member1.address, member2ProposalId)
    ).to.be.revertedWith("Voting period has passed");

    // Try to execute proposal; should fail because not everyone voted, and the grace period has not passed.
    await expect(executeProposal(fund, founder.address, member2ProposalId))
      .to.be.revertedWith("Voting or grace period is in progress");

    // Wait for grace period to pass.
    await time.increase(60 * 60);

    // Now the proposal should be successfully executed.
    await executeProposal(fund, founder.address, member2ProposalId);
    const members = await fund.getMembers();
    expect(members).to.have.lengthOf(3);
  });

  it("should take the size of the shares into account during voting and allow grace period", async () => {
    const MutualFund = await ethers.getContractFactory("MutualFund");
    const fund = await MutualFund.deploy({
      votingPeriod: 2 * 60 * 60,
      gracePeriod: 60 * 60,
      proposalExpiryPeriod: defaultFundConfig().proposalExpiryPeriod,
      founderName: "admin"
    });
    const [founder, member1, member2] = await ethers.getSigners();

    await depositFunds(fund, founder.address, 10000);

    // Add new member.
    const memberProposalId = await submitProposal(fund, founder.address, {
      proposalType: ProposalType.AddMember,
      name: "member1",
      amount: 0,
      addresses: [member1.address]
    });
    await executeProposal(fund, founder.address, memberProposalId);

    // member1 should now be able to deposit funds.

    const depositProposalId = await submitProposal(
      fund,
      member1.address,
      {
        proposalType: ProposalType.DepositFunds,
        amount: 1000,
        addresses: [],
        name: ""
      }
    );
    await voteForProposal(fund, founder.address, depositProposalId);
    await fund.connect(await ethers.getSigner(member1.address)).executeProposal(
      depositProposalId,
      {
        value: 1000
      }
    );

    // Now we submit another member proposal.
    const member2ProposalId = await submitProposal(
      fund,
      founder.address,
      {
        proposalType: ProposalType.AddMember,
        name: "member2",
        amount: 0,
        addresses: [member2.address]
      }
    );

    await voteAgainstProposal(fund, member1.address, member2ProposalId);

    // Try to execute proposal; should fail because there is a negative vote, and the voting period has not passed.
    await expect(executeProposal(fund, founder.address, member2ProposalId))
      .to.be.revertedWith("Grace period is in progress");

    // Wait for voting period to pass.
    await time.increase(2 * 60 * 60 + 10 * 60);

    // Try to execute proposal; should fail because there is a negative vote, and the grace period has not passed.
    await expect(executeProposal(fund, founder.address, member2ProposalId))
      .to.be.revertedWith("Grace period is in progress");

    // Wait for grace period to pass.
    await time.increase(60 * 60);

    // Now the proposal should be successfully executed, because founder has voted positively, and he has a
    // bigger number of shares.
    await executeProposal(fund, founder.address, member2ProposalId);
    const members = await fund.getMembers();
    expect(members).to.have.lengthOf(3);
  });

  it("should properly handle votes from kicked members", async () => {
    const MutualFund = await ethers.getContractFactory("MutualFund");
    const fund = await MutualFund.deploy(defaultFundConfig());
    const [founder, member1, member2] = await ethers.getSigners();

    await depositFunds(fund, founder.address, 10000);

    // Add second member.
    const memberProposalId = await submitProposal(fund, founder.address, {
      proposalType: ProposalType.AddMember,
      name: "member1",
      amount: 0,
      addresses: [member1.address]
    });
    await executeProposal(fund, founder.address, memberProposalId);

    // Propose adding third member.
    const member2ProposalId = await submitProposal(
      fund,
      founder.address,
      {
        proposalType: ProposalType.AddMember,
        name: "member2",
        amount: 0,
        addresses: [member2.address]
      }
    );

    await voteForProposal(fund, member1.address, member2ProposalId);

    // Kick second member.
    const kickMemberProposalId = await submitProposal(fund, founder.address, {
      proposalType: ProposalType.KickMember,
      name: "",
      amount: 0,
      addresses: [member1.address]
    });
    await voteForProposal(fund, member1.address, kickMemberProposalId);
    await executeProposal(fund, founder.address, kickMemberProposalId);

    // Now we should be able to execute the second proposal.
    await executeProposal(fund, founder.address, member2ProposalId);

    const members = await fund.getMembers();
    expect(members).to.have.lengthOf(2);
  });
});