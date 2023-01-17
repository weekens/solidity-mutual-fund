import { ethers } from 'hardhat';
import {
    defaultFundConfig,
    depositFunds,
    executeProposal,
    ProposalType,
    submitProposal, voteAgainstProposal,
    voteForProposal
} from './common';
import { expect } from 'chai';

describe("Membership Tests", function () {
    it("should add sender to members upon creation", async () => {
        const MutualFund = await ethers.getContractFactory("MutualFund");
        const fund = await MutualFund.deploy(defaultFundConfig());

        const members = await fund.getMembers();

        expect(members).to.have.lengthOf(1);

        const [signer] = await ethers.getSigners();

        const member = members.find(elem => elem.addr === signer.address);

        expect(member).to.not.be.null;
        expect(member?.name).to.be.equal("admin");
    });

    it("should be able to invite a new member and kick a member", async () => {
        const MutualFund = await ethers.getContractFactory("MutualFund");
        const fund = await MutualFund.deploy(defaultFundConfig());
        const [founder, member1] = await ethers.getSigners();

        await depositFunds(fund, founder.address, ethers.utils.parseEther("1000"));

        const memberProposalId = await submitProposal(fund, founder.address, {
            proposalType: ProposalType.AddMember,
            name: "member1",
            amount: 0,
            addresses: [member1.address]
        });

        await executeProposal(fund, founder.address, memberProposalId);

        // member1 should now be a member.

        const members = await fund.getMembers();

        expect(members).to.have.lengthOf(2);

        const member1Record = members.find(elem => elem.addr === member1.address);

        expect(member1Record).to.not.be.null;

        // member1 should now be able to deposit funds.

        const depositProposalId = await submitProposal(
            fund,
            member1.address,
            {
                proposalType: ProposalType.DepositFunds,
                amount: ethers.utils.parseEther("100"),
                addresses: [],
                name: ""
            }
        );
        await expect(
            fund.connect(await ethers.getSigner(member1.address)).executeProposal(
                depositProposalId,
                {
                    value: ethers.utils.parseEther("100")
                }
            )
        ).to.be.revertedWith("Voting or grace period is in progress");
        await voteForProposal(fund, founder.address, depositProposalId);
        await fund.connect(await ethers.getSigner(member1.address)).executeProposal(
            depositProposalId,
            {
                value: ethers.utils.parseEther("100")
            }
        );
        const endingMemberBalance = (await fund.getMember(member1.address)).balance;
        expect(endingMemberBalance.sub(ethers.utils.parseEther("100"))).to.be.equal(0);

        await expect(
            fund.submitProposal(
                {
                    proposalType: ProposalType.AddMember,
                    name: "member1",
                    amount: 0,
                    addresses: [member1.address]
                }
            )
        ).to.be.revertedWith("Member already exists");

        // Now we kick member1.

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
        await ethers.provider.send("evm_increaseTime", [3 * 60 * 60 + 10 * 60]);
        await ethers.provider.send("evm_mine", []);

        const memberOwnBalanceBeforeKick = await ethers.provider.getBalance(member1.address);

        await executeProposal(fund, founder.address, kickProposalId);

        const memberOwnBalanceAfterKick = await ethers.provider.getBalance(member1.address);

        // We should return funds to kicked member.
        expect(memberOwnBalanceAfterKick.sub(memberOwnBalanceBeforeKick.add(ethers.utils.parseEther("100"))))
            .to.be.approximately(0, 100);
    });
});
