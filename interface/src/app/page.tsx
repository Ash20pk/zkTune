'use client'

import { ChakraProvider, Flex } from "@chakra-ui/react"
import { Sidebar } from '../components/Sidebar'
import { MainContent } from '../components/MainContent'

export default function Page() {
  
  return (
    <ChakraProvider>
    <div className="flex flex-col h-screen bg-black text-white">
      <Flex h="100vh" flexDirection="column">
        <Flex flex="1" overflow="hidden">
          <Sidebar />
            <MainContent />
          </Flex>
      </Flex>
    </div>
    </ChakraProvider>
  )
}