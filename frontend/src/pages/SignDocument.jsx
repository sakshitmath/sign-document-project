import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Document as PDFDocument, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import API from '../services/api'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const SIGNATURE_FONTS = [
  { name: 'Cursive 1', style: { fontFamily: 'Dancing Script, cursive', fontSize: '28px', fontWeight: '600' } },
  { name: 'Cursive 2', style: { fontFamily: 'Brush Script MT, cursive', fontSize: '32px' } },
  { name: 'Italic Serif', style: { fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '28px' } },
  { name: 'Bold Sans', style: { fontFamily: 'Arial, sans-serif', fontWeight: 'bold', fontSize: '28px' } },
  { name: 'Thin Elegant', style: { fontFamily: 'Palatino Linotype, serif', fontStyle: 'italic', fontSize: '30px', fontWeight: '300' } },
  { name: 'Classic', style: { fontFamily: 'Times New Roman, serif', fontSize: '28px' } },
  { name: 'Modern', style: { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '26px', letterSpacing: '2px' } },
  { name: 'Script', style: { fontFamily: 'Segoe Script, cursive', fontSize: '28px' } },
]

const COLORS = ['#000000', '#e53e3e', '#3182ce', '#38a169']

export default function SignDocument() {
  const { documentId } = useParams()
  const navigate = useNavigate()
  const containerRef = useRef(null)

  const [step, setStep] = useState('setup')
  const [fullName, setFullName] = useState('')
  const [initials, setInitials] = useState('')
  const [selectedFont, setSelectedFont] = useState(0)
  const [selectedColor, setSelectedColor] = useState('#000000')
  const [activeTab, setActiveTab] = useState('signature')
  const [placedSignatures, setPlacedSignatures] = useState([])
  const [saving, setSaving] = useState(false)
  const [numPages, setNumPages] = useState(null)
  const pdfUrl = `http://localhost:8081/api/documents/download/${documentId}`

  const [dragInfo, setDragInfo] = useState(null)
  const [resizeInfo, setResizeInfo] = useState(null)

  const getSignatureText = () => {
    if (activeTab === 'signature') return fullName
    if (activeTab === 'initials') return initials
    if (activeTab === 'stamp') return `[${fullName.toUpperCase()}]`
    return fullName
  }

  const handleApply = () => {
    if (!fullName) { alert('Please enter your full name!'); return }
    setStep('place')
  }

  const handleContainerClick = (e) => {
    if (dragInfo || resizeInfo) return
    if (e.target.classList.contains('sig-box') || e.target.classList.contains('resize-handle')) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setPlacedSignatures(prev => [...prev, {
      x, y,
      text: getSignatureText(),
      font: selectedFont,
      color: selectedColor,
      page: 1,
      width: 180,
      height: 60,
    }])
  }

  const handleMouseMove = (e) => {
    if (dragInfo !== null) {
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left - dragInfo.offsetX
      const y = e.clientY - rect.top - dragInfo.offsetY
      setPlacedSignatures(prev => prev.map((s, i) =>
        i === dragInfo.index ? { ...s, x, y } : s
      ))
    }
    if (resizeInfo !== null) {
      const rect = containerRef.current.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      setPlacedSignatures(prev => prev.map((s, i) => {
        if (i !== resizeInfo.index) return s
        return {
          ...s,
          width: Math.max(80, mouseX - s.x + s.width / 2),
          height: Math.max(30, mouseY - s.y + s.height / 2),
        }
      }))
    }
  }

  const handleMouseUp = () => {
    setDragInfo(null)
    setResizeInfo(null)
  }

  const handleSave = async () => {
    if (placedSignatures.length === 0) { alert('Please place at least one signature!'); return }
    setSaving(true)
    try {
      for (const sig of placedSignatures) {
        await API.post('/signatures', {
          documentId: parseInt(documentId),
          x: sig.x,
          y: sig.y,
          page: sig.page,
          signatureText: sig.text,
        })
      }
      await API.post(`/signatures/finalize/${documentId}`)
      alert('Document signed successfully!')
      navigate('/dashboard')
    } catch (err) {
      alert('Error saving signatures!')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">DocSign</h1>
        <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-blue-600">
          ← Back to Dashboard
        </button>
      </nav>

      {step === 'setup' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Set your signature details</h2>
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Full name:</label>
                <input type="text" placeholder="Your name" value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border rounded-lg p-3" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Initials:</label>
                <input type="text" placeholder="Your initials" value={initials}
                  onChange={(e) => setInitials(e.target.value)}
                  className="w-full border rounded-lg p-3" />
              </div>
            </div>
            <div className="flex gap-4 mb-4 border-b">
              {['signature', 'initials', 'stamp'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`pb-2 px-2 capitalize font-medium ${activeTab === tab ? 'border-b-2 border-red-500 text-red-500' : 'text-gray-500'}`}>
                  {tab}
                </button>
              ))}
            </div>
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {SIGNATURE_FONTS.map((font, index) => (
                <div key={index} onClick={() => setSelectedFont(index)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${selectedFont === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedFont === index ? 'border-blue-500' : 'border-gray-300'}`}>
                    {selectedFont === index && <div className="w-3 h-3 rounded-full bg-blue-500" />}
                  </div>
                  <span style={{ ...font.style, color: selectedColor }}>
                    {activeTab === 'initials' ? (initials || 'Initials') : (fullName || 'Signature')}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-sm font-medium">Color:</span>
              {COLORS.map(color => (
                <button key={color} onClick={() => setSelectedColor(color)}
                  className={`w-7 h-7 rounded-full border-2 ${selectedColor === color ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: color }} />
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => navigate('/dashboard')} className="px-6 py-2 border rounded-lg">Cancel</button>
              <button onClick={handleApply} className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Apply</button>
            </div>
          </div>
        </div>
      )}

      {step === 'place' && (
        <div className="flex" style={{ height: 'calc(100vh - 64px)' }}>
          <div className="flex-1 overflow-auto p-4 bg-gray-200">
            <p className="text-center text-gray-500 mb-2 text-sm">Click to place signature. Drag to move. Drag blue corner to resize.</p>
            <div
              ref={containerRef}
              onClick={handleContainerClick}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="relative bg-white mx-auto shadow-lg"
              style={{ width: '794px', minHeight: '1123px', cursor: 'crosshair' }}
            >
              <PDFDocument
                file={pdfUrl}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              >
                {Array.from(new Array(numPages), (_, i) => (
                  <Page key={i + 1} pageNumber={i + 1} width={794} />
                ))}
              </PDFDocument>

              {placedSignatures.map((sig, index) => (
                <div
                  key={index}
                  className="sig-box absolute border-2 border-dashed border-blue-500 rounded"
                  style={{
                    left: sig.x - sig.width / 2,
                    top: sig.y - sig.height / 2,
                    width: sig.width,
                    height: sig.height,
                    cursor: 'move',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    userSelect: 'none',
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    const rect = containerRef.current.getBoundingClientRect()
                    setDragInfo({
                      index,
                      offsetX: e.clientX - rect.left - sig.x,
                      offsetY: e.clientY - rect.top - sig.y,
                    })
                  }}
                >
                  <span style={{ ...SIGNATURE_FONTS[sig.font].style, color: sig.color, pointerEvents: 'none' }}>
                    {sig.text}
                  </span>
                  <div
                    className="resize-handle absolute bottom-0 right-0 w-5 h-5 bg-blue-500 cursor-se-resize"
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      setResizeInfo({ index })
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="w-64 bg-white shadow-lg p-4 flex flex-col gap-4">
            <h3 className="font-bold text-lg">Signing options</h3>
            <div className="border rounded-lg p-3 bg-gray-50">
              <p className="text-xs text-gray-500 mb-1">Your signature:</p>
              <p style={{ ...SIGNATURE_FONTS[selectedFont].style, color: selectedColor }}>{fullName}</p>
            </div>
            <button onClick={() => setStep('setup')} className="border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50">
              ✏️ Change Signature
            </button>
            <button onClick={() => setPlacedSignatures([])} className="border border-red-300 text-red-500 rounded-lg py-2 text-sm hover:bg-red-50">
              🗑️ Clear All
            </button>
            <button onClick={handleSave} disabled={saving || placedSignatures.length === 0}
              className="bg-red-500 text-white rounded-lg py-3 font-semibold hover:bg-red-600 disabled:opacity-50 mt-auto">
              {saving ? 'Signing...' : 'Sign ➜'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}