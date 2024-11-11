import {
  updateFormDescription,
  updateFormVisibility,
} from "@/backend/api/update";
import { useFormActions, useFormList } from "@/stores/useFormStore";
import { formatDate } from "@/utils/constant";
import { Database } from "@/utils/database";
import { getAvatarColor } from "@/utils/styling";
import { InitialFormType } from "@/utils/types";
import {
  Avatar,
  Box,
  Button,
  Flex,
  Group,
  LoadingOverlay,
  Paper,
  Stack,
  Switch,
  Text,
  Textarea,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { IconCalendar } from "@tabler/icons-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

type Props = {
  form: InitialFormType;
  formVisibilityRestriction?: () => Promise<string | boolean | undefined>;
};

const FormDetailsSection = ({ form, formVisibilityRestriction }: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();
  const creator = form.form_team_member.team_member_user;
  const router = useRouter();
  const formId = router.query.formId as string;

  const formList = useFormList();
  const { setFormList } = useFormActions();

  const [isHidden, setIsHidden] = useState(form.form_is_hidden);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [description, setDescription] = useState(form.form_description);
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const methods = useForm<{ description: string }>();
  const {
    handleSubmit,
    setValue,
    register,
    formState: { errors },
    watch,
  } = methods;

  const handleToggleVisibility = async (checked: boolean) => {
    setIsHidden(!checked);
    try {
      setIsLoading(true);
      await updateFormVisibility(supabaseClient, {
        formId,
        isHidden: !checked,
      });

      const newForm = formList.map((form) => {
        if (form.form_id !== formId) return form;
        return { ...form, form_is_hidden: !isHidden };
      });
      setFormList(newForm);

      notifications.show({
        message: `Form visibility udpated to ${
          !checked ? "hidden" : "visible"
        }`,
        color: "green",
      });
    } catch (e) {
      setIsHidden(checked);
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDescription = async (data: { description: string }) => {
    setIsSavingDescription(true);
    try {
      await updateFormDescription(supabaseClient, {
        formId,
        description: data.description,
      });
      setDescription(data.description);
      notifications.show({
        message: "Form description updated",
        color: "green",
      });
    } catch {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }

    setIsEditingDescription(false);
    setIsSavingDescription(false);
  };

  const descriptionWatch = watch("description");

  return (
    <Paper p="xl" shadow="xs">
      <LoadingOverlay visible={isLoading} />
      <Title order={2}>{form.form_name}</Title>
      {isEditingDescription ? (
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(handleEditDescription)}>
            <Box mt="xs" pos="relative">
              <LoadingOverlay visible={isSavingDescription} />
              <Textarea
                label="Description"
                withAsterisk
                {...register("description", {
                  required: "Form description is required",
                })}
                sx={{ flex: 1 }}
                error={errors.description?.message}
              />
              <Group mt="xs" spacing="xs" position="right">
                <Button
                  variant="outline"
                  onClick={() => setIsEditingDescription(false)}
                  w={85}
                  disabled={isSavingDescription}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  w={85}
                  disabled={
                    isSavingDescription || description === descriptionWatch
                  }
                >
                  Save
                </Button>
              </Group>
            </Box>
          </form>
        </FormProvider>
      ) : (
        <Group mt="xs">
          <Text>{description}</Text>
          <UnstyledButton>
            <Text
              size={14}
              underline
              color="blue"
              onClick={() => {
                setValue("description", description);
                setIsEditingDescription(true);
              }}
            >
              Edit
            </Text>
          </UnstyledButton>
        </Group>
      )}

      {form.form_type && form.form_sub_type && (
        <Stack mt="xl" spacing="xs">
          <Group>
            <Title order={5}>Type:</Title>
            <Text>{form.form_type}</Text>
          </Group>
          <Group>
            <Title order={5}>Sub Type:</Title>
            <Text>{form.form_sub_type}</Text>
          </Group>
        </Stack>
      )}

      <Title order={5} mt="xl">
        Created by:
      </Title>
      <Flex gap="md" align="center" mt="xs">
        <Avatar
          size={50}
          src={creator.user_avatar}
          color={getAvatarColor(
            Number(`${form.form_team_member.team_member_id.charCodeAt(0)}`)
          )}
          radius="xl"
        >
          {(
            creator.user_first_name[0] + creator.user_last_name[0]
          ).toUpperCase()}
        </Avatar>
        <Stack spacing={0}>
          <Text>{`${creator.user_first_name} ${creator.user_last_name}`}</Text>
        </Stack>
      </Flex>
      <Group spacing="md" mt="xl">
        <IconCalendar />
        <Text weight={600}>{formatDate(new Date(form.form_date_created))}</Text>
      </Group>
      <Group spacing="md" mt="xl">
        <Switch
          checked={!isHidden}
          onChange={async (event) => {
            if (
              formVisibilityRestriction &&
              event.currentTarget.checked === true
            ) {
              const result = await formVisibilityRestriction();
              if (result === true) {
                handleToggleVisibility(true);
              } else {
                notifications.show({
                  message: result,
                  color: "orange",
                });
              }
            } else {
              handleToggleVisibility(event.currentTarget.checked);
            }
          }}
          label="Form visibility"
          size="sm"
          sx={{ label: { cursor: "pointer" } }}
        />
      </Group>
    </Paper>
  );
};

export default FormDetailsSection;
