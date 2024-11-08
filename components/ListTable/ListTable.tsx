import {
  Accordion,
  Button,
  createStyles,
  Divider,
  Drawer,
  Group,
  Stack,
  Switch,
  Text,
} from "@mantine/core";
import { DataTable, DataTableColumn } from "mantine-datatable";
import { Dispatch, SetStateAction, useState } from "react";

type DataTableProps<T = Record<string, unknown>> = {
  idAccessor?: string;
  records?: T[];
  fetching: boolean;
  page: number;
  onPageChange: (page: number) => void;
  totalRecords: number | undefined;
  columns: DataTableColumn<T>[];
  recordsPerPage: number;
  sortStatus: {
    columnAccessor: string;
    direction: "asc" | "desc";
  };
  onSortStatusChange?: (sortStatus: {
    columnAccessor: string;
    direction: "asc" | "desc";
  }) => void;
  handleFetch?: (page: number) => void;

  // for table column
  showTableColumnFilter: boolean;
  setShowTableColumnFilter: Dispatch<SetStateAction<boolean>>;
  listTableColumnFilter: string[];
  setListTableColumnFilter: (
    val: string[] | ((prevState: string[]) => string[])
  ) => void;
  tableColumnList: {
    value: string;
    label: string;
    field_is_custom_field?: boolean;
  }[];
  type?: string;
};

const useStyles = createStyles((theme) => ({
  root: {
    borderRadius: theme.radius.sm,
    "&& th": {
      color: "white",
      backgroundColor: theme.colors.blue[5],
      transition: "background-color 0.3s ease",
      "& svg": {
        fill: "white",
        color: "white",
      },
      "&:hover": {
        backgroundColor: "#0042ab !important",
        color: "white !important",
        "& svg": {
          fill: "white",
          color: "white",
        },
      },
    },
    "&& td": {
      borderBottom: "1px solid #CDD1D6",
    },
  },
}));

const ListTable = ({
  showTableColumnFilter,
  setShowTableColumnFilter,
  tableColumnList,
  listTableColumnFilter,
  handleFetch,
  setListTableColumnFilter,
  type = "request",
  ...props
}: DataTableProps) => {
  const { classes } = useStyles();
  const customColumns = tableColumnList.filter(
    (column) => column.field_is_custom_field
  );
  const defaultColumns = tableColumnList.filter(
    (column) => !column.field_is_custom_field
  );
  const [tempTableColumnFilter, setTempTableColumnFilter] = useState(
    listTableColumnFilter
  );

  return (
    <>
      <DataTable
        classNames={classes}
        withColumnBorders
        borderColor={"#CDD1D6"}
        rowBorderColor={"#CDD1D6"}
        highlightOnHover
        fontSize={16}
        withBorder
        minHeight={390}
        {...props}
      />

      {/* drawer */}
      {type === "asset" ? (
        <>
          {" "}
          <Drawer
            opened={showTableColumnFilter}
            onClose={() => setShowTableColumnFilter(false)}
            position="right"
            title={
              <Text weight={600} fz={16}>
                Show/Hide Request List Table Columns
              </Text>
            }
          >
            <Stack px="sm">
              <Accordion variant="contained">
                {/* Default Columns Accordion */}
                <Accordion.Item value="default-columns">
                  <Accordion.Control>
                    <Text weight={800} size="lg">
                      Default Columns
                    </Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    {defaultColumns.map((column, idx) => {
                      const isHidden = tempTableColumnFilter.includes(
                        column.value
                      );

                      return (
                        <Group position="apart" p={10} key={column.value + idx}>
                          <Text weight={500}>{column.label}</Text>
                          <Switch
                            checked={!isHidden}
                            onChange={(e) => {
                              setTempTableColumnFilter(
                                (prev) =>
                                  e.currentTarget.checked
                                    ? prev.filter(
                                        (prevItem) => prevItem !== column.value
                                      ) // Show column
                                    : [...prev, column.value] // Hide column
                              );
                            }}
                            styles={{ track: { cursor: "pointer" } }}
                            color="green"
                            onLabel="ON"
                            offLabel="OFF"
                          />
                        </Group>
                      );
                    })}
                  </Accordion.Panel>
                </Accordion.Item>

                {/* Custom Columns Accordion */}
                <Accordion.Item value="custom-columns">
                  <Accordion.Control>
                    <Text weight={800} size="lg">
                      Custom Columns
                    </Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    {customColumns.map((column, idx) => {
                      const isHidden = tempTableColumnFilter.includes(
                        column.value
                      );

                      return (
                        <Stack key={column.value + idx} spacing="lg">
                          <Group p={10} position="apart">
                            <Text>{column.label}</Text>
                            <Switch
                              checked={!isHidden}
                              onChange={(e) => {
                                setTempTableColumnFilter((prev) =>
                                  e.currentTarget.checked
                                    ? prev.filter(
                                        (prevItem) => prevItem !== column.value
                                      ) // Show column
                                    : [...prev, column.value]
                                );
                              }}
                              styles={{ track: { cursor: "pointer" } }}
                              color="green"
                              onLabel="ON"
                              offLabel="OFF"
                            />
                          </Group>
                        </Stack>
                      );
                    })}
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>

              {handleFetch && (
                <Stack>
                  <Button
                    onClick={() => {
                      setListTableColumnFilter(tempTableColumnFilter);
                      setShowTableColumnFilter(false);
                      handleFetch(1);
                    }}
                  >
                    Apply Changes
                  </Button>
                  <Divider labelPosition="center" label={<Text>OR</Text>} />
                  <Button
                    variant="outline"
                    onClick={() => {
                      setListTableColumnFilter(tempTableColumnFilter);
                      setShowTableColumnFilter(false);
                    }}
                  >
                    Reset Columns
                  </Button>
                </Stack>
              )}
            </Stack>
          </Drawer>
        </>
      ) : (
        <>
          <Drawer
            opened={showTableColumnFilter}
            onClose={() => {
              setShowTableColumnFilter(false);
            }}
            position="right"
            title={
              <Text weight={600} fz={16}>
                Show/Hide Request List Table Columns
              </Text>
            }
          >
            <Stack px="sm">
              {tableColumnList.map((column, idx) => {
                const isHidden =
                  listTableColumnFilter.find(
                    (filter) => filter === column.value
                  ) === undefined;

                return (
                  <Group position="apart" key={column.value + idx}>
                    <Text weight={500}>{column.label}</Text>
                    <Switch
                      checked={isHidden}
                      onChange={(e) => {
                        if (e.currentTarget.checked) {
                          setListTableColumnFilter((prev) =>
                            prev.filter((prevItem) => prevItem !== column.value)
                          );
                        } else {
                          setListTableColumnFilter((prev) => [
                            ...prev,
                            column.value,
                          ]);
                        }
                      }}
                      styles={{ track: { cursor: "pointer" } }}
                      color="green"
                      onLabel="ON"
                      offLabel="OFF"
                    />
                  </Group>
                );
              })}
            </Stack>
          </Drawer>
        </>
      )}
    </>
  );
};

export default ListTable;
