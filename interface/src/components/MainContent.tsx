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
import { useFetchArtists } from './fetchArtists';


interface Song {
  id: string
  title: string
  artist: string
  cover: string
  audioUrl: string
  streamCount: number
  contractAddress: string
}

interface Artist {
  id: string;
  name: string;
  profileURI: string;
}


export function MainContent() {
    const [popularSongs, setPopularSongs] = useState<Song[]>([]);
    const [popularArtists, setPopularArtists] = useState<Artist[]>([]);
    const {account, getProvider, getSigner} = useEthereum();
    const {songs} = useFetchSongs();
    const {artists} = useFetchArtists();
    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    const [greeting, setGreeting] = useState(getGreeting());

    function getGreeting(): string {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) {
        return "Good morning";
      } else if (hour >= 12 && hour < 18) {
        return "Good afternoon";
      } else if (hour >= 18 && hour < 22) {
        return "Good evening";
      } else {
        return "Good night";
      }
    }

    useEffect(() => {
      const timer = setInterval(() => {
        setGreeting(getGreeting());
      }, 60000); // Update every minute
  
      return () => clearInterval(timer);
    }, []);

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
            contractAddress: song.contractAddress,

          }));
    
          // Sort songs by stream count in descending order
          const sortedSongs = formattedSongs.sort((a, b) => 
            b.streamCount - a.streamCount
          );
    
          // Take the top 5 songs
          const PopularSongs = sortedSongs.slice(0, 5);
    
          console.log("Popular 5 songs:", PopularSongs);
          setPopularSongs(PopularSongs);
          console.log("Fetched songs completed successfully"); 
        } catch (error) {
          console.error("Error fetching songs:", error);
        }
      };
    
      fetchSongs();
    }, [account, songs]); 

    useEffect(() => {
      console.log("Fetching artists...");
      const fetchArtists = async () => {
        try {
          console.log(artists);
          const formattedArtists = artists.map((artist: any, index: number) => ({
            id: (index + 1).toString(),
            name: artist.name,
            profileURI: artist.profileURI,

          }));
    
          // Take the top 5 songs
          const popularArtists = formattedArtists.slice(0, 5);
    
          console.log("Popular 5 artists:", popularArtists);
          setPopularArtists(popularArtists);
          console.log("Fetched songs completed successfully"); 
        } catch (error) {
          console.error("Error fetching songs:", error);
        }
      };
    
      fetchArtists();
    }, [account, artists]); 

    return (      
      <Box flex="1" bg="gray.800" color="white" overflowY="auto" p={8}>
        <Flex justifyContent="space-between" alignItems="center" mb={8}>
          <Heading size="2xl">{greeting}</Heading>
          <Flex alignItems="center">
            <Connect />
            {/* <Link href="/profile" passHref>
              <IconButton
                as="a"
                aria-label="Profile"
                icon={<FaUser />}
                colorScheme="green"
                variant="ghost"
                ml={4}
                color="white"
              />
            </Link> */}
          </Flex>
        </Flex>
        {account.isConnected ? (
          <>
            <Box mb={12}>
              <Heading size="lg" mb={6}>Popular Songs</Heading>
              <SimpleGrid columns={5} spacing={6}>
                {popularSongs.map((song) => (
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

            <Box>
              <Heading size="lg" mb={4}>Popular artists</Heading>
              <SimpleGrid columns={5} spacing={6}> 
                {popularArtists.map((artist) => (
                  <VStack key={artist.id} align="center" spacing={2}> 
                    <Box 
                      position="relative" 
                      borderRadius="full" 
                      overflow="hidden"
                      w="120px"  
                      h="120px"
                      boxShadow="md"
                    >
                      <Image 
                        src={artist.profileURI} 
                        alt={artist.name} 
                        borderRadius="full" 
                        objectFit="cover"
                        w="100%"
                        h="100%"
                      />
                      <Box 
                        position="absolute" 
                        top="0" 
                        left="0" 
                        right="0" 
                        bottom="0" 
                        bg="blackAlpha.600" 
                        opacity="0" 
                        transition="all 0.3s" 
                        _hover={{ opacity: 1 }}
                        borderRadius="full"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                      </Box>
                    </Box>
                    <Text fontWeight="semibold" fontSize="sm">{artist.name}</Text>
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
          </>
        ) : (
          <Heading>Please connect your wallet</Heading>
        )}
      </Box> 
    )
}