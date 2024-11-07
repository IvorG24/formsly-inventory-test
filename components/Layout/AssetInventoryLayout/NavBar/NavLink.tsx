import { Button, Text } from "@mantine/core";
import { usePathname } from "next/navigation";
import { MouseEventHandler, ReactNode } from "react";

type Props = {
  icon: ReactNode;
  label: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  isCollapsed?: boolean;
  link?: string;
  type?: string;
};

const Navlink = ({
  icon,
  label,
  isCollapsed,
  onClick,
  link,
  type = "sublink",
}: Props) => {
  const pathname = usePathname();
  const margin = type === "link" ? 5 : 10;
  return (
    <Button
      onClick={onClick}
      variant="subtle"
      leftIcon={icon}
      fullWidth
      mih={50}
      mah={50}
      ml={margin}
      styles={(theme) => ({
        root: {
          backgroundColor:
            pathname === link ? theme.colors.blue[1] : "transparent",
          color:
            pathname === link
              ? theme.colors.blue[7]
              : type === "link"
                ? theme.colorScheme === "dark"
                  ? theme.colors.gray[5]
                  : theme.colors.dark[7]
                : theme.colorScheme === "dark"
                  ? theme.colors.gray[0]
                  : theme.colors.dark[7],

          ...(type === "link" && {
            "&:hover": {
              backgroundColor:
                theme.colorScheme === "dark"
                  ? theme.colors.dark[5]
                  : theme.colors.blue[0],
            },
          }),
        },
        inner: {
          justifyContent: "flex-start",
        },
      })}
    >
      <Text fw={type === "link" ? 500 : 400} size="sm">
        {isCollapsed ? null : label}
      </Text>
    </Button>
  );
};

export default Navlink;
