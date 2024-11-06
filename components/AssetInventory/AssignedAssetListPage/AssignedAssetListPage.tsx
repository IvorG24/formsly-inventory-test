import { useActiveTeam } from "@/stores/useTeamStore";
import { DEFAULT_REQUEST_LIST_LIMIT } from "@/utils/constant";

import { getAssignedAssetOnLoad } from "@/backend/api/get";
import { createAttachment } from "@/backend/api/post";
import { updateWaitingForSignatureStatus } from "@/backend/api/update";
import { useEventList } from "@/stores/useEventStore";
import { useUserProfile } from "@/stores/useUserStore";
import { editImageWithUUID } from "@/utils/functions";
import {
  CategoryTableRow,
  InventoryCustomerRow,
  InventoryListType,
  SecurityGroupData,
  SiteTableRow,
} from "@/utils/types";
import {
  Box,
  Button,
  Container,
  FileInput,
  Flex,
  LoadingOverlay,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { DataTableSortStatus } from "mantine-datatable";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Department } from "../DepartmentSetupPage/DepartmentSetupPage";
import AssignedAssetListFilter from "./AssignedAssetListFilter";
import AssignedAssetListTable from "./AssignedAssetListTable";

type Props = {
  siteList: SiteTableRow[];
  departmentList: Department[];
  categoryList: CategoryTableRow[];
  customerTableList: InventoryCustomerRow[];
  userId: string;
  securityGroupData: SecurityGroupData;
  tableColumnList: {
    label: string;
    value: string;
  }[];
};

type signatureFile = {
  file: File;
};

type FilterSelectedValuesType = {
  search?: string;
  sites?: string[];
  locations?: string;
  category?: string[];
  department?: string[];
  status?: string;
  isAscendingSort?: boolean;
  assignedToPerson?: string[];
  assignedToSite?: string[];
  assignedToCustomer?: string[];
  file?: File;
};

const AssignedAssetListPage = ({
  userId,
  siteList,
  customerTableList,
  departmentList,
  categoryList,
  tableColumnList,
  securityGroupData,
}: Props) => {
  const activeTeam = useActiveTeam();
  const supabaseClient = useSupabaseClient();
  const eventList = useEventList();
  const userProfile = useUserProfile();
  const [activePage, setActivePage] = useState(1);
  const [isFetchingRequestList, setIsFetchingRequestList] = useState(false);
  const [inventoryList, setInventoryList] = useState<InventoryListType[]>([]);
  const [inventoryListCount, setInventoryListCount] = useState(0);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [localFilter, setLocalFilter] =
    useLocalStorage<FilterSelectedValuesType>({
      key: "inventory-request-list-filter",
      defaultValue: {
        search: "",
        sites: securityGroupData.asset.filter.site,
        locations: "",
        department: securityGroupData.asset.filter.department,
        category: securityGroupData.asset.filter.category,
        status: "",
        assignedToPerson: [],
        assignedToSite: [],
        assignedToCustomer: [],
        isAscendingSort: false,
      },
    });
  const [showTableColumnFilter, setShowTableColumnFilter] = useState(false);

  const filterFormMethods = useForm<FilterSelectedValuesType>({
    defaultValues: localFilter,
    mode: "onChange",
  });

  const { handleSubmit, getValues, setValue, register, formState } =
    filterFormMethods;

  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: "inventory_request_created",
    direction: "desc",
  });

  const [listTableColumnFilter, setListTableColumnFilter] = useLocalStorage<
    string[]
  >({
    key: "inventory-list-table-column-filter",
    defaultValue: tableColumnList
      .sort((a, b) => a.label.localeCompare(b.label))
      .filter(
        (column) =>
          ![
            "Asset Tag Id",
            "Asset Name",
            "Status",
            "Date Created",
            "Item Code",
            "Brand",
            "Model",
            "Serial No.",
            "Site",
            "Location",
            "Department",
            "Old Asset Number",
            "IT Equipment Type",
            "Due Date",
          ].includes(column.label)
      )
      .map((column) => column.value),
  });

  const checkIfColumnIsHidden = (column: string) => {
    const isHidden = listTableColumnFilter.includes(column);
    return isHidden;
  };

  const handleFetchRequestList = async (page: number) => {
    try {
      setIsFetchingRequestList(true);
      if (!activeTeam.team_id || !userProfile?.user_id) {
        console.warn(
          "RequestListPage handleFilterFormsError: active team_id not found"
        );
        return;
      }
      const {
        search,
        assignedToPerson,
        locations,
        status,
        assignedToSite,
        assignedToCustomer,
        department,
        sites,
        category,
        isAscendingSort,
      } = getValues();

      const { data, count } = await getAssignedAssetOnLoad(supabaseClient, {
        page: page,
        limit: DEFAULT_REQUEST_LIST_LIMIT,
        sort: isAscendingSort,
        columnAccessor: sortStatus.columnAccessor,
        search,
        status,
        assignedToPerson,
        assignedToSite,
        assignedToCustomer,
        department:
          securityGroupData.asset.filter.department.length > 0
            ? securityGroupData.asset.filter.department
            : department,
        locations,
        sites:
          securityGroupData.asset.filter.site.length > 0
            ? securityGroupData.asset.filter.site
            : sites,
        category:
          securityGroupData.asset.filter.category.length > 0
            ? securityGroupData.asset.filter.category
            : category,
        teamId: activeTeam.team_id,
        userId: userProfile.user_id,
      });

      setInventoryList(data);
      setInventoryListCount(count);
    } catch (e) {
      notifications.show({
        message: "Failed to fetch request list.",
        color: "red",
      });
    } finally {
      setIsFetchingRequestList(false);
    }
  };

  const handleFilterForms = async () => {
    try {
      setActivePage(1);
      await handleFetchRequestList(1);
    } catch (e) {
    } finally {
      setIsFetchingRequestList(false);
    }
  };

  const handlePagination = async (page: number) => {
    try {
      setActivePage(page);
      await handleFetchRequestList(page);
    } catch (e) {
    } finally {
      setIsFetchingRequestList(false);
    }
  };

  useEffect(() => {
    handlePagination(activePage);
  }, [activeTeam, userProfile]);

  const handleUploadSignature = async (
    data: signatureFile,
    requestId: string
  ) => {
    try {
      if (data === null) return;
      const signature = data.file;

      let compressedImage: File | null = null;
      if (data.file.size > 500000) {
        compressedImage = await editImageWithUUID(signature);
      }
      const editedSignature = await editImageWithUUID(signature);

      await updateWaitingForSignatureStatus(supabaseClient, {
        requestId,
        userId: userProfile?.user_id ?? "",
      });

      const { data: signatureAttachment, url } = await createAttachment(
        supabaseClient,
        {
          attachmentData: {
            attachment_name: signature.name,
            attachment_bucket: "USER_SIGNATURES",
            attachment_value: "",
            attachment_id: userProfile?.user_signature_attachment_id
              ? userProfile.user_signature_attachment_id
              : undefined,
          },
          file: compressedImage || editedSignature,
          fileType: "s",
          userId: userProfile?.user_id ?? "",
        }
      );

      const { error } = await supabaseClient.rpc("update_user", {
        input_data: {
          userData: {
            user_id: userProfile?.user_id,
            user_signature_attachment_id: signatureAttachment.attachment_id,
          },
          previousSignatureUrl: url,
        },
      });

      if (error) throw error;

      notifications.show({
        message: "Signature updated.",
        color: "green",
      });
      modals.close("addSignature");
      handlePagination(activePage);
    } catch {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleAction = (requestId: string) => {
    modals.open({
      modalId: "addSignature",
      title: <Text>Upload You Signature</Text>,
      children: (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const file = formData.get("file") as File;
            handleUploadSignature({ file }, requestId);
          }}
        >
          <Stack>
            <FileInput
              accept=".jpg, .jpeg, .png"
              placeholder="Signature Upload"
              label="Signature"
              withAsterisk
              {...register("file", { required: true })}
              onChange={(file) => setValue("file", file ?? undefined)}
            />
            <Flex mt="md" align="center" justify="flex-end" gap="sm">
              <Button
                variant="default"
                color="dimmed"
                onClick={() => modals.close("addSignature")}
              >
                Cancel
              </Button>
              <Button color="blue" type="submit">
                Upload
              </Button>
            </Flex>
          </Stack>
        </form>
      ),
      centered: true,
    });
  };

  return (
    <Container maw={3840} h="100%">
      <LoadingOverlay visible={formState.isSubmitting} />
      <Flex align="center" gap="xl" wrap="wrap" pb="sm">
        <Box>
          <Title order={3}>Assigned Asset List Page</Title>
          <Text>Manage your team assets here.</Text>
        </Box>
      </Flex>
      <Paper p="md">
        <FormProvider {...filterFormMethods}>
          <form onSubmit={handleSubmit(handleFilterForms)}>
            <AssignedAssetListFilter
              customerList={customerTableList}
              securityGroupData={securityGroupData}
              inventoryList={inventoryList}
              selectedRow={selectedRows}
              userId={userId}
              eventList={eventList}
              siteList={siteList}
              categoryList={categoryList}
              departmentList={departmentList}
              handleFilterForms={handleFilterForms}
              localFilter={localFilter}
              setLocalFilter={setLocalFilter}
              showTableColumnFilter={showTableColumnFilter}
              setShowTableColumnFilter={setShowTableColumnFilter}
            />
          </form>
        </FormProvider>
        <Box h="fit-content">
          <AssignedAssetListTable
            setSelectedRow={setSelectedRows}
            selectedRow={selectedRows}
            requestList={inventoryList}
            requestListCount={inventoryListCount}
            activePage={activePage}
            isFetchingRequestList={isFetchingRequestList}
            handlePagination={handlePagination}
            sortStatus={sortStatus}
            handleAction={handleAction}
            setSortStatus={setSortStatus}
            setValue={setValue}
            checkIfColumnIsHidden={checkIfColumnIsHidden}
            showTableColumnFilter={showTableColumnFilter}
            setShowTableColumnFilter={setShowTableColumnFilter}
            listTableColumnFilter={listTableColumnFilter}
            setListTableColumnFilter={setListTableColumnFilter}
            tableColumnList={tableColumnList}
          />
        </Box>
      </Paper>
    </Container>
  );
};

export default AssignedAssetListPage;
