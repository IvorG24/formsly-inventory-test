import { formatDate } from "@/utils/constant";
import { InventoryListType } from "@/utils/types";
import { Card, Stack, Table, Text } from "@mantine/core";
type Props = {
  detail: InventoryListType;
};
const AdditionalDetailsPanel = ({ detail }: Props) => {
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
          Miscellanious Information
        </Text>
        <Table striped highlightOnHover withBorder withColumnBorders>
          <tbody>
            <tr>
              <td>
                <Text weight={500}>Item Nav Order</Text>
              </td>
              <td>{detail.inventory_request_item_code}</td>
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
          </tbody>
        </Table>
      </Card>
    </Stack>
  );
};

export default AdditionalDetailsPanel;
