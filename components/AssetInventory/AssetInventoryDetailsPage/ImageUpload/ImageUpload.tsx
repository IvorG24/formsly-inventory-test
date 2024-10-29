import { Box, Button, Grid, Image, Text } from "@mantine/core";
import { ChangeEvent, useState } from "react";

const ImageUpload = () => {
  const [image, setImage] = useState<string | null>(
    "https://weoktclknvgedvdpmkss.supabase.co/storage/v1/object/public/USER_SIGNATURES/2024-10-29-1231313131-s-2ffk.png"
  );

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
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
          {image ? (
            <Image
              src={image} // Dynamically loaded image
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

          <Button
            variant="filled"
            color="blue"
            style={{ position: "absolute", bottom: 10, right: 10 }}
            onClick={() => document.getElementById("imageUpload")?.click()}
          >
            Add Picture
          </Button>

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
