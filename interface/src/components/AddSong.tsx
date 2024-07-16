import { useState } from 'react'

export function AddSong() {
  const [title, setTitle] = useState('')
  const [audioURI, setAudioURI] = useState('')
  const [nftPrice, setNftPrice] = useState('')

  const handleSubmit = (e: any) => {
    e.preventDefault()
    // Implement contract interaction here
    console.log('Add song:', { title, audioURI, nftPrice })
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Add a New Song</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block mb-1">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-gray-800 rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label htmlFor="audioURI" className="block mb-1">Audio URI</label>
          <input
            type="text"
            id="audioURI"
            value={audioURI}
            onChange={(e) => setAudioURI(e.target.value)}
            className="w-full bg-gray-800 rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label htmlFor="nftPrice" className="block mb-1">NFT Price</label>
          <input
            type="number"
            id="nftPrice"
            value={nftPrice}
            onChange={(e) => setNftPrice(e.target.value)}
            className="w-full bg-gray-800 rounded px-3 py-2"
            required
          />
        </div>
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          Add Song
        </button>
      </form>
    </div>
  )
}