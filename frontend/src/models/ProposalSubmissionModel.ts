import { BigNumber } from "ethers";

export interface ProposalSubmissionModel {
  proposalType: number;
  amount: BigNumber;
  addresses: string[];
}
