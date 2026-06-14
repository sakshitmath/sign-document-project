import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'

export default function Dashboard() {
  const [documents, setDocuments] = useState([])
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const navigate = useNavigate()
  const name = localStorage.getItem('name')

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const res = await API.get('/documents/my')
      setDocuments(res.data)
    } catch (err) {
      console.error('Failed to fetch documents')
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    setUploading(true)
    try {
      await API.post('/documents/upload', formData)
      setFile(null)
      fetchDocuments()
    } catch (err) {
      console.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">DocSign</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">Hello, {name}!</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Upload Document</h2>
          <form onSubmit={handleUpload} className="flex gap-4 items-center">
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files[0])}
              className="flex-1 border p-2 rounded-lg"
            />
            <button
              type="submit"
              disabled={uploading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">My Documents</h2>
          {documents.length === 0 ? (
            <p className="text-gray-500">No documents uploaded yet.</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-2">File Name</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Uploaded At</th>
<th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b hover:bg-gray-50">
                    <td className="py-2">{doc.fileName}</td>
                    <td className="py-2">
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-sm">
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-2">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => navigate(`/sign/${doc.id}`)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        Sign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}