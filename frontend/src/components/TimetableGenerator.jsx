import React, { useState, useEffect } from 'react';

const TimetableGenerator = () => {
  const [streamlitUrl, setStreamlitUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);

  useEffect(() => {
    fetchStreamlitUrl();
    checkHealth();
  }, []);

  const fetchStreamlitUrl = async () => {
    try {
      const response = await fetch('/api/admin-scheduler/streamlit-generator/url');
      const data = await response.json();
      
      if (data.success) {
        setStreamlitUrl(data.url);
      } else {
        setError('Failed to get Streamlit URL');
      }
    } catch (err) {
      setError('Error connecting to backend');
    } finally {
      setIsLoading(false);
    }
  };

  const checkHealth = async () => {
    try {
      const response = await fetch('/api/admin-scheduler/streamlit-generator/health');
      const data = await response.json();
      setHealthStatus(data);
    } catch (err) {
      setHealthStatus({ ok: false, error: 'Health check failed' });
    }
  };

  const openInNewTab = () => {
    if (streamlitUrl) {
      window.open(streamlitUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading Timetable Generator...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          AI Timetable Generator
        </h2>
        <p className="text-gray-600 mb-4">
          Generate optimized timetables using advanced OR-Tools algorithms. 
          Upload your CSV files and get clash-free schedules instantly.
        </p>
        
        {/* Health Status */}
        <div className="flex items-center space-x-2 mb-4">
          <div className={`w-3 h-3 rounded-full ${
            healthStatus?.ok ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className="text-sm text-gray-600">
            {healthStatus?.ok ? 'Service Online' : 'Service Offline'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={openInNewTab}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            disabled={!healthStatus?.ok}
          >
            Open Timetable Generator
          </button>
          <button
            onClick={checkHealth}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Check Status
          </button>
        </div>
      </div>

      {/* Embedded View */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Embedded Generator</h3>
        {healthStatus?.ok ? (
          <iframe
            src={streamlitUrl}
            width="100%"
            height="800px"
            frameBorder="0"
            title="Timetable Generator"
            className="border rounded-lg"
          />
        ) : (
          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-gray-500">
              Timetable generator is currently unavailable. 
              Please check the service status.
            </p>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <h4 className="font-medium">Clash-Free Scheduling</h4>
              <p className="text-sm text-gray-600">No faculty or section conflicts</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <h4 className="font-medium">Room Optimization</h4>
              <p className="text-sm text-gray-600">Efficient room allocation</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <h4 className="font-medium">CSV Import/Export</h4>
              <p className="text-sm text-gray-600">Easy data management</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <h4 className="font-medium">Multiple Formats</h4>
              <p className="text-sm text-gray-600">Section and faculty views</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableGenerator;
