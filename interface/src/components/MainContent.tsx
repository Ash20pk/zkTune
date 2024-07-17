import { useState, useEffect } from 'react'
import { Box, Heading, SimpleGrid, Image, Text, VStack, Icon, Flex, Img, IconButton, Skeleton } from "@chakra-ui/react"
import { FaPlay } from "react-icons/fa"
import { CgProfile } from "react-icons/cg";
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
    const {songs, loading} = useFetchSongs();
    const {artists} = useFetchArtists();
    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    const [greeting, setGreeting] = useState(getGreeting());
    const [message, setMessage] = useState("");

    function getGreeting(): string {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) {
        return "Good morning 🌻";
      } else if (hour >= 12 && hour < 18) {
        return "Good afternoon 🌞";
      } else if (hour >= 18 && hour < 22) {
        return "Good evening 🌖";
      } else {
        return "Good night 🌜";
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
        tx.wait(2);
    }
    const playSong = async (song: Song) => {
        setMessage("Putting the record on...");
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
            setMessage("");
            setCurrentSong(currentSong);
        } else {
            setMessage("Minting Song")
            console.log("Minting Song");
            await mintNFT(song);
            
            // Check for the minted NFT every 2 seconds for up to 10 seconds
            const checkForMintedNFT = async (attempts = 5) => {
                if (attempts === 0) {
                    console.error("NFT minting timeout. Please check your transaction.");
                    return;
                }
                setMessage("Putting the record on...")
                if (await SongNFTContract.balanceOf(account.address?.toString()) > 0) {
                    console.log("NFT Minted successfully");
                    const songData = await SongNFTContract.getInfo(account.address?.toString());
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
                    setMessage("");
                    setCurrentSong(currentSong);
                } else {
                    console.log(`Waiting for NFT to be minted. Attempts left: ${attempts}`);
                    setTimeout(() => checkForMintedNFT(attempts - 1), 2000);
                }
            };
    
            checkForMintedNFT();
          
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
            streamCount: Number(song.streamCount.toString()),
            contractAddress: song.contractAddress,

          }));
    
          // Sort songs by stream count in descending order
          const sortedSongs = formattedSongs.sort((a, b) => 
            b.streamCount - a.streamCount
          );
    
          // Take the top 5 songs
          const PopularSongs = sortedSongs.slice(0, 5);
    
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
          const formattedArtists = artists.map((artist: any, index: number) => ({
            id: (index + 1).toString(),
            name: artist.name,
            profileURI: artist.profileURI,

          }));
    
          // Take the top 5 artists
          const popularArtists = formattedArtists.slice(0, 5);
    
          setPopularArtists(popularArtists);
          console.log("Fetched artists completed successfully"); 
        } catch (error) {
          console.error("Error fetching artists:", error);
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
            <Link href="/profile" passHref>
              <IconButton
                isRound={true}
                size='lg'
                aria-label="Profile"
                icon={<CgProfile />}
                variant="outline"
                ml={4}
                colorScheme="white"
              />
            </Link>
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
                    <Skeleton isLoaded={!loading}>
                      <Img src={song.cover} alt={song.title} />
                      <Box position="absolute" top="0" left="0" right="0" bottom="0" bg="blackAlpha.600" opacity="0" transition="all 0.3s" _groupHover={{ opacity: 1 }}>
                        <Icon as={FaPlay} position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" boxSize={12} color="green.500" />
                      </Box>
                      </Skeleton>
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
                      w="150px"  
                      h="150px"
                      boxShadow="md"
                      mb={2}
                    >
                    <Skeleton isLoaded={!loading}>
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
                      </Skeleton>
                    </Box>
                    <Text fontWeight="semibold" fontSize="sm">{artist.name}</Text>
                  </VStack>
                ))}
              </SimpleGrid>
            </Box>
           
              <Box position="fixed" bottom={0} left={0} right={0}>
                <Player 
                  audioUrl={currentSong?.audioUrl || ""} 
                  title={message ? message : currentSong?.title || ""} 
                  artist={currentSong?.artist || ""} 
                  cover={currentSong?.cover ||"https://via.placeholder.com/300"}
                />
              </Box>
         
          </>
        ) : (
          <Heading>Please connect your wallet</Heading>
        )}
      </Box> 
    )
}