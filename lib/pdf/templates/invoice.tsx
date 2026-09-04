import { Document, View, Text, StyleSheet } from "@react-pdf/renderer";
import { BasePage, Signature, COLORS } from "@/lib/pdf/letterhead";
import { formatAmount } from "@/lib/utils/money";
import { formatDocDate } from "@/lib/utils/dates";
import type { InvoiceWithItems, CompanySettings } from "@/lib/types";

const b = { fontFamily: "Calibri", fontWeight: "bold" } as const;

// Column x-offsets within the table (content coordinates; measured from the
// original INVOICE 2-2 template, page-x minus the 34pt left padding).
const X = {
  item: 7, // item no. "10."
  col2: 56, // code / "Net Price" / net value
  qty: 79, // quantity "1"
  vat: 118, // "VAT"
  tax: 154, // "Taxes" / "7.50%"
  desc: 182, // description
  unitL: 300,
  unitW: 113, // unit price, right-aligned to 413
  amtL: 430,
  amtW: 92, // amount ₦, right-aligned to 522
};
const BLOCK_H = 66;

const s = StyleSheet.create({
  head: { flexDirection: "row", marginBottom: 10 },
  nameBox: {
    width: 250,
    minHeight: 74,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 10,
    padding: 8,
    justifyContent: "center",
  },
  invBox: {
    width: 130,
    minHeight: 74,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 6,
  },
  tinBox: { flex: 1, paddingLeft: 14, paddingTop: 20 },
  leaderRow: { flexDirection: "row", alignItems: "flex-end" },
  leader: { flex: 1, borderBottomWidth: 1, borderBottomColor: COLORS.line, marginLeft: 2, paddingBottom: 1, fontSize: 12 },
  underline: { textDecoration: "underline" },

  table: { borderWidth: 1, borderColor: COLORS.line },
  header: { height: 42, borderBottomWidth: 1, borderColor: COLORS.line },
  hcell: { position: "absolute", fontFamily: "Calibri", fontWeight: "bold", fontSize: 11.5 },
  block: { height: BLOCK_H, borderBottomWidth: 1, borderColor: COLORS.line },
  cell: { position: "absolute", fontSize: 11.5 },
  amt: { position: "absolute", width: X.amtW, left: X.amtL, textAlign: "right", fontSize: 11.5 },
  unit: { position: "absolute", width: X.unitW, left: X.unitL, textAlign: "right", fontSize: 11.5 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", height: 26, paddingHorizontal: 6 },
  wordsBox: { borderWidth: 1, borderColor: COLORS.line, borderTopWidth: 0, paddingHorizontal: 6, paddingVertical: 5 },
});

function ItemBlock({
  item,
  index,
}: {
  item: InvoiceWithItems["items"][number];
  index: number;
}) {
  return (
    <View style={s.block}>
      {/* Row A: code · description · unit price · net amount */}
      <Text style={[s.cell, { left: X.col2, top: 2, color: COLORS.muted }]}>{item.item_code ?? ""}</Text>
      <Text style={[s.cell, { left: X.desc, top: 2, width: 190 }]}>{item.description}</Text>
      <Text style={[s.unit, { top: 2 }]}>{formatAmount(item.unit_price)}</Text>
      <Text style={[s.amt, { top: 2 }]}>{formatAmount(item.net_amount)}</Text>

      {/* Row B: item no · qty · VAT Taxes · vat amount */}
      <Text style={[s.cell, { left: X.item, top: 24 }]}>{(index + 1) * 10}.</Text>
      <Text style={[s.cell, { left: X.qty, top: 24 }]}>{formatAmount(item.qty).replace(/\.00$/, "")}</Text>
      <Text style={[s.cell, { left: X.vat, top: 24 }]}>VAT</Text>
      <Text style={[s.cell, b, { left: X.tax, top: 24 }]}>Taxes</Text>
      <Text style={[s.amt, { top: 24 }]}>{formatAmount(item.vat_amount)}</Text>

      {/* Row C: Net Price · rate% */}
      <Text style={[s.cell, b, { left: X.col2, top: 38 }]}>Net Price</Text>
      <Text style={[s.cell, { left: X.tax, top: 38 }]}>{Number(item.vat_rate).toFixed(2)}%</Text>

      {/* Row D: net value · gross (bold) */}
      <Text style={[s.cell, { left: X.col2, top: 53 }]}>{formatAmount(item.net_amount)}</Text>
      <Text style={[s.amt, b, { top: 53 }]}>{formatAmount(item.gross_amount)}</Text>
    </View>
  );
}

export function InvoicePdf({
  doc,
  company,
}: {
  doc: InvoiceWithItems;
  company: CompanySettings | null;
}) {
  const tin = company?.tin ?? "20724729-001";
  const addr = (doc.customer_address ?? "").split("\n");

  return (
    <Document title={`Invoice ${doc.invoice_no}`} author="Bade Automobile Ltd">
      <BasePage paddingHorizontal={34}>
        {/* Header: Name/Address box · Invoice box · TIN/PO */}
        <View style={s.head}>
          <View style={s.nameBox}>
            <View style={s.leaderRow}>
              <Text style={{ fontSize: 12 }}>Name: </Text>
              <Text style={[s.leader, { textAlign: "center" }]}>{doc.customer_name}</Text>
            </View>
            <View style={[s.leaderRow, { marginTop: 8 }]}>
              <Text style={{ fontSize: 12 }}>Address: </Text>
              <Text style={[s.leader, { textAlign: "center" }]}>{addr[0] ?? ""}</Text>
            </View>
            <View style={[s.leaderRow, { marginTop: 8 }]}>
              <Text style={[s.leader, { textAlign: "center" }]}>{addr[1] ?? ""}</Text>
            </View>
          </View>

          <View style={s.invBox}>
            <Text style={[b, s.underline, { fontSize: 12 }]}>Invoice</Text>
            <Text style={[b, { fontSize: 18, marginTop: 1 }]}>Nº {doc.invoice_no}</Text>
            <Text style={{ fontSize: 10, color: COLORS.muted }}>Customer&apos;s Number</Text>
            <View style={[s.leaderRow, { marginTop: 4 }]}>
              <Text style={{ fontSize: 11 }}>Date: </Text>
              <Text style={[s.leader, { fontSize: 11 }]}>{formatDocDate(doc.invoice_date)}</Text>
            </View>
          </View>

          <View style={s.tinBox}>
            <Text style={{ fontSize: 12 }}>
              <Text style={b}>TIN NO: </Text>
              {tin}
            </Text>
            <Text style={{ fontSize: 12, marginTop: 10 }}>
              <Text style={b}>P.O NO: </Text>
              {doc.po_no ?? ""}
            </Text>
          </View>
        </View>

        {/* Items table */}
        <View style={s.table}>
          <View style={s.header}>
            <Text style={[s.hcell, { left: 452, top: 3, width: 80, textAlign: "center" }]}>Amount</Text>
            <Text style={[s.hcell, { left: X.item, top: 18 }]}>Item</Text>
            <Text style={[s.hcell, { left: 52, top: 18 }]}>Quantity</Text>
            <Text style={[s.hcell, { left: X.desc, top: 18 }]}>Description</Text>
            <Text style={[s.hcell, { left: 362, top: 18 }]}>Unit Price</Text>
            <Text style={[s.hcell, { left: 459, top: 18 }]}>₦</Text>
            <Text style={[s.hcell, { left: 516, top: 18 }]}>K</Text>
          </View>

          {doc.items.map((it, i) => (
            <ItemBlock key={it.id} item={it} index={i} />
          ))}

          <View style={s.totalRow}>
            <Text style={[b, { fontSize: 14 }]}>TOTAL INCLUDING TAX</Text>
            <Text style={[b, { fontSize: 14 }]}>{formatAmount(doc.total)}</Text>
          </View>
        </View>

        <Text style={{ marginTop: 3, marginLeft: 30, fontSize: 12 }}>
          Thank you for Patronage please call again.
        </Text>

        {doc.amount_in_words ? (
          <View style={[s.wordsBox, { marginTop: 8, borderTopWidth: 1 }]}>
            <Text style={{ fontSize: 12 }}>
              Amount In Word: <Text style={b}>{doc.amount_in_words}</Text>
            </Text>
          </View>
        ) : null}

        <Signature prefix="For: " name="Bade Automobile Ltd" />
      </BasePage>
    </Document>
  );
}
