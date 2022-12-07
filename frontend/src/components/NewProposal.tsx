import { ProposalType, toProposalType } from "../models/ProposalType";
import { ChangeEvent, ReactElement, useState } from "react";
import {
  Dialog, DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent, TextField
} from "@mui/material";
import { ethers } from "ethers";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";

export interface NewProposalSubmitEvent {
  proposalType: ProposalType;
  amount?: string;
  address?: string;
}

export interface NewProposalProps {
  onSubmit: (event: NewProposalSubmitEvent) => void;
}

export function NewProposal(props: NewProposalProps): ReactElement {
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [proposalType, setProposalType] = useState<ProposalType>(0);
  const [amount, setAmount] = useState<string>("");
  const [address, setAddress] = useState<string>("");

  function handleNewProposalClick() {
    setModalOpen(true);
  }

  function handleClose() {
    setModalOpen(false);
    reset();
  }

  function handleProposalTypeChange(event: SelectChangeEvent<number>) {
    setProposalType(toProposalType(Number(event.target.value)));
  }

  function handleAmountChange(event: ChangeEvent<HTMLInputElement>) {
    setAmount(event.target.value);
  }

  function handleAddressChange(event: ChangeEvent<HTMLInputElement>) {
    setAddress(event.target.value);
  }

  function handleSubmit() {
    setModalOpen(false);

    if (proposalType !== undefined) {
      props.onSubmit({
        proposalType,
        amount,
        address
      });
    }

    reset();
  }

  function isValidEtherAmount(amount: string): boolean {
    try {
      ethers.utils.parseEther(amount);
      return true;
    } catch (e) {
      return false;
    }
  }

  function canSubmit(): boolean {
    return proposalType !== undefined && ethers.utils.isAddress(address) && isValidEtherAmount(amount);
  }

  function reset() {
    setProposalType(ProposalType.DepositFunds);
    setAmount("");
    setAddress("");
  }

  return (
    <>
      <Button variant="outlined" onClick={handleNewProposalClick}>
        <AddIcon/> New Proposal
      </Button>
      <Dialog open={modalOpen} onClose={handleClose}>
        <DialogTitle>New Proposal</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ display: 'flex', flexWrap: 'wrap' }}>
            <FormControl sx={{ m: 1, minWidth: 120 }}>
              <InputLabel>Proposal type</InputLabel>
              <Select defaultValue={0} value={proposalType} onChange={handleProposalTypeChange}>
                {
                  Object.keys(ProposalType).filter(v => isNaN(Number(v))).map((key, index) => {
                    return <MenuItem key={index} value={index}>{key}</MenuItem>;
                  })
                }
              </Select>
              <TextField
                label="Amount"
                value={amount}
                onChange={handleAmountChange}
                error={!isValidEtherAmount(amount)}
              />
              <TextField
                label="Address"
                value={address}
                onChange={handleAddressChange}
                error={!ethers.utils.isAddress(address)}
              />
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={!canSubmit()}>Submit</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
