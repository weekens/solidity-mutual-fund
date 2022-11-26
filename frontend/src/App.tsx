import { ReactElement } from "react";
import { ActivateDeactivate } from "./components/ActivateDeactivate";
import { MutualFund } from "./components/MutualFund";
import Stack from "@mui/material/Stack";
import Container from "@mui/material/Container";

export function App(): ReactElement {
  return (
    <Stack>
      <ActivateDeactivate/>
      <Container>
        <MutualFund/>
      </Container>
    </Stack>
  );
}
