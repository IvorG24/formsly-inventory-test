import { getItemDescriptionFieldList } from "@/backend/api/get";
import { DIALOG_ROW_PER_PAGE } from "@/utils/constant";
import {
  ItemDescriptionFieldWithUoM,
  ItemWithDescriptionAndField,
} from "@/utils/types";
import {
  ActionIcon,
  Box,
  Dialog,
  Group,
  Text,
  TextInput,
  Tooltip,
  createStyles,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconSearch } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { useEffect, useState } from "react";

const useStyles = createStyles((theme) => ({
  checkbox: {
    input: { cursor: "pointer" },
  },
  flexGrow: {
    [theme.fn.smallerThan("lg")]: {
      flexGrow: 1,
    },
  },
}));

type Props = {
  item: ItemWithDescriptionAndField;
  opened: boolean;
  close: () => void;
};

const ExistingOptionsDialog = ({ item, opened, close }: Props) => {
  const supabaseClient = useSupabaseClient();
  const { classes } = useStyles();
  const itemDescription = item.item_description[0];

  const [isLoading, setIsLoading] = useState(true);
  const [activePage, setActivePage] = useState(1);
  const [search, setSearch] = useState("");
  const [recordList, setRecordList] = useState<ItemDescriptionFieldWithUoM[]>(
    []
  );
  const [count, setCount] = useState(0);

  useEffect(() => {
    handleFetch("", 1);
  }, [item]);

  const handleFetch = async (search: string, page: number) => {
    setIsLoading(true);
    try {
      const { data, count } = await getItemDescriptionFieldList(
        supabaseClient,
        {
          descriptionId: itemDescription.item_description_id,
          search: search,
          page: page,
          limit: DIALOG_ROW_PER_PAGE,
        }
      );
      setRecordList(data);
      setCount(Number(count));
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (isEmpty?: boolean) => {
    if (activePage !== 1) {
      setActivePage(1);
    }
    handleFetch(isEmpty ? "" : search, 1);
  };

  return (
    <Dialog
      opened={opened}
      withCloseButton
      onClose={close}
      size="lg"
      radius="md"
      withBorder
    >
      <Text size="xs" mr="xs">
        <Text color="dimmed" span>
          Item Name:
        </Text>
        <Tooltip openDelay={500} label={item.item_general_name} withArrow>
          <Text truncate span>{` ${item.item_general_name}`}</Text>
        </Tooltip>
      </Text>

      <Text size="xs" mb="xs">
        <Text color="dimmed" span>
          Item Description:
        </Text>
        <Tooltip
          openDelay={500}
          label={itemDescription.item_description_label}
          withArrow
        >
          <Text
            truncate
            span
          >{` ${itemDescription.item_description_label}`}</Text>
        </Tooltip>
      </Text>

      <Box>
        <Group className={classes.flexGrow}>
          <TextInput
            miw={250}
            placeholder="Search a value..."
            rightSection={
              <ActionIcon onClick={() => search && handleSearch()}>
                <IconSearch size={16} />
              </ActionIcon>
            }
            value={search}
            onChange={async (e) => {
              setSearch(e.target.value);
              if (e.target.value === "") {
                handleSearch(true);
              }
            }}
            onKeyUp={(e) => {
              if (e.key === "Enter") {
                if (search) {
                  handleSearch();
                }
              }
            }}
            maxLength={4000}
            className={classes.flexGrow}
          />
        </Group>

        <DataTable
          idAccessor="item_description_field_id"
          mt="xs"
          withBorder
          fw="bolder"
          c="dimmed"
          minHeight={250}
          fetching={isLoading}
          records={recordList}
          columns={[
            { accessor: "item_description_field_value", title: "Value" },
            ...(itemDescription.item_description_is_with_uom
              ? [
                  {
                    accessor:
                      "item_description_field_uom.[0].item_description_field_uom",
                    title: "Base Unit of Measurement",
                  },
                ]
              : []),
          ]}
          totalRecords={count}
          recordsPerPage={DIALOG_ROW_PER_PAGE}
          page={activePage}
          onPageChange={(page) => {
            setActivePage(page);
            handleFetch(search, page);
          }}
          paginationSize="xs"
        />
      </Box>
    </Dialog>
  );
};

export default ExistingOptionsDialog;
