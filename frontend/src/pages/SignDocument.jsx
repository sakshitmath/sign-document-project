import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import API from '../services/api'

export default function SignDocument() {
  const { documentId } = useParams()
  const [signatures, setSignatures] = useState([])
  const [saving, setSaving] = useState(false)
  const containerRef = useRef(null)
  const navigate = useNavigate()

  const handleClick = (e) => {
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setSignatures([...signatures, { x, y, page: 1 }])
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      for (const sig of signatures) {
        await API.post('/signatures', {
          documentId: parseInt(documentId),
          x: sig.x,
          y: sig.y,
          page: sig.page,
        })
      }
      alert('Signatures saved successfully!')
      navigate('/dashboard')
    } catch (err) {
      alert('Failed to save signatures')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">DocSign</h1>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-600 hover:text-blue-600"
        >
          ← Back to Dashboard
        </button>
      </nav>

      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-xl shadow p-6 mb-4">
          <h2 className="text-lg font-semibold mb-2">
            Place Your Signature
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            Click anywhere on the document area below to place a signature
          </p>

          {/* Signature placement area */}
          <div
            ref={containerRef}
            onClick={handleClick}
            className="relative border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 cursor-crosshair"
            style={{ height: '500px' }}
          >
            <p className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-300 text-lg select-none">
              Click to place signature
            </p>

            {signatures.map((sig, index) => (
              <div
                key={index}
                className="absolute bg-yellow-300 border-2 border-yellow-500 rounded px-3 py-1 text-sm font-semibold cursor-move select-none"
                style={{
                  left: sig.x,
                  top: sig.y,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                ✍️ Signature {index + 1}
              </div>
            ))}
          </div>

          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setSignatures([])}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear All
            </button>
            <button
              onClick={handleSave}
              disabled={saving || signatures.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Signatures'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold mb-2">Placed Signatures</h3>
          {signatures.length === 0 ? (
            <p className="text-gray-500 text-sm">No signatures placed yet.</p>
          ) : (
            <ul className="space-y-2">
              {signatures.map((sig, index) => (
                <li key={index} className="text-sm text-gray-600">
                  Signature {index + 1} → X: {Math.round(sig.x)}, Y: {Math.round(sig.y)}, Page: {sig.page}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}