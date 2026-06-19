import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Document as PDFDocument, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import API from '../services/api'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const FONTS = [
  { style: { fontFamily: 'Dancing Script, cursive', fontSize: '24px', fontWeight: '600' } },
  { style: { fontFamily: 'Brush Script MT, cursive', fontSize: '28px' } },
  { style: { fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '24px' } },
  { style: { fontFamily: 'Arial, sans-serif', fontWeight: 'bold', fontSize: '24px' } },
  { style: { fontFamily: 'Times New Roman, serif', fontSize: '24px' } },
  { style: { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '22px' } },
  { style: { fontFamily: 'Palatino Linotype, serif', fontStyle: 'italic', fontSize: '26px' } },
  { style: { fontFamily: 'Segoe Script, cursive', fontSize: '24px' } },
]

const COLORS = ['#000000', '#e53e3e', '#3182ce', '#38a169']

let idCounter = 0
const newId = () => ++idCounter

export default function SignDocument() {
  const { documentId } = useParams()
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const stampInputRef = useRef(null)

  const [step, setStep] = useState('setup')
  const [fullName, setFullName] = useState('')
  const [initials, setInitials] = useState('')
  const [selectedFont, setSelectedFont] = useState(0)
  const [selectedColor, setSelectedColor] = useState('#000000')
  const [activeTab, setActiveTab] = useState('signature')
  const [stampImage, setStampImage] = useState(null)
  const [items, setItems] = useState([])
  const [saving, setSaving] = useState(false)
  const [numPages, setNumPages] = useState(null)
  const pdfUrl = `http://localhost:8081/api/documents/download/${documentId}`

  // Interaction state
  const interactionRef = useRef(null) // { type: 'drag'|'resize'|'sidebar', id, ox, oy, sidebarItem }

  const handleStampUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setStampImage(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleApply = () => {
    if (!fullName) { alert('Please enter your full name!'); return }
    setStep('place')
  }

  const getItemForSidebar = (type) => {
    if (type === 'signature') return { type: 'text', text: fullName, font: selectedFont, color: selectedColor, width: 180, height: 55 }
    if (type === 'name') return { type: 'text', text: fullName, font: 4, color: selectedColor, width: 160, height: 45 }
    if (type === 'date') return { type: 'text', text: new Date().toLocaleDateString('en-IN'), font: 4, color: selectedColor, width: 140, height: 45 }
    if (type === 'stamp') return { type: 'image', src: stampImage, width: 120, height: 80 }
    return null
  }

  // Sidebar item drag start
  const handleSidebarMouseDown = (e, type) => {
    e.preventDefault()
    const sidebarItem = getItemForSidebar(type)
    if (!sidebarItem) return
    interactionRef.current = { type: 'sidebar', sidebarItem }
  }

  const handleSidebarTextDown = (e, type) => {
    e.preventDefault()
    const text = type === 'text' ? prompt('Enter text:') : null
    if (type === 'text' && !text) return
    const sidebarItem = type === 'text'
      ? { type: 'text', text, font: 4, color: selectedColor, width: 200, height: 45 }
      : getItemForSidebar(type)
    if (!sidebarItem) return
    interactionRef.current = { type: 'sidebar', sidebarItem }
  }

  // Container mouse events
  const handleContainerMouseDown = (e) => {
    if (e.target.closest('.item-box')) return
    // clicking blank area on PDF — place current signature
    if (!interactionRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setItems(prev => [...prev, {
        id: newId(), x, y,
        type: 'text', text: activeTab === 'initials' ? (initials || 'AB') : fullName,
        font: selectedFont, color: selectedColor,
        width: 180, height: 55,
      }])
    }
  }

  const handleContainerMouseMove = (e) => {
    const ref = interactionRef.current
    if (!ref) return
    const rect = containerRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    if (ref.type === 'drag') {
      setItems(prev => prev.map(it => it.id === ref.id
        ? { ...it, x: mouseX - ref.ox, y: mouseY - ref.oy }
        : it
      ))
    } else if (ref.type === 'resize') {
      setItems(prev => prev.map(it => {
        if (it.id !== ref.id) return it
        return {
          ...it,
          width: Math.max(60, mouseX - ref.startX + ref.startW),
          height: Math.max(30, mouseY - ref.startY + ref.startH),
        }
      }))
    }
  }

  const handleContainerMouseUp = (e) => {
    const ref = interactionRef.current
    if (!ref) return
    if (ref.type === 'sidebar') {
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setItems(prev => [...prev, {
        id: newId(),
        x, y,
        page: 1,
        ...ref.sidebarItem,
      }])
    }
    interactionRef.current = null
  }

  // Item drag start
  const handleItemMouseDown = (e, item) => {
    e.stopPropagation()
    const rect = containerRef.current.getBoundingClientRect()
    interactionRef.current = {
      type: 'drag',
      id: item.id,
      ox: e.clientX - rect.left - item.x,
      oy: e.clientY - rect.top - item.y,
    }
  }

  // Resize handle mouse down
  const handleResizeMouseDown = (e, item) => {
    e.stopPropagation()
    const rect = containerRef.current.getBoundingClientRect()
    interactionRef.current = {
      type: 'resize',
      id: item.id,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      startW: item.width,
      startH: item.height,
    }
  }

  const deleteItem = (id) => setItems(prev => prev.filter(it => it.id !== id))

  const handleSave = async () => {
    if (items.length === 0) { alert('Please place at least one signature!'); return }
    setSaving(true)
    try {
      for (const sig of items) {
        await API.post('/signatures', {
          documentId: parseInt(documentId),
          x: sig.x, y: sig.y, page: sig.page || 1,
          signatureText: sig.text || 'stamp',
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
        <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-blue-600">← Back to Dashboard</button>
      </nav>

      {step === 'setup' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Set your signature details</h2>
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Full name:</label>
                <input type="text" placeholder="Your name" value={fullName}
                  onChange={(e) => setFullName(e.target.value)} className="w-full border rounded-lg p-3" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Initials:</label>
                <input type="text" placeholder="AB" value={initials}
                  onChange={(e) => setInitials(e.target.value)} className="w-full border rounded-lg p-3" />
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
            {activeTab === 'stamp' ? (
              <div className="mb-4">
                <input ref={stampInputRef} type="file" accept="image/*" onChange={handleStampUpload} className="hidden" />
                <button onClick={() => stampInputRef.current.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg py-8 text-gray-500 hover:border-blue-400">
                  {stampImage ? '✅ Stamp uploaded! Click to change' : '📁 Click to upload stamp/logo from computer'}
                </button>
                {stampImage && <img src={stampImage} alt="preview" className="max-h-20 mx-auto mt-3 border rounded" />}
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                  {FONTS.map((font, index) => (
                    <div key={index} onClick={() => setSelectedFont(index)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${selectedFont === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedFont === index ? 'border-blue-500' : 'border-gray-300'}`}>
                        {selectedFont === index && <div className="w-3 h-3 rounded-full bg-blue-500" />}
                      </div>
                      <span style={{ ...font.style, color: selectedColor }}>
                        {activeTab === 'initials' ? (initials || 'AB') : (fullName || 'Signature')}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-sm font-medium">Color:</span>
                  {COLORS.map(color => (
                    <button key={color} onClick={() => setSelectedColor(color)}
                      className={`w-7 h-7 rounded-full border-2 ${selectedColor === color ? 'border-gray-800' : 'border-transparent'}`}
                      style={{ backgroundColor: color }} />
                  ))}
                </div>
              </>
            )}
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
            <p className="text-center text-gray-500 mb-2 text-sm">Drag items from right panel onto PDF, or click PDF to place signature directly.</p>
            <div
              ref={containerRef}
              onMouseDown={handleContainerMouseDown}
              onMouseMove={handleContainerMouseMove}
              onMouseUp={handleContainerMouseUp}
              onMouseLeave={() => { interactionRef.current = null }}
              className="relative bg-white mx-auto shadow-lg select-none"
              style={{ width: '794px', minHeight: '1123px', cursor: 'crosshair' }}
            >
              <PDFDocument file={pdfUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
                {Array.from(new Array(numPages), (_, i) => (
                  <Page key={i + 1} pageNumber={i + 1} width={794} />
                ))}
              </PDFDocument>

              {items.map((item) => (
                <div
                  key={item.id}
                  className="item-box absolute border-2 border-dashed border-blue-500 rounded"
                  style={{
                    left: item.x - item.width / 2,
                    top: item.y - item.height / 2,
                    width: item.width,
                    height: item.height,
                    cursor: 'move',
                    background: 'rgba(255,255,255,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseDown={(e) => handleItemMouseDown(e, item)}
                >
                  {item.type === 'image' ? (
                    <img src={item.src} alt="stamp" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
                  ) : (
                    <span style={{
                      ...FONTS[item.font || 0].style,
                      color: item.color,
                      pointerEvents: 'none',
                      fontSize: `${Math.max(10, item.height * 0.45)}px`,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                    }}>
                      {item.text}
                    </span>
                  )}
                  {/* Delete button */}
                  <button
                    onMouseDown={(e) => { e.stopPropagation(); deleteItem(item.id) }}
                    style={{ position: 'absolute', top: -10, right: -10, width: 20, height: 20, borderRadius: '50%', background: '#e53e3e', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
                  >×</button>
                  {/* Resize handle */}
                  <div
                    onMouseDown={(e) => handleResizeMouseDown(e, item)}
                    style={{ position: 'absolute', bottom: -4, right: -4, width: 14, height: 14, background: '#3182ce', cursor: 'se-resize', borderRadius: '3px', zIndex: 10 }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="w-64 bg-white shadow-lg p-4 flex flex-col gap-3 overflow-y-auto">
            <h3 className="font-bold text-lg">Signing options</h3>
            <p className="text-xs text-gray-400">Drag items below onto the PDF</p>

            <div
              draggable
              onMouseDown={(e) => handleSidebarMouseDown(e, 'signature')}
              className="border border-gray-300 rounded-lg p-3 cursor-grab hover:bg-gray-50 text-center"
              style={{ ...FONTS[selectedFont].style, color: selectedColor }}
            >
              {fullName}
            </div>

            <div className="border-t pt-2">
              <p className="text-xs text-gray-500 mb-2 font-medium">Optional fields:</p>
              {[
                { label: '👤 Name', type: 'name' },
                { label: '📅 Date', type: 'date' },
                { label: '📝 Text', type: 'text' },
              ].map(({ label, type }) => (
                <div
                  key={type}
                  onMouseDown={(e) => type === 'text' ? handleSidebarTextDown(e, 'text') : handleSidebarMouseDown(e, type)}
                  className="border border-gray-300 rounded-lg py-2 px-3 mb-2 cursor-grab hover:bg-blue-50 text-sm select-none"
                >
                  {label}
                </div>
              ))}
              {stampImage && (
                <div
                  onMouseDown={(e) => handleSidebarMouseDown(e, 'stamp')}
                  className="border border-gray-300 rounded-lg py-2 px-3 mb-2 cursor-grab hover:bg-blue-50 text-sm select-none flex items-center gap-2"
                >
                  <img src={stampImage} alt="stamp" className="h-6" />
                  🏢 Place Stamp
                </div>
              )}
            </div>

            <button onClick={() => setStep('setup')} className="border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50">
              ✏️ Change Signature
            </button>
            <button onClick={() => setItems([])} className="border border-red-300 text-red-500 rounded-lg py-2 text-sm hover:bg-red-50">
              🗑️ Clear All
            </button>
            <button onClick={handleSave} disabled={saving || items.length === 0}
              className="bg-red-500 text-white rounded-lg py-3 font-semibold hover:bg-red-600 disabled:opacity-50 mt-auto">
              {saving ? 'Signing...' : 'Sign ➜'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}