// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./SongNFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ZkTune is Ownable {
    struct Artist {
        string name;
        string profileURI;
    }

    struct Song {
        uint256 id;
        address artist;
        string title;
        string audioURI;
        string coverURI;
        uint256 streamCount;
        address songNFTAddress;
    }

    struct Playlist {
        string name;
        uint256[] songIds;
    }

    mapping(address => Artist) public artists;
    mapping(uint256 => Song) public songs;
    mapping(uint256 => mapping(address => bool)) public userHasNFT;
    mapping(address => mapping(string => Playlist)) public playlists;
    mapping(address => string[]) public userPlaylistNames;

    address[] public artistAddresses;
    uint256[] public songIds;
    uint256 private _currentSongId;

    event ArtistRegistered(address indexed artistAddress, string name);
    event SongAdded(uint256 indexed songId, address indexed artist, string title);
    event SongStreamed(uint256 indexed songId, address indexed listener);
    event PlaylistCreated(address indexed creator, string name);
    event SongAddedToPlaylist(address indexed creator, string playlistName, uint256 songId);

    constructor() {
        _currentSongId = 0;
    }

    modifier onlyRegisteredArtist() {
        require(bytes(artists[msg.sender].name).length > 0, "Artist not registered");
        _;
    }

    modifier songExists(uint256 _songId) {
        require(songs[_songId].id != 0, "Song does not exist");
        _;
    }

    modifier playlistExists(address _creator, string memory _name) {
        require(playlists[_creator][_name].songIds.length > 0, "Playlist does not exist");
        _;
    }

    function registerArtist(string memory _name, string memory _profileURI) external {
        require(bytes(artists[msg.sender].name).length == 0, "Artist already registered");
        artists[msg.sender] = Artist(_name, _profileURI);
        artistAddresses.push(msg.sender);
        emit ArtistRegistered(msg.sender, _name);
    }

    function addSong(string memory _title, string memory _audioURI, string memory _coverURI, uint256 _nftPrice) external onlyRegisteredArtist {
        _currentSongId++;
        uint256 newSongId = _currentSongId;

        // Deploy a new SongNFT contract
        SongNFT songNFT = new SongNFT(_title, "ZKT", _nftPrice, _audioURI, msg.sender, _coverURI);

        songs[newSongId] = Song(newSongId, msg.sender, _title, _audioURI, _coverURI, 0, address(songNFT));
        songIds.push(newSongId);

        emit SongAdded(newSongId, msg.sender, _title);
    }

    function streamSong(uint256 _songId) external payable songExists(_songId) returns (string memory) {
        Song storage song = songs[_songId];
        SongNFT songNFT = SongNFT(song.songNFTAddress);

        if (userHasNFT[_songId][msg.sender]) {
            // User already owns the NFT, return the audio URI
            return song.audioURI;
        } else {
            // Mint a new NFT for the user
            songNFT.mintNFT{value: msg.value}(msg.sender);
            userHasNFT[_songId][msg.sender] = true;

            // Increment stream count
            song.streamCount++;
            emit SongStreamed(_songId, msg.sender);

            // Return the audio URI
            return song.audioURI;
        }
    }

    function createPlaylist(string memory _name) external {
        require(playlists[msg.sender][_name].songIds.length == 0, "Playlist already exists");
        playlists[msg.sender][_name] = Playlist(_name, new uint256[](0));
        userPlaylistNames[msg.sender].push(_name);
        emit PlaylistCreated(msg.sender, _name);
    }

    function addSongToPlaylist(string memory _playlistName, uint256 _songId) external songExists(_songId) playlistExists(msg.sender, _playlistName) {
        playlists[msg.sender][_playlistName].songIds.push(_songId);
        emit SongAddedToPlaylist(msg.sender, _playlistName, _songId);
    }

    function getPlaylist(address _user, string memory _playlistName) external view returns (uint256[] memory) {
        return playlists[_user][_playlistName].songIds;
    }

    function getUserPlaylists(address _user) external view returns (Playlist[] memory) {
        string[] storage playlistNames = userPlaylistNames[_user];
        Playlist[] memory userPlaylists = new Playlist[](playlistNames.length);
        for (uint256 i = 0; i < playlistNames.length; i++) {
            userPlaylists[i] = playlists[_user][playlistNames[i]];
        }
        return userPlaylists;
    }

    function getAllSongs() external view returns (Song[] memory) {
        Song[] memory allSongs = new Song[](songIds.length);
        for (uint256 i = 0; i < songIds.length; i++) {
            allSongs[i] = songs[songIds[i]];
        }
        return allSongs;
    }

    function getAllArtists() external view returns (Artist[] memory) {
        Artist[] memory allArtists = new Artist[](artistAddresses.length);
        for (uint256 i = 0; i < artistAddresses.length; i++) {
            allArtists[i] = artists[artistAddresses[i]];
        }
        return allArtists;
    }

    function getAllPlaylists() external view returns (Playlist[] memory) {
        uint256 totalPlaylists = 0;
        for (uint256 i = 0; i < artistAddresses.length; i++) {
            totalPlaylists += userPlaylistNames[artistAddresses[i]].length;
        }

        Playlist[] memory allPlaylists = new Playlist[](totalPlaylists);
        uint256 index = 0;
        for (uint256 i = 0; i < artistAddresses.length; i++) {
            string[] storage playlistNames = userPlaylistNames[artistAddresses[i]];
            for (uint256 j = 0; j < playlistNames.length; j++) {
                allPlaylists[index] = playlists[artistAddresses[i]][playlistNames[j]];
                index++;
            }
        }
        return allPlaylists;
    }
}
