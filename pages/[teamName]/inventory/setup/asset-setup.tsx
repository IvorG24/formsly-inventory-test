// Imports
import { getCategoryOptions, getCustomFieldData } from "@/backend/api/get";
import AssetSetupPage from "@/components/AssetInventory/AssetSetupPage/AssetSetupPage";
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
        sectionId: "74263b1b-af2d-44b7-849f-ea6bd62c392f",
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
        description="Asset Setup Page"
        url="/teamName/inventory/setup/asset-setup"
      />
      <AssetSetupPage
        field={field}
        securityGroup={securityGroupData}
        categoryOptions={categoryOptions}
      />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
