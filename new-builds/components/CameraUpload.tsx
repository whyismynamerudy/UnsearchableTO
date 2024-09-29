import Image from 'next/image';
import React, { useState, useRef } from 'react';
import { Camera } from 'react-camera-pro';
import { Button } from './ui/button';

interface CameraInstance {
  takePhoto: () => string;
}

const CameraUpload: React.FC = () => {
  const camera = useRef<CameraInstance | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const takePicture = () => {
    if (camera.current) {
      const picture = camera.current.takePhoto();
      setImage(picture);
    }
  };

  const handleClose = () => {
    setIsCameraOpen(false);
    setImage(null);
  };

  return (
    <div className='relative'>
      {!isCameraOpen && (
        <button
          onClick={() => setIsCameraOpen(true)}
          className='absolute bottom-32 right-16 bg-blue-500 hover:bg-blue-700 text-white font-bold w-12 h-12 rounded-full flex items-center justify-center shadow-lg'
        >
          📸
        </button>
      )}
      {isCameraOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='relative mt-4 bg-white p-4 rounded-lg w-full h-auto '>
            {!image && (
              <div className='mt-8'>
                <Camera
                  ref={camera}
                  aspectRatio={16 / 9}
                  errorMessages={{
                    noCameraAccessible: 'No camera device accessible.',
                    permissionDenied:
                      'Permission denied. Please allow camera access.',
                    switchCamera:
                      'It is not possible to switch camera to the requested side.',
                    canvas: 'Canvas is not supported.',
                  }}
                  facingMode='environment'
                />
                <div className='flex justify-end'>
                  <Button
                    onClick={takePicture}
                    className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4 mr-4'
                  >
                    Capture Image
                  </Button>
                </div>
              </div>
            )}
            {image && (
              <div className='captured-image mt-4'>
                <h2>Captured Image:</h2>
                <Image src={image} alt='Captured' width={500} height={200} />
                <div className='flex justify-end'>
                  <Button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4'>
                    Upload
                  </Button>
                </div>
              </div>
            )}

            <button
              onClick={() => handleClose()}
              className='absolute top-2 right-2 text-white bg-red-500 rounded-full w-8 h-8 flex items-center justify-center'
            >
              ✖️
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraUpload;
