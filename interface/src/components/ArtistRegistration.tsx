import { useState } from 'react'

export function ArtistRegistration() {
  const [name, setName] = useState('')
  const [profileURI, setProfileURI] = useState('')

  const handleSubmit = (e: any) => {
    e.preventDefault()
    // Implement contract interaction here
    console.log('Register artist:', { name, profileURI })
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Register as an Artist</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block mb-1">Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-800 rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label htmlFor="profileURI" className="block mb-1">Profile URI</label>
          <input
            type="text"
            id="profileURI"
            value={profileURI}
            onChange={(e) => setProfileURI(e.target.value)}
            className="w-full bg-gray-800 rounded px-3 py-2"
            required
          />
        </div>
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          Register
        </button>
      </form>
    </div>
  )
}