import { Document, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { BasePage, COLORS } from "@/lib/pdf/letterhead";
import { BRAND } from "@/lib/pdf/fonts";
import { formatAmount } from "@/lib/utils/money";
import { formatDocDate } from "@/lib/utils/dates";
import type { InvoiceWithItems, CompanySettings } from "@/lib/types";

const b = { fontFamily: "Calibri", fontWeight: "bold" } as const;
const qtyText = (q: number | string) => formatAmount(q).replace(/\.00$/, "");

const s = StyleSheet.create({
  // ---- header ----
  head: { flexDirection: "row", alignItems: "flex-start", marginTop: 14 },
  nameBox: {
    width: 258,
    minHeight: 78,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  invBox: {
    width: 132,
    minHeight: 78,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 8,
  },
  tinBox: { flex: 1, paddingLeft: 16, paddingTop: 18 },
  leaderRow: { flexDirection: "row", alignItems: "flex-end" },
  label: { fontSize: 11.5 },
  leader: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    marginLeft: 2,
    paddingBottom: 1,
    textAlign: "center",
    fontSize: 12,
  },
  underline: { textDecoration: "underline" },

  // ---- table ----
  table: { marginTop: 10, borderWidth: 1, borderColor: COLORS.line },
  header: { borderBottomWidth: 1, borderColor: COLORS.line, paddingTop: 2, paddingBottom: 4 },
  row: { flexDirection: "row", alignItems: "flex-start" },
  cItem: { width: 50 },
  cMid: { width: 132 },
  cDesc: { flex: 1 },
  cUnit: { width: 80, textAlign: "center", fontSize: 12, lineHeight: 1.05 },
  cAmt: { width: 92, textAlign: "right", paddingRight: 5, fontSize: 12, lineHeight: 1.05 },

  th: { fontFamily: "Calibri", fontWeight: "bold", fontSize: 11.5 },
  block: { borderBottomWidth: 1, borderColor: COLORS.line, paddingTop: 2, paddingBottom: 3 },
  code: { textAlign: "center", fontSize: 11.5, color: COLORS.muted, lineHeight: 1.05 },
  desc: { paddingLeft: 28, paddingRight: 4, fontSize: 12, lineHeight: 1.1 },
  bt: { fontSize: 12, lineHeight: 1.05 },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },

  thanks: { marginTop: 3, marginLeft: 30, fontSize: 12 },
  wordsBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  sigBox: {
    marginTop: 10,
    width: 470,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 8,
    justifyContent: "center",
    paddingLeft: 40,
  },
  sigImg: { width: 96, height: 38, objectFit: "contain" },
});

function ItemBlock({
  item,
  index,
}: {
  item: InvoiceWithItems["items"][number];
  index: number;
}) {
  const rate = Number(item.vat_rate).toFixed(2);
  return (
    <View style={s.block} wrap={false}>
      {/* Row 1: code · description · unit price · net amount */}
      <View style={s.row}>
        <View style={s.cItem} />
        <View style={s.cMid}>
          <Text style={s.code}>{item.item_code ?? ""}</Text>
        </View>
        <View style={s.cDesc}>
          <Text style={s.desc}>{item.description}</Text>
        </View>
        <Text style={s.cUnit}>{formatAmount(item.unit_price)}</Text>
        <Text style={s.cAmt}>{formatAmount(item.net_amount)}</Text>
      </View>

      {/* Row 2: item no · qty · VAT Taxes · vat amount */}
      <View style={[s.row, { marginTop: 4 }]}>
        <Text style={[s.cItem, s.bt, { paddingLeft: 7 }]}>{(index + 1) * 10}.</Text>
        <View style={[s.cMid, { flexDirection: "row" }]}>
          <Text style={[s.bt, { width: 68, textAlign: "center" }]}>{qtyText(item.qty)}</Text>
          <Text style={s.bt}>VAT </Text>
          <Text style={[b, s.bt]}>Taxes</Text>
        </View>
        <View style={s.cDesc} />
        <Text style={s.cUnit}> </Text>
        <Text style={s.cAmt}>{formatAmount(item.vat_amount)}</Text>
      </View>

      {/* Row 3: Net Price · rate% */}
      <View style={[s.row, { marginTop: 1 }]}>
        <View style={s.cItem} />
        <View style={[s.cMid, { flexDirection: "row" }]}>
          <Text style={[b, s.bt, { width: 106, paddingLeft: 11 }]}>Net Price</Text>
          <Text style={s.bt}>{rate}%</Text>
        </View>
        <View style={s.cDesc} />
        <Text style={s.cUnit}> </Text>
        <Text style={s.cAmt}> </Text>
      </View>

      {/* Row 4: net value · gross (bold) */}
      <View style={[s.row, { marginTop: 1 }]}>
        <View style={s.cItem} />
        <View style={s.cMid}>
          <Text style={{ paddingLeft: 6, fontSize: 11.5, lineHeight: 1.05 }}>{formatAmount(item.net_amount)}</Text>
        </View>
        <View style={s.cDesc} />
        <Text style={s.cUnit}> </Text>
        <Text style={[s.cAmt, b]}>{formatAmount(item.gross_amount)}</Text>
      </View>
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
              <Text style={s.label}>Name: </Text>
              <Text style={s.leader}>{doc.customer_name}</Text>
            </View>
            <View style={[s.leaderRow, { marginTop: 10 }]}>
              <Text style={s.label}>Address: </Text>
              <Text style={s.leader}>{addr[0] ?? ""}</Text>
            </View>
            <View style={[s.leaderRow, { marginTop: 10 }]}>
              <Text style={s.leader}>{addr[1] ?? ""}</Text>
            </View>
          </View>

          <View style={s.invBox}>
            <Text style={[b, s.underline, { fontSize: 12 }]}>Invoice</Text>
            <Text style={[b, { fontSize: 18, marginTop: 2 }]}>Nº {doc.invoice_no}</Text>
            <Text style={{ fontSize: 10, color: COLORS.muted, marginTop: 2 }}>
              Customer&apos;s Number
            </Text>
            <View style={[s.leaderRow, { marginTop: 6 }]}>
              <Text style={{ fontSize: 11 }}>Date: </Text>
              <Text style={[s.leader, { textAlign: "left", fontSize: 11 }]}>
                {formatDocDate(doc.invoice_date)}
              </Text>
            </View>
          </View>

          <View style={s.tinBox}>
            <Text style={{ fontSize: 12 }}>
              <Text style={b}>TIN NO: </Text>
              {tin}
            </Text>
            <Text style={{ fontSize: 12, marginTop: 12 }}>
              <Text style={b}>P.O NO: </Text>
              {doc.po_no ?? ""}
            </Text>
          </View>
        </View>

        {/* Items table */}
        <View style={s.table}>
          <View style={s.header} wrap={false}>
            <View style={s.row}>
              <View style={s.cItem} />
              <View style={s.cMid} />
              <View style={s.cDesc} />
              <Text style={{ width: 80 }}> </Text>
              <Text style={[s.th, { width: 92, textAlign: "center" }]}>Amount</Text>
            </View>
            <View style={[s.row, { marginTop: 2 }]}>
              <Text style={[s.th, { width: 50, paddingLeft: 6 }]}>Item</Text>
              <Text style={[s.th, { width: 132, textAlign: "center" }]}>Quantity</Text>
              <Text style={[s.th, { flex: 1, textAlign: "center" }]}>Description</Text>
              <Text style={[s.th, { width: 80, textAlign: "center" }]}>Unit Price</Text>
              <View style={{ width: 92, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 6 }}>
                <Text style={s.th}>₦</Text>
                <Text style={s.th}>K</Text>
              </View>
            </View>
          </View>

          {doc.items.map((it, i) => (
            <ItemBlock key={it.id} item={it} index={i} />
          ))}

          <View style={s.totalRow}>
            <Text style={[b, { fontSize: 14 }]}>TOTAL INCLUDING TAX</Text>
            <Text style={[b, { fontSize: 14 }]}>{formatAmount(doc.total)}</Text>
          </View>
        </View>

        <Text style={s.thanks}>Thank you for Patronage please call again.</Text>

        {doc.amount_in_words ? (
          <View style={s.wordsBox}>
            <Text style={{ fontSize: 12 }}>
              Amount In Word: <Text style={b}>{doc.amount_in_words}</Text>
            </Text>
          </View>
        ) : null}

        {/* Signature */}
        <View style={s.sigBox}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={BRAND.signature} style={s.sigImg} />
        </View>
        <Text style={{ marginTop: 3, fontSize: 12 }}>
          For: <Text style={b}>Bade Automobile Ltd</Text>
        </Text>
      </BasePage>
    </Document>
  );
}
