import { Box, Container, Paper } from "@mantine/core";
import RequsitionSearch from "../ItemSearch";
import ItemTab from "../ItemTab/ItemTab";
import RequestResponseSection from "./ResponseSection/RequestResponseSection";
import SearchKeywordResponse from "./SearchKeywordResponse";

type ResponseTabProps = {
  selectedForm: string | null;
  isRequsitionForm: boolean;
};

const ResponseTab = ({
  selectedForm,
  isRequsitionForm,
}: 
ResponseTabProps) => {
 
  return (
    <Container p={0} pos="relative">
      <Paper p="md" pos="relative">
        {isRequsitionForm ? (
          <RequsitionSearch />
        ) : (
          <SearchKeywordResponse selectedForm={selectedForm} />
        )}
      </Paper>
      <Box>
        {isRequsitionForm ? (
          <Box mt="md">
            <ItemTab fieldResponseData={[]} />
          </Box>
        ) : (
          <RequestResponseSection requestResponse={[]} />
        )}
      </Box>
    </Container>
  );
};

export default ResponseTab;
