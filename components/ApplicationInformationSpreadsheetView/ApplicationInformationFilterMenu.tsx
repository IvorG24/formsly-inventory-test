import {
  ApplicationInformationFieldOptionType,
  ApplicationInformationFilterFormValues,
  OptionType,
} from "@/utils/types";
import {
  Accordion,
  Box,
  Button,
  ColorSwatch,
  Drawer,
  Flex,
  Group,
  MultiSelect,
  NumberInput,
  ScrollArea,
  Select,
  Stack,
  Text,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import { DateInput, YearPickerInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { IconCalendar, IconFilter } from "@tabler/icons-react";
import { Controller, useFormContext } from "react-hook-form";
import { swatchMap } from "./ApplicationInformationColumnsMenu";
import { ClassNameType } from "./ApplicationInformationSpreadsheetTable/ApplicationInformationSpreadsheetTable";

const sectionList = [
  {
    sectionName: "Request",
    sectionFieldList: [
      {
        id: "requestFilter.requestId",
        label: "Request ID",
        type: "TEXT",
      },
      {
        id: "requestFilter.dateCreatedRange",
        label: "Date Created",
        type: "DATE",
      },
      {
        id: "requestFilter.status",
        label: "Status",
        type: "MULTISELECT",
      },
      {
        id: "requestFilter.dateUpdatedRange",
        label: "Date Updated",
        type: "DATE",
      },
      {
        id: "requestFilter.approver",
        label: "Approver",
        type: "MULTISELECT",
      },
      {
        id: "requestFilter.requestScoreRange",
        label: "Score",
        type: "NUMBER",
      },
      {
        id: "requestFilter.adOwner",
        label: "Ad Owner",
        type: "MULTISELECT",
      },
    ],
  },
  {
    sectionName: "Header",
    sectionFieldList: [
      {
        id: "responseFilter.position",
        label: "Position",
        type: "MULTISELECT",
      },
      {
        id: "responseFilter.certification",
        label: "Certification",
        type: "BOOLEAN",
      },
      {
        id: "responseFilter.license",
        label: "License",
        type: "BOOLEAN",
      },
      {
        id: "responseFilter.source",
        label: "Where did you learn the job vacancy?",
        type: "MULTISELECT",
      },
    ],
  },
  {
    sectionName: "Personal Information",
    sectionFieldList: [
      {
        id: "responseFilter.firstName",
        label: "First Name",
        type: "TEXT",
      },
      {
        id: "responseFilter.middleName",
        label: "Middle Name",
        type: "TEXT",
      },
      {
        id: "responseFilter.lastName",
        label: "Last Name",
        type: "TEXT",
      },
      {
        id: "responseFilter.nickname",
        label: "Nickname",
        type: "TEXT",
      },
      {
        id: "responseFilter.gender",
        label: "Gender",
        type: "SELECT",
      },
      {
        id: "responseFilter.ageRange",
        label: "Age Range",
        type: "NUMBER",
      },
      {
        id: "responseFilter.civilStatus",
        label: "Civil Status",
        type: "MULTISELECT",
      },
    ],
  },
  {
    sectionName: "Contact Information",
    sectionFieldList: [
      {
        id: "responseFilter.contactNumber",
        label: "Contact Number",
        type: "TEXT",
      },
      {
        id: "responseFilter.emailAddress",
        label: "Email Address",
        type: "TEXT",
      },
      {
        id: "responseFilter.region",
        label: "Region",
        type: "TEXT",
      },
      {
        id: "responseFilter.province",
        label: "Province",
        type: "TEXT",
      },
      {
        id: "responseFilter.city",
        label: "City",
        type: "TEXT",
      },
      {
        id: "responseFilter.barangay",
        label: "Barangay",
        type: "TEXT",
      },
      {
        id: "responseFilter.street",
        label: "Street",
        type: "TEXT",
      },
      {
        id: "responseFilter.zipCode",
        label: "Zip Code",
        type: "TEXT",
      },
    ],
  },
  {
    sectionName: "ID Number",
    sectionFieldList: [
      {
        id: "responseFilter.sssId",
        label: "SSS ID",
        type: "TEXT",
      },
      {
        id: "responseFilter.philhealthNumber",
        label: "Philhealth Number",
        type: "TEXT",
      },
      {
        id: "responseFilter.pagibigNumber",
        label: "Pag IBIG Number",
        type: "TEXT",
      },
      {
        id: "responseFilter.tin",
        label: "TIN",
        type: "TEXT",
      },
    ],
  },
  {
    sectionName: "Educational Background",
    sectionFieldList: [
      {
        id: "responseFilter.highestEducationalAttainment",
        label: "Highest Educational Attainment",
        type: "MULTISELECT",
      },
      {
        id: "responseFilter.fieldOfStudy",
        label: "Field of Study",
        type: "TEXT",
      },
      {
        id: "responseFilter.degreeName",
        label: "Degree Name",
        type: "TEXT",
      },
      {
        id: "responseFilter.torOrDiplomaAttachment",
        label: "TOR / Diploma Attachment",
        type: "BOOLEAN",
      },
      {
        id: "responseFilter.school",
        label: "School",
        type: "TEXT",
      },
      {
        id: "responseFilter.yearGraduated",
        label: "Year Graduated",
        type: "DATE",
      },
    ],
  },
  {
    sectionName: "Work Information",
    sectionFieldList: [
      {
        id: "responseFilter.employmentStatus",
        label: "Employment Status",
        type: "SELECT",
      },
      {
        id: "responseFilter.workedAtStaClara",
        label: "Already worked at Sta Clara before",
        type: "BOOLEAN",
      },
      {
        id: "responseFilter.shiftWillingToWork",
        label: "Shift Willing to Work",
        type: "SELECT",
      },
      {
        id: "responseFilter.willingToBeAssignedAnywhere",
        label: "Willing to be assigned anywhere",
        type: "BOOLEAN",
      },
      {
        id: "responseFilter.regionWillingToBeAssigned",
        label: "Region willing to be assigned",
        type: "MULTISELECT",
      },
      {
        id: "responseFilter.soonestJoiningDate",
        label: "Soonest Joining Date",
        type: "DATE",
      },
      {
        id: "responseFilter.workExperience",
        label: "Total months of relevant work experience",
        type: "NUMBER",
      },
      {
        id: "responseFilter.expectedSalary",
        label: "Expected Monthly Salary (PHP)",
        type: "NUMBER",
      },
    ],
  },
];

type Props = {
  fetchData: (data?: ApplicationInformationFilterFormValues) => void;
  optionList: ApplicationInformationFieldOptionType[];
  handleReset: () => void;
  approverOptionList: OptionType[];
};

const ApplicationInformationFilterMenu = ({
  fetchData,
  optionList,
  handleReset,
  approverOptionList,
}: Props) => {
  const theme = useMantineTheme();
  const [isFilterMenuOpen, { open: openFilterMenu, close: closeFilterMenu }] =
    useDisclosure(false);

  const { handleSubmit, control, register } =
    useFormContext<ApplicationInformationFilterFormValues>();

  const renderResponse = (field: {
    id: string;
    label: string;
    type: string;
  }) => {
    let fieldOptions: { label: string; value: string }[] = [];

    if (["SELECT", "MULTISELECT"].includes(field.type)) {
      fieldOptions =
        optionList
          .find((option) => {
            if (field.label === "Shift Willing to Work") {
              return (
                option.field_name === "Which shift are you willing to work?"
              );
            } else {
              return option.field_name === field.label;
            }
          })
          ?.field_option.map((option) => {
            return {
              label: option.option_value,
              value: option.option_value,
            };
          }) ?? [];

      if (field.label === "Status") {
        fieldOptions = [
          { label: "PENDING", value: "PENDING" },
          { label: "APPROVED", value: "APPROVED" },
          { label: "REJECTED", value: "REJECTED" },
        ];
      } else if (field.label === "Approver") {
        fieldOptions = approverOptionList;
      }
    }

    switch (field.type) {
      case "TEXT":
        return (
          <TextInput
            label={field.label}
            {...register(field.id as "requestFilter")}
          />
        );
      case "DATE":
        return (
          <Stack spacing={0}>
            <Text size={14} fw={500}>
              {field.label}
            </Text>
            <Flex gap="xs">
              <Controller
                control={control}
                name={`${field.id}.start` as "requestFilter"}
                render={({ field: { value, onChange } }) => {
                  const newValue = value ? new Date(value as string) : null;
                  return field.label === "Year Graduated" ? (
                    <YearPickerInput
                      placeholder="Start"
                      value={newValue}
                      onChange={onChange}
                      clearable
                      icon={<IconCalendar size={16} />}
                      sx={{ flex: 1 }}
                    />
                  ) : (
                    <DateInput
                      placeholder="Start"
                      value={newValue as Date}
                      onChange={onChange}
                      clearable
                      icon={<IconCalendar size={16} />}
                      sx={{ flex: 1 }}
                    />
                  );
                }}
              />
              <Controller
                control={control}
                name={`${field.id}.end` as "requestFilter"}
                render={({ field: { value, onChange } }) => {
                  const newValue = value ? new Date(value as string) : null;
                  return field.label === "Year Graduated" ? (
                    <YearPickerInput
                      placeholder="End"
                      value={newValue as Date}
                      onChange={onChange}
                      clearable
                      icon={<IconCalendar size={16} />}
                      sx={{ flex: 1 }}
                    />
                  ) : (
                    <DateInput
                      placeholder="End"
                      value={newValue as Date}
                      onChange={onChange}
                      clearable
                      icon={<IconCalendar size={16} />}
                      sx={{ flex: 1 }}
                    />
                  );
                }}
              />
            </Flex>
          </Stack>
        );
      case "MULTISELECT":
        return (
          <Controller
            control={control}
            name={field.id as "requestFilter"}
            render={({ field: { value, onChange } }) => {
              const newValue = value ?? [];
              return (
                <MultiSelect
                  label={field.label}
                  data={fieldOptions}
                  value={newValue as string[]}
                  onChange={onChange}
                  clearable
                  searchable
                />
              );
            }}
          />
        );
      case "SELECT":
        return (
          <Controller
            control={control}
            name={field.id as "requestFilter"}
            render={({ field: { value, onChange } }) => {
              const newValue = value ?? "";
              return (
                <Select
                  label={field.label}
                  data={fieldOptions}
                  value={newValue as string}
                  onChange={onChange}
                  clearable
                  searchable
                />
              );
            }}
          />
        );
      case "BOOLEAN":
        return (
          <Controller
            control={control}
            name={field.id as "requestFilter"}
            render={({ field: { value, onChange } }) => {
              const newValue = value === undefined ? "" : value;
              return (
                <Select
                  label={field.label}
                  data={[
                    { label: "True", value: "true" },
                    { label: "False", value: "false" },
                  ]}
                  value={newValue as string}
                  onChange={onChange}
                  clearable
                />
              );
            }}
          />
        );
      case "NUMBER":
        return (
          <Stack spacing={0}>
            <Text size={14} fw={500}>
              {field.label}
            </Text>
            <Flex gap="xs">
              <Controller
                control={control}
                name={`${field.id}.start` as "requestFilter"}
                render={({ field: { value, onChange } }) => {
                  const newValue = value ?? "";
                  return (
                    <NumberInput
                      placeholder="Start"
                      value={newValue as number}
                      onChange={onChange}
                      sx={{ flex: 1 }}
                      hideControls
                    />
                  );
                }}
              />
              <Controller
                control={control}
                name={`${field.id}.end` as "requestFilter"}
                render={({ field: { value, onChange } }) => {
                  const newValue = value ?? "";
                  return (
                    <NumberInput
                      placeholder="End"
                      value={newValue as number}
                      onChange={onChange}
                      sx={{ flex: 1 }}
                      hideControls
                    />
                  );
                }}
              />
            </Flex>
          </Stack>
        );
    }
  };

  return (
    <>
      <Button
        leftIcon={<IconFilter size={16} />}
        variant="light"
        onClick={openFilterMenu}
      >
        Filter
      </Button>
      <Drawer
        opened={isFilterMenuOpen}
        onClose={closeFilterMenu}
        position="right"
        title="Application Information Filter Menu"
        p={0}
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <form
          onSubmit={handleSubmit((data) => {
            fetchData({ ...data, page: 1 });
            closeFilterMenu();
          })}
        >
          <Stack spacing="xs" sx={{ overflow: "hidden" }}>
            <Accordion variant="contained">
              {sectionList.map((section, sectionIndex) => {
                return (
                  <Accordion.Item
                    value={section.sectionName}
                    key={sectionIndex}
                  >
                    <Accordion.Control>
                      <Group>
                        <ColorSwatch
                          sx={{ width: 15, height: 15 }}
                          color={
                            theme.colors[
                              swatchMap[section.sectionName as ClassNameType]
                            ][3]
                          }
                        />
                        <Text color="dimmed"> {section.sectionName}</Text>
                      </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Stack spacing="xs">
                        {section.sectionFieldList.map((field, fieldIndex) => {
                          return (
                            <Box key={fieldIndex}>{renderResponse(field)}</Box>
                          );
                        })}
                      </Stack>
                    </Accordion.Panel>
                  </Accordion.Item>
                );
              })}
            </Accordion>
            <Button variant="light" mt="xs" onClick={handleReset}>
              Reset Filter
            </Button>
            <Button type="submit">Apply Filter</Button>
          </Stack>
        </form>
      </Drawer>
    </>
  );
};

export default ApplicationInformationFilterMenu;
