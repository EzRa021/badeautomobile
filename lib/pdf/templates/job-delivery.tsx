import { Document, View, Text, StyleSheet } from "@react-pdf/renderer";
import { BasePage, Signature, COLORS } from "@/lib/pdf/letterhead";
import { formatDocDate, formatDateTime } from "@/lib/utils/dates";
import type { JobDelivery, CompanySettings } from "@/lib/types";

const b = { fontFamily: "Calibri", fontWeight: "bold" } as const;

const s = StyleSheet.create({
  head: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  leftCol: { flex: 1, fontSize: 12 },
  rightCol: { width: 190 },
  poNo: { fontSize: 12, marginBottom: 4 },
  box: { borderWidth: 1, borderColor: COLORS.line },
  boxRow: { flexDirection: "row" },
  boxLabel: {
    width: 62,
    borderRightWidth: 1,
    borderColor: COLORS.line,
    padding: 4,
    fontSize: 11,
    color: COLORS.muted,
  },
  boxValue: { flex: 1, padding: 4, fontSize: 12 },
  tin: { textAlign: "right", marginTop: 6, fontSize: 12 },
  titleWrap: {
    alignSelf: "center",
    borderWidth: 1.4,
    borderColor: COLORS.line,
    borderRadius: 22,
    paddingVertical: 5,
    paddingHorizontal: 26,
    marginTop: 14,
    marginBottom: 14,
  },
  title: { fontSize: 18, fontFamily: "Calibri", fontWeight: "bold", textAlign: "center" },
  field: { marginTop: 9, fontSize: 12 },
  fieldRow: { flexDirection: "row", alignItems: "flex-end" },
  leader: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.faint,
    borderStyle: "dashed",
    marginLeft: 4,
    paddingBottom: 1,
  },
  handoverRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 8, fontSize: 12 },
  handoverLabel: { width: 190 },
});

/** A labelled field with the value sitting on a dotted leader line. */
function Field({ label, value, inline }: { label: string; value?: string | null; inline?: React.ReactNode }) {
  return (
    <View style={s.field}>
      <View style={s.fieldRow}>
        <Text>{label}</Text>
        <Text style={s.leader}>{inline ?? (value ?? "")}</Text>
      </View>
    </View>
  );
}

export function JobDeliveryPdf({
  doc,
  company,
}: {
  doc: JobDelivery;
  company: CompanySettings | null;
}) {
  const tin = company?.tin ?? "20724729-001";
  const addressLines = (doc.customer_address ?? "").split("\n");

  return (
    <Document title={`Job Delivery ${doc.jd_no}`} author="Bade Automobile Ltd">
      <BasePage>
        {/* Header */}
        <View style={s.head}>
          <View style={s.leftCol}>
            <Text><Text style={b}>TO: </Text>{doc.customer_name}</Text>
            {addressLines.map((l, i) => (
              <Text key={i}>{l}</Text>
            ))}
          </View>
          <View style={s.rightCol}>
            <Text style={s.poNo}><Text style={b}>PO No: </Text>{doc.po_no ?? ""}</Text>
            <View style={s.box}>
              <View style={[s.boxRow, { borderBottomWidth: 1, borderColor: COLORS.line }]}>
                <Text style={s.boxLabel}>Invoice No</Text>
                <Text style={s.boxValue}>{doc.jd_no}</Text>
              </View>
              <View style={s.boxRow}>
                <Text style={s.boxLabel}>Date</Text>
                <Text style={s.boxValue}>{formatDocDate(doc.delivery_date)}</Text>
              </View>
            </View>
            <Text style={s.tin}><Text style={b}>TIN NO: </Text>{tin}</Text>
          </View>
        </View>

        {/* Title */}
        <View style={s.titleWrap}>
          <Text style={s.title}>JOB DELIVERY REPORT</Text>
        </View>

        {/* Work description: "<work> has been carried out on <vehicle>" */}
        <Text style={{ fontSize: 12 }}>Work Description:</Text>
        <View style={[s.fieldRow, { marginTop: 4 }]}>
          <Text style={s.leader}>
            {doc.work_done ?? ""}
            {doc.vehicle ? `  has been carried out on  ${doc.vehicle}` : ""}
          </Text>
        </View>

        <Field label="Items Changed: " value={doc.items_changed} />
        <Field label="Note: " value={doc.note} />
        <Field label="Next Service: " value={doc.next_service} />
        <Field label="Accessories Found on Vehicle: " value={doc.accessories_found} />
        <Field label="Accessories Returned with Vehicle: " value={doc.accessories_returned} />

        {/* Handover block */}
        <View style={{ marginTop: 18 }}>
          {[
            { label: "Date In and Time:", value: doc.date_in ? formatDateTime(doc.date_in) : "" },
            { label: "Date Out and Time:", value: doc.date_out ? formatDateTime(doc.date_out) : "" },
            { label: "Driver's Name and Signature:", value: doc.driver_name ?? "" },
            { label: "Vehicle Coordinator Sign:", value: doc.coordinator_sign ?? "" },
            { label: "Engineering Inspector Sign:", value: doc.inspector_sign ?? "" },
          ].map((f, i) => (
            <View style={s.handoverRow} key={i}>
              <Text style={s.handoverLabel}>{f.label}</Text>
              <Text style={s.leader}>{f.value}</Text>
            </View>
          ))}
        </View>

        <Signature prefix="For: " name="Bade Automobile Ltd" thanks="Yours Faithfully" />
      </BasePage>
    </Document>
  );
}
