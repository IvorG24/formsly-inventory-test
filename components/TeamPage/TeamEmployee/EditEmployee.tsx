import { checkHRISNumber, updateEmployee } from "@/backend/api/post";
import { useUserTeamMember } from "@/stores/useUserStore";
import { Database } from "@/utils/database";
import { SCICEmployeeTableRow, SCICEmployeeTableUpdate } from "@/utils/types";
import {
  Button,
  Container,
  Divider,
  Flex,
  LoadingOverlay,
  Select,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { Dispatch, SetStateAction } from "react";
import { Controller, useForm } from "react-hook-form";

type Props = {
  selectedEmployee: SCICEmployeeTableRow | null;
  setSelectedEmployee: Dispatch<SetStateAction<SCICEmployeeTableRow | null>>;
  handleFetch: (page: number, search?: string) => void;
  activePage: number;
};

const CreateNewEmployee = ({
  handleFetch,
  selectedEmployee,
  setSelectedEmployee,
  activePage,
}: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();
  const teamMember = useUserTeamMember();
  const { control, formState, handleSubmit } = useForm<SCICEmployeeTableRow>({
    defaultValues: selectedEmployee as SCICEmployeeTableUpdate,
  });

  const handleUpdateEmployee = async (data: SCICEmployeeTableUpdate) => {
    try {
      await updateEmployee(supabaseClient, {
        employeeData: data,
      });

      handleFetch(activePage);
      setSelectedEmployee(null);
      notifications.show({
        message: "Employee updated",
        color: "green",
      });
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    }
  };
  const isOwnerOrAdmin = ["OWNER", "ADMIN"].includes(
    teamMember?.team_member_role ?? ""
  );
  return (
    <Container p={0} fluid sx={{ position: "relative" }}>
      <LoadingOverlay visible={formState.isSubmitting} />
      <Stack spacing={16}>
        <Title m={0} p={0} order={3}>
          Update Employee
        </Title>
        <Divider mb="xl" />

        <form onSubmit={handleSubmit(handleUpdateEmployee)}>
          <Flex direction="column" gap={16}>
            <Controller
              name="scic_employee_hris_id_number"
              control={control}
              rules={{
                required: "HRIS ID number is required",
                validate: async (value) => {
                  if (selectedEmployee?.scic_employee_hris_id_number === value)
                    return true;

                  const isHRISUnique = await checkHRISNumber(supabaseClient, {
                    hrisNumber: value || "",
                  });

                  return isHRISUnique
                    ? "HRIS ID number is already taken"
                    : true;
                },
              }}
              render={({ field, fieldState }) => (
                <TextInput
                  {...field}
                  type="number"
                  withAsterisk
                  label="HRIS ID Number"
                  w="100%"
                  value={field.value || ""}
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              name="scic_employee_first_name"
              control={control}
              rules={{
                required: "First name is required",
                minLength: {
                  value: 2,
                  message: "First name must have at least 2 characters",
                },
              }}
              render={({ field, fieldState }) => (
                <TextInput
                  {...field}
                  withAsterisk
                  label="First Name"
                  readOnly={!isOwnerOrAdmin}
                  w="100%"
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              name="scic_employee_middle_name"
              control={control}
              render={({ field }) => (
                <TextInput
                  {...field}
                  label="Middle Name (optional)"
                  w="100%"
                  readOnly={!isOwnerOrAdmin}
                  value={field.value || ""}
                />
              )}
            />

            <Controller
              name="scic_employee_last_name"
              control={control}
              rules={{
                required: "Last name is required",
                minLength: {
                  value: 2,
                  message: "Last name must have at least 2 characters",
                },
              }}
              render={({ field, fieldState }) => (
                <TextInput
                  {...field}
                  withAsterisk
                  label="Last Name"
                  readOnly={!isOwnerOrAdmin}
                  w="100%"
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              name="scic_employee_suffix"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  label="Suffix (optional)"
                  data={[
                    { value: "JR", label: "JR" },
                    { value: "SR", label: "SR" },
                    { value: "I", label: "I" },
                    { value: "II", label: "II" },
                    { value: "III", label: "III" },
                    { value: "IV", label: "IV" },
                    { value: "V", label: "V" },
                  ]}
                  placeholder="Select suffix"
                  w="100%"
                />
              )}
            />
          </Flex>
          {isOwnerOrAdmin && (
            <Button type="submit" miw={100} mt={30} mr={14}>
              Update
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            miw={100}
            mt={30}
            mr={14}
            onClick={() => setSelectedEmployee(null)}
          >
            Cancel
          </Button>
        </form>
      </Stack>
    </Container>
  );
};

export default CreateNewEmployee;
