import ListTable from "@/components/ListTable/ListTable";
import { Column, InventoryListType } from "@/utils/types";
import { DataTableSortStatus } from "mantine-datatable";
import { Dispatch, SetStateAction, useEffect } from "react";
import { UseFormGetValues, UseFormSetValue } from "react-hook-form";
import { FilterSelectedValuesType } from "../AssetListPage/AssetListFilter";

type Props = {
  requestList: InventoryListType[];
  requestListCount: number;
  columns: Column[];
  activePage: number;
  eventname: string;
  isFetchingRequestList: boolean;
  handlePagination: (p: number) => void;
  sortStatus: DataTableSortStatus;
  setSortStatus: Dispatch<SetStateAction<DataTableSortStatus>>;
  setValue: UseFormSetValue<FilterSelectedValuesType>;
  getValues: UseFormGetValues<FilterSelectedValuesType>;
  checkIfColumnIsHidden: (column: string) => boolean;
  showTableColumnFilter: boolean;
  setShowTableColumnFilter: Dispatch<SetStateAction<boolean>>;
  listTableColumnFilter: string[];
  setListTableColumnFilter: (
    val: string[] | ((prevState: string[]) => string[])
  ) => void;
  tableColumnList: { value: string; label: string }[];
};

const EventReportListTable = ({
  requestList,
  requestListCount,
  activePage,
  isFetchingRequestList,
  handlePagination,
  sortStatus,
  setSortStatus,
  setValue,
  eventname,
  getValues,
  showTableColumnFilter,
  setShowTableColumnFilter,
  columns,
  listTableColumnFilter,
  setListTableColumnFilter,
  tableColumnList,
}: Props) => {
  const limit = getValues("limit");
  const formattedEventName = eventname.replace(/ /g, "_").toLowerCase();
  useEffect(() => {
    setValue("isAscendingSort", sortStatus.direction === "asc" ? true : false);
    handlePagination(activePage);
  }, [sortStatus]);

  return (
    <>
      <ListTable
        idAccessor={`event_${formattedEventName}id`}
        records={requestList}
        fetching={isFetchingRequestList}
        page={activePage}
        onPageChange={(page) => {
          handlePagination(page);
        }}
        totalRecords={requestListCount}
        recordsPerPage={Number(limit) ? Number(limit) : 10}
        sortStatus={sortStatus}
        onSortStatusChange={setSortStatus}
        columns={columns}
        showTableColumnFilter={showTableColumnFilter}
        setShowTableColumnFilter={setShowTableColumnFilter}
        listTableColumnFilter={listTableColumnFilter}
        setListTableColumnFilter={setListTableColumnFilter}
        tableColumnList={tableColumnList}
        handleFetch={handlePagination}
      />
    </>
  );
};

export default EventReportListTable;
