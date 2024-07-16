import zkTune from "../ABI/ZkTune.json";
import { utils } from "zksync-ethers";

export const zkTuneABI = zkTune;

export const zkTunecontractconfig = {
  address: "0xf68d91f5a76d504B9404d2B30E73456E770C4cdd",
  abi: zkTuneABI.abi,
} as const;

export const paymasterParams = utils.getPaymasterParams("0xC41C0143a57CCc4d441da2e46325e1048AD02bD6", {
  type: "General",
  innerInput: new Uint8Array(),
});
