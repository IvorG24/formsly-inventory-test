import { formatDate, isExcludedKey } from "@/utils/constant";
import { formatLabel } from "@/utils/functions";
import { InventoryListType } from "@/utils/types";
import { Card, Stack, Table, Text } from "@mantine/core";
import { useMemo } from "react";

type Props = {
  detail: InventoryListType;
};

const filterCustomFields = ([key, value]: [string, unknown]) =>
  !isExcludedKey(key) &&
  value &&
  !key.startsWith("inventory_request_") &&
  !key.startsWith("relationship_type") &&
  !key.startsWith("site_name") &&
  !key.startsWith("customer_name");

const AdditionalDetailsPanel = ({ detail }: Props) => {
  const customFields = useMemo(
    () =>
      Object.entries(detail)
        .filter(filterCustomFields)
        .map(([key, value]) => (
          <tr key={key}>
            <td>
              <Text weight={500}>{formatLabel(key)}</Text>
            </td>
            <td>{value ?? "N/A"}</td>
          </tr>
        )),
    [detail]
  );

  return (
    <Stack>
      <Card withBorder shadow="sm">
        <Text size="lg" weight={500}>
          Purchase Information
        </Text>
        <Table striped highlightOnHover withBorder withColumnBorders>
          <tbody>
            <tr>
              <td>
                <Text weight={500}>Purchase Order</Text>
              </td>
              <td>{detail.inventory_request_purchase_order || "N/A"}</td>
              <td>
                <Text weight={500}>Purchased From</Text>
              </td>
              <td>{detail.inventory_request_purchase_from || "N/A"}</td>
            </tr>
            <tr>
              <td>
                <Text weight={500}>Purchase Date</Text>
              </td>
              <td>
                {formatDate(new Date(detail.inventory_request_purchase_date)) ||
                  ""}
              </td>
              <td>
                <Text weight={500}>Cost</Text>
              </td>
              <td>
                ₱
                {Number(detail.inventory_request_cost).toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>
          </tbody>
        </Table>
      </Card>

      <Card withBorder shadow="sm">
        <Text size="lg" weight={500}>
          Miscellaneous Information
        </Text>
        <Table striped highlightOnHover withBorder withColumnBorders>
          <tbody>
            <tr>
              <td>
                <Text weight={500}>CSI Item Code</Text>
              </td>
              <td>{detail.inventory_request_csi_code}</td>
            </tr>
            <tr>
              <td>
                <Text weight={500}>SI No / DR No. / WR From</Text>
              </td>
              <td>{detail.inventory_request_si_number}</td>
            </tr>
            <tr>
              <td>
                <Text weight={500}>Serial Number</Text>
              </td>
              <td>{detail.inventory_request_serial_number}</td>
            </tr>
            {detail.inventory_request_old_asset_number && (
              <tr>
                <td>
                  <Text weight={500}>Old Asset Number</Text>
                </td>
                <td>{detail.inventory_request_old_asset_number}</td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>
      {customFields.length > 0 && (
        <Card withBorder shadow="sm">
          <Text size="lg" weight={500}>
            Custom Field
          </Text>
          <Table striped highlightOnHover withBorder withColumnBorders>
            <tbody>{customFields}</tbody>
          </Table>
        </Card>
      )}
    </Stack>
  );
};

export default AdditionalDetailsPanel;
