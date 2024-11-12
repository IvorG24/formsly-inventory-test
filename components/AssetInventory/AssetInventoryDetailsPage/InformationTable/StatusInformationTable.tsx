import { isExcludedKey } from "@/utils/constant";
import { formatLabel } from "@/utils/functions";
import { InventoryListType } from "@/utils/types";
import { Badge, Grid, Table, Text } from "@mantine/core";
import { useMemo } from "react";

type Props = {
  asset_details: InventoryListType;
};

const filterStatusDetails = (detail: InventoryListType) => {
  return Object.entries(detail).filter(
    ([key, value]) =>
      !isExcludedKey(key) &&
      value &&
      [
        "inventory_request_created_by",
        "inventory_request_assigned_to",
        "inventory_request_status",
        "inventory_request_notes",
      ].includes(key)
  );
};

const StatusInformationTable = ({ asset_details }: Props) => {
  const filteredStatusDetails = useMemo(
    () => filterStatusDetails(asset_details),
    [asset_details]
  );

  return (
    <Grid.Col maw={300} span={12} xs={6}>
      <Table striped highlightOnHover withBorder withColumnBorders>
        <tbody>
          {/* Status Information Section */}
          <tr>
            <td colSpan={2}>
              <Text weight={600} align="center">
                Status Information
              </Text>
            </td>
          </tr>
          <tr>
            <td>
              <Text weight={500}>Created By</Text>
            </td>
            <td>
              <Text truncate>
                {asset_details.request_creator_first_name || "N/A"}{" "}
                {asset_details.request_creator_last_name || "N/A"}
              </Text>
            </td>
          </tr>
          <tr>
            <td>
              <Text weight={500}>Assigned To</Text>
            </td>
            <td>
              <Text>
                {asset_details.site_name ? asset_details.site_name : ""}
                {asset_details.site_name && asset_details.customer_name
                  ? " "
                  : ""}
                {asset_details.customer_name ? asset_details.customer_name : ""}
                {(asset_details.site_name || asset_details.customer_name) &&
                (asset_details.assignee_first_name ||
                  asset_details.assignee_last_name)
                  ? " "
                  : ""}
                {asset_details.assignee_first_name
                  ? asset_details.assignee_first_name
                  : ""}
                {asset_details.assignee_first_name &&
                asset_details.assignee_last_name
                  ? " "
                  : ""}
                {asset_details.assignee_last_name
                  ? asset_details.assignee_last_name
                  : ""}
              </Text>
            </td>
          </tr>
          {filteredStatusDetails.map(([key, value]) => (
            <tr key={key}>
              <td>
                <Text weight={500}>{formatLabel(key)}</Text>
              </td>
              <td>
                {key === "inventory_request_status" ? (
                  <Badge
                    sx={{
                      backgroundColor:
                        asset_details.inventory_request_status_color || "gray",
                      color: "#fff",
                    }}
                  >
                    {value || "N/A"}
                  </Badge>
                ) : (
                  <Text
                    maw={300}
                    sx={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {value || "N/A"}
                  </Text>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Grid.Col>
  );
};

export default StatusInformationTable;
