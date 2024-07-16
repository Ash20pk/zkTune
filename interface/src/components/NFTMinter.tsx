import { useState } from 'react'

export function NFTMinter() {
  const [songId, setSongId] = useState('')

  const handleSubmit = (e: any) => {
    e.preventDefault()
    // Implement contract interaction here
    console.log('Mint NFT for song:', songId)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Mint NFT</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="songId" className="block mb-1">Song ID</label>
          <input
            type="number"
            id="songId"
            value={songId}
            onChange={(e) => setSongId(e.target.value)}
            className="w-full bg-gray-800 rounded px-3 py-2"
            required
          />
        </div>
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          Mint NFT
        </button>
      </form>
    </div>
  )
}