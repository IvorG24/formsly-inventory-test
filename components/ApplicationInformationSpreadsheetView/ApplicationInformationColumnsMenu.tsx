import { SectionWithFieldType } from "@/utils/types";
import {
  Accordion,
  Box,
  Button,
  ColorSwatch,
  Drawer,
  Flex,
  Grid,
  Group,
  ScrollArea,
  Stack,
  Switch,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconColumns3 } from "@tabler/icons-react";
import { Dispatch, SetStateAction } from "react";
import { ClassNameType } from "./ApplicationInformationSpreadsheetTable/ApplicationInformationSpreadsheetTable";

export const swatchMap = {
  Request: "blue",
  Header: "cyan",
  "Personal Information": "teal",
  "Contact Information": "green",
  "ID Number": "red",
  "Educational Background": "grape",
  "Work Information": "violet",
  Resume: "indigo",
};

const requestColumnList = {
  section_id: "Request",
  section_name: "Request",
  section_field: [
    {
      field_id: "Request ID",
      field_name: "Request ID",
    },
    {
      field_id: "Date Created",
      field_name: "Date Created",
    },
    {
      field_id: "Status",
      field_name: "Status",
    },
    {
      field_id: "Date Updated",
      field_name: "Date Updated",
    },
    {
      field_id: "Approver",
      field_name: "Approver",
    },
    {
      field_id: "Score",
      field_name: "Score",
    },
    {
      field_id: "Ad Owner",
      field_name: "Add Owner",
    },
  ],
};

type Props = {
  sectionList: SectionWithFieldType[];
  hiddenColumnList: string[];
  setHiddenColumnList: Dispatch<SetStateAction<string[]>>;
};

const ApplicationInformationColumnsMenu = ({
  sectionList,
  hiddenColumnList,
  setHiddenColumnList,
}: Props) => {
  const theme = useMantineTheme();
  const [isColumnMenuOpen, { open: openColumnMenu, close: closeColumnMenu }] =
    useDisclosure(false);

  const checkAll = (fieldList: string[], hiddenList: string[]) => {
    const set1 = new Set(fieldList);
    return hiddenList.filter((field) => !set1.has(field));
  };

  return (
    <>
      <Button
        variant="light"
        onClick={openColumnMenu}
        leftIcon={<IconColumns3 size={14} />}
      >
        Toggle Columns
      </Button>

      <Drawer
        opened={isColumnMenuOpen}
        onClose={closeColumnMenu}
        position="right"
        title="Application Information Column Menu"
        p={0}
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <Accordion w="100%" variant="contained">
          {[requestColumnList, ...sectionList].map((section) => {
            const fieldList = section.section_field.map(
              (field) => field.field_id
            );
            return (
              <Accordion.Item
                key={section.section_id}
                value={section.section_name}
              >
                <Accordion.Control>
                  <Group>
                    <ColorSwatch
                      sx={{ width: 15, height: 15 }}
                      color={
                        theme.colors[
                          swatchMap[section.section_name as ClassNameType]
                        ][3]
                      }
                    />
                    <Text color="dimmed"> {section.section_name}</Text>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack p="xs" spacing="xl">
                    <Grid>
                      <Grid.Col span={10}>
                        <Text weight={600}>{section.section_name}</Text>
                      </Grid.Col>
                      <Grid.Col span={2}>
                        <Switch
                          onLabel="ON"
                          offLabel="OFF"
                          styles={{ track: { cursor: "pointer" } }}
                          checked={
                            !fieldList.some((field) =>
                              hiddenColumnList.includes(field)
                            )
                          }
                          onChange={(e) => {
                            if (e.currentTarget.checked) {
                              setHiddenColumnList((prev) =>
                                checkAll(fieldList, prev)
                              );
                            } else {
                              setHiddenColumnList((prev) => {
                                const newList = new Set([
                                  ...prev,
                                  ...fieldList,
                                ]);
                                return Array.from(newList);
                              });
                            }
                          }}
                        />
                      </Grid.Col>
                    </Grid>
                    <Stack spacing="md">
                      {section.section_field.map((field) => (
                        <Box key={field.field_id}>
                          <Grid>
                            <Grid.Col span={10}>
                              <Text>{field.field_name}</Text>
                            </Grid.Col>
                            <Grid.Col span={2}>
                              <Flex h="100%" align="center">
                                <Switch
                                  onLabel="ON"
                                  offLabel="OFF"
                                  styles={{ track: { cursor: "pointer" } }}
                                  checked={
                                    !hiddenColumnList.includes(field.field_id)
                                  }
                                  onChange={(e) => {
                                    if (e.currentTarget.checked) {
                                      setHiddenColumnList((prev) =>
                                        prev.filter(
                                          (column) => column !== field.field_id
                                        )
                                      );
                                    } else {
                                      setHiddenColumnList((prev) => [
                                        ...prev,
                                        field.field_id,
                                      ]);
                                    }
                                  }}
                                />
                              </Flex>
                            </Grid.Col>
                          </Grid>
                        </Box>
                      ))}
                    </Stack>
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            );
          })}
        </Accordion>
        <Button
          variant="light"
          mt="xl"
          fullWidth
          onClick={() => {
            setHiddenColumnList([]);
          }}
        >
          Reset Column
        </Button>
      </Drawer>
    </>
  );
};

export default ApplicationInformationColumnsMenu;
