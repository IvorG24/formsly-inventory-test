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

export const useTeamMemberList = (withRole?: "OWNER & APPROVER" | "ADMIN") =>
  useTeamMemberStore((state) => {
    if (withRole === "OWNER & APPROVER") {
      return state.teamMemberList.filter(
        (member) =>
          member.team_member_role === "APPROVER" ||
          member.team_member_role === "OWNER"
      );
    } else if (withRole === "ADMIN") {
      return state.teamMemberList.filter(
        (member) => member.team_member_role === "ADMIN"
      );
    } else {
      return state.teamMemberList;
    }
  });

export const useTeamMemberListActions = () =>
  useTeamMemberStore((state) => state.actions);
