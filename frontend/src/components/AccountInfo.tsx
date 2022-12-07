import { ReactElement } from "react";
import Grid from "@mui/material/Grid";

interface AccountInfoProps {
  totalBalance: string;
}

export function AccountInfo(props: AccountInfoProps): ReactElement {
  return (
    <Grid container>
      <Grid item xs={6}>
        Total balance:
      </Grid>
      <Grid item xs={6}>
        {props.totalBalance}
      </Grid>
    </Grid>
  );
}
