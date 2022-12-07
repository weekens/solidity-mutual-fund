import { BigNumber } from "ethers";
import { ProposalRequestModel } from "./ProposalRequestModel";
import { VoteModel } from "./VoteModel";

export interface ProposalModel {
  id: string;
  createdAt: BigNumber;
  author: string;
  request: ProposalRequestModel;
  votes: VoteModel[];
}
