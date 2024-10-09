import { getEquipmentDescriptionList } from "@/backend/api/get";
import { ROW_PER_PAGE } from "@/utils/constant";
import {
  EquipmentDescriptionType,
  EquipmentWithCategoryType,
} from "@/utils/types";
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
import CreateEquipmentDescription from "./CreateEquipmentDescription";
import EquipmentDescriptionList from "./EquipmentDescriptionList";
import UpdateEquipmentDescription from "./UpdateEquipmentDescription";

type Props = {
  selectedEquipment: EquipmentWithCategoryType;
  setSelectedEquipment: Dispatch<
    SetStateAction<EquipmentWithCategoryType | null>
  >;
};

const EquipmentDescription = ({
  selectedEquipment,
  setSelectedEquipment,
}: Props) => {
  const supabaseClient = useSupabaseClient();

  const [equipmentDescriptionList, setEquipmentDescriptionList] = useState<
    EquipmentDescriptionType[]
  >([]);
  const [equipmentDescriptionCount, setEquipmentDescriptionCount] = useState(0);
  const [isCreatingEquipmentDescription, setIsCreatingEquipmentDescription] =
    useState(false);
  const [editEquipmentDescription, setEditEquipmentDescription] =
    useState<EquipmentDescriptionType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEquipmentDescriptionList = async () => {
      try {
        setIsLoading(true);
        if (!selectedEquipment) return;
        const { data, count } = await getEquipmentDescriptionList(
          supabaseClient,
          {
            equipmentId: selectedEquipment.equipment_id,
            search: "",
            limit: ROW_PER_PAGE,
            page: 1,
          }
        );
        setEquipmentDescriptionList(
          data as unknown as EquipmentDescriptionType[]
        );
        setEquipmentDescriptionCount(Number(count ?? 0));
      } catch (e) {
        notifications.show({
          message: "Something went wrong. Please try again later.",
          color: "red",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchEquipmentDescriptionList();
    setIsCreatingEquipmentDescription(false);
    setEditEquipmentDescription(null);
  }, [selectedEquipment]);

  return (
    <Container p={0} fluid pos="relative">
      <LoadingOverlay visible={isLoading} overlayBlur={2} />
      <Flex align="center" justify="space-between">
        <Title order={2}>{`${selectedEquipment.equipment_name}`}</Title>
        <CloseButton onClick={() => setSelectedEquipment(null)} />
      </Flex>
      <Divider mb="xl" mt="sm" />

      {!isCreatingEquipmentDescription && !editEquipmentDescription ? (
        <EquipmentDescriptionList
          selectedEquipment={selectedEquipment}
          equipmentDescriptionList={equipmentDescriptionList}
          setEquipmentDescriptionList={setEquipmentDescriptionList}
          equipmentDescriptionCount={equipmentDescriptionCount}
          setEquipmentDescriptionCount={setEquipmentDescriptionCount}
          setIsCreatingEquipmentDescription={setIsCreatingEquipmentDescription}
          setEditEquipmentDescription={setEditEquipmentDescription}
          editEquipmentDescription={editEquipmentDescription}
        />
      ) : null}
      {isCreatingEquipmentDescription ? (
        <CreateEquipmentDescription
          selectedEquipment={selectedEquipment}
          setIsCreatingEquipmentDescription={setIsCreatingEquipmentDescription}
        />
      ) : null}
      {editEquipmentDescription ? (
        <UpdateEquipmentDescription
          selectedEquipment={selectedEquipment}
          setEquipmentDescriptionList={setEquipmentDescriptionList}
          setEditEquipmentDescription={setEditEquipmentDescription}
          editEquipmentDescription={editEquipmentDescription}
        />
      ) : null}
    </Container>
  );
};

export default EquipmentDescription;
