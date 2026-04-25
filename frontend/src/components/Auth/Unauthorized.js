import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

function Unauthorized() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="text-6xl mb-4">🚫</div>
        <AlertTriangle className="mx-auto text-yellow-500" size={48} />
        <h2 className="text-3xl font-extrabold text-gray-900">
          Access Denied
        </h2>
        <p className="text-gray-600">
          You don't have permission to access this page.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
        >
          <ArrowLeft className="mr-2" size={16} />
          Go Back
        </button>
      </div>
    </div>
  );
}

export default Unauthorized;