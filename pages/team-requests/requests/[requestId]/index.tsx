import {
  getRequestFormslyId,
  getTeam,
  getUserActiveTeamId,
} from "@/backend/api/get";
import { checkIfEmailExists } from "@/backend/api/post";
import { formatTeamNameToUrlKey } from "@/utils/string";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // * 1. Check if user is authenticated
    const supabaseClient = createPagesServerClient(context);
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    if (!session) {
      return {
        redirect: {
          destination: `/public-request/${context.query.requestId}`,
          permanent: false,
        },
      };
    }
    if (!session?.user?.email) throw new Error("No email in session");

    // * 2. Check if user is onboarded
    if (
      !(await checkIfEmailExists(supabaseClient, {
        email: session.user.email,
      }))
    ) {
      return {
        redirect: {
          destination: "/onboarding",
          permanent: false,
        },
      };
    }

    // * 3. Check if user has active team
    const user = session.user;

    const teamId = await getUserActiveTeamId(supabaseClient, {
      userId: user.id,
    });

    if (!teamId) {
      return {
        redirect: {
          destination: "/user/join-team",
          permanent: false,
        },
      };
    }

    const activeTeam = await getTeam(supabaseClient, { teamId });
    const formslyId = await getRequestFormslyId(supabaseClient, {
      requestId: `${context.query.requestId}`,
    });

    if (activeTeam) {
      return {
        redirect: {
          destination: `/${formatTeamNameToUrlKey(
            activeTeam.team_name
          )}/requests/${formslyId}`,
          permanent: false,
        },
      };
    }

    return {
      props: {},
    };
  } catch (e) {
    return {
      redirect: {
        destination: "/500",
        permanent: false,
      },
    };
  }
};

const Page = () => {
  return null;
};

export default Page;
Page.Layout = "APP";
