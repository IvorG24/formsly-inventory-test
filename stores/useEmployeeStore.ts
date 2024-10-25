import { InventoryEmployeeList } from "@/utils/types";
import { create } from "zustand";

type Store = {
  employeeList: InventoryEmployeeList[];
  actions: {
    setEmployeeList: (employeeList: InventoryEmployeeList[]) => void;
  };
};

export const useEmployeeStore = create<Store>((set) => ({
  employeeList: [],
  actions: {
    setEmployeeList(employeeList) {
      set((state) => ({
        ...state,
        employeeList: employeeList,
      }));
    },
  },
}));

export const useEmployeeList = () =>
  useEmployeeStore((state) => state.employeeList);

export const useEmployeeListActions = () =>
  useEmployeeStore((state) => state.actions);
