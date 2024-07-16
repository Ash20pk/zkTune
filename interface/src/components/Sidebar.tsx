import { Box, VStack, Text, Button, Icon } from "@chakra-ui/react"
import { FaHome, FaSearch, FaBook, FaPlusSquare, FaHeart } from "react-icons/fa"

export function Sidebar() {
  return (
    <Box w="240px" bg="black" color="gray.300" p={4}>
      <VStack align="stretch" spacing={6}>
        <Text fontSize="2xl" fontWeight="bold" color="white">
          ZkTune
        </Text>
        <VStack align="stretch" spacing={4}>
          <Button leftIcon={<Icon as={FaHome} />} variant="ghost" justifyContent="flex-start" color="white">
            Home
          </Button>
          {/* <Button leftIcon={<Icon as={FaSearch} />} variant="ghost" justifyContent="flex-start">
            Search
          </Button>
          <Button leftIcon={<Icon as={FaBook} />} variant="ghost" justifyContent="flex-start">
            Your Library
          </Button>
        </VStack>
        <VStack align="stretch" spacing={4}>
          <Button leftIcon={<Icon as={FaPlusSquare} />} variant="ghost" justifyContent="flex-start">
            Create Playlist
          </Button>
          <Button leftIcon={<Icon as={FaHeart} />} variant="ghost" justifyContent="flex-start">
            Liked Songs
          </Button> */}
        </VStack>
      </VStack>
    </Box>
  )
}