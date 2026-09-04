import { Document, View, Text, StyleSheet } from "@react-pdf/renderer";
import { BasePage, Signature, COLORS } from "@/lib/pdf/letterhead";
import { formatAmount } from "@/lib/utils/money";
import { formatLongOrdinalDate, formatDocDate } from "@/lib/utils/dates";
import type { PurchaseOrderWithItems, CompanySettings } from "@/lib/types";

const b = { fontFamily: "Calibri", fontWeight: "bold" } as const;
const COL = { sn: "8%", desc: "46%", qty: "11%", unit: "17.5%", amount: "17.5%" } as const;

const s = StyleSheet.create({
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  title: { fontSize: 15, fontFamily: "Calibri", fontWeight: "bold" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  supplier: { fontSize: 12, marginTop: 8 },
  table: { marginTop: 12, borderTopWidth: 1, borderLeftWidth: 1, borderColor: COLORS.line },
  row: { flexDirection: "row" },
  cell: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.line,
    paddingVertical: 3,
    paddingHorizontal: 4,
    fontSize: 11.5,
    justifyContent: "center",
  },
  th: { fontFamily: "Calibri", fontWeight: "bold", textAlign: "center", fontSize: 12 },
  right: { textAlign: "right" },
  totals: { marginTop: 10, alignSelf: "flex-end", width: 240 },
  totalLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 1 },
  words: { marginTop: 12, fontSize: 12 },
});

type ViewStyle = React.ComponentProps<typeof View>["style"];

function Cell({ w, children, style }: { w: string; children?: React.ReactNode; style?: ViewStyle }) {
  return <View style={[s.cell, { width: w }, style ?? {}]}><Text>{children}</Text></View>;
}

export function PurchaseOrderPdf({
  doc,
}: {
  doc: PurchaseOrderWithItems;
  company?: CompanySettings | null;
}) {
  const showVat = doc.vat_total > 0;

  return (
    <Document title={`Purchase Order ${doc.po_no}`} author="Bade Automobile Ltd">
      <BasePage>
        <View style={s.titleRow}>
          <Text style={s.title}>PURCHASE ORDER</Text>
        </View>

        <View style={s.headerRow}>
          <Text style={{ fontSize: 12 }}><Text style={b}>PO No: </Text>{doc.po_no}</Text>
          <Text style={{ fontSize: 12 }}>{formatLongOrdinalDate(doc.po_date)}</Text>
        </View>

        <Text style={[s.supplier, b]}>To: {doc.supplier_name}</Text>
        {(doc.supplier_address ?? "").split("\n").filter(Boolean).map((l, i) => (
          <Text key={i} style={{ fontSize: 12 }}>{l}</Text>
        ))}
        {doc.deliver_to ? <Text style={{ fontSize: 11, marginTop: 4 }}><Text style={b}>Deliver to: </Text>{doc.deliver_to}</Text> : null}
        {doc.vehicle_ref ? <Text style={{ fontSize: 11 }}><Text style={b}>Vehicle / Job: </Text>{doc.vehicle_ref}</Text> : null}
        {doc.expected_date ? <Text style={{ fontSize: 11 }}><Text style={b}>Expected: </Text>{formatDocDate(doc.expected_date)}</Text> : null}

        <View style={s.table}>
          <View style={s.row}>
            <Cell w={COL.sn} style={s.th}>S/N</Cell>
            <Cell w={COL.desc} style={s.th}>DESCRIPTION</Cell>
            <Cell w={COL.qty} style={s.th}>QTY</Cell>
            <View style={[s.cell, { width: COL.unit }]}><Text style={s.th}>{`UNIT PRICE\n₦`}</Text></View>
            <View style={[s.cell, { width: COL.amount }]}><Text style={s.th}>{`AMOUNT\n₦`}</Text></View>
          </View>

          {doc.items.map((it, i) => (
            <View style={s.row} key={it.id}>
              <Cell w={COL.sn} style={{ alignItems: "center" }}>{i + 1}</Cell>
              <Cell w={COL.desc}>{it.description}</Cell>
              <Cell w={COL.qty}>{`${formatAmount(it.qty).replace(/\.00$/, "")}${it.unit ? " " + it.unit : ""}`}</Cell>
              <View style={[s.cell, { width: COL.unit }]}><Text style={s.right}>{formatAmount(it.unit_price)}</Text></View>
              <View style={[s.cell, { width: COL.amount }]}><Text style={s.right}>{formatAmount(it.amount)}</Text></View>
            </View>
          ))}
        </View>

        <View style={s.totals}>
          <View style={s.totalLine}>
            <Text>Subtotal</Text>
            <Text>₦{formatAmount(doc.subtotal)}</Text>
          </View>
          {showVat ? (
            <View style={s.totalLine}>
              <Text>VAT ({Number(doc.vat_rate)}%)</Text>
              <Text>₦{formatAmount(doc.vat_total)}</Text>
            </View>
          ) : null}
          <View style={[s.totalLine, { borderTopWidth: 1, borderColor: COLORS.line, marginTop: 2, paddingTop: 3 }]}>
            <Text style={b}>TOTAL</Text>
            <Text style={b}>₦{formatAmount(doc.total)}</Text>
          </View>
        </View>

        {doc.amount_in_words ? (
          <Text style={s.words}><Text style={b}>Amount in words: </Text>{doc.amount_in_words}</Text>
        ) : null}

        <Signature prefix="For: " name="Bade Automobile Ltd" />
      </BasePage>
    </Document>
  );
}
