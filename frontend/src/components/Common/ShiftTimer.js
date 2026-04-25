import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertCircle, LogOut, Shield } from 'lucide-react';
import { getCurrentUser, logoutUser } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function ShiftTimer() {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [shiftInfo, setShiftInfo] = useState(null);
  const [isLate, setIsLate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const hasLoggedOut = useRef(false);
  const intervalRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadShiftInfo();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Only set up timer if not admin
    if (shiftInfo && !isAdmin) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setInterval(() => {
        updateRemainingTime();
      }, 1000);
      
      updateRemainingTime();
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [shiftInfo, isAdmin]);

  const loadShiftInfo = async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();

      if (user) {
        // Check if user is admin
        if (user.role === 'admin') {
          setIsAdmin(true);
          setShiftInfo(null);
          setTimeRemaining(null);
          setLoading(false);
          return;
        }

        const start = user.shiftStart || '09:00';
        const end = user.shiftEnd || '17:00';
        setShiftInfo({ start, end });
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error loading shift info:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (diff) => ({
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff % 3600000) / (1000 * 60)),
    seconds: Math.floor((diff % 60000) / 1000),
  });

  const calculateTimeRemaining = (shiftStart, shiftEnd) => {
    const now = new Date();
    const startTime = new Date();
    const endTime = new Date();

    const [startHour, startMinute] = shiftStart.split(':');
    const [endHour, endMinute] = shiftEnd.split(':');

    startTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
    endTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

    // Before shift
    if (now < startTime) {
      const diff = startTime - now;
      setIsLate(false);
      return {
        ...formatTime(diff),
        status: 'not_started',
        message: 'Shift starts in',
      };
    }

    // After shift
    if (now > endTime) {
      if (!hasLoggedOut.current) {
        hasLoggedOut.current = true;
        toast('Shift ended. Logging out...', { icon: 'ℹ️' });
        setTimeout(async () => {
          await logoutUser();
          navigate('/login');
        }, 1500);
      }
      return {
        hours: 0,
        minutes: 0,
        seconds: 0,
        status: 'ended',
        message: 'Shift ended',
      };
    }

    // During shift
    const diff = endTime - now;

    if (diff <= 15 * 60 * 1000 && !showWarning) {
      setShowWarning(true);
      toast(`Shift ends in ${Math.ceil(diff / 60000)} minutes`, {
        icon: '⚠️',
      });
    }

    const lateThreshold = new Date(startTime.getTime() + 30 * 60000);
    setIsLate(now > lateThreshold);

    return {
      ...formatTime(diff),
      status: 'active',
      message: 'Time remaining',
    };
  };

  const updateRemainingTime = () => {
    if (!shiftInfo || isAdmin) return;
    const result = calculateTimeRemaining(shiftInfo.start, shiftInfo.end);
    setTimeRemaining(result);
  };

  const handleManualLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      await logoutUser();
      navigate('/login');
      toast.success('Logged out successfully');
    }
  };

  const getStatusColor = () => {
    if (isAdmin) return 'text-purple-500';
    if (timeRemaining?.status === 'ended') return 'text-red-500';
    if (timeRemaining?.status === 'not_started') return 'text-yellow-500';
    if (isLate) return 'text-orange-500';
    return 'text-green-500';
  };

  const getBgColor = () => {
    if (isAdmin) return 'bg-purple-50 border-purple-200';
    if (timeRemaining?.status === 'ended') return 'bg-red-50 border-red-200';
    if (timeRemaining?.status === 'not_started') return 'bg-yellow-50 border-yellow-200';
    if (isLate) return 'bg-orange-50 border-orange-200';
    return 'bg-green-50 border-green-200';
  };

  // Admin view
  if (isAdmin) {
    return (
      <div className={`flex items-center gap-3 px-4 py-2 rounded-lg shadow-md border ${getBgColor()}`}>
        <Shield size={20} className={getStatusColor()} />
        
        <div>
          <div className="text-sm font-semibold text-gray-700">
            Admin Access
          </div>
          <div className="text-xs text-purple-600 font-medium">
            No shift constraints
          </div>
        </div>

        <button
          onClick={handleManualLogout}
          className="ml-2 text-gray-500 hover:text-red-500 transition-colors"
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-2 shadow-md">
        <Clock size={20} className="animate-pulse text-blue-500" />
        <span className="text-gray-600">Loading shift...</span>
      </div>
    );
  }

  if (!shiftInfo) {
    return (
      <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-2 shadow-md">
        <Clock size={20} className="text-gray-400" />
        <span className="text-gray-500">No shift assigned</span>
        
        <button
          onClick={handleManualLogout}
          className="ml-2 text-gray-500 hover:text-red-500 transition-colors"
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-lg shadow-md border ${getBgColor()}`}>
      <Clock size={20} className={getStatusColor()} />

      <div>
        <div className="text-sm font-semibold text-gray-700">
          Shift: {shiftInfo.start} - {shiftInfo.end}
        </div>

        {timeRemaining && (
          <div className={`text-xs font-mono font-bold ${getStatusColor()}`}>
            {timeRemaining.message}:{' '}
            <span className="font-mono">
              {String(timeRemaining.hours).padStart(2, '0')}:
              {String(timeRemaining.minutes).padStart(2, '0')}:
              {String(timeRemaining.seconds).padStart(2, '0')}
            </span>
          </div>
        )}

        {isLate && timeRemaining?.status === 'active' && (
          <div className="text-xs text-orange-500 flex items-center gap-1 mt-0.5">
            <AlertCircle size={10} /> You're late!
          </div>
        )}

        {timeRemaining?.status === 'not_started' && (
          <div className="text-xs text-yellow-500 flex items-center gap-1 mt-0.5">
            <AlertCircle size={10} /> Shift not started yet
          </div>
        )}
      </div>

      <button
        onClick={handleManualLogout}
        className="ml-2 text-gray-500 hover:text-red-500 transition-colors"
        title="Logout"
      >
        <LogOut size={16} />
      </button>
    </div>
  );
}

export default ShiftTimer;