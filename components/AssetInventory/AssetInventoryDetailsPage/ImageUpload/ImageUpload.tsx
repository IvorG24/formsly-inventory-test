import { handleAssetImageUpload } from "@/backend/api/post";
import { updateAssetImage } from "@/backend/api/update";
import {
  ActionIcon,
  Box,
  Grid,
  Image,
  LoadingOverlay,
  Text,
} from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconCirclePlus } from "@tabler/icons-react";
import { ChangeEvent, useState } from "react";
type Props = {
  tagId: string;
  imageUrl: string | null;
};
const ImageUpload = ({ tagId, imageUrl }: Props) => {
  const [image, setImage] = useState<string | null>(imageUrl);
  const [isUploading, setIsUploading] = useState(false);
  const supabaseClient = useSupabaseClient();

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (file) {
        setIsUploading(true);
        const reader = new FileReader();
        const publicUrl = await handleAssetImageUpload(
          supabaseClient,
          file,
          file.name,
          tagId
        );
        await updateAssetImage(supabaseClient, {
          url: publicUrl ?? "",
          tagId: parseInt(tagId),
        });

        reader.onloadend = () => {
          setImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
      setIsUploading(false);
    } catch (e) {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Grid.Col span={12} xs={6}>
        <Box
          style={{
            width: "100%",
            height: "330px",
            backgroundColor: "#ccc",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            border: "1px solid #ccc",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {isUploading ? (
            <LoadingOverlay visible={isUploading} />
          ) : image ? (
            <Image
              src={image}
              alt="Asset Image"
              style={{
                objectFit: "cover",
              }}
            />
          ) : (
            <Text color="dimmed" size="xl">
              Not Available
            </Text>
          )}

          <ActionIcon
            size={"lg"}
            variant="filled"
            style={{ position: "absolute", bottom: 10, right: 10 }}
            onClick={() => document.getElementById("imageUpload")?.click()}
          >
            <IconCirclePlus size={32} />
          </ActionIcon>

          <input
            type="file"
            accept="image/*"
            id="imageUpload"
            style={{ display: "none" }}
            onChange={handleImageUpload}
          />
        </Box>
      </Grid.Col>
    </>
  );
};

export default ImageUpload;
