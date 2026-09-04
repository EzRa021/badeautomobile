import { Document, View, Text, StyleSheet } from "@react-pdf/renderer";
import { BasePage, Signature, COLORS } from "@/lib/pdf/letterhead";
import { formatAmount } from "@/lib/utils/money";
import { formatLongOrdinalDate } from "@/lib/utils/dates";
import type { QuotationWithItems } from "@/lib/types";

const MIN_ROWS = 18;

// Column widths as flex-basis percentages (from measured template geometry).
const COL = { sn: "8%", desc: "46%", qty: "11%", rate: "17.5%", amount: "17.5%" } as const;

const s = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  ref: { fontSize: 13 },
  date: { fontSize: 13 },
  customer: { fontSize: 13, marginTop: 8 },
  table: { marginTop: 14, borderTopWidth: 1, borderLeftWidth: 1, borderColor: COLORS.line },
  row: { flexDirection: "row" },
  cell: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.line,
    paddingVertical: 1.5,
    paddingHorizontal: 4,
    fontSize: 13,
    lineHeight: 1.1,
    justifyContent: "center",
  },
  th: { fontFamily: "Calibri", fontWeight: "bold", textAlign: "center", fontSize: 13, lineHeight: 1.05 },
  banner: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.line,
    paddingVertical: 1.5,
    paddingHorizontal: 6,
    fontFamily: "Calibri",
    fontWeight: "bold",
    fontSize: 13,
    lineHeight: 1.1,
    textAlign: "center",
    width: "100%",
  },
  words: { marginTop: 14, fontFamily: "Calibri", fontWeight: "bold", fontSize: 12 },
  thanks: { marginTop: 16, fontSize: 13 },
  right: { textAlign: "right" },
});

type ViewStyle = React.ComponentProps<typeof View>["style"];

function Cell({ w, children, style }: { w: string; children?: React.ReactNode; style?: ViewStyle }) {
  return <View style={[s.cell, { width: w }, style ?? {}]}><Text>{children}</Text></View>;
}

export function QuotationPdf({ doc }: { doc: QuotationWithItems }) {
  const emptyCount = Math.max(0, MIN_ROWS - doc.items.length);

  return (
    <Document title={`Quotation ${doc.ref_no}`} author="Bade Automobile Ltd">
      <BasePage paddingHorizontal={66}>
        <View style={s.headerRow}>
          <Text style={s.ref}>Our Ref: {doc.ref_no}</Text>
          <Text style={s.date}>{formatLongOrdinalDate(doc.quote_date)}</Text>
        </View>
        <Text style={s.customer}>{doc.customer_name}</Text>
        {doc.customer_address
          ? doc.customer_address.split("\n").map((l, i) => (
              <Text key={i} style={{ fontSize: 13 }}>{l}</Text>
            ))
          : null}

        <View style={s.table}>
          {/* Header */}
          <View style={s.row}>
            <Cell w={COL.sn} style={s.th}>S/N</Cell>
            <Cell w={COL.desc} style={s.th}>DESCRIPTION</Cell>
            <Cell w={COL.qty} style={s.th}>QTY</Cell>
            <View style={[s.cell, { width: COL.rate }]}><Text style={s.th}>{`RATE\n₦`}</Text></View>
            <View style={[s.cell, { width: COL.amount }]}><Text style={s.th}>{`AMOUNT\n₦`}</Text></View>
          </View>

          {/* Job title banner */}
          {doc.job_title ? (
            <View style={s.row}>
              <Text style={s.banner}>{doc.job_title.toUpperCase()}</Text>
            </View>
          ) : null}

          {/* Items */}
          {doc.items.map((it, i) => (
            <View style={s.row} key={it.id}>
              <Cell w={COL.sn} style={{ alignItems: "center" }}>{i + 1}</Cell>
              <Cell w={COL.desc}>{it.description}</Cell>
              <Cell w={COL.qty}>{`${formatAmount(it.qty).replace(/\.00$/, "")}${it.unit ? " " + it.unit : ""}`}</Cell>
              <View style={[s.cell, { width: COL.rate }]}><Text style={s.right}>{it.rate != null ? formatAmount(it.rate) : ""}</Text></View>
              <View style={[s.cell, { width: COL.amount }]}><Text style={s.right}>{formatAmount(it.amount)}</Text></View>
            </View>
          ))}

          {/* Padding rows */}
          {Array.from({ length: emptyCount }).map((_, i) => (
            <View style={s.row} key={`e${i}`}>
              <Cell w={COL.sn}> </Cell>
              <Cell w={COL.desc}> </Cell>
              <Cell w={COL.qty}> </Cell>
              <Cell w={COL.rate}> </Cell>
              <Cell w={COL.amount}> </Cell>
            </View>
          ))}

          {/* Total */}
          <View style={s.row}>
            <View style={[s.cell, { width: COL.sn }]}><Text> </Text></View>
            <View style={[s.cell, { width: COL.desc }]}><Text style={{ fontFamily: "Calibri", fontWeight: "bold" }}>TOTAL</Text></View>
            <View style={[s.cell, { width: COL.qty }]}><Text> </Text></View>
            <View style={[s.cell, { width: COL.rate }]}><Text> </Text></View>
            <View style={[s.cell, { width: COL.amount }]}>
              <Text style={[s.right, { fontFamily: "Calibri", fontWeight: "bold" }]}>{formatAmount(doc.total)}</Text>
            </View>
          </View>
        </View>

        {doc.amount_in_words ? (
          <Text style={s.words}>AMOUNT IN WORDS: {doc.amount_in_words}</Text>
        ) : null}

        <Text style={s.thanks}>Thank you.</Text>

        <Signature prefix="FOR: " name="BADE AUTOMOBILE LTD" />
      </BasePage>
    </Document>
  );
}
