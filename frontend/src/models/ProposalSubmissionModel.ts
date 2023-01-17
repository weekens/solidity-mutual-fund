import { BigNumber } from "ethers";

export interface ProposalSubmissionModel {
  proposalType: number;
  name: string;
  amount: BigNumber;
  addresses: string[];
}
