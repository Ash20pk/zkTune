import { useState } from 'react'

export function PlaylistCreator() {
  const [playlistName, setPlaylistName] = useState('')

  const handleSubmit = (e: any) => {
    e.preventDefault()
    // Implement contract interaction here
    console.log('Create playlist:', playlistName)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Create Playlist</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="playlistName" className="block mb-1">Playlist Name</label>
          <input
            type="text"
            id="playlistName"
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            className="w-full bg-gray-800 rounded px-3 py-2"
            required
          />
        </div>
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          Create Playlist
        </button>
      </form>
    </div>
  )
}