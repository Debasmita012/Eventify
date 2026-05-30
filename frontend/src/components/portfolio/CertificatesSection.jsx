import React from 'react'
import { FileBadge, Download } from 'lucide-react'

export default function CertificatesSection({ certificates }) {
  if (certificates.length === 0) return null

  const handleDownload = (certName) => {
    alert(`Downloading certificate for: ${certName} (Mock Action)`)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <FileBadge className="w-5 h-5 text-gray-500" />
          Certificates
        </h2>
        <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          Total: {certificates.length}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {certificates.map((cert) => (
          <div key={cert.certNumber} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center bg-gray-50/50 hover:border-gray-300 transition group">
            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">{cert.name}</h3>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="font-mono bg-white px-1.5 py-0.5 border border-gray-200 rounded text-gray-600">{cert.certNumber}</span>
                <span>• Issued: {new Date(cert.issueDate).toLocaleDateString()}</span>
              </div>
            </div>
            <button 
              onClick={() => handleDownload(cert.name)}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
              title="Download Certificate"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
