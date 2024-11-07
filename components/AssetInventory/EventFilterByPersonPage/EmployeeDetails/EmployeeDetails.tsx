import { InventoryEmployeeList } from "@/utils/types";
import { Accordion, Paper, Table, Text } from "@mantine/core";

type Props = {
  employee: InventoryEmployeeList;
};

const EmployeeDetails = ({ employee }: Props) => {
  return (
    <Accordion>
      <Accordion.Item value="employee-info">
        <Accordion.Control>
          <Text fw={600}>Employee Information</Text>
        </Accordion.Control>
        <Accordion.Panel>
          <Paper withBorder p="md">
            <Table striped highlightOnHover withBorder withColumnBorders>
              <tbody>
                <tr>
                  <td style={{ width: "25%" }}>
                    <strong>Employee ID:</strong>
                  </td>
                  <td style={{ width: "25%" }}>
                    {employee.scic_employee_hris_id_number}
                  </td>
                  <td style={{ width: "25%" }}>
                    <strong>Suffix:</strong>
                  </td>
                  <td style={{ width: "25%" }}>
                    {employee.scic_employee_suffix}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>First Name:</strong>
                  </td>
                  <td>{employee.scic_employee_first_name}</td>
                  <td>
                    <strong>Site:</strong>
                  </td>
                  <td>{employee.site}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Middle Name:</strong>
                  </td>
                  <td>{employee.scic_employee_middle_name}</td>
                  <td>
                    <strong>Location:</strong>
                  </td>
                  <td>{employee.location}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Last Name:</strong>
                  </td>
                  <td>{employee.scic_employee_last_name}</td>
                  <td>
                    <strong>Department:</strong>
                  </td>
                  <td>{employee.department}</td>
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
