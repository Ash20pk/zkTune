import zkTune from "../ABI/ZkTune.json";
import { utils } from "zksync-ethers";

export const zkTuneABI = zkTune;

export const zkTunecontractconfig = {
  address: "0xF6fD542642468c476ca261656686985f343f57A5",
  abi: zkTuneABI.abi,
} as const;

export const paymasterParams = utils.getPaymasterParams("0xEfD93FFC523aB31DeC32946f5bb2B102f33C0338", {
  type: "General",
  innerInput: new Uint8Array(),
});
