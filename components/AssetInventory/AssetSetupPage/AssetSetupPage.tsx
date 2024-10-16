import { getCustomFieldData, getCustomFieldDetails } from "@/backend/api/get";
import { ROW_PER_PAGE } from "@/utils/constant";
import {
  CategoryTableRow,
  customFieldFormValues,
  InventoryFieldRow,
} from "@/utils/types";
import {
  Button,
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
import { IconPlus } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { useEffect, useState } from "react";
import DisableModal from "../DisableModal";
import AssetCreateFieldForm from "./AssetCreateFieldForm";
import AssetUpdateFieldForm from "./AssetUpdateFieldForm";

type Props = {
  categoryOptions: CategoryTableRow[];
};
const AssetSetupPage = ({ categoryOptions }: Props) => {
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
  useEffect(() => {
    const fetchCustomCategory = async () => {
      try {
        const { data, totalCount } = await getCustomFieldData(
          supabaseClient,
          {}
        );
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
  const handleDelete = async (site_id: string) => {
    setFieldId(site_id);
    setModalOpened(true);
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
            <Title variant="dimmed" order={2}>
              Asset Setup Page
            </Title>
            <Text size="sm">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Optio
              cumque
            </Text>
          </Stack>

          {!showCustomForm && (
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
        {showCustomForm && (
          <AssetCreateFieldForm
            setShowCustomForm={setShowCustomForm}
            categoryList={categoryListChoices}
            setCustomFields={setCustomFields}
          />
        )}

        {customFields.length > 0 && (
          <Paper p={20}>
            <Text weight={500} size="lg" mb="sm">
              Custom Fields
            </Text>

            <DataTable
              fontSize={16}
              style={{
                borderRadius: 4,
                minHeight: "300px",
              }}
              withBorder
              idAccessor="id"
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
                    <Text
                      onClick={() => {
                        handleClickCustomField(field.field_id);
                      }}
                      sx={{ cursor: "pointer" }}
                    >
                      {field.field_name}
                    </Text>
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
                      <Button
                        onClick={() => handleDelete(field.field_id)}
                        size="xs"
                        variant="outline"
                        color="red"
                      >
                        Delete
                      </Button>
                    </Group>
                  ),
                },
              ]}
            />
          </Paper>
        )}

        {showUpdateForm && customFieldsDefaultValue && (
          <AssetUpdateFieldForm
            handleClickCustomField={handleClickCustomField}
            setShowUpdateForm={setShowUpdateForm}
            categoryList={categoryListChoices}
            setCustomFields={setCustomFields}
            customFieldForm={customFieldsDefaultValue}
          />
        )}
      </Stack>
    </Container>
  );
};

export default AssetSetupPage;
