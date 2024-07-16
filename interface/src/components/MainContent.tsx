import { useState, useEffect } from 'react'
import { Box, Heading, SimpleGrid, Image, Text, VStack, Icon, Flex, Img, IconButton } from "@chakra-ui/react"
import { FaPlay, FaUser } from "react-icons/fa"
import Link from 'next/link';
import { Connect } from '../components/Connect'
import { useFetchSongs } from './fetchSongs';
import { useEthereum } from './Context';
import { Player } from './Player';
import { Contract, utils } from 'zksync-ethers';
import { zkTunecontractconfig, paymasterParams } from './contract';
import { ethers } from "ethers";
import SongNFTABI from "../ABI/SongNFT.json";


interface Song {
  id: string
  title: string
  artist: string
  cover: string
  audioUrl: string
  streamCount: number
  contractAddress: string
}

interface Playlist {
  id: number
  title: string
  cover: string
  description: string
}

interface Artist {
  id: number
  name: string
  cover: string
}

const featuredPlaylists: Playlist[] = [
  { id: 1, title: "Today's Top Hits", cover: "https://via.placeholder.com/300", description: "The hottest tracks right now" },
  { id: 2, title: "Chill Vibes", cover: "https://via.placeholder.com/300", description: "Lay back and unwind" },
  { id: 3, title: "Workout Beats", cover: "https://via.placeholder.com/300", description: "Energy-pumping music for your workout" },
  { id: 4, title: "Indie Mix", cover: "https://via.placeholder.com/300", description: "The best of independent artists" },
]

const popularArtists: Artist[] = [
  { id: 1, name: "Ariana Grande", cover: "https://via.placeholder.com/300" },
  { id: 2, name: "Drake", cover: "https://via.placeholder.com/300" },
  { id: 3, name: "Billie Eilish", cover: "https://via.placeholder.com/300" },
  { id: 4, name: "Post Malone", cover: "https://via.placeholder.com/300" },
]

export function MainContent() {
    const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
    const {account, getProvider, getSigner} = useEthereum();
    const {songs, loading, error } = useFetchSongs(5);
    const [currentSong, setCurrentSong] = useState<Song | null>(null);

    const mintNFT = async (song: Song) => {
        const provider = await getProvider();
        const signer = await getSigner();
        const gasPrice = await provider?.getGasPrice();
        const contract = new Contract(zkTunecontractconfig.address, zkTunecontractconfig.abi, signer);
        const SongNFTContract = new Contract(song.contractAddress, SongNFTABI.abi, signer);
        const nftPrice = await SongNFTContract.nftPrice();

         // estimate gasLimit via paymaster
         const gasLimit = await contract.streamSong.estimateGas(song.id, {
            from: account.address,
            value: ethers.parseEther(nftPrice.toString()),
            customData: {
            gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
            paymasterParams: paymasterParams,
            },
        });

         // full overrides object including maxFeePerGas and maxPriorityFeePerGas
        const txOverrides = {
            value: ethers.parseEther(nftPrice.toString()),
            maxFeePerGas: gasPrice,
            maxPriorityFeePerGas: "0",
            gasLimit,
            customData: {
            gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
            paymasterParams,
            }
        }

        const tx = await contract.streamSong(song.id, txOverrides)
        tx.wait();
    }
    const playSong = async (song: Song) => {
        const signer = await getSigner();
        const SongNFTContract = new Contract(song.contractAddress, SongNFTABI.abi, signer);
        const contract = new Contract(zkTunecontractconfig.address, zkTunecontractconfig.abi, signer);
        if (await SongNFTContract.balanceOf(account.address?.toString()) > 0){
            console.log("NFT Minted already")
            const songData = await SongNFTContract.getInfo(account.address?.toString())
            const currentSong = {
                id: songData[0].toString(),
                title: await SongNFTContract.name(),
                artist: (await contract.artists(songData[1]))[0],
                cover: songData[3],
                audioUrl: songData[2],
                source: 'contract',
                streamCount: 0,
                contractAddress: ""
            }
            setCurrentSong(currentSong);
        } else {
            console.log("Minting Song");
            await mintNFT(song)
            const currentSong = await SongNFTContract.getInfo(account.address?.toString())
            setCurrentSong(currentSong);
    
        }
    };


    useEffect(() => {
        console.log("Fetching songs...");
        const fetchSongs = async () => {
            try {
                const formattedSongs = songs.map((song: any, index: number) => ({
                    id: song.id || (index + 1).toString(),
                    title: song.title,
                    artist: song.artist,
                    cover: song.cover || "https://via.placeholder.com/300",
                    audioUrl: song.audioUrl,
                    streamCount: song.streamCount,
                    contractAddress: song.contractAddress
                  }));
                  console.log(formattedSongs);
              setRecentlyPlayed(formattedSongs)
              console.log("Fetched songs completed successfully"); 
            } catch (error) {
              console.error("Error fetching songs:", error)
            }
          }
    
        fetchSongs()
      }, [account])

  return (
    <Box flex="1" bg="gray.900" color="white" overflowY="auto" p={8}>
        <Flex justifyContent="space-between" alignItems="center" mb={8}>
          <Heading size="2xl">Good afternoon</Heading>
          <Flex alignItems="center">
            <Connect />
            <Link href="/profile" passHref>
              <IconButton
                as="a"
                aria-label="Profile"
                icon={<FaUser />}
                colorScheme="green"
                variant="ghost"
                ml={4}
                color="white"
              />
            </Link>
          </Flex>
        </Flex>
      <Box mb={12}>
        <Heading size="lg" mb={6}>Recently played</Heading>
        <SimpleGrid columns={5} spacing={6}>
          {songs.map((song) => (
            <Box key={song.id.toString()} bg="gray.800" borderRadius="lg" overflow="hidden" transition="all 0.3s" _hover={{ bg: "gray.700", transform: "scale(1.05)" }} onClick={() => playSong(song)} cursor="pointer">
              <Box position="relative">
                <Img src={song.cover} alt={song.title} />
                <Box position="absolute" top="0" left="0" right="0" bottom="0" bg="blackAlpha.600" opacity="0" transition="all 0.3s" _groupHover={{ opacity: 1 }}>
                  <Icon as={FaPlay} position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" boxSize={12} color="green.500" />
                </Box>
              </Box>
              <Box p={4}>
                <Text fontWeight="semibold" isTruncated>{song.title}</Text>
                <Text fontSize="sm" color="gray.400" isTruncated>{song.artist}</Text>
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      {/* <Box mb={12}>
        <Heading size="lg" mb={6}>Featured playlists</Heading>
        <SimpleGrid columns={4} spacing={6}>
          {featuredPlaylists.map((playlist) => (
            <Box key={playlist.id} bg="gray.800" borderRadius="lg" overflow="hidden" transition="all 0.3s" _hover={{ bg: "gray.700", transform: "scale(1.05)" }}>
              <Box position="relative">
                <Image src={playlist.cover} alt={playlist.title} />
                <Box position="absolute" top="0" left="0" right="0" bottom="0" bg="blackAlpha.600" opacity="0" transition="all 0.3s" _groupHover={{ opacity: 1 }}>
                  <Icon as={FaPlay} position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" boxSize={12} color="green.500" />
                </Box>
              </Box>
              <Box p={4}>
                <Text fontWeight="semibold" isTruncated>{playlist.title}</Text>
                <Text fontSize="sm" color="gray.400" isTruncated>{playlist.description}</Text>
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      </Box> */}

      <Box>
        <Heading size="lg" mb={6}>Popular artists</Heading>
        <SimpleGrid columns={4} spacing={6}>
          {popularArtists.map((artist) => (
            <VStack key={artist.id} align="center">
              <Box position="relative" borderRadius="full" overflow="hidden">
                <Image src={artist.cover} alt={artist.name} borderRadius="full" />
                <Box position="absolute" top="0" left="0" right="0" bottom="0" bg="blackAlpha.600" opacity="0" transition="all 0.3s" _groupHover={{ opacity: 1 }} borderRadius="full">
                  <Icon as={FaPlay} position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" boxSize={12} color="green.500" />
                </Box>
              </Box>
              <Text fontWeight="semibold">{artist.name}</Text>
            </VStack>
          ))}
        </SimpleGrid>
      </Box>
      {currentSong && (
                <Box position="fixed" bottom={0} left={0} right={0}>
                    <Player 
                        audioUrl={currentSong.audioUrl} 
                        title={currentSong.title} 
                        artist={currentSong.artist} 
                        cover={currentSong.cover}
                    />
                </Box>
            )}
    </Box>
  )
}