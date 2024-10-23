import { createCustomEvent } from "@/backend/api/post";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserTeamMember } from "@/stores/useUserStore";
import { createEventFormvalues } from "@/utils/types";
import {
  Button,
  Checkbox,
  ColorInput,
  Container,
  DEFAULT_THEME,
  Group,
  LoadingOverlay,
  Paper,
  ScrollArea,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

const EventCreatePage = () => {
  const supabaseClient = useSupabaseClient();
  const activeTeam = useActiveTeam();
  const teamMember = useUserTeamMember();
  const [isLoading, setIsLoading] = useState(false);
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<createEventFormvalues>({
    defaultValues: {
      event: {
        eventName: "",
        eventColor: "",
        eventStatus: "",
        eventDescription: "",
        enableEvent: false,
      },
      fields: [
        {
          field_name: "Date 1",
          field_type: "DATE",
          field_label: "Due date",
          field_is_required: false,
          field_is_included: false,
        },
        {
          field_name: "Text field",
          field_type: "TEXT",
          field_label: "Text field",
          field_is_required: false,
          field_is_included: false,
        },
        {
          field_name: "Currency",
          field_type: "NUMBER",
          field_label: "Amount",
          field_is_required: false,
          field_is_included: false,
        },
        {
          field_name: "Boolean",
          field_type: "CHECKBOX",
          field_label: "Question",
          field_is_required: false,
          field_is_included: false,
        },
        {
          field_name: "Notes",
          field_type: "TEXTAREA",
          field_label: "Notes",
          field_is_required: false,
          field_is_included: false,
        },
        {
          field_name: "Signature",
          field_type: "FILE",
          field_label: "Signature",
          field_is_required: true,
          field_is_included: true,
        },
      ],
      assignedTo: {
        assignToPerson: false,
        assignToCustomer: false,
        assignToSite: false,
      },
    },
  });

  const onSubmit = async (data: createEventFormvalues) => {
    try {
      setIsLoading(true);
      const includedFields = data.fields.filter(
        (field) => field.field_is_included
      );

      const hasAssignedTo = Object.values(data.assignedTo).some(
        (value) => value === true
      );

      const updatedFields = [...includedFields];
      if (hasAssignedTo) {
        if (data.assignedTo.assignToCustomer === true) {
          updatedFields.unshift({
            field_name: "Customer",
            field_type: "DROPDOWN",
            field_label: "Customer",
            field_is_required: true,
            field_is_included: true,
          });
        }
        if (data.assignedTo.assignToPerson === true) {
          updatedFields.unshift({
            field_name: "Assigned To",
            field_type: "DROPDOWN",
            field_label: "Assigned To",
            field_is_required: true,
            field_is_included: true,
          });
        }
        if (data.assignedTo.assignToSite === true) {
          updatedFields.unshift({
            field_name: "Department",
            field_type: "DROPDOWN",
            field_label: "Department",
            field_is_required: true,
            field_is_included: true,
          });
        }
        updatedFields.unshift({
          field_name: "Location",
          field_type: "DROPDOWN",
          field_label: "Location",
          field_is_required: true,
          field_is_included: true,
        });
        updatedFields.unshift({
          field_name: "Site",
          field_type: "DROPDOWN",
          field_label: "Site",
          field_is_required: true,
          field_is_included: true,
        });
        updatedFields.unshift({
          field_name: "Appointed To",
          field_type: "DROPDOWN",
          field_label: "Appointed To",
          field_is_required: true,
          field_is_included: true,
        });
      }

      const filteredData = {
        ...data,
        fields: updatedFields,
      };

      await createCustomEvent(supabaseClient, {
        createEventFormvalues: filteredData,
        teamMemberId: teamMember?.team_member_id || "",
        teamId: activeTeam.team_id,
      });
      notifications.show({
        message: "Event created successfully",
        color: "green",
      });
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    }
  };

  return (
    <Container fluid>
      <LoadingOverlay visible={isLoading} />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack>
          <Paper p="md">
            <Stack>
              <Title order={3}>Event Name</Title>
              <Controller
                name="event.eventName"
                control={control}
                rules={{ required: "Event Name is required" }}
                render={({ field }) => (
                  <TextInput
                    label="Event Name *"
                    required
                    placeholder="For example, Retired, End of Life, etc."
                    {...field}
                    aria-required
                    error={
                      errors.event?.eventName && errors.event?.eventName.message
                    }
                  />
                )}
              />

              <Controller
                name="event.eventColor"
                control={control}
                rules={{ required: "Event Color is required" }}
                render={({ field }) => (
                  <ColorInput
                    label="Pick color"
                    disallowInput
                    required
                    withPicker={false}
                    swatches={[
                      ...DEFAULT_THEME.colors.red,
                      ...DEFAULT_THEME.colors.green,
                      ...DEFAULT_THEME.colors.blue,
                      ...DEFAULT_THEME.colors.yellow,
                      ...DEFAULT_THEME.colors.orange,
                      ...DEFAULT_THEME.colors.teal,
                    ]}
                    {...field}
                  />
                )}
              />
              <Controller
                name="event.eventStatus"
                control={control}
                rules={{ required: "Event Status Is Required" }}
                render={({ field }) => (
                  <TextInput
                    label="Event Status"
                    required
                    placeholder="For example, AVAILABLE , CHECKED OUT"
                    {...field}
                    error={
                      errors.event?.eventName && errors.event?.eventName.message
                    }
                  />
                )}
              />
              <Controller
                name="event.eventDescription"
                control={control}
                render={({ field }) => (
                  <Textarea
                    label="Event Description"
                    required
                    placeholder="Enter event description..."
                    {...field}
                  />
                )}
              />

              <Controller
                name="event.enableEvent"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    required
                    label="Enable this Event?"
                    {...field}
                    value={field.value ? "true" : "false"}
                  />
                )}
              />
            </Stack>
          </Paper>

          <Paper p="md">
            <ScrollArea style={{ width: "100%" }} mx="auto">
              <Table striped highlightOnHover miw={1000}>
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Explanation</th>
                    <th>Customize Label</th>
                    <th>Example</th>
                    <th>Data Required</th>
                  </tr>
                </thead>
                <tbody>
                  {control._defaultValues.fields?.map((field, index) => (
                    <tr key={index}>
                      <td>
                        <Group>
                          <Controller
                            name={`fields.${index}.field_is_included`}
                            control={control}
                            render={({ field: checkboxField }) => (
                              <Checkbox
                                {...checkboxField}
                                value={
                                  field?.field_is_included ? "true" : "false"
                                }
                                disabled={field?.field_name === "Signature"}
                              />
                            )}
                          />
                          <Text>{field?.field_type}</Text>
                        </Group>
                      </td>

                      <td style={{ verticalAlign: "middle" }}>
                        {field?.field_type === "DATE"
                          ? "If you expect the user to return the assets by a specific due date, utilize Date 2 for that purpose."
                          : field?.field_type === "TEXT"
                            ? "The text field can hold up to 100 characters."
                            : field?.field_type === "NUMBER"
                              ? "Use the field to enter an amount. The currency symbol will be defined in the company setup."
                              : field?.field_type === "CHECKBOX"
                                ? "A boolean field will present a radio button to allow the user to select either Yes or No."
                                : field?.field_type === "TEXTAREA"
                                  ? "A text area for the user to enter notes up to 1000 characters in length."
                                  : field?.field_type === "FILE"
                                    ? "A Signature file uploader"
                                    : ""}
                      </td>
                      {/* Customize Label */}
                      <td>
                        <Controller
                          name={`fields.${index}.field_label`}
                          control={control}
                          render={({ field: labelField }) => (
                            <TextInput
                              placeholder="Label"
                              {...labelField}
                              style={{ width: "100%" }}
                              disabled={field?.field_name === "Signature"}
                            />
                          )}
                        />
                      </td>

                      {/* Example Column */}
                      <td style={{ verticalAlign: "middle" }}>
                        {field?.field_type === "DATE"
                          ? "Due date"
                          : field?.field_type === "TEXT"
                            ? "Text field"
                            : field?.field_type === "NUMBER"
                              ? "Amount spent"
                              : field?.field_type === "CHECKBOX"
                                ? "Is the asset functioning properly?"
                                : field?.field_type === "TEXTAREA"
                                  ? "Notes"
                                  : field?.field_type === "FILE"
                                    ? "Signature"
                                    : ""}
                      </td>

                      {/* Data Required Checkbox */}
                      <td>
                        <Controller
                          name={`fields.${index}.field_is_required`}
                          control={control}
                          render={({ field: requiredField }) => (
                            <Checkbox
                              label="Required"
                              {...requiredField}
                              value={
                                field?.field_is_required ? "true" : "false"
                              }
                              disabled={field?.field_name === "Signature"}
                            />
                          )}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </ScrollArea>
          </Paper>

          <Paper p="md">
            <Stack>
              <Title order={3}>
                Assign Assets to Persons, Locations or Customers
              </Title>
              <Controller
                name="assignedTo.assignToPerson"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    label="List of Persons"
                    {...field}
                    value={field.value ? "true" : "false"}
                  />
                )}
              />
              <Controller
                name="assignedTo.assignToCustomer"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    label="List of Customers"
                    {...field}
                    value={field.value ? "true" : "false"}
                  />
                )}
              />
              <Controller
                name="assignedTo.assignToSite"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    label="List of Sites/Locations"
                    {...field}
                    value={field.value ? "true" : "false"}
                  />
                )}
              />
            </Stack>
          </Paper>

          <Group position="right">
            <Button fullWidth type="submit">
              Save
            </Button>
          </Group>
        </Stack>
      </form>
    </Container>
  );
};

export default EventCreatePage;
