// Updated ProgressUpdateModal with database save

import { useState } from "react";
import axios from 'axios';

export function ProgressUpdateModal({ isOpen, onClose, phaseData, onUpdate }) {
  const [status, setStatus] = useState(phaseData?.progress || 0);
  const [remarks, setRemarks] = useState(phaseData?.remarks || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!phaseData?.projectId || !phaseData?.name) {
      alert('Missing project or phase information');
      return;
    }

    setSaving(true);
    
    try {
      // Save to database via API
      const response = await axios.post('/api/project-progress', {
        project_id: phaseData.projectId,
        phase_name: phaseData.name,
        progress: status,
        remarks: remarks.trim() || null
      });

      console.log('Progress saved successfully:', response.data);
      
      // Update parent component (local state)
      if (onUpdate) {
        onUpdate({
          phaseId: phaseData.id,
          phaseName: phaseData.name,
          progress: status,
          remarks: remarks,
          projectId: phaseData.projectId
        });
      }

      // Show success message
      alert('✅ Progress updated successfully!');
      
      // Close modal
      onClose();
      
    } catch (error) {
      console.error('Error saving progress:', error);
      
      const errorMessage = error.response?.data?.error || 
                          error.message || 
                          'Failed to save progress';
      
      alert(`❌ ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !phaseData) return null;

  return (
    <div className="fixed inset-0 bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full border-2 border-blue-400">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Update Status - {phaseData.name}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Project: {phaseData.projectTitle || 'Unknown Project'}
          </p>
        </div>

        <div className="px-6 py-4 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Progress: {status}%
            </label>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-lg font-semibold text-gray-900 min-w-[3rem]">
                {status}%
              </span>
              <div className="flex-1 relative">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${status}%` }} 
                  />
                </div>
                <div
                  className="absolute top-[-35px] bg-gray-700 text-white text-xs px-2 py-1 rounded transform -translate-x-1/2 pointer-events-none"
                  style={{ left: `${status}%` }}
                >
                  {status}%
                </div>
              </div>
              <div className="w-6 h-6 flex items-center justify-center">
                {status === 100 && (
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={status}
              onChange={(e) => setStatus(parseInt(e.target.value))}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{ 
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${status}%, #e5e7eb ${status}%, #e5e7eb 100%)` 
              }}
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remarks
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add your remarks here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="4"
              disabled={saving}
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional: Add notes about current progress status
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            className="px-6 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={saving}
          >
            {saving && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {saving ? 'Saving...' : 'Save Progress'}
          </button>
        </div>
      </div>
    </div>
  );
}