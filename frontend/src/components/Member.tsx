import { MemberModel } from "../models/MemberModel";
import { ReactElement } from "react";
import Grid from "@mui/material/Grid";

export function Member(props: MemberModel): ReactElement {
  return (
    <Grid container>
      <Grid item xs={6}>
        Address:
      </Grid>
      <Grid item xs={6}>
        {props.addr}
      </Grid>
      <Grid item xs={6}>
        Balance:
      </Grid>
      <Grid item xs={6}>
        {props.balance.toString()}
      </Grid>
    </Grid>
  );
}