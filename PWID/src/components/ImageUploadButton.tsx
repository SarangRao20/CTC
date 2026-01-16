import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadButtonProps {
  onImageCapture: (file: File, preview: string) => void;
  disabled?: boolean;
}

const ImageUploadButton: React.FC<ImageUploadButtonProps> = ({ onImageCapture, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: t('invalid_file_type'),
        description: t('select_image_file'),
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: t('file_too_large'),
        description: t('select_smaller_image'),
        variant: 'destructive',
      });
      return;
    }

    // Create preview URL
    const preview = URL.createObjectURL(file);
    onImageCapture(file, preview);

    toast({
      title: t('image_captured'),
      description: t('image_attached'),
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-hidden="true"
      />
      <Button
        variant="media"
        size="icon-lg"
        onClick={triggerFileInput}
        disabled={disabled}
        aria-label={t('capture_upload_image')}
      >
        <Camera className="w-6 h-6" />
      </Button>
    </>
  );
};

export default ImageUploadButton;
