import { checkProcessor } from "@/backend/api/get";
import { createAuditProcessor } from "@/backend/api/post";
import { useActiveTeam } from "@/stores/useTeamStore";
import { Database } from "@/utils/database";
import { AuditProcessorTableRow } from "@/utils/types";
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
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";

type AuditProcessorFormType = {
  firstName: string;
  lastName: string;
  employeeNumber: string;
  isAvailable: boolean;
};

type Props = {
  setIsCreatingAuditProcessor: Dispatch<SetStateAction<boolean>>;
  setAuditProcessorList: Dispatch<SetStateAction<AuditProcessorTableRow[]>>;
  setAuditProcessorCount: Dispatch<SetStateAction<number>>;
};

const CreateAuditProcessor = ({
  setIsCreatingAuditProcessor,
  setAuditProcessorList,
  setAuditProcessorCount,
}: Props) => {
  const supabaseClient = createBrowserSupabaseClient<Database>();
  const activeTeam = useActiveTeam();

  const { register, formState, handleSubmit } = useForm<AuditProcessorFormType>(
    {
      defaultValues: {
        firstName: "",
        lastName: "",
        employeeNumber: "",
        isAvailable: true,
      },
    }
  );

  const onSubmit = async (data: AuditProcessorFormType) => {
    const isAlreadyExisting = await checkProcessor(supabaseClient, {
      processor: "audit",
      firstName: data.firstName,
      lastName: data.lastName,
      employeeNumber: data.employeeNumber,
      teamId: activeTeam.team_id,
    });
    if (isAlreadyExisting) {
      notifications.show({
        message: "Audit Processor already exists",
        color: "orange",
      });
      return;
    }
    try {
      const newAuditProcessor = await createAuditProcessor(supabaseClient, {
        auditProcessorData: {
          audit_processor_first_name: data.firstName,
          audit_processor_last_name: data.lastName,
          audit_processor_employee_number: data.employeeNumber,
          audit_processor_is_available: data.isAvailable,
          audit_processor_team_id: activeTeam.team_id,
        },
      });
      setAuditProcessorList((prev) => {
        prev.unshift(newAuditProcessor);
        return prev;
      });
      setAuditProcessorCount((prev) => prev + 1);
      notifications.show({
        title: "Success!",
        message: "Audit Processor created successfully",
        color: "green",
      });
      setIsCreatingAuditProcessor(false);
    } catch {
      notifications.show({
        title: "Error!",
        message: "There was an error on creating auditProcessor",
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
          Add Audit Processor
        </Title>
        <Divider mb="xl" />

        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap={16}>
            <TextInput
              {...register("firstName", {
                required: { message: "First Name is required", value: true },
                minLength: {
                  message: "First Name must have atleast 3 characters",
                  value: 3,
                },
                maxLength: {
                  message: "First Name must be shorter than 500 characters",
                  value: 500,
                },
              })}
              withAsterisk
              w="100%"
              label="First Name"
              error={formState.errors.firstName?.message}
            />
            <TextInput
              {...register("lastName", {
                required: { message: "Last Name is required", value: true },
                minLength: {
                  message: "Last Name must have atleast 3 characters",
                  value: 3,
                },
                maxLength: {
                  message: "Last Name must be shorter than 500 characters",
                  value: 500,
                },
              })}
              withAsterisk
              w="100%"
              label="Last Name"
              error={formState.errors.lastName?.message}
            />
            <TextInput
              {...register("employeeNumber", {
                required: {
                  message: "Employee Number is required",
                  value: true,
                },
                minLength: {
                  message: "Employee Number must have atleast 4 characters",
                  value: 3,
                },
                maxLength: {
                  message:
                    "Employee Number must be shorter than 500 characters",
                  value: 500,
                },
              })}
              withAsterisk
              w="100%"
              label="Employee Number"
              error={formState.errors.employeeNumber?.message}
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
            onClick={() => setIsCreatingAuditProcessor(false)}
          >
            Cancel
          </Button>
        </form>
      </Stack>
    </Container>
  );
};

export default CreateAuditProcessor;
