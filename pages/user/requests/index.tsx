// Imports
import Meta from "@/components/Meta/Meta";
import UserApplicationListPage from "@/components/UserApplicationListPage/UserApplicationListPage";

const Page = () => {
  return (
    <>
      <Meta description="User Application List Page" url="/user/requests" />
      <UserApplicationListPage />
    </>
  );
};

export default Page;
Page.Layout = "APP";
