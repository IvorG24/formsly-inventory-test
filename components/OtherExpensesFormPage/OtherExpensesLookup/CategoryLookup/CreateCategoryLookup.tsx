import { checkLookupTable } from "@/backend/api/get";
import { createRowInLookupTable } from "@/backend/api/post";
import { useActiveTeam } from "@/stores/useTeamStore";
import { Database } from "@/utils/database";
import { LookupForm } from "@/utils/types";

import {
  Button,
  Checkbox,
  Container,
  Divider,
  Flex,
  LoadingOverlay,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";

type Props = {
  lookup: {
    table: string;
    label: string;
    schema: string;
  };
  setIsCreatingCategoryLookup: Dispatch<SetStateAction<boolean>>;
};

const CreateCategoryLookup = ({
  lookup,
  setIsCreatingCategoryLookup,
}: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();
  const activeTeam = useActiveTeam();

  const { register, formState, handleSubmit } = useForm<LookupForm>({
    defaultValues: {
      value: "",
      isAvailable: true,
    },
  });

  const onSubmit = async (data: LookupForm) => {
    try {
      const lookupValue = lookup.table;
      const isAvaialble = `${lookup.table}_is_available`;
      const team = `${lookup.table}_team_id`;

      await createRowInLookupTable(supabaseClient, {
        inputData: {
          [lookupValue]:
            lookup.label === "Unit of Measurement"
              ? data.value.trim()
              : data.value.toUpperCase().trim(),
          [isAvaialble]: data.isAvailable,
          [team]: activeTeam.team_id,
        } as unknown as JSON,
        tableName: lookup.table,
        schema: lookup.schema,
      });

      notifications.show({
        message: `${lookup.label} created.`,
        color: "green",
      });
      setIsCreatingCategoryLookup(false);
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
    return;
  };

  return (
    <Container p={0} fluid sx={{ position: "relative" }}>
      <LoadingOverlay visible={formState.isSubmitting} />
      <Stack spacing={16}>
        <Title m={0} p={0} order={3}>
          Add {lookup.label}
        </Title>
        <Divider mb="xl" />

        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap={16}>
            <TextInput
              {...register("value", {
                required: {
                  message: `${lookup.label} is required`,
                  value: true,
                },
                validate: {
                  duplicate: async (value) => {
                    const isExisting = await checkLookupTable(supabaseClient, {
                      lookupTableName: lookup.table,
                      value:
                        lookup.label === "Unit of Measurement"
                          ? value.trim()
                          : value.toUpperCase().trim(),
                      teamId: activeTeam.team_id,
                    });
                    return isExisting ? `${lookup.label} already exists` : true;
                  },
                },
              })}
              withAsterisk
              w="100%"
              label={lookup.label}
              error={formState.errors.value?.message}
              sx={{
                input: {
                  textTransform:
                    lookup.label === "Unit of Measurement"
                      ? "none"
                      : "uppercase",
                },
              }}
            />

            <Checkbox
              label="Available"
              {...register("isAvailable")}
              sx={{ input: { cursor: "pointer" } }}
            />
          </Flex>

          <Button type="submit" miw={100} mt={30} mr={14}>
            Save
          </Button>
          <Button
            type="button"
            variant="outline"
            miw={100}
            mt={30}
            mr={14}
            onClick={() => setIsCreatingCategoryLookup(false)}
          >
            Cancel
          </Button>
        </form>
      </Stack>
    </Container>
  );
};

export default CreateCategoryLookup;
