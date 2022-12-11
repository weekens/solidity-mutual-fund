import { ProposalType } from "./ProposalType";
import { BigNumber } from "ethers";

export interface ProposalRequestModel {
  proposalType: ProposalType;
  amount: BigNumber;
  addresses: string[];
}
