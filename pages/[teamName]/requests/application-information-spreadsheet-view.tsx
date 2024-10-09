import {
  checkIfGroupMember,
  getFormSectionWithFieldList,
} from "@/backend/api/get";
import ApplicationInformationSpreadsheetView from "@/components/ApplicationInformationSpreadsheetView/ApplicationInformationSpreadsheetView";
import Meta from "@/components/Meta/Meta";
import { withActiveTeam } from "@/utils/server-side-protections";
import {
  ApplicationInformationFieldOptionType,
  OptionType,
  SectionWithFieldType,
} from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveTeam(
  async ({ supabaseClient, user, userActiveTeam }) => {
    try {
      const iSHumanResourcesMember = await checkIfGroupMember(supabaseClient, {
        userId: user.id,
        groupName: ["HUMAN RESOURCES", "HUMAN RESOURCES VIEWER"],
        teamId: userActiveTeam.team_id,
      });
      if (!iSHumanResourcesMember) {
        return {
          redirect: {
            destination: "/401",
            permanent: false,
          },
        };
      }

      const data = await getFormSectionWithFieldList(supabaseClient, {
        formId: "16ae1f62-c553-4b0e-909a-003d92828036",
        userId: user.id,
        teamId: userActiveTeam.team_id,
      });
      return {
        props: { ...data },
      };
    } catch (e) {
      return {
        redirect: {
          destination: "/500",
          permanent: false,
        },
      };
    }
  }
);

type Props = {
  sectionList: SectionWithFieldType[];
  optionList: ApplicationInformationFieldOptionType[];
  approverOptionList: OptionType[];
};

const Page = ({ sectionList, optionList, approverOptionList }: Props) => {
  const filteredSectionList = sectionList
    .filter((section) =>
      ["Header", "Personal Information"].includes(section.section_name)
    )
    .map((section) => {
      const filteredFields = section.section_field.filter((field) =>
        [
          "0fd115df-c2fe-4375-b5cf-6f899b47ec56",
          "e48e7297-c250-4595-ba61-2945bf559a25",
          "7ebb72a0-9a97-4701-bf7c-5c45cd51fbce",
          "9322b870-a0a1-4788-93f0-2895be713f9c",
        ].includes(field.field_id)
      );
      return {
        ...section,
        section_field: filteredFields,
      };
    });

  return (
    <>
      <Meta
        description="Application Information View Page"
        url="/{teamName}/requests/application-information-spreadsheet-view"
      />
      <ApplicationInformationSpreadsheetView
        sectionList={filteredSectionList}
        optionList={optionList}
        approverOptionList={approverOptionList}
      />
    </>
  );
};

export default Page;
Page.Layout = "APP";
