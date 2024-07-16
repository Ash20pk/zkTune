'use client';

import React, { useEffect, useState } from 'react';
import { Box, Heading, Text, VStack, SimpleGrid, Image, Button, Spinner } from "@chakra-ui/react";
import { Contract } from 'zksync-ethers';
import { useEthereum } from './Context';
import { zkTunecontractconfig } from './contract';
import SongNFTABI from "../ABI/SongNFT.json";
import { useRouter } from 'next/navigation';

interface Artist {
  name: string;
  profileURI: string;
}

interface Song {
  id: string;
  title: string;
  artist: string;
  cover: string;
  audioUrl: string;
  streamCount: number;
  contractAddress: string;
}

export function Profile() {
  const router = useRouter();
  const { account, getSigner } = useEthereum();
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true);
  const [isArtist, setIsArtist] = useState(false);
  const [artistInfo, setArtistInfo] = useState<Artist | null>(null);
  const [artistSongs, setArtistSongs] = useState<Song[]>([]);
  const [streamedNFTs, setStreamedNFTs] = useState<Song[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!account.address) {
        setError("Please connect your wallet");
        setIsLoading(false);
        return;
      }

      try {
        const signer = await getSigner();
        const contract = new Contract(zkTunecontractconfig.address, zkTunecontractconfig.abi, signer);

        // Check if user is an artist
        const artistData = await contract.artists(account.address);
        if (artistData[0] !== '') {
          setIsArtist(true);
          setArtistInfo({ name: artistData[0], profileURI: artistData[1] });

          // Fetch artist's songs
          const songCount = await contract.getSongCount();
          const songs = [];
          for (let i = 1; i <= songCount; i++) {
            const song = await contract.songs(i);
            if (song.artist === account.address) {
              const SongNFTContract = new Contract(song.contractAddress, SongNFTABI.abi, signer);
              const songInfo = await SongNFTContract.getInfo(account.address);
              songs.push({
                id: i.toString(),
                title: song.title,
                artist: artistData[0],
                cover: songInfo[3],
                audioUrl: songInfo[2],
                streamCount: song.streamCount.toNumber(),
                contractAddress: song.contractAddress
              });
            }
          }
          setArtistSongs(songs);
        } else {
          // Fetch streamed NFTs for non-artists
          const streamedNFTs = await contract.getUserStreamedNFTs(account.address);
          const nfts = await Promise.all(streamedNFTs.map(async (nftAddress: string) => {
            const SongNFTContract = new Contract(nftAddress, SongNFTABI.abi, signer);
            const songInfo = await SongNFTContract.getInfo(account.address);
            return {
              id: songInfo[0].toString(),
              title: await SongNFTContract.name(),
              artist: songInfo[1],
              cover: songInfo[3],
              audioUrl: songInfo[2],
              streamCount: 0,
              contractAddress: nftAddress
            };
          }));
          setStreamedNFTs(nfts);
        }
      } catch (err) {
        setError("Failed to load profile data");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [account.address, getSigner]);

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleBackClick = () => {
    if (isMounted) {
      router.push('/')
    }
  }

  if (!isMounted) {
    return null 
  }

  if (isLoading) return <Spinner />;
  if (error) return <Text color="red.500">{error}</Text>;

  return (
    <Box flex="1" bg="gray.900" color="white" overflowY="auto" p={8}>
      <Button onClick={handleBackClick} mb={4}>Back to Home</Button>
      <Heading mb={8}>Profile</Heading>
      
      {isArtist ? (
        <VStack align="start" spacing={8}>
          <Box>
            <Heading size="md" mb={2}>Artist Information</Heading>
            <Text>Name: {artistInfo?.name}</Text>
            <Text>Profile URI: {artistInfo?.profileURI}</Text>
          </Box>
          <Box>
            <Heading size="md" mb={4}>Your Songs</Heading>
            <SimpleGrid columns={4} spacing={6}>
              {artistSongs.map((song) => (
                <Box key={song.id} bg="gray.800" borderRadius="lg" overflow="hidden">
                  <Image src={song.cover} alt={song.title} />
                  <Box p={4}>
                    <Text fontWeight="semibold">{song.title}</Text>
                    <Text fontSize="sm" color="gray.400">Stream Count: {song.streamCount}</Text>
                  </Box>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        </VStack>
      ) : (
        <VStack align="start" spacing={8}>
          <Text>You are not registered as an artist.</Text>
          <Box>
            <Heading size="md" mb={4}>Your Streamed NFTs</Heading>
            <SimpleGrid columns={4} spacing={6}>
              {streamedNFTs.map((nft) => (
                <Box key={nft.id} bg="gray.800" borderRadius="lg" overflow="hidden">
                  <Image src={nft.cover} alt={nft.title} />
                  <Box p={4}>
                    <Text fontWeight="semibold">{nft.title}</Text>
                    <Text fontSize="sm" color="gray.400">{nft.artist}</Text>
                  </Box>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        </VStack>
      )}
    </Box>
  );
}