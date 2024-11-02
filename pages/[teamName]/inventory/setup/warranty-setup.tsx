// Imports
import { getCategoryOptions, getCustomFieldData } from "@/backend/api/get";
import WarrantySetupPage from "@/components/AssetInventory/WarrantySetupPage/WarrantySetupPage";
import Meta from "@/components/Meta/Meta";
import { withActiveGroup } from "@/utils/server-side-protections";
import {
  CategoryTableRow,
  InventoryFieldRow,
  SecurityGroupData,
} from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveGroup(
  async ({ supabaseClient, userActiveTeam, securityGroupData }) => {
    try {
      const { data: categoryOptions } = await getCategoryOptions(
        supabaseClient,
        {
          teamId: userActiveTeam.team_id,
        }
      );

      const { data: field } = await getCustomFieldData(supabaseClient, {
        sectionId: "2ea35523-46ea-4376-95b3-89be0f167b95",
        mode: "default",
      });

      const hasViewOnlyPersmissions =
        securityGroupData.privileges.customField.view === true;

      if (!hasViewOnlyPersmissions) {
        return {
          redirect: {
            destination: "/500",
            permanent: false,
          },
        };
      }

      return {
        props: {
          categoryOptions,
          securityGroupData,
          field,
        },
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
  categoryOptions: CategoryTableRow[];
  securityGroupData: SecurityGroupData;
  field: InventoryFieldRow[];
};
const Page = ({ securityGroupData, categoryOptions, field }: Props) => {
  return (
    <>
      <Meta
        description="Warranty Setup Page"
        url="/teamName/inventory/setup/warranty-setup"
      />
      <WarrantySetupPage
        field={field}
        securityGroup={securityGroupData}
        categoryOptions={categoryOptions}
      />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
