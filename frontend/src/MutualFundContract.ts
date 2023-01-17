import { BigNumber, ContractTransaction } from "ethers";
import { MemberModel } from "./models/MemberModel";
import { ProposalModel } from "./models/ProposalModel";
import { ProposalSubmissionModel } from "./models/ProposalSubmissionModel";

export interface MutualFundContract {

  getTotalBalance(): Promise<BigNumber>;

  getMembers(): Promise<MemberModel[]>;

  getProposals(): Promise<ProposalModel[]>;

  getAssets(): Promise<string[]>;

  submitProposal(proposal: ProposalSubmissionModel): Promise<ContractTransaction>;

  vote(proposalId: string, support: boolean): Promise<ContractTransaction>;

  canExecuteProposal(proposalId: string): Promise<[boolean, string]>;

  executeProposal(proposalId: string, networkParameters: { value?: BigNumber }): Promise<ContractTransaction>;
}
