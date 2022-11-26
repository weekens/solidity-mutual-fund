import { ReactElement } from "react";
import { ActivateDeactivate } from "./components/ActivateDeactivate";
import { SectionDivider } from "./components/SectionDivider";
import { MutualFund } from "./components/MutualFund";
import Stack from "@mui/material/Stack";

export function App(): ReactElement {
  return (
    <Stack>
      <ActivateDeactivate/>
      <SectionDivider/>
      <MutualFund/>
    </Stack>
  );
}
