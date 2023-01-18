import { ProposalModel } from "../models/ProposalModel";
import { ReactElement } from "react";
import Stack from "@mui/material/Stack";
import { Proposal } from "./Proposal";
import { MutualFundContract } from "../MutualFundContract";

export interface ProposalListProps {
  proposals: ProposalModel[];

  contract: MutualFundContract;
}

export function ProposalList(props: ProposalListProps): ReactElement {
  return (
    <Stack>
      {
        props.proposals.map(proposal => {
          return (
            <Proposal key={proposal.id} model={proposal} contract={props.contract} />
          );
        })
      }
    </Stack>
  );
}
