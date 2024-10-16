import { SecurityGroupData } from "@/utils/types";
import { create } from "zustand";

type Store = {
  securityGroup: SecurityGroupData;
  actions: {
    setSecurityGroup: (security: SecurityGroupData) => void;
  };
};

export const useRequestListStore = create<Store>((set) => ({
  securityGroup: {
    asset: {
      permissions: [],
      filter: {
        site: [],
        department: [],
        category: [],
        event: [],
      },
    },
  },
  actions: {
    setSecurityGroup(security) {
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
