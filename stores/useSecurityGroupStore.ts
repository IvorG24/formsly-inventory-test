import { SecurityGroupData } from "@/utils/types";
import { create } from "zustand";

const defaultSecurityGroup: SecurityGroupData = {
  asset: {
    permissions: [],
    filter: {
      site: [],
      department: [],
      category: [],
      event: [],
    },
  },
  privileges: {
    site: {
      view: false,
      add: false,
      edit: false,
      delete: false,
    },
    location: { view: false, add: false, edit: false, delete: false },
    category: { view: false, add: false, edit: false, delete: false },
    subCategory: { view: false, add: false, edit: false, delete: false },
    department: { view: false, add: false, edit: false, delete: false },
    customField: { view: false, add: false, edit: false, delete: false },
  },
};

type Store = {
  securityGroup: SecurityGroupData;
  actions: {
    setSecurityGroup: (security: SecurityGroupData) => void;
  };
};

export const useRequestListStore = create<Store>((set) => ({
  securityGroup: defaultSecurityGroup,

  actions: {
    setSecurityGroup: (security) => {
      set((state) => ({
        ...state,
        securityGroup: security,
      }));
    },
  },
}));

export const useSecurityGroup = () =>
  useRequestListStore((state) => state.securityGroup);

export const useSecurityAction = () =>
  useRequestListStore((state) => state.actions);
