// Imports
import { getCategoryOptions, getCustomFieldData } from "@/backend/api/get";
import CustomerSetupPage from "@/components/AssetInventory/CustomerSetupPage/CustomerSetupPage";
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
        sectionId: "db8f19ab-30f0-4485-8719-7c0525b79b0f",
        isCustomField: false,
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
        description="Customer Setup Page"
        url="/teamName/inventory/setup/customer-setup"
      />
      <CustomerSetupPage
        field={field}
        securityGroup={securityGroupData}
        categoryOptions={categoryOptions}
      />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
