import { ProposalType } from "./ProposalType";
import { BigNumber } from "ethers";

export interface ProposalRequestModel {
  proposalType: ProposalType;
  name: string;
  amount: BigNumber;
  addresses: string[];
}
