import Error503Page from "@/components/ErrorPageList/Error503Page";
import Meta from "@/components/Meta/Meta";

const InternalServerErrorPage = () => {
  return (
    <>
      <Meta description="Service Unavailable Page" url="/503" />
      <Error503Page />
    </>
  );
};

export default InternalServerErrorPage;
