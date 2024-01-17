import { Container, Paper, Stack } from "@mantine/core";
import CategoryLookup from "./CategoryLookup/CategoryLookup";

const OtherExpensesLookup = () => {
  const serviceLookupList = [
    { table: "other_expenses_category", label: "Category" },
    { table: "general_unit_of_measurement", label: "Unit of Measurement" },
    { table: "supplier", label: "Supplier" },
  ] as { table: string; label: string }[];

  return (
    <Container p={0} fluid pos="relative">
      <Stack>
        {serviceLookupList.map((lookup, index) => (
          <Paper p="xl" shadow="xs" key={index}>
            <CategoryLookup lookup={lookup} />
          </Paper>
        ))}
      </Stack>
    </Container>
  );
};

export default OtherExpensesLookup;
