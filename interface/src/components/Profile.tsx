'use client';

import React, { useEffect, useState } from 'react';
import { Box, Flex, Heading, Text, HStack, SimpleGrid, Image, Button, Skeleton, Icon, Tabs, TabList, TabPanels, Tab, TabPanel, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, useDisclosure, Input, VStack, FormControl, FormLabel, InputGroup } from "@chakra-ui/react";
import { useProfileData } from './fetchProfile';
import { useRouter } from 'next/navigation';
import { FaPlay, FaArrowLeft, FaUser, FaHeadphones, FaPlus } from 'react-icons/fa';
import { useIPFS } from './uploadIPFS'; 

// Define the Song type
interface Song {
  id: string;
  title: string;
  artist?: string;
  cover: string;
  streamCount?: number;
}

// Define props for SongGrid component
interface SongGridProps {
  songs: Song[];
  title: string;
  onAddSong?: () => void; 
}

const SongGrid: React.FC<SongGridProps> = ({ songs, title, onAddSong }) => (
  <Box>
    <Heading size="lg" mb={6}>{title}</Heading>
    <SimpleGrid columns={[2, 3, 4, 5]} spacing={6}>
      {songs.map((song) => (
        <Box key={song.id} bg="gray.800" borderRadius="lg" overflow="hidden" transition="all 0.3s" _hover={{ transform: "scale(1.05)" }}>
          <Box position="relative">
            <Image src={song.cover} alt={song.title} />
            <Box 
              position="absolute" 
              top="0" 
              left="0" 
              right="0" 
              bottom="0" 
              bg="blackAlpha.600" 
              opacity="0" 
              transition="all 0.3s" 
              _groupHover={{ opacity: 1 }} 
              display="flex" 
              alignItems="center" 
              justifyContent="center"
            >
              <Icon as={FaPlay} color="white" boxSize={8} />
            </Box>
          </Box>
          <Box p={4}>
            <Text fontWeight="semibold" isTruncated>{song.title}</Text>
            <Text fontSize="sm" color="gray.400" isTruncated>{song.artist || `Stream Count: ${song.streamCount}`}</Text>
          </Box>
        </Box>
      ))}
      {onAddSong && (
        <Box 
          bg="gray.800" 
          borderRadius="lg" 
          overflow="hidden" 
          transition="all 0.3s" 
          _hover={{ transform: "scale(1.05)", cursor: "pointer" }}
          onClick={onAddSong}
          display="flex"
          alignItems="center"
          justifyContent="center"
          height="100%"
        >
          <Icon as={FaPlus} color="white" boxSize={12} />
        </Box>
      )}
    </SimpleGrid>
  </Box>
);

export function Profile() {
  const router = useRouter();
  const { isLoading, isArtist, artistInfo, artistSongs, streamedNFTs, totalStreams, error } = useProfileData();
  const [isMounted, setIsMounted] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newSong, setNewSong] = useState({ title: '', audioFile: null, coverFile: null });
  const { uploadToIPFS, isUploading, error: uploadError } = useIPFS();



  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'audio' | 'cover') => {
    if (event.target.files && event.target.files[0]) {
      setNewSong({ ...newSong, [`${type}File`]: event.target.files[0] });
    }
  };

  const handleAddSong = async () => {
    if (!newSong.title || !newSong.audioFile || !newSong.coverFile) {
      alert('Please fill in all fields and upload both audio and cover image.');
      return;
    }

    try {
      const audioUrl = await uploadToIPFS(newSong.audioFile);
      const coverUrl = await uploadToIPFS(newSong.coverFile);

      // Here, you would typically call a function to add the song to your contract
      console.log('Adding new song:', {
        title: newSong.title,
        audioUrl,
        coverUrl
      });

      // After adding, you might want to refresh the list of songs
      onClose();
      setNewSong({ title: '', audioFile: null, coverFile: null });
    } catch (error) {
      console.error('Error adding song:', error);
      alert('An error occurred while adding the song. Please try again.');
    } finally {
    }
  };

  const handleBackClick = () => {
    if (isMounted) {
      router.push('/')
    }
  }

  if (!isMounted) {
    return null 
  }

  if (error) return <Text color="red.500">{error}</Text>;

  return (
    <Box flex="1" bg="gray.900" color="white" overflowY="auto" minH="100vh">
      <Box 
        bg="gray.900"
      >
        <Skeleton isLoaded={!isLoading}>
        </Skeleton>
        <Flex alignItems="center" mt={8}>
          <Box 
            position="relative" 
            borderRadius="full" 
            overflow="hidden"
            w="150px"  
            h="150px"
            boxShadow="lg"
            mr={8}
          >
          <Skeleton isLoaded={!isLoading}>
            <Image 
              src={isArtist ? artistInfo?.profileURI : "https://via.placeholder.com/200"}
              alt={isArtist ? artistInfo?.name : "User"}
              objectFit="cover"
              w="100%"
              h="100%"
            />
            </Skeleton>
          </Box>
          <Skeleton isLoaded={!isLoading}>
            <Heading size="4xl" mb={2}>{isArtist ? artistInfo?.name : "Music Lover"}</Heading>
            <HStack>
            <Box>
            <Text fontSize='s'>{isArtist ? `${artistSongs.length} songs •` : `${streamedNFTs.length} streamed NFTs •`}</Text>
            </Box>
            <Box>
            <Text fontSize='s'>{isArtist && `${totalStreams} listeners`}</Text>
            </Box>
            </HStack>
            </Skeleton>
        </Flex>
      </Box>
      
      <Box p={8}>
      <Skeleton isLoaded={!isLoading}>
        <Tabs colorScheme="green" mb={8}>
          <TabList>
            <Tab><Icon as={FaHeadphones} mr={2} /> Streamed Songs</Tab>
            {isArtist && <Tab><Icon as={FaUser} mr={2} /> Your Songs</Tab>}
          </TabList>
          <TabPanels>
            <TabPanel>
            <Skeleton isLoaded={!isLoading}>
              <SongGrid songs={streamedNFTs} title="Streamed Songs" />
              </Skeleton>
            </TabPanel>
            {isArtist && (
              <TabPanel>
                <Skeleton isLoaded={!isLoading}>
                <SongGrid songs={artistSongs} title="Your Songs" onAddSong={onOpen} />
                </Skeleton>
              </TabPanel>
            )}
          </TabPanels>
        </Tabs>
        </Skeleton>
      </Box>
      <Modal isOpen={isOpen} onClose={onClose}>
    <ModalOverlay />
    <ModalContent bg="gray.800" color="white">
      <ModalHeader>Add New Song</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <VStack spacing={4}>
          <FormControl>
            <FormLabel>Song Title</FormLabel>
            <Input 
              placeholder="Song Title" 
              value={newSong.title}
              onChange={(e) => setNewSong({...newSong, title: e.target.value})}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Audio File</FormLabel>
           
            <Input 
              type="file" 
              accept="audio/*"
              onChange={(e) => handleFileChange(e, 'audio')}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Cover Image</FormLabel>
            <Input 
              type="file" 
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'cover')}
            />
          </FormControl>
        </VStack>
      </ModalBody>

      <ModalFooter justifyContent="center">
        <Button colorScheme="blue" mr={3} onClick={handleAddSong} isLoading={isUploading} variant="outline">
          Add Song
        </Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
    </Box>
  );
}