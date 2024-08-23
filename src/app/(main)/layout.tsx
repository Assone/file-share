import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import type { PropsWithChildren } from "react";

const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between p-2">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link href="/local" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Local
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link href="/room" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Remote
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <Separator />

      <div className="flex-1">{children}</div>
    </div>
  );
};

export default Layout;
