import { ReactElement } from "react";
import { ActivateDeactivate } from "./components/ActivateDeactivate";
import { MutualFund } from "./components/MutualFund";
import Stack from "@mui/material/Stack";
import Container from "@mui/material/Container";
import { Typography } from "@mui/material";

export function App(): ReactElement {
  return (
    <Stack>
      <Typography>
        <ActivateDeactivate/>
      </Typography>
      <Container>
        <MutualFund/>
      </Container>
    </Stack>
  );
}
