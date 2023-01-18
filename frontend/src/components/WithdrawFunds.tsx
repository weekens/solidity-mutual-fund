import { ChangeEvent, ReactElement, useState } from "react";
import Button from "@mui/material/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputAdornment,
  TextField
} from "@mui/material";
import Box from "@mui/material/Box";

export function WithdrawFunds(): ReactElement {
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [amount, setAmount] = useState<string>("100");

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
    return !isNaN(parseFloat(value)) && isFinite(value as any);
  }

  function canSubmit(): boolean {
    return isValidPercentage(amount);
  }

  async function handleSubmit() {}

  return (
    <>
      <Button variant="contained" color="error" onClick={handleWithdrawFundsClick}>Withdraw funds</Button>
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
    </>
  );
}
