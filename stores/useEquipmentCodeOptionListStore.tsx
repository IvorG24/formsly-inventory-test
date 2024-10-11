import { OptionTableRow } from "@/utils/types";
import { create } from "zustand";

type Store = {
  equipmentCodeOptionList: OptionTableRow[];
  setEquipmentCodeOptionList: (
    equipmentCodeOptionList: OptionTableRow[]
  ) => void;
};

const useEquipmentCodeOptionListStore = create<Store>((set) => ({
  equipmentCodeOptionList: [],
  setEquipmentCodeOptionList: (equipmentCodeOptionList) =>
    set((state) => ({
      ...state,
      equipmentCodeOptionList: equipmentCodeOptionList,
    })),
}));

export default useEquipmentCodeOptionListStore;
