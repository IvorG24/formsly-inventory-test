import {
  checkIfGroupMember,
  getHRSpreadsheetViewOnLoad,
} from "@/backend/api/get";
import BackgroundCheckSpreadsheetView from "@/components/BackgroundCheckSpreadsheetView/BackgroundCheckSpreadsheetView";
import Meta from "@/components/Meta/Meta";
import { withActiveTeam } from "@/utils/server-side-protections";
import { OptionType } from "@/utils/types";
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

      const data = await getHRSpreadsheetViewOnLoad(supabaseClient, {
        teamId: userActiveTeam.team_id,
      });

      return {
        props: data,
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
  positionOptionList: OptionType[];
  hrOptionList: OptionType[];
};

const Page = ({ positionOptionList, hrOptionList }: Props) => {
  return (
    <>
      <Meta
        description="Background Check Spreadsheet View Page"
        url="/{teamName}/requests/background-check-spreadsheet-view"
      />
      <BackgroundCheckSpreadsheetView
        positionOptionList={positionOptionList}
        hrOptionList={hrOptionList}
      />
    </>
  );
};

export default Page;
Page.Layout = "APP";
