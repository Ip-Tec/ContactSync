// This file is a fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight } from "expo-symbols";
import React from "react";
import {
  OpaqueColorValue,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";

// Add your SFSymbol to MaterialIcons mappings here.
const MAPPING = {
  // See MaterialIcons here: https://icons.expo.fyi
  // See SF Symbols in the SF Symbols app on Mac.
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "plus.message.fill": "add",
  "person.fill": "person",
  "building.2.fill": "house",
  "note.text.fill": "note-text",
  "gift.fill": "gift",
  "map.fill": "map",
  "envelope.fill": "email",
  "phone.fill": "phone",
  "money.fill": "money",
  "calendar.fill": "calendar",
  "location.fill": "location",
  "link.fill": "link",
  "link.slash.fill": "link-slash",
  "grade.star": "grade",
  "stars.fill": "stars",
  "star.half": "star",
  "star.border": "star-border",
  "whatshot.fill": "whatshot",
  "flag.fill": "flag",
  "pencil.circle.fill": "edit",
  "shopping.cart": "shopping-cart",
} as unknown as Partial<
  Record<
    import("expo-symbols").SymbolViewProps["name"],
    React.ComponentProps<typeof MaterialIcons>["name"]
  >
>;

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SFSymbols on iOS, and MaterialIcons on Android and web. This ensures a consistent look across platforms, and optimal resource usage.
 *
 * Icon `name`s are based on SFSymbols and require manual mapping to MaterialIcons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  className,
}: {
  name: IconSymbolName;
  size?: number;
  color?: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
  className?: string;
}) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name]}
      style={style as StyleProp<TextStyle>}
      className={className}
    />
  );
}
