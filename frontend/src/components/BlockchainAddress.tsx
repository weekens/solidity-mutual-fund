import { ReactElement } from "react";
import Identicon from "identicon.js";
import { Avatar, Stack } from "@mui/material";

export interface BlockchainAddressProps {
  address: string;
  name?: string;
}

export function BlockchainAddress(props: BlockchainAddressProps): ReactElement {
  const imgData = new Identicon(props.address).toString()

  return (
    <Stack direction="row" spacing={1}>
      <Avatar src={"data:image/png;base64," + imgData} alt="Address icon" sx={{ width: 24, height: 24 }} />
      <span>{props.name || props.address}</span>
    </Stack>
  );
}
