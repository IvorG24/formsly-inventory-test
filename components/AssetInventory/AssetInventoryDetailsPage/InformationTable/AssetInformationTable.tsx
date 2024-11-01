import { isExcludedKey } from "@/utils/constant";
import { formatLabel } from "@/utils/functions";
import { InventoryListType } from "@/utils/types";
import { Grid, Table, Text } from "@mantine/core";
import { useMemo } from "react";

type Props = {
  asset_details: InventoryListType;
};

const filterAssetDetails = (detail: InventoryListType) => {
  return Object.entries(detail).filter(
    ([key, value]) =>
      !isExcludedKey(key) &&
      value &&
      [
        "inventory_request_tag_id",
        "inventory_request_description",
        "inventory_request_equipment_type",
        "inventory_request_brand",
        "inventory_request_model",
        "inventory_request_site",
        "inventory_request_location",
        "inventory_request_department",
      ].includes(key)
  );
};

const AssetInformationTable = ({ asset_details }: Props) => {
  const filteredDetails = useMemo(() => {
    if (!asset_details) return [];
    return filterAssetDetails(asset_details);
  }, [asset_details]);

  return (
    <Grid.Col span={12} xs={6}>
      <Table striped highlightOnHover withBorder withColumnBorders>
        <tbody>
          {/* Asset Information Section */}
          <tr>
            <td colSpan={2}>
              <Text weight={600} align="center">
                Asset Information
              </Text>
            </td>
          </tr>
          {filteredDetails.map(([key, value]) => (
            <tr key={key}>
              <td>
                <Text weight={500}>{formatLabel(key)}</Text>
              </td>
              <td>{value || "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Grid.Col>
  );
};

export default AssetInformationTable;
