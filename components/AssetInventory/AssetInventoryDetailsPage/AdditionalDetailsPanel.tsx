import { formatDate } from "@/utils/constant";
import { InventoryListType } from "@/utils/types";
import { Card, Table, Text } from "@mantine/core";
type Props = {
  detail: InventoryListType;
};
const AdditionalDetailsPanel = ({ detail }: Props) => {
  return (
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
  );
};

export default AdditionalDetailsPanel;
