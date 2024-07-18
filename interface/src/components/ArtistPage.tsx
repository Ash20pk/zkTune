'use client';

import React, { useEffect, useState } from 'react';
import { Box, Flex, Heading, Text, VStack, HStack, SimpleGrid, Image, Button, Skeleton, Icon, Tabs, TabList, TabPanels, Tab, TabPanel } from "@chakra-ui/react";
import { FaPlay, FaHeart, FaClock } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { Contract } from 'zksync-ethers';
import { zkTunecontractconfig } from './contract';
import { useEthereum } from './Context';


interface Song {
    id: string;
    title: string;
    artist: string;
    cover: string;
    audioUrl: string;
    source: string;
    streamCount: number;
    contractAddress: string;
  }

interface Artist {
    name: string;
    profileURI: string;
}


interface ArtistPageProps {
  artistId: string;
}

export function ArtistPage({ artistId }: ArtistPageProps) {
  const router = useRouter();
  const [artist, setArtist] = useState<Artist>();
  const [isLoading, setIsLoading] = useState(true);
  const [artistSongs, setArtistSongs] = useState<Song[]>([]);
  const [artistAddress, setArtistAddress] = useState("");
  const {account, getProvider} = useEthereum();

  useEffect(() => {
    // Fetch artist data, top songs, and albums
    const fetchArtistData = async () => {
      setIsLoading(true);
      try {
        const provider = await getProvider();
        const contract = new Contract(zkTunecontractconfig.address, zkTunecontractconfig.abi, provider);
        const artistData = await contract.artistID(Number(artistId));
        const artistAddress = await contract.artistAddresses(Number(artistId) - 1);
        const artistSongs = await contract.getSongsByArtist(artistAddress);
        const formattedSongs = await Promise.all(artistSongs.map(async (song: any) => ({
            id: song[0].toString(),
            title: song[2],
            artist: (await contract.artists(song[1]))[0],
            cover: song[4],
            audioUrl: song[3],
            source: 'contract',
            streamCount: song[5],
            contractAddress: song[6]
          })));
        
        setArtistSongs(formattedSongs);
        setArtistAddress(artistAddress);
        setArtist({name: artistData[0], profileURI: artistData[1]});
      } catch (error) {
        console.error("Error fetching artist data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArtistData();
  }, [artistId]);

  if (isLoading) {
    return <Skeleton height="100vh" />;
  }

  return (
    <Box bg="gray.900" color="white" minH="100vh" p={8}>
      <Flex direction="column">
        {/* Artist Header */}
        <Flex align="center" mb={8}>
          <Image 
            src={artist?.profileURI} 
            alt={artist?.name}
            boxSize="240px"
            objectFit="cover"
            mr={6}
          />
          <VStack align="flex-start" spacing={2}>
            <Heading size="3xl">{artist?.name}</Heading>
          </VStack>
        </Flex>

        {/* Play and Follow buttons */}
        <HStack spacing={4} mb={8}>
          <Button leftIcon={<FaPlay />} colorScheme="green" size="lg" borderRadius="full">
            Play
          </Button>
        </HStack>

        {/* Songs */}
        <Box mb={12}>
          <Heading size="lg" mb={4}>Popular</Heading>
          <VStack align="stretch" spacing={2}>
            {artistSongs.slice(0, 5).map((song, index) => (
              <HStack key={song.id} p={2} _hover={{ bg: "gray.700" }} borderRadius="md">
                <Text width="24px">{index + 1}</Text>
                <Image src={song.cover} alt={song.title} boxSize="40px" mr={4} />
                <Text flex={1}>{song.title}</Text>
                <Text color="gray.400">{song.streamCount.toLocaleString()} plays</Text>
              </HStack>
            ))}
          </VStack>
        </Box>
      </Flex>
    </Box>
  );
}