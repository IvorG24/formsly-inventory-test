import { Button } from "@mantine/core";
import { usePathname } from "next/navigation";
import { MouseEventHandler, ReactNode } from "react";

type Props = {
  icon: ReactNode;
  label: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  isCollapsed?: boolean;
  link: string;
};

const Navlink = ({ icon, label, isCollapsed, onClick, link }: Props) => {
  const pathname = usePathname();
  return (
    <Button
      onClick={onClick}
      variant="subtle"
      leftIcon={icon}
      fullWidth
      mih={50}
      mah={50}
      fw={400}
      styles={{
        root: {
          backgroundColor: `${pathname === link ? "#D0EBFF" : "transparent"}`,
          color: `${pathname === link ? "#1864AB" : "#212529"}`,
        },
        inner: {
          justifyContent: "flex-start",
        },
      }}
    >
      {isCollapsed ? null : label}
    </Button>
  );
};

export default Navlink;
