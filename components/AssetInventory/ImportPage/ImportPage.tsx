import { getColumnList, getColumnListImport } from "@/backend/api/get";
import { uploadCSVFileData } from "@/backend/api/post";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserTeamMember } from "@/stores/useUserStore";
import {
  CategoryTableRow,
  InventoryCustomerRow,
  InventoryEmployeeList,
  InventoryListType,
} from "@/utils/types";
import {
  Button,
  Container,
  Divider,
  FileInput,
  Group,
  LoadingOverlay,
  Paper,
  ScrollArea,
  Select,
  Stack,
  Table,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import Papa from "papaparse";
import { useState } from "react";
import { CSVLink } from "react-csv";
import { useForm } from "react-hook-form";

type Props = {
  category: CategoryTableRow[];
};

type FormValues = {
  file: File | null;
  importType: "asset" | "employee" | "customer" | null;
  categoryType: string;
};

const ImportPage = ({ category }: Props) => {
  const supabaseClient = useSupabaseClient();
  const teamMember = useUserTeamMember();
  const activeTeam = useActiveTeam();
  const { register, handleSubmit, setValue, watch, reset } =
    useForm<FormValues>({
      defaultValues: { file: null, importType: null, categoryType: "" },
    });
  const [parsedData, setParsedData] = useState<
    InventoryListType[] | InventoryCustomerRow[] | InventoryEmployeeList[]
  >([]);
  const [column, setColumns] = useState<
    { label: string; key: string; type?: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataCompatible, setIsDataCompatible] = useState(true);

  const categoryOptions = category.map((category) => ({
    label: category.category_name,
    value: category.category_name,
  }));

  const importType = watch("importType");
  const categoryWatch = watch("categoryType");

  const handleFileUpload = async (selectedFile: File | null) => {
    if (!selectedFile) return;

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        const parsedData = result.data as
          | InventoryListType[]
          | InventoryCustomerRow[]
          | InventoryEmployeeList[];
        setParsedData(parsedData);

        if (
          importType === "customer" ||
          (importType === "employee" && parsedData.length > 0)
        ) {
          const columnImport = await getColumnListImport(supabaseClient, {
            type: importType,
          });
          const columnsForCsv = columnImport.map((col) => ({
            label: col.label,
            key: col.value,
          }));

          setColumns(columnsForCsv);

          const parsedColumns =
            parsedData.length > 0
              ? Object.keys(parsedData[0]).map((col) =>
                  col.trim().toLowerCase()
                )
              : [];
          const expectedColumns = columnImport.map((col) =>
            col.label.trim().toLowerCase()
          );

          const isCompatible =
            expectedColumns.length === parsedColumns.length &&
            expectedColumns.every((col) => parsedColumns.includes(col)) &&
            parsedColumns.every((col) => expectedColumns.includes(col));

          setIsDataCompatible(isCompatible);

          if (!isCompatible) {
            notifications.show({
              message:
                "Data incompatible with the selected category. Please check the columns.",
              color: "red",
            });
          }
        }
        if (importType === "asset") {
          fetchColumnList(categoryWatch);
        }
      },
    });
    setValue("file", selectedFile);
  };

  const handleSubmitFile = async () => {
    if (!isDataCompatible) {
      notifications.show({
        message: "Data is incompatible. Please upload a compatible file.",
        color: "red",
      });
      return;
    }

    try {
      setIsLoading(true);
      await uploadCSVFileData(supabaseClient, {
        parsedData: parsedData,
        type: importType,
        teamMemberId: teamMember?.team_member_id ?? "",
        teamId: activeTeam.team_id,
      });
      notifications.show({
        message: "Data imported successfully!",
        color: "green",
      });
      reset();
      setParsedData([]);
    } catch (error) {
      notifications.show({
        message: "Error occurred while importing data.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchColumnList = async (category: string | null) => {
    try {
      const tableColumnList = await getColumnList(supabaseClient, {
        categoryName: category ?? "",
      });

      const columnsForCsv = tableColumnList.map((col) => ({
        label: col.label,
        key: col.value,
      }));
      setColumns(columnsForCsv);

      if (importType === "asset" && parsedData.length > 0) {
        const parsedColumns =
          parsedData.length > 0
            ? Object.keys(parsedData[0]).map((col) => col.trim().toLowerCase())
            : [];
        const expectedColumns = columnsForCsv.map((col) =>
          col.label.trim().toLowerCase()
        );

        const isCompatible =
          expectedColumns.length === parsedColumns.length &&
          expectedColumns.every((col) => parsedColumns.includes(col)) &&
          parsedColumns.every((col) => expectedColumns.includes(col));

        setIsDataCompatible(isCompatible);

        if (!isCompatible) {
          notifications.show({
            message:
              "Data incompatible with the selected category. Please check the columns.",
            color: "red",
          });
        }
      }
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    }
  };

  return (
    <Container fluid>
      <LoadingOverlay visible={isLoading} />
      <Paper p="md" shadow="sm" radius="md" withBorder>
        <Stack>
          <Paper p="md">
            <Title order={3} mb="md">
              Import Data
            </Title>
            <Stack>
              <Select
                label="Select Import Type"
                placeholder="Choose type"
                data={[
                  { label: "Asset", value: "asset" },
                  { label: "Employee", value: "employee" },
                  { label: "Customer", value: "customer" },
                ]}
                {...register("importType", { required: true })}
                onChange={(value) =>
                  setValue(
                    "importType",
                    value as "asset" | "employee" | "customer"
                  )
                }
              />
              {importType && (
                <form onSubmit={handleSubmit(handleSubmitFile)}>
                  <Stack spacing="md">
                    <FileInput
                      label="Upload CSV file"
                      placeholder="Choose a file"
                      accept=".csv"
                      withAsterisk
                      {...register("file", { required: true })}
                      onChange={(file) => handleFileUpload(file)}
                    />

                    <Group position="apart" align="center" mt="md">
                      <Group align="center">
                        {importType === "asset" && (
                          <Select
                            placeholder="Choose Category"
                            data={categoryOptions}
                            withAsterisk
                            {...register("categoryType", { required: true })}
                            onChange={(value) => {
                              setValue("categoryType", value || "");
                              fetchColumnList(value || "");
                            }}
                          />
                        )}

                        <CSVLink
                          data={[]}
                          headers={column}
                          filename={`${
                            importType === "asset"
                              ? `${importType}Format${categoryWatch}`
                              : `${importType}Format`
                          }.csv`}
                          className="btn"
                        >
                          <Button variant="outline">
                            Download CSV Template
                          </Button>
                        </CSVLink>
                      </Group>
                      <Button
                        color="blue"
                        type="submit"
                        disabled={!isDataCompatible}
                      >
                        Import Data
                      </Button>
                    </Group>
                  </Stack>
                </form>
              )}
            </Stack>
          </Paper>

          {parsedData.length > 0 && (
            <>
              <Divider />
              <ScrollArea mt="lg" h={600}>
                <Table striped highlightOnHover withBorder withColumnBorders>
                  <thead>
                    <tr>
                      {Object.keys(parsedData[0]).map((key) => (
                        <th key={key}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((row, index) => (
                      <tr key={index}>
                        {Object.values(row).map((value, i) => (
                          <td key={i}>{value}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </ScrollArea>
            </>
          )}
        </Stack>
      </Paper>
    </Container>
  );
};

export default ImportPage;
