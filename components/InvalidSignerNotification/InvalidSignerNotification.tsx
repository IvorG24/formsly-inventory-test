import { Text } from "@mantine/core";
import Link from "next/link";

const InvalidSignerNotification = () => {
  return (
    <Text>
      Please create a JIRA ticket in order for an admin to assigned a signer to
      your project. Just click this{" "}
      <Link
        href={
          "https://scic.atlassian.net/servicedesk/customer/portal/3/group/74"
        }
      >
        link
      </Link>{" "}
      to proceed.
    </Text>
  );
};

export default InvalidSignerNotification;
