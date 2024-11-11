import { InventoryCustomerRow } from "@/utils/types";
import { Accordion, Paper, Table, Text } from "@mantine/core";

type Props = {
  customer: InventoryCustomerRow;
};

const EmployeeDetails = ({ customer }: Props) => {
  return (
    <Accordion>
      <Accordion.Item value="employee-info">
        <Accordion.Control>
          <Text fw={600}>Customer Information</Text>
        </Accordion.Control>
        <Accordion.Panel>
          <Paper withBorder p="md">
            <Table striped highlightOnHover withBorder withColumnBorders>
              <tbody>
                <tr>
                  <td>
                    <strong>Customer Company:</strong>
                    <div>{customer.customer_company}</div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>First Name:</strong>
                    <div>{customer.customer_first_name}</div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Last Name:</strong>
                    <div>{customer.customer_last_name}</div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Suffix:</strong>
                    <div>{customer.customer_suffix}</div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Customer Email:</strong>
                    <div>{customer.customer_email}</div>
                  </td>
                </tr>
              </tbody>
            </Table>
          </Paper>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
};

export default EmployeeDetails;
