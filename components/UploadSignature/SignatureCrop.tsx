import getCroppedImg from "@/utils/cropImage";
import { Button, Container, Flex, Paper, Slider } from "@mantine/core";
import Compressor from "compressorjs";
import { useCallback, useEffect, useState } from "react";
import Cropper, { Area } from "react-easy-crop";

type Props = {
  file: File;
  setFile: (payload: File | null) => void;
  onClose: () => void;
  onSaveChanges: (payload: File | null) => void;
};

const SignatureCrop = ({ file, setFile, onClose, onSaveChanges }: Props) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    const getFileUrl = async () => {
      if (file) {
        const compressedImage: Blob = await new Promise((resolve) => {
          new Compressor(file, {
            quality: 0.6,
            success(result) {
              resolve(result);
            },
            error(error) {
              throw error;
            },
          });
        });

        const reader = new FileReader();

        reader.onload = (e) => {
          const url = e.target?.result as string;
          setFileUrl(url);
        };

        console.log(compressedImage);

        reader.readAsDataURL(compressedImage);
      }
    };
    getFileUrl();
  }, [file]);

  const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const showCroppedImage = useCallback(async () => {
    setIsLoading(true);
    if (!croppedAreaPixels) return;
    try {
      const croppedImageFile = await getCroppedImg(file, croppedAreaPixels, 0);

      setFile(croppedImageFile);
      onSaveChanges(croppedImageFile);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [croppedAreaPixels, file, onClose, onSaveChanges, setFile]);

  const onCancel = useCallback(() => {
    setFile(null);
    onClose();
  }, []);

  return (
    <Container fluid p={0} m={0}>
      {fileUrl && (
        <Paper
          sx={(theme) => ({
            border: `1.5px solid ${theme.colors.gray[3]}`,
          })}
          p={1}
        >
          <Container w={250} pos="relative" h={200} bg="dark">
            <Cropper
              image={fileUrl}
              crop={crop}
              zoom={zoom}
              cropSize={{ height: 150, width: 200 }}
              aspect={1.25 / 1}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              style={{
                containerStyle: { background: "white" },
              }}
            />
          </Container>
        </Paper>
      )}
      <Flex direction="column" mt="xs" gap="md">
        <Slider
          label={null}
          value={zoom}
          onChange={setZoom}
          min={1}
          max={3}
          step={0.1}
        />

        <Flex align="center" justify="center" gap="md">
          <Button
            size="xs"
            type="submit"
            aria-label="save changes"
            loading={isLoading}
            onClick={showCroppedImage}
          >
            Save Changes
          </Button>
          <Button
            onClick={onCancel}
            size="xs"
            aria-label="cancel"
            variant="subtle"
          >
            Cancel
          </Button>
        </Flex>
      </Flex>
    </Container>
  );
};

export default SignatureCrop;
