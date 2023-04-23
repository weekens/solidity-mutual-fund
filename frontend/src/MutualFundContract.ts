import { BigNumber, ContractTransaction } from "ethers";
import { ConfigurationModel } from "./models/ConfigurationModel";
import { MemberModel } from "./models/MemberModel";
import { ProposalModel } from "./models/ProposalModel";
import { ProposalSubmissionModel } from "./models/ProposalSubmissionModel";

export interface MutualFundContract {

  getTotalBalance(): Promise<BigNumber>;

  getTotalEthBalance(): Promise<BigNumber>;

  getMembers(): Promise<MemberModel[]>;

  getProposals(): Promise<ProposalModel[]>;

  getAssets(): Promise<string[]>;

  getConfiguration(): Promise<ConfigurationModel>;

  submitProposal(proposal: ProposalSubmissionModel): Promise<ContractTransaction>;

  vote(proposalId: string, support: boolean): Promise<ContractTransaction>;

  canExecuteProposal(proposalId: string): Promise<[boolean, string]>;

  executeProposal(proposalId: string, networkParameters: { value?: BigNumber }): Promise<ContractTransaction>;

  exit(percent: number): Promise<ContractTransaction>;
}
