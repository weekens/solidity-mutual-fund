import { ReactElement } from "react";
import { BigNumber } from "ethers";
import { Typography } from "@mui/material";

export function BlockTimestamp(props: { data: BigNumber }): ReactElement {
  return (
    <Typography>{new Date(props.data.toNumber() * 1000).toString()}</Typography>
  );
}
