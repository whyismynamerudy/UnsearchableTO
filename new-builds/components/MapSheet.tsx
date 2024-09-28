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

interface MapSheetProps {
  isOpen: boolean;
  onClose: () => void;
  content: MarkerDetails | null; // The content to display in the sheet
}

interface MarkerDetails {
  lat: number;
  lng: number;
  details?: string;
}

const MapSheet: React.FC<MapSheetProps> = ({ isOpen, onClose, content }) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Marker Details</SheetTitle>
          <SheetDescription>
            {content?.lat}, {content?.lng}
          </SheetDescription>
          <SheetFooter>
            <Button>
              <Link
                href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${content?.lat},${content?.lng}`}
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
