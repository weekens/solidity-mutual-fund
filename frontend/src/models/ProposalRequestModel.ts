import { ProposalType } from "./ProposalType";

export interface ProposalRequestModel {
  proposalType: ProposalType;
  amount: string;
  addresses: string[];
}
