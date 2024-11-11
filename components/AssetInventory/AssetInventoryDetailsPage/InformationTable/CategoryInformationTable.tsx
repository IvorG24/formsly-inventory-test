import { isExcludedKey } from "@/utils/constant";
import { formatLabel } from "@/utils/functions";
import { InventoryListType } from "@/utils/types";
import { Grid, Table, Text } from "@mantine/core";
import { useMemo } from "react";

type Props = {
  asset_details: InventoryListType;
};

const filterCategoryDetails = (detail: InventoryListType) => {
  return Object.entries(detail).filter(
    ([key]) =>
      !isExcludedKey(key) &&
      ["inventory_request_category", "inventory_request_sub_category"].includes(
        key
      )
  );
};

const CategoryInformationTable = ({ asset_details }: Props) => {
  const filteredCategoryDetails = useMemo(() => {
    if (!asset_details) return [];
    return filterCategoryDetails(asset_details);
  }, [asset_details]);

  return (
    <Grid.Col span={12} xs={6}>
      <Table striped highlightOnHover withBorder withColumnBorders>
        <tbody>
          <tr>
            <td colSpan={2}>
              <Text weight={600} align="center">
                Category Information
              </Text>
            </td>
          </tr>
          {filteredCategoryDetails.map(([key, value]) => (
            <tr key={key}>
              <td>
                <Text weight={500}>{formatLabel(key)}</Text>
              </td>
              <td>
                <Text
                  maw={300}
                  sx={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {value || " "}
                </Text>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Grid.Col>
  );
};

export default CategoryInformationTable;
