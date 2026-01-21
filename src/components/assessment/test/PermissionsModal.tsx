// @ts-nocheck - Excluded from typecheck for gradual migration
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Mic, Maximize2, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

interface PermissionsModalProps {
  onPermissionsGranted: () => void;
}

interface Permission {
  name: string;
  icon: React.ElementType;
  status: 'pending' | 'granted' | 'denied';
  description: string;
}

const PermissionsModal: React.FC<PermissionsModalProps> = ({ onPermissionsGranted }) => {
  const [permissions, setPermissions] = useState<Permission[]>([
    {
      name: 'Camera',
      icon: Camera,
      status: 'pending',
      description: 'Required for proctoring and identity verification',
    },
    {
      name: 'Microphone',
      icon: Mic,
      status: 'pending',
      description: 'Required for audio monitoring during the hackathon',
    },
    {
      name: 'Full Screen',
      icon: Maximize2,
      status: 'pending',
      description: 'Required to prevent tab switching and maintain hackathon integrity',
    },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const updatePermissionStatus = (index: number, status: 'pending' | 'granted' | 'denied') => {
    const newPermissions = [...permissions];
    newPermissions[index].status = status;
    setPermissions(newPermissions);
  };

  const requestCameraAndMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach((track) => track.stop());
      updatePermissionStatus(0, 'granted'); // Camera
      updatePermissionStatus(1, 'granted'); // Microphone
    } catch (err) {
      updatePermissionStatus(0, 'denied');
      updatePermissionStatus(1, 'denied');
      setError('Camera and microphone access was denied. Please grant permissions to continue.');
      return false;
    }
    return true;
  };

  const requestFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      updatePermissionStatus(2, 'granted');
      return true;
    } catch (err) {
      updatePermissionStatus(2, 'denied');
      setError('Fullscreen mode was denied. Please allow fullscreen to continue.');
      return false;
    }
  };

  const handleRequestPermissions = async () => {
    setError(null);
    const mediaPermissions = await requestCameraAndMic();
    if (!mediaPermissions) return;

    const fullscreenPermission = await requestFullscreen();
    if (!fullscreenPermission) return;

    // All permissions granted
    setTimeout(() => {
      onPermissionsGranted();
    }, 1000);
  };

  const allPermissionsGranted = permissions.every((p) => p.status === 'granted');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl max-w-md w-full mx-4 overflow-hidden shadow-xl"
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 font-serif">Permissions Required</h2>
            <p className="mt-2 text-gray-600">
              Please grant the following permissions to ensure hackathon integrity and proctoring.
            </p>
          </div>

          <div className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-lg p-4"
              >
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </motion.div>
            )}

            {permissions.map((permission, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <permission.icon className="h-5 w-5 text-gray-500 mr-2" />
                    <span className="text-gray-700">{permission.name}</span>
                    <button
                      // @ts-expect-error - Auto-suppressed for migration
                      onClick={() => setShowInfo(index)}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                  <AnimatePresence mode="wait">
                    {permission.status === 'pending' && (
                      <motion.div
                        key="pending"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-gray-500"
                      >
                        Waiting...
                      </motion.div>
                    )}
                    {permission.status === 'granted' && (
                      <motion.div
                        key="granted"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-green-600 flex items-center"
                      >
                        <CheckCircle className="h-5 w-5 mr-1" />
                        Granted
                      </motion.div>
                    )}
                    {permission.status === 'denied' && (
                      <motion.div
                        key="denied"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-red-600 flex items-center"
                      >
                        <XCircle className="h-5 w-5 mr-1" />
                        Denied
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <AnimatePresence>
                  // @ts-expect-error - Auto-suppressed for migration
                  {showInfo === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 text-sm text-gray-600"
                    >
                      {permission.description}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <button
              onClick={handleRequestPermissions}
              disabled={allPermissionsGranted}
              className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center ${
                allPermissionsGranted
                  ? 'bg-green-600 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {allPermissionsGranted ? (
                <span className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  All Permissions Granted
                </span>
              ) : (
                'Grant All Permissions'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PermissionsModal;
