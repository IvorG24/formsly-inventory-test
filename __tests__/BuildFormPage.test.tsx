import BuildFormPage from "@/components/BuildRequestFormPage/BuildRequestFormPage";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { v4 as uuidv4 } from "uuid";

jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@supabase/auth-helpers-nextjs", () => ({
  createPagesBrowserClient: jest.fn(),
}));

const mockTeamMemberList = [
  {
    team_member_id: "d9c6c738-8a60-43de-965f-f1f666da1639",
    team_member_role: "APPROVER",
    team_member_user: {
      user_id: "e82ba7c6-80b2-4604-9bb1-87eb145cad76",
      user_first_name: "Jane",
      user_last_name: "Doe",
    },
  },
  {
    team_member_id: "eb4d3419-b70f-44ba-b88f-c3d983cbcf3b",
    team_member_role: "OWNER",
    team_member_user: {
      user_id: "ae48cd52-d199-4e38-8bb1-42f6993ed929",
      user_first_name: "John",
      user_last_name: "Doe",
    },
  },
  {
    team_member_id: "1e9bb9c7-e4e6-42e4-9377-a33f9b645343",
    team_member_role: "APPROVER",
    team_member_user: {
      user_id: "0bde0339-5a2c-49fc-8120-c4bca60f6bbc",
      user_first_name: "Lorem",
      user_last_name: "Ipsum",
    },
  },
];

const mockFormId = uuidv4();

const mockGroupList = [
  {
    team_group_id: "9f7de2eb-4073-43e6-b662-d688ccba4b26",
    team_group_date_created: "2024-04-03T05:17:02.683Z",
    team_group_name: "REQUESTER",
    team_group_is_disabled: false,
    team_group_team_id: "a5a28977-6956-45c1-a624-b9e90911502e",
  },
  {
    team_group_id: "51277fb9-7f1f-4c80-a122-c3fea3cf3ed7",
    team_group_date_created: "2024-04-03T05:17:02.683Z",
    team_group_name: "PURCHASER",
    team_group_is_disabled: false,
    team_group_team_id: "a5a28977-6956-45c1-a624-b9e90911502e",
  },
  {
    team_group_id: "72ef0fd8-72ef-487d-9b88-ee61ddc3f275",
    team_group_date_created: "2024-04-03T05:17:02.683Z",
    team_group_name: "WAREHOUSE",
    team_group_is_disabled: false,
    team_group_team_id: "a5a28977-6956-45c1-a624-b9e90911502e",
  },
];

describe("BuildFormPage", () => {
  it("renders initial required fields", async () => {
    render(
      <BuildFormPage
        teamMemberList={mockTeamMemberList}
        formId={mockFormId}
        groupList={mockGroupList}
      />
    );
    const formNameInput = screen.getByRole("textbox", { name: /form name/i });
    const descriptionInput = screen.getByRole("textbox", {
      name: /description/i,
    });
    const firstSectionNameInput = screen.getByRole("textbox", {
      name: /sections.0.name/i,
    });

    expect(formNameInput).toBeInTheDocument();
    expect(descriptionInput).toBeInTheDocument();
    expect(firstSectionNameInput).toBeInTheDocument();
  });

  it("renders new field", async () => {
    render(
      <BuildFormPage
        formId={mockFormId}
        groupList={mockGroupList}
      />
    );
    const addNewFieldButton = screen.getByRole("button", {
      name: /add a field/i,
    });
    fireEvent.click(addNewFieldButton);
    const fieldNameInput = await screen.findByLabelText("Name");
    const fieldDescriptionInput = await screen.findByLabelText("Description");
    const fieldSubmitButton = await screen.findByRole("button", {
      name: "Done",
    });
    fireEvent.change(fieldNameInput, { target: { value: "Test Field Name" } });
    fireEvent.change(fieldDescriptionInput, {
      target: { value: "Test Description Field" },
    });
    fireEvent.click(fieldSubmitButton);
    expect(await screen.findByLabelText("Test Field Name")).toBeInTheDocument();
  });

  it("renders new section", async () => {
    render(
      <BuildFormPage
        teamMemberList={mockTeamMemberList}
        formId={mockFormId}
        groupList={mockGroupList}
      />
    );
    const addNewSectionButton = screen.getByRole("button", {
      name: /add new section/i,
    });
    fireEvent.click(addNewSectionButton);
    expect(
      await screen.findByLabelText(/sections.1.name/i)
    ).toBeInTheDocument();
  });
});
