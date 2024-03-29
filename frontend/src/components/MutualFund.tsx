import { useWeb3React } from "@web3-react/core";
import { BigNumber, ethers, Signer } from "ethers";
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
import { NewProposal } from "./NewProposal";
import { MutualFundContract } from "../MutualFundContract";
import { AssetList } from "./AssetList";
import { TopBar } from "./TopBar";
import Container from "@mui/material/Container";
import { useEagerConnect, useInactiveListener } from "../utils/hooks";

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
  // handle logic to eagerly connect to the injected ethereum provider, if it exists and has
  // granted access already
  const eagerConnectionSuccessful = useEagerConnect();

  // handle logic to connect in reaction to certain events on the injected ethereum provider,
  // if it exists
  useInactiveListener(!eagerConnectionSuccessful);

  const context = useWeb3React<Provider>();
  const { library, account } = context;

  const [signer, setSigner] = useState<Signer>();
  const [contract, setContract] = useState<MutualFundContract>();
  const [tabIndex, setTabIndex] = useState<number>(0);
  const [fundContractVersion, setFundContractVersion] = useState<string>("");
  const [totalBalance, setTotalBalance] = useState<BigNumber>(BigNumber.from(0));
  const [totalEthBalance, setTotalEthBalance] = useState<BigNumber>(BigNumber.from(0));
  const [members, setMembers] = useState<MemberModel[]>([]);
  const [selfMember, setSelfMember] = useState<MemberModel>();
  const [proposals, setProposals] = useState<ProposalModel[]>([]);
  const [assetAddresses, setAssetAddresses] = useState<string[]>([]);
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<number>(0);

  useEffect(() => {
    setSigner(library?.getSigner() || undefined);
  }, [library, account]);

  useEffect(() => {
    if (!signer) return;

    async function loadContract() {
      const mutualFundContractFactory = new ethers.ContractFactory(
        MutualFundArtifact.abi,
        MutualFundArtifact.bytecode,
        signer
      );

      const mutualFundContract = await mutualFundContractFactory.attach(contractAddress);

      mutualFundContract.on("NewProposal", (id, author) => {
        console.log(">> NewProposal event! id =", id, ", author =", author);
        setLastUpdateTimestamp(new Date().getTime());
      });

      mutualFundContract.on("ProposalExecuted", (id) => {
        console.log(">> ProposalExecuted event! id =", id);
        setLastUpdateTimestamp(new Date().getTime());
      });

      mutualFundContract.on("NewVote", (proposalId, memberAddress, support) => {
        console.log(
          ">> NewVote event! proposalId =", proposalId, ", memberAddress =", memberAddress, ", support =", support);
        setLastUpdateTimestamp(new Date().getTime());
      });

      mutualFundContract.on("Exit", (memberAddress, percentage, toReturn) => {
        console.log(
          ">> Exit event! memberAddress =", memberAddress, ", percentage =", percentage, ", toReturn =", toReturn);
        setLastUpdateTimestamp(new Date().getTime());
      });

      setContract(mutualFundContract as unknown as MutualFundContract);
    }

    loadContract().catch(console.error);
  }, [signer]);

  useEffect(() => {
    if (!contract) return;

    const loadData = async () => {
      await Promise.all([
        contract.getVersion().then((version: string) => {
          console.log("version =", version);

          setFundContractVersion(version);
        }),
        contract.getTotalEthBalance().then((totalEthBalance: BigNumber) => {
          console.log("totalEthBalance =", totalEthBalance);

          setTotalEthBalance(totalEthBalance);
        }),
        contract.getTotalBalance().then((totalBalance: BigNumber) => {
          console.log("totalBalance =", totalBalance);

          setTotalBalance(totalBalance);
        }),
        contract.getMembers().then((members: MemberModel[]) => {
          console.log("members =", members);

          setMembers(members);
        }),
        contract.getProposals().then(async (proposals: ProposalModel[]) => {
          console.log("proposals =", proposals);

          setProposals(proposals);
        }),
        contract.getAssets().then(async (assets: string[]) => {
          console.log("assets =", assets);

          setAssetAddresses(assets);
        })
      ]);
    };

    loadData().catch(console.error);
  }, [contract, lastUpdateTimestamp]);

  useEffect(() => {
    async function loadSelfMember() {
      if (!signer) return;

      const selfAddress = await signer.getAddress();
      const selfMember = members.find(m => m.addr === selfAddress);
      setSelfMember(selfMember);
    }

    loadSelfMember().catch(console.error);
  }, [signer, members]);

  function handleTabChange(event: SyntheticEvent, newValue: number) {
    setTabIndex(newValue);
  }

  if (!contract)
    return (
      <Stack>
        <Typography>
          <TopBar />
        </Typography>
      </Stack>
    );

  if (!selfMember)
    return (
      <Stack>
        <Typography>
          <TopBar />
        </Typography>
        <Container>
          <Box sx={{ width: "100%" }}>
            <Typography>
              <h2>You are not a member of this fund, so you cannot view its data. 🤷‍♂️</h2>
            </Typography>
          </Box>
        </Container>
      </Stack>
    );

  return (
    <Stack>
      <Typography>
        <TopBar selfMember={selfMember}/>
      </Typography>
      <Container>
        <Box sx={{ width: "100%" }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={tabIndex} onChange={handleTabChange} aria-label="basic tabs example">
              <Tab label="Home" {...tabProps(0)} />
              <Tab label="Members" {...tabProps(1)} />
              <Tab label="Proposals" {...tabProps(2)} />
              <Tab label="Assets" {...tabProps(3)} />
            </Tabs>
          </Box>
          <TabPanel value={tabIndex} index={0}>
            <AccountInfo
              fundContractVersion={fundContractVersion}
              totalBalance={totalBalance}
              totalEthBalance={totalEthBalance}
              member={selfMember}
            />
          </TabPanel>
          <TabPanel value={tabIndex} index={1}>
            <Stack gap="15px">
              {
                members.map((member) => {
                  return (
                    <Member
                      key={member.addr}
                      model={member}
                      totalBalance={totalBalance}
                      totalEthBalance={totalEthBalance}
                    />
                  )
                })
              }
            </Stack>
          </TabPanel>
          <TabPanel index={tabIndex} value={2}>
            <Stack>
              <NewProposal contract={contract} />
              <ProposalList proposals={proposals} members={members} contract={contract} />
            </Stack>
          </TabPanel>
          <TabPanel index={tabIndex} value={3}>
            <AssetList assetAddresses={assetAddresses} />
          </TabPanel>
        </Box>
      </Container>
    </Stack>
  );
}
