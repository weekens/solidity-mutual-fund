// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.6;
pragma experimental ABIEncoderV2;

contract MutualFund {

    struct Member {
        address addr;
        uint balance;
    }

    enum ProposalType {
        DepositFunds
    }

    struct ProposalRequest {
        ProposalType proposalType;
        uint amount;
    }

    struct Vote {
        address memberAddress;
        bool support;
    }

    struct Proposal {
        uint id;
        address author;
        ProposalRequest request;
        Vote[] votes;
    }

    event NewProposal(uint id, address author);

    event ProposalExecuted(uint id);

    event NewVote(uint proposalId, address memberAddress, bool support);

    Member[] members;
    uint proposalIdCounter = 1;
    Proposal[] proposals;

    constructor() public {
        members.push(Member({ addr: msg.sender, balance: 0 }));
    }

    function getMembers() public view returns (Member[] memory) {
        return members;
    }

    function getMember(address memberAddress) public view returns (Member memory) {
        return findMemberByAddress(memberAddress);
    }

    modifier membersOnly() {
        require(hasMemberWithAddress(msg.sender), "Sender should be a member!");
        _;
    }

    function submitProposal(ProposalRequest memory proposalRequest) membersOnly public returns (uint) {
        Proposal storage newProposal = proposals.push(); // Allocate a new proposal.
        uint newProposalId = proposalIdCounter++;
        newProposal.id = newProposalId;
        newProposal.author = msg.sender;
        newProposal.request = proposalRequest;

        emit NewProposal(newProposalId, msg.sender);

        return newProposalId;
    }

    function vote(uint proposalId, bool support) membersOnly public {
        (Proposal storage proposal,) = findProposalById(proposalId);
        checkMemberCanVote(msg.sender, proposal);
        proposal.votes.push(Vote({ memberAddress: msg.sender, support: support }));
        emit NewVote(proposalId, msg.sender, support);
    }

    function getProposals() membersOnly public view returns (Proposal[] memory) {
        return proposals;
    }

    function executeProposal(uint proposalId) membersOnly payable public {
        (Proposal storage proposal,) = findProposalById(proposalId);
        checkCanExecuteProposal(msg.sender, proposal);

        if (proposal.request.proposalType == ProposalType.DepositFunds) {
            require(proposal.request.amount == msg.value, "The sent funds amount differs from proposed");
            Member storage member = findMemberByAddress(proposal.author);
            member.balance += msg.value;
        }
        else {
            revert("Unknown proposal type");
        }

        removeProposal(proposalId);

        emit ProposalExecuted(proposalId);
    }

    function removeProposal(uint proposalId) private {
        (, uint index) = findProposalById(proposalId);

        for(uint i = index; i < proposals.length - 1; i++) {
            proposals[i] = proposals[i + 1];
        }
        proposals.pop();
    }

    function hasMemberWithAddress(address addr) private view returns (bool) {
        for (uint i = 0; i < members.length; i++) {
            if (members[i].addr == addr) return true;
        }

        return false;
    }

    function findMemberByAddress(address addr) private view returns (Member storage) {
        for (uint i = 0; i < members.length; i++) {
            if (members[i].addr == addr) return members[i];
        }

        revert("Member not found");
    }

    function findProposalById(uint proposalId) private view returns (Proposal storage, uint index) {
        for (uint i = 0; i < proposals.length; i++) {
            if (proposals[i].id == proposalId) return (proposals[i], i);
        }

        revert("Proposal not found");
    }

    function checkCanExecuteProposal(address memberAddress, Proposal storage proposal) private view {
        require(proposal.author == memberAddress, "Executor is not a proposal author");

        int score = 0;
        for (uint i = 0; i < proposal.votes.length; i++) {
            Vote storage v = proposal.votes[i];
            if (v.support) {
                score++;
            }
            else {
                score--;
            }
        }
        require(score >= 0, "Proposal was rejected by voting");
    }

    function checkMemberCanVote(address memberAddress, Proposal storage proposal) private view {
        for (uint i = 0; i < proposal.votes.length; i++) {
            require(proposal.votes[i].memberAddress != memberAddress, "Member already voted");
        }
    }
}
