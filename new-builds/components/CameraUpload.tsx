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
        <Button
          onClick={() => setIsCameraOpen(true)}
          className='absolute bottom-32 right-16 text-white font-bold w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform transform hover:scale-105 hover:shadow-xl'
        >
          +
        </Button>
      )}
      {isCameraOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='relative mt-4 bg-white p-4 rounded-lg w-full h-auto '>
            <div className='flex justify-end'>
              <Button
                variant='outline'
                size='icon'
                onClick={() => handleClose()}
              >
                ✖️
              </Button>
            </div>
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
                    className='text-white font-bold py-2 px-4 rounded mt-4 mr-4'
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
                  <Button className='text-white font-bold py-2 px-4 rounded mt-4'>
                    Upload
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraUpload;
