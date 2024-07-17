'use client'

import { useState, useRef } from 'react';
import { useEthereum } from './Context';
import { useIPFS } from './uploadIPFS'; 
import { 
  Button, 
  Modal, 
  ModalOverlay, 
  ModalContent, 
  ModalHeader, 
  ModalFooter, 
  ModalBody, 
  ModalCloseButton, 
  useDisclosure, 
  Input, 
  VStack, 
  Text,
  Image,
  Box
} from "@chakra-ui/react"
import { Contract, utils } from 'zksync-ethers';
import { zkTunecontractconfig, paymasterParams } from './contract';

export function Connect() {
  const { account, connect, disconnect, getSigner, getProvider } = useEthereum();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isConnecting, setIsConnecting] = useState(false);
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const { uploadToIPFS, isUploading, error: uploadError } = useIPFS();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleConnect = async () => {
    setIsConnecting(true);
    console.log('Connect');
    await connect();
    const signer = await getSigner();
    const contract = new Contract(zkTunecontractconfig.address, zkTunecontractconfig.abi, signer);
    const user = await contract.users(signer?.address);
    const artist = await contract.artists(signer?.address);
    if (artist[0] == '' && user[0] == '') {
      onOpen();
    }else if (artist[0] !== '') {
      console.log('Connected as artist');
    }else {
      console.log('Connected as listener');
    }

    setIsConnecting(false);

  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };


  const handleRegistration = async (isArtist: boolean) => {
    let profileURI = '';
    if (file) {
      try {
        profileURI = await uploadToIPFS(file, `${name || 'User'}_profile`);
      } catch (error) {
        console.error('Error uploading file:', error);
        return;
      }
    }

    try {
      const signer = await getSigner();
      const provider = await getProvider();
      const contract = new Contract(zkTunecontractconfig.address, zkTunecontractconfig.abi, signer);

      if (isArtist) {

        const gasPrice = await provider?.getGasPrice();

        // estimate gasLimit via paymaster
        const gasLimit = await contract.registerArtist.estimateGas(name, profileURI, {
          from: account.address,
          customData: {
          gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
          paymasterParams: paymasterParams,
          },
      });

        // full overrides object including maxFeePerGas and maxPriorityFeePerGas
        const txOverrides = {
          maxFeePerGas: gasPrice,
          maxPriorityFeePerGas: "0",
          gasLimit,
          customData: {
          gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
          paymasterParams,
          }
      }

        const tx = await contract.registerArtist(name, '' || profileURI, txOverrides)
        tx.wait(2);

        console.log("Registered as artist");
      } else {
        const gasPrice = await provider?.getGasPrice();

        console.log(profileURI);

        // estimate gasLimit via paymaster
        const gasLimit = await contract.registerUser.estimateGas(name, profileURI, {
          from: account.address,
          customData: {
          gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
          paymasterParams: paymasterParams,
          },
      });

        // full overrides object including maxFeePerGas and maxPriorityFeePerGas
        const txOverrides = {
          maxFeePerGas: gasPrice,
          maxPriorityFeePerGas: "0",
          gasLimit,
          customData: {
          gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
          paymasterParams,
          }
      }

        const tx = await contract.registerUser(name, '' || profileURI, txOverrides)
        tx.wait(2);
        console.log("Registered as regular user");
      }
    } catch (error) {
      console.error("Error registering:", error);
    }
    onClose();
  };

  console.log(account.isConnected);

  return (
    <>
      {account.isConnected ? (
        <Button colorScheme="red" size="md" borderRadius="full" onClick={disconnect}>
          Disconnect wallet
        </Button>
      ) : (
        <Button 
          colorScheme="green" 
          size="md" 
          borderRadius="full" 
          onClick={handleConnect}
        >
          Connect wallet
        </Button>
      )}

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Complete Your Profile</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Input 
                placeholder="Enter your name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Box>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  display="none"
                />
                <Button onClick={() => fileInputRef.current?.click()}>
                  Choose Profile Picture
                </Button>
              </Box>
              {file && (
                <Image 
                  src={URL.createObjectURL(file)} 
                  alt="Profile preview" 
                  boxSize="100px" 
                  objectFit="cover" 
                  borderRadius="full"
                />
              )}
              {uploadError && <Text color="red.500">{uploadError}</Text>}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button 
              variant="outline" 
              mr={3} 
              onClick={() => handleRegistration(true)}
              isLoading={isUploading}
            >
              Register as Artist
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleRegistration(false)}
              isLoading={isUploading}
            >
              Register as Listener
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}