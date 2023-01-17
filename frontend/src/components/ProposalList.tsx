import { ProposalModel } from "../models/ProposalModel";
import { ReactElement } from "react";
import Stack from "@mui/material/Stack";
import { Proposal } from "./Proposal";
import { MutualFundContract } from "../MutualFundContract";
import { MemberModel } from "../models/MemberModel";

export interface ProposalListProps {
  proposals: ProposalModel[];

  contract: MutualFundContract;

  member: MemberModel;
}

export function ProposalList(props: ProposalListProps): ReactElement {
  return (
    <Stack>
      {
        props.proposals.map(proposal => {
          return (
            <Proposal key={proposal.id} model={proposal} contract={props.contract} member={props.member} />
          );
        })
      }
    </Stack>
  );
}
