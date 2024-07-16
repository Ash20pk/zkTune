import { deployContract } from "./utils";


export default async function () {
  const Paymaster = "GeneralPaymaster";
  const PaymasterArguments = [];
  await deployContract(Paymaster, PaymasterArguments);

  const contractArtifactName = "ZkTune";
  const dAppArguments = [];
  await deployContract(contractArtifactName, dAppArguments);
}
