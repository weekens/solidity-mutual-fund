import { BigNumber, ContractTransaction } from "ethers";
import { MemberModel } from "./models/MemberModel";
import { ProposalModel } from "./models/ProposalModel";
import { ProposalSubmissionModel } from "./models/ProposalSubmissionModel";

export interface MutualFundContract {

  getTotalBalance(): Promise<BigNumber>;

  getMembers(): Promise<MemberModel[]>;

  getProposals(): Promise<ProposalModel[]>;

  submitProposal(proposal: ProposalSubmissionModel): Promise<ContractTransaction>;

  canExecuteProposal(proposalId: string): Promise<[boolean, string]>;

  executeProposal(proposalId: string): Promise<ContractTransaction>;
}
