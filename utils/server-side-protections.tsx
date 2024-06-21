import {
  checkIfOwnerOrAdmin,
  getRequestTeamId,
  getTeam,
  getUserActiveTeamId,
} from "@/backend/api/get";
import { checkIfEmailExists } from "@/backend/api/post";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { SupabaseClient, User } from "@supabase/supabase-js";
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from "next";

import { SIGN_IN_PAGE_PATH } from "./constant";
import { Database } from "./database";
import { formatTeamNameToUrlKey, isUUID } from "./string";
import { TeamTableRow } from "./types";

export const withAuth = <P extends { [key: string]: any }>(
  getServerSidePropsFunc: (params: {
    context: GetServerSidePropsContext;
    supabaseClient: SupabaseClient<Database>;
    user: User;
  }) => Promise<GetServerSidePropsResult<P>>
): GetServerSideProps<P> => {
  return async (
    context: GetServerSidePropsContext
  ): Promise<GetServerSidePropsResult<P>> => {
    const supabaseClient = createPagesServerClient(context);

    try {
      // * 1. Check if user is authenticated
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      if (!session) {
        return {
          redirect: {
            destination: SIGN_IN_PAGE_PATH,
            permanent: false,
          },
        };
      }

      const user = session.user;
      if (!user) throw new Error("No email in session");

      return await getServerSidePropsFunc({ context, supabaseClient, user });
    } catch (error) {
      console.error(error);
      return {
        redirect: {
          destination: "/500",
          permanent: false,
        },
      };
    }
  };
};

export const withAuthAndOnboarding = <P extends { [key: string]: any }>(
  getServerSidePropsFunc: (params: {
    context: GetServerSidePropsContext;
    supabaseClient: SupabaseClient<Database>;
    user: User;
  }) => Promise<GetServerSidePropsResult<P>>
): GetServerSideProps<P> => {
  return async (
    context: GetServerSidePropsContext
  ): Promise<GetServerSidePropsResult<P>> => {
    const supabaseClient = createPagesServerClient(context);

    try {
      // * 1. Check if user is authenticated
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      if (!session) {
        return {
          redirect: {
            destination: SIGN_IN_PAGE_PATH,
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

      const user = session.user;

      return getServerSidePropsFunc({ context, supabaseClient, user });
    } catch (error) {
      console.error(error);
      return {
        redirect: {
          destination: "/500",
          permanent: false,
        },
      };
    }
  };
};

export const withOwnerOrApprover = <P extends { [key: string]: any }>(
  getServerSidePropsFunc: (params: {
    context: GetServerSidePropsContext;
    supabaseClient: SupabaseClient<Database>;
    user: User;
    teamId: string;
  }) => Promise<GetServerSidePropsResult<P>>
): GetServerSideProps<P> => {
  return async (
    context: GetServerSidePropsContext
  ): Promise<GetServerSidePropsResult<P>> => {
    const supabaseClient = createPagesServerClient(context);

    try {
      // * 1. Check if user is authenticated
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      if (!session) {
        return {
          redirect: {
            destination: SIGN_IN_PAGE_PATH,
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

      const user = session.user;

      // * 3. Check if user is approver or owner
      const teamId = await getUserActiveTeamId(supabaseClient, {
        userId: user.id,
      });
      if (!teamId) throw new Error("No team found");
      const isOwnerOrApprover = await checkIfOwnerOrAdmin(supabaseClient, {
        userId: user.id,
        teamId: teamId,
      });
      if (!isOwnerOrApprover)
        throw new Error("User is not an owner or approver");

      return getServerSidePropsFunc({ context, supabaseClient, user, teamId });
    } catch (error) {
      console.error(error);
      return {
        redirect: {
          destination: "/500",
          permanent: false,
        },
      };
    }
  };
};

export const withAuthAndOnboardingRequestPage = <
  P extends { [key: string]: any }
>(
  getServerSidePropsFunc: (params: {
    context: GetServerSidePropsContext;
    supabaseClient: SupabaseClient<Database>;
    user: User;
    teamId: string;
  }) => Promise<GetServerSidePropsResult<P>>
): GetServerSideProps<P> => {
  return async (
    context: GetServerSidePropsContext
  ): Promise<GetServerSidePropsResult<P>> => {
    const supabaseClient = createPagesServerClient(context);

    try {
      // * 1. Check if user is authenticated
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
            destination: "/create-team",
            permanent: false,
          },
        };
      }

      // * 4. Check if user is a member

      const userActiveTeam = await getTeam(supabaseClient, { teamId });

      if (!userActiveTeam) {
        return {
          redirect: {
            destination: "/create-team",
            permanent: false,
          },
        };
      }

      let isUserOnCorrectTeam =
        context.query.teamName ===
        formatTeamNameToUrlKey(userActiveTeam.team_name);

      if (context.query.requestId && isUUID(`${context.query.requestId}`)) {
        const requestTeamId = await getRequestTeamId(supabaseClient, {
          requestId: `${context.query.requestId}`,
        });

        if (requestTeamId) {
          isUserOnCorrectTeam = requestTeamId === userActiveTeam.team_id;
        }
      }

      if (!isUserOnCorrectTeam) {
        return {
          redirect: {
            destination: `/${formatTeamNameToUrlKey(
              userActiveTeam.team_name
            )}/requests`,
            permanent: false,
          },
        };
      }

      return getServerSidePropsFunc({ context, supabaseClient, user, teamId });
    } catch (error) {
      console.error(error);
      return {
        redirect: {
          destination: "/500",
          permanent: false,
        },
      };
    }
  };
};

export const withActiveTeam = <P extends { [key: string]: any }>(
  getServerSidePropsFunc: (params: {
    context: GetServerSidePropsContext;
    supabaseClient: SupabaseClient<Database>;
    user: User;
    userActiveTeam: TeamTableRow;
  }) => Promise<GetServerSidePropsResult<P>>
): GetServerSideProps<P> => {
  return async (
    context: GetServerSidePropsContext
  ): Promise<GetServerSidePropsResult<P>> => {
    const supabaseClient = createPagesServerClient(context);

    try {
      // * 1. Check if user is authenticated
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      if (!session) {
        return {
          redirect: {
            destination: SIGN_IN_PAGE_PATH,
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

      const user = session.user;

      // * 3. Check if user has active team

      const teamId = await getUserActiveTeamId(supabaseClient, {
        userId: user.id,
      });

      if (!teamId) {
        return {
          redirect: {
            destination: "/create-team",
            permanent: false,
          },
        };
      }

      // * 4. Check if user active team match router active team

      const userActiveTeam = await getTeam(supabaseClient, { teamId });

      if (!userActiveTeam) {
        return {
          redirect: {
            destination: "/create-team",
            permanent: false,
          },
        };
      }

      const isUserMember =
        context.query.teamName ===
        formatTeamNameToUrlKey(userActiveTeam.team_name);

      if (!isUserMember) {
        return {
          redirect: {
            destination: `/${formatTeamNameToUrlKey(
              userActiveTeam.team_name
            )}/requests`,
            permanent: false,
          },
        };
      }
  
      return getServerSidePropsFunc({
        context,
        supabaseClient,
        user,
        userActiveTeam,
      });
    } catch (error) {
      console.error(error);
      return {
        redirect: {
          destination: "/500",
          permanent: false,
        },
      };
    }
  };
};
