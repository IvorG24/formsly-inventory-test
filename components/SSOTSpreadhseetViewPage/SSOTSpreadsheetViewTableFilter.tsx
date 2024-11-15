import { SSOTTableData } from "@/hooks/useSSOTTableFilter";
import { startCase } from "@/utils/string";
import {
  Accordion,
  Box,
  Button,
  Drawer,
  Flex,
  Group,
  Switch,
  Text,
} from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { IconColumns3, IconEye, IconEyeOff } from "@tabler/icons-react";
import { useEffect, useState } from "react";

type Props = {
  tables: {
    [key: string]: SSOTTableData;
  };
};

function convertToTitleCase(input: string): string {
  return input
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function convertToHyphenCase(input: string): string {
  return input
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .toLowerCase();
}

const SSOTSpreadsheetViewTableFilter = (props: Props) => {
  const switchInputProps = { color: "green" };
  const [showFilterColumnModal, setShowFilterColumnModal] = useState(false);
  const [accordionValue, setAccordionValue] = useState("item-table");
  const defaultFilterSettings = props.tables;
  const [
    localFilterSettings,
    setLocalFilterSettings,
    resetLocalFilterSettings,
  ] = useLocalStorage({
    key: "ssot-table-filter",
    defaultValue: defaultFilterSettings,
  });

  const handleSaveFilterSettingsToLocalStorage = () => {
    setLocalFilterSettings(props.tables);
    setShowFilterColumnModal(false);
    return;
  };

  const checkIfDefaultAndLocalHasSameProps = (
    defaultSettings: typeof defaultFilterSettings,
    localSettings: typeof localFilterSettings
  ) => {
    const keys1 = Object.keys(defaultSettings);
    const keys2 = Object.keys(localSettings);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      if (!keys2.includes(key)) {
        return false;
      }
    }

    return true;
  };

  const renderTableFilter = (tables: Props["tables"]) => {
    return (
      <Accordion
        w="100%"
        value={accordionValue}
        onChange={(value: string) => setAccordionValue(value)}
      >
        {Object.entries(tables).map(([tableName, tableData]) => {
          let parentTableName = "";
          switch (tableName) {
            case "itemTable":
              parentTableName = "Request";
              break;
            case "itemItemTable":
              parentTableName = "Item";
              break;
          }

          const parentTable = tables[parentTableName];
          const isTableDisabled =
            tableName.includes("Item") && parentTable
              ? !parentTable.show
              : false;

          return (
            <Accordion.Item
              key={tableName}
              value={convertToHyphenCase(tableName)}
            >
              <Accordion.Control>
                {startCase(parentTableName)}
              </Accordion.Control>
              <Accordion.Panel>
                <Box w="100%" p="sm">
                  <Group mb="sm" position="apart">
                    <Text weight={600}>{startCase(parentTableName)}</Text>
                    <Switch
                      checked={tableData.show}
                      onChange={(e) =>
                        tableData.setShow(e.currentTarget.checked)
                      }
                      onLabel={<IconEye size="1rem" stroke={2.5} />}
                      offLabel={<IconEyeOff size="1rem" stroke={2.5} />}
                      disabled={isTableDisabled}
                      {...switchInputProps}
                      styles={{ track: { cursor: "pointer" } }}
                    />
                  </Group>
                  <Flex gap="sm" direction="column">
                    {renderColumnListFilter(
                      tableData,
                      parentTable ? !parentTable.show : false || !tableData.show
                    )}
                  </Flex>
                </Box>
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion>
    );
  };

  const renderColumnListFilter = (
    tableData: SSOTTableData,
    isSwitchDisabled?: boolean
  ) => {
    const columns = tableData.columnList;
    return Object.keys(columns).map((columnKey, index) => {
      const propName = columnKey.toLowerCase().replace(/\s+/g, "_");
      return (
        <Group key={index} position="apart">
          <Text>{convertToTitleCase(columnKey)}</Text>
          <Switch
            checked={tableData.columnList[propName]}
            onChange={(e) =>
              tableData.setColumnList((prev) => ({
                ...prev,
                [propName]: e.currentTarget.checked,
              }))
            }
            onLabel={<IconEye size="1rem" stroke={2.5} />}
            offLabel={<IconEyeOff size="1rem" stroke={2.5} />}
            disabled={isSwitchDisabled ? isSwitchDisabled : false}
            {...switchInputProps}
            styles={{ track: { cursor: "pointer" } }}
          />
        </Group>
      );
    });
  };

  useEffect(() => {
    const localSettings = localFilterSettings;
    if (
      !checkIfDefaultAndLocalHasSameProps(defaultFilterSettings, localSettings)
    ) {
      resetLocalFilterSettings();
      return;
    }

    Object.entries(localSettings).forEach(([tableName, tableData]) => {
      props.tables[tableName].setShow(tableData.show);
      props.tables[tableName].setColumnList(tableData.columnList);
    });
  }, [localFilterSettings]);

  return (
    <Box>
      <Drawer
        opened={showFilterColumnModal}
        onClose={() => handleSaveFilterSettingsToLocalStorage()}
        title={<Text weight={600}>Show/Hide Tables and Columns</Text>}
        position="right"
      >
        <Flex
          direction={{ base: "column", md: "row" }}
          gap="md"
          align="flex-start"
          wrap="wrap"
          w="100%"
        >
          {renderTableFilter(props.tables)}
        </Flex>
      </Drawer>

      <Group position="center">
        <Button
          variant="outline"
          onClick={() => setShowFilterColumnModal(true)}
          leftIcon={<IconColumns3 size={14} />}
        >
          Toggle Tables & Columns
        </Button>
      </Group>
    </Box>
  );
};

export default SSOTSpreadsheetViewTableFilter;
