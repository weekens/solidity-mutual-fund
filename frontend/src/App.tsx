import { ReactElement } from "react";
import { ActivateDeactivate } from "./components/ActivateDeactivate";
import { SectionDivider } from "./components/SectionDivider";
import { MutualFund } from "./components/MutualFund";

export function App(): ReactElement {
  return (
    <div>
      <ActivateDeactivate/>
      <SectionDivider/>
      <MutualFund/>
    </div>
  );
}
