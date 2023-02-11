import { ProposalType, toProposalType } from "../models/ProposalType";
import { ChangeEvent, ReactElement, SyntheticEvent, useState } from "react";
import {
  Alert,
  Dialog, DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent, Snackbar, TextField
} from "@mui/material";
import { ethers } from "ethers";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import { MutualFundContract } from "../MutualFundContract";

export interface NewProposalProps {
  contract: MutualFundContract;
}

export function NewProposal(props: NewProposalProps): ReactElement {
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [proposalType, setProposalType] = useState<ProposalType>(0);
  const [name, setName] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [address2, setAddress2] = useState<string>("");
  const [submitSnackbarOpen, setSubmitSnackbarOpen] = useState<boolean>(false);
  const [newProposalSnackbarOpen, setNewProposalSnackbarOpen] = useState<boolean>(false);

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

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    setName(event.target.value);
  }

  function handleAmountChange(event: ChangeEvent<HTMLInputElement>) {
    setAmount(event.target.value);
  }

  function handleAddressChange(event: ChangeEvent<HTMLInputElement>) {
    setAddress(event.target.value);
  }

  function handleAddress2Change(event: ChangeEvent<HTMLInputElement>) {
    setAddress2(event.target.value);
  }

  async function handleSubmit() {
    setModalOpen(false);

    if (proposalType !== undefined) {
      if (!amount || !address) return;

      const proposalTxn = await props.contract.submitProposal({
        proposalType: proposalType.valueOf(),
        name: name,
        amount: ethers.utils.parseEther(amount),
        addresses: [ethers.utils.getAddress(address)].concat(!!address2 ? ethers.utils.getAddress(address2) : [])
      });

      setSubmitSnackbarOpen(true);

      await proposalTxn.wait();

      setSubmitSnackbarOpen(false);
      setNewProposalSnackbarOpen(true);
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
    setName("");
    setAmount("");
    setAddress("");
    setAddress2("");
  }

  function handleSubmitSnackbarClose(event: SyntheticEvent | Event, reason?: string) {
    if (reason === 'clickaway') {
      return;
    }

    setSubmitSnackbarOpen(false);
  }

  function handleNewProposalSnackbarClose(event: SyntheticEvent | Event, reason?: string) {
    if (reason === 'clickaway') {
      return;
    }

    setNewProposalSnackbarOpen(false);
  }

  return (
    <>
      <Button variant="outlined" onClick={handleNewProposalClick} sx={{ marginBottom: "15px" }}>
        <AddIcon/> New Proposal
      </Button>
      <Snackbar
        open={submitSnackbarOpen}
        autoHideDuration={6000}
        onClose={handleSubmitSnackbarClose}
        message="Proposal has been submitted. Hang on while it gets approved by the network."
      />
      <Snackbar open={newProposalSnackbarOpen} autoHideDuration={6000} onClose={handleNewProposalSnackbarClose}>
        <Alert onClose={handleNewProposalSnackbarClose} severity="success" sx={{ width: '100%' }}>
          New proposal has been successfully registered!
        </Alert>
      </Snackbar>
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
                label="Name"
                value={name}
                onChange={handleNameChange}
              />
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
              <TextField
                label="Address 2"
                value={address2}
                onChange={handleAddress2Change}
                error={address !== "" && !ethers.utils.isAddress(address)}
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
