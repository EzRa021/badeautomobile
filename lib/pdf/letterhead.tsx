import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { BRAND } from "./fonts";

// A4 in points: 595.28 x 841.89
export const COLORS = {
  ink: "#1a1d21",
  muted: "#3f434a",
  line: "#111111",
  faint: "#8a8f98",
};

export const styles = StyleSheet.create({
  page: {
    fontFamily: "Calibri",
    fontSize: 12,
    color: COLORS.ink,
    lineHeight: 1.3,
    paddingTop: 120, // clear the printed letterhead band
    paddingBottom: 54,
    paddingHorizontal: 54,
  },
  bg: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 595.28,
    height: 841.89,
  },
  bold: { fontFamily: "Calibri", fontWeight: "bold" },
  right: { textAlign: "right" },
  center: { textAlign: "center" },
  signatureWrap: { marginTop: 22 },
  signatureImg: { width: 92, height: 36, objectFit: "contain" },
});

/** A page with the exact company letterhead + watermark as the background. */
export function BasePage({
  children,
  paddingHorizontal,
  paddingTop,
}: {
  children: React.ReactNode;
  paddingHorizontal?: number;
  paddingTop?: number;
}) {
  return (
    <Page
      size="A4"
      style={[
        styles.page,
        paddingHorizontal != null ? { paddingHorizontal } : {},
        paddingTop != null ? { paddingTop } : {},
      ]}
    >
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image src={BRAND.letterhead} style={styles.bg} fixed />
      {children}
    </Page>
  );
}

/** Signature image + "For: Bade Automobile Ltd" line. */
export function Signature({
  prefix = "For: ",
  name = "Bade Automobile Ltd",
  thanks,
}: {
  prefix?: string;
  name?: string;
  thanks?: string;
}) {
  return (
    <View style={styles.signatureWrap}>
      {thanks && <Text style={{ marginBottom: 6 }}>{thanks}</Text>}
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image src={BRAND.signature} style={styles.signatureImg} />
      <Text style={{ marginTop: 2 }}>
        {prefix}
        <Text style={styles.bold}>{name}</Text>
      </Text>
    </View>
  );
}
