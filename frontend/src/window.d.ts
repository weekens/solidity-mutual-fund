import { MetaMaskInpageProvider } from "@metamask/detect-provider";

declare global {
    interface Window {
        ethereum?: MetaMaskInpageProvider;
    }
}
