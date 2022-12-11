import { useWeb3React } from "@web3-react/core";
import { ethers, Signer } from "ethers";
import { ReactElement, ReactNode, SyntheticEvent, useEffect, useState } from "react";
import MutualFundArtifact from "../contracts/MutualFund.sol/MutualFund.json"
import { Provider } from "../utils/provider";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { MemberModel } from "../models/MemberModel";
import { Member } from "./Member";
import { AccountInfo } from "./AccountInfo";
import { ProposalModel } from "../models/ProposalModel";
import { ProposalList } from "./ProposalList";
import { NewProposal, NewProposalSubmitEvent } from "./NewProposal";
import { MutualFundContract } from "../MutualFundContract";

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || "";

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function tabProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

export function MutualFund(): ReactElement {
  const context = useWeb3React<Provider>();
  const { library } = context; // { library, active } could also be used.

  const [signer, setSigner] = useState<Signer>();
  const [contract, setContract] = useState<MutualFundContract>();
  const [tabIndex, setTabIndex] = useState<number>(0);
  const [totalBalance, setTotalBalance] = useState<string>("");
  const [members, setMembers] = useState<MemberModel[]>([]);
  const [proposals, setProposals] = useState<ProposalModel[]>([]);

  useEffect(() => {
    if (!library) {
      if (signer) {
        setSigner(undefined);
      }

      return;
    }

    setSigner(library.getSigner());
  }, [library]);

  useEffect(() => {
    if (!signer) return;

    async function loadContract() {
      const MutualFundContract = new ethers.ContractFactory(
        MutualFundArtifact.abi,
        MutualFundArtifact.bytecode,
        signer
      );

      const mutualFundContract = await MutualFundContract.attach(contractAddress);

      mutualFundContract.on("NewProposal", (id, author) => {
        console.log(">> NewProposal event! id =", id, ", author =", author);
      });

      setContract(mutualFundContract as unknown as MutualFundContract);
    }

    loadContract().catch(console.error);
  }, [signer]);

  useEffect(() => {
    if (!contract) return;

    const loadData = async () => {
      const totalBalance = await contract.getTotalBalance();

      setTotalBalance(totalBalance.toString());

      await Promise.all([
        contract.getMembers().then((members: MemberModel[]) => {
          console.log("members =", members);

          setMembers(members);
        }),
        contract.getProposals().then(async (proposals: ProposalModel[]) => {
          console.log("proposals =", proposals);

          setProposals(proposals);
        })
      ]);
    };

    loadData().catch(console.error);
  }, [contract]);

  function handleTabChange(event: SyntheticEvent, newValue: number) {
    setTabIndex(newValue);
  }

  async function handleNewProposalSubmit(event: NewProposalSubmitEvent) {
    console.log("new proposal, ", event);

    if (!contract) throw new Error("Contract not loaded");

    const amount = event.amount;
    const address = event.address;

    if (!amount || !address) return;

    const proposalTxn = await contract.submitProposal({
      proposalType: event.proposalType.valueOf(),
      amount: ethers.utils.parseEther(amount),
      addresses: [ethers.utils.getAddress(address)]
    });

    await proposalTxn.wait();

    console.log("Proposal successfully submitted");
  }

  if (!contract)
    return (<></>);

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tabIndex} onChange={handleTabChange} aria-label="basic tabs example">
          <Tab label="Home" {...tabProps(0)} />
          <Tab label="Members" {...tabProps(1)} />
          <Tab label="Proposals" {...tabProps(2)} />
        </Tabs>
      </Box>
      <TabPanel value={tabIndex} index={0}>
        <AccountInfo totalBalance={totalBalance}/>
      </TabPanel>
      <TabPanel value={tabIndex} index={1}>
        <Stack>
        {
          members.map((member) => {
            return (
              <Member key={member.addr} addr={member.addr} balance={member.balance}/>
            )
          })
        }
        </Stack>
      </TabPanel>
      <TabPanel index={tabIndex} value={2}>
        <Stack>
          <NewProposal onSubmit={handleNewProposalSubmit} />
          <ProposalList proposals={proposals} contract={contract} />
        </Stack>
      </TabPanel>
    </Box>
  );
}
