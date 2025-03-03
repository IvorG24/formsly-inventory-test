import { checkIfEmailExists } from "@/backend/api/post";
import Meta from "@/components/Meta/Meta";
import OnboardingPage from "@/components/OnboardingPage/OnboardingPage";
import { withAuth } from "@/utils/server-side-protections";
import { User } from "@supabase/auth-helpers-nextjs";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withAuth(
  async ({ supabaseClient, user }) => {
    try {
      if (
        await checkIfEmailExists(supabaseClient, {
          email: user.email || "",
        })
      ) {
        return {
          redirect: {
            destination: "/userActiveTeam",
            permanent: false,
          },
        };
      }

      return {
        props: { user: user },
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
  user: User;
};

const Page = ({ user }: Props) => {
  return (
    <>
      <Meta description="Onboarding Page" url="/onboarding" />
      <OnboardingPage user={user} />
    </>
  );
};

export default Page;
Page.Layout = "ONBOARDING";
