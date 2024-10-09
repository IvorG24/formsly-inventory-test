import { capitalizeEachWord } from "@/utils/string";
import {
  Button,
  Drawer,
  Flex,
  Grid,
  ScrollArea,
  Stack,
  Switch,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconColumns3 } from "@tabler/icons-react";
import { Dispatch, SetStateAction } from "react";

type Props = {
  hiddenColumnList: string[];
  setHiddenColumnList: Dispatch<SetStateAction<string[]>>;
  columnList: string[];
};

const TradeTestColumnsMenu = ({
  hiddenColumnList,
  setHiddenColumnList,
  columnList,
}: Props) => {
  const [isColumnMenuOpen, { open: openColumnMenu, close: closeColumnMenu }] =
    useDisclosure(false);

  return (
    <>
      <Button
        variant="light"
        onClick={openColumnMenu}
        leftIcon={<IconColumns3 size={14} />}
      >
        Toggle Columns
      </Button>

      <Drawer
        opened={isColumnMenuOpen}
        onClose={closeColumnMenu}
        position="right"
        title="Practical Test Columns Menu"
        p={0}
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <Stack p="xs" spacing="xl">
          {columnList.map((column, index) => (
            <Grid key={index}>
              <Grid.Col span={10}>
                <Text>
                  {capitalizeEachWord(
                    column.replaceAll("_", " ").replaceAll("trade", "practical")
                  )}
                </Text>
              </Grid.Col>
              <Grid.Col span={2}>
                <Flex h="100%" align="center">
                  <Switch
                    onLabel="ON"
                    offLabel="OFF"
                    styles={{ track: { cursor: "pointer" } }}
                    checked={!hiddenColumnList.includes(column)}
                    onChange={(e) => {
                      if (e.currentTarget.checked) {
                        setHiddenColumnList((prev) =>
                          prev.filter((prevColumn) => prevColumn !== column)
                        );
                      } else {
                        setHiddenColumnList((prevColumn) => [
                          ...prevColumn,
                          column,
                        ]);
                      }
                    }}
                  />
                </Flex>
              </Grid.Col>
            </Grid>
          ))}
        </Stack>
        <Button
          variant="light"
          mt="xl"
          fullWidth
          onClick={() => {
            setHiddenColumnList([]);
            closeColumnMenu();
          }}
        >
          Reset Column
        </Button>
      </Drawer>
    </>
  );
};

export default TradeTestColumnsMenu;
