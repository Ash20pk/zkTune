import zkTune from "../ABI/ZkTune.json";
import { utils } from "zksync-ethers";

export const zkTuneABI = zkTune;

export const zkTunecontractconfig = {
  address: "0x78b72fa31c62779262a1Ff29231215Ce2F8bC72C",
  abi: zkTuneABI.abi,
} as const;

export const paymasterParams = utils.getPaymasterParams("0x6473b288f330f455BffDD2c564776b0930A95D5F", {
  type: "General",
  innerInput: new Uint8Array(),
});
