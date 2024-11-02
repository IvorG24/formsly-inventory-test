import { EventTableRow } from "@/utils/types";
import { create } from "zustand";

type Store = {
  eventList: EventTableRow[];
  actions: {
    setEventList: (eventList: EventTableRow[]) => void;
  };
};

export const useEventStore = create<Store>((set) => ({
  eventList: [],
  actions: {
    setEventList(eventList) {
      set((state) => ({
        ...state,
        eventList: eventList,
      }));
    },
  },
}));

export const useEventList = () => useEventStore((state) => state.eventList);

export const useEventListAction = () => useEventStore((state) => state.actions);
