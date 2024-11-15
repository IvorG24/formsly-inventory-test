import { getTeamInvoiceOnload } from "@/backend/api/get";
import Meta from "@/components/Meta/Meta";
import TeamInvoicePage from "@/components/TeamInvoicePage/TeamInvoicePage";
import { withActiveTeam } from "@/utils/server-side-protections";
import moment from "moment";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveTeam(
  async ({ supabaseClient, userActiveTeam, user }) => {
    try {
      if (user.id !== userActiveTeam.team_user_id) {
        return {
          redirect: {
            destination: "/401",
            permanent: false,
          },
        };
      }

      const { currentDate, expirationDate, price } = await getTeamInvoiceOnload(
        supabaseClient,
        {
          teamId: userActiveTeam.team_id,
          teamDateCreated:
            userActiveTeam.team_id === "a5a28977-6956-45c1-a624-b9e90911502e"
              ? "06/01/2024"
              : userActiveTeam.team_date_created,
        }
      );

      let outstandingBalance = 0;
      const difference = moment(currentDate).diff(
        moment(expirationDate),
        "months",
        true
      );
      if (difference > 0) {
        outstandingBalance = Math.ceil(difference) * price;
      }
      return {
        props: {
          currentDate,
          expirationDate,
          outstandingBalance,
          price,
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
  outstandingBalance: number;
  expirationDate: string;
  currentDate: string;
  price: number;
};

const Page = ({
  outstandingBalance,
  expirationDate,
  currentDate,
  price,
}: Props) => {
  return (
    <>
      <Meta description="Team Invoice Page" url="/teamName/invoice" />
      <TeamInvoicePage
        outstandingBalance={outstandingBalance}
        expirationDate={expirationDate}
        currentDate={currentDate}
        price={price}
      />
    </>
  );
};

export default Page;
Page.Layout = "APP";
