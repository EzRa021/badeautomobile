import { Document, View, Text, StyleSheet } from "@react-pdf/renderer";
import { BasePage, Signature, COLORS } from "@/lib/pdf/letterhead";
import { formatAmount } from "@/lib/utils/money";
import { formatLongOrdinalDate } from "@/lib/utils/dates";
import type { QuotationWithItems } from "@/lib/types";

const MIN_ROWS = 18;

// Column widths as flex-basis percentages (from measured template geometry).
const COL_BASE = { sn: "8%", desc: "46%", qty: "11%", rate: "17.5%", amount: "17.5%" } as const;

// With a per-item DISCOUNT column the same table is re-divided; every column keeps
// the template's look, only the widths change. Quotations with no item discount
// never see this and print exactly as the original template.
const COL_DISC = { sn: "5.5%", desc: "32%", qty: "10%", rate: "17%", disc: "17%", amount: "18.5%" } as const;

const bold = { fontFamily: "Calibri", fontWeight: "bold" } as const;

const s = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  ref: { fontSize: 13, ...bold },
  date: { fontSize: 13, ...bold },
  customer: { fontSize: 13, marginTop: 8, ...bold },
  custAddr: { fontSize: 13, ...bold },
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
    backgroundColor: "#D9DEE7",
    paddingVertical: 2,
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

const num = (v: number | string | null | undefined) => Number(v ?? 0) || 0;

/** "10" for 10, "7.5" for 7.5 — no trailing zeros on a percentage. */
const pctLabel = (v: number | string | null | undefined) => `${Number(num(v).toFixed(2))}%`;

const MINUS = "-";

export function QuotationPdf({ doc }: { doc: QuotationWithItems }) {
  const hasItemDiscount = doc.items.some((it) => num(it.discount_amount) > 0);
  const overallDiscount = num(doc.discount_amount);
  const hasOverall = overallDiscount > 0;

  const itemDiscountTotal = doc.items.reduce((sum, it) => sum + num(it.discount_amount), 0);

  // Sub-total + discount rows are extra table rows; take them out of the padding
  // so the TOTAL row stays pinned where the template has it.
  const extraRows = hasOverall ? 2 : 0;
  const emptyCount = Math.max(0, MIN_ROWS - doc.items.length - extraRows);

  const W = hasItemDiscount ? COL_DISC : { ...COL_BASE, disc: "0%" };
  const blankCells = () => (
    <>
      <Cell w={W.sn}> </Cell>
      <Cell w={W.desc}> </Cell>
      <Cell w={W.qty}> </Cell>
      <Cell w={W.rate}> </Cell>
      {hasItemDiscount && <Cell w={W.disc}> </Cell>}
      <Cell w={W.amount}> </Cell>
    </>
  );

  /** A summary row: label under DESCRIPTION, figures under DISCOUNT / AMOUNT. */
  const summaryRow = (
    key: string,
    label: string,
    amount: string,
    opts: { discountCol?: string; regular?: boolean } = {},
  ) => {
    const strong = opts.regular ? {} : bold;
    return (
      <View style={s.row} key={key}>
        <View style={[s.cell, { width: W.sn }]}><Text> </Text></View>
        <View style={[s.cell, { width: W.desc }]}><Text style={bold}>{label}</Text></View>
        <View style={[s.cell, { width: W.qty }]}><Text> </Text></View>
        <View style={[s.cell, { width: W.rate }]}><Text> </Text></View>
        {hasItemDiscount && (
          <View style={[s.cell, { width: W.disc }]}>
            <Text style={[s.right, bold]}>{opts.discountCol ?? " "}</Text>
          </View>
        )}
        <View style={[s.cell, { width: W.amount }]}>
          <Text style={[s.right, strong]}>{amount}</Text>
        </View>
      </View>
    );
  };

  // The column totals sit on the first summary row: SUB-TOTAL when an overall
  // discount follows, otherwise TOTAL itself.
  const columnTotals = hasItemDiscount ? formatAmount(itemDiscountTotal) : undefined;

  return (
    <Document title={`Quotation ${doc.ref_no}`} author="Bade Automobile Ltd">
      <BasePage paddingHorizontal={66}>
        <View style={s.headerRow}>
          <Text style={s.ref}>Our Ref: {doc.ref_no}</Text>
          <Text style={s.date}>{formatLongOrdinalDate(doc.quote_date)}</Text>
        </View>
        <Text style={s.customer}>{doc.customer_name}</Text>
        {doc.customer_address
          ? doc.customer_address
              .split("\n")
              .filter(
                (l) =>
                  l.trim() &&
                  l.trim().toUpperCase() !== doc.customer_name.trim().toUpperCase(),
              )
              .map((l, i) => (
                <Text key={i} style={s.custAddr}>{l}</Text>
              ))
          : null}

        <View style={s.table}>
          {/* Job title banner comes first */}
          {doc.job_title ? (
            <View style={s.row}>
              <Text style={s.banner}>{doc.job_title.toUpperCase()}</Text>
            </View>
          ) : null}

          {/* Header */}
          <View style={s.row}>
            <Cell w={W.sn} style={s.th}>S/N</Cell>
            <Cell w={W.desc} style={s.th}>DESCRIPTION</Cell>
            <Cell w={W.qty} style={s.th}>QTY</Cell>
            <Cell w={W.rate} style={s.th}>RATE (₦)</Cell>
            {hasItemDiscount && <Cell w={W.disc} style={s.th}>DISC. (₦)</Cell>}
            <Cell w={W.amount} style={s.th}>AMOUNT (₦)</Cell>
          </View>

          {/* Items — AMOUNT is the line net, after its discount */}
          {doc.items.map((it, i) => {
            const off = num(it.discount_amount);
            return (
              <View style={s.row} key={it.id}>
                <Cell w={W.sn} style={{ alignItems: "center" }}>{i + 1}</Cell>
                <Cell w={W.desc}>{it.description}</Cell>
                <Cell w={W.qty}>{`${formatAmount(it.qty).replace(/\.00$/, "")}${it.unit ? " " + it.unit : ""}`}</Cell>
                <View style={[s.cell, { width: W.rate }]}><Text style={s.right}>{it.rate != null ? formatAmount(it.rate) : ""}</Text></View>
                {hasItemDiscount && (
                  <View style={[s.cell, { width: W.disc }]}>
                    <Text style={s.right}>{off > 0 ? formatAmount(off) : " "}</Text>
                  </View>
                )}
                <View style={[s.cell, { width: W.amount }]}><Text style={s.right}>{formatAmount(it.amount)}</Text></View>
              </View>
            );
          })}

          {/* Padding rows */}
          {Array.from({ length: emptyCount }).map((_, i) => (
            <View style={s.row} key={`e${i}`}>{blankCells()}</View>
          ))}

          {/* Summary */}
          {hasOverall ? (
            <>
              {summaryRow("sub", "SUB-TOTAL", formatAmount(doc.subtotal), { discountCol: columnTotals })}
              {summaryRow(
                "disc",
                doc.discount_type === "percent" ? `DISCOUNT (${pctLabel(doc.discount_value)})` : "DISCOUNT",
                `${MINUS}${formatAmount(overallDiscount)}`,
                { regular: true },
              )}
              {summaryRow("total", "TOTAL", formatAmount(doc.total))}
            </>
          ) : (
            summaryRow("total", "TOTAL", formatAmount(doc.total), { discountCol: columnTotals })
          )}
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
