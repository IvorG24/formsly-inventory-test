import { TeamMemberType } from "@/utils/types";
import { create } from "zustand";

type Store = {
  teamMemberList: TeamMemberType[];
  actions: {
    setTeamMemberStore: (teamMember: TeamMemberType[]) => void;
  };
};

export const useTeamMemberStore = create<Store>((set) => ({
  teamMemberList: [],
  actions: {
    setTeamMemberStore(teamMember) {
      set((state) => ({
        ...state,
        teamMemberList: teamMember,
      }));
    },
  },
}));

export const useTeamMemberList = () =>
  useTeamMemberStore((state) => state.teamMemberList);
export const useTeamMemberListActions = () =>
  useTeamMemberStore((state) => state.actions);
