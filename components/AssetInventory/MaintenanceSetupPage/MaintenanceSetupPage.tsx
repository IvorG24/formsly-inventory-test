import { getCustomFieldData, getCustomFieldDetails } from "@/backend/api/get";
import { updateRequiredField } from "@/backend/api/update";
import { ROW_PER_PAGE } from "@/utils/constant";
import {
  CategoryTableRow,
  customFieldFormValues,
  InventoryFieldRow,
  SecurityGroupData,
} from "@/utils/types";
import {
  Button,
  Checkbox,
  Container,
  Group,
  LoadingOverlay,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconEdit, IconPlus } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { useEffect, useState } from "react";
import CreateFieldForm from "../AssetSetupPage/CreateFieldForm";
import UpdateFieldForm from "../AssetSetupPage/UpdateFieldForm";
import DisableModal from "../DisableModal";

type Props = {
  categoryOptions: CategoryTableRow[];
  securityGroup: SecurityGroupData;
  field: InventoryFieldRow[];
};
const MaintenanceSetupPage = ({
  securityGroup,
  categoryOptions,
  field,
}: Props) => {
  const supabaseClient = useSupabaseClient();
  const [customFields, setCustomFields] = useState<InventoryFieldRow[]>([]);
  const [customFieldsDefaultValue, setCustomFieldsDefaultValue] =
    useState<customFieldFormValues>();
  const [totalFields, setTotalFields] = useState(0);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [isLoading, setIsloading] = useState(false);
  const [fieldId, setFieldId] = useState<string>("");
  const [modalOpened, setModalOpened] = useState(false);
  const [defaultField, setDefaultField] = useState<InventoryFieldRow[]>(field);
  const canAddData = securityGroup.privileges.customField.add === true;
  const canDeleteData = securityGroup.privileges.customField.delete === true;
  const canEditData = securityGroup.privileges.customField.edit === true;
  const sectionId = "5650b808-c68d-49fd-ad89-eff305d037d3";

  useEffect(() => {
    const fetchCustomCategory = async () => {
      try {
        const { data, totalCount } = await getCustomFieldData(supabaseClient, {
          sectionId: sectionId,
          isCustomField: true,
        });
        setCustomFields(data);
        setTotalFields(totalCount);
      } catch (e) {
        notifications.show({
          message: "Something went wrong",
          color: "orange",
        });
      }
    };
    fetchCustomCategory();
  }, []);

  const [activePage, setActivePage] = useState(1);
  const categoryListChoices = categoryOptions.map((category) => ({
    label: category.category_name,
    value: category.category_id,
  }));

  const handleClickCustomField = async (fieldId: string) => {
    try {
      if (!canEditData) {
        notifications.show({
          message: "Action not allowed",
          color: "red",
        });
        return;
      }

      setIsloading(true);
      setShowUpdateForm(true);
      setShowCustomForm(false);
      setCustomFieldsDefaultValue(undefined);
      const data = await getCustomFieldDetails(supabaseClient, {
        fieldId,
      });
      setCustomFieldsDefaultValue(data);
      setIsloading(false);
    } catch (e) {
      setIsloading(false);
      notifications.show({
        message: "Something went wrong",
        color: "orange",
      });
    }
  };

  const handleDelete = async (fieldId: string) => {
    setFieldId(fieldId);
    setModalOpened(true);
  };

  const handleRequiredChange = async (fieldId: string, isChecked: boolean) => {
    try {
      await updateRequiredField(supabaseClient, {
        fieldId: fieldId,
        isRequired: isChecked,
      });

      setDefaultField((prevFields) =>
        prevFields.map((field) =>
          field.field_id === fieldId
            ? { ...field, field_is_required: isChecked }
            : field
        )
      );
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    }
  };

  return (
    <Container>
      <LoadingOverlay visible={isLoading} />
      <DisableModal
        setCurrentCustomFieldList={setCustomFields}
        typeId={fieldId}
        close={() => {
          setModalOpened(false);
        }}
        opened={modalOpened}
        type="Custom Field"
      />
      <Stack spacing="sm">
        <Group position="apart" align="end">
          <Stack>
            <Title variant="dimmed" order={3}>
              Maintenance Setup Page
            </Title>
            <Text size="sm">List of default and custom fields</Text>
          </Stack>
        </Group>
        <Paper p={20}>
          <Text weight={500} size="lg" mb="sm">
            Default Fields
          </Text>

          <DataTable
            fontSize={16}
            style={{
              borderRadius: 4,
              minHeight: "300px",
            }}
            withBorder
            idAccessor="field_id"
            page={activePage}
            totalRecords={defaultField.length}
            recordsPerPage={ROW_PER_PAGE}
            onPageChange={setActivePage}
            records={defaultField}
            columns={[
              {
                accessor: "label",
                width: "40%",
                title: "Field Label",
                render: (field) => (
                  <Text sx={{ cursor: "pointer" }}>{field.field_name}</Text>
                ),
              },
              {
                accessor: "type",
                width: "40%",
                title: "Field Type",
                render: (field) => <Text>{field.field_type}</Text>,
              },
              {
                accessor: "required",
                width: "30%",
                title: "Field Is Required",
                render: (field) => (
                  <Checkbox
                    checked={field.field_is_required}
                    label="Required"
                    value={field.field_is_required ? "true" : "false"}
                    onChange={(e) => {
                      const isChecked = e.currentTarget.checked;
                      handleRequiredChange(field.field_id, isChecked);
                    }}
                  />
                ),
              },
            ]}
          />
        </Paper>
        {!showCustomForm && (
          <Paper p={20}>
            <Group position="apart" align="start" mb="sm">
              <Text weight={500} size="lg">
                Custom Fields
              </Text>
              {canAddData && !showCustomForm && (
                <Button
                  leftIcon={<IconPlus size={16} />}
                  onClick={() => {
                    setShowUpdateForm(false), setShowCustomForm(true);
                  }}
                >
                  Add Custom Field
                </Button>
              )}
            </Group>
            <DataTable
              fontSize={16}
              style={{
                borderRadius: 4,
                minHeight: "300px",
              }}
              withBorder
              idAccessor="field_id"
              page={activePage}
              totalRecords={totalFields}
              recordsPerPage={ROW_PER_PAGE}
              onPageChange={setActivePage}
              records={customFields}
              columns={[
                {
                  accessor: "label",
                  width: "30%",
                  title: "Custom Field Label",
                  render: (field) => (
                    <Text sx={{ cursor: "pointer" }}>{field.field_name}</Text>
                  ),
                },
                {
                  accessor: "type",
                  width: "20%",
                  title: "Field Type",
                  render: (field) => <Text>{field.field_type}</Text>,
                },
                {
                  accessor: "required",
                  width: "30%",
                  title: "Field Is Required",
                  render: (field) => (
                    <Text>
                      {String(field.field_is_required ? "Yes" : "No")}
                    </Text>
                  ),
                },

                {
                  accessor: "actions",
                  title: "Actions",
                  render: (field) => (
                    <Group spacing="xs" noWrap>
                      {canEditData && (
                        <Button
                          onClick={() => {
                            handleClickCustomField(field.field_id);
                          }}
                          size="xs"
                          variant="outline"
                          color="blue"
                          rightIcon={<IconEdit size={16} />}
                        >
                          Edit
                        </Button>
                      )}
                      {canDeleteData && (
                        <Button
                          onClick={() => handleDelete(field.field_id)}
                          size="xs"
                          variant="outline"
                          color="red"
                        >
                          Delete
                        </Button>
                      )}
                    </Group>
                  ),
                },
              ]}
            />
          </Paper>
        )}
        {canAddData && showCustomForm && (
          <CreateFieldForm
            setShowCustomForm={setShowCustomForm}
            categoryList={categoryListChoices}
            setCustomFields={setCustomFields}
            canAddData={canAddData}
            sectionId={sectionId}
            type="maintenance"
          />
        )}
        {canEditData && showUpdateForm && customFieldsDefaultValue && (
          <UpdateFieldForm
            handleClickCustomField={handleClickCustomField}
            setShowUpdateForm={setShowUpdateForm}
            categoryList={categoryListChoices}
            setCustomFields={setCustomFields}
            customFieldForm={customFieldsDefaultValue}
            canEditData={canEditData}
            sectionId={sectionId}
            type="maintenance"
          />
        )}
      </Stack>
    </Container>
  );
};

export default MaintenanceSetupPage;
