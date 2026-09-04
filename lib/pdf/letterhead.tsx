import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { BRAND } from "./fonts";

// A4 in points: 595.28 x 841.89
export const COLORS = {
  ink: "#1a1d21",
  muted: "#3f434a",
  line: "#111111",
  faint: "#8a8f98",
};

// The printed letterhead band occupies roughly the top 115pt of the page.
const LETTERHEAD_CLEARANCE = 80; // + page paddingTop (40) => content starts ~120

export const styles = StyleSheet.create({
  page: {
    fontFamily: "Calibri",
    fontSize: 12,
    color: COLORS.ink,
    lineHeight: 1.3,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 54,
  },
  bg: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 595.28,
    height: 841.89,
  },
  firstPageClear: { height: LETTERHEAD_CLEARANCE },
  bold: { fontFamily: "Calibri", fontWeight: "bold" },
  right: { textAlign: "right" },
  center: { textAlign: "center" },
  signatureWrap: { marginTop: 22 },
  signatureImg: { width: 92, height: 36, objectFit: "contain" },
});

/**
 * A page with the company letterhead + watermark as the background.
 * The letterhead is drawn on the FIRST page only; when content overflows onto
 * further pages they start near the top with no repeated letterhead.
 */
export function BasePage({
  children,
  paddingHorizontal,
}: {
  children: React.ReactNode;
  paddingHorizontal?: number;
}) {
  return (
    <Page
      size="A4"
      style={[styles.page, paddingHorizontal != null ? { paddingHorizontal } : {}]}
    >
      {/*
        Fixed wrapper (out of flow, so it never affects pagination) anchored to
        the page top-left. Its render draws the letterhead on page 1 only, so
        continuation pages get no letterhead.
      */}
      <View
        fixed
        style={styles.bg}
        render={({ pageNumber }) =>
          pageNumber === 1 ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={BRAND.letterhead} style={{ width: "100%", height: "100%" }} />
          ) : null
        }
      />
      {/* In-flow spacer clears the letterhead on page 1 only. */}
      <View style={styles.firstPageClear} />
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
