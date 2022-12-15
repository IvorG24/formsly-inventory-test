// todo:fix tables on mobile
// todo: create unit test
import Table from "@/components/Table/Table";
import { FetchTeamRequestFormList } from "@/utils/queries";
import { Checkbox, Text } from "@mantine/core";
import FormsRow from "./FormsRow";

type Props = {
  colorScheme: "light" | "dark";
  formList: FetchTeamRequestFormList["teamRequestFormList"];
};

const FormsTable = ({ formList }: Props) => {
  return (
    <Table mt="lg">
      <thead>
        <tr>
          <th>
            <Checkbox size="xs" label={<Text>Id</Text>} />
          </th>
          <th>Title</th>
          <th>Status</th>
          <th>Date Created</th>
        </tr>
      </thead>
      <tbody>
        {formList.map((form) => (
          <FormsRow key={form.form_id} form={form} />
        ))}
      </tbody>
    </Table>
  );
};

export default FormsTable;
