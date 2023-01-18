import { ReactElement } from "react";
import { TopBar } from "./components/TopBar";
import { MutualFund } from "./components/MutualFund";
import Stack from "@mui/material/Stack";
import Container from "@mui/material/Container";
import { Typography } from "@mui/material";

export function App(): ReactElement {
  return (
    <Stack>
      <Typography>
        <TopBar/>
      </Typography>
      <Container>
        <MutualFund/>
      </Container>
    </Stack>
  );
}
