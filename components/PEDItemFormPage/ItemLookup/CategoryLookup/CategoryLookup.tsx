import { getLookupList } from "@/backend/api/get";
import { useActiveTeam } from "@/stores/useTeamStore";
import { ROW_PER_PAGE } from "@/utils/constant";
import { LookupTable } from "@/utils/types";
import { Container, LoadingOverlay } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";
import CategoryLookupList from "./CategoryLookupList";
import CreateCategoryLookUp from "./CreateCategoryLookup";
import UpdateCategoryLookup from "./UpdateCategoryLookup";

type Props = {
  lookup: {
    table: string;
    label: string;
    schema: string;
  };
};

const CategoryLookup = ({ lookup }: Props) => {
  const supabaseClient = useSupabaseClient();

  const team = useActiveTeam();

  const [categoryLookupList, setCategoryLookupList] = useState<LookupTable[]>(
    []
  );
  const [categoryLookupCount, setCategoryLookupCount] = useState(0);
  const [isCreatingCategoryLookup, setIsCreatingCategoryLookup] =
    useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editCategoryLookup, setEditCategoryLookup] =
    useState<LookupTable | null>(null);

  useEffect(() => {
    const fetchCategoryLookupList = async () => {
      try {
        if (!team.team_id) return;
        setIsLoading(true);
        const { data, count } = await getLookupList(supabaseClient, {
          lookup: lookup.table,
          teamId: team.team_id,
          search: "",
          limit: ROW_PER_PAGE,
          page: 1,
          schema: lookup.schema,
        });
        setCategoryLookupList(data);
        setCategoryLookupCount(Number(count ?? 0));
      } catch (e) {
        notifications.show({
          message: "Something went wrong. Please try again later.",
          color: "red",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategoryLookupList();
    setIsCreatingCategoryLookup(false);
  }, []);

  return (
    <Container p={0} fluid pos="relative">
      <LoadingOverlay visible={isLoading} overlayBlur={2} />

      {!isCreatingCategoryLookup && !editCategoryLookup ? (
        <CategoryLookupList
          lookup={lookup}
          categoryLookupList={categoryLookupList}
          setCategoryLookupList={setCategoryLookupList}
          categoryLookupCount={categoryLookupCount}
          setCategoryLookupCount={setCategoryLookupCount}
          setIsCreatingCategoryLookup={setIsCreatingCategoryLookup}
          setEditCategoryLookup={setEditCategoryLookup}
        />
      ) : null}
      {isCreatingCategoryLookup ? (
        <CreateCategoryLookUp
          lookup={lookup}
          setIsCreatingCategoryLookup={setIsCreatingCategoryLookup}
        />
      ) : null}
      {editCategoryLookup ? (
        <UpdateCategoryLookup
          lookup={lookup}
          setCategoryLookupList={setCategoryLookupList}
          setEditCategoryLookup={setEditCategoryLookup}
          editCategoryLookup={editCategoryLookup}
        />
      ) : null}
    </Container>
  );
};

export default CategoryLookup;
