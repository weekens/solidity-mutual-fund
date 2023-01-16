import { MutualFund } from '../typechain-types';
import { BigNumber, BigNumberish } from 'ethers';
import { ethers } from 'hardhat';
import { expect } from 'chai';

export enum ProposalType {
    DepositFunds,
    AddAsset,
    Swap,
    AddMember,
    KickMember,
    ChangeVotingPeriod,
    ChangeGracePeriod
}

export async function depositFunds(fund: MutualFund, from: string, amount: BigNumberish) {
    const proposalId = await submitProposal(
        fund,
        from,
        {
            name: "",
            proposalType: ProposalType.DepositFunds,
            amount,
            addresses: []
        }
    );

    await executeProposal(
        fund,
        from,
        proposalId,
        amount
    );
}

export function defaultFundConfig(): MutualFund.ConfigurationStruct {
    return {
        votingPeriod: 2 * 60 * 60,
        gracePeriod: 60 * 60,
        proposalExpiryPeriod: 5 * 24 * 60 * 60,
        founderName: "admin"
    };
}

export async function submitProposal(fund: MutualFund, from: string, proposal: MutualFund.ProposalRequestStruct): Promise<BigNumber> {
    const submitProposalTx = await fund.connect(await ethers.getSigner(from)).submitProposal(
        proposal
    );
    const submitProposalResult = await submitProposalTx.wait();

    const newProposalEvent = submitProposalResult.events?.find(evt => evt.event === "NewProposal")

    expect(newProposalEvent).to.not.be.undefined;

    const proposalId = newProposalEvent?.args?.["id"]

    expect(proposalId).to.not.be.undefined;

    return proposalId;
}

export async function voteForProposal(fund: MutualFund, from: string, proposalId: BigNumberish) {
    const voteResultPromise = fund.connect(await ethers.getSigner(from)).vote(
        proposalId,
        true
    );

    await expect(voteResultPromise)
        .to.emit(fund, "NewVote")
        .withArgs(proposalId, from, true);
}

export async function voteAgainstProposal(fund: MutualFund, from: string, proposalId: BigNumberish) {
    const voteResultPromise = fund.connect(await ethers.getSigner(from)).vote(
        proposalId,
        false
    );

    await expect(voteResultPromise)
        .to.emit(fund, "NewVote")
        .withArgs(proposalId, from, false);
}

export async function executeProposal(fund: MutualFund, from: string, proposalId: BigNumberish, value?: BigNumberish) {
    const executeResultPromise = fund.connect(await ethers.getSigner(from)).executeProposal(
        proposalId,
        { value }
    );

    await expect(executeResultPromise)
        .to.emit(fund, "ProposalExecuted")
        .withArgs(proposalId);
}
