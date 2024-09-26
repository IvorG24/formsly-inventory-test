import { ActionIcon, Tooltip } from "@mantine/core";
import { IconLayoutSidebar } from "@tabler/icons-react";
import { Dispatch, SetStateAction } from "react";

type Props = {
  openNavbar: boolean;
  setOpenNavbar: Dispatch<SetStateAction<boolean>>;
};

const NavbarButton = ({ setOpenNavbar }: Props) => {
  return (
    <Tooltip label="Open/Close Sidebar">
      <ActionIcon
        p={0}
        color="dark"
        size={28}
        onClick={() => setOpenNavbar((open) => !open)}
      >
        <IconLayoutSidebar stroke={1} size={28} />
      </ActionIcon>
    </Tooltip>
  );
};

export default NavbarButton;
