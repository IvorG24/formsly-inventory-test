import { Button } from "@mantine/core";
import { usePathname } from "next/navigation";
import { MouseEventHandler, ReactNode } from "react";

type Props = {
  icon: ReactNode;
  label: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  isCollapsed?: boolean;
  link?: string;
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
      styles={(theme) => ({
        root: {
          backgroundColor:
            pathname === link ? theme.colors.blue[1] : "transparent",
          color:
            pathname === link
              ? theme.colors.blue[7]
              : theme.colorScheme === "dark"
                ? theme.colors.gray[0]
                : theme.colors.dark[7],
        },
        inner: {
          justifyContent: "flex-start",
        },
      })}
    >
      {isCollapsed ? null : label}
    </Button>
  );
};

export default Navlink;
