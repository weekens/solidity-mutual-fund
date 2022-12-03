import { useWeb3React } from "@web3-react/core";
import { Contract, ethers, Signer } from "ethers";
import { ReactElement, ReactNode, useEffect, useState } from "react";
import MutualFundArtifact from "../contracts/MutualFund.sol/MutualFund.json"
import { Provider } from "../utils/provider";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || "";

interface MemberModel {
  addr: string;
  balance: number;
}

function Member(props: MemberModel): ReactElement {
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

interface AccountInfoProps {
  totalBalance: string;
}

function AccountInfo(props: AccountInfoProps): ReactElement {
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

enum ProposalType {
  DepositFunds,
  AddAsset,
  Swap,
  AddMember,
  KickMember,
  ChangeVotingPeriod,
  ChangeGracePeriod
}

interface ProposalRequestModel {
  proposalType: ProposalType;
  amount: string;
  addresses: string[];
}

interface VoteModel {
  memberAddress: string;
  support: boolean;
}

interface ProposalModel {
  id: string;
  createdAt: string;
  author: string;
  request: ProposalRequestModel;
  votes: VoteModel[];
}

interface ProposalsProps {
  proposals: ProposalModel[];
}

function Proposal(props: ProposalModel): ReactElement {
  return (
    <Grid container>
      <Grid item xs={6}>
        Author:
      </Grid>
      <Grid item xs={6}>
        {props.author}
      </Grid>
      <Grid item xs={6}>
        Created at:
      </Grid>
      <Grid item xs={6}>
        {props.createdAt}
      </Grid>
      <Grid item xs={6}>
        Type:
      </Grid>
      <Grid item xs={6}>
        {props.request.proposalType}
      </Grid>
    </Grid>
  );
}

function Proposals(props: ProposalsProps): ReactElement {
  return (
    <Stack>
    {
      props.proposals.map(proposal => {
        return (
          <Proposal key={proposal.id} {...proposal}></Proposal>
        );
      })
    }
    </Stack>
  );
}

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
  const { library, active } = context;

  const [signer, setSigner] = useState<Signer>();
  const [contract, setContract] = useState<Contract>();
  const [tabIndex, setTabIndex] = useState<number>(0);
  const [totalBalance, setTotalBalance] = useState<string>("");
  const [members, setMembers] = useState<MemberModel[]>([]);
  const [proposals, setProposals] = useState<ProposalModel[]>([]);

  useEffect((): void => {
    if (!library) {
      setSigner(undefined);
      return;
    }

    const signer = library.getSigner();

    setSigner(signer);
    const loadData = async () => {
      const MutualFundContract = new ethers.ContractFactory(
        MutualFundArtifact.abi,
        MutualFundArtifact.bytecode,
        signer
      );

      const mutualFundContract = await MutualFundContract.attach(contractAddress);

      const totalBalance = await mutualFundContract.getTotalBalance();

      setContract(mutualFundContract);
      setTotalBalance(totalBalance.toString());

      await Promise.all([
        mutualFundContract.getMembers().then((members: any) => {
          console.log("members =", members);

          setMembers(members);
        }),
        mutualFundContract.getProposals().then((proposals: any) => {
          console.log("proposals =", proposals);

          setProposals(proposals);
        })
      ]);
    };

    loadData().catch(console.error);
  }, [library]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

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
        <Proposals proposals={proposals}/>
      </TabPanel>
    </Box>
  );
}
