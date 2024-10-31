import { generateApiKey } from "@/backend/api/post";
import { disableApikey } from "@/backend/api/update";
import { useActiveTeam } from "@/stores/useTeamStore";
import { ApiKeyData } from "@/utils/types";
import {
  Button,
  Container,
  LoadingOverlay,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { IconKey } from "@tabler/icons-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import ApiKeyDetails from "./ApiKeyDetails";

type Props = {
  teamName: string;
  apiKeyData: ApiKeyData[];
};

type FormValues = {
  apiKeyLabel: string;
};

const GenerateKeyPage = ({ teamName, apiKeyData: initialApiData }: Props) => {
  const [apiKeyData, setApiKeyData] = useState<ApiKeyData[]>(initialApiData);
  const [loading, setLoading] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [labelVisible, setLabelVisible] = useState(false);
  const supabase = createClientComponentClient();
  const teamMember = useActiveTeam();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
    reset,
  } = useForm<FormValues>();

  const handleGenerateApiKey = async () => {
    if (!teamMember) return;

    if (!labelVisible) {
      setLabelVisible(true);
      return;
    }

    const { apiKeyLabel } = getValues();
    if (!apiKeyLabel) {
      notifications.show({
        message: "Please enter a label for the API key",
        color: "orange",
      });
      setLabelVisible(true);
      return;
    }
    setLoading(true);
    try {
      const generatedApiKey = await generateApiKey(supabase, {
        teamId: teamMember.team_id,
        keyLabel: apiKeyLabel,
      });

      setApiKeyData((prevApiKeyData) => [
        ...prevApiKeyData,
        generatedApiKey as ApiKeyData,
      ]);

      notifications.show({
        message: "API Key Generated",
        color: "green",
      });

      setLabelVisible(false);
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "orange",
      });
    } finally {
      setLoading(false);
      reset();
    }
  };

  const toggleVisibility = (apiKey: string) => {
    setVisibleKeys((prevVisibleKeys) => ({
      ...prevVisibleKeys,
      [apiKey]: !prevVisibleKeys[apiKey],
    }));
  };

  const handleDeleteApiKey = async (apiKey: string) => {
    if (!teamMember) return;
    setLoading(true);
    try {
      const disabledApiKey = await disableApikey(supabase, {
        apiKeyId: apiKey,
      });
      setApiKeyData((prevApiKeyData) =>
        prevApiKeyData.filter((key) => key.team_key_api_key !== apiKey)
      );
      notifications.show({
        message: `${disabledApiKey[0].team_key_label} API Key Disabled`,
        color: "green",
      });
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "orange",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container h="100%" fluid>
      <LoadingOverlay visible={loading} />
      <Container p="xl">
        <Stack>
          <Title order={2} color="dimmed">
            Generate API Key For {teamName.toUpperCase()}
          </Title>

          <ApiKeyDetails
            apiKeyData={apiKeyData}
            handleDeleteApiKey={handleDeleteApiKey}
            toggleVisibility={toggleVisibility}
            visibleKeys={visibleKeys}
          />
          <form onSubmit={handleSubmit(handleGenerateApiKey)}>
            <Stack>
              {labelVisible && (
                <TextInput
                  label="API Key Label"
                  placeholder="Input a label for the API key"
                  required
                  withAsterisk
                  disabled={loading}
                  {...register("apiKeyLabel", {
                    required: "API Key Label is required",
                  })}
                  error={errors.apiKeyLabel?.message}
                />
              )}

              <Button
                leftIcon={<IconKey size={22} />}
                fullWidth
                type="submit"
                loading={loading}
                disabled={loading}
              >
                {labelVisible ? "Generate API Key" : "Generate API Key"}
              </Button>
            </Stack>
          </form>
        </Stack>
      </Container>
    </Container>
  );
};

export default GenerateKeyPage;
