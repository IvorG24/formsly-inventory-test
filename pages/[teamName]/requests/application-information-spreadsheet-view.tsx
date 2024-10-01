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
        groupName: "HUMAN RESOURCES",
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
  return (
    <>
      <Meta
        description="Application Information View Page"
        url="/{teamName}/requests/application-information-spreadsheet-view"
      />
      <ApplicationInformationSpreadsheetView
        sectionList={sectionList}
        optionList={optionList}
        approverOptionList={approverOptionList}
      />
    </>
  );
};

export default Page;
Page.Layout = "APP";
