import { ChangeEvent, ReactElement, useEffect, useState } from "react";
import Button from "@mui/material/Button";
import {
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputAdornment, Snackbar,
  TextField
} from "@mui/material";
import Box from "@mui/material/Box";
import { MutualFundContract } from "../MutualFundContract";
import { useWeb3React } from "@web3-react/core";
import { Provider } from "../utils/provider";
import { ethers, Signer } from "ethers";
import MutualFundArtifact from "../contracts/MutualFund.sol/MutualFund.json"
import { MemberModel } from "../models/MemberModel";

export interface WithdrawFundsProps {
  selfMember?: MemberModel;
}

export function WithdrawFunds(props: WithdrawFundsProps): ReactElement {
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || "";
  const context = useWeb3React<Provider>();
  const { library, account } = context;
  const selfBalance = props.selfMember?.balance;

  const [signer, setSigner] = useState<Signer>();
  const [contract, setContract] = useState<MutualFundContract>();
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [amount, setAmount] = useState<string>("100");
  const [withdrawSnackbarOpen, setWithdrawSnackbarOpen] = useState<boolean>(false);
  const [withdrawSuccessSnackbarOpen, setWithdrawSuccessSnackbarOpen] = useState<boolean>(false);

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

      setContract(mutualFundContract as unknown as MutualFundContract);
    }

    loadContract().catch(console.error);
  }, [signer, contractAddress]);

  function handleWithdrawFundsClick() {
    setModalOpen(true);
  }

  function handleAmountChange(event: ChangeEvent<HTMLInputElement>) {
    setAmount(event.target.value);
  }

  function handleClose() {
    setModalOpen(false);
    reset();
  }

  function reset() {
    setAmount("100");
  }

  function isValidPercentage(value: string): boolean {
    return !isNaN(parseInt(value)) && isFinite(value as any);
  }

  function canSubmit(): boolean {
    return isValidPercentage(amount);
  }

  async function handleSubmit() {
    setModalOpen(false);

    const parsedAmount = parseInt(amount);

    if (!contract || isNaN(parsedAmount)) return;

    const txn = await contract.exit(parsedAmount);

    setWithdrawSnackbarOpen(true);

    await txn.wait();

    setWithdrawSnackbarOpen(false);
    setWithdrawSuccessSnackbarOpen(true);

    reset();
  }

  function handleWithdrawSnackbarClose() {
    setWithdrawSnackbarOpen(false);
  }

  function handleWithdrawSuccessSnackbarClose() {
    setWithdrawSuccessSnackbarOpen(false);
  }

  return (
    <>
      <Button
        variant="contained"
        color="error"
        disabled={!selfBalance || selfBalance.eq(0) }
        onClick={handleWithdrawFundsClick}>
        Withdraw funds
      </Button>
      <Dialog open={modalOpen} onClose={handleClose}>
        <DialogTitle>Withdraw Funds</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ display: 'flex', flexWrap: 'wrap' }}>
            <FormControl sx={{ m: 1, minWidth: 120 }}>
              <TextField
                label="Amount %"
                value={amount}
                onChange={handleAmountChange}
                error={!isValidPercentage(amount)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
              />
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={!canSubmit()}>Submit</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={withdrawSnackbarOpen}
        autoHideDuration={6000}
        onClose={handleWithdrawSnackbarClose}
        message="Withdrawal request has been submitted. Hang on while it gets approved by the network."
      />
      <Snackbar open={withdrawSuccessSnackbarOpen} autoHideDuration={6000} onClose={handleWithdrawSuccessSnackbarClose}>
        <Alert onClose={handleWithdrawSuccessSnackbarClose} severity="success" sx={{ width: '100%' }}>
          Funds withdrawal request successfully executed! Funds should be in your wallet now.
        </Alert>
      </Snackbar>
    </>
  );
}
