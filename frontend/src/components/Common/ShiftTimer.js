import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, AlertCircle, LogOut, Shield } from 'lucide-react';
import { getCurrentUser, logoutUser } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function ShiftTimer() {
  const { t } = useTranslation();
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [shiftInfo, setShiftInfo] = useState(null);
  const [isLate, setIsLate] = useState(false);
  const [loading, setLoading] = useState(true);
  const warningShownRef = useRef(sessionStorage.getItem('shiftWarningShown') === 'true');
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

        const ensureTimeString = (val) => {
          if (!val) return '09:00';
          if (typeof val === 'string') return val;
          // Handle Firestore Timestamp (object with seconds/nanoseconds)
          if (val && typeof val === 'object' && 'seconds' in val) {
            const date = new Date(val.seconds * 1000);
            return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
          }
          return '09:00';
        };

        const start = ensureTimeString(user.shiftStart);
        const end = ensureTimeString(user.shiftEnd);
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
    
    const [startHour, startMinute] = shiftStart.split(':').map(n => parseInt(n));
    const [endHour, endMinute] = shiftEnd.split(':').map(n => parseInt(n));

    let startTime = new Date(now);
    startTime.setHours(startHour, startMinute, 0, 0);
    
    let endTime = new Date(now);
    endTime.setHours(endHour, endMinute, 0, 0);

    const isOvernight = startTime > endTime;

    // Adjust dates for overnight shifts
    if (isOvernight) {
      if (now >= startTime) {
        // We are in the first half of the overnight shift (before midnight)
        // End time is tomorrow
        endTime.setDate(endTime.getDate() + 1);
      } else if (now <= endTime) {
        // We are in the second half of the overnight shift (after midnight)
        // Start time was yesterday
        startTime.setDate(startTime.getDate() - 1);
      } else {
        // We are between the shift end and next shift start (e.g., 10 AM for a 11PM-6AM shift)
        // This is "Before Shift" (starts tonight)
      }
    }

    // Status: Not Started
    if (now < startTime) {
      const diff = startTime - now;
      setIsLate(false);
      return {
        ...formatTime(diff),
        status: 'not_started',
        message: 'Shift starts in',
      };
    }

    // Status: Ended
    if (now > endTime) {
      if (!hasLoggedOut.current) {
        hasLoggedOut.current = true;
        toast(t('shiftTimer.loggingOut'), { icon: 'ℹ️' });
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

    // Status: Active (During Shift)
    const diff = endTime - now;

    if (diff <= 10 * 60 * 1000 && !warningShownRef.current) {
      warningShownRef.current = true;
      sessionStorage.setItem('shiftWarningShown', 'true');
      const mins = Math.ceil(diff / 60000);
      
      console.log('Triggering shift warning notification...');
      toast(
        <div className="flex items-center gap-3">
          <span>{t('shiftTimer.shiftEndsSoon', { minutes: mins })}</span>
          <button 
            onClick={() => toast.dismiss()}
            className="bg-orange-500 text-white px-3 py-1 rounded text-xs font-bold"
          >
            {t('shiftTimer.acknowledge')}
          </button>
        </div>,
        {
          icon: '⚠️',
          duration: Infinity,
          id: 'shift-end-warning'
        }
      );
    }

    // Late check (30 min threshold)
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
    if (window.confirm(t('shiftTimer.confirmLogout'))) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      await logoutUser();
      navigate('/login');
      toast.success(t('shiftTimer.logoutSuccess'));
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
            {t('shiftTimer.adminAccess')}
          </div>
          <div className="text-xs text-purple-600 font-medium">
            {t('shiftTimer.noConstraints')}
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
        <span className="text-gray-600">{t('shiftTimer.loadingShift')}</span>
      </div>
    );
  }

  if (!shiftInfo) {
    return (
      <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-2 shadow-md">
        <Clock size={20} className="text-gray-400" />
        <span className="text-gray-500">{t('shiftTimer.noShiftAssigned')}</span>
        
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
          {t('shiftTimer.shift')}: {shiftInfo.start} - {shiftInfo.end}
        </div>

        {timeRemaining && (
          <div className={`text-xs font-mono font-bold ${getStatusColor()}`}>
            {t(`shiftTimer.${timeRemaining.status === 'not_started' ? 'shiftStartsIn' : (timeRemaining.status === 'ended' ? 'shiftEnded' : 'timeRemaining')}`)}:{' '}
            <span className="font-mono">
              {String(timeRemaining.hours).padStart(2, '0')}:
              {String(timeRemaining.minutes).padStart(2, '0')}:
              {String(timeRemaining.seconds).padStart(2, '0')}
            </span>
          </div>
        )}

        {isLate && timeRemaining?.status === 'active' && (
          <div className="text-xs text-orange-500 flex items-center gap-1 mt-0.5">
            <AlertCircle size={10} /> {t('shiftTimer.youAreLate')}
          </div>
        )}

        {timeRemaining?.status === 'not_started' && (
          <div className="text-xs text-yellow-500 flex items-center gap-1 mt-0.5">
            <AlertCircle size={10} /> {t('shiftTimer.shiftNotStarted')}
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