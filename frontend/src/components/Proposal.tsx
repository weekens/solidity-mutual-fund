import { ProposalModel } from "../models/ProposalModel";
import { ReactElement } from "react";
import Grid from "@mui/material/Grid";

export function Proposal(props: ProposalModel): ReactElement {
  return (
    <Grid container>
      <Grid item xs={6}>
        Author:
      </Grid>
      <Grid item xs={6}>
        {props.author}
      </Grid>
      <Grid item xs={6}>
        Created at:
      </Grid>
      <Grid item xs={6}>
        {props.createdAt.toString()}
      </Grid>
      <Grid item xs={6}>
        Type:
      </Grid>
      <Grid item xs={6}>
        {props.request.proposalType}
      </Grid>
    </Grid>
  );
}
