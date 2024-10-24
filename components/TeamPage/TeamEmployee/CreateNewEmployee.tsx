import { checkHRISNumber, createNewEmployee } from "@/backend/api/post";
import { Database } from "@/utils/database";
import { SCICEmployeeTableInsert } from "@/utils/types";
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
  setIsCreatingEmployee: Dispatch<SetStateAction<boolean>>;
  handleFetch: (page: number, search?: string) => void;
  activePage: number;
};

const CreateNewEmployee = ({
  setIsCreatingEmployee,
  handleFetch,
  activePage,
}: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();

  const { control, formState, handleSubmit } = useForm<SCICEmployeeTableInsert>(
    {
      defaultValues: {
        scic_employee_hris_id_number: undefined,
        scic_employee_first_name: "",
        scic_employee_middle_name: "",
        scic_employee_last_name: "",
        scic_employee_suffix: "",
      },
    }
  );

  const handleCreateNewEmployee = async (data: SCICEmployeeTableInsert) => {
    try {
      const isHRISUnique = await checkHRISNumber(supabaseClient, {
        hrisNumber: data.scic_employee_hris_id_number,
      });

      if (isHRISUnique) {
        notifications.show({
          message: "HRIS Number exist",
          color: "orange",
        });
        return;
      }

      await createNewEmployee(supabaseClient, {
        employeeData: data,
      });

      handleFetch(activePage);
      setIsCreatingEmployee(false);
      notifications.show({
        message: "New employee created",
        color: "green",
      });
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    }
  };

  return (
    <Container p={0} fluid sx={{ position: "relative" }}>
      <LoadingOverlay visible={formState.isSubmitting} />
      <Stack spacing={16}>
        <Title m={0} p={0} order={3}>
          Add New Employee
        </Title>
        <Divider mb="xl" />

        <form onSubmit={handleSubmit(handleCreateNewEmployee)}>
          <Flex direction="column" gap={16}>
            <Controller
              name="scic_employee_hris_id_number"
              control={control}
              rules={{ required: "HRIS ID number is required" }}
              render={({ field, fieldState }) => (
                <TextInput
                  {...field}
                  type="number"
                  withAsterisk
                  label="HRIS ID Number"
                  w="100%"
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

          <Button type="submit" miw={100} mt={30} mr={14}>
            Save
          </Button>
          <Button
            type="button"
            variant="outline"
            miw={100}
            mt={30}
            mr={14}
            onClick={() => setIsCreatingEmployee(false)}
          >
            Cancel
          </Button>
        </form>
      </Stack>
    </Container>
  );
};

export default CreateNewEmployee;
