import { Document, View, Text, StyleSheet } from "@react-pdf/renderer";
import { BasePage, Signature, COLORS } from "@/lib/pdf/letterhead";
import { formatAmount } from "@/lib/utils/money";
import { formatDocDate } from "@/lib/utils/dates";
import type { InvoiceWithItems, CompanySettings } from "@/lib/types";

const b = { fontFamily: "Calibri", fontWeight: "bold" } as const;

const s = StyleSheet.create({
  head: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  nameBox: {
    flex: 1.5,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 10,
    padding: 8,
    minHeight: 66,
  },
  invBox: {
    width: 130,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 6,
  },
  tinBox: { width: 130, paddingTop: 6 },
  label: { fontSize: 11, color: COLORS.muted },
  table: { marginTop: 14, borderWidth: 1, borderColor: COLORS.line },
  theadRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: COLORS.line,
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  block: { borderBottomWidth: 1, borderColor: COLORS.line, paddingVertical: 4, paddingHorizontal: 4 },
  line: { flexDirection: "row", alignItems: "flex-end", fontSize: 11.5, minHeight: 14 },
  right: { textAlign: "right" },
  total: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingHorizontal: 4,
  },
});

// Column widths (points) within the ~527pt content area.
const W = { item: 34, qty: 40, unit: 84, amt: 84 };

function Money({ children, w, bold }: { children: React.ReactNode; w: number; bold?: boolean }) {
  return (
    <Text style={[{ width: w }, s.right, bold ? b : {}]}>{children}</Text>
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

  return (
    <Document title={`Invoice ${doc.invoice_no}`} author="Bade Automobile Ltd">
      <BasePage paddingHorizontal={34}>
        {/* Header row: Name/Address box · Invoice box · TIN/PO */}
        <View style={s.head}>
          <View style={s.nameBox}>
            <Text><Text style={b}>Name: </Text>{doc.customer_name}</Text>
            <Text style={{ marginTop: 4 }}><Text style={b}>Address: </Text></Text>
            {(doc.customer_address ?? "").split("\n").map((l, i) => (
              <Text key={i}>{l}</Text>
            ))}
          </View>

          <View style={s.invBox}>
            <Text style={b}>Invoice</Text>
            <Text style={[b, { fontSize: 18, marginTop: 2 }]}>№ {doc.invoice_no}</Text>
            <Text style={[s.label, { marginTop: 2 }]}>{"Customer's Number"}</Text>
            <Text style={{ marginTop: 4 }}>Date: {formatDocDate(doc.invoice_date)}</Text>
          </View>

          <View style={s.tinBox}>
            <Text><Text style={b}>TIN NO: </Text>{tin}</Text>
            <Text style={{ marginTop: 6 }}><Text style={b}>P.O NO: </Text>{doc.po_no ?? ""}</Text>
            {doc.customer_number ? (
              <Text style={{ marginTop: 6 }}><Text style={b}>Cust. No: </Text>{doc.customer_number}</Text>
            ) : null}
          </View>
        </View>

        {/* Items table */}
        <View style={s.table}>
          <View style={s.theadRow}>
            <Text style={[b, { width: W.item }]}>Item</Text>
            <Text style={[b, { width: W.qty }]}>Qty</Text>
            <Text style={[b, { flex: 1 }]}>Description</Text>
            <Text style={[b, { width: W.unit }, s.right]}>Unit Price</Text>
            <Text style={[b, { width: W.amt }, s.right]}>Amount ₦</Text>
          </View>

          {doc.items.map((it, i) => (
            <View style={s.block} key={it.id}>
              {/* Line 1: code · description · unit price · net */}
              <View style={s.line}>
                <Text style={{ width: W.item }}> </Text>
                <Text style={{ width: W.qty }}> </Text>
                <Text style={{ flex: 1 }}>
                  {it.item_code ? <Text style={{ color: COLORS.muted }}>{it.item_code}  </Text> : null}
                  {it.description}
                </Text>
                <Money w={W.unit}>{formatAmount(it.unit_price)}</Money>
                <Money w={W.amt}>{formatAmount(it.net_amount)}</Money>
              </View>
              {/* Line 2: item# · qty · VAT Taxes · vat amount */}
              <View style={s.line}>
                <Text style={{ width: W.item }}>{(i + 1) * 10}.</Text>
                <Text style={{ width: W.qty }}>{formatAmount(it.qty).replace(/\.00$/, "")}</Text>
                <Text style={{ flex: 1 }}>VAT <Text style={b}>Taxes</Text></Text>
                <Text style={{ width: W.unit }}> </Text>
                <Money w={W.amt}>{formatAmount(it.vat_amount)}</Money>
              </View>
              {/* Line 3: Net Price · rate% */}
              <View style={s.line}>
                <Text style={b}>Net Price</Text>
                <Text style={{ marginLeft: 10 }}>{Number(it.vat_rate).toFixed(2)}%</Text>
              </View>
              {/* Line 4: net value · gross (bold) */}
              <View style={s.line}>
                <Text style={{ flex: 1 }}>{formatAmount(it.net_amount)}</Text>
                <Money w={W.amt} bold>{formatAmount(it.gross_amount)}</Money>
              </View>
            </View>
          ))}
        </View>

        {/* Total incl. tax */}
        <View style={s.total}>
          <Text style={[b, { fontSize: 14 }]}>TOTAL INCLUDING TAX</Text>
          <Text style={[b, { fontSize: 14 }]}>{formatAmount(doc.total)}</Text>
        </View>

        <Text style={{ marginTop: 4, fontSize: 12 }}>Thank you for Patronage please call again.</Text>

        {doc.amount_in_words ? (
          <Text style={{ marginTop: 12, fontSize: 12 }}>
            Amount In Word: <Text style={b}>{doc.amount_in_words}</Text>
          </Text>
        ) : null}

        <Signature prefix="For: " name="Bade Automobile Ltd" />
      </BasePage>
    </Document>
  );
}
