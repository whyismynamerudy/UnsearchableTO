// components/MapSheet.tsx
import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MarkerDetails } from '@/app/page';
import Image from 'next/image';

interface MapSheetProps {
  isOpen: boolean;
  onClose: () => void;
  content: MarkerDetails;
}

const MapSheet: React.FC<MapSheetProps> = ({ isOpen, onClose, content }) => {
  const { longitude, latitude, heading, pitch, fov, image_url, description } =
    content;
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Marker Details</SheetTitle>
          <SheetDescription>
            <Image
              src={image_url}
              alt='Street View Image'
              width={400}
              height={200}
            />
            <p>{description}</p>
          </SheetDescription>
          <SheetFooter>
            <Button>
              <Link
                href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}&heading=${heading}&pitch=${pitch}&fov=${fov}`}
                target='_blank'
                rel='noopener noreferrer'
              >
                Open Street View
              </Link>
            </Button>
          </SheetFooter>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
};

export default MapSheet;
