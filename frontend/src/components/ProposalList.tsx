import { ProposalModel } from "../models/ProposalModel";
import { ReactElement } from "react";
import Stack from "@mui/material/Stack";
import { Proposal } from "./Proposal";

export interface ProposalListProps {
  proposals: ProposalModel[];

  canExecuteMap: { [id: string]: boolean };
}

export function ProposalList(props: ProposalListProps): ReactElement {
  return (
    <Stack>
      {
        props.proposals.map(proposal => {
          return (
            <Proposal key={proposal.id} model={proposal} canExecute={props.canExecuteMap[proposal.id] || false} />
          );
        })
      }
    </Stack>
  );
}
