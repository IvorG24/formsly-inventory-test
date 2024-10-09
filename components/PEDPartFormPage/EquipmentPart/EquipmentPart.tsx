import { getEquipmentPartList } from "@/backend/api/get";
import { ROW_PER_PAGE } from "@/utils/constant";
import { EquipmentPartType, EquipmentWithCategoryType } from "@/utils/types";
import {
  CloseButton,
  Container,
  Divider,
  Flex,
  LoadingOverlay,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import CreateEquipmentPart from "./CreateEquipmentPart";
import EquipmentPartList from "./EquipmentPartList";
import UpdateEquipmentPart from "./UpdateEquipmentPart";

type Props = {
  selectedEquipment: EquipmentWithCategoryType;
  setSelectedEquipment: Dispatch<
    SetStateAction<EquipmentWithCategoryType | null>
  >;
};

const EquipmentPart = ({ selectedEquipment, setSelectedEquipment }: Props) => {
  const supabaseClient = useSupabaseClient();

  const [equipmentPartList, setEquipmentPartList] = useState<
    EquipmentPartType[]
  >([]);
  const [equipmentPartCount, setEquipmentPartCount] = useState(0);
  const [isCreatingEquipmentPart, setIsCreatingEquipmentPart] = useState(false);
  const [editEquipmentPart, setEditEquipmentPart] =
    useState<EquipmentPartType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEquipmentPartList = async () => {
      try {
        setIsLoading(true);
        if (!selectedEquipment) return;
        const { data, count } = await getEquipmentPartList(supabaseClient, {
          equipmentId: selectedEquipment.equipment_id,
          search: "",
          limit: ROW_PER_PAGE,
          page: 1,
        });
        setEquipmentPartList(data);
        setEquipmentPartCount(Number(count ?? 0));
      } catch {
        notifications.show({
          message: "Something went wrong. Please try again later.",
          color: "red",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchEquipmentPartList();
    setIsCreatingEquipmentPart(false);
    setEditEquipmentPart(null);
  }, [selectedEquipment]);

  return (
    <Container p={0} fluid pos="relative">
      <LoadingOverlay visible={isLoading} overlayBlur={2} />
      <Flex align="center" justify="space-between">
        <Title order={2}>{`${selectedEquipment.equipment_name}`}</Title>
        <CloseButton onClick={() => setSelectedEquipment(null)} />
      </Flex>
      <Divider mb="xl" mt="sm" />

      {!isCreatingEquipmentPart && !editEquipmentPart ? (
        <EquipmentPartList
          selectedEquipment={selectedEquipment}
          equipmentPartList={equipmentPartList}
          setEquipmentPartList={setEquipmentPartList}
          equipmentPartCount={equipmentPartCount}
          setEquipmentPartCount={setEquipmentPartCount}
          setIsCreatingEquipmentPart={setIsCreatingEquipmentPart}
          setEditEquipmentPart={setEditEquipmentPart}
          editEquipmentPart={editEquipmentPart}
        />
      ) : null}
      {isCreatingEquipmentPart ? (
        <CreateEquipmentPart
          selectedEquipment={selectedEquipment}
          setIsCreatingEquipmentPart={setIsCreatingEquipmentPart}
        />
      ) : null}
      {editEquipmentPart ? (
        <UpdateEquipmentPart
          selectedEquipment={selectedEquipment}
          setEquipmentPartList={setEquipmentPartList}
          setEditEquipmentPart={setEditEquipmentPart}
          editEquipmentPart={editEquipmentPart}
        />
      ) : null}
    </Container>
  );
};

export default EquipmentPart;
