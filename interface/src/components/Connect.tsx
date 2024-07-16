'use client'

import { useEthereum } from './Context';
import { Button } from "@chakra-ui/react"


export function Connect() {
  const { account, connect, disconnect } = useEthereum();

  return (
    <div>
      {account.isConnected ? (
        <Button colorScheme="red" size="md" borderRadius="full" onClick={disconnect}>
          Disconnect wallet
        </Button>
      ) : (
        <Button colorScheme="green" size="md" borderRadius="full" onClick={connect}>
          Connect wallet
        </Button>
      )}
    </div>
  )
}
