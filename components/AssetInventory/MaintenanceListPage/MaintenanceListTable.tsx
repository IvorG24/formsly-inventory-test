import ListTable from "@/components/ListTable/ListTable";
import { ROW_PER_PAGE } from "@/utils/constant";
import { Column, InventoryMaintenanceList } from "@/utils/types";
import { DataTableSortStatus } from "mantine-datatable";
import { Dispatch, SetStateAction, useEffect } from "react";
import { UseFormSetValue } from "react-hook-form";
import { FilterSelectedValuesType } from "./MaintenanceListFilter";

type Props = {
  maintenanceList: InventoryMaintenanceList[];
  maintenanceListcount: number;
  activePage: number;
  columns: Column[];
  isFetching: boolean;
  handlePagination: (p: number) => void;
  sortStatus: DataTableSortStatus;
  setSortStatus: Dispatch<SetStateAction<DataTableSortStatus>>;
  setValue: UseFormSetValue<FilterSelectedValuesType>;
  checkIfColumnIsHidden: (column: string) => boolean;
  showTableColumnFilter: boolean;
  setShowTableColumnFilter: Dispatch<SetStateAction<boolean>>;
  setSelectedRow: (newSelectedRows: string[]) => void;
  selectedRow: string[];
  listTableColumnFilter: string[];
  setListTableColumnFilter: (
    val: string[] | ((prevState: string[]) => string[])
  ) => void;
  tableColumnList: { value: string; label: string }[];
};

const MaintenanceListTable = ({
  maintenanceList,
  maintenanceListcount,
  activePage,
  handlePagination,
  sortStatus,
  setSortStatus,
  setValue,
  columns,
  showTableColumnFilter,
  isFetching,
  setShowTableColumnFilter,
  listTableColumnFilter,
  setListTableColumnFilter,
  tableColumnList,
}: Props) => {
  useEffect(() => {
    setValue("isAscendingSort", sortStatus.direction === "asc" ? true : false);
    handlePagination(activePage);
  }, [sortStatus]);

  return (
    <ListTable
      idAccessor="inventory_maintenance_id"
      records={maintenanceList}
      fetching={isFetching}
      page={activePage}
      onPageChange={(page) => {
        handlePagination(page);
      }}
      totalRecords={maintenanceListcount}
      recordsPerPage={ROW_PER_PAGE}
      sortStatus={sortStatus}
      onSortStatusChange={setSortStatus}
      columns={columns}
      showTableColumnFilter={showTableColumnFilter}
      setShowTableColumnFilter={setShowTableColumnFilter}
      listTableColumnFilter={listTableColumnFilter}
      setListTableColumnFilter={setListTableColumnFilter}
      tableColumnList={tableColumnList}
    />
  );
};

export default MaintenanceListTable;
